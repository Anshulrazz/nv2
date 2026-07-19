# Notexia Mobile API Reference — Agent-Ready

Base URL: `https://notexia.in`
Package: `com.notexia.app`

All endpoints use JSON. No cookies. No CSRF. Authentication via `Authorization: Bearer <accessToken>` header.

---

## Authentication Flow

1. User logs in or registers → receives `accessToken` (JWT, 15min) and `refreshToken` (opaque, 30 days)
2. Store both tokens securely (e.g., flutter_secure_storage)
3. Attach `Authorization: Bearer <accessToken>` to every authenticated request
4. When accessToken expires (HTTP 401) → call `/api/mobile/auth/refresh` with the refreshToken
5. Receive new accessToken + new refreshToken (old refreshToken is invalidated)
6. On logout → call `/api/mobile/auth/logout` with the refreshToken

---

## Error Response Format (all endpoints)

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": ["Optional array of specific validation errors"]
}
```

## Success Response Format (non-auth endpoints)

```json
{
  "success": true,
  "data": { }
}
```

---

## POST /api/mobile/auth/register

Creates a new user account and returns authentication tokens.

### Request

```
POST /api/mobile/auth/register
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "deviceId": "optional-unique-device-id",
  "deviceName": "iPhone 15 Pro",
  "platform": "ios"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | min 2 characters |
| email | string | Yes | valid email format |
| password | string | Yes | min 6 characters |
| deviceId | string | No | any string |
| deviceName | string | No | any string |
| platform | string | No | one of: `"ios"`, `"android"`, `"web"` |

### Response — 201 Created

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
  "expiresIn": 900,
  "user": {
    "id": "668abc123def456789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "image": ""
  }
}
```

### Error Responses

| Status | Condition | Example message |
|--------|-----------|-----------------|
| 400 | Validation failed | `"Validation failed."` with errors array |
| 409 | Email already registered | `"A user with this email address already exists."` |
| 500 | Server error | `"An unexpected error occurred during registration."` |

---

## POST /api/mobile/auth/login

Authenticates an existing user with email and password.

Rate limited: 5 attempts per minute per IP address.

### Request

```
POST /api/mobile/auth/login
Content-Type: application/json
```

```json
{
  "email": "john@example.com",
  "password": "securePassword123",
  "deviceId": "optional-unique-device-id",
  "deviceName": "iPhone 15 Pro",
  "platform": "ios"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | valid email format |
| password | string | Yes | min 1 character |
| deviceId | string | No | any string |
| deviceName | string | No | any string |
| platform | string | No | one of: `"ios"`, `"android"`, `"web"` |

### Response — 200 OK

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
  "expiresIn": 900,
  "user": {
    "id": "668abc123def456789012345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "image": "https://example.com/avatar.jpg"
  }
}
```

### Error Responses

| Status | Condition | Example message |
|--------|-----------|-----------------|
| 400 | Validation failed | `"Validation failed."` with errors array |
| 400 | OAuth-only account (no password) | `"This account uses Google login. Please sign in with Google or set a password first."` |
| 401 | Wrong email or password | `"Invalid email or password."` |
| 403 | Account suspended | `"Your account has been suspended. Please contact support."` |
| 429 | Rate limit exceeded | `"Too many login attempts. Please try again later."` |
| 500 | Server error | `"An unexpected error occurred during login."` |

---

## POST /api/mobile/auth/refresh

Exchange a valid refresh token for a new access token and a new refresh token. The old refresh token is revoked (rotation). If a previously revoked refresh token is reused, ALL sessions for that user are invalidated for security.

### Request

```
POST /api/mobile/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| refreshToken | string | Yes | min 1 character |
| deviceId | string | No | any string |
| deviceName | string | No | any string |
| platform | string | No | one of: `"ios"`, `"android"`, `"web"` |

