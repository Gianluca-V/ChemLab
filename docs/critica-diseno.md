---
titulo: Crítica del documento de diseño
fecha: 2026-08-29
objetivo: design-import/ChemLab Mobile First.dc.html
puntaje: 21/40
estado: histórico — la mayoría de los hallazgos ya están resueltos en specs/
---

> ## Cómo leer este documento
>
> Es una **auditoría del documento de diseño**, no de la implementación ni de las SPECs.
> Se corrió el 29/08/2026, **antes** de que existiera `specs/`.
>
> Se conserva porque justifica decisiones que hoy están en las SPECs: por qué la leyenda de
> categorías aparece en mobile, por qué las celdas son `<button>`, por qué la tipografía se
> normalizó a 7 pasos, por qué existe el estado de estrella llena.
>
> **El puntaje 21/40 no describe el estado actual del proyecto.** La mayoría de los hallazgos
> están resueltos en `specs/` y consolidados en `design-import/CORRECCIONES.md`.
>
> Dos salvedades verificadas después de esta auditoría:
>
> 1. El **P0 de la tabla periódica** ("`overflow:hidden`, nada scrollea") es un defecto de la
>    maqueta contra su propia intención: el figcaption del frame 03 rotula "scroll en ambos ejes"
>    y dibuja el hint "deslizá →". No hubo que rediseñar nada — ver SPEC 03 §4.
> 2. La colisión del **acento violeta con Gases Nobles** ya estaba corregida en los tokens del
>    diseño: `--cat-ng` fue desplazado de 300 a 265 y `--cat-ac` de 10 a 340 — ver SPEC 14 §2.
>
> El análisis corrió en modo degradado (sin `htmlparser2`, `css-select`, `css-tree` ni `domutils`)
> y sin superposición de navegador. Sus propias advertencias al respecto están más abajo.

---

target: ChemLab Mobile First.dc.html
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-08-29T22-19-21Z
slug: design-import-chemlab-mobile-first-dc-html
---
Method: dual-agent (A: design review, isolated · B: detector + browser evidence, isolated)

⚠️ Detector caveat: the CLI scan itself ran DEGRADED — `htmlparser2`, `css-select`, `css-tree` and `domutils` were unavailable, so `detect.mjs` fell back to regex matching. Custom properties, selector matching and computed contrast were **never evaluated by the CLI**. Its exit-2 result (18 findings) is an undercount, not a clean bill of health. Assessment B compensated with a hand-rolled 829-element parser doing alpha compositing, `color-mix()` resolution and oklch→sRGB→WCAG luminance math; those numbers carry the contrast verdict, not the CLI's.

⚠️ Browser overlay: not available. `live-server.mjs` started but did not root at the target directory (404 on the file); no browser-automation tool is exposed to this session; and the file would render blank in a plain browser anyway, since the whole design lives in an `<x-dc>` template requiring the dc-runtime plus `window.React`/`ReactDOM`. **No visual overlay exists in any browser tab.** Both servers were killed by PID (`--stop` is not a supported flag and silently spawns a second server on 8401 — worth knowing).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | The most repeated action — ★ save — has no success confirmation in any of the 20 frames; no filled-star state exists anywhere; COMBINAR has no disabled state for an empty mixture |
| 2 | Match System / Real World | 3 | Rioplatense Spanish is natural and the chemistry vocabulary is correct; but "Laboratorio"/"Elementos"/"Mezcla"/"Tabla periódica" are four names for two things, and raw SMILES/InChIKey (L497–498) ship unexplained |
| 3 | User Control and Freedom | 2 | 🗑 delete favorite (633, 644, 654) and "Vaciar" history (669) destroy localStorage data with zero confirmation and no undo; no retry on API failure; no way to clear a star rating |
| 4 | Consistency and Standards | 2 | Confirmed by measurement: 18 font sizes (every integer 9→22), 20 border radii (seven consecutive 9–14px), 63.3% of spacing off a 4px grid, 39 near-duplicate hex pairs, two different hamburger implementations |
| 5 | Error Prevention | 1 | No confirmation on either destructive action, no disabled states anywhere, no over-limit behavior on the 200-char field, no guard against a 1-element mixture |
| 6 | Recognition Rather Than Recall | 2 | The 10-category color legend exists at tablet (865–871) and desktop (1035–1041) but on **no 390px frame** — the mobile table is hue-coded with no key |
| 7 | Flexibility and Efficiency | 2 | ↻ "Abrir de nuevo" (681) and the ± steppers (413–417) are real accelerators; but mobile is hamburger-only, no bottom nav, no keyboard spec, no ⌘K on desktop |
| 8 | Aesthetic and Minimalist Design | 3 | The most disciplined dimension — one accent, restrained mono/sans split, no decoration. Cost: frame 03 has no dominant element; the 46px cell stacks 8px/17px/6px type |
| 9 | Error Recovery | 2 | Error copy is plain and kind ("Los datos básicos siguen disponibles.", 547) but there is no **Reintentar** anywhere, and "no compound" is conflated with "API failed" in one frame |
| 10 | Help and Documentation | 2 | "Qué significan estas propiedades" (328–330) is excellent contextual teaching; nothing else in 20 frames does it |
| **Total** | | **21/40** | **Acceptable — bottom of band. Competent surface, badly under-specified states.** |

