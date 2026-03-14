

const THEME_KEY = "quran-theme";
const LAST_READ_KEY = "quran-last-read";
const BOOKMARKS_KEY = "quran-bookmarks";
const AYAH_BOOKMARKS_KEY = "quran-ayah-bookmarks";


function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark") {
    document.body.classList.add("theme-dark");
  }
  const toggleBtn = document.getElementById("themeToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("theme-dark");
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    });
  }
}


function getBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBookmarks(list) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
}

function isBookmarked(number) {
  return getBookmarks().includes(number);
}

function toggleBookmark(number) {
  const current = getBookmarks();
  if (current.includes(number)) {
    saveBookmarks(current.filter((n) => n !== number));
    return false;
  } else {
    current.push(number);
    saveBookmarks(current);
    return true;
  }
}


function getAyahBookmarks() {
  try {
    const raw = localStorage.getItem(AYAH_BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAyahBookmarks(list) {
  localStorage.setItem(AYAH_BOOKMARKS_KEY, JSON.stringify(list));
}

function ayahKey(surah, ayah) {
  return `${surah}:${ayah}`;
}

function isAyahBookmarked(surah, ayah) {
  const key = ayahKey(surah, ayah);
  return getAyahBookmarks().includes(key);
}

function toggleAyahBookmark(surah, ayah) {
  const key = ayahKey(surah, ayah);
  const current = getAyahBookmarks();
  if (current.includes(key)) {
    saveAyahBookmarks(current.filter((k) => k !== key));
    return false;
  } else {
    current.push(key);
    saveAyahBookmarks(current);
    return true;
  }
}


function setLastRead(surahObj) {
  localStorage.setItem(LAST_READ_KEY, JSON.stringify(surahObj));
}

function getLastRead() {
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}


function initTasbih() {
  const circle = document.getElementById("tasbihCircle");
  const roundsEl = document.getElementById("tasbihRounds");
  const resetBtn = document.getElementById("tasbihResetBtn");
  if (!circle || !roundsEl || !resetBtn) return;

  let count = 0;
  const goal = 100;
  let rounds = 0;

  function update() {
    circle.textContent = String(count % goal);
    roundsEl.textContent = `${count % goal} / ${goal}`;
  }

  circle.addEventListener("click", () => {
    count += 1;
    circle.classList.add("tasbih-pulse");
    setTimeout(() => circle.classList.remove("tasbih-pulse"), 220);
    if (count % goal === 0) rounds += 1;
    update();
  });

  resetBtn.addEventListener("click", () => {
    count = 0;
    rounds = 0;
    update();
  });

  update();
}


async function initAyahOfDay() {
  const arEl = document.getElementById("ayahOfDayAr");
  const enEl = document.getElementById("ayahOfDayEn");
  const metaEl = document.getElementById("ayahOfDayMeta");
  if (!arEl || !enEl || !metaEl) return;

  try {
    const res = await fetch("https://api.alquran.cloud/v1/ayah/36:58/quran-simple");
    const data = await res.json();
    if (data.status !== "OK") return;
    arEl.textContent = data.data.text;
    enEl.textContent =
      "A sample ayah from Surah Ya-Sin. You can swap this with a translation API.";
    metaEl.textContent = "Surah Ya-Sin, Ayah 58";
  } catch {
    
  }
}

function initNavShortcuts() {
  const scrollSearchBtn = document.getElementById("navScrollSearch");
  const scrollBookmarksBtn = document.getElementById("navScrollBookmarks");
  const searchSection = document.getElementById("searchSection");
  const bookmarksSection = document.getElementById("bookmarksSection");
  const featureSearchCard = document.getElementById("featureSearchCard");
  const featureBookmarksCard = document.getElementById("featureBookmarksCard");
  const heroStartBtn = document.getElementById("heroStartReadingBtn");
  const bookmarksPill = document.getElementById("bookmarksFilterBtn");

  function scrollToEl(el) {
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (scrollSearchBtn) {
    scrollSearchBtn.addEventListener("click", () => scrollToEl(searchSection));
  }
  if (featureSearchCard) {
    featureSearchCard.addEventListener("click", () => scrollToEl(searchSection));
  }
  if (scrollBookmarksBtn) {
    scrollBookmarksBtn.addEventListener("click", () =>
      scrollToEl(bookmarksSection || searchSection)
    );
  }
  if (featureBookmarksCard) {
    featureBookmarksCard.addEventListener("click", () =>
      scrollToEl(bookmarksSection || searchSection)
    );
  }
  if (heroStartBtn) {
    heroStartBtn.addEventListener("click", () => scrollToEl(searchSection));
  }
  if (bookmarksPill) {
    bookmarksPill.addEventListener("click", () =>
      scrollToEl(bookmarksSection || searchSection)
    );
  }
}


async function initBookmarkList() {
  const listEl = document.getElementById("bookmarkedAyahsList");
  if (!listEl) return;

  const keys = getAyahBookmarks();
  if (!keys.length) {
    listEl.innerHTML =
      '<p style="font-size:12px;color:var(--text-muted);">No ayahs bookmarked yet. Tap the star beside an ayah while reading to save it here.</p>';
    return;
  }

  let surahMeta = [];
  try {
    const res = await fetch("/api/surahs");
    surahMeta = await res.json();
  } catch {
    
  }

  const surahByNumber = new Map(surahMeta.map((s) => [s.number, s]));

  listEl.innerHTML = "";
  keys.forEach((key) => {
    const [sStr, aStr] = key.split(":");
    const sNum = parseInt(sStr, 10);
    const aNum = parseInt(aStr, 10);
    if (!Number.isFinite(sNum) || !Number.isFinite(aNum)) return;

    const meta = surahByNumber.get(sNum);
    const item = document.createElement("button");
    item.className = "bookmark-item";
    item.innerHTML = `
      <div class="bookmark-item__left">
        <div class="bookmark-item__surah">
          ${meta ? meta.englishName : "Surah " + sNum}
        </div>
        <div class="bookmark-item__ayah">
          Ayah ${aNum}${meta ? ` • ${meta.arabicName}` : ""}
        </div>
      </div>
      <div class="bookmark-item__right">
        Open →
      </div>
    `;
    item.addEventListener("click", () => {
      window.location.href = `surah.html?number=${encodeURIComponent(
        sNum
      )}&ayah=${encodeURIComponent(aNum)}`;
    });
    listEl.appendChild(item);
  });
}

window.quranApp = {
  THEME_KEY,
  LAST_READ_KEY,
  BOOKMARKS_KEY,
  AYAH_BOOKMARKS_KEY,
  initTheme,
  isBookmarked,
  toggleBookmark,
  getBookmarks,
  getAyahBookmarks,
  isAyahBookmarked,
  toggleAyahBookmark,
  setLastRead,
  getLastRead,
  initTasbih,
  initAyahOfDay,
  initNavShortcuts,
  initBookmarkList,
};

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initTasbih();
  initAyahOfDay();
  initNavShortcuts();
  initBookmarkList();
});


window.addEventListener("pageshow", () => {
  const listEl = document.getElementById("bookmarkedAyahsList");
  if (listEl) {
    initBookmarkList();
  }
});
