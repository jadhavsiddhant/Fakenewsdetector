// Public Firebase Configuration
// This file is safe to commit to GitHub (Firebase keys are meant to be public)
// OpenRouter API key is now secure on the backend server

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in app.js
window.firebaseConfig = firebaseConfig;
window.auth = auth;
window.db = db;

// Note: OpenRouter API calls now go through /api/verify-news endpoint
// No need to expose OPENROUTER_API_KEY in frontend anymore!
