const ayahSearchInput = document.getElementById("ayahSearchInput");
const advancedSearchResults = document.getElementById("advancedSearchResults");

let searchTimeoutId;

async function runAdvancedSearch(query) {
  if (!advancedSearchResults) return;
  const q = query.trim();
  if (!q) {
    advancedSearchResults.innerHTML =
      '<p style="font-size:12px;color:var(--text-muted);">Type a word or phrase above to search inside ayahs.</p>';
    return;
  }

  advancedSearchResults.innerHTML =
    '<p style="font-size:12px;color:var(--text-muted);">Searching…</p>';

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&translation=en`);
    if (!res.ok) {
      advancedSearchResults.innerHTML =
        '<p style="font-size:12px;color:var(--text-muted);">Unable to search right now.</p>';
      return;
    }
    const data = await res.json();
    const groups = data.groups || [];
    if (!groups.length) {
      advancedSearchResults.innerHTML =
        '<p style="font-size:12px;color:var(--text-muted);">No ayahs found for this query.</p>';
      return;
    }

    advancedSearchResults.innerHTML = "";
    groups.forEach((g) => {
      const groupEl = document.createElement("div");
      groupEl.className = "advanced-search-group";
      groupEl.innerHTML = `
        <div class="advanced-search-group__header">
          <span>${g.surahNumber}. ${g.surahEnglishName}</span>
          <span>${g.surahArabicName}</span>
        </div>
      `;
      g.results.forEach((r) => {
        const item = document.createElement("div");
        item.className = "advanced-search-result";
        item.innerHTML = `
          <div class="advanced-search-result__text-ar">${r.textArabic}</div>
          ${
            r.textTranslation
              ? `<div class="advanced-search-result__text-tr">${r.textTranslation}</div>`
              : ""
          }
          <div class="advanced-search-result__meta">
            <span>Ayah ${r.ayahNumber}</span>
            <button class="advanced-search-result__link">Open</button>
          </div>
        `;
        const linkBtn = item.querySelector(".advanced-search-result__link");
        if (linkBtn) {
          linkBtn.addEventListener("click", () => {
            window.location.href = `surah.html?number=${encodeURIComponent(
              g.surahNumber
            )}&ayah=${encodeURIComponent(r.ayahNumber)}`;
          });
        }
        groupEl.appendChild(item);
      });
      advancedSearchResults.appendChild(groupEl);
    });
  } catch (err) {
    console.error("Advanced search error", err);
    advancedSearchResults.innerHTML =
      '<p style="font-size:12px;color:var(--text-muted);">Unable to search right now.</p>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!ayahSearchInput || !advancedSearchResults) return;

  ayahSearchInput.addEventListener("input", (e) => {
    const value = e.target.value;
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
    }
    searchTimeoutId = setTimeout(() => {
      runAdvancedSearch(value);
    }, 400);
  });
});

