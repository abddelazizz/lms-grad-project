# Chat Feature — Live Instructor-Student Messaging

## Overview

Real-time text-only chat between students and instructors using Socket.IO. Students can only chat with instructors whose courses they are enrolled in. Both roles can initiate conversations. The system supports typing indicators, read receipts, and online status tracking.

---

## Architecture

```
Client (Socket.IO)  ←→  src/socket/index.js  ←→  src/services/chatService.js  ←→  MySQL
Client (REST)        →  src/routes/chatRoutes.js → src/handlers/chatHandler.js → chatService.js → MySQL
```

---

## Database Schema

### `conversations` table

| Column | Type | Constraints | Description |
|---|---|---|---|
| `conversation_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `student_id` | INT | FK → students.user_id, NOT NULL | Student participant |
| `instructor_id` | INT | FK → instructors.user_id, NOT NULL | Instructor participant |
| `last_message_at` | TIMESTAMP | NULLABLE | Updated on each new message |
| `created_at` | TIMESTAMP | DEFAULT NOW | Creation timestamp |

- **Unique index**: `[student_id, instructor_id]` — one conversation per pair
- **Indexes**: `student_id`, `instructor_id`

### `chat_messages` table (refactored)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `message_id` | INT | PK, AUTO_INCREMENT | Primary key |
| `conversation_id` | INT | FK → conversations.conversation_id, NOT NULL, CASCADE | Parent conversation |
| `sender_id` | INT | FK → users.user_id, NOT NULL | Who sent the message |
| `content` | TEXT | NOT NULL, max 2000 chars | Message text (restricted to text, no files) |
| `is_read` | BOOLEAN | DEFAULT FALSE | Read receipt flag |
| `created_at` | TIMESTAMP | DEFAULT NOW | When message was sent |

- **Indexes**: `[conversation_id, created_at]`, `sender_id`
- **Removed columns**: `receiver_id` (derived from conversation), `message` (renamed to `content`)

### Entity Relationship

```
Student ←── Conversation ──→ Instructor
                  │
                  ├── hasMany ──→ ChatMessage ──→ User (sender)
