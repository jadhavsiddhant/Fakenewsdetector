// ===== Initialize Firebase =====
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== Global State =====
let currentUser = null;
let historyExpanded = false;

// ===== DSA Enhancement: Sliding Window Rate Limiter =====
class SlidingWindowRateLimiter {
    constructor(maxRequests = 5, windowSizeMs = 60000) { // 5 requests per minute
        this.maxRequests = maxRequests;
        this.windowSizeMs = windowSizeMs;
        this.requests = []; // Array to store request timestamps
    }
    
    // Check if request is allowed using sliding window technique
    isAllowed() {
        const now = Date.now();
        
        // Remove old requests outside the window (sliding window cleanup)
        while (this.requests.length > 0 && now - this.requests[0] > this.windowSizeMs) {
            this.requests.shift(); // Remove from front of array
        }
        
        // Check if we're under the limit
        if (this.requests.length < this.maxRequests) {
            this.requests.push(now); // Add current request timestamp
            return true;
        }
        
        return false; // Rate limit exceeded
    }
    
    // Get time until next request is allowed
    getWaitTime() {
        if (this.requests.length === 0) return 0;
        const oldestRequest = this.requests[0];
        const waitTime = this.windowSizeMs - (Date.now() - oldestRequest);
        return Math.max(0, waitTime);
    }
}

// Initialize rate limiter
const rateLimiter = new SlidingWindowRateLimiter(5, 60000); // 5 requests per minute

// ===== DOM Elements =====
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');

// Auth elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authTabs = document.querySelectorAll('.auth-tab');
const loginBtn = document.getElementById('loginBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const googleSignupBtn = document.getElementById('googleSignupBtn');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// Main app elements
const newsInput = document.getElementById('newsInput');
const checkNewsBtn = document.getElementById('checkNewsBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const inputModeText = document.getElementById('inputModeText');
const inputHint = document.getElementById('inputHint');
const inputModeIndicator = document.querySelector('.input-mode-indicator');
const inputHintContainer = document.querySelector('.input-hint');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const checkAnotherBtn = document.getElementById('checkAnotherBtn');

// API base URL (frontend -> backend proxy)
const API_BASE_URL = 'http://localhost:3000';

// ===== URL Detection Functions =====

// Check if input is a URL
function isValidURL(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Update UI based on input type
function updateInputMode(input) {
    const isURL = isValidURL(input.trim());
    
    if (isURL) {
        inputModeIndicator.classList.add('url-mode');
        inputModeText.textContent = '🌐 URL Mode';
        inputHintContainer.classList.add('url-detected');
        inputHint.textContent = '✅ URL detected - Will analyze full article content';
        checkNewsBtn.querySelector('.btn-text').textContent = 'Analyze Article';
    } else {
        inputModeIndicator.classList.remove('url-mode');
        inputModeText.textContent = '📝 Text Mode';
        inputHintContainer.classList.remove('url-detected');
        inputHint.textContent = '💡 Tip: Paste any URL to analyze the full article';
        checkNewsBtn.querySelector('.btn-text').textContent = 'Check News';
    }
}

// Add input listener for real-time URL detection
if (newsInput) {
    newsInput.addEventListener('input', (e) => {
        updateInputMode(e.target.value);
    });
}

// ===== Authentication Functions =====

// Tab switching
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Update active tab
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding form
        if (targetTab === 'login') {
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
        } else {
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
        }
        
        // Clear errors
        hideError(loginError);
        hideError(signupError);
    });
});

// Email/Password Login
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showError(loginError, 'Please enter both email and password');
        return;
    }
    
    try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
        
        await auth.signInWithEmailAndPassword(email, password);
        // User will be redirected by onAuthStateChanged
    } catch (error) {
        showError(loginError, getAuthErrorMessage(error.code));
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
});

