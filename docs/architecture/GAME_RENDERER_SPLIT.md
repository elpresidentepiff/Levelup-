# Separating the learning task from the game

## The problem this solves

World 1 shipped as one square grid with twelve layouts. Every mission asked
the child to assemble `Direction[]`, run it, and watch Byte move. Different
walls, different questions, same game.

That is a product weakness. It is also an integrity one, and that part was
invisible until it was measured:

```
Mission contexts:      15
  of those grid-based: 15  (100%)
```

`contexts` is the anti-farming breadth measure — the one quantity replay
cannot inflate, because it is a Set. `minimumContexts: 2` was written to mean
*"showed this thinking in two genuinely different situations."* With one
modality it meant *"showed it on two different grid layouts."* A child had
demonstrated their thinking in one world, fifteen ways, and the ledger
recorded fifteen.

**Presentation monoculture silently hollows out the evidence model.** The
renderer split is not cosmetic work; it is what makes `minimumContexts` mean
what it says.

## The shape

```
MissionDefinition
  ├─ evidence[]   what this mission claims about a child. Never sees the theme.
  ├─ task         what the child DOES, and the payload that interaction needs
  └─ theme        what it LOOKS like

registry:  task.kind → renderer        (apps/mobile/src/tasks)
skins:     theme     → nouns + palette (packages/content/src/themes.ts)
```

- `MissionScreen` is the **learning shell**: attempts, hints, timing, evidence,
  the explanation step, passing, continuing. It is theme-blind by construction
  and must stay that way.
- A **task renderer** owns the interaction and reports a `TaskAttempt` — pass or
  fail, which dimensions it speaks to, how long the answer was, how many edits
  it took. Nothing else. It cannot influence scoring.
- A **theme skin** supplies nouns (`actor`, `goal`, `token`, `program`,
  `runVerb`), a palette, and an avatar shape. Nothing it holds is ever read by
  the mastery model.

The board lives in the run-program task, not on the mission. A board is a
property of moving through space, not of every mission.

## Two rules that keep it honest

Both are enforced in `game-renderer-split.test.ts`, and both were verified by
breaking them.

**1. Evidence is identical when only the theme changes.** Checked for every
mission against every skin. If a renderer could reach the evidence path, a maze
and a checklist would stop being comparable and the ledger would start
recording art direction.

**2. A theme cannot mint a context.** Context prefixes are pinned to the task
kind (`contextPrefixForTask`), so re-skinning a maze as a factory leaves it a
maze and the name keeps saying so.

Rule 2 matters more than it looks. Without it, breadth becomes farmable by the
cheapest method available — change the art, claim a new situation. That is the
original farming bug wearing a costume, and it would be much harder to spot,
because the content would look richer while meaning less.

**The corollary is uncomfortable and worth stating plainly: re-skinning a grid
does not repair breadth. Only converting the task does.** Six themes across
eleven grid missions is better product, not better evidence.

## Where it stands

| | |
|---|---|
| Task kinds implemented | `run-program`, `order-steps` |
| Themes defined | 9 |
| Missions genuinely converted | 1 of 12 |
| Mission contexts still grid | 14 of 15 (93%) |

## Conversion roadmap

Each row is content work against a seam that already exists. The renderers
marked *new* are the only remaining architecture.

| Mission | Now | Becomes | Renderer |
|---|---|---|---|
| Wake Byte | maze / run-program | keep — the tutorial should be spatial | — |
| Treasure Run | treasure / run-program | keep — collection is genuinely spatial | — |
| Predict Byte | traffic / run-program | traffic / `predict-outcome` | **new** |
| Broken Bridge | factory / run-program | factory / `repair-order` (robot arm) | **new** |
| Many Ways | maze / run-program | keep — multiple routes needs a space | — |
| Shortest Route | treasure / run-program | keep — one of the two efficiency boards | — |
| Tell Byte | maze / run-program | keep — explanation over a built route | — |
| Secret Bug | factory / run-program | workshop / `repair-order` | **new** |
| Build Your Maze | maze / run-program | keep — authoring a board is the point | — |
| The Long Way Round | treasure / run-program | kitchen / `choose-plan` | **new** |
| Out of Order | kitchen / order-steps | **done** | — |
| Castle Boss | castle / run-program | keep — the integrated spatial finale | — |

Rocket and music themes are defined and unused; they are the natural homes for
a second `order-steps` mission (launch checklist) and a `predict-outcome` one
(drum pattern) when World 1 wants more breadth than the table above provides.

Target after the roadmap: **5 of 12 missions non-spatial**, and no skill
resting its two contexts on one modality.

## Adding a renderer

1. Add the kind to `playableTaskKinds` in `packages/content/src/tasks.ts` and
   give it a context prefix. The registry is typed against this list, so a kind
   cannot be playable without a renderer.
2. Add the task's payload type to `TaskDefinition` in `lesson-schema`.
3. Write the component in `apps/mobile/src/tasks/`, taking `TaskRendererProps`
   and reporting a `TaskAttempt`. Import nothing from the mastery model.
4. Register it in `apps/mobile/src/tasks/index.tsx`.

If a new renderer needs anything from `TaskAttempt` that is not already there,
stop and think — that is usually the renderer trying to influence scoring,
which is the one thing this design exists to prevent.

## Rule of thumb for new missions

A new *fantasy* is a theme. A new *verb* is a task.

A rocket checklist and a pizza order are one task with different nouns. A maze
and a checklist are two tasks, because steering a body and ordering steps are
different acts even when they evidence the same skill.

If adding a game fantasy means adding a branch to the renderer registry,
something has been modelled in the wrong layer.
