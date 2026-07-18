# Notexia API Documentation (Detailed)

This document outlines the available REST API endpoints for the Notexia backend, including request and response details.

## Admin Endpoints

### `/api/admin/audit-logs`

#### GET

**Responses:**
- `Object { error, status }`
- `logs`

### `/api/admin/export`

#### GET

**Query Parameters:**
- `target`

**Responses:**
- `Object { error, status }`

### `/api/admin/moderation`

#### GET

**Responses:**
- `Object { error, status }`
- `Object { notes, comments }`

#### PATCH

**Request Body:**
- `targetId`
- `targetType`
- `action`

**Responses:**
- `Object { error, status }`
- `Object { message }`

### `/api/admin/settings`

#### GET

**Responses:**
- `{ ...defaults, ...config }...`
- `Object { error, status }`

#### PATCH

**Request Body:**
- `key`
- `value`

**Responses:**
- `Object { error, status }`
- `setting`

### `/api/admin/stats`

#### GET

**Query Parameters:**
- `interval`

**Responses:**
- `Object { error, status }`
- `Object { totals, users, notes, forums, doubts }`

### `/api/admin/users`

#### GET

**Responses:**
- `Object { error, status }`
- `users`

#### DELETE

**Query Parameters:**
- `targetUserId`

**Responses:**
- `Object { error, status }`
- `Object { message }`

#### PATCH

**Request Body:**
- `targetUserId`
- `action`
- `role`

**Responses:**
- `Object { error, status }`
- `targetUser`

## Auth Endpoints

### `/api/auth/[...nextauth]`

### `/api/auth/signup`

#### POST

**Request Body:**
- `JSON Payload Object`
- `(Validated via Zod Schema)`

**Responses:**
- `Object { error, status }`
- `{        message: "User registered successfully."`

## Blogs Endpoints

### `/api/blogs/[id]`

#### GET

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `blog`

#### DELETE

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { message }`

#### PATCH

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `title`
- `content`
- `summary`
- `coverImage`
- `published`

**Responses:**
- `Object { error, status }`
- `blog`

### `/api/blogs`

#### GET

**Query Parameters:**
- `userOnly`

**Responses:**
- `Object { error, status }`
- `blogs`

#### POST

**Request Body:**
- `title`
- `content`
- `summary`
- `coverImage`
- `published`

**Responses:**
- `Object { error, status }`
- `blog`

## Bookmarks Endpoints

### `/api/bookmarks/[id]`

#### DELETE

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { message }`

### `/api/bookmarks`

#### GET

**Responses:**
- `Object { error, status }`
- `bookmarks`

#### POST

**Request Body:**
- `title`
- `url`
- `category`

**Responses:**
- `Object { error, status }`
- `bookmark`

## Certificates Endpoints

### `/api/certificates/[id]`

#### GET

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { studentName, courseName, instructorName, completedAt, certificateId }`

## Chat Endpoints

### `/api/chat`

#### POST

**Request Body:**
- `message`
- `chatId`
- `contextNoteContent`

**Responses:**
- `Object { error, status }`

## Chats Endpoints

### `/api/chats/[id]`

#### DELETE

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { message }`

#### PATCH

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `title`

**Responses:**
- `Object { error, status }`
- `chat`

### `/api/chats`

#### GET

**Responses:**
- `Object { error, status }`
- `chats`

#### POST

**Request Body:**
- `title`

**Responses:**
- `Object { error, status }`
- `chat`

## Community Endpoints

### `/api/community/[id]/comments`

#### POST

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `content`

**Responses:**
- `Object { error, status }`
- `post`

### `/api/community/[id]/like`

#### POST

**Path Parameters:**
- `id` (Required)

**Request Body:** (Required payload)

**Responses:**
- `Object { error, status }`
- `post`

### `/api/community/[id]`

#### PUT

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `content`
- `mediaUrl`
- `mediaType`

**Responses:**
- `Object { error, status }`
- `Object { error, Forbidden, status }`
- `post`

