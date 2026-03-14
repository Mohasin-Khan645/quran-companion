const RECITER_KEYS = ["alafasy", "sudais", "minshawi", "husary", "shatri"];

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const n = parseInt(params.get("number"), 10);
  const ayah = parseInt(params.get("ayah"), 10);
  const page = parseInt(params.get("page"), 10);
  const reciter = params.get("reciter") || null;
  const validReciter = reciter && RECITER_KEYS.includes(reciter) ? reciter : null;
  return {
    number: Number.isFinite(n) ? n : null,
    ayah: Number.isFinite(ayah) ? ayah : null,
    page: Number.isFinite(page) && page >= 1 && page <= 604 ? page : null,
    reciter: validReciter,
  };
}

function applyScriptClass(scriptName = "uthmani") {
  const body = document.body;
  body.classList.remove(
    "quran-uthmani",
    "quran-uthmani-hafs",
    "quran-uthmani-simple",
    "quran-indopak",
    "quran-indopak-nastaleeq",
    "quran-tajweed"
  );
  body.classList.add(`quran-${scriptName}`);
}

async function loadPageMode(pageNum) {
  const headerShort = document.getElementById("surahMetaShort");
  const nameArEl = document.getElementById("surahNameAr");
  const nameEnEl = document.getElementById("surahNameEn");
  const numberEl = document.getElementById("surahNumber");
  const revTypeEl = document.getElementById("surahRevelationType");
  const audioEl = document.getElementById("surahAudio");
  const mushafContainer = document.getElementById("mushafContainer");
  const studyListContainer = document.getElementById("studyListContainer");
  const playAllBtn = document.getElementById("playAllAyahsBtn");
  const reciterSelect = document.getElementById("reciterSelect");
  const readerProgressText = document.getElementById("readerProgressText");
  const readerJuzInfo = document.getElementById("readerJuzInfo");
  const pageSelect = document.getElementById("pageSelect");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const scriptSelect = document.getElementById("scriptSelect");
  const tajweedToggle = document.getElementById("tajweedToggle");
  const wbwToggle = document.getElementById("wbwToggle");
  const tafsirPanel = document.getElementById("tafsirPanel");
  const tafsirBackdrop = document.getElementById("tafsirBackdrop");
  const tafsirClose = document.getElementById("tafsirClose");
  const tafsirBody = document.getElementById("tafsirBody");
  const tafsirTitle = document.getElementById("tafsirTitle");
  const tafsirSourceSelect = document.getElementById("tafsirSourceSelect");
  const searchInput = document.getElementById("readerSearchInput");
  const searchBtn = document.getElementById("readerSearchBtn");
  const searchResults = document.getElementById("readerSearchResults");
  const playFullSurahBtn = document.getElementById("playFullSurahBtn");
  const modeButtons = document.querySelectorAll(".reader-mode-btn");
  const fontSmallerBtn = document.getElementById("fontSmallerBtn");
  const fontLargerBtn = document.getElementById("fontLargerBtn");

  let allAyahs = [];
  let playAllIndex = 0;
  let playingAll = false;
  let playingFullSurah = false;
  let surahAudioFull = null;
  const params = getQueryParams();
  if (reciterSelect && params.reciter) {
    reciterSelect.value = params.reciter;
  }
  let currentReciter = (reciterSelect && reciterSelect.value) || "alafasy";
  let fontSize = 22;
  let currentScript = localStorage.getItem("quran-script-style") || "uthmani";

  function getAyahArabicText(ayah) {
    if (!ayah) return "";
    if (currentScript === "tajweed" && ayah.textTajweed) {
      return ayah.textTajweed;
    }
    return ayah.text;
  }

  function applyFontSize() {
    document.documentElement.style.setProperty("--reader-font-size", `${fontSize}px`);
  }
  function stopPlayAll() {
    playingAll = false;
    playingFullSurah = false;
    playAllIndex = 0;
    if (playAllBtn) playAllBtn.textContent = "▶ Play Surah";
  }

  function highlightCurrentAyah(idx) {
    const spans = mushafContainer && mushafContainer.querySelectorAll(".mushaf-ayah-wrap");
    if (spans) {
      spans.forEach((s) => s.classList.remove("ayah-list__item--current"));
      if (spans[idx]) spans[idx].classList.add("ayah-list__item--current");
    }
  }

  try {
    const res = await fetch(`/api/page/${pageNum}?reciter=${encodeURIComponent(currentReciter)}`);
    if (!res.ok) throw new Error("Page load failed");
    const data = await res.json();
    allAyahs = data.ayahs || [];

    document.title = `Qur'an – Page ${pageNum}`;
    if (headerShort) headerShort.textContent = `Page ${pageNum}`;
    if (nameArEl) nameArEl.textContent = "مصحف";
    if (nameEnEl) nameEnEl.textContent = "Mushaf";
    if (numberEl) numberEl.textContent = "";
    if (revTypeEl) revTypeEl.textContent = "";
    const ayahCountEl2 = document.getElementById("surahAyahCount");
    if (ayahCountEl2) ayahCountEl2.textContent = `${allAyahs.length} Ayahs`;
    if (readerJuzInfo) readerJuzInfo.textContent = `Page ${pageNum} | Juz ${data.juz || "–"} | Hizb ${data.hizb || "–"}`;
    if (readerProgressText) readerProgressText.textContent = `Page ${pageNum} of 604`;

    if (mushafContainer) {
      mushafContainer.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "mushaf-text mushaf-text--continuous";
      allAyahs.forEach((a, idx) => {
        const span = document.createElement("span");
        span.className = "mushaf-ayah-wrap";
        const arabicHtml = getAyahArabicText(a);
        span.innerHTML = `${arabicHtml} <span class="ayah-marker">${a.numberInSurah}</span>`;
        wrap.appendChild(span);
        wrap.appendChild(document.createTextNode(" "));
      });
      mushafContainer.appendChild(wrap);
      mushafContainer.classList.add("active");
    }
    if (studyListContainer) studyListContainer.classList.add("hidden");

    if (pageSelect) {
      pageSelect.value = String(pageNum);
      pageSelect.addEventListener("change", () => {
        const p = parseInt(pageSelect.value, 10);
        if (p >= 1 && p <= 604) window.location.href = `surah.html?page=${p}`;
      });
    }
    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        if (pageNum > 1) window.location.href = `surah.html?page=${pageNum - 1}`;
      });
    }
    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        if (pageNum < 604) window.location.href = `surah.html?page=${pageNum + 1}`;
      });
    }

    if (audioEl) {
      audioEl.addEventListener("ended", () => {
        if (!playingAll || !allAyahs.length) return;
        playAllIndex++;
        if (playAllIndex >= allAyahs.length) {
          stopPlayAll();
          return;
        }
        const next = allAyahs[playAllIndex];
        if (next && next.audio) {
          audioEl.src = next.audio;
          audioEl.play();
          highlightCurrentAyah(playAllIndex);
        }
      });
    }
    if (playAllBtn && audioEl) {
      playAllBtn.textContent = "▶ Play Surah";
      playAllBtn.addEventListener("click", () => {
        if (!surahAudioFull && !allAyahs.length) return;
        if (playingAll) {
          stopPlayAll();
          audioEl.pause();
          playAllBtn.textContent = "▶ Play Surah";
          return;
        }
        playingAll = true;
        playAllIndex = 0;
        if (surahAudioFull) {
          playingFullSurah = true;
          playAllBtn.textContent = "⏸ Stop";
          audioEl.src = surahAudioFull;
          audioEl.play();
        } else {
          playingFullSurah = false;
          playAllBtn.textContent = "⏸ Stop";
          const first = allAyahs[0];
          if (first && first.audio) {
            audioEl.src = first.audio;
            audioEl.play();
            setCurrentAyahIndex(0);
            highlightMushafAyah(0);
          }
        }
      });
    }
    if (reciterSelect) {
      reciterSelect.addEventListener("change", () => {
        currentReciter = reciterSelect.value || "alafasy";
        window.location.href = `surah.html?page=${pageNum}&reciter=${encodeURIComponent(currentReciter)}`;
      });
    }
    if (modeButtons && modeButtons.length) {
      modeButtons.forEach((b) => {
        if (b.getAttribute("data-mode") === "mushaf") b.classList.add("reader-mode-btn--active");
      });
    }
    if (fontSmallerBtn) {
      fontSmallerBtn.addEventListener("click", () => {
        fontSize = Math.max(16, fontSize - 2);
        applyFontSize();
      });
    }
    if (fontLargerBtn) {
      fontLargerBtn.addEventListener("click", () => {
        fontSize = Math.min(40, fontSize + 2);
        applyFontSize();
      });
    }
    applyFontSize();
    applyScriptClass(currentScript);

    if (scriptSelect) {
      scriptSelect.value = currentScript;
      scriptSelect.addEventListener("change", () => {
        currentScript = scriptSelect.value || "uthmani";
        localStorage.setItem("quran-script-style", currentScript);
        applyScriptClass(currentScript);
      });
    }

    if (pageSelect && !pageSelect.options.length) {
      for (let p = 1; p <= 604; p++) {
        const opt = document.createElement("option");
        opt.value = String(p);
        opt.textContent = `Page ${p}`;
        pageSelect.appendChild(opt);
      }
    }
  } catch (err) {
    console.error("Failed to load page", err);
    if (headerShort) headerShort.textContent = "Page load failed";
  }
}