All ten heuristics apply. This is an Operate-mode app UI with forms, errors and repeat use; nothing is n/a.

## Design Specificity Verdict

**LLM assessment — split decision, roughly 30% authored / 70% template.**

The data layer is genuinely chemical: the table is placed by real group/period coordinates with a 10-hue category map (L1097–1099, `grid()` 1148–1156), the f-block breaks into rows 9–10 with an 8px spacer the way a real periodic table does, the mixture screen states stoichiometric normalization ("H + O + H y O + H + H generan la misma combinación normalizada", L431), detail carries electron configuration / electronegativity / oxidation states (322–327), results carry SMILES / InChIKey / PubChem CID (495–498), and locked discoveries leak exactly one hint — element count (726–731). No generic template produces those decisions.

The interface layer around it is 2021-issue dark mobile SaaS: 42px phone bezels with a 9:41 status bar, hamburger-left + title-left repeated 14 times, `#13151b` cards with `#1e2129` borders, pill chips, a bottom sheet with a drag handle, a 2×2 stat grid, an "8 / 30" progress bar. Swap "Oxígeno" for "Factura #4021" and frames 01, 05, 12, 13, 14 need zero structural edits.

And one choice actively fights the product: the accent `oklch(0.72 0.15 300)` is violet for no chemical reason, and **hue 300 is already assigned to Gases nobles** (L1099). Selected cells are `oklch(0.72 0.15 300) 30%`; noble-gas cells are `oklch(0.72 0.09 300) 16%` (L1136–1139) — same hue, differing only in chroma and mix, rendered at 46px. On a phone they read identically. Likewise `ac: ['Actínidos', 10]` sits beside the hazard red `oklch(0.72 0.15 25)` (545, 580, 598) — actinides look like errors. The one seam where content meets form is where the system collides with itself.

**Deterministic scan (degraded, regex-only).** 18 findings, exit 2, across exactly two rules:
- `overused-font` ×17 (L14, 16, 84, 204, 250, 342, 372, 433, 509, 549, 600, 669, 772, 813, 878, 966, 1063) — `font-family:'Space Grotesk'`.
- `dark-glow` ×1 (L765) — colored box-shadow on a dark page.

**Where the detector and the review agree:** nowhere meaningful, and that itself is the finding. The degraded pass could only reach two rule families; the 73 contrast failures, the 12 sub-44px targets and the entire consistency sprawl are invisible to its exit code. A student reading "18 findings, 2 rules" would conclude this file is in good shape. It is not.

**Where the detector caught what the review missed:** the measurement pass (not the CLI) surfaced 39 near-duplicate hex pairs at ≤3 channel delta — `#13151b`/`#14151a`/`#12141a`/`#14161c` all coexisting, `#1c1f26`/`#1c1f27` at Δ=1. The design review read the palette as disciplined; the measurement shows four indistinguishable surface greys doing one job.