// Email/Password Signup
signupBtn.addEventListener('click', async () => {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupPasswordConfirm').value;
    
    if (!email || !password || !confirmPassword) {
        showError(signupError, 'Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        showError(signupError, 'Password must be at least 6 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        showError(signupError, 'Passwords do not match');
        return;
    }
    
    try {
        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating account...';
        
        await auth.createUserWithEmailAndPassword(email, password);
        // User will be redirected by onAuthStateChanged
    } catch (error) {
        showError(signupError, getAuthErrorMessage(error.code));
        signupBtn.disabled = false;
        signupBtn.textContent = 'Create Account';
    }
});

// Google Sign-in
const handleGoogleSignIn = async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        // User will be redirected by onAuthStateChanged
    } catch (error) {
        if (error.code === 'auth/popup-blocked') {
            // Fallback to redirect method
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithRedirect(provider);
        } else {
            showError(loginError, getAuthErrorMessage(error.code));
            showError(signupError, getAuthErrorMessage(error.code));
        }
    }
};

googleLoginBtn.addEventListener('click', handleGoogleSignIn);
googleSignupBtn.addEventListener('click', handleGoogleSignIn);

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Auth state observer
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        userEmail.textContent = user.email;
        authSection.style.display = 'none';
        appSection.style.display = 'block';
        loadUserHistory();
    } else {
        currentUser = null;
        authSection.style.display = 'flex';
        appSection.style.display = 'none';
    }
});

// ===== Enhanced UI Animation Functions =====

// Typing effect for text
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Enhanced loading animation with steps
function showEnhancedLoading(isURL = false) {
    loadingSection.style.display = 'block';
    
    // Update loading text based on mode
    const loadingText = document.querySelector('.loading-text');
    if (isURL) {
        loadingText.textContent = 'Visiting website and analyzing content...';
    } else {
        loadingText.textContent = 'Detector is analyzing your claim...';
    }
    
    // Update step text for URL mode
    const steps = document.querySelectorAll('.step');
    if (isURL) {
        steps[0].textContent = 'Visiting website';
        steps[1].textContent = 'Reading article content';
        steps[2].textContent = 'Analyzing credibility';
    } else {
        steps[0].textContent = 'Processing text';
        steps[1].textContent = 'Cross-referencing sources';
        steps[2].textContent = 'Generating analysis';
    }
    
    let currentStep = 0;
    const stepInterval = setInterval(() => {
        if (currentStep > 0) {
            steps[currentStep - 1].classList.remove('active');
        }
        
        if (currentStep < steps.length) {
            steps[currentStep].classList.add('active');
            currentStep++;
        } else {
            clearInterval(stepInterval);
        }
    }, 2000);
}

function hideEnhancedLoading() {
    const steps = document.querySelectorAll('.step');
    steps[2].classList.remove('active');
    steps[2].classList.add('completed');
    
    setTimeout(() => {
        loadingSection.style.display = 'none';
        // Reset for next time
        steps.forEach(step => {
            step.classList.remove('active', 'completed');
        });
    }, 1000);
}

// ===== News Verification Functions =====

checkNewsBtn.addEventListener('click', async () => {
    const claim = newsInput.value.trim();
    if (!claim) {
        alert('Please enter a news claim to verify');
        return;
    }
    
    // DSA: Check rate limit using sliding window
    if (!rateLimiter.isAllowed()) {
        const waitTime = Math.ceil(rateLimiter.getWaitTime() / 1000);
        alert(`⏰ Rate limit exceeded! Please wait ${waitTime} seconds before making another request.`);
        return;
    }
    
    // Show enhanced loading with animation steps
    const isURL = isValidURL(claim.trim());
    showEnhancedLoading(isURL);
    resultsSection.style.display = 'none';
    newsInput.disabled = true;
    checkNewsBtn.disabled = true;
    
    try {
        // Call OpenRouter API
        const result = await verifyNewsWithAI(claim);
        
        // Display results
        displayResults(result);
        
        // Save to Firestore
        await saveToHistory(claim, result);
        
        // Reload history
        await loadUserHistory();
        
    } catch (error) {
        console.error('Verification error:', error);
        
        // Show user-friendly error message
        if (error.message.includes('429') || error.message.includes('rate-limited')) {
            alert('⚠️ The free AI model is temporarily rate-limited. Using backup analysis method...');
        } else if (error.message.includes('401')) {
            alert('⚠️ API key issue. Using backup analysis method...');
        } else {
            alert('⚠️ AI service unavailable. Using backup analysis method...');
        }
        
        // Fallback to heuristic
        const fallbackResult = verifyNewsHeuristic(claim);
        displayResults(fallbackResult);
        await saveToHistory(claim, fallbackResult);
        await loadUserHistory();
    } finally {
        hideEnhancedLoading();
        newsInput.disabled = false;
        checkNewsBtn.disabled = false;
    }
});

