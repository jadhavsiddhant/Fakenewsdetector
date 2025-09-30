# 🛡️ Fake News Detector

An AI-powered web application that verifies news claims using OpenRouter's free AI models with web browsing capabilities. Built with vanilla JavaScript, Firebase Authentication, and Firestore database.

![Fake News Detector](https://img.shields.io/badge/Status-Ready%20to%20Deploy-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### 🔐 Authentication
- **Email/Password Authentication** - Secure user registration and login
- **Google OAuth** - One-click sign-in with Google
- **Session Management** - Persistent login state

### 🤖 AI-Powered Verification
- **OpenRouter Integration** - Uses free AI models with web browsing enabled
- **Real-time Analysis** - Instant fact-checking of news claims
- **Confidence Scoring** - Percentage-based confidence in predictions
- **Credibility Rating** - 1-10 scale credibility score
- **Source Citations** - Clickable links to supporting sources

### 📊 User Dashboard
- **Modern UI** - Responsive design inspired by Microsoft Bing AI
- **Prediction Badges** - Clear "Likely Real" or "Likely Fake" indicators
- **History Tracking** - All past verifications saved to Firestore
- **Expandable Details** - Click history items to view full analysis
- **Sample Headlines** - Quick-test examples included

### 🔒 Security
- **XSS Protection** - All user inputs sanitized
- **Secure API Keys** - Configuration file for sensitive data
- **Firebase Security Rules** - User-specific data access

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- Firebase account (free tier works)
- OpenRouter API key (free tier available)
- GitHub account (for deployment)

### Local Development

#### 1. Install Dependencies
```bash
cd newsdetector
npm install
```

#### 2. Configure Environment Variables

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and add your keys:
```env
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
PORT=3000
```

#### 3. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable **Email/Password**
   - Enable **Google** (add your domain to authorized domains)
4. Enable **Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in **test mode** (or use production mode with rules below)
5. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy the configuration object

#### 3. Configure OpenRouter

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-...`)

#### 4. Update Configuration

Open `config.js` and replace the placeholders:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

const OPENROUTER_API_KEY = "sk-or-v1-your-actual-api-key-here";
```

#### 5. Set Firestore Security Rules

In Firebase Console → Firestore Database → Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/history/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### 4. Copy and Update config.js

```bash
cp config.example.js config.js
```

Edit `config.js` with your Firebase configuration (get from Firebase Console → Project Settings).

#### 5. Start Development Server

```bash
npm start
```

Open `http://localhost:3000` in your browser.

## 🌐 Deployment to Render.com (Recommended)

### Why Render?
- ✅ Free tier (750 hours/month)
- ✅ Supports Node.js backend
- ✅ Secure environment variables
- ✅ Auto-deploys from GitHub
- ✅ Free SSL certificate

### Deployment Steps:

#### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/newsdetector.git
git push -u origin main
```

#### 2. Deploy on Render

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `fake-news-detector`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. Add Environment Variables:
   ```
   OPENROUTER_API_KEY = your_actual_key_here
   OPENROUTER_MODEL = google/gemini-2.0-flash-exp:free
   PORT = 3000
   ```

6. Click "Create Web Service"

#### 3. Update Firebase Authorized Domains

- Go to Firebase Console → Authentication → Settings
- Add your Render URL: `your-app-name.onrender.com`

### Done! Your app is live at: `https://your-app-name.onrender.com` 🎉

## 🔒 Security Notes

- ✅ OpenRouter API key is secure on backend (never exposed to browser)
- ✅ `.env` file is gitignored (never committed)
- ✅ Firebase config is safe to expose (designed to be public)
- ✅ Backend validates all requests
- ✅ CORS properly configured

## 📁 Project Structure

```
newsdetector/
├── index.html          # Main HTML structure
├── styles.css          # Responsive CSS styling
├── app.js             # Core application logic
├── config.js          # Firebase & API configuration
├── README.md          # This file
├── SETUP_GUIDE.md     # Detailed setup instructions
└── .gitignore         # Git ignore file
```

## 🎨 UI Components

### Authentication Modal
- Tab-based login/signup interface
- Email/password forms with validation
- Google OAuth button
- Error message display

### Main Dashboard
- **Header**: Logo, user email, logout button
- **Checker Section**: Input field, check button, sample headlines
- **Results Display**: Badge, confidence, credibility, sources
- **History Section**: Expandable past verifications

## 🔧 Configuration Options

### OpenRouter Models

The app uses `google/gemini-2.0-flash-exp:free` by default. You can change this in `config.js`:

```javascript
// Other free models you can try:
const OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free";
// const OPENROUTER_MODEL = "meta-llama/llama-3.2-3b-instruct:free";
// const OPENROUTER_MODEL = "microsoft/phi-3-mini-128k-instruct:free";
```

### Firestore Collection Structure

```
users/
  {userId}/
    history/
      {documentId}/
        - claim: string
        - label: "real" | "fake"
        - confidence: number (0-1)
        - credibilityScore: number (1-10)
        - reasoning: string
        - sources: array
        - timestamp: timestamp
```

## 🛠️ Customization

### Styling
- Edit `styles.css` to change colors, fonts, layout
- CSS variables defined in `:root` for easy theming

### AI Prompt
- Modify the prompt in `app.js` → `verifyNewsWithAI()` function
- Adjust temperature and max_tokens for different AI behavior

### Sample Headlines
- Edit sample chips in `index.html` → `.sample-chips` section

## 🐛 Troubleshooting

### "Firebase is not defined"
- Ensure you're running on a web server (not `file://`)
- Check that Firebase CDN scripts are loading

### "API Key Invalid"
- Verify your OpenRouter API key is correct
- Check that you have credits/free tier active

### "Permission Denied" in Firestore
- Update Firestore security rules as shown above
- Ensure user is authenticated before saving

### Google Login Not Working
- Add your domain to Firebase authorized domains
- For localhost, add `localhost` and `127.0.0.1`

### CORS Errors
- OpenRouter should handle CORS automatically
- If issues persist, check browser console for details

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔐 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** in production
3. **Enable Firebase App Check** for additional security
4. **Set up Firestore security rules** properly
5. **Implement rate limiting** for API calls
6. **Use HTTPS** in production

## 📊 API Usage

### OpenRouter Free Tier
- Limited requests per day
- Shared model capacity
- May have rate limits

### Firestore Free Tier
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage

## 🤝 Contributing

Feel free to fork and customize this project! Some ideas:
- Add more AI models
- Implement advanced filtering
- Add export functionality
- Create browser extension
- Add social sharing

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- **OpenRouter** - AI model API
- **Firebase** - Authentication & Database
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Firebase and OpenRouter documentation
3. Check browser console for error messages

## 🎯 Future Enhancements

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Export history to CSV/PDF
- [ ] Browser extension version
- [ ] Mobile app (React Native)
- [ ] Batch verification
- [ ] API endpoint for developers
- [ ] Chrome extension for real-time checking

---

**Built with ❤️ using vanilla JavaScript, Firebase, and OpenRouter AI**

**Ready to deploy!** 🚀
