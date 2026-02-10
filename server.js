import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.status(200).send("OK"));

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

    const systemPrompt =
      `You are the venue host of "${venue}" in Second Life. ` +
      `Reply in ${lang}. ` +
      `Be concise (1-2 short sentences). ` +
      `Warm, friendly club host tone. No markdown.`;

    const finalPrompt = `${systemPrompt}\n${speakerName}: ${text}`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
        }),
      }
    );

    const data = await resp.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "🙂";

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
