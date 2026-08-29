# Child-safety data map

## Current local MVP

| Data | Purpose | Storage | Rule |
|---|---|---|---|
| Nickname | Child-facing identity | Device only | Explicitly asks for a nickname, not a real name |
| Broad age mode | Developmental adaptation | Device only | No birth date |
| Interest choice | Project framing | Device only | No behavioural advertising or third-party profiling |
| Completed missions and stars | Progression | Device only | Structured values, not screen recordings |
| Mastery evidence | Adaptation and parent explanation | Device only | Treated as an estimate, never a permanent ability label |
| Structured evidence events | Learning-model inputs: outcome, independence, attempts, hints, timing, prediction, program length, explanation result and misconception code | Device only | Capped local ledger; no raw conversation, voice, contact details or screen recording |
| Saved routes | Private project shelf | Device only | Safe command representation, private by default |

The current app requests no location or microphone permission and has no public communication surface.

Evidence events use a versioned schema and remain local in the MVP. The device retains at most 2,000 events. They are designed for deterministic adaptation and future parent explanations, not behavioural advertising or third-party profiling. Any future remote analytics requires the full backend gate below before it is enabled.

## Backend gate

Before any remote child data is introduced, implement and review:

1. Parent-owned authentication and auditable consent records.
2. Region-aware notices, data minimisation, retention and deletion.
3. Account/data export and deletion both in-app and on the public website.
4. SDK register and full network/data-flow inventory.
5. Encryption, least-privilege access, operational audit events and incident response.
6. A DPIA and qualified child-privacy review.

## Tutor boundary

The MVP tutor is reviewed content with four possible actions: `give_hint`, `ask_prediction`, `explain_result` and `suggest_next_step`. It has no open chat, external links, arbitrary tools or code execution.

A later model gateway must minimise context, detect likely personal information before model calls or logging, validate structured output, fall back to reviewed content and keep deterministic tests in control of progression.
