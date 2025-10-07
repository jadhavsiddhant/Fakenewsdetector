// Helper functions for fact-checking logic

// ===== DSA Enhancement: Min-Heap for Fact-Check Prioritization =====
class MinHeap {
    constructor() {
        this.heap = [];
    }
    
    // Insert element with priority (lower number = higher priority)
    insert(element, priority) {
        const node = { element, priority };
        this.heap.push(node);
        this.bubbleUp(this.heap.length - 1);
    }
    
    // Remove and return highest priority element
    extractMin() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();
        
        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown(0);
        return min;
    }
    
    // Bubble up to maintain heap property
    bubbleUp(index) {
        if (index === 0) return;
        
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.heap[parentIndex].priority > this.heap[index].priority) {
            [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
            this.bubbleUp(parentIndex);
        }
    }
    
    // Bubble down to maintain heap property
    bubbleDown(index) {
        const leftChild = 2 * index + 1;
        const rightChild = 2 * index + 2;
        let smallest = index;
        
        if (leftChild < this.heap.length && 
            this.heap[leftChild].priority < this.heap[smallest].priority) {
            smallest = leftChild;
        }
        
        if (rightChild < this.heap.length && 
            this.heap[rightChild].priority < this.heap[smallest].priority) {
            smallest = rightChild;
        }
        
        if (smallest !== index) {
            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            this.bubbleDown(smallest);
        }
    }
    
    size() {
        return this.heap.length;
    }
}

// Combine Google Fact Check and AI results - AI uses Google data as context
function combineResults(claim, googleFactCheck, aiAnalysis) {
  // If we have AI analysis (which should include Google context), use it as primary
  if (aiAnalysis) {
    // Enhance AI result with Google context information
    let explanation = aiAnalysis.explanation;
    
    if (googleFactCheck && googleFactCheck.length > 0) {
      // Add note that Google Fact Check data was used as context
      explanation = `🔍🌐 AI Analysis with Web Search + Google Fact Check: ${explanation}`;
      
      // Combine sources from both AI and Google Fact Check
      const googleSources = extractGoogleSources(googleFactCheck);
      const combinedSources = [...(aiAnalysis.sources || []), ...googleSources].slice(0, 5);
      
      return {
        ...aiAnalysis,
        explanation,
        sources: combinedSources.length > 0 ? combinedSources : getDefaultSources()
      };
    } else {
      // AI analysis with web search only
      return {
        ...aiAnalysis,
        explanation: `🌐 AI Analysis with Web Search: ${explanation}`,
        sources: aiAnalysis.sources || getDefaultSources()
      };
    }
  }
  
  // If no AI analysis but we have Google data, process it standalone
  if (googleFactCheck && googleFactCheck.length > 0) {
    return processGoogleFactCheck(googleFactCheck);
  }
  
  // Fallback to heuristic analysis
  return getFallbackAnalysis(claim);
}

// Extract sources from Google Fact Check data
function extractGoogleSources(googleFactCheck) {
  const sources = [];
  
  googleFactCheck.forEach(factCheck => {
    if (factCheck.claimReview) {
      factCheck.claimReview.forEach(review => {
        if (review.url && review.publisher) {
          sources.push({
            title: `${review.publisher} - Fact Check`,
            url: review.url
          });
        }
      });
    }
  });
  
  return sources.slice(0, 3); // Limit to top 3 Google sources
}

