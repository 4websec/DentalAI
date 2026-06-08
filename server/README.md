# ShadeMatch — Smile Generation Backend

This small service powers the **"🦷 No teeth? Generate a smile"** button in the
Try On tab. It takes a photo plus a mask of the mouth region and uses an
image-inpainting model to paint in **photorealistic teeth** in the chosen shade.

> ⚠️ **This is the one part of ShadeMatch that is _not_ fully private.** The
> auto-detect / brush / tint features all run on your device. Smile generation
> sends the photo to whatever image model you configure here. Deploy it
> yourself and tell users clearly. Treat face photos as sensitive data.

## How it fits together

```
Browser (Try On tab)                    This backend                Image model
─────────────────────                   ─────────────               ───────────
detect mouth (MediaPipe, on-device)
build image + white mask  ──POST JSON──▶ flip mask to alpha
                                         call provider   ──────────▶ inpaint teeth
show returned image       ◀──{image}──── return base64   ◀──────────
```

## Setup

```bash
cd server
npm install
OPENAI_API_KEY=sk-your-key npm start
# → ShadeMatch teeth-gen listening on :8787
```

### Environment variables

| Var              | Required | Default        | Notes                                   |
|------------------|----------|----------------|-----------------------------------------|
| `OPENAI_API_KEY` | ✅       | —              | Your image-model API key                |
| `PORT`           |          | `8787`         | Listen port                             |
| `IMAGE_MODEL`    |          | `gpt-image-1`  | Inpainting-capable image model          |
| `IMAGE_SIZE`     |          | `auto`         | Output size (`auto`, `1024x1024`, …)    |
| `ALLOW_ORIGIN`   |          | `*`            | CORS origin — **lock this down** to your app's URL in production |

## Connecting the app to it

Open the Try On tab, tap **"No teeth? Generate a smile"**, and paste your
deployed endpoint URL when prompted. It's saved on that device only
(`localStorage` key `sm_gen_endpoint`). To preconfigure it, set
`window.SHADEMATCH_GENERATE_URL` before the app script runs.

The endpoint accepts `POST` JSON:

```json
{
  "image":    "data:image/png;base64,…",
  "mask":     "data:image/png;base64,…",   // white = where to add teeth
  "shade":    "B1",
  "shadeHex": "#E8E2CC",
  "prompt":   "natural realistic teeth, dental crown shade B1, …"
}
```

and responds with `{ "image": "data:image/png;base64,…" }`.

## Deploying

Any Node ≥ 20 host works (Render, Railway, Fly.io, a small VM, or a serverless
function — the `generate()` function is easy to lift out). Set the env vars,
expose the port over HTTPS, and restrict `ALLOW_ORIGIN` to your app's domain.

## Using a different provider

Swap the body of `generate()` in `generate-teeth.js`. The contract is simple:
take the `image` + `mask` buffers and the `prompt`, return a base64 data URL.
Stability AI, Replicate (e.g. SDXL inpainting), or any inpainting endpoint can
drop in here. Keep `toEditableMask()` if your provider uses the
transparent-area-is-editable convention; adjust if it expects white-is-editable.

## Limitations & ethics

- Results are an **illustrative preview**, not a clinical or guaranteed outcome.
  Keep the app's disclaimer visible.
- Generative models can hallucinate unrealistic teeth — review every result.
- Get consent before sending anyone else's photo to a third-party model.
