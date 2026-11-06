# streamingdashboard_dev_06r7GanKYojG — StreamingDashboard

A personal, single-page web app that acts as your own home screen for TV shows:
one grid of your favourite shows, each linking out to the official streaming
service you already subscribe to (the Chromecast / Fire TV Stick model).

## What it does

- Grid of your shows with poster, year, genre, service badge and notes
- Add / edit / delete shows; mark them watched
- Search and filter by service
- "Watch" opens the show's official page (or the service's search for that
  title) in a new tab — it never hosts, embeds or streams any content itself
- Optional TMDB lookup to auto-fill title, year, poster and overview
- Optional Mistral-powered "Ask AI" assistant that recommends from your list

## Run it

No build step and no dependencies. Either:

- open `index.html` directly in a browser, or
- serve the folder: `python3 -m http.server 8000` then visit
  `http://localhost:8000`

## Data and privacy

Everything (your list and any API keys) is stored only in your browser's
localStorage. Nothing is sent anywhere except:

- TMDB (`api.themoviedb.org`) if you add a TMDB key, for metadata lookup
- Mistral (`api.mistral.ai`) if you add a Mistral key, for the assistant

Get keys at https://www.themoviedb.org/settings/api and
https://console.mistral.ai — paste them in the app's Settings. Keys are never
written to this repo.

## Legal note

This app only links to official services. It does not download, re-host,
embed or bypass DRM on any third-party content, and it is intended for
personal use with services you are subscribed to.
