const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const { Groq } = require('groq-sdk');
const { combineResults } = require('./fact-check-helpers');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'groq/compound';
const GOOGLE_FACT_CHECK_API_KEY = process.env.GOOGLE_FACT_CHECK_API_KEY;

// ===== DSA Enhancement: Hash Table Cache =====
class HashTableCache {
  constructor(maxSize = 100, ttlMs = 300000) { // 5 minute TTL
    this.cache = new Map(); // Hash table implementation
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }
  
  // Normalize claim for consistent caching
  normalizeKey(claim) {
    return claim.toLowerCase().trim().replace(/\s+/g, ' ');
  }
  
  // Get cached result
  get(claim) {
    const key = this.normalizeKey(claim);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    
    console.log('[CACHE HIT] Found cached result for:', key.substring(0, 50) + '...');
    return entry.data;
  }
  
  // Store result in cache
  set(claim, data) {
    const key = this.normalizeKey(claim);
    
    // Remove oldest entry if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    
    console.log('[CACHE SET] Stored result for:', key.substring(0, 50) + '...');
  }
  
  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs
    };
  }
}

// Initialize cache
const resultCache = new HashTableCache(100, 300000); // 100 entries, 5 min TTL

// Initialize Groq client with compound model headers
const groq = GROQ_API_KEY ? new Groq({ 
  apiKey: GROQ_API_KEY,
  defaultHeaders: {
    "Groq-Model-Version": "latest"
  }
}) : null;
const APP_TITLE = process.env.APP_TITLE || 'Fake News Detector';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

if (!GROQ_API_KEY) {
  console.error('[ERROR] GROQ_API_KEY is not set. Please add it to your .env file.');
} else {
  console.log('[INFO] Groq API key found, length:', GROQ_API_KEY.length);
  console.log('[INFO] Using model:', GROQ_MODEL);
}

if (!GOOGLE_FACT_CHECK_API_KEY) {
  console.warn('[WARN] GOOGLE_FACT_CHECK_API_KEY is not set. Fact-check database lookup will be disabled.');
}

app.use(express.json());

// Allow all origins for local development
app.use(cors({
  origin: true,
  credentials: true
}));

// Google Fact Check API integration
async function searchGoogleFactCheck(query) {
  if (!GOOGLE_FACT_CHECK_API_KEY) {
    return null;
  }

  try {
    const response = await axios.get('https://factchecktools.googleapis.com/v1alpha1/claims:search', {
      params: {
        query: query,
        key: GOOGLE_FACT_CHECK_API_KEY,
        languageCode: 'en'
      },
      timeout: 10000 // 10 second timeout
    });

    const claims = response.data.claims || [];
    
    if (claims.length === 0) {
      return null;
    }

    // Process and return the most relevant fact-check results
    return claims.slice(0, 3).map(claim => ({
      text: claim.text,
      claimant: claim.claimant,
      claimDate: claim.claimDate,
      claimReview: claim.claimReview ? claim.claimReview.map(review => ({
        publisher: review.publisher?.name || 'Unknown',
        url: review.url,
        title: review.title,
        reviewDate: review.reviewDate,
        textualRating: review.textualRating,
        languageCode: review.languageCode
      })) : []
    }));
  } catch (error) {
    console.error('[ERROR] Google Fact Check API:', error.response?.data || error.message);
    return null;
  }
}