// Process Google Fact Check results
function processGoogleFactCheck(googleFactCheck) {
  const ratings = [];
  const sources = [];
  
  // DSA: Use min-heap to prioritize fact-check reviews
  const reviewHeap = new MinHeap();
  
  console.log('[DEBUG] Processing Google Fact Check results:', googleFactCheck.length, 'claims found');
  
  googleFactCheck.forEach((factCheck, index) => {
    console.log(`[DEBUG] Claim ${index + 1}:`, factCheck.text);
    if (factCheck.claimReview) {
      factCheck.claimReview.forEach(review => {
        if (review.textualRating) {
          // Calculate priority: newer reviews get higher priority (lower number)
          const reviewDate = new Date(review.reviewDate || '2020-01-01');
          const daysSinceReview = Math.floor((Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
          const priority = daysSinceReview; // Lower = more recent = higher priority
          
          // Insert into heap for prioritization
          reviewHeap.insert({
            rating: review.textualRating.toLowerCase(),
            publisher: review.publisher,
            url: review.url || '#',
            reviewDate: review.reviewDate
          }, priority);
        }
      });
    }
  });
  
  // Extract prioritized reviews from heap
  while (reviewHeap.size() > 0) {
    const reviewNode = reviewHeap.extractMin();
    const review = reviewNode.element;
    
    ratings.push(review.rating);
    sources.push({
      title: `${review.publisher} - Fact Check`,
      url: review.url
    });
    console.log(`[DEBUG] Prioritized rating from ${review.publisher}:`, review.rating);
  }
  
  console.log('[DEBUG] All ratings found:', ratings);
  
  // Expanded keyword lists for better detection
  const fakeKeywords = [
    'false', 'fake', 'misleading', 'incorrect', 'debunked', 'pants on fire',
    'unsubstantiated', 'unproven', 'lacks evidence', 'no evidence', 'baseless',
    'conspiracy', 'hoax', 'myth', 'fabricated', 'distorted', 'exaggerated',
    'mostly false', 'partly false', 'half true', 'mixture', 'mixed'
  ];
  
  const trueKeywords = [
    'true', 'correct', 'accurate', 'verified', 'mostly true', 'largely true',
    'confirmed', 'substantiated', 'supported', 'factual', 'legitimate',
    'authentic', 'valid', 'real', 'genuine'
  ];
  
  let fakeCount = 0;
  let trueCount = 0;
  let matchedRatings = [];
  
  ratings.forEach(rating => {
    let matched = false;
    
    // Check for fake indicators
    for (let keyword of fakeKeywords) {
      if (rating.includes(keyword)) {
        fakeCount++;
        matchedRatings.push(`"${rating}" -> FAKE (matched: ${keyword})`);
        matched = true;
        break;
      }
    }
    
    // Check for true indicators (only if not already matched as fake)
    if (!matched) {
      for (let keyword of trueKeywords) {
        if (rating.includes(keyword)) {
          trueCount++;
          matchedRatings.push(`"${rating}" -> TRUE (matched: ${keyword})`);
          matched = true;
          break;
        }
      }
    }
    
    // If no match found, log it
    if (!matched) {
      matchedRatings.push(`"${rating}" -> UNMATCHED`);
    }
  });
  
  console.log('[DEBUG] Rating analysis:', matchedRatings);
  console.log('[DEBUG] Final counts - Fake:', fakeCount, 'True:', trueCount);
  
  let label, confidence, explanation;
  
  if (fakeCount > trueCount) {
    label = 'fake';
    confidence = Math.min(0.9, 0.6 + (fakeCount * 0.1));
    explanation = `🔍 Google Fact Check Database: Multiple fact-checkers have rated similar claims as false or misleading. Found ${fakeCount} negative rating(s) vs ${trueCount} positive rating(s). Ratings: ${ratings.join(', ')}`;
  } else if (trueCount > fakeCount) {
    label = 'real';
    confidence = Math.min(0.9, 0.6 + (trueCount * 0.1));
    explanation = `✅ Google Fact Check Database: Fact-checkers have verified similar claims as true or accurate. Found ${trueCount} positive rating(s) vs ${fakeCount} negative rating(s). Ratings: ${ratings.join(', ')}`;
  } else {
    label = 'uncertain';
    confidence = 0.5;
    explanation = `❓ Google Fact Check Database: Found mixed or inconclusive ratings from fact-checkers. Ratings found: ${ratings.join(', ')}. Manual verification recommended.`;
  }
  
  return {
    label,
    confidence,
    explanation,
    sources: sources.slice(0, 4).concat(getDefaultSources().slice(0, 2))
  };
}

// Combine Google Fact Check and AI analysis
function combineGoogleAndAI(claim, googleResult, aiResult) {
  // If both agree, increase confidence
  if (googleResult.label === aiResult.label) {
    return {
      label: googleResult.label,
      confidence: Math.min(0.95, (googleResult.confidence + aiResult.confidence) / 2 + 0.1),
      explanation: `🔍 Google Fact Check + 🤖 AI Analysis: Both sources agree. ${googleResult.explanation} The AI analysis also supports this conclusion.`,
      sources: [...googleResult.sources.slice(0, 3), ...aiResult.sources.slice(0, 2)]
    };
  }
  
  // If they disagree, show uncertainty but explain both perspectives
  return {
    label: 'uncertain',
    confidence: 0.4,
    explanation: `⚠️ Mixed Results: Google Fact Check suggests "${googleResult.label}" while AI analysis suggests "${aiResult.label}". This discrepancy indicates the claim needs careful manual verification.`,
    sources: [...googleResult.sources.slice(0, 2), ...aiResult.sources.slice(0, 2)]
  };
}

// Fallback analysis when no APIs are available
function getFallbackAnalysis(claim) {
  return {
    label: 'uncertain',
    confidence: 0.3,
    explanation: `⚠️ Limited Analysis: Both Google Fact Check API and AI analysis are currently unavailable. This claim requires manual verification using trusted fact-checking sources.`,
    sources: getDefaultSources()
  };
}

// Default fact-checking sources
function getDefaultSources() {
  return [
    { title: 'Snopes - Fact Checking', url: 'https://www.snopes.com' },
    { title: 'FactCheck.org', url: 'https://www.factcheck.org' },
    { title: 'PolitiFact', url: 'https://www.politifact.com' },
    { title: 'Reuters Fact Check', url: 'https://www.reuters.com/fact-check' },
    { title: 'AP Fact Check', url: 'https://apnews.com/hub/ap-fact-check' }
  ];
}

module.exports = {
  combineResults,
  processGoogleFactCheck,
  combineGoogleAndAI,
  getFallbackAnalysis,
  getDefaultSources,
  extractGoogleSources
};