async function loadSurahForReader() {
  const { number: num, ayah: initialAyah, page: pageParam } = getQueryParams();
  if (pageParam && !num) {
    await loadPageMode(pageParam);
    return;
  }
  const headerShort = document.getElementById("surahMetaShort");
  const nameArEl = document.getElementById("surahNameAr");
  const nameEnEl = document.getElementById("surahNameEn");
  const numberEl = document.getElementById("surahNumber");
  const revTypeEl = document.getElementById("surahRevelationType");
  const ayahCountEl = document.getElementById("surahAyahCount");
  const audioEl = document.getElementById("surahAudio");
  const ayahListEl = document.getElementById("ayahList");
  const studyListContainer =
    document.getElementById("studyListContainer") || ayahListEl;
  const mushafContainer = document.getElementById("mushafContainer");
  const playAllBtn = document.getElementById("playAllAyahsBtn");
  const reciterSelect = document.getElementById("reciterSelect");
  const translationSelect = document.getElementById("translationSelect");
  const repeatModeSelect = document.getElementById("repeatModeSelect");
  const modeButtons = document.querySelectorAll(".reader-mode-btn");
  const fontSmallerBtn = document.getElementById("fontSmallerBtn");
  const fontLargerBtn = document.getElementById("fontLargerBtn");
  const readerProgressText = document.getElementById("readerProgressText");
  const readerJuzInfo = document.getElementById("readerJuzInfo");
  const juzSelect = document.getElementById("juzSelect");
  const pageSelect = document.getElementById("pageSelect");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const scriptSelect = document.getElementById("scriptSelect");

  let surah = null;
  let allAyahs = [];
  let playAllIndex = 0;
  let playingAll = false;
  let playingFullSurah = false; // true = full surah, false = single ayah
  let surahAudioFull = null; // Full surah continuous audio URL (per reciter)
  let currentReciter = (reciterSelect && reciterSelect.value) || "alafasy";
  let currentTranslation =
    (translationSelect && translationSelect.value) ||
    localStorage.getItem("quran-translation") ||
    "none";
  let repeatMode = (repeatModeSelect && repeatModeSelect.value) || "none";
  let currentMode = "mushaf";
  let fontSize = 22;
  let currentPage = null;
  let pageList = [];
  let currentScript = localStorage.getItem("quran-script-style") || "uthmani";
  applyScriptClass(currentScript);
  let tajweedEnabled = localStorage.getItem("tajweed-enabled") === "1";
  let wbwEnabled = localStorage.getItem("wbw-enabled") === "1";
  let currentTafsirSource =
    (tafsirSourceSelect && tafsirSourceSelect.value) || "ibn-kathir";

  function getAyahArabicText(ayah) {
    if (!ayah) return "";
    if (tajweedEnabled && ayah.textTajweed) {
      return ayah.textTajweed;
    }
    return ayah.text;
  }

  function buildWordByWordHtml(ayah) {
    const wordsSrc = ayah && (ayah.wordsWbw || ayah.words);
    if (!wbwEnabled || !Array.isArray(wordsSrc) || !wordsSrc.length) {
      return getAyahArabicText(ayah);
    }
    const items = wordsSrc.map((w) => {
      const ar =
        (w.arabic || w.textAr || w.text || w.word || "").toString().trim();
      const tr =
        (w.translation || w.tr || w.en || w.meaning || "").toString().trim();
      if (!ar && !tr) return "";
      return `<span class="wbw-word">
        <span class="wbw-word__ar">${ar}</span>
        ${tr ? `<span class="wbw-word__tr">${tr}</span>` : ""}
      </span>`;
    });
    const html = items.filter(Boolean).join(" ");
    return html || getAyahArabicText(ayah);
  }

  const PLAY_SURAH_LABEL = "▶ Play Surah";
  const STOP_LABEL = "⏸ Stop";
  const PLAY_ALL_LABEL = "▶ Play all ayahs";
  const STOP_ALL_LABEL = "Stop playing all";

  function setCurrentAyahIndex(index, scroll = true) {
    const ayah = allAyahs[index];
    if (ayah) {
      if (readerProgressText) {
        readerProgressText.textContent = `Ayah ${ayah.numberInSurah} of ${allAyahs.length}`;
      }
      if (readerJuzInfo) {
        const juz = ayah.juz || "-";
        const page = ayah.page || "-";
        const hizbQuarter = ayah.hizbQuarter || 0;
        const hizb = hizbQuarter ? Math.ceil(hizbQuarter / 4) : "-";
        readerJuzInfo.textContent = `Page ${page} | Juz ${juz} | Hizb ${hizb}`;
      }
      if (juzSelect && ayah.juz) {
        juzSelect.value = String(ayah.juz);
      }
      if (pageSelect && ayah.page) {
        pageSelect.value = String(ayah.page);
      }
    }
    if (currentMode === "mushaf") {
      highlightMushafAyah(index);
    }
    if (currentMode === "mushaf" && mushafContainer) {
      if (ayah && ayah.page && ayah.page !== currentPage && pageList.includes(ayah.page)) {
        currentPage = ayah.page;
        renderMushafPage(currentPage);
        highlightMushafAyah(index);
      } else {
        highlightMushafAyah(index);
      }
    }
    if (!studyListContainer) return;
    const rows = studyListContainer.querySelectorAll(".ayah-list__item");
    rows.forEach((row) => row.classList.remove("ayah-list__item--current"));
    const row = rows[index];
    if (row) {
      row.classList.add("ayah-list__item--current");
      if (scroll) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function applyFontSize() {
    document.documentElement.style.setProperty(
      "--reader-font-size",
      `${fontSize}px`
    );
  }

  function stopPlayAll() {
    playingAll = false;
    playingFullSurah = false;
    playAllIndex = 0;
    if (playAllBtn) {
      playAllBtn.textContent = PLAY_ALL_LABEL;
    }
  }

  function applyTajweedMode() {
    document.body.classList.toggle("tajweed-mode", tajweedEnabled);
    if (tajweedToggle) {
      tajweedToggle.textContent = tajweedEnabled ? "On" : "Off";
      tajweedToggle.setAttribute("aria-pressed", tajweedEnabled ? "true" : "false");
    }
  }

  function applyWordByWordToggleUI() {
    if (wbwToggle) {
      wbwToggle.textContent = wbwEnabled ? "On" : "Off";
      wbwToggle.setAttribute("aria-pressed", wbwEnabled ? "true" : "false");
    }
    document.body.classList.toggle("wbw-mode", wbwEnabled);
  }

  function openTafsirPanel() {
    if (!tafsirPanel) return;
    tafsirPanel.classList.add("tafsir-panel--open");
    tafsirPanel.setAttribute("aria-hidden", "false");
  }

  function closeTafsirPanel() {
    if (!tafsirPanel) return;
    tafsirPanel.classList.remove("tafsir-panel--open");
    tafsirPanel.setAttribute("aria-hidden", "true");
  }

  async function loadTafsirForAyah(ayah) {
    if (!surah || !ayah || !tafsirBody || !tafsirTitle) return;
    openTafsirPanel();
    tafsirBody.textContent = "Loading tafsir...";
    tafsirTitle.textContent = `Tafsir – Surah ${surah.number}:${ayah.numberInSurah}`;
    try {
      const res = await fetch(
        `/api/tafsir/${encodeURIComponent(surah.number)}/${encodeURIComponent(
          ayah.numberInSurah
        )}?source=${encodeURIComponent(currentTafsirSource)}`
      );
      if (!res.ok) {
        tafsirBody.textContent = "Unable to load tafsir for this ayah.";
        return;
      }
      const data = await res.json();
      const text = data.text || "";
      tafsirBody.innerHTML = text
        .split(/\n{2,}/)
        .map((p) => `<p>${p}</p>`)
        .join("");
    } catch (e) {
      console.error("Failed to load tafsir", e);
      tafsirBody.textContent = "Unable to load tafsir for this ayah.";
    }
  }

  function renderMushafFromAyahs() {
    if (!mushafContainer || !allAyahs.length) return;
    const text = allAyahs
      .map((a) => {
        const arabicHtml = getAyahArabicText(a);
        return `${arabicHtml} <span class="ayah-marker">${a.numberInSurah}</span>`;
      })
      .join(" ");
    mushafContainer.innerHTML = `<div class="mushaf-text">${text}</div>`;
    mushafContainer.classList.add("active");
    if (studyListContainer) studyListContainer.classList.add("hidden");
    const first = allAyahs[0];
    const hizbQuarter = first.hizbQuarter || 0;
    const hizb = hizbQuarter ? Math.ceil(hizbQuarter / 4) : "-";
    if (readerJuzInfo) {
      readerJuzInfo.textContent = `Page ${first.page || "-"} | Juz ${
        first.juz || "-"
      } | Hizb ${hizb}`;
    }
    applyScriptClass(currentScript);
  }

  function highlightMushafAyah(globalIndex) {
    if (!mushafContainer || globalIndex < 0 || globalIndex >= allAyahs.length) return;
    const ayah = allAyahs[globalIndex];
    if (!ayah || ayah.page !== currentPage) return;
    const pageAyahs = allAyahs.filter((a) => a.page === currentPage);
    const localIdx = pageAyahs.findIndex((a) => a.numberInSurah === ayah.numberInSurah && a.text === ayah.text);
    if (localIdx < 0) return;
    const wraps = mushafContainer.querySelectorAll(".mushaf-ayah-wrap");
    wraps.forEach((w) => w.classList.remove("ayah-list__item--current"));
    if (wraps[localIdx]) {
      wraps[localIdx].classList.add("ayah-list__item--current");
      wraps[localIdx].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function renderMushafPage(page) {
    if (!mushafContainer || !allAyahs.length) return;
    const pageAyahs = allAyahs.filter((a) => a.page === page);
    if (!pageAyahs.length) return;
    const wrap = document.createElement("div");
    wrap.className = "mushaf-text";
    pageAyahs.forEach((a) => {
      const span = document.createElement("span");
      span.className = "mushaf-ayah-wrap";
      const arabicHtml = getAyahArabicText(a);
      span.innerHTML = `${arabicHtml} <span class="ayah-marker">${a.numberInSurah}</span>`;
      wrap.appendChild(span);
      wrap.appendChild(document.createTextNode(" "));
    });
    mushafContainer.innerHTML = "";
    mushafContainer.appendChild(wrap);
    mushafContainer.classList.add("active");
    if (studyListContainer) studyListContainer.classList.add("hidden");
    const first = pageAyahs[0];
    const hizbQuarter = first.hizbQuarter || 0;
    const hizb = hizbQuarter ? Math.ceil(hizbQuarter / 4) : "-";
    if (readerJuzInfo) {
      readerJuzInfo.textContent = `Page ${page} | Juz ${first.juz || "-"} | Hizb ${hizb}`;
    }
    currentPage = page;
    if (pageSelect) pageSelect.value = String(page);
    if (playingAll && allAyahs[playAllIndex] && allAyahs[playAllIndex].page === page) {
      highlightMushafAyah(playAllIndex);
    }
    applyScriptClass(currentScript);
  }

  async function loadAyahs(targetIndex = 0, scrollToTarget = false) {
    if (!studyListContainer) return;
    studyListContainer.textContent = "Loading ayahs...";
    stopPlayAll();
    try {
      const ayahRes = await fetch(
        `/api/surahs/${num}/ayahs?reciter=${encodeURIComponent(
          currentReciter
        )}&translation=${encodeURIComponent(currentTranslation)}`
      );
      if (!ayahRes.ok) {
        studyListContainer.textContent = "Unable to load ayahs right now.";
        return;
      }
      const detail = await ayahRes.json();
      allAyahs = detail.ayahs || [];
      surahAudioFull = detail.audioFull || null;
      if (!allAyahs.length) {
        studyListContainer.textContent = "No ayahs found for this selection.";
        return;
      }

      if (audioEl && surahAudioFull) {
        audioEl.src = surahAudioFull;
        audioEl.preload = "metadata";
      }

      studyListContainer.innerHTML = "";

      allAyahs.forEach((a, idx) => {
        const row = document.createElement("div");
        row.className = "ayah-list__item";
        row.dataset.index = String(idx);
        const arabicHtml = wbwEnabled ? buildWordByWordHtml(a) : getAyahArabicText(a);
        row.innerHTML = `
          <div class="ayah-list__meta">
            <span>Ayah ${a.numberInSurah}</span>
            <div>
              <button class="ayah-list__play">Play</button>
              <button class="ayah-list__bookmark" title="Bookmark ayah">&#9733;</button>
            </div>
          </div>
          <div class="ayah-list__text-ar">${arabicHtml}</div>
          ${
            a.translationText
              ? `<div class="ayah-list__text-tr">${a.translationText}</div>`
              : ""
          }
          <div class="ayah-list__toolbar">
            <button class="ayah-tool-btn" data-action="copy">Copy</button>
            <button class="ayah-tool-btn" data-action="share">Share</button>
            <button class="ayah-tool-btn" data-action="play">Play</button>
            <button class="ayah-tool-btn" data-action="tafsir">Tafsir</button>
          </div>
        `;
        const playBtn = row.querySelector(".ayah-list__play");
        const bookmarkBtn = row.querySelector(".ayah-list__bookmark");
        if (playBtn && audioEl && a.audio) {
          playBtn.addEventListener("click", () => {
            playingAll = true;
            playingFullSurah = false;
            playAllIndex = idx;
            if (playAllBtn) {
              playAllBtn.textContent = STOP_LABEL;
            }
            audioEl.src = a.audio;
            audioEl.play();
            setCurrentAyahIndex(idx);
            highlightMushafAyah(idx);
          });
        }
        if (bookmarkBtn) {
          const isBookmarked = window.quranApp.isAyahBookmarked(
            surah.number,
            a.numberInSurah
          );
          if (isBookmarked) {
            bookmarkBtn.classList.add("ayah-list__bookmark--active");
          }
          bookmarkBtn.addEventListener("click", () => {
            const nowActive = window.quranApp.toggleAyahBookmark(
              surah.number,
              a.numberInSurah
            );
            if (nowActive) {
              bookmarkBtn.classList.add("ayah-list__bookmark--active");
            } else {
              bookmarkBtn.classList.remove("ayah-list__bookmark--active");
            }
          });
        }
        studyListContainer.appendChild(row);
      });

      const clampedIndex = Math.min(
        Math.max(targetIndex, 0),
        allAyahs.length - 1
      );
      setCurrentAyahIndex(clampedIndex, scrollToTarget);
    } catch (err) {
      console.error("Failed to load ayahs", err);
      studyListContainer.textContent = "Unable to load ayahs right now.";
    }
  }

  if (!num) {
    if (headerShort) headerShort.textContent = "Surah not found";
    return;
  }

  try {
    const metaRes = await fetch(`/api/surahs/${num}`);

    if (!metaRes.ok) {
      if (headerShort) headerShort.textContent = "Surah not found";
      return;
    }
    surah = await metaRes.json();
    surahAudioFull = surah.audioUrl || null;

    if (!surah) {
      if (headerShort) headerShort.textContent = "Surah not found";
      return;
    }

    window.quranApp.setLastRead(surah);

    document.title = `Qur'an - ${surah.englishName}`;
    if (headerShort) headerShort.textContent = `Surah ${surah.englishName}`;
    if (nameArEl) nameArEl.textContent = surah.arabicName;
    if (nameEnEl) nameEnEl.textContent = surah.englishName;
    if (numberEl) numberEl.textContent = surah.number;
    if (revTypeEl) revTypeEl.textContent = surah.revelationType;
    if (ayahCountEl) ayahCountEl.textContent = `${surah.ayahCount} Ayahs`;

    await loadAyahs(
      initialAyah && Number.isFinite(initialAyah) ? initialAyah - 1 : 0,
      Boolean(initialAyah && Number.isFinite(initialAyah))
    );
    pageList = Array.from(new Set(allAyahs.map((a) => a.page))).sort(
      (a, b) => a - b
    );
    currentPage = initialAyah
      ? allAyahs.find((a) => a.numberInSurah === initialAyah)?.page ||
        pageList[0]
      : pageList[0];
    if (currentMode === "mushaf") {
      renderMushafPage(currentPage);
    }

    if (audioEl) {
      const handleEnded = () => {
        if (!playingAll) return;
        if (playingFullSurah) {
          if (repeatMode === "surah" && surahAudioFull) {
            audioEl.currentTime = 0;
            audioEl.play();
          } else {
            stopPlayAll();
          }
        } else {
          // advance to next ayah and highlight
          playAllIndex += 1;
          if (playAllIndex >= allAyahs.length) {
            stopPlayAll();
            return;
          }
          const nextAyah = allAyahs[playAllIndex];
          if (nextAyah && nextAyah.audio) {
            audioEl.src = nextAyah.audio;
            audioEl.play();
            setCurrentAyahIndex(playAllIndex, true);
          } else {
            stopPlayAll();
          }
        }
      };
      audioEl.addEventListener("ended", handleEnded);
      audioEl.addEventListener("playing", () => {
        if (!playingAll) return;
        if (!playingFullSurah) {
          setCurrentAyahIndex(playAllIndex, true);
        }
      });
    }

    if (playAllBtn && audioEl) {
      playAllBtn.textContent = PLAY_ALL_LABEL;
      playAllBtn.onclick = null;
      playAllBtn.addEventListener("click", () => {
        if (!allAyahs.length) return;
        if (playingAll && !playingFullSurah) {
          // stop current ayah-by-ayah playback
          stopPlayAll();
          audioEl.pause();
          playAllBtn.textContent = PLAY_ALL_LABEL;
          return;
        }
        playingAll = true;
        playingFullSurah = false;
        playAllIndex = 0;
        playAllBtn.textContent = STOP_ALL_LABEL;
        const first = allAyahs[0];
        if (first && first.audio) {
          audioEl.src = first.audio;
          audioEl.play();
          setCurrentAyahIndex(0, true);
        }
      });
    }

    if (playFullSurahBtn && audioEl) {
      playFullSurahBtn.onclick = null;
      playFullSurahBtn.textContent = PLAY_SURAH_LABEL;
      playFullSurahBtn.addEventListener("click", () => {
        if (!surahAudioFull) {
          console.warn("No full-surah audio available for this surah");
          return;
        }
        if (playingAll && playingFullSurah) {
          stopPlayAll();
          audioEl.pause();
          playFullSurahBtn.textContent = PLAY_SURAH_LABEL;
          return;
        }
        playingAll = true;
        playingFullSurah = true;
        playAllIndex = 0;
        playFullSurahBtn.textContent = STOP_LABEL;
        audioEl.src = surahAudioFull;
        audioEl.play();
      });
    }

    if (repeatModeSelect) {
      repeatModeSelect.addEventListener("change", () => {
        repeatMode = repeatModeSelect.value || "none";
      });
    }

    if (reciterSelect) {
      reciterSelect.addEventListener("change", () => {
        currentReciter = reciterSelect.value || "alafasy";
        if (audioEl) audioEl.pause();
        loadAyahs(playAllIndex, false);
      });
    }

    if (translationSelect) {
      translationSelect.addEventListener("change", () => {
        currentTranslation = translationSelect.value || "none";
        try {
          localStorage.setItem("quran-translation", currentTranslation);
        } catch (_) {}
        if (audioEl) audioEl.pause();
        loadAyahs(playAllIndex, false);
      });
    }

    if (scriptSelect) {
      scriptSelect.value = currentScript;
      scriptSelect.addEventListener("change", () => {
        currentScript = scriptSelect.value || "uthmani";
        try {
          localStorage.setItem("quran-script-style", currentScript);
        } catch (_) {}
        applyScriptClass(currentScript);
      });
      applyScriptClass(currentScript);
    }

    if (tajweedToggle) {
      applyTajweedMode();
      tajweedToggle.addEventListener("click", () => {
        tajweedEnabled = !tajweedEnabled;
        try {
          localStorage.setItem("tajweed-enabled", tajweedEnabled ? "1" : "0");
        } catch (_) {}
        applyTajweedMode();
        // re-render ayahs to swap between plain and tajweed text
        loadAyahs(playAllIndex, false);
        if (currentMode === "mushaf") {
          renderMushafPage(currentPage);
        }
      });
    } else {
      applyTajweedMode();
    }

    if (wbwToggle) {
      applyWordByWordToggleUI();
      wbwToggle.addEventListener("click", () => {
        wbwEnabled = !wbwEnabled;
        try {
          localStorage.setItem("wbw-enabled", wbwEnabled ? "1" : "0");
        } catch (_) {}
        applyWordByWordToggleUI();
        // For now, word-by-word affects only study mode rendering
        if (currentMode === "study") {
          loadAyahs(playAllIndex, false);
        }
      });
    } else {
      applyWordByWordToggleUI();
    }

    if (tafsirBackdrop) {
      tafsirBackdrop.addEventListener("click", closeTafsirPanel);
    }
    if (tafsirClose) {
      tafsirClose.addEventListener("click", closeTafsirPanel);
    }
    if (tafsirSourceSelect) {
      const savedSource = localStorage.getItem("tafsir-source");
      if (savedSource && Array.from(tafsirSourceSelect.options).some((o) => o.value === savedSource)) {
        tafsirSourceSelect.value = savedSource;
        currentTafsirSource = savedSource;
      }
      tafsirSourceSelect.addEventListener("change", () => {
        currentTafsirSource = tafsirSourceSelect.value || "ibn-kathir";
        try {
          localStorage.setItem("tafsir-source", currentTafsirSource);
        } catch (_) {}
      });
    }

    if (studyListContainer) {
      studyListContainer.addEventListener("click", (evt) => {
        const toolBtn = evt.target.closest(".ayah-tool-btn");
        if (!toolBtn) return;
        const row = toolBtn.closest(".ayah-list__item");
        if (!row) return;
        const idx = parseInt(row.dataset.index || "0", 10);
        const ayah = allAyahs[idx];
        const action = toolBtn.getAttribute("data-action");
        if (!ayah) return;
        if (action === "copy") {
          const textToCopy = `${ayah.text} (${surah.number}:${ayah.numberInSurah})`;
          navigator.clipboard && navigator.clipboard.writeText(textToCopy).catch(() => {});
        } else if (action === "share") {
          const url = `${window.location.origin}/surah.html?number=${encodeURIComponent(
            surah.number
          )}&ayah=${encodeURIComponent(ayah.numberInSurah)}`;
          if (navigator.share) {
            navigator
              .share({
                title: `Qur'an ${surah.englishName} ${surah.number}:${ayah.numberInSurah}`,
                text: ayah.text,
                url,
              })
              .catch(() => {});
          } else {
            window.prompt("Copy this link:", url);
          }
        } else if (action === "play" && audioEl && ayah.audio) {
          playingAll = true;
          playingFullSurah = false;
          playAllIndex = idx;
          if (playAllBtn) {
            playAllBtn.textContent = STOP_ALL_LABEL;
          }
          audioEl.src = ayah.audio;
          audioEl.play();
          setCurrentAyahIndex(idx, true);
        } else if (action === "tafsir") {
          loadTafsirForAyah(ayah);
        }
      });
    }

    if (searchInput && searchResults) {
      const doSearch = async () => {
        const q = searchInput.value.trim();
        if (!q) {
          searchResults.classList.add("hidden");
          searchResults.innerHTML = "";
          return;
        }
        searchResults.classList.remove("hidden");
        searchResults.textContent = "Searching...";
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
          if (!res.ok) {
            searchResults.textContent = "Search failed. Please try again.";
            return;
          }
          const data = await res.json();
          const results = data.results || [];
          if (!results.length) {
            searchResults.textContent = "No results found.";
            return;
          }
          searchResults.innerHTML = "";
          results.forEach((r) => {
            const item = document.createElement("div");
            item.className = "reader-search__result";
            item.innerHTML = `
              <div class="reader-search__result-meta">
                Surah ${r.surahNumber}: Ayah ${r.ayahNumber} – ${r.surahName || ""}
              </div>
              <div class="reader-search__result-text">${r.text || ""}</div>
              ${
                r.translationText
                  ? `<div class="reader-search__result-tr">${r.translationText}</div>`
                  : ""
              }
            `;
            item.addEventListener("click", () => {
              window.location.href = `surah.html?number=${encodeURIComponent(
                r.surahNumber
              )}&ayah=${encodeURIComponent(r.ayahNumber)}`;
            });
            searchResults.appendChild(item);
          });
        } catch (e) {
          console.error("Search failed", e);
          searchResults.textContent = "Search failed. Please try again.";
        }
      };
      if (searchBtn) {
        searchBtn.addEventListener("click", doSearch);
      }
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          doSearch();
        }
      });
    }

    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        if (!pageList.length || currentPage === null) return;
        const idx = pageList.indexOf(currentPage);
        if (idx > 0) {
          currentPage = pageList[idx - 1];
          renderMushafPage(currentPage);
        }
      });
    }
    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        if (!pageList.length || currentPage === null) return;
        const idx = pageList.indexOf(currentPage);
        if (idx < pageList.length - 1) {
          currentPage = pageList[idx + 1];
          renderMushafPage(currentPage);
        }
      });
    }

    if (modeButtons && modeButtons.length) {
      modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const mode = btn.getAttribute("data-mode");
          currentMode = mode;
          modeButtons.forEach((b) =>
            b.classList.toggle("reader-mode-btn--active", b === btn)
          );
          document.body.classList.toggle(
            "reader-mode-study",
            currentMode === "study"
          );
          if (currentMode === "mushaf") {
            renderMushafPage(currentPage);
          } else {
            if (mushafContainer) mushafContainer.classList.remove("active");
            if (studyListContainer) studyListContainer.classList.remove("hidden");
          }
        });
      });
      modeButtons.forEach((b) => {
        if (b.getAttribute("data-mode") === "mushaf") {
          b.classList.add("reader-mode-btn--active");
        }
      });
    }

    if (fontSmallerBtn) {
      fontSmallerBtn.addEventListener("click", () => {
        fontSize = Math.max(16, fontSize - 2);
        applyFontSize();
      });
    }
    if (fontLargerBtn) {
      fontLargerBtn.addEventListener("click", () => {
        fontSize = Math.min(40, fontSize + 2);
        applyFontSize();
      });
    }

    applyFontSize();

    if (juzSelect && !juzSelect.options.length) {
      for (let j = 1; j <= 30; j++) {
        const opt = document.createElement("option");
        opt.value = String(j);
        opt.textContent = `Juz ${j}`;
        juzSelect.appendChild(opt);
      }
    }
    if (pageSelect && !pageSelect.options.length) {
      for (let p = 1; p <= 604; p++) {
        const opt = document.createElement("option");
        opt.value = String(p);
        opt.textContent = `Page ${p}`;
        pageSelect.appendChild(opt);
      }
    }

    if (juzSelect) {
      juzSelect.addEventListener("change", async () => {
        const j = parseInt(juzSelect.value, 10);
        if (!Number.isFinite(j)) return;
        try {
          const res = await fetch(`/api/juz/${j}/first-ayah`);
          if (!res.ok) return;
          const data = await res.json();
          window.location.href = `surah.html?number=${encodeURIComponent(
            data.surahNumber
          )}&ayah=${encodeURIComponent(data.ayahNumber)}`;
        } catch (e) {
          console.error("Failed to navigate to juz", e);
        }
      });
    }

    if (pageSelect) {
      pageSelect.addEventListener("change", () => {
        const p = parseInt(pageSelect.value, 10);
        if (!Number.isFinite(p)) return;
        if (pageList.includes(p)) {
          currentPage = p;
          renderMushafPage(currentPage);
        } else {
          window.location.href = `surah.html?page=${p}`;
        }
      });
    }

    if (ayahListEl && initialAyah && Number.isFinite(initialAyah)) {
      const targetIndex = Math.max(0, initialAyah - 1);
      setCurrentAyahIndex(targetIndex, true);
    } else if (allAyahs.length) {
      setCurrentAyahIndex(0, false);
    }
  } catch (err) {
    console.error("Failed to load surah for reader", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backToListBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "index.html";
      }
    });
  }

  loadSurahForReader();
});
