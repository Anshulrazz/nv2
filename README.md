# 📱 NOTEXIA MOBILE APP ARCHITECTURE & MASTER API SPECIFICATION

> **Version:** 2.0 (Production Master)  
> **Target Frameworks:** Flutter / React Native / Kotlin Jetpack Compose / Swift SwiftUI  
> **Production Base URL:** `https://notexia.in`  
> **Local Dev Base URL:** `http://10.0.2.2:3000` (Android Emulator) / `http://localhost:3000` (iOS Simulator)  
> **Package Identifier:** `com.notexia.app`  

---

## 📑 TABLE OF CONTENTS
1. [Design System & Color Tokens](#1-design-system--color-tokens)
2. [Global Authentication & Token Lifecycle](#2-global-authentication--token-lifecycle)
3. [Master API Reference (100% Comprehensive)](#3-master-api-reference)
   - [3.1 Authentication & Profile](#31-authentication--profile)
   - [3.2 Notes & Folders (Rich Workspace)](#32-notes--folders-rich-workspace)
   - [3.3 Direct Messages & Real-Time Chat](#33-direct-messages--real-time-chat)
   - [3.4 AI Study Chat & Note-Context Assistant](#34-ai-study-chat--note-context-assistant)
   - [3.5 Community Feed & Social Engagement](#35-community-feed--social-engagement)
   - [3.6 Doubts & Academic Solutions Forum](#36-doubts--academic-solutions-forum)
   - [3.7 Courses, Modules & Quiz Engine](#37-courses-modules--quiz-engine)
   - [3.8 Events, Hackathons & CTF Arena](#38-events-hackathons--ctf-arena)
   - [3.9 Wallet, Coins & Razorpay In-App Purchases](#39-wallet-coins--razorpay-in-app-purchases)
   - [3.10 YouTube AI Lecture Summarizer](#310-youtube-ai-lecture-summarizer)
   - [3.11 Smart Revision & Study Planner](#311-smart-revision--study-planner)
   - [3.12 Media & File Uploads](#312-media--file-uploads)
4. [Mobile Screen Hierarchy & UI Wireframes](#4-mobile-screen-hierarchy--ui-wireframes)
   - [Screen 1: Splash & Dynamic Onboarding](#screen-1-splash--dynamic-onboarding)
   - [Screen 2: Login & Google OAuth](#screen-2-login--google-oauth)
   - [Screen 3: Register & Referral Engine](#screen-3-register--referral-engine)
   - [Screen 4: Home & Smart Dashboard](#screen-4-home--smart-dashboard)
   - [Screen 5: Notes Library & Folder Tree](#screen-5-notes-library--folder-tree)
   - [Screen 6: Rich Text TipTap/Markdown Note Editor](#screen-6-rich-text-tiptapmarkdown-note-editor)
   - [Screen 7: AI Chat Assistant & Notes Context](#screen-7-ai-chat-assistant--notes-context)
   - [Screen 8: Direct Messages & Conversations List](#screen-8-direct-messages--conversations-list)
   - [Screen 9: Direct Message Thread & Media Viewer](#screen-9-direct-message-thread--media-viewer)
   - [Screen 10: Community Social Feed & Post Creator](#screen-10-community-social-feed--post-creator)
   - [Screen 11: Doubts Forum & Solution Thread](#screen-11-doubts-forum--solution-thread)
   - [Screen 12: Course Player & Module Checklist](#screen-12-course-player--module-checklist)
   - [Screen 13: Hackathon & CTF Event Arena](#screen-13-hackathon--ctf-event-arena)
   - [Screen 14: YouTube AI Summarizer & Quiz](#screen-14-youtube-ai-summarizer--quiz)
   - [Screen 15: Wallet, P2P Transfers & Coin Purchase](#screen-15-wallet-p2p-transfers--coin-purchase)
   - [Screen 16: Scholar Leaderboard & Ranks](#screen-16-scholar-leaderboard--ranks)
   - [Screen 17: User Profile, Badges & Stats](#screen-17-user-profile-badges--stats)
   - [Screen 18: Account Settings & Wallpaper Studio](#screen-18-account-settings--wallpaper-studio)

---

# 1. Design System & Color Tokens

Notexia uses an editorial **Chalkboard Dark Aesthetic** with high-contrast tactile accents:

| Token Name | Hex Code | RGB | Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-board` | `#16261D` | `rgb(22, 38, 29)` | Primary App Background |
| `--bg-card` | `#1A2D23` | `rgb(26, 45, 35)` | Surface / Cards / Elevated Panes |
| `--bg-sidebar` | `#121F18` | `rgb(18, 31, 24)` | Bottom Navigation & Modals |
| `--chalk-white` | `#F3F0E4` | `rgb(243, 240, 228)` | Primary Text & High Contrast Icons |
| `--chalk-yellow` | `#F0C93B` | `rgb(240, 201, 59)` | Primary CTA / Active States / Coins |
| `--chalk-coral` | `#F28B6E` | `rgb(242, 139, 110)` | Destructive / Errors / Badges / Shadows |
| `--chalk-blue` | `#8FC3DE` | `rgb(143, 195, 222)` | Secondary Accent / Links / Code |
| `--chalk-lilac` | `#C9A9E0` | `rgb(201, 169, 224)` | AI Assistant / Sparkles / Highlights |
| `--muted-chalk` | `#9FAEA1` | `rgb(159, 174, 161)` | Secondary Subtitles / Inactive Tabs |
| `--border-chalk` | `rgba(243, 240, 228, 0.15)` | — | Borders & Dividers |

### Typography
- **Heading Font:** `Space Grotesk` (Bold / SemiBold)
- **Body Font:** `Plus Jakarta Sans` (Regular / Medium / SemiBold)
- **Code & Numbers:** `JetBrains Mono`
- **Handwritten Accents:** `Kalam`

---

# 2. Global Authentication & Token Lifecycle

```
           📱 Mobile App                            🛡️ Notexia Backend
                │                                           │
                ├─────── POST /api/mobile/auth/login ──────>│
                │        { email, password }                │
                │<─────── Returns { accessToken, ───────────┤
                │                  refreshToken }           │
                │                                           │
 [Store in SecureStorage]                                   │
                │                                           │
                ├─────── GET /api/notes (with Bearer) ─────>│
                │<─────── 200 OK (Data response) ───────────┤
                │                                           │
   [15 Min Expiry]                                          │
                ├─────── GET /api/notes ───────────────────>│
                │<─────── 401 Unauthorized ─────────────────┤
                │                                           │
                ├─────── POST /api/mobile/auth/refresh ────>│
                │        { refreshToken }                   │
                │<─────── Returns { new accessToken, ───────┤
                │                  new refreshToken }       │
```

### Standard Headers
```http
Content-Type: application/json
Authorization: Bearer <accessToken>
Accept: application/json
```

---

# 3. Master API Reference

---

## 3.1 Authentication & Profile

### `POST /api/mobile/auth/register`
Creates a brand new user account with default wallet initialization.
- **Request Body:**
```json
{
  "name": "Arjun Sharma",
  "email": "arjun@example.com",
  "password": "SecurePassword123!",
  "referralCode": "REF-9921"
}
```
- **Response (201 Created):**
```json
{
  "user": {
    "id": "66bc42f1a910bc41d2001",
    "name": "Arjun Sharma",
    "email": "arjun@example.com",
    "role": "user",
    "image": null,
    "points": 50,
    "coins": 100
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refreshToken": "8fbc910a29ef1920ac34...",
    "expiresIn": 900
  }
}
```

---

### `POST /api/mobile/auth/login`
Authenticates email and password.
- **Request Body:**
```json
{
  "email": "arjun@example.com",
  "password": "SecurePassword123!"
}
```
- **Response (200 OK):** Same structure as registration with valid tokens.

---

### `POST /api/mobile/auth/refresh`
Rotates and generates a fresh JWT access token.
- **Request Body:**
```json
{
  "refreshToken": "8fbc910a29ef1920ac34..."
}
```
- **Response (200 OK):**
```json
{
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refreshToken": "9ac1820bdf1920fe1234...",
    "expiresIn": 900
  }
}
```

---

### `GET /api/mobile/auth/me`
Fetches authenticated user identity, coins, and premium tier.
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response (200 OK):**
```json
{
  "user": {
    "id": "66bc42f1a910bc41d2001",
    "name": "Arjun Sharma",
    "email": "arjun@example.com",
    "role": "user",
    "image": "https://lh3.googleusercontent.com/a/...",
    "points": 450,
    "coins": 1200,
    "isPremiumUser": true,
    "creatorEarnings": 340.50
  }
}
```

---

### `PATCH /api/user/profile`
Updates username, profile picture, or public visibility.
- **Request Body:**
```json
{
  "name": "Arjun Sharma (Pro)",
  "image": "https://res.cloudinary.com/notexia/avatar123.jpg",
  "isPublic": true
}
```
- **Response (200 OK):** Updated user object.

---

## 3.2 Notes & Folders (Rich Workspace)

### `GET /api/notes`
Fetches notes filtered by query parameters.
- **Query Params:**
  - `folderId` *(optional, string)*: Filter notes inside specific folder.
  - `isFavorite` *(optional, boolean)*: Fetch only starred notes.
  - `isTrashed` *(optional, boolean)*: `true` for trash bin, `false` for active.
- **Response (200 OK):**
```json
[
  {
    "_id": "66bc89100234acfe",
    "title": "Quantum Mechanics & Superposition",
    "content": {
      "type": "doc",
      "content": [
        { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Wavefunctions" }] },
        { "type": "paragraph", "content": [{ "type": "text", "text": "Schrodinger equation describes time evolution." }] }
      ]
    },
    "folderId": "66folder1234",
    "userId": "66bc42f1a910bc41d2001",
    "isFavorite": true,
    "isTrashed": false,
    "published": true,
    "tags": ["Physics", "JEE Advanced"],
    "category": "Physics",
    "coverImage": "https://images.unsplash.com/photo-1635070041078",
    "wordCount": 840,
    "updatedAt": "2026-08-20T09:12:00.000Z"
  }
]
```

---

### `POST /api/notes`
Creates a new note.
- **Request Body:**
```json
{
  "title": "Electromagnetic Induction Class 12",
  "content": { "type": "doc", "content": [] },
  "folderId": null,
  "tags": ["Physics", "Electromagnetism"],
  "category": "Science"
}
```
- **Response (201 Created):** Created note object.

---

### `PUT /api/notes/:id`
Updates title, rich content, favorite status, or moves to trash.
- **Request Body:**
```json
{
  "title": "Updated Title",
  "content": { "type": "doc", "content": [...] },
  "isFavorite": true,
  "isTrashed": false
}
```
- **Response (200 OK):** Updated note JSON.

---

### `DELETE /api/notes/:id`
Permanently deletes or moves note to trash.
- **Response (200 OK):** `{"message": "Note deleted permanently"}`

---

### `GET /api/folders`
Lists all folders created by the user.
- **Response (200 OK):**
```json
[
  {
    "_id": "66folder1234",
    "name": "Physics — Semester 1",
    "color": "#F0C93B",
    "icon": "Atom",
    "notesCount": 14
  }
]
```

---

### `POST /api/folders`
Creates a folder container.
- **Request Body:**
```json
{
  "name": "Organic Chemistry",
  "color": "#8FC3DE"
}
```

---

## 3.3 Direct Messages & Real-Time Chat

### `GET /api/messages/conversations`
Retrieves chat threads sorted by most recent message.
- **Response (200 OK):**
```json
[
  {
    "otherUser": {
      "_id": "66user9876",
      "name": "Priya Patel",
      "image": "https://lh3.googleusercontent.com/...",
      "email": "priya@notexia.in"
    },
    "lastMessage": {
      "_id": "66msg54321",
      "content": "Can you share the formula sheet PDF?",
      "attachments": [],
      "createdAt": "2026-08-20T09:25:00.000Z",
      "isRead": false
    },
    "unreadCount": 2
  }
]
```

---

### `GET /api/messages?userId=:targetUserId`
Fetches all historical direct messages in a 1-on-1 thread.
- **Response (200 OK):**
```json
{
  "messages": [
    {
      "_id": "66msg1001",
      "senderId": "66user9876",
      "receiverId": "66bc42f1a910bc41d2001",
      "content": "Check out this diagram",
      "attachments": [
        {
          "url": "https://res.cloudinary.com/notexia/image/upload/diag.png",
          "type": "image",
          "name": "diagram.png"
        }
      ],
      "isRead": true,
      "createdAt": "2026-08-20T09:20:00.000Z",
      "repliedTo": null
    }
  ],
  "isTyping": false
}
```

---

### `POST /api/messages`
Sends a text message with optional attachments & reply quotes.
- **Request Body:**
```json
{
  "receiverId": "66user9876",
  "content": "Here is the solution!",
  "attachments": [
    {
      "url": "https://res.cloudinary.com/notexia/docs/notes.pdf",
      "type": "file",
      "name": "notes.pdf"
    }
  ],
  "repliedTo": {
    "messageId": "66msg1001",
    "content": "Check out this diagram",
    "senderName": "Priya"
  }
}
```
- **Response (200 OK):** Complete saved Message Node.

---

### `POST /api/messages/typing`
Sends ephemeral typing event via Pusher.
- **Request Body:**
```json
{
  "recipientId": "66user9876"
}
```

---

### `DELETE /api/messages/:id`
Deletes a specific message.
- **Response (200 OK):** `{"message": "Message deleted"}`

---

## 3.4 AI Study Chat & Note-Context Assistant

### `GET /api/chats`
Lists user's AI conversations.
- **Response (200 OK):**
```json
[
  {
    "_id": "66aichat001",
    "title": "Thermodynamics Carnot Cycle Breakdown",
    "updatedAt": "2026-08-20T08:30:00.000Z"
  }
]
```

---

### `POST /api/chat`
Streams or generates Claude AI response with optional active note context.
- **Request Body:**
```json
{
  "chatId": "66aichat001",
  "message": "Explain how efficiency changes with temperature ratio in Carnot engine.",
  "contextNoteContent": "Note raw text context if user attached note..."
}
```
- **Response:** Server-Sent Events (SSE) `data: {"text": "..."}` or JSON reply.

---

## 3.5 Community Feed & Social Engagement

### `GET /api/community`
Fetches global student feed with pagination.
- **Query Params:** `page=1&limit=20`
- **Response (200 OK):**
```json
{
  "posts": [
    {
      "_id": "66post990",
      "author": {
        "_id": "66author123",
        "name": "Vikram Singh",
        "image": "https://...",
        "role": "student"
      },
      "content": "Complete handwritten Mindmaps for Inorganic Chemistry are live!",
      "images": ["https://res.cloudinary.com/notexia/mindmap1.jpg"],
      "likesCount": 89,
      "commentsCount": 14,
      "isLiked": true,
      "createdAt": "2026-08-20T07:15:00.000Z"
    }
  ],
  "hasMore": true
}
```

---

### `POST /api/community`
Publishes a community post.
- **Request Body:**
```json
{
  "content": "Just solved 50 advanced calculus problems today! 🔥",
  "images": []
}
```

---

### `POST /api/community/:id/like`
Toggles like on a post.
- **Response (200 OK):**
```json
{
  "liked": true,
  "likesCount": 90
}
```

---

## 3.6 Doubts & Academic Solutions Forum

### `GET /api/doubts`
Lists academic questions filtered by subject or resolution state.
- **Query Params:** `subject=Physics&status=open`
- **Response (200 OK):**
```json
[
  {
    "_id": "66doubt771",
    "title": "Why is work done zero in a cyclic isothermal process?",
    "description": "In delta U = Q - W, why does temperature remain constant?",
    "subject": "Physics",
    "author": { "name": "Rohan", "image": "..." },
    "upvotesCount": 12,
    "repliesCount": 3,
    "isResolved": false,
    "createdAt": "2026-08-20T06:00:00.000Z"
  }
]
```

---

### `POST /api/doubts`
Submits a student doubt.
- **Request Body:**
```json
{
  "title": "Finding limit of (sin x - x)/x^3 as x approaches 0",
  "description": "Used L'Hopital rule twice but got confused with signs.",
  "subject": "Mathematics",
  "images": ["https://res.cloudinary.com/notexia/doubt_img.jpg"]
}
```

---

### `POST /api/doubts/:id/reply`
Answers a doubt.
- **Request Body:**
```json
{
  "content": "Using Taylor series expansion: sin x = x - x^3/6 + ... hence limit is -1/6."
}
```

---

## 3.7 Courses, Modules & Quiz Engine

### `GET /api/courses`
Lists all available structured video & study courses.
- **Response (200 OK):**
```json
[
  {
    "_id": "66course001",
    "title": "Complete Modern Physics Masterclass",
    "description": "Photoelectric effect, Bohr atom, and Nuclear physics.",
    "thumbnail": "https://images.unsplash.com/photo-1507668077129-56e32842fceb",
    "instructor": { "name": "Dr. H. C. Verma", "image": "..." },
    "priceCoins": 300,
    "isEnrolled": true,
    "totalModules": 12,
    "completedModules": 5
  }
]
```

---

### `POST /api/courses/:id/enroll`
Enrolls the user using coins.
- **Response (200 OK):** `{"success": true, "message": "Enrolled in course"}`

---

## 3.8 Events, Hackathons & CTF Arena

### `GET /api/events`
Fetches hackathons, workshops, and cybersecurity CTFs.
- **Query Params:** `type=hackathon` *(or `ctf` / `workshop`)*
- **Response (200 OK):**
```json
[
  {
    "_id": "66event999",
    "name": "Notexia AI Hackathon 2026",
    "slug": "notexia-ai-hackathon-2026",
    "type": "hackathon",
    "description": "Build agentic AI workflows for students.",
    "bannerUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
    "prizePool": "₹1,00,000",
    "eventStart": "2026-08-25T10:00:00.000Z",
    "eventEnd": "2026-08-26T18:00:00.000Z",
    "registrationEnd": "2026-08-24T23:59:59.000Z",
    "isRegistered": true,
    "teamMode": "team",
    "maxTeamSize": 4
  }
]
```

---

### `POST /api/events/:id/register`
Registers solo or team for an event.
- **Request Body:**
```json
{
  "realName": "Arjun Sharma",
  "teamName": "CyberKnights",
  "teamMembers": ["sarah@notexia.in", "rohit@notexia.in"]
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "codename": "TEAM-CYBERKNIGHTS-841",
  "message": "Team registration confirmed"
}
```

---

### `POST /api/events/:id/submissions`
Submits hackathon project links and documentation.
- **Request Body:**
```json
{
  "title": "StudyAgent — Autonomous Revision Companion",
  "description": "An autonomous AI engine that turns audio lectures into structured flashcards.",
  "trackId": "66track101",
  "repoUrl": "https://github.com/arjun/study-agent",
  "demoUrl": "https://studyagent.vercel.app",
  "videoUrl": "https://youtube.com/watch?v=demo123",
  "deckUrl": "https://docs.google.com/presentation/d/deck123"
}
```
- **Response (200 OK):** Saved submission object.

---

### `POST /api/events/:id/challenges/:cid/submit`
Submits flag in a CTF competition.
- **Request Body:**
```json
{
  "flag": "NOTEXIA{c7f_m4573r_50lv3d}"
}
```
- **Response (200 OK):**
```json
{
  "correct": true,
  "pointsAwarded": 250,
  "rank": 4
}
```

---

## 3.9 Wallet, Coins & Razorpay In-App Purchases

### `GET /api/wallet/me`
Fetches user wallet address, coin balance, and transactions.
- **Response (200 OK):**
```json
{
  "wallet": {
    "address": "NTX-882194",
    "coins": 1250,
    "earningsINR": 820.00,
    "hasPassword": true
  },
  "recentTransactions": [
    {
      "id": "tx_01",
      "type": "reward",
      "amount": 100,
      "description": "Hackathon 2nd Place Prize",
      "createdAt": "2026-08-19T18:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/wallet/transfer`
Sends coins P2P to another student by wallet address.
- **Request Body:**
```json
{
  "recipientAddress": "NTX-102948",
  "amount": 150,
  "walletPassword": "MySecureWalletPassword"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "transactionId": "tx_99281",
  "remainingBalance": 1100
}
```

---

### `POST /api/razorpay/create-order`
Initializes Razorpay INR order for purchasing coins or Pro subscriptions.
- **Request Body:**
```json
{
  "type": "buy_coins",
  "amountINR": 499,
  "coinsDelivered": 1000
}
```
- **Response (200 OK):**
```json
{
  "orderId": "order_PV98129384",
  "amount": 49900,
  "currency": "INR",
  "keyId": "rzp_live_..."
}
```

---

## 3.10 YouTube AI Lecture Summarizer

### `POST /api/youtube-summarizer/generate`
Transcribes, summarizes, and generates an automated quiz for any educational video.
- **Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=0hKsmYq3V2E"
}
```
- **Response (200 OK):**
```json
{
  "videoId": "0hKsmYq3V2E",
  "title": "Quantum Entanglement Explained",
  "durationSeconds": 720,
  "summary": "### Core Principles\nQuantum entanglement describes...",
  "keyPoints": [
    "Bell's theorem disproves local hidden variables",
    "Spooky action at a distance occurs instantaneously"
  ],
  "quiz": [
    {
      "question": "What did Einstein call entanglement?",
      "options": ["Cosmic connection", "Spooky action at a distance", "Quantum slip", "Relativity error"],
      "correctIndex": 1,
      "explanation": "Einstein famously dubbed it 'spooky action at a distance'."
    }
  ]
}
```

---

### `POST /api/youtube-summarizer/:videoId/save-to-notes`
1-Tap conversion of video summary into an editable user Note.
- **Response (200 OK):**
```json
{
  "noteId": "66note77890",
  "message": "Summary saved to your notes library"
}
```

---

## 3.11 Smart Revision & Study Planner

### `POST /api/revision/generate`
Generates active recall flashcards and high-yield revision points.
- **Request Body:**
```json
{
  "topic": "Organic Chemistry Reaction Mechanisms",
  "examType": "JEE Advanced"
}
```
- **Response (200 OK):**
```json
{
  "topic": "Organic Chemistry Reaction Mechanisms",
  "flashcards": [
    { "front": "SN1 Reaction Rate Determining Step", "back": "Formation of carbocation intermediate." }
  ],
  "highYieldPoints": ["Carbocation rearrangement occurs in SN1, E1."]
}
```

---

## 3.12 Media & File Uploads

### `POST /api/upload`
Uploads images, videos, and PDF documents.
- **Headers:** `Content-Type: multipart/form-data`
- **Form Data:** `file: (Binary file)`
- **Response (200 OK):**
```json
{
  "url": "https://res.cloudinary.com/notexia/image/upload/v1724140000/note_asset.png"
}
```

---

# 4. Mobile Screen Hierarchy & UI Wireframes

---

## Screen 1: Splash & Dynamic Onboarding
- **Layout:** Full screen with animated ambient mesh background (`#16261D` with subtle `#8FC3DE` glow).
- **Widgets:**
  - Animated Notexia Emblem with gold pulse.
  - Heading: `"NOTEXIA"` in `Space Grotesk`.
  - Subtitle: `"Your Intelligent Study Workspace"`.
  - 3-Slide Carousel: Smart Notes · AI Lecture Summaries · Hackathons & Community.
  - CTAs: Large Yellow Button `"Get Started"` & Outline Button `"Log In"`.

---

## Screen 2: Login & Google OAuth
- **Top:** Back arrow, Chalkboard header.
- **Inputs:**
  - Email text field with validation.
  - Password field with show/hide toggle icon.
  - `"Forgot Password?"` link.
- **Action Buttons:**
  - `"Sign In"` (Solid yellow with coral drop shadow).
  - Divider: `"OR CONTINUE WITH"`.
  - Google Sign-In button with official branding.

---

## Screen 3: Register & Referral Engine
- **Inputs:** Full Name, Email, Password, Referral Code (Optional).
- **Real-Time Validation:** Password strength pill bar (Red → Amber → Green).
- **Referral Perk Banner:** `"+50 Free Coins for using a friend's referral code"`.

---

## Screen 4: Home & Smart Dashboard (Tab 1)
- **Header:** User Avatar, `"Good Morning, Arjun!"`, Notification Bell with red badge, Coins pill (`🟡 1,250 NTX`).
- **Quick Action Carousel:**
  1. ⚡ **YouTube AI Summarizer**
  2. 📝 **New Note**
  3. 🤖 **Ask AI Claude**
  4. 📅 **Revision Planner**
- **Section: "Jump Back In"**: Horizontal scroll cards of recently edited notes with progress bar.
- **Section: "Trending in Community"**: Top 3 viral notes with upvote counter and author chips.

---

## Screen 5: Notes Library & Folder Tree (Tab 2)
- **Top Bar:** Search icon, Grid/List view toggle, Filter Chips (`All`, `Starred`, `Physics`, `Math`, `Trash`).
- **Folder Carousel:** Horizontal folders with custom color pills.
- **Note Cards (2-Column Staggered Grid):**
  - Cover image thumbnail.
  - Note Title in bold `Plus Jakarta Sans`.
  - Category pill badge.
  - 2-line snippet preview.
  - Last edited time & word count.
- **FAB (Floating Action Button):** Gold `+` button in bottom-right corner.

---

## Screen 6: Rich Text TipTap/Markdown Note Editor
- **Header:** Back button, Title input field, Cloud Save Status indicator (`"Saved ✓"`), Action Menu (Export PDF, Share, AI Assist).
- **Editing Canvas:** Full-height text area supporting LaTeX math formulas (`$E = mc^2$`), code blocks, checklist tasks, and inline images.
- **Sticky Bottom Toolbar:**
  - `H1`, `H2`, `B`, `I`, `Code`, `Formula`, `List`, `Image Upload`, `Voice Dictation`.

---

## Screen 7: AI Chat Assistant & Notes Context (Tab 3)
- **Top Header:** AI Avatar (`Sparkles` icon), `"Notexia AI Study Copilot"`, Model Badge (`Claude 3.5 Sonnet`), Context Selector (`"📎 Attach Note: Physics Ch.1"`).
- **Chat Feed:** Isolated scrollable messages container.
  - User prompts in gold bubbles.
  - AI responses in dark elevated cards with full code syntax highlighting & KaTeX math rendering.
- **Bottom Input Bar:** Message input, photo attachment trigger, Send arrow button.

---

## Screen 8: Direct Messages & Conversations List (Tab 4)
- **Header:** `"Direct Messages"`, Search bar for scholars/teachers.
- **Conversation Tiles:**
  - Round avatar with online green dot.
  - Contact Name & Timestamp.
  - Last message snippet with bold style if unread.
  - Unread badge counter (`🟡 3`).

---

## Screen 9: Direct Message Thread & Media Viewer
- **Header:** Contact name, avatar, Voice Call button, Video Call button, 3-dots Menu (Clear Chat, Wallpaper Theme).
- **Message Area:**
  - WhatsApp/Telegram-style speech bubbles.
  - Swipe-right on any bubble to trigger quote reply.
  - Tap image to open full-screen Lightbox Gallery with zoom and download.
- **Bottom Bar:**
  - Attachment Picker (`Photos`, `Videos`, `PDFs`).
  - Text field with real-time typing indicator.
  - Send button with tactile haptic feedback.

---

## Screen 10: Community Social Feed & Post Creator
- **Top Bar:** Filter tabs: `"Global"`, `"Following"`, `"My College"`.
- **Feed Card:**
  - Author Avatar, Name, Role badge (`"Teacher"` / `"Scholar"`), Post timestamp.
  - Rich text body with hashtag detection.
  - Image grid / carousel.
  - Action footer: Like Button (Heart with burst animation), Comments Count, Share, Bookmark.

---

## Screen 11: Doubts Forum & Solution Thread
- **Subject Filters:** Horizontal chips (`Physics`, `Chemistry`, `Math`, `Computer Science`).
- **Doubt Card:**
  - Title & Question summary.
  - Image preview thumbnail.
  - `"Solve Doubt"` CTA button.
  - Solution status: Green checkmark for `"Resolved"`.

---

## Screen 12: Course Player & Module Checklist
- **Top:** Embedded video player with speed controls (0.75x to 2.0x) and picture-in-picture.
- **Bottom Tabs:**
  - **Modules:** List of video lessons with completion checkmarks.
  - **Resources:** Downloadable lecture notes PDF & source code.
  - **Discussion:** Live lesson Q&A thread.

---

## Screen 13: Hackathon & CTF Event Arena
- **Header:** Event banner, Live Countdown Timer (with red urgency pulse at `<10m`), Team Codename badge.
- **Arena Modes (Auto-switched by event type):**
  - **Hackathon Mode:**
    - Track selector carousel.
    - Project submission form (Title, Description, GitHub Repo URL, Live Demo URL, Video URL, Deck URL).
    - Status indicator: `"Draft Saved"` or `"Submitted"`.
  - **CTF Mode:**
    - Category pills (`Web`, `Crypto`, `Reverse`, `Forensics`).
    - Flag Input: `NOTEXIA{...}` with instant solve animation.
    - Live leaderboard ranks.

---

## Screen 14: YouTube AI Summarizer & Quiz
- **Input Area:** Paste YouTube URL field + `"Summarize Video"` button.
- **Output Cards:**
  - Video Thumbnail & Title.
  - AI Executive Summary with key concept breakdown.
  - Interactive 5-Question Quiz: Multiple choice options with instant correct/wrong explanations.
  - `"Save to My Notes"` 1-tap button.

---

## Screen 15: Wallet, P2P Transfers & Coin Purchase
- **Gold Balance Card:**
  - Current coins balance (`🟡 1,250 NTX`).
  - INR Earnings (`₹820.00`).
  - Wallet ID (`NTX-882194`) with 1-tap copy button.
- **Actions:**
  - `"Send Coins"` (Opens modal for recipient ID, amount & wallet password).
  - `"Add Coins"` (Opens Razorpay payment sheet).
  - `"Withdraw Earnings"` (Direct UPI / Bank transfer).
- **Transaction History:** List of debit/credit entries with timestamps.

---

## Screen 16: Scholar Leaderboard & Ranks
- **Podium View:** Top 3 students on visual pedestals (Gold, Silver, Bronze badges).
- **Global Rank List:** Infinite scroll list showing user rank, total study points, streaks, and university badge.

---

## Screen 17: User Profile, Badges & Stats
- **Header:** Profile Photo, Name, Email, Bio, College Name.
- **Achievements Grid:**
  - 🏆 **Hackathon Winner**
  - 📚 **100 Notes Published**
  - ⚡ **30-Day Study Streak**
  - 💡 **Master Doubt Solver**
- **Tabs:** `"My Published Notes"`, `"Shared Roadmaps"`, `"Activity"`.

---

## Screen 18: Account Settings & Wallpaper Studio
- **Settings List:**
  - Edit Profile Information.
  - Chat Wallpaper Studio (Preset chalkboard colors, cyber gradients, custom image picker).
  - Notification Preferences (Push, Email).
  - Security & Change Password.
  - Privacy & Public Profile Toggle.
  - App Version & Log Out Button (Red highlight).

---

# 5. Production Readiness & Security Checklist for Mobile

1. **Token Persistence:** Always save `refreshToken` using OS-level secure storage (`FlutterSecureStorage` on Flutter or `Keychain` / `Keystore` on React Native/Native).
2. **Auto-Retry on 401:** Implement an HTTP Interceptor (Dio/Axios) that catches `401 Unauthorized`, pauses queue, calls `/api/mobile/auth/refresh`, and retries the original request.
3. **Pusher Real-Time Sync:** Connect to Pusher channel `user-<userId>` to listen for live `new-message`, `message-updated`, and `notification` events.
4. **Offline Caching:** Cache notes list and user profile locally (Hive/SQLite/WatermelonDB) to allow instant startup rendering before network refresh.