**False positives, and one false negative:**
1. `overused-font` ×17 should be ×1. A `.dc.html` canvas has no cascade across device frames, so the family is re-declared inline in each; 16 of 17 hits are the same decision echoed by the file format. The underlying judgment ("Space Grotesk is saturated") is one legitimate data point, not seventeen, and must not dominate.
2. `dark-glow` at L765 is a misfire. The declaration is `box-shadow:0 0 0 6px color-mix(...)` on an 18×18px map pin — **blur radius is 0**. That is a solid concentric ring, the standard map-pin halo idiom, not a blurred glow. The rule's own description scopes it to blurred shadows; the regex fallback matched zero-offset + chromatic without reading the blur term. It is also the file's only colored shadow; every other is neutral `rgba(0,0,0,…)`.
3. **False negative, and this one matters.** Assessment B's semantic check reported "div/span with cursor:pointer that is not a button: 0." Verified directly against source: that is a blind spot, not a pass. The check only catches divs that *declare* `cursor:pointer` — and these do not. L191 renders all 118 element cells as `<div>`; L179–182 render the filter chips as `<span>`; L228/232/236 render the four dropdowns as `<div>` with a "▾" glyph. They are non-interactive markup that looks interactive. Assessment A's finding stands; the detector's zero does not overturn it.

## Overall Impression

The chemistry is real and the surface is competent. What is missing is the half of a spec that removes decisions from the implementer: states, tokens, and truthful claims.

Three of the four assertions on the accessibility card (L1089) are contradicted by the markup directly above it — `<button>` with aria-label, visible focus rings, and AA contrast on both themes. The 44px touch-target chip (L34) is broken by four mobile components. The header claims "15 pantallas mobile" against 18. A document whose job is to be authoritative is currently making claims a reader can falsify in a minute.

The single biggest opportunity: **publish the token layer this document keeps referring to and does not have.** L787 says "mismas variables CSS" while the file defines zero custom properties and hard-codes ~60 hexes inline. That absence is not cosmetic — it is precisely why the light theme drifted (dark-theme greys survive into the light frames at L796, 862–865, 869) and why four indistinguishable surface greys coexist.

## What's Working

**1. The mixture stepper (L403–420)** is a genuinely well-designed domain control. Each row carries symbol tile, name, *hazard tag*, and a −/count/+ stepper where every segment is 44px tall with correctly split radii (`11px 0 0 11px` / `0 11px 11px 0`) and per-element aria-labels. It solves stoichiometry — quantity, not just membership — which is the actual chemistry problem, without inventing a novel affordance. This is what "brand lives in precise details" looks like in Operate mode.

**2. "Qué significan estas propiedades" (L328–330).** Forty words that read the data back causally: electronegativity 3.44 → attracts electrons → polar bonds → oxidizer → supports combustion without burning. It converts a spec sheet into teaching. No generic template contains that block.

**3. The empty state at frame 07 (L368–374)** does all three things empty states must: names the situation, explains the mechanism in one sentence, offers the one resolving action at 52px. The problem is that it is the only empty state in 20 frames.

Worth crediting separately: **44 aria-labels across 70 buttons and 13 links, with zero textless controls unlabeled.** Where this document uses real `<button>`, it labels them properly. The failure is which elements it chose not to make buttons.

## Priority Issues

### [P0] The periodic table — the app's primary interface — is unusable at 390px and is not interactive markup

**What.** With `cellW` defaulting to 46 (L1095) and a 3px gap, the grid is **18 × 46 + 17 × 3 = 879px wide** against a ~356px content area. Roughly 7 of 18 groups are visible; reaching Group 18 needs **523px of horizontal scroll**. Vertically `repeat(7,52px) 8px repeat(2,52px)` plus gaps = **503px** against ~470px available, so the lanthanide/actinide block clips off the bottom too. The container at L188 is `overflow:hidden` with no `overflow-x`, so nothing scrolls at all — while the figcaption (L209) claims "scroll horizontal contenido en la sección."

Legibility inside the cell: symbol `round(46*0.36)` = 17px (fine), atomic number `max(7, round(46*0.17))` = **8px**, name `max(5, round(46*0.14))` = **6px, ellipsised** (L1144–1147). A 6px element name is texture, not text. At the `cellW` minimum of 34 it drops to 5px. Tablet cells are **27×31px** (L1176) — a 27px touch target on a touch device.

And the cells are `<div>` (L191), not `<button>`: no tabindex, no aria-label, no role. The 118 most important interactive objects in the app are non-interactive markup, directly contradicting L1089.

**Why it matters.** RF1 and the entire mixture flow start here. A user who cannot see, read or tap an element cannot begin the task; a keyboard or screen-reader user cannot begin it at all. Task-blocking, not degraded.

