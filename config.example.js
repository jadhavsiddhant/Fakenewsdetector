// Firebase Configuration Template
// Copy this file to config.js and fill in your actual Firebase values
// This file is SAFE to commit to GitHub (Firebase keys are meant to be public)

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

// NOTE: OpenRouter API key is now secure on the backend server!
// It's stored in .env file and never exposed to the browser.
// The frontend calls /api/verify-news endpoint instead.
