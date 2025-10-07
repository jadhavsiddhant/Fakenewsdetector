# FIREBASE & FIRESTORE IN FAKE NEWS DETECTOR

**Purpose**: Complete Firebase/Firestore documentation for viva preparation.

---

## TABLE OF CONTENTS

1. [Why Firebase?](#1-why-firebase)
2. [Firebase Authentication](#2-firebase-authentication)
3. [Firestore Database](#3-firestore-database)
4. [Data Model & Schema](#4-data-model--schema)
5. [Common Viva Questions](#5-common-viva-questions)

---

## 1. WHY FIREBASE?

### What Firebase Is
Firebase is Google's Backend-as-a-Service (BaaS) platform providing authentication, database, hosting, and other services without managing servers.

### Why We Chose Firebase Over Traditional Databases

**NoSQL vs SQL Decision**:

| Requirement | NoSQL (Firebase) | SQL (PostgreSQL) |
|-------------|------------------|------------------|
| Varying result structures | ✅ Flexible schema | ❌ Rigid columns |
| Real-time sync | ✅ Built-in | ❌ Need custom WebSockets |
| Authentication | ✅ Integrated | ❌ Separate OAuth setup |
| Scalability | ✅ Auto-scales | ❌ Manual sharding |
| Development speed | ✅ Minutes to setup | ❌ Days of config |

**Business Justification**:
- **Time-to-market**: Launch in days, not weeks
- **Cost**: Pay-per-use (free tier covers development)
- **Maintenance**: Zero server management
- **Scalability**: Handles 100+ concurrent users automatically

### Firebase Services Used

1. **Firebase Authentication** (`script.js:787-802`)
   - Email/Password sign-in
   - Google OAuth integration
   - Session management

2. **Cloud Firestore** (`script.js:636-690`)
   - NoSQL document database
   - Real-time data sync
   - User history storage

3. **Firebase Hosting** (deployment)
   - CDN-based static hosting
   - Auto SSL certificates
   - Global edge locations

---

## 2. FIREBASE AUTHENTICATION

### Location
- **File**: `script.js`
- **Lines**: 787-802 (initialization), event handlers throughout
- **Config**: `config.js`

### How It Works

**Workflow**:

```
1. User clicks "Sign Up" or "Sign In"
   ↓
2. Frontend calls firebase.auth() methods
   ↓
3. Firebase validates credentials
   ↓
4. On success: Returns user object with UID
   ↓
5. Store currentUser = user
   ↓
6. Load user's history from Firestore
   ↓
7. Update UI (show history panel, logout button)
```

**Code Flow**:

```javascript
// Sign Up (script.js)
Step 1: Get email + password from form
Step 2: auth.createUserWithEmailAndPassword(email, password)
Step 3: Firebase creates account
Step 4: onAuthStateChanged triggers → currentUser = user
Step 5: Call loadUserHistory()

// Sign In
Step 1: Get credentials
Step 2: auth.signInWithEmailAndPassword(email, password)
Step 3: Firebase validates
Step 4: onAuthStateChanged triggers
Step 5: Load history

// Google Sign-In
Step 1: Create GoogleAuthProvider
Step 2: auth.signInWithPopup(provider)
Step 3: User authorizes in Google popup
Step 4: Firebase returns user object
Step 5: Auto-create Firestore user doc if new
```

### Security Features

1. **Password Requirements**: Firebase enforces min 6 characters
2. **Email Verification**: Can be enabled (not required for demo)
3. **Session Tokens**: Auto-managed by Firebase SDK
4. **HTTPS Only**: All auth requests encrypted

### Error Handling

Common errors handled in `getAuthErrorMessage()` (`script.js:746-764`):
- `auth/email-already-in-use` → "Email is already registered"
- `auth/invalid-email` → "Enter valid email"
- `auth/user-not-found` → "No account found"
- `auth/wrong-password` → "Incorrect password"

---

## 3. FIRESTORE DATABASE

### Location
- **File**: `script.js`
- **Functions**: `saveToHistory()` (636-651), `loadUserHistory()` (653-690)
- **Initialization**: `const db = firebase.firestore()`

### What Firestore Is

**NoSQL Document Database**:
- Data stored in **collections** (like tables)
- Each collection contains **documents** (like rows, but flexible)
- Documents store **fields** (key-value pairs, any type)
- Supports **subcollections** (nested data)

### How It Works

**Write Operation (`saveToHistory()`)**:

```javascript
Workflow:
Step 1: Check if user logged in
        if (!currentUser) return;

Step 2: Prepare document data
        const historyDoc = {
          claim: "News claim text",
          label: "fake" | "real" | "uncertain",
          confidence: 0.85,
          explanation: "AI reasoning...",
          sources: [{ title, url }, ...],
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

Step 3: Add to Firestore
        await db.collection('users')
                .doc(currentUser.uid)
                .collection('history')
                .add(historyDoc);

Step 4: Firestore generates unique document ID
        → users/{uid}/history/{auto-generated-id}

Step 5: Data synced to cloud instantly
```

**Read Operation (`loadUserHistory()`)**:

```javascript
Workflow:
Step 1: Check auth
        if (!currentUser) return;

Step 2: Query Firestore
        const snapshot = await db.collection('users')
                                  .doc(currentUser.uid)
                                  .collection('history')
                                  .orderBy('timestamp', 'desc')
                                  .limit(20)
                                  .get();

Step 3: Process results
        snapshot.forEach(doc => {
          const data = doc.data();
          const historyItem = createHistoryItem(data);
          historyList.appendChild(historyItem);
        });

Step 4: Display in UI
```

### NoSQL Features Used

1. **Flexible Schema**
   - Some results have `sources: [...]`, others don't
   - Different confidence score formats
   - Varying explanation lengths
   - No schema migration needed

2. **Subcollections**
   - Each user has their own `history` subcollection
   - Isolated data per user
   - Easy to query one user's data

3. **Server Timestamps**
   - `FieldValue.serverTimestamp()` uses server time
   - Prevents client clock manipulation
   - Consistent ordering

4. **Queries**
   - `orderBy('timestamp', 'desc')` → newest first
   - `limit(20)` → pagination support
   - Could add `where()` filters for search

---

## 4. DATA MODEL & SCHEMA

### Collection Structure

```
firestore/
└── users/
    └── {userId}/                    ← Document (user)
        ├── email: string
        ├── createdAt: timestamp
        └── history/                 ← Subcollection
            └── {historyId}/         ← Document (fact-check)
                ├── claim: string
                ├── label: string
                ├── confidence: number
                ├── explanation: string
                ├── sources: array
                └── timestamp: timestamp
```

### Example Document

```json
{
  "claim": "COVID vaccines contain microchips",
  "label": "fake",
  "confidence": 0.92,
  "explanation": "No credible evidence supports this claim. Multiple fact-checkers have debunked it.",
  "sources": [
    {
      "title": "Snopes - Fact Check",
      "url": "https://snopes.com/fact-check/covid-vaccine-microchip"
    },
    {
      "title": "Reuters Fact Check",
      "url": "https://reuters.com/..."
    }
  ],
  "timestamp": Timestamp(2025, 10, 6, 18, 30, 0)
}
```

### Schema Design Decisions

**1. Embedding vs Referencing**

Decision: **Embed sources** within history documents

```
Option A (Embedded - CHOSEN):
history/{id}
  ├── claim
  ├── sources: [{title, url}, ...]  ← Embedded

Option B (Referenced):
history/{id}
  ├── claim
  ├── sourceIds: ["src1", "src2"]
sources/{src1}  ← Separate collection
  ├── title
  ├── url
```

**Why Embedded?**
- Sources always queried with parent result
- No need to reuse sources across documents
- Faster reads (1 query vs multiple)
- Simpler code

**2. Subcollections vs Top-Level**

Decision: **Subcollections** per user

```
Option A (Subcollections - CHOSEN):
users/{uid}/history/{id}

Option B (Top-level):
history/{id}
  ├── userId: "uid123"
  ├── claim: "..."
```

**Why Subcollections?**
- Automatic data isolation per user
- Security rules simpler: `match /users/{userId}/history/{doc}`
- Easy to delete all user data (GDPR compliance)
- Query performance: index only one user's docs

### Indexing Strategy

**Composite Index** (auto-created by Firebase):
```
Collection: users/{userId}/history
Fields:
  - timestamp (Descending)
Purpose: Enable orderBy + limit queries
```

**Query Example**:
```javascript
.orderBy('timestamp', 'desc').limit(20)
```

Without index → Error  
With index → <50ms response

---

## 5. COMMON VIVA QUESTIONS

### Q1: Why NoSQL instead of SQL?

**Answer**:
"Fact-check results have varying structures—AI responses differ from Google Fact Check responses. In SQL, I'd need either:
1. Many NULL columns for optional fields, or
2. Complex JOIN tables for varying data

NoSQL lets me store flexible JSON documents. Each result can have different fields without schema changes. This speeds development and handles API variations naturally."

---

### Q2: What is a document database?

**Answer**:
"Firestore is a document database where data is stored as JSON-like documents grouped into collections. Unlike SQL rows with fixed columns, documents can have any fields.

Example:
- Collection: `users/{uid}/history`
- Document: `{ claim: '...', label: 'fake', confidence: 0.85 }`

Documents are schema-less, so adding new fields doesn't require migrations."

---

### Q3: How does Firebase Authentication work?

**Answer**:
"Firebase Auth handles the entire auth flow:
1. User submits credentials
2. Firebase SDK sends to Firebase servers
3. Server validates and returns JWT token
4. SDK stores token in localStorage
5. Token auto-refreshes before expiry
6. `onAuthStateChanged()` listener updates UI

Benefits: No backend code needed, secure token management, supports OAuth providers like Google."

---

### Q4: What are subcollections?

**Answer**:
"Subcollections are collections nested inside documents. In my project:
```
users/{userId}          ← Document
  └── history/          ← Subcollection
      └── {historyId}   ← Document
```

Each user document contains a `history` subcollection. This keeps user data isolated and makes queries efficient—I only search one user's history, not all users."

---

### Q5: How do you handle security?

**Answer**:
"Firebase Security Rules restrict access:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/history/{document} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

This rule means:
- Only authenticated users can access data
- Users can only read/write their own history
- `request.auth.uid` must match `{userId}` in path

Prevents data leaks between accounts."

---

### Q6: What happens if two users submit the same claim?

**Answer**:
"Each user gets their own copy in their history subcollection:
```
users/user1/history/abc → { claim: 'X', ... }
users/user2/history/xyz → { claim: 'X', ... }
```

This is intentional because:
1. Users may check the same claim at different times (different results)
2. Personal history is private
3. Simpler than shared history with complex permissions

The backend cache (server.js) prevents duplicate API calls within 5 minutes."

---

### Q7: How do queries work in Firestore?

**Answer**:
"Firestore queries use method chaining:
```javascript
db.collection('users/{uid}/history')
  .orderBy('timestamp', 'desc')  // Sort newest first
  .limit(20)                     // Pagination
  .get()                         // Execute
```

Firestore requires indexes for compound queries. Firebase auto-creates indexes when you run a query in development. For production, you define indexes in `firestore.indexes.json`."

---

### Q8: What is serverTimestamp()?

**Answer**:
"`FieldValue.serverTimestamp()` uses the Firestore server's clock, not the client's.

Benefits:
- Prevents users manipulating timestamps by changing device time
- Ensures consistent ordering across timezones
- Server time is authoritative

Example:
```javascript
timestamp: firebase.firestore.FieldValue.serverTimestamp()
```

When written, Firestore replaces this with actual server time."

---

### Q9: How does real-time sync work?

**Answer**:
"Firestore supports real-time listeners (though I don't use them currently):
```javascript
db.collection('users/{uid}/history')
  .onSnapshot(snapshot => {
    // Auto-called when data changes
    snapshot.forEach(doc => {
      updateUI(doc.data());
    });
  });
```

How it works:
- Client opens WebSocket to Firebase
- Server pushes updates when data changes
- No polling needed

For this project, I use `.get()` (one-time read) since history rarely changes during a session."

---

### Q10: Firestore vs MongoDB?

**Answer**:
| Feature | Firestore | MongoDB |
|---------|-----------|----------|
| Setup | Zero config | Requires Atlas or server |
| Auth Integration | Built-in Firebase Auth | Separate (Passport.js) |
| Real-time | Native WebSocket | Change streams |
| Pricing | Pay-per-read/write | Cluster-based |
| Queries | Limited (no joins) | Powerful aggregation |

"For this project, Firestore's simplicity and Firebase Auth integration made it ideal. MongoDB would require more infrastructure setup."

---

## QUICK REFERENCE FOR VIVA

### 30-Second Pitch
"I used Firebase for authentication and Firestore for storing user history. Firebase Auth handles login/signup with zero backend code. Firestore is a NoSQL document database perfect for varying fact-check result structures. Each user has a subcollection of history documents with flexible schemas. Security rules ensure users only access their own data."

### Key Features
✅ **Zero Backend**: No server management  
✅ **Flexible Schema**: Handles varying AI responses  
✅ **Built-in Auth**: Email/Password + Google OAuth  
✅ **Scalable**: Auto-scales to 100+ users  
✅ **Secure**: Row-level security with auth rules  

### Files to Reference
- `config.js` - Firebase configuration
- `script.js:636-690` - Firestore read/write operations
- `script.js:787-802` - Authentication listeners

---

**Last Updated**: October 2025  
**For**: DSA + NoSQL Database Project Viva  
**Status**: Production Implementation