#### DELETE

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { error, Forbidden, status }`
- `Object { success }`

### `/api/community`

#### GET

**Responses:**
- `Object { error, status }`
- `posts`

#### POST

**Request Body:**
- `content`
- `mediaUrl`
- `mediaType`

**Responses:**
- `Object { error, status }`
- `post`

## Courses Endpoints

### `/api/courses/[id]/progress`

#### GET

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { completedLessons, quizScores, isCompleted }`
- `progress`

#### POST

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `lessonKey`
- `score`
- `total`

**Responses:**
- `Object { error, status }`
- `progress`

### `/api/courses/[id]`

#### GET

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `course`

#### PUT

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `JSON Payload Object`

**Responses:**
- `Object { error, status }`
- `updatedCourse`

#### DELETE

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { message }`

### `/api/courses`

#### GET

**Query Parameters:**
- `instructorOnly`

**Responses:**
- `Object { error, status }`
- `courses`

#### POST

**Request Body:**
- `title`
- `description`
- `thumbnail`
- `isPublished`
- `modules`

**Responses:**
- `Object { error, status }`
- `course`

## Dashboard Endpoints

### `/api/dashboard/stats`

#### GET

**Responses:**
- `Object { error, status }`
- `Object { points }`

## Doubts Endpoints

### `/api/doubts/[id]`

#### DELETE

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { message }`

#### PATCH

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `status`

**Responses:**
- `Object { error, status }`
- `doubt`

### `/api/doubts`

#### GET

**Query Parameters:**
- `userOnly`

**Responses:**
- `Object { error, status }`
- `doubts`

#### POST

**Request Body:**
- `title`
- `content`

**Responses:**
- `Object { error, status }`
- `doubt`

## Feed Endpoints

### `/api/feed/[id]/comment`

#### GET

**Path Parameters:**
- `id` (Required)

**Responses:**
- `comments`
- `Object { error, status }`

#### POST

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `content`
- `parentId`

**Responses:**
- `Object { error, status }`
- `newComment`

#### PATCH

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `commentId`
- `action`

**Responses:**
- `Object { error, status }`
- `comment`

### `/api/feed/[id]/flag`

#### POST

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `commentId`

**Responses:**
- `Object { error, status }`
- `Object { message }`

### `/api/feed/[id]/repost`

#### POST

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `commentary`

**Responses:**
- `Object { error, status }`
- `newRepost`

### `/api/feed`

#### GET

**Query Parameters:**
- `sort`
- `search`
- `tag`
- `category`
- `page`
- `limit`

**Responses:**
- `Object { error, status }`
- `posts`

## Folders Endpoints

### `/api/folders/[id]`

#### DELETE

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { message }`

#### PATCH

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `name`
- `color`
- `parentId`

**Responses:**
- `Object { error, status }`
- `folder`

### `/api/folders`

#### GET

**Responses:**
- `Object { error, status }`
- `folders`

#### POST

**Request Body:**
- `name`
- `parentId`
- `color`

**Responses:**
- `Object { error, status }`
- `folder`

## Forums Endpoints

### `/api/forums/[id]/comments`

#### POST

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `content`

**Responses:**
- `Object { error, status }`
- `post`

### `/api/forums/[id]`

#### DELETE

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { message }`

### `/api/forums/[id]/upvote`

#### POST

**Path Parameters:**
- `id` (Required)

**Request Body:** (Required payload)

**Responses:**
- `Object { error, status }`
- `post`

### `/api/forums`

#### GET

**Query Parameters:**
- `category`

**Responses:**
- `Object { error, status }`
- `posts`

#### POST

**Request Body:**
- `title`
- `content`
- `category`
- `mediaUrl`
- `mediaType`

**Responses:**
- `Object { error, status }`
- `post`

## Leaderboard Endpoints

### `/api/leaderboard`

#### GET

**Responses:**
- `Object { error, status }`
- `leaderboard`

## Messages Endpoints

### `/api/messages/conversations`

#### GET

**Responses:**
- `Object { error, status }`
- `results`

### `/api/messages`

#### GET

**Query Parameters:**
- `userId`

**Responses:**
- `Object { error, status }`
- `{...`

