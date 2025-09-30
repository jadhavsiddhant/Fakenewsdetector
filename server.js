// Simple Express server to proxy OpenRouter API calls
// This keeps your API key secure on the server side

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Proxy endpoint for OpenRouter API
app.post('/api/verify-news', async (req, res) => {
    try {
        const { claim } = req.body;

        if (!claim) {
            return res.status(400).json({ error: 'Claim is required' });
        }

        // Check if API key is configured
        if (!process.env.OPENROUTER_API_KEY) {
            return res.status(500).json({ 
                error: 'OpenRouter API key not configured on server' 
            });
        }

        const prompt = `You are a fact-checking AI assistant. Analyze the following news claim and determine if it's likely real or fake. Use web search to find supporting evidence.

News Claim: "${claim}"

Provide your response in the following JSON format ONLY (no additional text):
{
    "label": "real" or "fake",
    "confidence": 0.0 to 1.0,
    "explanation": "3-4 sentence summary explaining why this claim is likely true or false",
    "reasoning": "brief explanation",
    "sources": [
        {"title": "Source Title 1", "url": "https://example.com/article1"},
        {"title": "Source Title 2", "url": "https://example.com/article2"}
    ]
}

Important:
- Set label to "real" if the claim appears to be factual and supported by credible sources
- Set label to "fake" if the claim appears to be false, misleading, or unsupported
- Confidence should reflect how certain you are (0.0 = not confident, 1.0 = very confident)
- Explanation should be 3-4 clear sentences explaining your verdict with key evidence
- Include at least 2-3 credible sources with real URLs that support your analysis
- If you cannot verify the claim, set confidence to 0.5 and explain why in reasoning and explanation`;

        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                'X-Title': 'Fake News Detector'
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Extract JSON from response
        let jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from AI');
        }

        const result = JSON.parse(jsonMatch[0]);

        // Validate response structure
        if (!result.label || !result.confidence || !result.sources) {
            throw new Error('Incomplete response from AI');
        }

        // Ensure explanation exists
        if (!result.explanation && result.reasoning) {
            result.explanation = result.reasoning;
        } else if (!result.explanation) {
            result.explanation = `This claim has been analyzed with ${Math.round(result.confidence * 100)}% confidence. Further verification is recommended.`;
        }

        // Ensure sources is an array
        if (!Array.isArray(result.sources)) {
            result.sources = [];
        }

        // Add default sources if none provided
        if (result.sources.length === 0) {
            result.sources = [
                {
                    title: 'Manual verification recommended',
                    url: 'https://www.snopes.com'
                },
                {
                    title: 'Check FactCheck.org',
                    url: 'https://www.factcheck.org'
                }
            ];
        }

        res.json(result);

    } catch (error) {
        console.error('Verification error:', error);
        
        // Return fallback response
        res.json({
            label: 'fake',
            confidence: 0.5,
            explanation: `Unable to verify this claim automatically due to a technical error. We recommend manually checking this claim with trusted fact-checking sources. Exercise caution and verify through multiple credible sources before accepting this information as true.`,
            reasoning: `Unable to verify claim due to error: ${error.message}. Please check manually.`,
            sources: [
                {
                    title: 'Snopes - Fact Checking',
                    url: 'https://www.snopes.com'
                },
                {
                    title: 'FactCheck.org',
                    url: 'https://www.factcheck.org'
                },
                {
                    title: 'PolitiFact',
                    url: 'https://www.politifact.com'
                }
            ]
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/verify-news`);
    console.log(`🔒 API keys are secure on the server`);
});
