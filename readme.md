## al_leprob_openai offline learning application

- This is a low-resource computing application that can be self-hosted and used largely offline (Yes, at certain points you may need to connect to the internet) for people who are in institutions or other areas where perhaps offline is required. The application's goal is to provide a basis that can be expanded or scaled as needed with relative ease. 
---
- (1) ChatGPT Main offline learning discussion:
- https://chatgpt.com/share/68e30840-7894-800c-93f1-a8eceaa55f20

- (2) ChatGPT Branch of offline learning discussion:
- https://chatgpt.com/share/68e50983-43c0-800c-bc82-91d758b18676

### Installation and Running 

##### NOTE: The optional items like inkscape, ffmpeg and pydub and other libraries are only required if you are going to expand the applications svgs, audio, phonics

---

# Offline Learning Site — Runbook (Markdown)

## 0) Folder to serve

Serve the folder that contains `index.html` (the project root). All JSON paths (e.g., `modules/...`, `assets/...`) resolve from there.

---

## 1) Run it locally (recommended)

Browsers often restrict `fetch()` when opening a page via `file://`. Running a tiny local server avoids those restrictions.

### Option A — Python (no extra install beyond Python)

**macOS / Linux**

```bash
cd /path/to/offline_learning_site
python3 -m http.server 8080
```

**Windows (PowerShell or CMD)**

```bat
cd \path\to\offline_learning_site
py -m http.server 8080
```

Then open: `http://localhost:8080`

> Reference: Python’s built-in `http.server` module (for development, not production).

### Option B — Node.js (if you prefer npm)

Install Node (LTS), then run a tiny static server:

```bash
cd /path/to/offline_learning_site
npx http-server -p 8080
```

Verify Node is installed with `node --version` and `npm --version`.

---

## 2) If you need to install Python or Node

* **Python 3**: Installers for Windows/macOS, and source for Linux are available.
  Confirm with:

  * macOS/Linux: `python3 --version`
  * Windows: `py --version`

* **Node.js**: Use the official LTS download page.
  Confirm with:

  * `node --version`
  * `npm --version`

---

## 3) Optional: prepare audio clips (OGG) for phonics

Keep clips tiny (mono, ~22 kHz). Two simple approaches:

### A) FFmpeg (CLI only)

1. Install FFmpeg (official builds or your OS package manager).
2. Convert WAV/MP3 → OGG (mono, ~22.05 kHz) for small files:

```bash
ffmpeg -i input.wav -ac 1 -ar 22050 -c:a libvorbis -q:a 3 output.ogg
```

Batch convert a folder (bash):

```bash
for f in *.wav; do
  ffmpeg -i "$f" -ac 1 -ar 22050 -c:a libvorbis -q:a 3 "${f%.wav}.ogg"
done
```

### B) pydub (Python + FFmpeg)

1. Install Python + FFmpeg, then:

```bash
pip install pydub
```

2. Minimal batch script:

```python
from pydub import AudioSegment
from pathlib import Path

src = Path("in_wav")
dst = Path("out_ogg"); dst.mkdir(exist_ok=True)
for wav in src.glob("*.wav"):
    audio = AudioSegment.from_wav(wav)
    audio = audio.set_channels(1).set_frame_rate(22050)
    audio.export(dst / (wav.stem + ".ogg"), format="ogg", bitrate="96k")
```

**Where to put audio:** `assets/audio/phonics/...` to match your lesson JSON.

---

## 4) Optional: create simple SVGs for shapes/number lines

* Use **Inkscape** (free, offline) to draw a triangle, number line, etc.
* **Save As → Plain SVG** for smallest files.
* Place files under `assets/svg/` and reference in lessons, e.g.:

  ```json
  { "type":"svg", "src":"assets/svg/triangle.svg", "alt":"Outlined triangle" }
  ```

> If you kept `renderSvg` as an external loader, add the `hydrateSvg()` helper so the app fetches and inlines SVG markup after each lesson render. Otherwise, switch `renderSvg` to output a plain `<img src="...">` for a zero-JS approach.

---

## 5) Authoring content (quick checklist)

* **Index catalog:** add each module to `modules/index.json` with matching `"id"` and accurate `"lesson_count"`.
* **Lessons:** each module folder has `lessons.json` with:

  * `id`, `title`, `level`
  * `content`: blocks like `"p"`, `"ul"`, `"a"`, `"img"`, `"svg"`, `"audio"`, `"phoneme"`, `"tenframe"`, `"numberline"`, `"code"`, `"h3"`
  * optional `quiz` with `prompt`, `choices`, `answer` (0-based index)
* **Paths are relative to `index.html`** (e.g., `assets/text/...`, `assets/audio/...`).

---

## 6) Troubleshooting

* **Blank modules list:** Open DevTools → Network; ensure `modules/index.json` loads. Trailing commas or invalid JSON will break parsing.
* **Links work but audio 404s:** Verify exact filenames and case; confirm files live under `assets/audio/...`.
* **Nothing loads when double-clicking `index.html`:** Run a local server (Step 1). `file://` origins are often restricted by the browser’s same-origin policy / CORS.
* **SVG not visible with external `src`:** Either run `hydrateSvg()` after rendering, or change `renderSvg` to output `<img src="...">`.

---

## Quick “all-in-one” commands

**Start server (Python):**

```bash
cd /path/to/offline_learning_site
python3 -m http.server 8080
# open http://localhost:8080
```

**Install audio toolchain and convert a clip:**

```bash
# After installing FFmpeg
ffmpeg -i m_mat.wav -ac 1 -ar 22050 -c:a libvorbis -q:a 3 m_mat.ogg
```

**Install pydub (optional):**

```bash
pip install pydub
```

**Install Node (optional) and serve:**

```bash
# after installing Node (LTS)
cd /path/to/offline_learning_site
npx http-server -p 8080
```

---

## References (APA)

* Inkscape Project. (2025). *Inkscape—Draw Freely*. [https://inkscape.org/](https://inkscape.org/)
* jiaaro. (2025). *pydub*. [https://github.com/jiaaro/pydub](https://github.com/jiaaro/pydub) & [https://www.pydub.com/](https://www.pydub.com/)
* MDN Web Docs. (2025). *Same-origin policy*; *Using fetch*; *CORS*.
  [https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
  [https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
  [https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
* Node.js Foundation. (2025). *Download and install Node.js*. [https://nodejs.org/en/download](https://nodejs.org/en/download)
* npm Documentation. (2025). *Downloading and installing Node.js and npm*. [https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)
* Python Software Foundation. (2025). *http.server — HTTP servers*. [https://docs.python.org/3/library/http.server.html](https://docs.python.org/3/library/http.server.html)
* Python Software Foundation. (2025). *Download Python*. [https://www.python.org/downloads/](https://www.python.org/downloads/)
* The FFmpeg Project. (2025). *FFmpeg*. [https://www.ffmpeg.org/](https://www.ffmpeg.org/) & [https://www.ffmpeg.org/download.html](https://www.ffmpeg.org/download.html)