### Response — 200 OK

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "newtoken123abc456def...",
  "expiresIn": 900
}
```

IMPORTANT: After a successful refresh, the client MUST discard the old refresh token and store the new one. The old token is now invalid.

### Error Responses

| Status | Condition | Example message |
|--------|-----------|-----------------|
| 400 | Missing refreshToken | `"Validation failed."` |
| 401 | Token not found | `"Invalid refresh token."` |
| 401 | Token was revoked (reuse attack) | `"Refresh token has been revoked. All sessions invalidated for security."` |
| 401 | Token expired | `"Refresh token has expired. Please log in again."` |
| 401 | User suspended or deleted | `"User account is unavailable."` |
| 500 | Server error | `"An unexpected error occurred during token refresh."` |

---

## POST /api/mobile/auth/logout

Revoke refresh token(s). Two modes:

1. Send `refreshToken` in body → revokes that specific session
2. Send only `Authorization: Bearer <accessToken>` header (no body) → revokes ALL sessions for the user

### Request — Mode 1: Revoke specific token

```
POST /api/mobile/auth/logout
Content-Type: application/json
Authorization: Bearer <accessToken>
```

```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

### Request — Mode 2: Revoke all sessions

```
POST /api/mobile/auth/logout
Authorization: Bearer <accessToken>
```

(empty body or `{}`)

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully."
  }
}
```

### Error Responses

| Status | Condition | Example message |
|--------|-----------|-----------------|
| 400 | No refreshToken and no valid Bearer token | `"Provide a refresh token or a valid access token to log out."` |
| 500 | Server error | `"An unexpected error occurred during logout."` |

---

## GET /api/mobile/auth/me

Returns the authenticated user's profile. Requires a valid access token.

### Request

```
GET /api/mobile/auth/me
Authorization: Bearer <accessToken>
```

No request body.

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "668abc123def456789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "image": "https://example.com/avatar.jpg"
    }
  }
}
```

### Error Responses

| Status | Condition | Example message |
|--------|-----------|-----------------|
| 401 | Missing or invalid access token | `"Authentication required. Please provide a valid access token."` |
| 403 | Account suspended | `"Your account has been suspended."` |
| 404 | User deleted from DB | `"User not found."` |
| 500 | Server error | `"An unexpected error occurred."` |

---

## POST /api/mobile/auth/forgot-password

Request a password reset token. Always returns 200 regardless of whether the email exists (prevents email enumeration).

### Request

```
POST /api/mobile/auth/forgot-password
Content-Type: application/json
```

```json
{
  "email": "john@example.com"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | valid email format |

### Response — 200 OK (always)

```json
{
  "success": true,
  "data": {
    "message": "If an account with that email exists, a password reset link has been sent."
  }
}
```

NOTE: Email delivery is not yet configured. In development mode, the reset token is printed to the server console log.

### Error Responses

| Status | Condition | Example message |
|--------|-----------|-----------------|
| 400 | Invalid email format | `"Validation failed."` |
| 500 | Server error | `"An unexpected error occurred."` |

---

## POST /api/mobile/auth/reset-password

Reset a user's password using the token from the forgot-password flow.

### Request

```
POST /api/mobile/auth/reset-password
Content-Type: application/json
```

```json
{
  "token": "raw-reset-token-from-email-or-console",
  "password": "newSecurePassword456"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| token | string | Yes | the raw reset token |
| password | string | Yes | min 6 characters |

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully. Please log in with your new password."
  }
}
```

### Error Responses

| Status | Condition | Example message |
|--------|-----------|-----------------|
| 400 | Validation failed | `"Validation failed."` |
| 400 | Token invalid or expired | `"Invalid or expired reset token."` |
| 500 | Server error | `"An unexpected error occurred."` |

---

## User Object Shape

Wherever a `user` object appears in responses, it has this exact shape:

```json
{
  "id": "string (MongoDB ObjectId)",
  "name": "string",
  "email": "string",
  "role": "string (one of: user, teacher, admin)",
  "image": "string (URL or empty string)"
}
```

## Token Details

| Token | Format | Lifetime | Storage Recommendation |
|-------|--------|----------|----------------------|
| accessToken | JWT (HS256 signed) | 15 minutes (900 seconds) | In-memory or secure storage |
| refreshToken | 80-char hex string | 30 days | flutter_secure_storage only |

## JWT Access Token Payload (decoded)

```json
{
  "userId": "668abc123def456789012345",
  "email": "john@example.com",
  "role": "user",
  "iat": 1721345678,
  "exp": 1721346578
}
```