```

---

## REST API Endpoints

All routes require `authenticate` + `restrictTo("student", "instructor")`.

Base path: `/api/chat`

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `POST` | `/conversations` | `createConversation` | Create or get existing conversation. Enforces enrollment check. Body: `{ otherUserId: number }` |
| `GET` | `/conversations` | `getConversations` | List current user's conversations with other user info, last message preview, and unread count |
| `GET` | `/conversations/:id/messages?page=&limit=` | `getMessages` | Paginated message history for a conversation. Defaults: page=1, limit=50 |
| `PATCH` | `/conversations/:id/read` | `markAsRead` | Mark all unread messages in the conversation as read. Returns count of messages marked |

### Example Responses

**POST /api/chat/conversations** (201 Created)
```json
{
  "status": "success",
  "data": {
    "conversation": { "conversation_id": 1, "student_id": 5, "instructor_id": 3, ... },
    "otherUser": { "user_id": 3, "name": "Dr. Smith", "picture": "...", "role": "instructor" },
    "isNew": true
  }
}
```

**GET /api/chat/conversations** (200 OK)
```json
{
  "status": "success",
  "data": {
    "conversations": [
      {
        "conversation_id": 1,
        "otherUser": { "user_id": 3, "name": "Dr. Smith", "picture": "...", "role": "instructor" },
        "lastMessage": { "content": "Hello!", "created_at": "2026-04-30T12:00:00Z", "sender_id": 5 },
        "unreadCount": 2,
        "last_message_at": "2026-04-30T12:00:00Z",
        "created_at": "2026-04-30T10:00:00Z"
      }
    ]
  }
}
```

**GET /api/chat/conversations/1/messages?page=1&limit=50** (200 OK)
```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "message_id": 1,
        "conversation_id": 1,
        "sender_id": 5,
        "content": "Hello!",
        "is_read": true,
        "created_at": "2026-04-30T12:00:00Z",
        "sender": { "user_id": 5, "name": "Ahmed", "picture": "..." }
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 42, "totalPages": 1 }
  }
}
```

---

## Socket.IO Events

### Authentication

Socket connections must provide a JWT token via `auth.token`:

```js
const socket = io(SERVER_URL, { auth: { token: "Bearer <jwt>" } });
```

Invalid or missing tokens result in connection rejection.

### Room Strategy

- Each conversation maps to a room: `conversation_{conversation_id}`
- Each user has a personal room: `user_{userId}` (for conversation_updated events even when not in a conversation room)
- Clients `join_conversation` when opening a chat, `leave_conversation` when switching away

### Client → Server Events

| Event | Payload | Description |
|---|---|---|
| `join_conversation` | `{ conversationId }` | Join the conversation room. Server verifies participant status. |
| `leave_conversation` | `{ conversationId }` | Leave the conversation room. |
| `send_message` | `{ conversationId, content }` | Send a text message. Max 2000 chars. Server validates participant, saves to DB, broadcasts. |
| `typing` | `{ conversationId }` | Notify the other user that you're typing. |
| `stop_typing` | `{ conversationId }` | Notify the other user that you stopped typing. |
| `mark_read` | `{ conversationId }` | Mark all unread messages from the other user as read. |

### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `new_message` | `{ message_id, conversation_id, sender_id, sender, content, is_read, created_at }` | New message in a conversation you've joined |
| `typing` | `{ conversationId, userId }` | The other user is typing |
| `stop_typing` | `{ conversationId, userId }` | The other user stopped typing |
| `messages_read` | `{ conversationId, readBy, count }` | Messages were marked as read by the other user |
| `conversation_updated` | `{ conversation_id, lastMessage, otherUser }` | New message arrived in a conversation (emitted to personal room even if not in conversation room — for updating conversation list) |
| `online_status` | `{ userId, isOnline }` | A user came online or went offline |
| `error` | `{ message }` | Error from a socket operation |

### Online Tracking

- Uses `Map<userId, Set<socketId>>` to support multiple tabs/devices per user
- A user is considered offline only when ALL their socket connections disconnect
- Online/offline status is broadcast globally via `online_status` event

---

## Business Logic — Enrollment Check

Before creating a conversation, `createOrGetConversation` verifies that the student is actively enrolled in at least one course taught by the instructor:

```sql
SELECT * FROM enrollments e
JOIN courses c ON c.course_id = e.course_id AND c.instructor_id = ?
WHERE e.student_id = ? AND e.status = 'active'
```

If no active enrollment exists, the service returns a 403 error.

---

## Files Created / Modified

### New Files

| File | Purpose |
|---|---|
| `src/models/Conversation.js` | Conversation Sequelize model |
| `src/validations/chatValidation.js` | Joi validation schemas for chat endpoints |
| `src/socket/index.js` | Socket.IO server (replaces `socketManager.js`) |
| `src/database/migrations/20260430120000-create-conversations-and-refactor-chat-messages.cjs` | Database migration |

### Modified Files

| File | Change |
|---|---|
| `src/models/ChatMessage.js` | Removed `receiver_id`, added `conversation_id` FK, renamed `message` → `content`, added `created_at` |
| `src/models/index.js` | Added Conversation import and associations (Conversation ↔ ChatMessage, Conversation ↔ Student/Instructor) |
| `src/services/chatService.js` | Full rewrite: `createOrGetConversation` (with enrollment check), `getConversations` (with unread counts), `getMessages` (paginated), `markAsRead`, `saveMessage`, `verifyParticipant`, `getConversationById` |
| `src/handlers/chatHandler.js` | Full rewrite: `createConversation`, `getConversations`, `getMessages`, `markAsRead` |
| `src/routes/chatRoutes.js` | Full rewrite: conversation-based routes with `restrictTo`, validation middleware |
| `src/handlers/index.js` | Added chat handler exports |
| `src/services/index.js` | Added `chatService` namespace export |
| `src/validations/index.js` | Added chat validation exports |
| `server.js` | Updated Socket.IO import path, exports `io` instance |

### Deleted Files

| File | Reason |
|---|---|
| `src/socketManager.js` | Replaced by `src/socket/index.js` |

---

## Migration Strategy

The migration handles transitioning from the old flat `ChatMessage` schema (sender_id + receiver_id) to the new Conversation-based schema:

1. **Create** `conversations` table
2. **Migrate** existing `chat_messages` data → create Conversation rows from unique sender/receiver pairs
3. **Backfill** `conversation_id` on existing ChatMessage rows
4. **Add** `content` column, copy from `message`, make NOT NULL
5. **Add** `created_at` column if missing
6. **Drop** old columns: `receiver_id`, `message`, `updatedAt`
7. **Make** `conversation_id` NOT NULL (only if all rows migrated)

The `down` migration reverses the process: re-adds `receiver_id` and `message`, populates them from conversation data, drops new columns, and drops the `conversations` table.

---

## Frontend Integration Notes

The frontend `Chat.jsx` will need updates to match the new API:

| Old (Frontend) | New (Backend) |
|---|---|
| `GET /api/chat/contacts` | `GET /api/chat/conversations` (returns full conversation list) |
| `GET /api/chat/history/:otherUserId` | `GET /api/chat/conversations/:id/messages?page=1&limit=50` |
| Socket `send_message { receiverId, message }` | Socket `send_message { conversationId, content }` |
| Socket `receive_message` | Socket `new_message` |
| Socket `typing { receiverId }` | Socket `typing { conversationId }` |
| No start conversation flow | `POST /api/chat/conversations { otherUserId }` |
| No read receipts | Socket `mark_read { conversationId }` / `messages_read` event |
| No conversation join/leave | Socket `join_conversation` / `leave_conversation` |