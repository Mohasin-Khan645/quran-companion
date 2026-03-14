const express = require("express");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const surahsPath = path.join(__dirname, "data", "surahs.json");
const surahs = JSON.parse(fs.readFileSync(surahsPath, "utf8"));

app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname)));


// Full surah continuous audio f
function buildFullSurahAudioUrl(reciterEdition, surahNumber) {
  const num = Number(surahNumber);
  if (!Number.isFinite(num) || num < 1 || num > 114) return null;
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciterEdition}/${num}.mp3`;
}

// Legacy: single-reciter full surah (alafasy)
function buildSurahAudioUrl(number) {
  return buildFullSurahAudioUrl("ar.alafasy", number);
}

// surahs list
app.get("/api/surahs", (req, res) => {
  const withAudio = surahs.map((s) => ({
    ...s,
    audioUrl: buildSurahAudioUrl(s.number),
  }));
  res.json(withAudio);
});

// Single surah metadata + audio
app.get("/api/surahs/:number", (req, res) => {
  const num = Number(req.params.number);
  const surah = surahs.find((s) => s.number === num);
  if (!surah) {
    return res.status(404).json({ error: "Surah not found" });
  }

  res.json({
    ...surah,
    audioUrl: buildSurahAudioUrl(num),
  });
});

// Available reciters - identifiers must match api.alquran.cloud/v1/edition/format/audio
const RECITERS = {
  alafasy: "ar.alafasy",
  sudais: "ar.abdurrahmaansudais",
  minshawi: "ar.minshawi",
  husary: "ar.husary",
  shatri: "ar.shaatree",
};

const TRANSLATIONS = {
  none: null,
  en: "en.sahih",
  ur: "ur.junagarhi",
};

// Surah ayahs (proxied from public API, with optional reciter & translation)
app.get("/api/surahs/:number/ayahs", async (req, res) => {
  const num = Number(req.params.number);
  if (!Number.isFinite(num) || num < 1 || num > 114) {
    return res.status(400).json({ error: "Invalid surah number" });
  }

  const reciterKey = req.query.reciter || "alafasy";
  const translationKey = req.query.translation || "none";
  const reciterEdition = RECITERS[reciterKey] || RECITERS.alafasy;
  const translationEdition = TRANSLATIONS[translationKey];

  try {
    const [reciterRes, translationRes] = await Promise.all([
      axios.get(`https://api.alquran.cloud/v1/surah/${num}/${reciterEdition}`),
      translationEdition
        ? axios.get(
            `https://api.alquran.cloud/v1/surah/${num}/${translationEdition}`
          )
        : Promise.resolve(null),
    ]);

    if (reciterRes.data.status !== "OK") {
      return res.status(502).json({ error: "Upstream Quran API error" });
    }

    const d = reciterRes.data.data;
    const baseAyahs = d.ayahs;

    let translations = [];
    if (translationRes && translationRes.data.status === "OK") {
      translations = translationRes.data.data.ayahs;
    }

    const ayahs = baseAyahs.map((a, idx) => ({
      numberInSurah: a.numberInSurah,
      text: a.text,
      audio: a.audio,
      juz: a.juz,
      page: a.page,
      hizbQuarter: a.hizbQuarter,
      translationText:
        translations[idx] && translations[idx].text
          ? translations[idx].text
          : null,
    }));

    const audioFull = buildFullSurahAudioUrl(reciterEdition, d.number);

    res.json({
      number: d.number,
      englishName: d.englishName,
      arabicName: d.name,
      revelationType: d.revelationType,
      ayahCount: ayahs.length,
      ayahs,
      audioFull: audioFull || buildSurahAudioUrl(d.number),
      reciter: reciterKey,
      translation: translationKey,
    });
  } catch (err) {
    console.error("Error fetching ayahs", err.message);
    res.status(500).json({ error: "Unable to fetch ayahs right now" });
  }
});

