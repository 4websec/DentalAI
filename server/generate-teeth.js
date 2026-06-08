/*
 * ShadeMatch — photorealistic smile generation backend
 * ----------------------------------------------------
 * A tiny, dependency-light Node service that the Try On tab calls to paint
 * realistic teeth into the mouth of a photo (for people with missing/no teeth).
 *
 * It receives { image, mask, shade, shadeHex, prompt } as base64 PNGs and runs
 * an image-inpainting model. The default provider is OpenAI's image edits API
 * (model: gpt-image-1). Swap providers in `generate()` if you prefer another.
 *
 * The browser produces a binary mask (white = where teeth should go). This
 * service converts it to the alpha convention the provider expects.
 *
 * REQUIRED ENV:
 *   OPENAI_API_KEY   your image-model API key
 * OPTIONAL ENV:
 *   PORT             default 8787
 *   IMAGE_MODEL      default "gpt-image-1"
 *   IMAGE_SIZE       default "auto"
 *   ALLOW_ORIGIN     CORS origin, default "*" (lock this down in production)
 *
 * Run:  OPENAI_API_KEY=sk-... npm start
 * Needs Node >= 20 (global fetch / FormData / File / Blob).
 */
const http = require("http");
const { PNG } = require("pngjs");

const PORT = process.env.PORT || 8787;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.IMAGE_MODEL || "gpt-image-1";
const SIZE = process.env.IMAGE_SIZE || "auto";
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";
const MAX_BYTES = 25 * 1024 * 1024;

function dataUrlToBuffer(dataUrl) {
  const m = /^data:.*?;base64,(.*)$/s.exec(dataUrl || "");
  return Buffer.from(m ? m[1] : (dataUrl || ""), "base64");
}

// Browser sends white = "generate here". OpenAI edits treat *transparent*
// pixels as the editable region, so flip white -> alpha 0, everything else opaque.
function toEditableMask(buf) {
  return new Promise((resolve, reject) => {
    new PNG().parse(buf, (err, png) => {
      if (err) return reject(err);
      for (let i = 0; i < png.data.length; i += 4) {
        const white = png.data[i] > 127 && png.data[i + 1] > 127 && png.data[i + 2] > 127;
        png.data[i + 3] = white ? 0 : 255;
      }
      const chunks = [];
      png.pack()
        .on("data", c => chunks.push(c))
        .on("end", () => resolve(Buffer.concat(chunks)))
        .on("error", reject);
    });
  });
}

async function generate({ image, mask, prompt }) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set on the server");
  const imageBuf = dataUrlToBuffer(image);
  const maskBuf = await toEditableMask(dataUrlToBuffer(mask));

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", prompt || "natural, realistic, healthy upper and lower teeth, photorealistic, matching the photo's lighting");
  form.append("size", SIZE);
  form.append("n", "1");
  form.append("image", new File([imageBuf], "image.png", { type: "image/png" }));
  form.append("mask", new File([maskBuf], "mask.png", { type: "image/png" }));

  const r = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form
  });
  if (!r.ok) throw new Error(`Provider error ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const b64 = j.data && j.data[0] && j.data[0].b64_json;
  if (!b64) throw new Error("Provider returned no image");
  return "data:image/png;base64," + b64;
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (req.method === "GET") { res.writeHead(200); return res.end("ShadeMatch teeth-gen is running. POST JSON to this URL."); }
  if (req.method !== "POST") { res.writeHead(405); return res.end("POST only"); }

  let body = "";
  req.on("data", c => { body += c; if (body.length > MAX_BYTES) req.destroy(); });
  req.on("end", async () => {
    try {
      const image = await generate(JSON.parse(body));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ image }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String((e && e.message) || e) }));
    }
  });
});

server.listen(PORT, () => console.log(`ShadeMatch teeth-gen listening on :${PORT}`));