app.post('/api/verify-news', async (req, res) => {
  try {
    const { claim } = req.body;

    if (!claim || typeof claim !== 'string' || !claim.trim()) {
      return res.status(400).json({ error: 'Claim is required.' });
    }

    // DSA: Check cache first using hash table
    const cachedResult = resultCache.get(claim);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    console.log('[INFO] Starting fact-check for:', claim.substring(0, 100) + '...');

    // Run both in parallel for speed
    const [googleFactCheck, aiAnalysis] = await Promise.allSettled([
      searchGoogleFactCheck(claim),
      groq ? getGroqAnalysisWithSearch(claim, null) : Promise.resolve(null)
    ]);

    const googleResult = googleFactCheck.status === 'fulfilled' ? googleFactCheck.value : null;
    const aiResult = aiAnalysis.status === 'fulfilled' ? aiAnalysis.value : null;

    // Log failures for debugging
    if (googleFactCheck.status === 'rejected') {
      console.error('[ERROR] Google Fact Check failed:', googleFactCheck.reason?.message);
    }
    if (aiAnalysis.status === 'rejected') {
      console.error('[ERROR] AI Analysis failed:', aiAnalysis.reason?.message);
    }

    // Combine results
    const hybridResult = combineResults(claim, googleResult, aiResult);
    
    // DSA: Store result in cache using hash table
    resultCache.set(claim, hybridResult);
    
    console.log('[INFO] Result generated:', {
      hasAIData: !!aiResult,
      hasGoogleData: !!googleResult,
      finalLabel: hybridResult.label,
      confidence: hybridResult.confidence,
      cacheStats: resultCache.getStats()
    });

    return res.json(hybridResult);
  } catch (error) {
    console.error('[ERROR] verify-news:', error.message);
    return res.status(500).json({ error: 'Unexpected server error.' });
  }
});

// Ultra-fast AI analysis (no web search, minimal processing)
async function getUltraFastGroqAnalysis(claim) {
  if (!groq) {
    throw new Error('Groq API key not available');
  }

  const fastPrompt = `You are an expert fact-checker. Analyze this claim: "${claim}"

INSTRUCTIONS:
- Use your training knowledge to assess credibility
- Be decisive - avoid "uncertain" unless truly ambiguous
- Look for clear signs of misinformation or verify against known facts
- Provide confident assessment based on your knowledge

Respond with JSON only:
{
  "label": "real" or "fake" or "uncertain",
  "confidence": 0.0 to 1.0,
  "explanation": "Clear reasoning for your assessment",
  "sources": [{"title": "Analysis based on training data", "url": ""}]
}`;

  console.log('[DEBUG] Ultra-fast Groq request...');

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: fastPrompt }],
    model: GROQ_MODEL,
    temperature: 0.2, // Slightly more creative for better analysis
    max_completion_tokens: 800, // Increased for better reasoning
    top_p: 0.9,
    stream: false
    // NO web search tools for maximum speed
  });

  const aiResponse = chatCompletion.choices[0].message.content;
  console.log('[DEBUG] Ultra-fast response received');

  if (!aiResponse) {
    throw new Error('Invalid response from Groq AI');
  }

  return parseAiResponse(aiResponse);
}

// Basic fallback analysis when AI fails
function getBasicFallbackAnalysis(claim) {
  const { getDefaultSources } = require('./fact-check-helpers');
  
  // Enhanced heuristic analysis
  const fakeIndicators = ['shocking', 'unbelievable', 'doctors hate', 'secret', 'miracle', 'instant', 'this one trick', 'they don\'t want you to know'];
  const realIndicators = ['according to', 'study shows', 'research indicates', 'official statement', 'confirmed by'];
  
  const claimLower = claim.toLowerCase();
  const hasFakeIndicators = fakeIndicators.some(word => claimLower.includes(word));
  const hasRealIndicators = realIndicators.some(word => claimLower.includes(word));
  
  let label, confidence, explanation;
  
  if (hasFakeIndicators && !hasRealIndicators) {
    label = 'fake';
    confidence = 0.6;
    explanation = 'Contains common misinformation patterns and sensationalized language typically found in fake news.';
  } else if (hasRealIndicators && !hasFakeIndicators) {
    label = 'real';
    confidence = 0.5;
    explanation = 'Contains language patterns typically associated with legitimate news sources and factual reporting.';
  } else {
    label = 'uncertain';
    confidence = 0.4;
    explanation = 'Unable to determine credibility from basic analysis. Requires detailed fact-checking.';
  }
  
  return {
    label,
    confidence,
    explanation,
    sources: getDefaultSources().slice(0, 2)
  };
}

