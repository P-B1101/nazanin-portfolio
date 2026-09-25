# nazanin-portfolio

Personal site of **Nazanin Fereydoonizade**, software engineer.

The site is designed to feel like a running backend service: it boots with a
Spring-style startup log, every section is an API endpoint, experience reads like
Swagger docs, there is a live saga/compensation simulation, and a small console
(press <kbd>`</kbd>) that answers `curl`, `whoami`, `experience`, `skills` and more.

## Stack

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.
Fonts are self-hosted, so the site makes no third-party requests.

```
index.html      page skeleton
404.html        custom not-found page
css/styles.css  all styling (dark and light themes)
js/data.js      all content: experience, skills, education, links
js/app.js       rendering, console, saga simulation
assets/fonts/    self-hosted Inter and JetBrains Mono (SIL OFL 1.1)
_headers        security and cache headers for Cloudflare Pages
```

## Updating content

Everything on the page comes from `js/data.js`. Edit it and push.

## Run locally

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

## Release and deploy

Double-click `release.cmd` (Windows). It asks everything it needs:

1. What to do: release and deploy, deploy again, or release without deploying.
2. Your Cloudflare Pages project name (first time only, saved in `.release.json`).
3. What kind of change it is (small fix, new feature, redesign), which sets the new version.
4. A one-line description, which goes into `CHANGELOG.md`, the commit and the tag.

It then pulls `main`, bumps the version, commits, tags, pushes, logs you in to
Cloudflare if needed, and deploys only the site files with wrangler.

## Versioning

The current version lives in `js/data.js` (`SITE_VERSION`) and shows in the
startup log and the footer. The release script bumps it, so there is no need to edit
it by hand. Patch is for content fixes, minor for new sections or features,
major for redesigns.