**Fix.**
- Make the 390px table a real scroller: `overflow-x:auto; overflow-y:auto; -webkit-overflow-scrolling:touch` on L188, column scroll-snap, and a left fade to match the existing right fade (L199) so scroll position is legible.
- Raise the mobile cell floor to `cellW: 56` (h ≈ 64) and set `showName:false` for mobile in `renderVals` (L1174) rather than rendering 6px type. Symbol 20px + atomic number 10px is the readable minimum.
- Raise the tablet cell from 27 to 44 (L1176), or accept tablet as a reading view routing taps through a detail sheet.
- Convert the cell to `<button type="button" aria-label="{{el.name}}, símbolo {{el.sym}}, número atómico {{el.z}}">` in the `sc-for` at L190–196 (and 920, 1020), with a `:focus-visible` accent ring.
- Move `ng: ['Gases nobles', 300]` (L1099) to ~265 or ~335 so it stops colliding with the accent's selected state (L1136–1139). Same for `ac` (hue 10) vs the hazard red (hue 25).
- Add the category legend to the 390px frame. It exists at 865–871 and 1035–1041 but not on the breakpoint the document claims to design first.

**Suggested command:** `/impeccable harden`

### [P1] Contrast: 73 failing text nodes across 25 distinct pairs, and the light theme leaks dark-theme greys

Measured over 486 evaluated pairs with alpha compositing and `color-mix()` resolution:

| Ratio | Need | Foreground | Background | Count | Lines |
|---|---|---|---|---|---|
| **1.82** | 4.5 | `#3d4250` | `#13151b` | 3 | 586, 629, 650 |
| **1.88** | 4.5/3 | `#3d4250` | `#0f1116` | 3 | 369, 727, 731 |
| **2.57** | 4.5 | `#93969f` | `#fff`/`#efefec` | 1 | 865 |
| **2.88** | 4.5 | `#5f6472` | `#15171d`/`#191c23` | 1 | 496 |
| **3.19** | 4.5 | `#5f6472` | `#0f1116` | 2 | 728, 732 |
| **3.41** | 4.5 | `oklch(0.62 0.14 85)` | `#f6f6f4` | 1 | 849 |
| **3.88** | 4.5 | `#6f7484` | `#14161c` | 7 | 174, 175, 229, 234, 238, 906, 1004 |
| **3.88** | 4.5 | `#7c8191` | `#fff` | 5 | 832, 868, 869, 870, 871 |
| **3.95** | 4.5 | `#6f7484` | `#12141a` | 4 | 42, 1080, 1084, 1088 |
| **4.05** | 4.5 | `#6f7484` | `#0f1116` | 14 | 108, 185, 186, 465, 529, 654, 672, 682, 735, 775, 937, 951, 974, 1056 |
| **4.17** | 4.5 | `#6f7484` | `#0c0d11` | **25** | 53, 124, 158, 209, 259, 299, 347, 355, 375, 438, 468, 514, … |

Two systemic causes. **`#6f7484` accounts for 52 of the 73 failures** at 10–15px — it carries every figcaption, every section eyebrow, every search placeholder and all four annotation labels. And **`#3d4250` at 1.82–1.88:1 is load-bearing semantics**: at L629 and L650 the star rating renders as `★★★★<span style="color:#3d4250">★</span>`, so the only thing distinguishing 4 stars from 5 is a colour at 1.82:1, conveyed by colour alone, with no text alternative. Users cannot read their own ratings.

**The light theme is a find-and-replace that missed.** Frames 17–18 correctly swap surfaces to `#f6f6f4`/`#fff` and darken the accent — but `#7c8191`, a dark-theme grey, survives unchanged at L832 and L868–871 (3.88:1 on white), and `#93969f` at L865 lands at 2.57:1. L787 claims "mismas variables CSS" while the document defines none.

**Fix.** Retire `#6f7484` for text; promote `#868b9b` (≈5.5:1 on `#0f1116`) as the muted floor and keep `#6f7484` for hairlines only. Replace `#3d4250` for unfilled stars with `#5a5f6e` **and** add a text readout ("4/5") beside every star row so rating never depends on colour alone (629, 640, 650). Fix the light leaks at 832, 862–865, 868–871. Then add the `:root` token block the document keeps referencing — `--surface-0/1/2`, `--text-1/2/3`, `--accent`, `--hazard`, ten `--cat-*` hues, plus the `[data-theme="light"]` override. That single artifact is the highest-leverage addition available, and its absence is why the theme drifted.

