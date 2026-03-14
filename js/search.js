const searchInput = document.getElementById("surahSearchInput");
const searchClearBtn = document.getElementById("searchClearBtn");
const modalSearchInput = document.getElementById("modalSurahSearchInput");
const modalSearchClearBtn = document.getElementById("modalSearchClearBtn");
const modalSearchBtn = document.getElementById("modalSearchBtn");
const searchResultsSection = document.getElementById("searchResultsSection");

function applySearchFilter(query) {
  const q = query.trim().toLowerCase();
  const items = document.querySelectorAll(".surah-item");
  items.forEach((item) => {
    const en = item.getAttribute("data-name-en") || "";
    const ar = item.getAttribute("data-name-ar") || "";
    const number = item.getAttribute("data-number") || "";
    if (!q) {
      item.classList.remove("hidden");
      return;
    }
    const matches =
      en.includes(q) ||
      ar.includes(q) ||
      number === q ||
      number.startsWith(q);
    if (matches) {
      item.classList.remove("hidden");
    } else {
      item.classList.add("hidden");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!searchInput && !modalSearchInput) return;

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const value = e.target.value;
      if (searchResultsSection) {
        searchResultsSection.classList.remove("is-collapsed");
        searchResultsSection.hidden = false;
      }
      applySearchFilter(value);
      if (searchClearBtn) {
        searchClearBtn.hidden = !value;
      }
    });
  }

  if (modalSearchInput) {
    modalSearchInput.addEventListener("input", (e) => {
      const value = e.target.value;
      applySearchFilter(value);
      if (modalSearchClearBtn) {
        modalSearchClearBtn.hidden = !value;
      }
    });
  }

  if (searchClearBtn && searchInput) {
    searchClearBtn.addEventListener("click", () => {
      searchInput.value = "";
      searchClearBtn.hidden = true;
      applySearchFilter("");
      searchInput.focus();
    });
  }

  if (modalSearchClearBtn && modalSearchInput) {
    modalSearchClearBtn.addEventListener("click", () => {
      modalSearchInput.value = "";
      modalSearchClearBtn.hidden = true;
      applySearchFilter("");
      modalSearchInput.focus();
    });
  }

  if (modalSearchBtn && modalSearchInput) {
    modalSearchBtn.addEventListener("click", () => {
      applySearchFilter(modalSearchInput.value || "");
    });
  }
});

