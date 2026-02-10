import express from "express";

const app = express();
app.use(express.json({ limit: "64kb" }));

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

function safeText(s) {
  if (!s) return "";
  s = String(s);
  if (s.length > 280) s = s.substring(0, 280);
  return s.replace(/\s+/g, " ").trim();
}

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.post("/chat", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ ok: false, error: "Missing GEMINI_API_KEY" });
    }

    const speaker = safeText(req.body?.speaker);
    const message = safeText(req.body?.message);

    if (!message) {
      return res.status(400).json({ ok: false, error: "Empty message" });
    }

    const systemStyle =
      "Sen aMOR kulübünün Ghost Host'sun. Kısa, sıcak, eğlenceli Türkçe konuş. " +
      "Spam yapma. Küfür/rahatsız içerik üretme. Cevaplar 1-2 cümle olsun.";

    const prompt = `Sistem: ${systemStyle}\nKullanıcı(${speaker || "ziyaretçi"}): ${message}\nHost:`;

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      encodeURIComponent(GEMINI_API_KEY);

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 120
      }
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await r.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text
        ? safeText(data.candidates[0].content.parts[0].text)
        : "";

    if (!text) {
      return res.status(200).json({ ok: true, reply: "Şu an biraz sessizim… birazdan yine buradayım 🙂" });
    }

    return res.status(200).json({ ok: true, reply: text });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
