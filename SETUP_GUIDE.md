# 📋 Detailed Setup Guide

This guide will walk you through setting up the Fake News Detector app from scratch.

## Table of Contents
1. [Firebase Setup](#firebase-setup)
2. [OpenRouter Setup](#openrouter-setup)
3. [Configuration](#configuration)
4. [Deployment Options](#deployment-options)
5. [Testing](#testing)

---

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name (e.g., "fake-news-detector")
4. (Optional) Enable Google Analytics
5. Click **"Create project"**
6. Wait for project creation to complete

### Step 2: Enable Authentication

1. In Firebase Console, click **"Authentication"** in left sidebar
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab

#### Enable Email/Password:
1. Click on **"Email/Password"**
2. Toggle **"Enable"** switch
3. Click **"Save"**

#### Enable Google Sign-In:
1. Click on **"Google"**
2. Toggle **"Enable"** switch
3. Enter **Project support email** (your email)
4. Click **"Save"**

#### Add Authorized Domains:
1. Scroll down to **"Authorized domains"**
2. Add your domains:
   - For local testing: `localhost` (already added)
   - For production: Add your actual domain (e.g., `myapp.com`)

### Step 3: Create Firestore Database

1. Click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Choose location (select closest to your users)
4. Start in **"Test mode"** (we'll add security rules later)
5. Click **"Enable"**

### Step 4: Set Security Rules

1. In Firestore Database, go to **"Rules"** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own history
    match /users/{userId}/history/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

### Step 5: Get Firebase Configuration

1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** `</>`
5. Register app:
   - App nickname: "Fake News Detector Web"
   - (Optional) Check "Also set up Firebase Hosting"
   - Click **"Register app"**
6. Copy the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

7. Save this configuration - you'll need it later!

---

## 🤖 OpenRouter Setup

### Step 1: Create Account

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Click **"Sign In"** or **"Get Started"**
3. Sign up with:
   - Google account, or
   - Email/password

### Step 2: Get API Key

1. After logging in, go to [API Keys](https://openrouter.ai/keys)
2. Click **"Create Key"**
3. Enter key details:
   - Name: "Fake News Detector"
   - (Optional) Set rate limits
4. Click **"Create"**
5. **IMPORTANT**: Copy the API key immediately
   - Format: `sk-or-v1-...`
   - You won't be able to see it again!
6. Store it securely

### Step 3: Understand Free Tier

OpenRouter offers free models:
- **google/gemini-2.0-flash-exp:free** (Recommended)
- **meta-llama/llama-3.2-3b-instruct:free**
- **microsoft/phi-3-mini-128k-instruct:free**

Free tier limitations:
- Limited requests per day
- Shared capacity (may be slower during peak times)
- No guaranteed uptime

For production apps, consider paid models for better reliability.

### Step 4: Test API Key (Optional)

Test your key with curl:

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "google/gemini-2.0-flash-exp:free",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## ⚙️ Configuration

### Step 1: Open config.js

Navigate to your project folder and open `config.js` in a text editor.

### Step 2: Add Firebase Config

Replace the placeholder Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",           // Replace with your Firebase API key
    authDomain: "your-project.firebaseapp.com",  // Replace with your auth domain
    projectId: "your-project-id",            // Replace with your project ID
    storageBucket: "your-project.appspot.com",   // Replace with your storage bucket
    messagingSenderId: "123456789012",       // Replace with your sender ID
    appId: "1:123456789012:web:abc123"       // Replace with your app ID
};
```

### Step 3: Add OpenRouter Key

Replace the placeholder OpenRouter API key:

```javascript
const OPENROUTER_API_KEY = "sk-or-v1-your-actual-key-here";  // Replace with your OpenRouter key
```

### Step 4: Save File

Save `config.js` with your actual credentials.

### Step 5: Security Note

**IMPORTANT**: Never commit `config.js` with real API keys to public repositories!

For production:
1. Use environment variables
2. Add `config.js` to `.gitignore`
3. Use Firebase App Check for additional security

---

## 🚀 Deployment Options

### Option 1: Local Development (Easiest)

#### Using Python (Recommended for beginners):
```bash
# Navigate to project folder
cd /path/to/newsdetector

# Start server
python3 -m http.server 8000

# Open browser to:
# http://localhost:8000
```

#### Using Node.js:
```bash
# Install http-server globally (one time)
npm install -g http-server

# Start server
http-server -p 8000

# Open browser to:
# http://localhost:8000
```

#### Using PHP:
```bash
php -S localhost:8000
```

#### Using VS Code Live Server:
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

### Option 2: Firebase Hosting (Recommended for production)

#### Install Firebase CLI:
```bash
npm install -g firebase-tools
```

#### Login to Firebase:
```bash
firebase login
```

#### Initialize Project:
```bash
cd /path/to/newsdetector
firebase init hosting
```

When prompted:
- **"What do you want to use as your public directory?"** → Press Enter (current directory)
- **"Configure as a single-page app?"** → No
- **"Set up automatic builds?"** → No
- **"Overwrite index.html?"** → No

#### Deploy:
```bash
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

### Option 3: Netlify

1. Go to [Netlify](https://www.netlify.com/)
2. Sign up/login
3. Drag and drop your project folder
4. Site is live instantly!

Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Option 4: Vercel

1. Go to [Vercel](https://vercel.com/)
2. Sign up/login
3. Click "New Project"
4. Import your project
5. Deploy!

Or use Vercel CLI:
```bash
npm install -g vercel
vercel --prod
```

### Option 5: GitHub Pages

1. Create a GitHub repository
2. Push your code
3. Go to repository Settings → Pages
4. Select branch and folder
5. Save

**Note**: For GitHub Pages, you may need to update Firebase authorized domains.

---

## 🧪 Testing

### Test 1: Authentication

1. Open the app in your browser
2. You should see the login modal
3. Click "Sign Up" tab
4. Create account with email/password
5. Verify you're redirected to dashboard
6. Logout and login again
7. Test Google login button

### Test 2: News Verification

1. After logging in, you should see the main dashboard
2. Try a sample headline by clicking one of the chips
3. Click "Check Claim"
4. Wait for AI analysis (10-30 seconds)
5. Verify you see:
   - "Likely Real" or "Likely Fake" badge
   - Confidence percentage
   - Credibility score (1-10)
   - Supporting sources with links

### Test 3: History

1. After checking a claim, scroll to History section
2. Verify your check appears in history
3. Click on the history item to expand details
4. Verify sources are clickable
5. Refresh page and verify history persists

### Test 4: Multiple Devices

1. Login on different devices/browsers
2. Verify history syncs across devices
3. Check a claim on one device
4. Refresh on another device to see it appear

### Test 5: Error Handling

1. Try checking an empty claim (should show alert)
2. Try logging in with wrong password (should show error)
3. Try signing up with existing email (should show error)

---

## 🐛 Common Issues & Solutions

### Issue: "Firebase is not defined"

**Solution**: 
- Make sure you're accessing via `http://` not `file://`
- Use a local web server (see deployment options)

### Issue: "API Key Invalid"

**Solution**:
- Double-check your OpenRouter API key in `config.js`
- Ensure there are no extra spaces or quotes
- Verify key starts with `sk-or-v1-`

### Issue: "Permission Denied" in Firestore

**Solution**:
- Update Firestore security rules (see Firebase Setup Step 4)
- Ensure user is logged in before checking claims
- Verify userId matches in rules

### Issue: Google Login Popup Blocked

**Solution**:
- Allow popups in browser settings
- Add your domain to Firebase authorized domains
- Try using redirect instead of popup (modify code)

### Issue: "CORS Error" with OpenRouter

**Solution**:
- OpenRouter should handle CORS automatically
- Verify you're using the correct API endpoint
- Check that HTTP-Referer header is set correctly

### Issue: Slow AI Responses

**Solution**:
- Free tier models may be slower during peak times
- Consider upgrading to paid models
- Add timeout handling in code

### Issue: History Not Showing

**Solution**:
- Check browser console for errors
- Verify Firestore rules are correct
- Ensure user is authenticated
- Check that timestamps are being saved

---

## 📊 Monitoring & Maintenance

### Firebase Console Monitoring

1. **Authentication**: Monitor active users
2. **Firestore**: Check read/write usage
3. **Performance**: Track load times

### OpenRouter Dashboard

1. Check API usage and limits
2. Monitor request success rate
3. View cost (if using paid models)

### Regular Maintenance

- Update Firebase SDK versions
- Review and update security rules
- Monitor API key usage
- Check for browser console errors
- Update AI prompts for better accuracy

---

## 🎓 Next Steps

Now that your app is set up:

1. **Customize the UI**: Edit `styles.css` to match your brand
2. **Improve AI Prompts**: Modify prompts in `app.js` for better results
3. **Add Features**: Implement export, sharing, or analytics
4. **Optimize Performance**: Add caching, lazy loading
5. **Enhance Security**: Implement rate limiting, App Check

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

**Need help?** Check the troubleshooting section or review the main README.md file.

**Happy fact-checking!** 🎉
