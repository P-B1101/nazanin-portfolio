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

## Deploy (Cloudflare Pages)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick this repo.
2. Framework preset: **None**. Build command: *(leave empty)*. Build output directory: `/`.
3. Save and deploy, then add the custom domain under **Custom domains**.
