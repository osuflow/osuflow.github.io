// Node-only contract checks for the actual page script. No network requests or downloads.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const selectors = ['.js-version', 'a.js-download', '.js-size', '.js-linux-appimage', '.js-linux-deb', '.js-preview-windows', '.js-macos-arm', '.js-macos-intel', '.js-preview-version', '.js-preview-release'];
const file = (name, tag) => ({ name, size: 2097152, browser_download_url: `https://github.com/tempted14/osuflow/releases/download/${tag}/${name}` });
const stable = { tag_name: 'v3.3.0', draft: false, prerelease: false, assets: [file('osu.flow_3.3.0_x64-setup.exe', 'v3.3.0')] };
const preview = { tag_name: 'v3.4.0', draft: false, prerelease: true, assets: [file('osu.flow_3.4.0_x64-setup.exe', 'v3.4.0'), file('osu.flow_3.4.0_amd64.AppImage', 'v3.4.0'), file('osu.flow_3.4.0_amd64.deb', 'v3.4.0'), file('osu.flow_3.4.0_aarch64.dmg', 'v3.4.0'), file('osu.flow_3.4.0_x64.dmg', 'v3.4.0')] };
async function run(latest, list, offline = false) {
  const nodes = Object.fromEntries(selectors.map((selector) => [selector, [{ hidden: true, textContent: '', href: 'https://github.com/tempted14/osuflow/releases/latest' }]]));
  nodes['.js-version'][0].textContent = 'v3.3.0';
  const section = { hidden: true };
  vm.runInNewContext(source, {
    URL, encodeURIComponent,
    document: { querySelectorAll: (selector) => nodes[selector] ?? [], getElementById: (id) => id === 'experimental-downloads' ? section : null },
    fetch: async (url) => { if (offline) throw new Error('offline'); return { ok: true, json: async () => url.endsWith('/latest') ? latest : list }; },
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { node: (selector) => nodes[selector][0], section };
}
let passed = 0;
function check(name, test) { assert.ok(test, name); console.log(`PASS ${name}`); passed++; }

const both = await run(stable, [preview, stable]);
check('normal Windows installer stays on the stable release', both.node('a.js-download').href.includes('/v3.3.0/'));
check('normal version stays independent from preview version', both.node('.js-version').textContent === 'v3.3.0' && both.node('.js-preview-version').textContent === 'v3.4.0');
check('published Linux preview is discoverable even though latest excludes prereleases', !both.section.hidden);
check('Linux AppImage and deb point to their own assets', both.node('.js-linux-appimage').href.endsWith('.AppImage') && both.node('.js-linux-deb').href.endsWith('.deb'));
check('Windows client preview is offered separately', !both.node('.js-preview-windows').hidden && both.node('.js-preview-windows').href.includes('/v3.4.0/'));
check('Mac architectures are separate', both.node('.js-macos-arm').href.endsWith('aarch64.dmg') && both.node('.js-macos-intel').href.endsWith('x64.dmg'));

const old = await run(stable, [stable]);
check('no Linux button before an asset exists', old.section.hidden && old.node('.js-linux-appimage').hidden && old.node('.js-linux-deb').hidden);
const draft = await run(stable, [{ ...preview, draft: true }, stable]);
check('draft builds are never advertised', draft.section.hidden);
const broken = await run(null, null, true);
check('offline lookup preserves the releases fallback', broken.node('a.js-download').href.endsWith('/releases/latest') && broken.section.hidden);
const invalid = await run(stable, [{ ...preview, assets: preview.assets.map((asset) => ({ ...asset, browser_download_url: 'javascript:alert(1)' })) }]);
check('unsafe download URLs are rejected', invalid.section.hidden);
const foreign = await run(stable, [{ ...preview, assets: preview.assets.map((asset) => ({ ...asset, browser_download_url: 'https://github.com/someone/else/releases/download/v1/file.AppImage' })) }]);
check('another repository cannot supply the installer', foreign.section.hidden);
const current = await run({ ...preview, prerelease: false }, [{ ...preview, prerelease: false }]);
check('a future stable release keeps Linux alongside Windows', !current.section.hidden && current.node('a.js-download').href.includes('/v3.4.0/'));
check('same-version Windows preview is not duplicated', current.node('.js-preview-windows').hidden);
console.log(`${passed} download-selection checks passed`);
