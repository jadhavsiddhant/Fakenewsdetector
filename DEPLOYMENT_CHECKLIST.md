# 🚀 Deployment Checklist

Use this checklist to ensure your Fake News Detector is properly configured and ready for deployment.

## 📋 Pre-Deployment Checklist

### 1. Firebase Configuration ✅

- [ ] Firebase project created
- [ ] Firebase Authentication enabled
  - [ ] Email/Password provider enabled
  - [ ] Google provider enabled
  - [ ] Authorized domains configured
- [ ] Firestore Database created
  - [ ] Database initialized (test or production mode)
  - [ ] Security rules deployed
- [ ] Firebase configuration copied to `config.js`
  - [ ] `apiKey` filled in
  - [ ] `authDomain` filled in
  - [ ] `projectId` filled in
  - [ ] `storageBucket` filled in
  - [ ] `messagingSenderId` filled in
  - [ ] `appId` filled in

### 2. OpenRouter Configuration ✅

- [ ] OpenRouter account created
- [ ] API key generated
- [ ] API key copied to `config.js`
- [ ] Free tier model selected (or paid model configured)
- [ ] API key tested (optional)

### 3. Local Testing ✅

- [ ] All files present in project directory
- [ ] Local web server running
- [ ] Application loads without errors
- [ ] Authentication works
  - [ ] Email/password signup works
  - [ ] Email/password login works
  - [ ] Google login works
  - [ ] Logout works
- [ ] News verification works
  - [ ] Can enter claim
  - [ ] Check button works
  - [ ] Results display correctly
  - [ ] Sources are clickable
- [ ] History works
  - [ ] Claims save to history
  - [ ] History displays correctly
  - [ ] History items expandable
  - [ ] History persists after refresh
- [ ] Responsive design tested
  - [ ] Desktop view works
  - [ ] Tablet view works
  - [ ] Mobile view works

### 4. Security Review ✅

- [ ] `config.js` contains real API keys (not placeholders)
- [ ] `.gitignore` includes `config.js` (if using Git)
- [ ] Firestore security rules deployed
- [ ] No API keys hardcoded in HTML/CSS
- [ ] XSS protection verified
- [ ] HTTPS will be used in production

### 5. Code Quality ✅

- [ ] No console errors in browser
- [ ] No console warnings in browser
- [ ] All features working as expected
- [ ] Loading states display properly
- [ ] Error messages display properly
- [ ] Code is clean and commented

## 🌐 Deployment Options

Choose one deployment method:

### Option A: Firebase Hosting (Recommended)

**Prerequisites:**
- [ ] Node.js installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)

**Steps:**
```bash
# 1. Login to Firebase
firebase login

# 2. Initialize hosting
firebase init hosting
# - Select your Firebase project
# - Public directory: . (current directory)
# - Single-page app: No
# - Overwrite index.html: No

# 3. Deploy
firebase deploy --only hosting

# 4. Note your live URL
# https://your-project-id.web.app
```

**Post-Deployment:**
- [ ] Site is live and accessible
- [ ] Add live URL to Firebase authorized domains
- [ ] Test all features on live site
- [ ] Verify HTTPS is working

### Option B: Netlify

