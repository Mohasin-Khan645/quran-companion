const surahListContainer = document.getElementById("surahListContainer");
const lastReadPanel = document.getElementById("lastReadPanel");
const lastReadJumpBtn = document.getElementById("lastReadJumpBtn");
const lastReadSurahNameEn = document.getElementById("lastReadSurahNameEn");
const lastReadSurahNameAr = document.getElementById("lastReadSurahNameAr");
const browseAllSurahsBtn = document.getElementById("browseAllSurahsBtn");
const featureAllSurahsCard = document.getElementById("featureAllSurahsCard");
const featureBookmarksCard = document.getElementById("featureBookmarksCard");
const isSurahsPage = document.body.classList.contains("surahs-page");
const backHomeBtn = document.getElementById("backHomeBtn");
const modalSurahListContainer = document.getElementById("modalSurahListContainer");
const searchModal = document.getElementById("searchModal");
const searchModalClose = document.getElementById("searchModalClose");
const searchModalBackdrop = document.getElementById("searchModalBackdrop");
const modalSearchInput = document.getElementById("modalSurahSearchInput");
let allSurahs = [];
let listVisible = false;

function setListVisible(_visible) {
  // placeholder retained for compatibility; list now shown via modal
}

function openSearchModal() {
  if (searchModal) {
    searchModal.classList.add("modal--open");
    searchModal.setAttribute("aria-hidden", "false");
  }
  if (modalSearchInput) {
    modalSearchInput.focus();
  }
}

function closeSearchModal() {
  if (searchModal) {
    searchModal.classList.remove("modal--open");
    searchModal.setAttribute("aria-hidden", "true");
  }
}

async function loadSurahsFromLocal() {
  const res = await fetch("./data/surahs.json");
  if (!res.ok) throw new Error("Local surahs.json missing");
  return res.json();
}

async function loadSurahs() {
  try {
    let res = null;
    try {
      res = await fetch("/api/surahs");
      if (!res.ok) throw new Error("api/surahs not ok");
      allSurahs = await res.json();
    } catch (err) {
      // Fallback to bundled data for static/preview environments
      allSurahs = await loadSurahsFromLocal();
    }
    if (surahListContainer) renderSurahList(allSurahs);
    if (modalSurahListContainer) renderSurahList(allSurahs, modalSurahListContainer);
    renderPopularSurahs(allSurahs);
    hydrateLastReadPanel();
  } catch (err) {
    console.error("Failed to load surah data", err);
    if (surahListContainer) {
      surahListContainer.innerHTML =
        "<p style='padding:14px;font-size:14px;'>Unable to load surah data.</p>";
    }
  }
}

function renderPopularSurahs(list) {
  const popularRow = document.getElementById("popularSurahsRow");
  if (!popularRow) return;
  const popularNumbers = [1, 36, 55, 67, 112, 113, 114];
  popularRow.innerHTML = "";
  popularNumbers.forEach((num) => {
    const s = list.find((x) => x.number === num);
    if (!s) return;
    const card = document.createElement("button");
    card.className = "surah-mini-card";
    card.innerHTML = `
      <div class="surah-mini-card__top">
        <span class="surah-mini-card__name-en">${s.englishName}</span>
        <span class="surah-mini-card__badge">${s.revelationType}</span>
      </div>
      <div class="surah-mini-card__bottom">
        <span class="surah-mini-card__name-ar">${s.arabicName}</span>
        <span class="surah-mini-card__meta">${s.ayahCount} Ayahs</span>
      </div>
    `;
    card.addEventListener("click", () => {
      window.quranApp.setLastRead(s);
      window.location.href = `surah.html?number=${encodeURIComponent(s.number)}`;
    });
    popularRow.appendChild(card);
  });
}