**Suggested command:** `/impeccable colorize`

### [P1] States are missing across the board

Operate mode requires default / hover / focus / active / disabled / loading / error per component. This document specifies default, and once, loading.

- **One empty state in 20 frames** (07). No empty Favoritos, no empty Historial, no empty Descubrimientos — and **no zero-results state for search**, the single most likely outcome of a 5-filter form over 118 records. Frame 11 is a *no-compound* state; it does not cover *no results*.
- **No Reintentar anywhere.** The API-error card (541–546) sits on a screen whose only action is "Editar mezcla" (549). A user whose network blipped is told, in effect, that their chemistry was wrong.
- **No disabled state anywhere**: COMBINAR (433) on an empty mixture, "Buscar" (244) with no criteria, "Guardar" (601) with no rating, and L295 — literally a previous-page button on page 1 — all render identically to their enabled selves.
- **Zero `:focus`/`:focus-visible` styles** in the file, though L1089 promises "foco visible con anillo del acento." The only `<style>` block (16–21) defines `body`, `a`, `*` and scrollbars.
- **No hover/active states**, including on frames 19 and 20 which are explicitly pointer devices.
- **Destructive actions have no confirmation**: 🗑 (633, 644, 654) and "Vaciar" (669) wipe persisted localStorage in one tap, no undo.

**Fix.** Add a state-matrix row to the canvas: one 390px frame each for zero search results (with "Limpiar filtros" as recovery, reusing the frame 07 pattern), empty Favoritos, empty Historial, a `Reintentar` variant of frame 11, a destructive-confirm sheet, and a success toast. Add a component-state strip (button × default/hover/focus/active/disabled/loading) as a seventh notes card beside L1078–1090. Promote `Reintentar` to primary on the error card (546), demoting "Editar mezcla".

**Suggested command:** `/impeccable audit`

### [P1] The favorites form contradicts itself and specifies no success

**What.** Frame 12 shows four filled stars with a "4 / 5" readout (582–588, 595) *and simultaneously* a red validation card reading "Tenés que elegir una nota de 1 a 5 estrellas" (598). The frame asserts two mutually exclusive states — a student implementing it literally ships a form that errors on valid input. The error also sits at the bottom of the sheet beside Cancelar/Guardar rather than adjacent to the star field, with no `role="alert"` and no `aria-invalid`.

The 200-char counter reads "49 / 200" (595) with no near-limit or over-limit state: at 200, hard stop / warning / truncate is undefined. The field is labelled "Opcional" (594) while the intro (L31) presents the message as part of the deliverable. Tapping "Guardar" (601) has no specified outcome — no toast, no filled-star state, no return destination. And the rating cannot be cleared: five buttons, no zero-star path.

**Why it matters.** This is the graded RF5 form — the screen with the most rules and the least specification. Every ambiguity becomes a bug.

**Fix.** Split into **12a** valid (4 stars, no error card) and **12b** error (0 stars, all five `#5a5f6e`, error card moved directly under the star row above L590). Add `role="alert"` + `aria-invalid` and a red border on the star group in the error state. Add a 200/200 over-limit state with the counter in `oklch(0.72 0.15 25)`, Guardar disabled, hard `maxlength`, documented in the figcaption (605). Add a clear-rating affordance. Add the missing success beat: a filled-★ token and a toast frame — the ★ at L316, 344, 481, 629, 640, 651, 856, 1041 currently has **no filled variant**, so favorited and unfavorited look identical everywhere.

**Suggested command:** `/impeccable clarify`

### [P2] Consistency drift, measured

The frames share a resemblance, not a system. Measured:

