// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Fake News Detector...');

    // Check if Firebase is loaded
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded. Check if config.js is included in index.html');
        return;
    }

    // Initialize the app
    initializeApp();
});

function initializeApp() {
    console.log('Initializing app...');

    // Global state
    let currentUser = null;
    let userHistory = [];

    // DOM Elements
    const authModal = document.getElementById('authModal');
    const app = document.getElementById('app');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const googleSignupBtn = document.getElementById('googleSignupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmailSpan = document.getElementById('userEmail');
    const newsInput = document.getElementById('newsInput');
    const checkBtn = document.getElementById('checkBtn');
    const loadingState = document.getElementById('loadingState');
    const resultContainer = document.getElementById('resultContainer');
    const historyContainer = document.getElementById('historyContainer');
    const sampleChips = document.querySelectorAll('.sample-chip');

    // Check if all required elements exist
    if (!authModal || !app || !loginForm || !signupForm || !googleLoginBtn || !googleSignupBtn ||
        !logoutBtn || !userEmailSpan || !newsInput || !checkBtn || !loadingState ||
        !resultContainer || !historyContainer) {
        console.error('Some required DOM elements not found. Check your HTML file.');
        return;
    }

    console.log('All DOM elements found, continuing initialization...');

    // Utility Functions
    function sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.classList.add('show');
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }

    function formatDate(timestamp) {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    function calculateCredibilityScore(confidence, label) {
        // Convert confidence to a 1-10 scale
        // For "real" news, higher confidence = higher score
        // For "fake" news, higher confidence = lower score
        if (label === 'real') {
            return Math.round(confidence * 10);
        } else {
            return Math.round((1 - confidence) * 10);
        }
    }

// Auth Functions
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Update active tab
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding form
        loginForm.classList.remove('active');
        signupForm.classList.remove('active');
        
        if (targetTab === 'login') {
            loginForm.classList.add('active');
        } else {
            signupForm.classList.add('active');
        }
    });
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        showError('loginError', error.message);
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupPasswordConfirm').value;
    
    if (password !== confirmPassword) {
        showError('signupError', 'Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showError('signupError', 'Password must be at least 6 characters');
        return;
    }
    
    try {
        await auth.createUserWithEmailAndPassword(email, password);
    } catch (error) {
        showError('signupError', error.message);
    }
});

async function handleGoogleAuth() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Add scopes for better user info
    provider.addScope('email');
    provider.addScope('profile');
    
    // Disable buttons to prevent multiple clicks
    googleLoginBtn.disabled = true;
    googleSignupBtn.disabled = true;
    const originalLoginText = googleLoginBtn.innerHTML;
    const originalSignupText = googleSignupBtn.innerHTML;
    googleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    googleSignupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    
    try {
        // Try popup authentication first
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error('Google Auth Error:', error);
        
        // Handle specific error cases
        let errorMessage = 'Google sign-in failed. ';
        
        switch (error.code) {
            case 'auth/popup-blocked':
                errorMessage = 'Popup blocked! Please allow popups for this site, or trying redirect method...';
                showError('loginError', errorMessage);
                // Fallback to redirect
                try {
                    await auth.signInWithRedirect(provider);
                    return; // Don't re-enable buttons, redirect will reload page
                } catch (redirectError) {
                    console.error('Redirect also failed:', redirectError);
                    errorMessage = 'Sign-in failed. Please allow popups or check your browser settings.';
                }
                break;
            case 'auth/popup-closed-by-user':
                errorMessage = 'Sign-in cancelled. Please try again and complete the Google sign-in process.';
                break;
            case 'auth/unauthorized-domain':
                errorMessage = 'This domain is not authorized for Google sign-in. Please add this domain to Firebase authorized domains.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Google sign-in is not enabled. Please enable it in Firebase Console.';
                break;
            case 'auth/cancelled-popup-request':
                errorMessage = 'Another sign-in is already in progress. Please wait.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection and try again.';
                break;
            default:
                errorMessage += error.message;
        }
        
        showError('loginError', errorMessage);
    } finally {
        // Re-enable buttons
        googleLoginBtn.disabled = false;
        googleSignupBtn.disabled = false;
        googleLoginBtn.innerHTML = originalLoginText;
        googleSignupBtn.innerHTML = originalSignupText;
    }
}

// Handle redirect result (for when popup is blocked)
auth.getRedirectResult().then((result) => {
    if (result.user) {
        console.log('Successfully signed in via redirect:', result.user.email);
    }
}).catch((error) => {
    if (error.code && error.code !== 'auth/popup-closed-by-user') {
        console.error('Redirect result error:', error);
        showError('loginError', 'Google sign-in failed: ' + error.message);
    }
});

googleLoginBtn.addEventListener('click', handleGoogleAuth);
googleSignupBtn.addEventListener('click', handleGoogleAuth);

logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Auth State Observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        authModal.classList.add('hidden');
        app.classList.remove('hidden');
        userEmailSpan.textContent = user.email;
        await loadUserHistory();
    } else {
        currentUser = null;
        authModal.classList.remove('hidden');
        app.classList.add('hidden');
        userHistory = [];
    }
});

// News Verification Functions
async function verifyNewsWithAI(claim) {
    try {
        // Call our secure backend API instead of OpenRouter directly
        const API_ENDPOINT = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/verify-news'
            : '/api/verify-news'; // Use relative path for deployed version
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ claim })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }

        const result = await response.json();
        
        // Result is already validated by the backend
        return result;
        
    } catch (error) {
        console.error('AI Verification Error:', error);
        // Return a fallback response with heuristic
        return {
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
        };
    }
}

