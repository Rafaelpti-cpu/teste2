---
tags: [frontend, 3d, stable]
updated: 2026-07-25
---

# Hero Scene — the swing tag

The hero carries the project's only WebGL scene: a paper swing tag (a clothing
hang tag) on a cord, printed with the Renova mark, swinging as a damped pendulum
and turning slowly on its own axis. On desktop the pointer nudges it.

It exists because the brand *is* a hanger and a tag — the 3D object is the
product's own packaging, not decoration bolted onto a hero.

## Files

| File | Role |
|------|------|
| `src/lib/scene/device.ts` | Device tier + every budget derived from it |
| `src/lib/three/tag-face.ts` | Draws the printed face onto a 2D canvas (pure) |
| `src/lib/three/hang-tag-scene.ts` | The scene class — build, prewarm, loop, dispose |
| `src/views/home/sections/hang-tag.tsx` | Client leaf: DOM, observers, cross-fade |
| `src/views/home/sections/lazy-hang-tag.tsx` | `dynamic({ ssr: false })` wrapper |
| `src/views/home/sections/tag-card.tsx` | The same tag as flat DOM |

## How it is built to [[optimize-3d-scene]]

Built to the skill from the start rather than optimised afterwards. Mapping each
section to what the code actually does:

| § | Rule | Here |
|---|------|------|
| 1 | No scene for robots | `isBot()` in the view renders `<TagCard>`; the `three` chunk is never requested (ADR-0020) |
| 2 | Tier once, at construction | `getSceneBudget()` — read in the constructor, never re-read |
| 3 | Prewarm everything | `prewarm()` compiles programs and renders a frame before the cross-fade; the face texture and the logo mark are built in the async `create()` factory, after `document.fonts.ready` |
| 4 | Render only when visible | `IntersectionObserver` (`rootMargin: 20%`) + `document.hidden`, both feeding `syncLoop()` |
| 4 | One shared rAF | `subscribeToTicker` — no second loop |
| 5 | Frame budget per tier | 30 fps mobile / 45 tablet / uncapped desktop |
| 6 | Clamp pixel ratio | 2.0 / 1.5 / 1.5 — see the note below on why mobile is the *highest* of the three |
| 7 | Cut fill | 4 meshes, no post-processing, no shadow maps, `stencil: false`; `antialias` on every tier |
| 8 | As few lights as the look survives | One `DirectionalLight` + a PMREM'd `RoomEnvironment`; `AmbientLight` for lift. No light is added or removed at runtime |
| 9 | No per-frame allocation | The loop mutates three rotations and calls `render()`; no `Vector3`/`Matrix4` is constructed in it |
| 11 | No cursor on touch | `budget.pointer` is `false` below desktop — the listener is never attached |
| 13 | iOS details | No `resize` listener on touch (`ResizeObserver` only on the pointer tier); `dt` clamped to 50 ms; wrapper promoted with `transform-gpu backface-hidden will-change-transform` |
| 13 | Dispose | Every geometry, material, texture and listener is tracked and released in `dispose()` |

**Deliberate deviation:** `alpha: true`. §7 prefers an opaque canvas, but the tag
floats over the page's cream background *and* over the brand glow behind it — an
opaque canvas would have to bake in a colour that changes with what is behind it.

## Two things that are easy to break

**The frustum is framed around the *swung* tag, not the resting one.** The
pendulum's arc is wider than the card, so the camera distance (7.8), the pivot
height and `MAX_SWING` (0.2 rad) are a set — change one and the far bottom
corner clips against the canvas edge. At 7.8 on a 4:5 canvas the far bottom
corner sits at ~1.53 units against a half-width of ~1.9; that ~20 % is the whole
margin. Moving the camera any closer, widening the swing, or lengthening the
cord all spend the same budget. The loop also hard-stops the angle at
`MAX_SWING` and bounces it back, so no pointer flick can push it out of frame.

**Mobile has the highest pixel-ratio clamp, not the lowest.** This looks wrong
against every optimisation guide, and the guides are right — *for a scene that
fills the viewport*. This one is ~250×312 CSS px. Clamping it to 1.0 meant
drawing 78k pixels and then letting the browser stretch them across a 3× phone
screen: the tag was rendered at a third of the resolution of the text beside it,
and the shop reported it as broken on a phone while calling the desktop version
perfect. At 2.0 it is 312k pixels — 10 % of a full-screen render on a 3× handset,
four meshes, no post-processing, capped at 30 fps.

The lesson generalises: a per-tier budget is meaningless without the canvas size
it applies to. If this scene ever grows to fill the hero on a phone, this clamp
has to come back down.

**The lighting is deliberately under 1.0 total** (key 1.15 + ambient 0.35 +
environment 0.4). Cream paper under a strong key clips to pure white and takes
the small printed lines with it — the tag renders as a blank card. If the tag
ever looks washed out, that is the first thing to check, not the texture.

## The tag has its own colours

The scene reads `--tag-paper` / `--tag-ink` / `--tag-ink-muted` / `--tag-accent`,
**not** the page's surface and foreground roles. A swing tag is a printed object:
its colours belong to the card, not to the page it hangs in front of. `--tag-paper`
is white rather than cream — on the cream ground a cream card had almost no edge
and read as a ghost on a phone.

**The plinth.** White paper on a cream page is a weak contrast, and at 250 px the
tag lost against it even after the paper went white. Below `sm` the tag therefore
hangs against `bg-surface-inverse` — a dark rounded panel in the hero grid cell.
The canvas is `alpha: true`, so the plinth simply shows through it. It is
phone-only on purpose: from `sm` up the canvas is 384 px and the tag carries
itself, where a dark block would read as a hole punched in the page.

Two things fall out of that. The scene never has to react to a theme change
after construction (it samples the tokens once, in the React leaf, and builds
the texture from them; the site has one appearance anyway — see [[decisions-log]]
ADR-0026). And `<TagCard>` — which uses the same roles — matches
the canvas exactly, so the cross-fade between them is invisible.

**Reduced motion / energy saver:** `sceneShouldFreeze()` settles the pendulum,
draws one resting frame and never subscribes to the ticker. WebGL keeps the last
frame on the canvas, so a frozen scene costs nothing.

## Not yet measured

The §14 before/after numbers do not exist for this scene: it is new (no
"before"), and the budgets were taken from the skill's guidance rather than from
a profile of this project on a real phone. Before shipping, run the §0 harness
against a production build and confirm `renderer.info.programs.length` is stable
after the cross-fade.

## Related

[[optimize-3d-scene]] · [[animation-system]] · [[design-system]] · [[components/ui]]