- **18 distinct font sizes — every integer from 9 to 22**, 14 consecutive 1px steps. Five sizes below 11px. Not a modular scale.
- **20 distinct border radii**, seven consecutive values 9–14px covering 131 occurrences. The table cell computes its own (`Math.max(5, Math.round(w/8))`, L1135) so it lands on none of them.
- **63.3% of spacing off a 4px grid** (317 of 501 tokens). The two most-used values in the file, `10px` (71×) and `14px` (68×), are both off-grid. Every integer 1–14 appears.
- **39 near-duplicate hex pairs** at ≤3 channel delta: `#13151b`/`#14151a`/`#12141a`/`#14161c` are four surface greys doing one job.
- **Two hamburgers**: three `<span>` bars (60–64) on frame 01, a "☰" glyph everywhere else (178, 218, 268, …).
- **Primary button heights**: 52 (most), 56 (COMBINAR, 433), 52 (COMBINAR tablet, 966), 46 (COMBINAR desktop, 1063). The peak action changes size three times.
- **Chip heights**: 30, 32, 34, 36, 40. **Content padding** per frame: 22/18, 16/0, 20/18, 16/16, 18/18, 28, … no rule.
- **The document miscounts itself**: L36 claims "15 pantallas mobile"; there are 18 phone-sized frames.
- **Two numbering systems collide**: row headers "01 · Entrada y navegación" (54) vs frame captions "01 Home". "Revisá el 03" is ambiguous.

**Fix.** Publish the scale as a notes card beside L1078–1090: type `{11, 13, 15, 17, 22, 30}`, radii `{8, 12, 16, 24, 999}`, control heights `{36, 44, 52}`, spacing on a 4px grid, one surface grey per elevation. Then normalise: delete the span hamburger (60–64), make COMBINAR 56px at every breakpoint (433, 966, 1063), fix L36 to 18, renumber row headers A–E.

**Suggested command:** `/impeccable polish`

### [P2] Four mobile components break the document's own 44px rule

L34 states the constraint as a spec chip: `touch target mín. 44 px`. Measured violations:

| Line | Element | Height | Frame |
|---|---|---|---|
| 152, 153 | theme toggle buttons | **40px** | 02 Menú (mobile) |
| 669 | "Vaciar" | **36px** | 14 Historial (mobile) |
| 772 | "Ver mapa" | **40px** | 16 Contacto (mobile) |
| 996–1001 | 6 nav links | 38px | 20 Desktop |
| 1005, 1041 | icon buttons | 40px | 20 Desktop |

The desktop ones are defensible on a pointer device. The four mobile ones are not — and "Vaciar" at 36px is the most destructive action in the app, styled lighter than "Ver mapa". Compliant targets exist in volume (44px height ×51, width ×43), so this is drift, not absence of intent.

**Suggested command:** `/impeccable adapt`

## Persona Red Flags

**Casey (Distracted Mobile User)** — the canonical user of a mobile-first spec, and the design fights her. Every navigation is a top-left reach: the hamburger (178) and the back arrow "‹" (270, 310, 447, 476, 522) both sit in the hardest corner for a right-thumb grip, and there is no bottom tab bar in 16 mobile frames. The core loop (tabla → mezcla → combinar → resultado) demands that reach every time. `mixture` is a persisted key (1086) but no frame shows a restored-mixture state, so an interrupted experiment has no confirmed recovery. The table demands 523px of precise horizontal scrolling one thumb cannot do accurately. And she'd miss these targets: theme toggles 40px (152–153), "Vaciar" 36px (669), "Ver mapa" 40px (772), filter-removal chips 30px with a tiny "✕" (275–276).

**Sam (Accessibility-Dependent User)** — L1089 makes four claims; three are false against the markup. **"Acciones en `<button>` con aria-label"**: the 118 element cells are `<div>` (191, 921, 1021), the filter chips are `<span>` (179–182), the four dropdowns are `<div>` with a "▾" glyph (228, 232, 236), as are the state selector (240–242), pagination numbers (296–297), Favoritos tabs (621–622) and suggestion chips (536–539). Sam reaches none by keyboard; a screen reader announces them as text, and there is no native picker. **"foco visible con anillo del acento"**: zero focus styles exist. **"contraste AA sobre ambos temas"**: false in both, 73 failing nodes. Meaning is conveyed by colour alone in three places — star ratings (629/650, 1.82:1), the required-field asterisk (580, no `aria-required`), and the entire category system, which has no legend at 390px.

**Riley (Deliberate Stress Tester)** — probes the edges, finds nothing designed. 201 characters into the message field (592): no over-limit state, no `maxlength`, no truncate rule. `Metaloides + Gas + Grupo 16`: zero elements, no zero-results frame, undefined. Taps a suggestion chip (536) — a `<span>` styled exactly like the tappable filter chips: loads NaCl, replaces the mixture, or does nothing? Unspecified, and it's the classic looks-clickable-does-nothing. Taps 🗑 (633): instantly loses a favorite and its note from localStorage, no confirm, no undo. Pulls the network, taps COMBINAR: frame 11, no Reintentar, reconnects, still no Reintentar. Selects one element and taps COMBINAR: not a state.