#### POST

**Request Body:**
- `receiverId`
- `content`
- `attachments`

**Responses:**
- `Object { error, status }`
- `newMessage`

### `/api/messages/typing`

#### POST

**Request Body:**
- `recipientId`

**Responses:**
- `Object { error, status }`
- `Object { success }`

## Notes Endpoints

### `/api/notes/[id]/history`

#### GET

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `note.versionHistory || []`

#### POST

**Path Parameters:**
- `id` (Required)

**Request Body:** (Required payload)

**Responses:**
- `Object { error, status }`
- `Object { message, history }`

#### PATCH

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `versionId`

**Responses:**
- `Object { error, status }`
- `note`

### `/api/notes/[id]/publish`

#### PATCH

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `published`
- `tags`
- `category`
- `coverImage`
- `seoTitle`
- `seoDescription`
- `scheduledAt`
- `isPinned`

**Responses:**
- `Object { error, status }`
- `note`

### `/api/notes/[id]`

#### GET

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `note`

#### DELETE

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { message }`

#### PATCH

**Path Parameters:**
- `id` (Required)

**Request Body:**
- `title`
- `content`
- `folderId`
- `isFavorite`
- `isTrashed`
- `assetUrl`
- `assetName`

**Responses:**
- `Object { error, status }`
- `note`

### `/api/notes/[id]/upvote`

#### POST

**Path Parameters:**
- `id` (Required)

**Request Body:** (Required payload)

**Responses:**
- `Object { error, status }`
- `note`

### `/api/notes`

#### GET

**Query Parameters:**
- `folderId`
- `isFavorite`
- `isTrashed`

**Responses:**
- `Object { error, status }`
- `notes`

#### POST

**Request Body:**
- `title`
- `folderId`

**Responses:**
- `Object { error, status }`
- `note`

## Notifications Endpoints

### `/api/notifications`

#### GET

**Responses:**
- `Object { error, status }`
- `list`

#### PATCH

**Request Body:** (Required payload)

**Responses:**
- `Object { error, status }`
- `Object { message }`

## Research Endpoints

### `/api/research`

#### GET

**Responses:**
- `Object { error, status }`
- `papers`

#### POST

**Request Body:**
- `title`
- `authors`
- `abstract`
- `fileUrl`

**Responses:**
- `Object { error, status }`
- `paper`

## Upload Endpoints

### `/api/upload/avatar`

#### POST

**Request Body:** (Required payload)

**Responses:**
- `Object { error, status }`
- `Object { url }`

### `/api/upload`

#### POST

**Request Body:** (Required payload)

**Responses:**
- `Object { error, status }`
- `{ url }...`

## User Endpoints

### `/api/user/[id]/follow`

#### GET

**Path Parameters:**
- `id` (Required)

**Responses:**
- `Object { error, status }`
- `Object { isFollowing }`

#### POST

**Path Parameters:**
- `id` (Required)

**Request Body:** (Required payload)

**Responses:**
- `Object { error, status }`
- `Object { isFollowing }`

### `/api/user/password`

#### PATCH

**Request Body:**
- `currentPassword`
- `newPassword`

**Responses:**
- `Object { error, status }`
- `Object { message }`

### `/api/user/profile`

#### GET

**Responses:**
- `Object { error, status }`
- `user`

#### PATCH

**Request Body:**
- `name`
- `image`
- `isPublic`

**Responses:**
- `Object { error, status }`
- `updatedUser`

### `/api/user`

#### GET

**Query Parameters:**
- `query`
- `userId`

**Responses:**
- `Object { error, status }`
- `user ? [user] : []`
- `users`

## Mobile Auth Endpoints

> These endpoints use **JWT Bearer Authentication** (not Auth.js sessions).
> They are designed exclusively for the Flutter mobile application.
> All responses follow the format `{ success, ... }`.

### `/api/mobile/auth/login`

#### POST

**Description:** Authenticate a user with email and password. Returns JWT access token and refresh token.

**Rate Limited:** 5 attempts per minute per IP.

**Request Body:**
- `email` (Required) — User's email address
- `password` (Required) — User's password
- `deviceId` (Optional) — Client device identifier
- `deviceName` (Optional) — Human-readable device name (e.g., "iPhone 15 Pro")
- `platform` (Optional) — `"ios"` | `"android"` | `"web"`

**Responses:**
- `Object { success: false, message, errors, status: 400 }` — Validation failed
- `Object { success: false, message, errors, status: 401 }` — Invalid credentials
- `Object { success: false, message, errors, status: 403 }` — Account suspended
- `Object { success: false, message, errors, status: 429 }` — Rate limited
- `Object { success: true, accessToken, refreshToken, expiresIn: 900, user: { id, name, email, role, image } }`

---

### `/api/mobile/auth/register`

#### POST

**Description:** Create a new user account and return JWT tokens.

**Request Body:**
- `name` (Required) — Minimum 2 characters
- `email` (Required) — Valid email address
- `password` (Required) — Minimum 6 characters
- `deviceId` (Optional) — Client device identifier
- `deviceName` (Optional) — Human-readable device name
- `platform` (Optional) — `"ios"` | `"android"` | `"web"`

**Responses:**
- `Object { success: false, message, errors, status: 400 }` — Validation failed
- `Object { success: false, message, errors, status: 409 }` — Email already exists
- `Object { success: true, accessToken, refreshToken, expiresIn: 900, user: { id, name, email, role, image }, status: 201 }`

---

### `/api/mobile/auth/refresh`

#### POST

**Description:** Exchange a valid refresh token for a new access token and a new refresh token (rotation). The old refresh token is revoked. If a previously revoked token is reused, all user sessions are invalidated.

**Request Body:**
- `refreshToken` (Required) — The current refresh token
- `deviceId` (Optional) — Client device identifier
- `deviceName` (Optional) — Human-readable device name
- `platform` (Optional) — `"ios"` | `"android"` | `"web"`

**Responses:**
- `Object { success: false, message, errors, status: 400 }` — Validation failed
- `Object { success: false, message, errors, status: 401 }` — Invalid, revoked, or expired token
- `Object { success: true, accessToken, refreshToken, expiresIn: 900 }`

---

### `/api/mobile/auth/logout`

#### POST

**Description:** Revoke a specific refresh token, or revoke all sessions for the authenticated user.

**Headers:**
- `Authorization: Bearer <accessToken>` (Required if `refreshToken` not provided)

**Request Body:**
- `refreshToken` (Optional) — Specific token to revoke. If omitted and a valid Bearer token is present, all sessions are revoked.

**Responses:**
- `Object { success: false, message, errors, status: 400 }` — Neither refresh token nor valid access token provided
- `Object { success: true, data: { message: "Logged out successfully." } }`

---

### `/api/mobile/auth/me`

#### GET

**Description:** Return the currently authenticated user's profile.

**Headers:**
- `Authorization: Bearer <accessToken>` (Required)

**Responses:**
- `Object { success: false, message, errors, status: 401 }` — Invalid or missing access token
- `Object { success: false, message, errors, status: 403 }` — Account suspended
- `Object { success: false, message, errors, status: 404 }` — User not found
- `Object { success: true, data: { user: { id, name, email, role, image } } }`

---

### `/api/mobile/auth/forgot-password`

#### POST

**Description:** Generate a password reset token for the given email. The response is always 200 to prevent email enumeration. In development mode the token is logged to the console.

**Request Body:**
- `email` (Required) — Email address of the account

**Responses:**
- `Object { success: false, message, errors, status: 400 }` — Validation failed
- `Object { success: true, data: { message: "If an account with that email exists, a password reset link has been sent." } }`

---

### `/api/mobile/auth/reset-password`

#### POST

**Description:** Reset a user's password using a valid reset token (from forgot-password flow).

**Request Body:**
- `token` (Required) — The raw reset token received via email / console
- `password` (Required) — New password, minimum 6 characters

**Responses:**
- `Object { success: false, message, errors, status: 400 }` — Validation failed or token invalid/expired
- `Object { success: true, data: { message: "Password has been reset successfully. Please log in with your new password." } }`