function displayResult(claim, result) {
    try {
        console.log('Displaying result:', result);
        
        const { label, confidence, explanation, reasoning, sources } = result;
        const credibilityScore = calculateCredibilityScore(confidence, label);
        
        // Update badge
        const badge = document.getElementById('resultBadge');
        badge.className = `result-badge ${label}`;
        badge.innerHTML = label === 'real' 
            ? '<i class="fas fa-check-circle"></i> Likely Real'
            : '<i class="fas fa-times-circle"></i> Likely Fake';
        
        // Update metrics
        document.getElementById('confidenceValue').textContent = `${Math.round(confidence * 100)}%`;
        document.getElementById('credibilityValue').textContent = `${credibilityScore}/10`;
        
        // Update explanation (display under badge)
        const explanationElement = document.getElementById('resultExplanation');
        if (explanationElement) {
            explanationElement.textContent = explanation || reasoning || 'No explanation available.';
        } else {
            console.warn('resultExplanation element not found in DOM');
        }
        
        // Update claim
        document.getElementById('analyzedClaim').textContent = claim;
        
        // Update sources
        const sourcesList = document.getElementById('sourcesList');
        sourcesList.innerHTML = '';
        
        sources.forEach(source => {
            const sourceItem = document.createElement('div');
            sourceItem.className = 'source-item';
            sourceItem.innerHTML = `
                <a href="${sanitizeHTML(source.url)}" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt"></i>
                    ${sanitizeHTML(source.title)}
                </a>
                <div class="source-url">${sanitizeHTML(source.url)}</div>
            `;
            sourcesList.appendChild(sourceItem);
        });
        
        // Show result (this stops the loading animation)
        resultContainer.classList.remove('hidden');
        console.log('Result displayed successfully');
    } catch (error) {
        console.error('Error displaying result:', error);
        throw error;
    }
}

async function saveToHistory(claim, result) {
    if (!currentUser) return;
    
    const { label, confidence, explanation, reasoning, sources } = result;
    const credibilityScore = calculateCredibilityScore(confidence, label);
    
    try {
        await db.collection('users').doc(currentUser.uid).collection('history').add({
            claim: claim,
            label: label,
            confidence: confidence,
            credibilityScore: credibilityScore,
            explanation: explanation || reasoning,
            reasoning: reasoning,
            sources: sources,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await loadUserHistory();
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
            .limit(50)
            .get();
        
        userHistory = [];
        snapshot.forEach(doc => {
            userHistory.push({ id: doc.id, ...doc.data() });
        });
        
        displayHistory();
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function displayHistory() {
    if (userHistory.length === 0) {
        historyContainer.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-inbox"></i>
                <p>No verification history yet. Start by checking a news claim above!</p>
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = '';
    
    userHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${item.label}`;
        
        const badgeText = item.label === 'real' ? 'Likely Real' : 'Likely Fake';
        const badgeIcon = item.label === 'real' ? 'fa-check-circle' : 'fa-times-circle';
        
        historyItem.innerHTML = `
            <div class="history-header">
                <span class="history-badge ${item.label}">
                    <i class="fas ${badgeIcon}"></i> ${badgeText}
                </span>
                <span class="history-date">${formatDate(item.timestamp)}</span>
            </div>
            <div class="history-claim">${sanitizeHTML(item.claim)}</div>
            <div class="history-stats">
                <span><strong>Confidence:</strong> ${Math.round(item.confidence * 100)}%</span>
                <span><strong>Score:</strong> ${item.credibilityScore}/10</span>
            </div>
            <div class="history-details">
                ${item.explanation ? `
                    <div class="history-explanation">
                        <h4><i class="fas fa-info-circle"></i> Explanation:</h4>
                        <p>${sanitizeHTML(item.explanation)}</p>
                    </div>
                ` : ''}
                <div class="history-sources">
                    <h4><i class="fas fa-link"></i> Sources:</h4>
                    ${item.sources.map(source => `
                        <a href="${sanitizeHTML(source.url)}" target="_blank" rel="noopener noreferrer" class="history-source-link">
                            <i class="fas fa-external-link-alt"></i> ${sanitizeHTML(source.title)}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
        
        historyItem.addEventListener('click', () => {
            historyItem.classList.toggle('expanded');
        });
        
        historyContainer.appendChild(historyItem);
    });
}

// Event Listeners
checkBtn.addEventListener('click', async () => {
    const claim = newsInput.value.trim();
    
    if (!claim) {
        alert('Please enter a news claim to verify');
        return;
    }
    
    // Show loading state
    loadingState.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    checkBtn.disabled = true;
    
    try {
        console.log('Starting verification for claim:', claim);
        
        // Verify with AI
        const result = await verifyNewsWithAI(claim);
        console.log('Verification complete, result:', result);
        
        // Hide loading and re-enable button immediately after getting result
        loadingState.classList.add('hidden');
        checkBtn.disabled = false;
        console.log('Loading state hidden, button re-enabled');
        
        // Display result
        displayResult(claim, result);
        
        // Save to history (non-blocking for UI)
        saveToHistory(claim, result).catch(err => {
            console.error('Error saving to history:', err);
        });
        
    } catch (error) {
        console.error('Verification error:', error);
        loadingState.classList.add('hidden');
        checkBtn.disabled = false;
        alert('An error occurred while verifying the claim. Please try again.');
    }
});

    // Sample headlines
    sampleChips.forEach(chip => {
        chip.addEventListener('click', () => {
            newsInput.value = chip.dataset.sample;
            newsInput.focus();
        });
    });

    // Enter key to check
    newsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            checkBtn.click();
        }
    });

    // Initialize
    console.log('Fake News Detector initialized');
    console.log('Please configure your Firebase and OpenRouter API keys in config.js');
}
