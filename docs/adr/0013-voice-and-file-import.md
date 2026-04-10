# ADR-0013: Voice Capture and File Import — v0.7.0

## Status

Proposed

## Context

v0.7.0 introduces two additional capture methods to reduce friction when
adding learning resources: Voice Capture for hands-free entry and File
Import for bulk addition from CSV or JSON files.

Both features are purely frontend — no new backend endpoints are required.
All processing happens client-side using browser-native APIs and lightweight
libraries, keeping infrastructure complexity at zero.

Each method follows the same product pattern established in v0.6.0 URL
Import: capture → preview/confirmation → save. No method redirects to
the Guided Form — each owns its complete flow end to end to avoid adding
unnecessary navigation steps.

## Decision

### Voice Capture

**Flow**

1. Recording screen — microphone button, live transcript area, stop button
2. Confirmation screen — minimalist, no card:
   - Editable transcript text area (user can correct transcription errors)
   - Auto-mapped fields shown below: title (pre-filled), url (if detected),
     resourceTypeCode (if detected)
   - Topic chip selector (mandatory, same pattern as URL Import)
   - "Save Resource" button — calls `LearningResourceService.addResource()`
     directly, redirects to `/resources` on success

**Transcription (Web Speech API)**
Browser-native `SpeechRecognition` with `continuous: true` and
`interimResults: true`. The transcript streams into the editable text area
in real time. No structure is imposed during dictation.

**Assisted field mapping (rule-based, no AI)**
When recording stops, a lightweight parser scans the transcript:

- URL pattern → `url` field
- Known type keywords (`libro`, `book`, `video`, `artículo`, `article`,
  `course`, `podcast`) → `resourceTypeCode` hint
- Remaining text → `title` field

The mapping is intentionally simple — the confirmation screen is the
safety net where the user corrects any mis-mapping.

**Browser compatibility**
`SpeechRecognition` is supported in Chrome, Edge, and Safari 14.1+.
Firefox does not support it. If the API is unavailable, the component
shows a "Your browser doesn't support voice input" message with a link
to the Guided Form as fallback.

---

### File Import

**Flow**

1. Drop zone screen — drag & drop area or file picker, accepts `.csv`
   and `.json`
2. Preview table — the final screen before saving, no additional step:
   - One row per detected resource, inline editable cells
   - Inline validation per row (see below)
   - Checkbox per row — only rows with no blocking errors are selectable
   - "Import N resources" button triggers batch save

**Parsing (client-side only)**
Files are read via native `FileReader.readAsText()`. No file is ever
uploaded to the server.

- CSV: parsed with `papaparse`
- JSON: `JSON.parse()` directly; expected shape is an array of objects
  with at minimum a `title` field

**Expected CSV columns** (case-insensitive, order-independent):
`title`, `url`, `notes`, `difficulty`, `energyLevel`, `status`,
`estimatedDurationMinutes`, `resourceTypeCode`, `topicNames`

**Inline validation per row**

Blocking errors (row cannot be selected for import):

- Missing or empty `title`
- Invalid `difficulty` value (not low / medium / high)
- Invalid URL format (when `url` is present)
- Zero topics resolved from `topicNames`

Warnings (row imports with defaults, shown with ⚠ icon):

- Missing `url`
- Unknown `resourceTypeCode` → falls back to first available type
- Missing `estimatedDurationMinutes` → defaults to 30

**Topic resolution**
`topicNames` is matched case-insensitively against the loaded topics list.
Unmatched names are silently dropped. If zero resolve, the row gets a
blocking error.

**Import execution**
Sequential `POST /api/v1/learning-resources` calls via the existing
`LearningResourceService.addResource()`. A progress counter shows
`X / N imported`. On completion, a summary shows successes and any
runtime failures.

---

### PR breakdown

Both features are delivered in small, independently reviewable PRs:

| PR  | Scope                                                    |
| --- | -------------------------------------------------------- |
| 1   | Voice: Web Speech API integration + recording UI         |
| 2   | Voice: field mapping parser + confirmation screen + save |
| 3   | File: drag & drop zone + FileReader + papaparse parsing  |
| 4   | File: preview table + inline validation                  |
| 5   | File: batch import execution + progress + summary        |

---

## Consequences

**Positive**

- Zero new backend endpoints required
- No file storage or server-side processing
- `SpeechRecognition` is free, real-time, requires no API key
- Each capture method owns its complete flow — no shared form components,
  no extra navigation steps
- CSV/JSON parsing is entirely deterministic and unit-testable
- Small PR breakdown enables early bug detection per feature slice

**Negative**

- `SpeechRecognition` is not supported in Firefox
- Large CSV files (1000+ rows) may cause UI performance issues —
  no row virtualization planned for v0.7.0
- The rule-based voice parser will mis-map edge cases; the confirmation
  screen is the safety net

## Rejected Alternatives

- **Redirect to Guided Form after voice/file capture**: adds an unnecessary
  navigation step and breaks the self-contained capture flow established
  by URL Import
- **Server-side file processing**: adds infrastructure cost, file storage,
  and cleanup logic for no benefit over client-side parsing
- **AI-based voice parsing**: adds API cost, latency, and a runtime
  dependency for a feature that works well enough with rules + user review
- **Import without preview table**: too risky for bulk operations
- **Single large PR for v0.7.0**: makes bug detection harder and increases
  review surface; small PRs per feature slice are preferred

## References

- Roadmap: v0.7.0 — Voice & File Import
- Pattern reference: v0.6.0 URL Import (PR #52, PR #53)
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- papaparse: https://www.papaparse.com
- Depends on: existing `LearningResourceService.addResource()`
