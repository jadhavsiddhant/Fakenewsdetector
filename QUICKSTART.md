# ⚡ Quick Start Guide

Get your Fake News Detector running in 5 minutes!

## 🎯 Prerequisites Checklist

- [ ] Firebase account (free)
- [ ] OpenRouter account (free)
- [ ] Text editor
- [ ] Web browser

## 🚀 Setup Steps

### 1️⃣ Get Firebase Config (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable **Authentication** → Email/Password + Google
4. Enable **Firestore Database** (test mode)
5. Get config from Project Settings → Web App

### 2️⃣ Get OpenRouter Key (1 minute)

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up/login
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create new key
5. Copy the key (starts with `sk-or-v1-`)

### 3️⃣ Configure App (1 minute)

1. Open `config.js` in text editor
2. Replace Firebase config:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

3. Replace OpenRouter key:
```javascript
const OPENROUTER_API_KEY = "sk-or-v1-YOUR_KEY_HERE";
```

4. Save file

### 4️⃣ Run Locally (1 minute)

**Option A - Python:**
```bash
cd newsdetector
python3 -m http.server 8000
```

**Option B - Node.js:**
```bash
npx http-server -p 8000
```

**Option C - VS Code:**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

### 5️⃣ Test It! (30 seconds)

1. Open `http://localhost:8000`
2. Sign up with email/password
3. Enter a news headline
4. Click "Check Claim"
5. View results!

## ✅ You're Done!

Your Fake News Detector is now running locally.

## 🌐 Deploy to Production (Optional)

**Firebase Hosting (Easiest):**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

**Netlify (Drag & Drop):**
1. Go to [Netlify](https://netlify.com)
2. Drag project folder
3. Done!

## 🆘 Having Issues?

### Firebase Error?
- Make sure you enabled Authentication and Firestore
- Check that you copied the config correctly

### OpenRouter Error?
- Verify API key starts with `sk-or-v1-`
- Check you have free credits available

### Can't Access Locally?
- Use `http://localhost:8000` not `file://`
- Try a different port: `python3 -m http.server 3000`

### Still Stuck?
- Check `SETUP_GUIDE.md` for detailed instructions
- Review browser console for errors
- Verify all files are in the same folder

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `SETUP_GUIDE.md` for detailed setup
- Customize `styles.css` for your brand
- Deploy to production hosting

---

**Happy fact-checking!** 🎉