// Check if input is a URL
function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Groq AI Analysis with Web Search and Google Fact Check context
async function getGroqAnalysisWithSearch(claim, googleFactCheck) {
  if (!groq) {
    throw new Error('Groq API key not available');
  }

  const isURL = isValidURL(claim.trim());
  let prompt;

  if (isURL) {
    // URL Analysis prompt
    prompt = `Analyze this article: "${claim}"

Visit the website and respond JSON:
{"label": "real/fake/uncertain", "confidence": 0.0-1.0, "explanation": "article analysis with credibility assessment", "sources": [{"title": "source", "url": "url"}]}`;
  } else {
    // Text/Claim Analysis prompt  
    const truncatedClaim = claim.length > 200 ? claim.substring(0, 200) + '...' : claim;
    prompt = `Fact-check: "${truncatedClaim}"

Search web and respond JSON:
{"label": "real/fake/uncertain", "confidence": 0.0-1.0, "explanation": "brief reason", "sources": [{"title": "source", "url": "url"}]}`;
  }

  console.log(`[DEBUG] Sending request to Groq (${isURL ? 'URL' : 'TEXT'} mode)...`);

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    model: GROQ_MODEL,
    temperature: 0.3,
    max_completion_tokens: 400, // Reduced to prevent 413 error
    top_p: 1,
    stream: false,
    compound_custom: {
      tools: {
        enabled_tools: [
          "web_search",
          "visit_website"
        ]
      }
    }
  });

  const aiResponse = chatCompletion.choices[0].message.content;
  console.log('[DEBUG] Groq response received:', aiResponse?.substring(0, 200) + '...');

  if (!aiResponse) {
    throw new Error('Invalid response from Groq AI');
  }

  return parseAiResponse(aiResponse);
}

// Serve static files only for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  express.static(path.join(__dirname, '.'))(req, res, next);
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Fake News Detector backend listening on port ${PORT}`);
});

function parseAiResponse(aiResponse) {
  let result = null;

  // Strategy 1: Try parsing the entire response as JSON (DeepSeek often returns pure JSON)
  try {
    result = JSON.parse(aiResponse.trim());
    if (result.label && result.confidence !== undefined) {
      return normalizeResult(result);
    }
  } catch (e) {
    // Continue to other strategies
  }

  // Strategy 2: Parse JSON code block
  const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      result = JSON.parse(codeBlockMatch[1]);
      return normalizeResult(result);
    } catch (e) {
      // continue trying other strategies
    }
  }

  // Strategy 3: find last JSON object containing required keys
  const targetedMatches = aiResponse.match(/\{[^{}]*"label"[^{}]*"confidence"[^{}]*"explanation"[^{}]*\}/g);
  if (targetedMatches && targetedMatches.length > 0) {
    for (let i = targetedMatches.length - 1; i >= 0; i--) {
      try {
        result = JSON.parse(targetedMatches[i]);
        return normalizeResult(result);
      } catch (e) {
        continue;
      }
    }
  }

  // Strategy 4: any JSON object
  const allMatches = aiResponse.match(/\{[\s\S]*?\}/g);
  if (allMatches) {
    for (let i = allMatches.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(allMatches[i]);
        if (parsed.label && parsed.confidence !== undefined) {
          return normalizeResult(parsed);
        }
      } catch (e) {
        continue;
      }
    }
  }

  throw new Error('Failed to parse AI response into structured result.');
}

function normalizeResult(rawResult) {
  const { getDefaultSources } = require('./fact-check-helpers');
  
  return {
    label: rawResult.label === 'real' ? 'real' : rawResult.label === 'fake' ? 'fake' : 'uncertain',
    confidence: Math.max(0, Math.min(1, parseFloat(rawResult.confidence) || 0.5)),
    explanation: rawResult.explanation || 'Unable to generate explanation.',
    sources: Array.isArray(rawResult.sources) && rawResult.sources.length > 0
      ? rawResult.sources.slice(0, 5)
      : getDefaultSources().slice(0, 2)
  };
}
