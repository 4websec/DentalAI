# 🦷 ShadeMatch — Crown Shade Selector

A simple, private web app to help you choose the right **shade (color)** for a
dental crown before and during your dentist appointment.

Getting a crown means picking a color that blends with your natural teeth.
The shade is decided in the chair, often in just a few minutes — and once a
porcelain crown is made, the color **can't be changed**. ShadeMatch helps you
walk in prepared, with a candidate shade in mind and the right questions to ask.

## Features

- **Shade Guide** — Browse the standard **VITA Classical** shade system
  (A1–A4, B1–B4, C1–C4, D2–D4) as visual tooth swatches. Sort by hue family or
  by brightness, tap any shade for details, and save one as your candidate.
- **Shade Finder** — A short guided questionnaire (current tooth color, age,
  goal, whitening plans) suggests a sensible starting shade to discuss with
  your dentist.
- **Compare** — Hold your candidate crown shade side-by-side with a neighboring
  tooth shade, against different backgrounds, with a plain-language verdict on
  how well they match.
- **Try On** — Take or upload a photo of your smile and preview any shade
  applied directly to your teeth.
  - **✨ Auto-detect teeth** — an on-device AI face model (Google MediaPipe)
    finds your mouth and automatically marks the teeth, no brushing needed. The
    model loads from a CDN the first time, but your photo never leaves the
    browser. A manual touch-up brush is available to refine edges.
  - A **luminance-preserving tint** keeps the teeth's natural highlights and
    shadows so the recolor looks realistic. Adjust intensity, hold to compare
    before/after, and save the result.
  - **🦷 No teeth? Generate a smile** — for missing/no teeth, this calls an
    optional backend that uses an image-generation model to paint in
    photorealistic teeth in the chosen shade. **This feature sends the photo to
    a server you deploy** (see [`server/`](server/README.md)) and is off until
    you configure an endpoint. Everything else in the app stays on-device.
- **My Shade** — Your saved candidate shade, personal notes, and a checklist of
  smart questions to ask your dentist. Print it or save as PDF to bring along.
- **Prep Tips** — Practical, dentist-approved advice on getting an accurate
  shade match (lighting, timing, makeup, matching to neighbors, and more).

## How to use

Just open `index.html` in any modern web browser — no installation or build
step required. (The auto-detect model and smile generation need internet; every
other feature works fully offline.)

```
# from the project folder
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

All your data (candidate shade, notes, checklist) is stored **locally in your
browser** via `localStorage`. Your photo is processed on-device for tinting and
auto-detect. The **only** time anything leaves your device is if you opt into
**smile generation**, which sends the photo to the backend you deploy.

## Important

ShadeMatch is an **educational tool** to help you prepare for a conversation
with your dental professional. On-screen colors are approximations and vary by
screen and lighting — they **cannot replace** a physical shade tab held against
your teeth in your dentist's chair. Always confirm the final shade with your
dentist.
