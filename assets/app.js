/* osu!flow site: the latest version number, and the hover-and-Enter demo. No libraries, no tracking. */
(() => {
  "use strict";

  // The latest version and a direct download link. The page works without this: the buttons already point at the releases page.
  fetch("https://api.github.com/repos/tempted14/osuflow/releases/latest", { headers: { Accept: "application/vnd.github+json" } })
    .then((response) => (response.ok ? response.json() : null))
    .then((release) => {
      if (!release || !Array.isArray(release.assets)) return;
      const installer = release.assets.find((asset) => /x64-setup\.exe$/i.test(asset.name));
      if (release.tag_name) document.querySelectorAll(".js-version").forEach((el) => (el.textContent = release.tag_name));
      if (!installer) return;
      document.querySelectorAll("a.js-download").forEach((a) => (a.href = installer.browser_download_url));
      document.querySelectorAll(".js-size").forEach((el) => (el.textContent = `${(installer.size / 1048576).toFixed(1)} MB`));
    })
    .catch(() => undefined);

  // Demo: rest the pointer on a map and press Enter.
  const demo = document.getElementById("demo");
  if (!demo) return;
  const rows = [...demo.querySelectorAll(".demo-row")];
  const hintText = demo.querySelector(".demo-hint-text");
  const reset = demo.querySelector(".demo-reset");
  const IDLE = "Rest the pointer on a map, then press Enter";
  let hovered = null;

  const start = (row) => {
    if (row.dataset.state !== "idle") return;
    row.dataset.state = "busy";
    hintText.textContent = `Downloading ${row.dataset.title}…`;
    window.setTimeout(() => {
      row.dataset.state = "done";
      hintText.textContent = `${row.dataset.title} is in song select.`;
      reset.hidden = false;
    }, 1000);
  };

  rows.forEach((row) => {
    row.dataset.state = "idle";
    row.addEventListener("pointerenter", () => {
      hovered = row;
      if (row.dataset.state === "idle") hintText.textContent = "Press Enter to download";
    });
    row.addEventListener("pointerleave", () => {
      if (hovered === row) hovered = null;
      hintText.textContent = IDLE;
    });
    row.addEventListener("focus", () => {
      if (row.dataset.state === "idle") hintText.textContent = "Press Enter to download";
    });
    row.addEventListener("blur", () => (hintText.textContent = IDLE));
    row.querySelector(".demo-get").addEventListener("click", () => start(row));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.target === row) {
        event.preventDefault();
        start(row);
      }
    });
  });

  // Enter works on the map under the pointer, as in the app, whatever has focus.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.repeat || !hovered) return;
    if (event.target instanceof Element && event.target.closest("a, button, summary")) return;
    event.preventDefault();
    start(hovered);
  });

  reset.addEventListener("click", () => {
    rows.forEach((row) => (row.dataset.state = "idle"));
    reset.hidden = true;
    hintText.textContent = IDLE;
  });
})();
