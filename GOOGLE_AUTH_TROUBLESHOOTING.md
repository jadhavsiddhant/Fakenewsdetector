# 🔧 Google Authentication Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Popup Blocked" or No Response

**Symptoms:**
- Clicking Google login button does nothing
- No popup window appears
- No error message shown

**Solutions:**

1. **Allow Popups in Browser**
   - Chrome: Click the popup icon in address bar → "Always allow popups"
   - Firefox: Click the shield icon → Allow popups
   - Safari: Preferences → Websites → Pop-up Windows → Allow

2. **Try Redirect Method Instead**
   - If popups don't work, use redirect authentication
   - See code fix below

### Issue 2: "This app isn't verified" or OAuth Error

**Symptoms:**
- Google shows "This app isn't verified" warning
- OAuth consent screen error
- "redirect_uri_mismatch" error

**Solutions:**

1. **Configure OAuth Consent Screen** (Firebase Console)
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to Authentication → Sign-in method
   - Click on Google provider
   - Ensure it's enabled
   - Note the OAuth client ID

2. **Add Authorized Domains**
   - In Firebase Console → Authentication → Settings
   - Under "Authorized domains", add:
     - `localhost` (for local testing)
     - Your production domain (e.g., `yourapp.netlify.app`)

3. **Configure Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Select your Firebase project
   - Go to APIs & Services → Credentials
   - Click on your OAuth 2.0 Client ID
   - Under "Authorized JavaScript origins", add:
     - `http://localhost:8000`
     - `http://localhost:3000`
     - `http://127.0.0.1:8000`
   - Under "Authorized redirect URIs", add:
     - `http://localhost:8000/__/auth/handler`
     - `https://your-project-id.firebaseapp.com/__/auth/handler`

### Issue 3: "auth/popup-closed-by-user"

**Symptoms:**
- Error message: "The popup has been closed by the user"
- Popup appears but closes immediately

**Solutions:**

1. **User Action Required**
   - Don't close the popup before completing sign-in
   - Complete the Google account selection

2. **Use Redirect Instead**
   - Better for mobile devices
   - See code fix below

### Issue 4: "auth/unauthorized-domain"

**Symptoms:**
- Error: "This domain is not authorized"
- Authentication fails on deployed site

**Solutions:**

1. **Add Domain to Firebase**
   - Firebase Console → Authentication → Settings
   - Authorized domains → Add domain
   - Add your deployment URL (without http/https)
   - Examples:
     - `yourapp.netlify.app`
     - `yourapp.vercel.app`
     - `yourdomain.com`

### Issue 5: Third-Party Cookies Blocked

**Symptoms:**
- Authentication fails silently
- No error message
- Works in incognito mode

**Solutions:**

1. **Enable Third-Party Cookies**
   - Chrome: Settings → Privacy → Cookies → Allow all cookies
   - Firefox: Settings → Privacy → Standard
   - Safari: Preferences → Privacy → Uncheck "Prevent cross-site tracking"

2. **Use Redirect Method** (recommended for production)
   - More reliable across browsers
   - See code fix below

### Issue 6: Firebase Configuration Error

**Symptoms:**
- Console error: "Firebase not initialized"
- "auth is not defined"

**Solutions:**

1. **Check config.js**
   - Ensure `config.js` exists (copy from `config.example.js`)
   - Verify all Firebase config values are filled in
   - Check that Firebase is initialized before app.js loads

2. **Verify Script Loading Order** (in index.html)
   ```html
   <!-- Correct order: -->
   <script src="firebase-app.js"></script>
   <script src="firebase-auth.js"></script>
   <script src="config.js"></script>
   <script src="app.js"></script>
   ```

## Code Fixes

### Fix 1: Add Redirect Authentication (Recommended)

Replace the `handleGoogleAuth` function in `app.js`:

