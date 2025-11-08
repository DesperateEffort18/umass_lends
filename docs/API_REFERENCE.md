# API Reference

Complete API reference for UMass Lends backend.

## Base URL

```
http://localhost:3000/api
```

## Response Format

All endpoints return JSON in the following format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Items API

### Create Item

**POST** `/api/items`

Create a new item for lending.

**Request Body:**
```json
{
  "title": "string (required, max 200 chars)",
  "description": "string (optional, max 1000 chars)",
  "category": "string (optional, max 100 chars)",
  "condition": "string (optional, max 50 chars)",
  "image_url": "string (optional, valid URL)",
  "available": "boolean (default: true)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "owner_id": "uuid",
    "title": "string",
    "description": "string",
    "category": "string",
    "condition": "string",
    "image_url": "string",
    "available": true,
    "created_at": "timestamp"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `500 Internal Server Error` - Server error

---

### List Items

**GET** `/api/items`

Get all items, optionally filtered by availability.

**Query Parameters:**
- `available` (optional) - Filter by availability: `true` or `false`

**Example:** `/api/items?available=true`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "owner_id": "uuid",
      "title": "string",
      ...
    }
  ]
}
```

---

### Get Item

**GET** `/api/items/:id`

Get details of a specific item.

**Path Parameters:**
- `id` (required) - Item UUID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "owner_id": "uuid",
    "title": "string",
    ...
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid item ID
- `404 Not Found` - Item not found
- `500 Internal Server Error` - Server error

---

## Borrow Requests API

### Submit Borrow Request

**POST** `/api/items/:id/borrow`

Submit a borrow request for an item.

**Path Parameters:**
- `id` (required) - Item UUID

**Request Body:**
```json
{
  "borrow_start_date": "YYYY-MM-DD (required)",
  "borrow_end_date": "YYYY-MM-DD (required)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "item_id": "uuid",
    "borrower_id": "uuid",
    "owner_id": "uuid",
    "status": "pending",
    "request_date": "timestamp",
    "borrow_start_date": "date",
    "borrow_end_date": "date"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error, item not available, or duplicate request
- `404 Not Found` - Item not found
- `500 Internal Server Error` - Server error

---

### Approve Borrow Request

**POST** `/api/borrow/:id/approve`

Approve a borrow request (only item owner can approve).

**Path Parameters:**
- `id` (required) - Borrow request UUID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    ...
  }
}
```

**Error Responses:**
- `400 Bad Request` - Request already processed
- `403 Forbidden` - Not the item owner
- `404 Not Found` - Request not found
- `500 Internal Server Error` - Server error

---

### Reject Borrow Request

**POST** `/api/borrow/:id/reject`

Reject a borrow request (only item owner can reject).

**Path Parameters:**
- `id` (required) - Borrow request UUID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "rejected",
    ...
  }
}
```

**Error Responses:**
- `400 Bad Request` - Request already processed
- `403 Forbidden` - Not the item owner
- `404 Not Found` - Request not found
- `500 Internal Server Error` - Server error

---

### Get My Borrow Requests

**GET** `/api/borrow/mine`

Get all borrow requests where the current user is either the borrower or owner.

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `approved`, `rejected`, or `returned`

**Example:** `/api/borrow/mine?status=pending`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "item_id": "uuid",
      "borrower_id": "uuid",
      "owner_id": "uuid",
      "status": "pending",
      ...
    }
  ]
}
```

---

## Messages API

### Send Message

**POST** `/api/messages`

Send a message related to an item.

**Request Body:**
```json
{
  "item_id": "uuid (required)",
  "text": "string (required, 1-1000 chars)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "item_id": "uuid",
    "sender_id": "uuid",
    "text": "string",
    "created_at": "timestamp"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Item not found
- `500 Internal Server Error` - Server error

---

### Get Messages

**GET** `/api/messages`

Get all messages for a specific item.

**Query Parameters:**
- `itemId` (required) - Item UUID

**Example:** `/api/messages?itemId=uuid`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "item_id": "uuid",
      "sender_id": "uuid",
      "text": "string",
      "created_at": "timestamp"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid itemId
- `500 Internal Server Error` - Server error

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Authentication

Currently, all endpoints use a placeholder user (`dev-user`). When Supabase Auth is integrated, endpoints will require valid authentication tokens.

## Rate Limiting

Rate limiting is not currently implemented but should be added in production.

## Error Handling

All errors are returned in a consistent format:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

Error messages are designed to be user-friendly and actionable.

