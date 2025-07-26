# Scheduler Service API Specification

## Endpoints

### GET /api/scheduler/status
- Returns current scheduler status (running, stopped).

### POST /api/scheduler/schedule
- Schedules a new post.
- Request body:
  ```json
  {
    "content": "string",
    "publish_time": "ISO-8601 timestamp",
    "platform": "onlyfans" | "hootsuite"
  }
  ```
- Response:
  ```json
  { "scheduled_id": "uuid" }
  ```

### DELETE /api/scheduler/:scheduled_id
- Cancels a scheduled post by ID.
