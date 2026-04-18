# ADR-0014: Real-time Communication Strategy

## Status

Accepted

## Context

Several planned features require or benefit from real-time communication
between clients and the server:

- **Pomodoro / Deep Work timer** — a session started on one client should
  be visible on another (e.g., started on web, checked on mobile)
- **Session sync** — `LearningSession` state (in-progress, completed, paused)
  visible across devices without manual refresh
- **Collaborative features** (future) — "currently studying" indicators,
  shared Learning Paths

The question is whether to introduce real-time infrastructure now as a
foundation, or to defer it until a specific feature requires it.

The current REST API is a straightforward NestJS application with
controllers, services, and TypeORM repositories. It handles all existing
features (resource CRUD, toggles, filtering, URL preview) without any
stateful connection overhead.

## Decision

**Defer real-time communication infrastructure until the Pomodoro / Deep Work
feature requires it (v0.9.5).**

The REST API as currently designed is sufficient for all features through
v0.9.0. Introducing WebSocket infrastructure before a concrete consumer
exists would add stateful connection management, reconnection logic, and
event contracts to a system that does not yet benefit from them. This is
infrastructure for a non-existent problem.

When real-time communication is introduced (v0.9.5), the implementation
will be:

**NestJS WebSocket Gateway** using `@nestjs/websockets` with the Socket.io
adapter:

```typescript
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/sessions' })
export class SessionGateway {
  @SubscribeMessage('session:start')
  handleSessionStart(@MessageBody() dto: StartSessionDto): void { ... }

  @SubscribeMessage('session:complete')
  handleSessionComplete(@MessageBody() dto: CompleteSessionDto): void { ... }
}
```

Socket.io is chosen over raw WebSockets for its automatic reconnection,
room support (per-user isolation), and built-in fallback to long-polling
for environments where WebSocket connections are restricted.

**Scope at introduction**: The first Gateway covers session lifecycle
events only — `session:start`, `session:pause`, `session:complete`,
`session:tick` (periodic timer sync). No chat, no collaborative editing.

**Client integration**: Angular uses `ngx-socket-io` or a thin custom
service wrapping the Socket.io client. The service is registered only
when the `pomodoro` feature is enabled in `featureConfig` (see ADR-0012).

**Authentication over WebSockets**: The JWT token is passed as a query
parameter on connection handshake and validated in a Gateway guard. The
same token lifecycle (access + refresh) as REST applies.

## Consequences

**Positive**

- No stateful connection overhead in the API until a feature requires it
- The REST API remains simple and horizontally scalable without sticky
  sessions or shared state management
- When WebSockets are added, they are scoped to a specific namespace
  (`/sessions`) — the rest of the API is unaffected
- Deferring avoids designing a real-time contract before the data model
  (LearningSession) is fully defined

**Negative**

- Pomodoro timer state in v0.9.5 will be local to the client until WebSockets
  are introduced; cross-device sync is not available in a pure REST model
- If the Pomodoro ships before v0.9.5 (unlikely, but possible), a polling
  fallback would be needed temporarily

## Rejected Alternatives

- **WebSockets in v0.8.0 as infrastructure**: Premature. No feature through
  v0.9.0 requires real-time communication. Building the channel before the
  message is over-engineering.
- **Server-Sent Events (SSE)**: Unidirectional — server pushes to client only.
  Insufficient for session control (pause, resume) where the client also
  sends events.
- **Polling**: Acceptable for low-frequency updates but adds unnecessary
  load for a timer that ticks every second. Not the right tool for this use
  case at scale.
- **GraphQL Subscriptions**: Adds a GraphQL layer to an otherwise REST API.
  The overhead is not justified for the narrow use case of session sync.

## References

- ADR-0012: Modular Application System (featureConfig controls WebSocket
  service registration)
- Roadmap: v0.9.5 — Pomodoro and Session Tracking
