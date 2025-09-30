// Firebase Configuration
// This file is SAFE to commit to GitHub (Firebase keys are meant to be public)
const firebaseConfig = {
    apiKey: "AIzaSyAZUtTqSjAldWJ8lvmNmwlbq53KBh163ks",
    authDomain: "newsdetector-5374e.firebaseapp.com",
    projectId: "newsdetector-5374e",
    storageBucket: "newsdetector-5374e.firebasestorage.app",
    messagingSenderId: "858189740575",
    appId: "1:858189740575:web:a4e8cb5d3c8122f93fb32a",
    measurementId: "G-0CLQCD4PPZ"
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
