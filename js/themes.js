async function initThemes() {
  const themesRow = document.getElementById("themesRow");
  if (!themesRow) return;

  try {
    const res = await fetch("/api/themes");
    if (!res.ok) return;
    const themes = await res.json();

    themesRow.innerHTML = "";
    Object.entries(themes).forEach(([key, theme]) => {
      const chip = document.createElement("button");
      chip.className = "chip chip--theme";
      chip.innerHTML = `
        <span>${theme.title}</span>
        <small style="font-size:10px">${theme.ayahs.length} ayahs</small>
      `;
      chip.addEventListener("click", () => {
        // Navigate to first ayah or show collection modal
        const first = theme.ayahs[0];
        window.location.href = `surah.html?number=${first.surah}&ayah=${first.ayah}`;
      });
      themesRow.appendChild(chip);
    });
  } catch (err) {
    console.error("Failed to load themes", err);
  }
}
