# Hero «living engraving» — Higgs Field prompts (Seedance 2.0)

Один анимированный гравюрный ассет в герой. Техника как у Kyle Skelly, но в нашей айдентике
(Postcard/Letterpress: сепия/винная тушь на кремовой бумаге). Готовое видео вшивается через
`mix-blend-mode: multiply`, поэтому **фон обязан быть светлым/кремовым/near-white** — тогда он
«выбьется» и гравюра ляжет на бумагу сайта.

## ⚠️ Жёсткие требования к ассету (иначе не ляжет)
- **Фон:** сплошной near-white / very light cream (`#FBF7EF`-ish). НЕ тёмный, без рамок, без шашечек.
- **Тушь:** монохром — тёмная sepia/ink (`#2C2620`) + лёгкий винный (`#7E3B4E`) и золотой (`#E7C200`) акцент. Стиль — 19th-century copperplate engraving (как наши марки).
- **Композиция:** центрированная, объект не касается краёв (запас по краям — иначе обрежется/края попадут под vignette).
- **Текст:** никакого текста/букв/цифр (их добавим кодом).
- **Движение:** очень тонкое и **зацикливаемое** (seamless loop), статичная камера, без панорам/зума/тряски.

---

## Вариант A (рекомендую) — печатный пресс в действии
Самый «на бренде» (Печатня «Искра»).

**Шаг 1 — Nano Banana 2/Pro (картинка):**
```
A 19th-century cast-iron letterpress printing press, centered, three-quarter view, a freshly
printed card emerging from under the platen. Vintage copperplate engraving, fine line hatching,
monochrome dark sepia ink with a faint wine and gold accent. SOLID NEAR-WHITE CREAM BACKGROUND
(#FBF7EF), no border, no checkerboard. Centered with generous empty margin around it. No text,
no letters, no numbers.
```
**Шаг 2 — Seedance 2.0 (image → video):**
```
Subtle, loopable motion only: the press lever slowly rocks once, a faint puff of paper dust
drifts up, a tiny gold spark flickers near the plate. Everything else perfectly still. Static
camera, no panning, no zoom, no cropping at the edges. Keep the solid cream background unchanged.
Slow, calm, seamless loop.
```

## Вариант B — сургуч с живой искрой
Компактный фокусный объект, идеально лупится.
**Nano Banana:**
```
A wax seal medallion with a small flame/spark above it, centered. 19th-century copperplate
engraving, monochrome dark sepia ink with wine (#7E3B4E) seal and gold (#E7C200) spark. SOLID
NEAR-WHITE CREAM BACKGROUND (#FBF7EF), no border. Centered, generous margin. No text/letters/numbers.
```
**Seedance 2.0:**
```
Only the flame/spark gently flickers and a few tiny gold embers drift upward and fade. The seal
and everything else stay completely still. Static camera, no pan/zoom, nothing cropped at edges.
Solid cream background unchanged. Slow, seamless loop.
```

---

## Настройки в Higgs Field (Seedance 2.0)
- Режим: **Image → Video**, модель **Seedance 2.0**.
- **Multi-Shot — OFF**, **Native Audio — OFF**.
- Длина **5s**, формат **16:9** (или 1:1 для варианта B), 720p+.
- Стартовый кадр = картинка из Nano Banana. Без end-frame (нужен ровный луп, не «путешествие»).

## Что я делаю после
Ты присылаешь MP4 — я: ffmpeg-сжимаю (h264 + webm, <1 МБ, faststart), делаю seamless-loop и
постер-кадр, при необходимости подтяну уровни до чистого белого, вошью в `<HeroVideo>` с
`mix-blend-mode: multiply` + lazy + poster + reduced-motion/мобайл-гарды.

**Выбери вариант (A или B) и сгенери — пока генеришь, я строю грид и компоненты.**