**Project persona — "Nahuel," the student implementing this TP against a rubric** (~2 weeks, graded on RF1–RF8 in vanilla JS, will implement exactly what the spec shows and nothing it omits). He has no token list — L787 says "mismas variables CSS" and the document defines none, so he hard-codes ~60 hexes and discovers at light-theme time that he has no seam to flip, reproducing the exact failure the document already demonstrates at L832 and 868–871. He implements the validation literally and ships a form that errors over four filled stars. He implements *both* the 250ms debounce (247) and the submit button (244) because the spec contains both, ending with a search that fires twice against a results screen that fights the live filter. He skips every unspecified state because there is no frame for it, and loses rubric points on error handling and accessibility. And he ships the table as `<div>`s because that is the markup shown — then repeats L1089's accessibility claim in his own documentation and reports AA compliance he does not have. That last one is the worst outcome: a false claim he'll have to defend in a demo.

## Minor Observations

- L182: the 4th filter chip ships pre-truncated as **"Metaloi…"** — the design documents its own overflow bug as if it were a feature.
- L31 says "vistas RF1–RF8", but no frame carries an RF8 tag; RF1 is on a row header, RF2–RF7 on figcaptions. Inconsistent tagging of the exact thing being graded.
- L757–759: contact rows are 44px `<div>`s. Email, phone and address are the three highest-intent taps on a contact screen and none is an `<a href="mailto:/tel:">`.
- L776 offers "iframe OSM **o** Leaflet" — an unresolved either/or in a document whose job is to resolve those.
- L1067: the desktop panel shows the mixture as three inert 40px boxes with no steppers, while mobile (403–420) has full ± control. The larger screen has *less* capability.
- L247 (debounce, local filtering) contradicts L244 (a "Buscar" submit navigating to a separate results screen). The document specifies two search patterns.
- Data drift: Home says "7 descubiertos" (96) and the drawer "7/30" (149), while frames 10 and 15 say "8 de 30" (485) and "8 / 30" (702). Defensible as before/after — but nothing says so.
- `cellW` is a tunable prop (34–64, L1095) but only the mobile table reads it (1174); tablet and desktop are hard-coded to 27 and 44. The control implies a system it does not drive.
- Zero `<input>`, `<select>`, `<textarea>` and `<svg>` in the entire file — every form affordance is a styled `div`/`button`.
- The `9:41` status-bar time is Apple's marketing screenshot time. Harmless, but it's the tell that the phone chrome came from a template.
- L526: the failed mixture renders as `Xe₂Fe` — a believable choice of implausible compound. Good detail.

## Questions to Consider

1. **Why is the accent violet?** It has no chemical meaning, and hue 300 is already spoken for by Gases nobles. What if the accent came *out* of the domain — the category system extended, or a reaction-energy gradient — so "selected" and "noble gas" could never be confused?
2. **Why is the periodic table a table on a 390px phone?** You are forcing an 879px artifact through a 356px window and losing legibility, tappability and the legend. What would the phone-native "pick an element" look like — a searchable list grouped by category, with the grid demoted to tablet/desktop? The document already proves the grid works beautifully at 834px and 1280px.
3. **What is the difference between "Laboratorio", "Elementos", "Tabla periódica" and "Mezcla"?** Seven drawer doors into arguably three places. Cut to four and you land inside working-memory limits and free the thumb zone for a bottom tab bar.
4. **What happens in the 800ms after COMBINAR?** Right now, a spinner that shows nothing of what the user just built. What if the mixture stayed on screen and transformed — H, H, O converging into H₂O? That is the one place in an Operate product where motion earns its keep, and it is the peak of the emotional journey.
5. **What does this document give the implementer that a screenshot wouldn't?** Currently: figcaptions. No callouts, no token table, no state matrix, no interaction or motion spec — and three of four accessibility claims are contradicted by the markup above them. What is the smallest addition that makes this document authoritative rather than illustrative?
6. **If a user saves a favorite and nothing visibly happens, did it save?** Twenty frames, eight ★ instances, zero filled states, zero confirmations.
