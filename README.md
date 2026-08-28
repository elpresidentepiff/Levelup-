# Level

Level is an Android-first active-learning app for children aged 6–12. It teaches computational thinking through prediction, construction, testing, debugging, explanation and creation—without opening with syntax or a traditional code editor.

The first usable vertical slice is implemented in this repository.

## What is playable

- Child onboarding with a privacy-safe nickname, three developmental modes and an interest choice.
- A premium child-facing home screen and a ten-world progression map.
- World 1: ten complete missions covering sequencing, prediction, debugging, efficient routes, explanation, open creation and a boss assessment.
- A deterministic command interpreter. Children and the tutor never execute arbitrary JavaScript.
- Progressive, reviewed Byte hints rather than unrestricted AI chat or answer generation.
- Evidence-based mastery updates that distinguish independent success from hint-assisted success.
- Offline progress and a private local project shelf.
- A protected parent summary that explains demonstrated strengths and next practice without requiring programming knowledge.
- Read-aloud support, touch-first controls, text labels alongside colour and responsive phone/tablet layouts.

## Run it

Requirements: Node.js and pnpm.

```bash
cd apps/mobile
pnpm install
pnpm start
```

Then open the project in Expo Go or run `pnpm android` with an Android device/emulator available.

Validation commands:

```bash
pnpm typecheck
pnpm test
pnpm doctor
pnpm exec expo export --platform android --no-bytecode
```

Hermes bytecode should be enabled for production builds. The `--no-bytecode` export is only a Windows/OneDrive-friendly local bundle check.

## Repository shape

```text
apps/mobile                  Expo + React Native application
packages/lesson-schema       Safe, versionable mission and learner types
packages/learning-engine     Deterministic interpreter and test runner
packages/content             World 1 mission content
packages/mastery             Evidence and mastery updates
packages/tutor-contracts     Constrained Byte tutor actions
server                       Future secure backend boundary
docs/product                 Product decisions and delivery scope
docs/curriculum              Mission intent and capability mapping
docs/safety                  Data-minimisation and AI safety architecture
docs/store                   Android release gates
```

## Safety position

The MVP has no adverts, public profiles, location, child messaging, microphone permission, arbitrary code execution or unrestricted AI conversation. It stores a nickname, broad age mode, structured attempts, mastery estimates and private builds locally on the device.

This is an engineering baseline, not final legal clearance. Consent, SDK inventory, retention, deletion, backend data flows, privacy notices and Play declarations must be reviewed before a child-directed production launch.

## Next build gates

1. Test the vertical slice with children and confirm they can complete Mission 1 without adult explanation.
2. Add a parent-owned backend account, consent records, export and deletion workflow.
3. Add a controlled model gateway only after tutor safety evaluation passes.
4. Validate TalkBack, switch access, reduced animation and a representative Android phone/tablet matrix.
5. Complete Families Policy, Data safety, privacy and closed-test release work.

