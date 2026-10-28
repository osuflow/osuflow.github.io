# osuflow.github.io

The website for [osu!flow](https://github.com/tempted14/osuflow): a free, open-source Windows app that
opens a search card over osu! (stable) so you can find a map, press Enter, and have it in song select.

It is plain HTML, CSS and a little JavaScript, with no build step, no framework, no cookies and no
trackers. The page's only network request is to GitHub's public API, to show the latest version number
and link the installer directly; without it the buttons still go to the releases page.

```
index.html            the page
404.html              the not-found page (self-contained)
assets/style.css      all styles
assets/app.js         scroll reveal, the latest version, and the hover-and-Enter demo
assets/img/           screenshots of the real app, showing popular ranked maps and their original covers
assets/icon.png       the app icon;  assets/og.png  the social-preview image
robots.txt, sitemap.xml, .nojekyll
```

## Preview

Open `index.html` in a browser, or serve the folder (`python -m http.server`, `npx serve`) if you
want the 404 page too.

## Publish

GitHub Pages serves a repository named exactly `<account>.github.io` from that account's address, so
this repository has to be `osuflow/osuflow.github.io` to appear at https://osuflow.github.io/. Then
*Settings, Pages, Deploy from a branch, `main`, `/ (root)`*. All paths in the page are relative, so
the same files also work under a project path.

## Keeping it current

The version number and download link update themselves from the latest GitHub release. By hand, only
the "New in 3.x" line under the hero and `softwareVersion` in the page's structured data change when
there is a release worth announcing. The screenshots come from the app's own UI, showing real ranked maps. The reproducible screenshot
tooling and curated fixture live in the app repository under `tools/headless/`.

## Licence

[MIT](LICENSE). Cover art, titles and artists in screenshots belong to their respective owners (ppy, mappers, artists); osu!flow includes none of them.