// Verify news using backend proxy
async function verifyNewsWithAI(claim) {
    console.log('Calling backend AI proxy...');

    const response = await fetch(`${API_BASE_URL}/api/verify-news`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ claim })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`;
        try {
            const errorText = await response.text();
            console.error('API Error Text:', errorText);
            
            // Try to parse as JSON
            try {
                const errorData = JSON.parse(errorText);
                errorMessage += errorData.error ? ` - ${errorData.error}` : ` - ${errorText}`;
                console.error('API Error Data:', errorData);
            } catch (jsonError) {
                errorMessage += ` - ${errorText}`;
            }
        } catch (readError) {
            console.error('Failed to read error response:', readError);
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('AI Result:', data);
    return data;
}

// ===== DSA Enhancement: Graph-based Keyword Analysis =====
class KeywordGraph {
    constructor() {
        this.graph = new Map(); // Adjacency list representation
        this.buildGraph();
    }
    
    // Build keyword graph with topic connections
    buildGraph() {
        // Define topic categories and their keywords
        const topics = {
            'sensational': ['shocking', 'unbelievable', 'mind-blowing', 'miracle', 'secret'],
            'clickbait': ['you won\'t believe', 'this one trick', 'doctors hate', 'number 7 will shock you'],
            'urgency': ['breaking', 'urgent', 'immediate', 'now', 'alert'],
            'scientific': ['study shows', 'research', 'peer-reviewed', 'published in', 'data'],
            'official': ['according to', 'reported', 'official', 'confirmed', 'experts say'],
            'evidence': ['statistics', 'analysis shows', 'evidence suggests', 'findings indicate']
        };
        
        // Create nodes and edges
        Object.entries(topics).forEach(([topic, keywords]) => {
            keywords.forEach(keyword => {
                if (!this.graph.has(keyword)) {
                    this.graph.set(keyword, { topic, weight: 0, connections: [] });
                }
                
                // Connect keywords within same topic
                keywords.forEach(otherKeyword => {
                    if (keyword !== otherKeyword) {
                        this.graph.get(keyword).connections.push(otherKeyword);
                    }
                });
            });
        });
    }
    
    // BFS traversal to calculate topic scores
    analyzeText(text) {
        const lowerText = text.toLowerCase();
        const topicScores = {
            'sensational': 0, 'clickbait': 0, 'urgency': 0,
            'scientific': 0, 'official': 0, 'evidence': 0
        };
        const visited = new Set();
        const foundKeywords = [];
        
        // Find initial keywords in text
        for (let [keyword, node] of this.graph) {
            if (lowerText.includes(keyword)) {
                foundKeywords.push(keyword);
                this.bfsTraversal(keyword, topicScores, visited, lowerText);
            }
        }
        
        return { topicScores, foundKeywords };
    }
    
    // BFS to explore connected keywords
    bfsTraversal(startKeyword, topicScores, visited, text) {
        const queue = [startKeyword];
        visited.add(startKeyword);
        
        while (queue.length > 0) {
            const currentKeyword = queue.shift();
            const node = this.graph.get(currentKeyword);
            
            if (node && text.includes(currentKeyword)) {
                topicScores[node.topic] += 1;
                
                // Add connected keywords to queue
                node.connections.forEach(connectedKeyword => {
                    if (!visited.has(connectedKeyword)) {
                        visited.add(connectedKeyword);
                        queue.push(connectedKeyword);
                    }
                });
            }
        }
    }
}

// Initialize keyword graph
const keywordGraph = new KeywordGraph();

// Fallback heuristic verification (enhanced with graph analysis)
function verifyNewsHeuristic(claim) {
    const lowerClaim = claim.toLowerCase();
    
    // DSA: Use graph traversal for keyword analysis
    const graphAnalysis = keywordGraph.analyzeText(claim);
    const { topicScores, foundKeywords } = graphAnalysis;
    
    // Calculate fake vs real scores using graph results
    const fakeTopics = ['sensational', 'clickbait', 'urgency'];
    const realTopics = ['scientific', 'official', 'evidence'];
    
    let fakeScore = fakeTopics.reduce((sum, topic) => sum + topicScores[topic], 0);
    let realScore = realTopics.reduce((sum, topic) => sum + topicScores[topic], 0);
    
    const isFake = fakeScore > realScore;
    const confidence = Math.min(0.75, 0.35 + (Math.abs(fakeScore - realScore) * 0.15));
    
    let explanation = `⚠️ AI analysis unavailable - using graph-based keyword analysis. `;
    
    // Enhanced explanation using graph analysis
    if (fakeScore > 0 && realScore > 0) {
        explanation += `Graph analysis detected mixed signals: ${fakeScore} fake indicators and ${realScore} credible indicators. `;
    } else if (fakeScore > 0) {
        explanation += `Graph traversal found ${fakeScore} sensational/clickbait patterns suggesting potential misinformation. `;
    } else if (realScore > 0) {
        explanation += `Graph analysis identified ${realScore} scientific/official language patterns suggesting credible reporting. `;
    } else {
        explanation += `Graph traversal found no strong indicators in connected keyword network. `;
    }
    
    if (foundKeywords.length > 0) {
        explanation += `Keywords detected: ${foundKeywords.slice(0, 3).join(', ')}. `;
    }
    
    explanation += `This uses BFS graph traversal with limited accuracy. Please verify with trusted fact-checking sources.`;
    
    return {
        label: isFake ? 'fake' : 'real',
        confidence: confidence,
        explanation: explanation,
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
            },
            {
                title: 'Reuters Fact Check',
                url: 'https://www.reuters.com/fact-check'
            }
        ]
    };
}

// Enhanced display results in UI
function displayResults(result) {
    const badge = document.getElementById('resultBadge');
    const confidence = document.getElementById('resultConfidence');
    const confidenceProgress = document.getElementById('confidenceProgress');
    const explanation = document.getElementById('resultExplanation');
    const sourcesList = document.getElementById('sourcesList');
    
    // Set badge with enhanced text
    badge.className = `result-badge ${result.label}`;
    if (result.label === 'real') {
        badge.innerHTML = '✓ Likely True';
    } else if (result.label === 'fake') {
        badge.innerHTML = '✗ Likely False';
    } else {
        badge.innerHTML = '❓ Uncertain';
    }
    
    // Animate confidence meter
    const confidencePercent = Math.round(result.confidence * 100);
    confidence.textContent = `${confidencePercent}%`;
    
    // Animate progress bar
    setTimeout(() => {
        confidenceProgress.style.width = `${confidencePercent}%`;
        
        // Add the correct CSS class based on result label
        confidenceProgress.className = `confidence-progress ${result.label}`;
    }, 100);
    
    // Set explanation with typing effect
    explanation.textContent = '';
    typeWriter(explanation, result.explanation, 30);
    
    // Set sources
    sourcesList.innerHTML = '';
    if (result.sources && result.sources.length > 0) {
        result.sources.forEach(source => {
            const sourceLink = document.createElement('a');
            sourceLink.className = 'source-link';
            sourceLink.href = source.url || '#';
            sourceLink.target = '_blank';
            sourceLink.rel = 'noopener noreferrer';
            sourceLink.textContent = source.title || 'Source';
            sourcesList.appendChild(sourceLink);
        });
    } else {
        sourcesList.innerHTML = '<p style="color: var(--text-light); font-size: 14px;">No sources available</p>';
    }
    
    // Show results section with enhanced animation
    resultsSection.style.display = 'block';
    
    // Add entrance animation
    resultsSection.style.opacity = '0';
    resultsSection.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        resultsSection.style.transition = 'all 0.6s ease';
        resultsSection.style.opacity = '1';
        resultsSection.style.transform = 'translateY(0)';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Check another news
checkAnotherBtn.addEventListener('click', () => {
    newsInput.value = '';
    resultsSection.style.display = 'none';
    newsInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== Firestore History Functions =====

async function saveToHistory(claim, result) {
    if (!currentUser) return;
    
    try {
        await db.collection('users').doc(currentUser.uid).collection('history').add({
            claim: claim,
            label: result.label,
            confidence: result.confidence,
            explanation: result.explanation,
            sources: result.sources,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

async function loadUserHistory() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collection('users')
            .doc(currentUser.uid)
            .collection('history')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();
        
        if (snapshot.empty) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <p>No history yet</p>
                    <p style="font-size: 12px;">Your fact-checks will appear here</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const historyItem = createHistoryItem(data);
            historyList.appendChild(historyItem);
        });
        
    } catch (error) {
        console.error('Error loading history:', error);
        historyList.innerHTML = `
            <div class="empty-history">
                <p>Error loading history</p>
            </div>
        `;
    }
}

function createHistoryItem(data) {
    const item = document.createElement('div');
    item.className = 'history-item';
    
    const timestamp = data.timestamp ? data.timestamp.toDate() : new Date();
    const timeString = formatTimestamp(timestamp);
    const confidencePercent = Math.round(data.confidence * 100);
    
    item.innerHTML = `
        <div class="history-item-header">
            <div class="history-claim">${escapeHtml(data.claim)}</div>
            <span class="history-badge ${data.label}">${data.label === 'real' ? 'Real' : 'Fake'}</span>
        </div>
        <div class="history-timestamp">${timeString}</div>
        <div class="history-item-details">
            <p class="history-explanation">${escapeHtml(data.explanation)}</p>
            <p class="history-confidence">Confidence: ${confidencePercent}%</p>
        </div>
    `;
    
    // Toggle details on click
    item.addEventListener('click', () => {
        item.classList.toggle('expanded');
    });
    
    return item;
}

// Toggle history visibility
toggleHistoryBtn.addEventListener('click', () => {
    historyExpanded = !historyExpanded;
    const icon = document.getElementById('historyToggleIcon');
    
    if (historyExpanded) {
        historyList.style.display = 'block';
        icon.textContent = '▲';
    } else {
        historyList.style.display = 'none';
        icon.textContent = '▼';
    }
});

// ===== Utility Functions =====

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function hideError(element) {
    element.textContent = '';
    element.classList.remove('show');
}

function getAuthErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
        'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
        'auth/user-disabled': 'This account has been disabled. Please contact support.',
        'auth/user-not-found': 'No account found with this email. Please sign up first.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
        'auth/cancelled-popup-request': 'Only one popup request is allowed at a time.',
        'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

function formatTimestamp(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Keyboard Shortcuts =====

newsInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        checkNewsBtn.click();
    }
});

// ===== Initialize =====

// Set initial history state
historyList.style.display = 'none';
document.getElementById('historyToggleIcon').textContent = '▼';

console.log('Fake News Detector initialized successfully!');
