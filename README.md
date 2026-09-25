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

`release.ps1` does the whole release from Windows PowerShell with wrangler:
pulls `main`, bumps the version in `js/data.js`, adds a `CHANGELOG.md` entry,
commits, tags `vX.Y.Z`, pushes, and deploys the site files to Cloudflare Pages.

```powershell
# edit js/data.js (or anything else), then:
.\release.ps1 -Message "Add photo"                   # patch: 1.0.0 -> 1.0.1
.\release.ps1 -Bump minor -Message "New section"     # minor: 1.0.1 -> 1.1.0
.\release.ps1 -Bump major -Message "Redesign"        # major: 1.1.0 -> 2.0.0
.\release.ps1 -DeployOnly                            # redeploy main as is
.\release.ps1 -Message "Fix typo" -SkipDeploy        # release without deploying
```

The Cloudflare Pages project defaults to `nazanin-portfolio`; pass
`-ProjectName <name>` to use another. The first time, run `wrangler login`.
If Windows blocks the script, run it with
`powershell -ExecutionPolicy Bypass -File .\release.ps1 -Message "..."`.

## Versioning

The current version lives in `js/data.js` (`SITE_VERSION`) and shows in the
startup log and the footer. `release.ps1` bumps it, so there is no need to edit
it by hand. Patch is for content fixes, minor for new sections or features,
major for redesigns.
