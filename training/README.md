# Training section

Hidden behind the "Training" button in the site footer. Static files only (GitHub Pages).

## Add a module (N)
1. Copy `_template.html` to `mN.html`; set `data-module="N"`.
2. Add an entry to `modules.js` (`id`, `title`, `subtitle`, `pages`, `objectives`). Optionally drop the PDF in `modules/module-N.pdf`.
3. Widgets: add `<div class="widget" data-w="name" data-title="...">` and register `Widgets.name = (body, UI) => {...}` in `wN.js` (see `w1.js`).
4. After every `<div class="formula">`, add a `<dl class="vars">` with one `<div><dt>symbol</dt><dd>plain meaning <span class="ex">example</span></dd></div>` per symbol.
5. Glossary, search, cheat sheets and the final quiz read the lesson files at runtime, so they update automatically (formulas, `.vars` blocks and `.check` quizzes are what they harvest).

## Gotchas
- Use ASCII HTML entities (`&Sigma;`, `&approx;`) for symbols; never pipe non-ASCII text through PowerShell.
- Preview via `python -m http.server` from the repo root (file:// breaks the fetch-based pages).
- Keep SVG text at font-size 12+ in viewBox units, dark on light.
