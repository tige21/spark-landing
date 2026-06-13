# Landing — new engraving prompts (generate one at a time)

Reused from the app (already in `src/assets/engravings/`, 27 files): celestial/decks/postal backgrounds, wax seal, postmark, parcel, paywall crest, empty mailbox, colophon, 3 phase scenes, success seal, spark mark, age emblem, 3 onboarding heroes, 9 deck-stamp SVGs.

NEW stills to generate below. **Generate at ≥2048px** (parallax crop headroom). Use the shared footer baked into each prompt. Some are WIDE (landscape) — set the aspect accordingly.

---

### 1. Hero key-art — workshop wide (landscape 16:9, ≥2560px)
```
A wide panoramic 19th-century copperplate engraving of a cozy letterpress / postal workshop interior: a
hand printing press on the left, a wall of pigeonhole mail slots, a writing desk with quill and wax seals,
stacks of cards and sealed letters, warm lamplight. Atmospheric depth (foreground desk, mid press, back
wall) so it can be sliced into parallax layers. Vintage engine-ruled line work. Background: SOLID PURE
WHITE (#FFFFFF), no checkerboard. SINGLE ink color, soft muted taupe-brown, monochrome hatch shading. No
text, no letters, no numbers.
```

### 2. Hero foreground desk objects (landscape, transparent)
```
A row of 19th-century engraved desk objects isolated for a foreground layer: a quill in an inkwell, a
stack of wax-sealed letters, a brass bell, an open ledger, scattered cards. Arranged low and wide as if on
a desk edge. Vintage copperplate engraving, fine line work. Background: TRANSPARENT (or SOLID PURE WHITE
#FFFFFF, no checkerboard). SINGLE muted taupe-brown ink, monochrome. No text, no numbers.
```

### 3-5. Three "mode" engravings (square 1:1 each, generate separately)
```
[A] Square 1:1. Two engraved chairs facing each other across a small candle-lit table — "just the two of
you". [B] Square 1:1. A ring of four-five raised glasses around a table — "with friends". [C] Square 1:1.
An engraved wax seal medallion with a small flame — "grown-ups only". Each: vintage copperplate engraving,
centered, SOLID PURE WHITE (#FFFFFF) background no checkerboard, SINGLE muted taupe-brown ink monochrome,
no text/letters/numbers.
```

### 6. Route connector (wide, transparent)
```
A horizontal engraved dotted travel route — like an old map's dashed path with small compass ticks and a
tiny postal coach midway — to connect steps left-to-right. Vintage copperplate line work. Background SOLID
PURE WHITE (#FFFFFF) no checkerboard. SINGLE muted taupe-brown ink. No text, no numbers.
```

### 7. Phone bezel (portrait, transparent)
```
An ornate engraved picture-frame / phone-shaped bezel: a tall rounded-rectangle frame with fine
guilloche border and small corner flourishes, EMPTY transparent center (a screen capture goes inside).
Vintage copperplate engraving. Background SOLID PURE WHITE (#FFFFFF) no checkerboard. SINGLE muted
taupe-brown ink. No text, no numbers.
```

### 8. Deck shelf (wide landscape, transparent)
```
A wide engraved wooden display shelf / card rack seen straight-on, with empty slots where postage-stamp
cards will be placed (do not draw the stamps — just the shelf). 19th-century cabinetry engraving with
wood-grain hatching. Background SOLID PURE WHITE (#FFFFFF) no checkerboard. SINGLE muted taupe-brown ink.
No text, no numbers.
```

### 9. Printing press in motion — wide (landscape, transparent)
```
A 19th-century hand printing press mid-impression, lever pulled, a freshly printed card emerging, a faint
puff of motion — wide composition for the "order your deck" section. Vintage copperplate engraving, rich
hatch shading. Background SOLID PURE WHITE (#FFFFFF) no checkerboard. SINGLE muted taupe-brown ink. No
text, no numbers.
```

### 10. Seamless paper-texture tile (square, tileable)
```
A seamless, tileable subtle engraved paper texture: very faint cross-hatch and laid-paper lines, edge-to-
edge repeating with no visible seams, extremely low contrast (a background wash). Warm cream tone. Vintage
letterpress paper feel. NOT a scene — just texture. SINGLE very pale taupe ink on warm cream (#FBF7EF).
No text, no objects.
```

---

Hand back into `src/assets/engravings/`. I key transparency (white→alpha), export AVIF/WebP at the needed sizes, and slice the hero/workshop into 3 parallax layers in code.