```javascript
async function handleGoogleAuth() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Add scopes if needed
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
        // Try popup first
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error('Popup error:', error);
        
        // If popup fails, try redirect
        if (error.code === 'auth/popup-blocked' || 
            error.code === 'auth/popup-closed-by-user') {
            console.log('Popup blocked, trying redirect...');
            try {
                await auth.signInWithRedirect(provider);
            } catch (redirectError) {
                showError('loginError', 'Google sign-in failed: ' + redirectError.message);
            }
        } else {
            showError('loginError', 'Google sign-in failed: ' + error.message);
        }
    }
}

// Handle redirect result
auth.getRedirectResult().then((result) => {
    if (result.user) {
        console.log('Successfully signed in via redirect:', result.user.email);
    }
}).catch((error) => {
    console.error('Redirect result error:', error);
    showError('loginError', 'Google sign-in failed: ' + error.message);
});
```

### Fix 2: Better Error Messages

Add more detailed error handling:

```javascript
async function handleGoogleAuth() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error('Google Auth Error:', error);
        
        let errorMessage = 'Google sign-in failed. ';
        
        switch (error.code) {
            case 'auth/popup-blocked':
                errorMessage += 'Please allow popups for this site.';
                break;
            case 'auth/popup-closed-by-user':
                errorMessage += 'Sign-in cancelled. Please try again.';
                break;
            case 'auth/unauthorized-domain':
                errorMessage += 'This domain is not authorized. Contact administrator.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage += 'Google sign-in is not enabled. Contact administrator.';
                break;
            case 'auth/cancelled-popup-request':
                errorMessage += 'Another sign-in is in progress.';
                break;
            default:
                errorMessage += error.message;
        }
        
        showError('loginError', errorMessage);
    }
}
```

### Fix 3: Add Loading State

Prevent multiple clicks:

```javascript
async function handleGoogleAuth() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // Disable buttons
    googleLoginBtn.disabled = true;
    googleSignupBtn.disabled = true;
    googleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        showError('loginError', error.message);
    } finally {
        // Re-enable buttons
        googleLoginBtn.disabled = false;
        googleSignupBtn.disabled = false;
        googleLoginBtn.innerHTML = '<i class="fab fa-google"></i> Continue with Google';
    }
}
```

## Testing Checklist

- [ ] Firebase Google provider is enabled
- [ ] Authorized domains include localhost and production domain
- [ ] OAuth consent screen is configured
- [ ] Popups are allowed in browser
- [ ] Third-party cookies are enabled
- [ ] config.js has correct Firebase configuration
- [ ] Scripts load in correct order
- [ ] Console shows no Firebase initialization errors

## Quick Test

1. Open browser console (F12)
2. Click Google sign-in button
3. Check for errors in console
4. Common errors:
   - `auth/popup-blocked` → Allow popups
   - `auth/unauthorized-domain` → Add domain to Firebase
   - `auth/operation-not-allowed` → Enable Google provider
   - `Firebase not initialized` → Check config.js

## Still Not Working?

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for red error messages
   - Share the error code for specific help

2. **Verify Firebase Setup**
   ```javascript
   // Add this to console to test:
   console.log('Auth:', auth);
   console.log('Firebase:', firebase);
   ```

3. **Test with Different Browser**
   - Try Chrome Incognito mode
   - Try different browser
   - This helps identify cookie/extension issues

4. **Check Firebase Console**
   - Go to Authentication → Users
   - Try manual email/password signup first
   - If that works, issue is specific to Google auth

## Contact Support

If none of these solutions work:

1. Check Firebase Status: https://status.firebase.google.com
2. Firebase Support: https://firebase.google.com/support
3. Stack Overflow: Tag with `firebase` and `google-authentication`

## Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/google-signin)
- [Common Firebase Auth Errors](https://firebase.google.com/docs/reference/js/auth#autherrorcodes)
- [OAuth Configuration Guide](https://developers.google.com/identity/protocols/oauth2)