function createSurahItem(surah) {
  const lastRead = window.quranApp.getLastRead();
  const isLastRead = lastRead && lastRead.number === surah.number;

  const btn = document.createElement("button");
  btn.className = "surah-item";
  if (isLastRead) btn.classList.add("surah-item--selected");

  btn.setAttribute("data-number", String(surah.number));
  btn.setAttribute("data-name-en", surah.englishName.toLowerCase());
  btn.setAttribute("data-name-ar", surah.arabicName);
  btn.setAttribute("data-revelation", surah.revelationType.toLowerCase());

  btn.innerHTML = `
    <div class="surah-item__number">${surah.number}</div>
    <div class="surah-item__main">
      <div class="surah-item__en">${surah.englishName}</div>
      <div class="surah-item__ar">${surah.arabicName}</div>
      <div class="surah-item__meta">
        <span>${surah.revelationType}</span>
        <span class="surah-item__meta-dot"></span>
        <span>${surah.ayahCount} Ayahs</span>
      </div>
    </div>
    <div class="surah-item__right">
      <div class="surah-item__actions">
        <span class="surah-item__ayah-count">${surah.ayahCount}</span>
      </div>
      ${
        isLastRead
          ? '<span class="surah-item__last-read-tag">Last read</span>'
          : ""
      }
    </div>
  `;

  btn.addEventListener("click", () => {
    window.quranApp.setLastRead(surah);
    const url = `surah.html?number=${encodeURIComponent(surah.number)}`;
    window.location.href = url;
  });

  return btn;
}

function renderSurahList(list, target = surahListContainer) {
  if (!target) return;
  target.innerHTML = "";
  list.forEach((s) => {
    const node = createSurahItem(s);
    target.appendChild(node);
  });
}

function hydrateLastReadPanel() {
  const lastRead = window.quranApp.getLastRead();
  if (!lastRead || !lastReadSurahNameEn || !lastReadSurahNameAr) return;

  lastReadPanel.hidden = false;
  lastReadSurahNameEn.textContent = lastRead.englishName;
  lastReadSurahNameAr.textContent = lastRead.arabicName;

  if (lastReadJumpBtn) {
    lastReadJumpBtn.onclick = () => {
      const url = `surah.html?number=${encodeURIComponent(lastRead.number)}`;
      window.location.href = url;
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setListVisible(isSurahsPage);
  loadSurahs();

  if (browseAllSurahsBtn) {
    browseAllSurahsBtn.addEventListener("click", () => {
      window.location.href = "surahs.html";
    });
  }

  if (featureAllSurahsCard) {
    featureAllSurahsCard.addEventListener("click", () => {
      window.location.href = "surahs.html";
    });
    featureAllSurahsCard.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.href = "surahs.html";
      }
    });
  }

  if (featureBookmarksCard) {
    featureBookmarksCard.addEventListener("click", () => {
      const bookmarksSection = document.getElementById("bookmarksSection");
      if (bookmarksSection) {
        bookmarksSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (backHomeBtn) {
    backHomeBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  if (searchModalClose) searchModalClose.addEventListener("click", closeSearchModal);
  if (searchModalBackdrop) searchModalBackdrop.addEventListener("click", closeSearchModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearchModal();
  });

  const qaContinue = document.getElementById("qaContinue");
  if (qaContinue) {
    qaContinue.addEventListener("click", () => lastReadJumpBtn?.click());
  }
  const qaSearch = document.getElementById("qaSearch");
  if (qaSearch) {
    qaSearch.addEventListener("click", () => openSearchModal());
  }
  const qaBookmarks = document.getElementById("qaBookmarks");
  if (qaBookmarks) {
    qaBookmarks.addEventListener("click", () => {
      document.getElementById("bookmarksSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  const qaTasbih = document.getElementById("qaTasbih");
  if (qaTasbih) {
    qaTasbih.addEventListener("click", () => {
      document.getElementById("tasbihCircle")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
  const qaAudio = document.getElementById("qaAudio");
  if (qaAudio) {
    qaAudio.addEventListener("click", () => (window.location.href = "surahs.html"));
  }

  const navSearchBtn = document.getElementById("navScrollSearch");
  if (navSearchBtn) {
    navSearchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openSearchModal();
    });
  }

  const homeSearchButton = document.getElementById("browseAllSurahsBtn");
  if (homeSearchButton) {
    homeSearchButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "surahs.html";
    });
  }
});