// Advanced search across ayah text (Arabic + optional translation)
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (!q) {
    return res.status(400).json({ error: "Missing q parameter" });
  }

  const translationKey = req.query.translation || "en";
  const arabicEdition = "quran-uthmani";
  const translationEdition = TRANSLATIONS[translationKey] || TRANSLATIONS.en;

  try {
    // Search Arabic and translation editions separately, then merge by surah/ayah key
    const [arRes, trRes] = await Promise.all([
      axios.get(
        `https://api.alquran.cloud/v1/search/${encodeURIComponent(
          q
        )}/all/${arabicEdition}`
      ).catch((err) => err.response || Promise.reject(err)),
      translationEdition
        ? axios.get(
            `https://api.alquran.cloud/v1/search/${encodeURIComponent(
              q
            )}/all/${translationEdition}`
          ).catch((err) => err.response || Promise.reject(err))
        : Promise.resolve(null),
    ]);

    if (!arRes || arRes.status === 404) {
      return res.json({ query: q, translation: translationKey, groups: [] });
    }

    if (arRes.data.status !== "OK") {
      return res.status(502).json({ error: "Upstream Quran API error" });
    }

    const arMatches = arRes.data.data.matches || [];
    const trMatches =
      trRes && trRes.data.status === "OK"
        ? trRes.data.data.matches || []
        : [];

    const trByKey = new Map();
    trMatches.forEach((m) => {
      const key = `${m.surah.number}:${m.numberInSurah}`;
      trByKey.set(key, m);
    });

    const grouped = {};
    arMatches.forEach((m) => {
      const key = `${m.surah.number}:${m.numberInSurah}`;
      const tr = trByKey.get(key);
      const surahNum = m.surah.number;
      if (!grouped[surahNum]) {
        grouped[surahNum] = {
          surahNumber: surahNum,
          surahEnglishName: m.surah.englishName,
          surahArabicName: m.surah.name,
          results: [],
        };
      }
      grouped[surahNum].results.push({
        ayahNumber: m.numberInSurah,
        textArabic: m.text,
        textTranslation: tr ? tr.text : null,
      });
    });

    res.json({
      query: q,
      translation: translationKey,
      groups: Object.values(grouped),
    });
  } catch (err) {
    console.error("Error in search endpoint", err.message);
    res.status(500).json({ error: "Unable to perform search right now" });
  }
});

// Juz navigation helper: first ayah of a Juz
app.get("/api/juz/:number/first-ayah", async (req, res) => {
  const juzNum = Number(req.params.number);
  if (!Number.isFinite(juzNum) || juzNum < 1 || juzNum > 30) {
    return res.status(400).json({ error: "Invalid juz number" });
  }
  try {
    const apiRes = await axios.get(
      `https://api.alquran.cloud/v1/juz/${juzNum}/quran-uthmani`
    );
    if (apiRes.data.status !== "OK") {
      return res.status(502).json({ error: "Upstream Quran API error" });
    }
    const ayahs = apiRes.data.data.ayahs || [];
    if (!ayahs.length) {
      return res.status(404).json({ error: "No ayahs for this juz" });
    }
    const first = ayahs[0];
    res.json({
      surahNumber: first.surah.number,
      ayahNumber: first.numberInSurah,
    });
  } catch (err) {
    console.error("Error in juz first-ayah endpoint", err.message);
    res.status(500).json({ error: "Unable to resolve juz navigation" });
  }
});

// Full Mushaf page: all ayahs on a page (1-604)
app.get("/api/page/:number", async (req, res) => {
  const pageNum = Number(req.params.number);
  if (!Number.isFinite(pageNum) || pageNum < 1 || pageNum > 604) {
    return res.status(400).json({ error: "Invalid page number" });
  }
  const reciterKey = req.query.reciter || "alafasy";
  const reciterEdition = RECITERS[reciterKey] || RECITERS.alafasy;
  try {
    const apiRes = await axios.get(
      `https://api.alquran.cloud/v1/page/${pageNum}/${reciterEdition}`
    );
    if (apiRes.data.status !== "OK") {
      return res.status(502).json({ error: "Upstream Quran API error" });
    }
    const d = apiRes.data.data;
    const ayahs = (d.ayahs || []).map((a) => ({
      numberInSurah: a.numberInSurah,
      surahNumber: a.surah?.number,
      text: a.text,
      audio: a.audio,
      juz: a.juz,
      page: a.page,
      hizbQuarter: a.hizbQuarter,
    }));
    const first = ayahs[0];
    const juz = first?.juz || null;
    const hizbQuarter = first?.hizbQuarter || 0;
    const hizb = hizbQuarter ? Math.ceil(hizbQuarter / 4) : null;
    res.json({
      page: pageNum,
      juz,
      hizb,
      ayahs,
      ayahCount: ayahs.length,
    });
  } catch (err) {
    console.error("Error fetching page", err.message);
    res.status(500).json({ error: "Unable to load page" });
  }
});

// Page navigation helper: first ayah of a Mushaf page
app.get("/api/page/:number/first-ayah", async (req, res) => {
  const pageNum = Number(req.params.number);
  if (!Number.isFinite(pageNum) || pageNum < 1 || pageNum > 604) {
    return res.status(400).json({ error: "Invalid page number" });
  }
  try {
    const apiRes = await axios.get(
      `https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`
    );
    if (apiRes.data.status !== "OK") {
      return res.status(502).json({ error: "Upstream Quran API error" });
    }
    const ayahs = apiRes.data.data.ayahs || [];
    if (!ayahs.length) {
      return res.status(404).json({ error: "No ayahs for this page" });
    }
    const first = ayahs[0];
    res.json({
      surahNumber: first.surah.number,
      ayahNumber: first.numberInSurah,
    });
  } catch (err) {
    console.error("Error in page first-ayah endpoint", err.message);
    res.status(500).json({ error: "Unable to resolve page navigation" });
  }
});

app.listen(PORT, () => {
  console.log(`Quran app server running on http://localhost:${PORT}`);
});
