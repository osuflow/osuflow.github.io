/* osu!flow site: reveal-on-scroll, the latest version number, and the hover-and-Enter demo. No libraries, no tracking. */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Reveal sections as they scroll into view (everything is simply visible without JS or with reduced motion).
  const reveals = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    document.documentElement.classList.add("js");
    const seen = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          seen.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    reveals.forEach((el, index) => {
      el.style.setProperty("--d", `${(index % 4) * 60}ms`);
      seen.observe(el);
    });
  }

  // ---- The header gets a hairline once the page has scrolled.
  const top = document.getElementById("top");
  const onScroll = () => top && top.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---- The latest version and a direct download link. The page works without this: the buttons already point at the releases page.
  const RELEASE = "https://api.github.com/repos/tempted14/osuflow/releases/latest";
  fetch(RELEASE, { headers: { Accept: "application/vnd.github+json" } })
    .then((response) => (response.ok ? response.json() : null))
    .then((release) => {
      if (!release || !Array.isArray(release.assets)) return;
      const installer = release.assets.find((asset) => /x64-setup\.exe$/i.test(asset.name));
      if (release.tag_name) document.querySelectorAll(".js-version").forEach((el) => (el.textContent = release.tag_name));
      if (!installer) return;
      document.querySelectorAll("a.js-download").forEach((a) => (a.href = installer.browser_download_url));
      const megabytes = installer.size / 1048576;
      document.querySelectorAll(".js-size").forEach((el) => (el.textContent = `${megabytes.toFixed(1)} MB`));
    })
    .catch(() => undefined);

  // ---- Demo: rest the pointer on a map and press Enter.
  const demo = document.getElementById("demo");
  if (!demo) return;
  const rows = [...demo.querySelectorAll(".demo-row")];
  const hint = demo.querySelector(".demo-hint");
  const hintText = demo.querySelector(".demo-hint-text");
  const reset = demo.querySelector(".demo-reset");
  const IDLE = "Rest the pointer on a map, then press Enter";
  let hovered = null;

  const setHint = (text, on) => {
    hintText.textContent = text;
    hint.classList.toggle("on", Boolean(on));
  };

  const start = (row) => {
    if (row.dataset.state && row.dataset.state !== "idle") return;
    row.dataset.state = "busy";
    setHint(`Downloading ${row.dataset.title}…`, true);
    window.setTimeout(() => {
      row.dataset.state = "done";
      setHint(`${row.dataset.title} is in song select.`, true);
      reset.hidden = false;
    }, reduced ? 200 : 1100);
  };

  rows.forEach((row) => {
    row.dataset.state = "idle";
    row.addEventListener("pointerenter", () => {
      hovered = row;
      if (row.dataset.state === "idle") setHint("Press Enter to download", true);
    });
    row.addEventListener("pointerleave", () => {
      if (hovered === row) hovered = null;
      setHint(IDLE, false);
    });
    row.addEventListener("focus", () => setHint("Press Enter to download", row.dataset.state === "idle"));
    row.addEventListener("blur", () => setHint(IDLE, false));
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
    setHint(IDLE, false);
  });
})();
