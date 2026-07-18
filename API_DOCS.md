# Notexia API Documentation

This document outlines the available REST API endpoints for the Notexia backend.

## Admin Endpoints

### `/api/admin/audit-logs`

**Supported Methods:** `GET`

### `/api/admin/export`

**Supported Methods:** `GET`

### `/api/admin/moderation`

**Supported Methods:** `GET`, `PATCH`

### `/api/admin/settings`

**Supported Methods:** `GET`, `PATCH`

### `/api/admin/stats`

**Supported Methods:** `GET`

### `/api/admin/users`

**Supported Methods:** `GET`, `DELETE`, `PATCH`

## Auth Endpoints

### `/api/auth/signup`

**Supported Methods:** `POST`

## Blogs Endpoints

### `/api/blogs/[id]`

**Supported Methods:** `GET`, `DELETE`, `PATCH`

**Path Parameters:**
- `id`: (Required)

### `/api/blogs`

**Supported Methods:** `GET`, `POST`

## Bookmarks Endpoints

### `/api/bookmarks/[id]`

**Supported Methods:** `DELETE`

**Path Parameters:**
- `id`: (Required)

### `/api/bookmarks`

**Supported Methods:** `GET`, `POST`

## Certificates Endpoints

### `/api/certificates/[id]`

**Supported Methods:** `GET`

**Path Parameters:**
- `id`: (Required)

## Chat Endpoints

### `/api/chat`

**Supported Methods:** `POST`

## Chats Endpoints

### `/api/chats/[id]`

**Supported Methods:** `DELETE`, `PATCH`

**Path Parameters:**
- `id`: (Required)

### `/api/chats`

**Supported Methods:** `GET`, `POST`

## Community Endpoints

### `/api/community/[id]/comments`

**Supported Methods:** `POST`

**Path Parameters:**
- `id`: (Required)

### `/api/community/[id]/like`

**Supported Methods:** `POST`

**Path Parameters:**
- `id`: (Required)

### `/api/community/[id]`

**Supported Methods:** `PUT`, `DELETE`

**Path Parameters:**
- `id`: (Required)

### `/api/community`

**Supported Methods:** `GET`, `POST`

## Courses Endpoints

### `/api/courses/[id]/progress`

**Supported Methods:** `GET`, `POST`

**Path Parameters:**
- `id`: (Required)

### `/api/courses/[id]`

**Supported Methods:** `GET`, `PUT`, `DELETE`

**Path Parameters:**
- `id`: (Required)

### `/api/courses`

**Supported Methods:** `GET`, `POST`

## Dashboard Endpoints

### `/api/dashboard/stats`

**Supported Methods:** `GET`

## Doubts Endpoints

### `/api/doubts/[id]`

**Supported Methods:** `DELETE`, `PATCH`

**Path Parameters:**
- `id`: (Required)

### `/api/doubts`

**Supported Methods:** `GET`, `POST`

## Feed Endpoints

### `/api/feed/[id]/comment`

**Supported Methods:** `GET`, `POST`, `PATCH`

**Path Parameters:**
- `id`: (Required)

### `/api/feed/[id]/flag`

**Supported Methods:** `POST`

**Path Parameters:**
- `id`: (Required)

### `/api/feed/[id]/repost`

**Supported Methods:** `POST`

**Path Parameters:**
- `id`: (Required)

### `/api/feed`

**Supported Methods:** `GET`

## Folders Endpoints

### `/api/folders/[id]`

**Supported Methods:** `DELETE`, `PATCH`

**Path Parameters:**
- `id`: (Required)

### `/api/folders`

**Supported Methods:** `GET`, `POST`

## Forums Endpoints

### `/api/forums/[id]/comments`

**Supported Methods:** `POST`

**Path Parameters:**
- `id`: (Required)

### `/api/forums/[id]`

**Supported Methods:** `DELETE`

**Path Parameters:**
- `id`: (Required)

### `/api/forums/[id]/upvote`

**Supported Methods:** `POST`

**Path Parameters:**
- `id`: (Required)

### `/api/forums`

**Supported Methods:** `GET`, `POST`

## Leaderboard Endpoints

### `/api/leaderboard`

**Supported Methods:** `GET`

## Messages Endpoints

### `/api/messages/conversations`

**Supported Methods:** `GET`

### `/api/messages`

**Supported Methods:** `GET`, `POST`

### `/api/messages/typing`

**Supported Methods:** `POST`

## Notes Endpoints

### `/api/notes/[id]/history`

**Supported Methods:** `GET`, `POST`, `PATCH`

**Path Parameters:**
- `id`: (Required)

### `/api/notes/[id]/publish`

**Supported Methods:** `PATCH`

**Path Parameters:**
- `id`: (Required)

### `/api/notes/[id]`

**Supported Methods:** `GET`, `DELETE`, `PATCH`

**Path Parameters:**
- `id`: (Required)

### `/api/notes/[id]/upvote`

**Supported Methods:** `POST`

**Path Parameters:**
- `id`: (Required)

### `/api/notes`

**Supported Methods:** `GET`, `POST`

## Notifications Endpoints

### `/api/notifications`

**Supported Methods:** `GET`, `PATCH`

## Research Endpoints

### `/api/research`

**Supported Methods:** `GET`, `POST`

## Upload Endpoints

### `/api/upload/avatar`

**Supported Methods:** `POST`

### `/api/upload`

**Supported Methods:** `POST`

## User Endpoints

### `/api/user/[id]/follow`

**Supported Methods:** `GET`, `POST`

**Path Parameters:**
- `id`: (Required)

### `/api/user/password`

**Supported Methods:** `PATCH`

### `/api/user/profile`

**Supported Methods:** `GET`, `PATCH`

### `/api/user`

**Supported Methods:** `GET`

