// =====================================================
// amor-ai-host (Gemini Bridge) - server.js
// Creator: Kayra Bayraktar
// =====================================================

import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.status(200).send("OK"));

// Debug: list available models (to verify what your key can access)
app.get("/models", async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return res.status(200).send("⚠️ GOOGLE_API_KEY ayarlı değil.");

    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const r = await fetch(url);
    const data = await r.json();

    if (!r.ok) {
      const msg =
        (data && (data.error?.message || JSON.stringify(data.error))) ||
        "unknown";
      return res.status(200).send(`⚠️ LISTMODELS ${r.status}: ${msg}`.slice(0, 1000));
    }

    // Keep it short
    const names =
      data && data.models
        ? data.models
            .map((m) => m.name)
            .filter(Boolean)
            .slice(0, 50)
            .join("\n")
        : "no models";

    return res.status(200).send(names);
  } catch (e) {
    return res.status(200).send("⚠️ LISTMODELS crash");
  }
});

app.post("/chat", async (req, res) => {
  try {
    const body = req.body || {};

    const text =
      (typeof body.text === "string" && body.text.trim()) ||
      (typeof body.message === "string" && body.message.trim()) ||
      (typeof body.prompt === "string" && body.prompt.trim()) ||
      "";

    const speakerName =
      (typeof body.speakerName === "string" && body.speakerName.trim()) ||
      "Visitor";

    const lang = (typeof body.lang === "string" && body.lang.trim()) || "TR";
    const venue = (typeof body.venue === "string" && body.venue.trim()) || "aMOR";

    if (!text) return res.status(200).send("🙂");

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return res.status(200).send("⚠️ GOOGLE_API_KEY ayarlı değil.");

    // ✅ Use stable v1 endpoint
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    const systemPrompt =
      `You are the venue host of "${venue}" in Second Life. ` +
      `Reply in ${lang}. ` +
      `Be concise (1-2 short sentences). ` +
      `Warm, friendly club host tone. No markdown.`;

    const finalPrompt = `${systemPrompt}\n${speakerName}: ${text}`;

    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }],
      }),
    });

    const data = await resp.json();

    // Show Gemini errors directly back to SL
    if (!resp.ok) {
      const msg =
        (data && (data.error?.message || JSON.stringify(data.error))) ||
        "unknown";
      return res
        .status(200)
        .send(`⚠️ GEMINI ${resp.status}: ${msg}`.slice(0, 220));
    }

    const reply =
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
        ? String(data.candidates[0].content.parts[0].text).trim()
        : "🙂";

    return res.status(200).send(reply);
  } catch (err) {
    console.error("CHAT_ERROR:", err);
    return res
      .status(200)
      .send("Şu an kısa bir aksaklık var, birazdan tekrar deneyelim.");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server listening on", port));
