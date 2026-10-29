/* osu!flow site: the latest version number, and the hover-and-Enter demo. No libraries, no tracking. */
(() => {
  "use strict";

  // Include published previews: the user should always get the newest available version.
  const currentOrNewer = (tag) => {
    const parts = typeof tag === "string" && /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(tag);
    if (!parts) return false;
    const version = parts.slice(1).map(Number), pinned = [3, 4, 0];
    for (let i = 0; i < 3; i++) { if (version[i] !== pinned[i]) return version[i] > pinned[i]; }
    return true;
  };
  const api = "https://api.github.com/repos/tempted14/osuflow/releases?per_page=10";
  const validAsset = (asset) => {
    if (!asset || typeof asset.name !== "string" || typeof asset.browser_download_url !== "string" || !(asset.size > 0)) return false;
    try { const url = new URL(asset.browser_download_url); return url.origin === "https://github.com" && !url.username && !url.password && url.pathname.startsWith("/tempted14/osuflow/releases/download/"); } catch { return false; }
  };
  const asset = (release, pattern) => Array.isArray(release?.assets) ? release.assets.find((item) => validAsset(item) && pattern.test(item.name)) : null;
  fetch(api, { headers: { Accept: "application/vnd.github+json" } })
    .then((response) => response.ok ? response.json() : null)
    .then((releases) => {
      const candidates = (Array.isArray(releases) ? releases : []).filter((release) => release && !release.draft && !release.isDraft && currentOrNewer(release.tag_name));
      const newest = candidates.find((release) => asset(release, /x64-setup\.exe$/i));
      const installer = asset(newest, /x64-setup\.exe$/i);
      if (installer) {
        document.querySelectorAll(".js-test-download-note").forEach((el) => { el.hidden = true; });
        if (typeof newest.tag_name === "string") document.querySelectorAll(".js-version").forEach((el) => { el.textContent = newest.tag_name; });
        document.querySelectorAll("a.js-download").forEach((link) => { link.href = installer.browser_download_url; });
        document.querySelectorAll(".js-size").forEach((el) => { el.textContent = (installer.size / 1048576).toFixed(1) + " MB"; });
      }
      const release = candidates.find((release) => asset(release, /(?:amd64|x86_64)\.AppImage$/i) || asset(release, /amd64\.deb$/i));
      if (!release) return; // Keep the verified 3.4 test-build links until a public release exists.
      document.querySelectorAll('.js-linux-artifact, .js-macos-arm, .js-macos-intel').forEach((link) => { link.hidden = true; });
      const show = (selector, found) => document.querySelectorAll(selector).forEach((link) => { if (found) { link.href = found.browser_download_url; link.hidden = false; } });
      show('.js-linux-appimage', asset(release, /(?:amd64|x86_64)\.AppImage$/i));
      show('.js-linux-deb', asset(release, /amd64\.deb$/i));
      if (release.tag_name !== newest?.tag_name) show('.js-preview-windows', asset(release, /x64-setup\.exe$/i));
      show('.js-macos-arm', asset(release, /(?:aarch64|arm64)\.dmg$/i));
      show('.js-macos-intel', asset(release, /x64\.dmg$/i));
      document.querySelectorAll('.js-preview-version').forEach((el) => { el.textContent = typeof release.tag_name === "string" ? release.tag_name : ""; });
      document.querySelectorAll('.js-preview-release').forEach((link) => { link.href = "https://github.com/tempted14/osuflow/releases/tag/" + encodeURIComponent(release.tag_name); link.textContent = "Release notes and SHA-256 checksums"; });
      document.getElementById('experimental-downloads').hidden = false;
    }).catch(() => undefined);

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