**Method 1: Drag & Drop**
- [ ] Go to [Netlify](https://www.netlify.com/)
- [ ] Sign up/login
- [ ] Drag project folder to deploy area
- [ ] Note your live URL
- [ ] Add URL to Firebase authorized domains

**Method 2: CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Follow prompts
```

**Post-Deployment:**
- [ ] Site is live
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled
- [ ] Firebase authorized domains updated

### Option C: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Follow prompts
```

**Post-Deployment:**
- [ ] Site is live
- [ ] Custom domain configured (optional)
- [ ] Firebase authorized domains updated

### Option D: GitHub Pages

**Steps:**
1. [ ] Create GitHub repository
2. [ ] Push code to repository
3. [ ] Go to Settings → Pages
4. [ ] Select branch and folder
5. [ ] Save and wait for deployment
6. [ ] Add GitHub Pages URL to Firebase authorized domains

**Note:** Remember to add `config.js` to `.gitignore` and use GitHub Secrets for sensitive data.

### Option E: Custom Server

**Requirements:**
- [ ] Web server (Apache, Nginx, etc.)
- [ ] HTTPS certificate
- [ ] Domain name

**Steps:**
1. [ ] Upload all files to server
2. [ ] Configure web server
3. [ ] Enable HTTPS
4. [ ] Add domain to Firebase authorized domains
5. [ ] Test deployment

## 🔒 Post-Deployment Security

### Firebase Security

- [ ] Review Firestore security rules
- [ ] Enable Firebase App Check (recommended)
- [ ] Set up Firebase usage alerts
- [ ] Review authentication settings
- [ ] Monitor Firebase console for suspicious activity

### API Security

- [ ] OpenRouter API key is not exposed in client code
- [ ] Consider implementing rate limiting
- [ ] Monitor API usage in OpenRouter dashboard
- [ ] Set up usage alerts if available

### General Security

- [ ] HTTPS is enforced
- [ ] Content Security Policy configured (optional)
- [ ] CORS settings reviewed
- [ ] Regular security audits scheduled

## 📊 Monitoring & Maintenance

### Firebase Console

- [ ] Set up usage alerts
- [ ] Monitor authentication metrics
- [ ] Check Firestore read/write usage
- [ ] Review error logs

### OpenRouter Dashboard

- [ ] Monitor API usage
- [ ] Check request success rate
- [ ] Review costs (if using paid models)
- [ ] Set up usage alerts

### Application Monitoring

- [ ] Test application regularly
- [ ] Monitor user feedback
- [ ] Check browser console for errors
- [ ] Review performance metrics

## 🎯 Launch Checklist

### Before Going Live

- [ ] All features tested thoroughly
- [ ] Security measures in place
- [ ] Documentation reviewed
- [ ] Backup plan prepared
- [ ] Support channels ready

### Launch Day

- [ ] Deploy to production
- [ ] Verify all features work
- [ ] Test from multiple devices
- [ ] Monitor for errors
- [ ] Be ready to rollback if needed

### Post-Launch

- [ ] Monitor usage and errors
- [ ] Collect user feedback
- [ ] Plan future updates
- [ ] Regular maintenance scheduled

## 🐛 Troubleshooting Deployment Issues

### Firebase Errors

**"Permission denied"**
- Check Firestore security rules
- Verify user is authenticated
- Ensure userId matches in rules

**"Invalid API key"**
- Verify Firebase config in `config.js`
- Check that project ID is correct
- Ensure API key is enabled in Firebase console

### OpenRouter Errors

**"Unauthorized"**
- Verify API key is correct
- Check that key starts with `sk-or-v1-`
- Ensure you have credits/free tier active

**"Rate limit exceeded"**
- Wait and try again
- Consider upgrading to paid tier
- Implement request throttling

### Deployment Errors

**"Site not loading"**
- Check that all files were uploaded
- Verify `index.html` is in root directory
- Check web server configuration

**"CORS errors"**
- Ensure using HTTPS in production
- Check Firebase authorized domains
- Verify API endpoints are correct

**"Authentication not working"**
- Add deployment URL to Firebase authorized domains
- Check that auth providers are enabled
- Verify Firebase config is correct

## 📞 Support Resources

### Documentation
- `README.md` - Complete overview
- `SETUP_GUIDE.md` - Detailed setup
- `QUICKSTART.md` - Quick start guide
- `FEATURES.md` - Technical details

### External Resources
- [Firebase Documentation](https://firebase.google.com/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)

## ✅ Final Verification

Before considering deployment complete:

- [ ] Application is live and accessible
- [ ] All features work on production
- [ ] HTTPS is enabled
- [ ] Firebase authorized domains updated
- [ ] Security measures in place
- [ ] Monitoring set up
- [ ] Documentation updated with live URL
- [ ] Backup/rollback plan ready

## 🎉 Deployment Complete!

Once all items are checked:

✅ Your Fake News Detector is live!  
✅ Users can access the application  
✅ Security measures are in place  
✅ Monitoring is active  

**Next Steps:**
1. Share your application
2. Gather user feedback
3. Plan future enhancements
4. Regular maintenance and updates

---

**Deployment Status**: ⏳ In Progress → ✅ Complete  
**Last Updated**: 2025-09-30
