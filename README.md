# 🔍 Fake News Detector

An AI-powered fact-checking web application that helps users verify news claims using advanced language models. Built with vanilla JavaScript, Firebase, and OpenRouter's DeepSeek R1 API.

## ✨ Features

- **AI-Powered Analysis**: Uses DeepSeek R1 model via OpenRouter API for intelligent fact-checking
- **User Authentication**: Secure login with Firebase Auth (Email/Password + Google Sign-in)
- **Personalized History**: Each user's verification history stored in Firestore
- **Clean UI**: Modern, Bing-inspired interface with smooth animations
- **Fallback System**: Heuristic-based verification when API is unavailable
- **Real-time Results**: Instant analysis with confidence scores and explanations
- **Source Citations**: Provides relevant sources for further verification

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 18+ and npm
- Firebase account (free tier)
- OpenRouter API key (free tier available)

### 1. Clone the Project

```bash
git clone <your-repo-url>
cd FinalFakeNewsDetector
```

### 2. Configure Firebase (Frontend)

The default Firebase project is already in `config.js`. To use your own project:
   
   a. Go to [Firebase Console](https://console.firebase.google.com/)
   b. Create a new project or select existing one
   c. Enable Authentication:
      - Go to Authentication → Sign-in method
      - Enable "Email/Password"
      - Enable "Google" (add your domain to authorized domains)
   d. Enable Firestore Database:
      - Go to Firestore Database → Create database
      - Start in **production mode** or **test mode**
      - Choose a location
   e. Get your config:
      - Go to Project Settings → General
      - Scroll to "Your apps" → Web app
      - Copy the `firebaseConfig` object
      - Replace the config in `config.js`

### 3. Configure OpenRouter (Backend)

The browser no longer talks to OpenRouter directly. Instead it sends requests to a secure Express proxy (`server.js`).

1. Copy the environment template and edit it:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set:
   - `OPENROUTER_API_KEY` – your OpenRouter key (keep this private)
   - `OPENROUTER_MODEL` – e.g. `deepseek/deepseek-r1:free` or any paid model you own
   - `ALLOWED_ORIGINS` – domains that can call the proxy (`http://localhost:8000` for dev)

### 4. Firestore Security Rules
   
   Set up Firestore security rules in Firebase Console:
   
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

### 5. Run the App Locally

**Step A – Start the backend proxy**

```bash
npm install
npm run start
# or for auto-reload: npm run dev
```

The server listens on `http://localhost:3000` by default.

**Step B – Start the frontend** (in a second terminal)

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser. All AI requests route through the backend proxy to keep keys secure and add retries.

## 🌐 Deployment

### Deploy to Firebase Hosting (Frontend) + Render/Railway (Backend)

**Backend**

1. Push the repo to GitHub.
2. Create a service on Render.com, Railway, Fly.io, etc.
3. Add environment variables from `.env` (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `APP_URL`, `ALLOWED_ORIGINS`, etc.).
4. Deploy – the server exposes `/api/verify-news`.

**Frontend**

1. Install Firebase CLI
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. Initialize hosting (if not already)
   ```bash
   firebase init hosting
   ```
3. Deploy static files
   ```bash
   firebase deploy --only hosting
   ```
4. Update Firebase Auth authorized domains with your hosting + backend URLs.

**Netlify / GitHub Pages**

- Deploy static files as usual (drag-and-drop or Git). Ensure `ALLOWED_ORIGINS` on the backend contains the hosted domain.
## 🔧 Configuration Files

### `config.js`

Contains Firebase configuration (safe to expose). OpenRouter access is now handled server-side.

### `server.js`

Express proxy that keeps API keys in environment variables, adds request validation, and normalizes AI responses.

### `firebase.json`

Firebase hosting configuration with proper routing and caching rules.

### `netlify.toml`

Netlify deployment configuration with build settings.

### `.env.example`

Template for backend environment variables. Copy to `.env` and fill in secrets.

## 🎨 Customization

### Changing Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary-color: #0078d4;      /* Main brand color */
    --success-color: #107c10;      /* "Real" news indicator */
    --danger-color: #d13438;       /* "Fake" news indicator */
    /* ... more variables */
}
```

### Changing AI Model

In `config.js`, update the model:

```javascript
const OPENROUTER_MODEL = "deepseek/deepseek-r1-0528:free";
```

Available models on OpenRouter:
- `deepseek/deepseek-r1-0528:free` (Current, free)
- `openai/gpt-3.5-turbo` (Paid)
- `anthropic/claude-3-haiku` (Paid)
- See [OpenRouter Models](https://openrouter.ai/models) for more

### Modifying Heuristic Fallback

Edit the `verifyNewsHeuristic()` function in `script.js` to adjust keyword detection.

## 🔒 Security Considerations

### Current Setup (Demo/Development)

- API keys are stored in `config.js` (client-side)
- Firebase config is exposed (safe - it's meant to be public)
- OpenRouter API key is exposed (**not recommended for production**)

### Production Recommendations

1. **Use a Backend Proxy**
   - Create a simple Express server
   - Store API keys in environment variables
   - Make API calls from server-side
   - See the memory about secure backend architecture

2. **Set API Key Restrictions**
   - In OpenRouter dashboard, restrict API key to specific domains
   - Set rate limits and spending caps

3. **Implement Rate Limiting**
   - Add client-side rate limiting
   - Use Firebase Functions for server-side rate limiting

4. **Firestore Security Rules**
   - Ensure users can only access their own data
   - Validate data structure on write operations

## 📊 How It Works

1. **User Authentication**
   - Users sign up/login with email or Google
   - Firebase Auth manages sessions securely

2. **News Verification**
   - User enters a news claim
   - App sends claim to OpenRouter API with DeepSeek R1 model
   - AI analyzes the claim and returns structured JSON
   - Results include: label (real/fake), confidence score, explanation, sources

3. **Fallback System**
   - If API fails, uses keyword-based heuristic analysis
   - Provides basic verification based on common fake news patterns

4. **History Storage**
   - Each verification is saved to Firestore
   - Organized by user ID
   - Displayed in chronological order

## 🐛 Troubleshooting

### Authentication Issues

**Problem**: Google Sign-in not working

**Solutions**:
- Ensure Google Sign-in is enabled in Firebase Console
- Check that your domain is in authorized domains list
- Allow popups in your browser
- See `GOOGLE_AUTH_TROUBLESHOOTING.md` if available

**Problem**: Email/Password sign-up fails

**Solutions**:
- Ensure Email/Password is enabled in Firebase Console
- Check password is at least 6 characters
- Verify email format is correct

### API Issues

**Problem**: "API request failed" error

**Solutions**:
- Check OpenRouter API key is valid
- Verify you have API credits (free tier has limits)
- Check browser console for detailed error messages
- Ensure CORS is not blocking requests

**Problem**: Results not displaying

**Solutions**:
- Check browser console for errors
- Verify AI response format matches expected structure
- Test with the heuristic fallback by disconnecting internet

### Firestore Issues

**Problem**: History not saving/loading

**Solutions**:
- Verify Firestore is enabled in Firebase Console
- Check security rules allow user access
- Ensure user is authenticated
- Check browser console for permission errors

## 🎯 Future Enhancements

- [ ] Add fact-checking from multiple AI models
- [ ] Implement real-time news source verification
- [ ] Add browser extension for quick fact-checking
- [ ] Include sentiment analysis
- [ ] Add multi-language support
- [ ] Implement social sharing features
- [ ] Add export history to CSV/PDF
- [ ] Create admin dashboard for analytics


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions:
- Check the troubleshooting section above
- Review Firebase and OpenRouter documentation
- Open an issue on GitHub

## 🙏 Acknowledgments

- **Mentors & Friends**

---

**Built with ❤️ using JavaScript, Firebase, and Groq**
