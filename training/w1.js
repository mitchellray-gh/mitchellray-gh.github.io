Widgets.cosine = (b, UI) => {
  const v = { q: [1, 1, 0], d: [1, 0, 1] };
  const row = UI.row(b);
  const mk = (who, label) => ["x", "y", "z"].forEach((ax, i) =>
    UI.slider(row, { label: `${label} ${ax}`, min: 0, max: 3, step: 0.5, value: v[who][i], fmt: x => x.toFixed(1), onInput: x => { v[who][i] = x; draw(); } }));
  mk("q", "q"); mk("d", "d");
  const svgEl = UI.svg(b, 420, 150), o = UI.out(b);
  const dot = (a, c) => a.reduce((s, x, i) => s + x * c[i], 0), norm = a => Math.sqrt(dot(a, a));
  function draw() {
    const nq = norm(v.q), nd = norm(v.d), dp = dot(v.q, v.d);
    const cos = nq && nd ? dp / (nq * nd) : 0, ang = Math.acos(Math.max(-1, Math.min(1, cos)));
    const R = 110, cx = 60, cy = 130, a2 = ang;
    svgEl.innerHTML = `<line x1="${cx}" y1="${cy}" x2="${cx + R}" y2="${cy}" stroke="#e8481c" stroke-width="3"/>
      <line x1="${cx}" y1="${cy}" x2="${cx + R * Math.cos(a2)}" y2="${cy - R * Math.sin(a2)}" stroke="#1f6f8b" stroke-width="3"/>
      <path d="M ${cx + 45} ${cy} A 45 45 0 0 0 ${cx + 45 * Math.cos(a2)} ${cy - 45 * Math.sin(a2)}" fill="none" stroke="#1a1815" stroke-width="1.5"/>
      <text x="${cx + R + 6}" y="${cy + 4}" font-size="12" fill="#e8481c" font-weight="700">q</text>
      <text x="${cx + R * Math.cos(a2) + 6}" y="${cy - R * Math.sin(a2)}" font-size="12" fill="#1f6f8b" font-weight="700">d</text>
      <text x="${cx + 55}" y="${cy - 8}" font-size="12">${(ang * 180 / Math.PI).toFixed(0)}&deg;</text>
      <rect x="250" y="40" width="150" height="14" fill="#d8d2c4"/><rect x="250" y="40" width="${150 * Math.max(0, cos)}" height="14" fill="#1f7a52"/>
      <text x="250" y="32" font-size="11">cosine similarity</text><text x="250" y="76" font-size="13" font-weight="700">${UI.f(cos, 3)}</text>
      <text x="250" y="100" font-size="10" fill="#6f685b">same direction = 1, perpendicular = 0</text>`;
    o.innerHTML = `Dot product <b>${UI.f(dp, 2)}</b> &divide; (&Vert;q&Vert; <b>${UI.f(nq, 3)}</b> &times; &Vert;d&Vert; <b>${UI.f(nd, 3)}</b>) = <span class="verdict">cos = ${UI.f(cos, 3)}</span>`;
  }
  draw();
};

Widgets.bm25 = (b, UI) => {
  const row = UI.row(b);
  const s = { f: 3, k1: 1.2, bb: 0.75, len: 1 };
  const upd = () => draw();
  UI.slider(row, { label: "Term count in source f(t,d)", min: 0, max: 20, value: 3, onInput: v => { s.f = v; upd(); } });
  UI.slider(row, { label: "k\u2081 (saturation)", min: 0.2, max: 3, step: 0.1, value: 1.2, fmt: v => v.toFixed(1), onInput: v => { s.k1 = v; upd(); } });
  UI.slider(row, { label: "b (length penalty)", min: 0, max: 1, step: 0.05, value: 0.75, fmt: v => v.toFixed(2), onInput: v => { s.bb = v; upd(); } });
  UI.slider(row, { label: "Source length vs. average", min: 0.25, max: 4, step: 0.25, value: 1, fmt: v => v + "\u00D7", onInput: v => { s.len = v; upd(); } });
  const svg = UI.svg(b, 420, 170), o = UI.out(b);
  const g = (f, k1, bb, len) => f * (k1 + 1) / (f + k1 * (1 - bb + bb * len));
  function draw() {
    const maxv = s.k1 + 1; let pts = "";
    for (let f = 0; f <= 20; f++) pts += `${40 + f * 17},${140 - 110 * g(f, s.k1, s.bb, s.len) / 4} `;
    const cur = g(s.f, s.k1, s.bb, s.len);
    svg.innerHTML = `<line x1="40" y1="140" x2="390" y2="140" stroke="#1a1815"/><line x1="40" y1="20" x2="40" y2="140" stroke="#1a1815"/>
      <polyline points="${pts}" fill="none" stroke="#e8481c" stroke-width="2.5"/>
      <line x1="40" y1="${140 - 110 * maxv / 4}" x2="390" y2="${140 - 110 * maxv / 4}" stroke="#1f6f8b" stroke-dasharray="4 3"/>
      <text x="300" y="${135 - 110 * maxv / 4}" font-size="10" fill="#1f6f8b">ceiling k\u2081+1 = ${UI.f(maxv, 1)}</text>
      <circle cx="${40 + s.f * 17}" cy="${140 - 110 * cur / 4}" r="5" fill="#1a1815"/>
      <text x="215" y="162" font-size="11" text-anchor="middle">times the word appears</text>`;
    o.innerHTML = `Term score multiplier <b>${UI.f(cur, 2)}</b> (before multiplying by IDF). Repeating a word keeps helping, but less and less; a longer-than-average source is penalised.`;
  }
  draw();
};

Widgets.hybrid = (b, UI) => {
  const src = [
    { n: "d\u2081 orders_fact", cos: .72, bm: .40, cov: 2 / 3, p: .3 },
    { n: "d\u2082 regional_revenue_summary (certified)", cos: .85, bm: .90, cov: 1, p: .5 },
    { n: "d\u2083 employee_directory", cos: .20, bm: .05, cov: 1 / 3, p: .2 }];
  const w = { a: .5, bt: .2 };
  const row = UI.row(b);
  const sa = UI.slider(row, { label: "\u03B1 semantic weight", min: 0, max: 1, step: .05, value: .5, fmt: v => v.toFixed(2), onInput: v => { w.a = v; if (w.a + w.bt > 1) { w.bt = 1 - w.a; sb.set(w.bt); } draw(); } });
  const sb = UI.slider(row, { label: "\u03B2 keyword (BM25) weight", min: 0, max: 1, step: .05, value: .2, fmt: v => v.toFixed(2), onInput: v => { w.bt = Math.min(v, 1 - w.a); sb.set(w.bt); draw(); } });
  const g = UI.el(`<div class="ctl"><label>\u03B3 concept coverage (the remainder)<output id="gv"></output></label></div>`); row.appendChild(g);
  const row2 = UI.row(b); const ps = [];
  src.forEach((s, i) => ps.push(UI.slider(row2, { label: "Trust prior for d" + (i + 1), min: 0.05, max: 1, step: .05, value: s.p, fmt: v => v.toFixed(2), onInput: v => { s.p = v; draw(); } })));
  UI.buttons(b, [["PDF example", () => { [.3, .5, .2].forEach((v, i) => { src[i].p = v; ps[i].set(v); }); draw(); }],
    ["Check #4: raise d\u2081, lower d\u2082", () => { [.6, .2, .2].forEach((v, i) => { src[i].p = v; ps[i].set(v); }); draw(); }]]);
  const rel = UI.el(`<div></div>`), post = UI.el(`<div></div>`), o = UI.out(b);
  b.insertBefore(el2("Step 2: relevance rel = \u03B1\u00B7cos + \u03B2\u00B7BM25 + \u03B3\u00B7coverage"), o); b.insertBefore(rel, o);
  b.insertBefore(el2("Step 3: posterior \u221D rel \u00D7 prior (normalised)"), o); b.insertBefore(post, o);
  function el2(t) { return UI.el(`<h4 style="margin:.8rem 0 .2rem">${t}</h4>`); }
  function draw() {
    const gam = Math.max(0, 1 - w.a - w.bt); g.querySelector("output").textContent = " " + UI.f(gam, 2);
    const r = src.map(s => w.a * s.cos + w.bt * s.bm + gam * s.cov), pr = src.map((s, i) => r[i] * s.p), z = pr.reduce((a, c) => a + c, 0);
    UI.bars(rel, src.map((s, i) => ({ label: s.n, value: r[i], display: UI.f(r[i], 3) })));
    UI.bars(post, src.map((s, i) => ({ label: s.n, value: pr[i] / z, display: UI.f(pr[i] / z, 2) })));
    const top = pr.indexOf(Math.max(...pr)), byRel = r.indexOf(Math.max(...r));
    o.className = "out " + (top === 1 ? "good" : "mid");
    o.innerHTML = `Winner: <b>${src[top].n}</b>. Normaliser = ${UI.f(z, 4)}. ` + (top !== byRel ? "<b>The prior overrode relevance</b>: that is why priors need careful calibration." : "Relevance and trust agree.");
  }
  draw();
};

Widgets.prior = (b, UI) => {
  const s = { cur: 1, use: 100, stale: 0, dep: 0 };
  const row = UI.row(b);
  UI.select(row, { label: "Curated / certified?", options: [[1, "Yes (certified)"], [0, "No"]], value: 1, onChange: v => { s.cur = +v; draw(); } });
  UI.slider(row, { label: "Usage count", min: 0, max: 4, step: .05, value: 2, fmt: v => Math.round(Math.pow(10, v) - 1).toLocaleString(), onInput: v => { s.use = Math.pow(10, v) - 1; draw(); } });
  UI.slider(row, { label: "Staleness (0 fresh \u2192 1 very old)", min: 0, max: 1, step: .05, value: 0, fmt: v => v.toFixed(2), onInput: v => { s.stale = v; draw(); } });
  UI.select(row, { label: "Deprecated?", options: [[0, "No"], [1, "Yes"]], value: 0, onChange: v => { s.dep = +v; draw(); } });
  const bars = UI.el("<div></div>"), o = UI.out(b); b.insertBefore(bars, o);
  const svg = UI.svg(b, 420, 130);
  function draw() {
    const w = [1.5, .5, 1, 3];
    const t = [w[0] * s.cur, w[1] * Math.log(1 + s.use), -w[2] * s.stale, -w[3] * s.dep], z = t.reduce((a, c) => a + c, 0);
    UI.bars(bars, [["curated (+)", t[0]], ["log(1+usage) (+)", t[1]], ["staleness (\u2212)", -t[2]], ["deprecated (\u2212\u2212)", -t[3]]].map(([l, v], i) => ({ label: l, value: Math.abs(v), display: (i > 1 ? "\u2212" : "+") + UI.f(Math.abs(v), 2), color: i > 1 ? "#c2185b" : "#1f7a52" })), { max: 4, top: false });
    let pts = ""; for (let u = 0; u <= 200; u += 4) pts += `${30 + u * 1.75},${110 - 80 * Math.log(1 + u * 50) / Math.log(10001)} `;
    const cx = 30 + 1.75 * Math.min(200, 200 * Math.log10(1 + s.use) / 4);
    svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="#1f6f8b" stroke-width="2.5"/><line x1="30" y1="110" x2="390" y2="110" stroke="#1a1815"/>
      <circle cx="${cx}" cy="${110 - 80 * Math.log(1 + s.use) / Math.log(10001)}" r="5" fill="#e8481c"/>
      <text x="210" y="126" font-size="11" text-anchor="middle">usage (log scale): the first 100 uses matter far more than the next 10,000</text>`;
    o.innerHTML = `Exponent sum = <b>${UI.f(z, 2)}</b> &rarr; unnormalised prior = e<sup>${UI.f(z, 2)}</sup> = <b>${UI.f(Math.exp(z), 2)}</b> (always positive). Weights are illustrative.`;
  }
  draw();
};

Widgets.setcover = (b, UI) => {
  const src = [
    { n: "d\u2081 orders_fact", c: ["Revenue", "Month"], p: .28 },
    { n: "d\u2082 regional_revenue_summary", c: ["Revenue", "Month", "Region"], p: .66 },
    { n: "d\u2083 employee_directory", c: ["Region"], p: .06 },
    { n: "d\u2084 product_dim", c: ["ProductCategory"], p: .5 }];
  const need = ["Revenue", "Month", "Region", "ProductCategory"];
  let U, S, log;
  const reset = () => { U = new Set(need); S = []; log = []; draw(); };
  UI.buttons(b, [["Run next greedy step", step], ["Reset", reset]]);
  const view = UI.el("<div></div>"); b.appendChild(view); const o = UI.out(b);
  function step() {
    if (!U.size) return;
    const sc = src.map(s => ({ s, v: s.c.filter(x => U.has(x)).length * s.p })).filter(x => !S.includes(x.s));
    const best = sc.reduce((a, c) => c.v > a.v ? c : a); if (best.v === 0) return;
    log.push(`Pick <b>${best.s.n}</b>: new concepts \u00D7 P(d|Q) = ${UI.f(best.v, 2)} (best of ${sc.map(x => UI.f(x.v, 2)).join(", ")})`);
    S.push(best.s); best.s.c.forEach(x => U.delete(x)); draw();
  }
  function draw() {
    view.innerHTML = `<p><b>Still needed U:</b> ${need.map(c => `<span class="chip ${U.has(c) ? "on" : "done"}">${c}</span>`).join("")}</p>` +
      `<table><tr><th>Source</th><th>Concepts covered</th><th class="num">P(d|Q)</th><th>Chosen?</th></tr>${src.map(s => `<tr class="${S.includes(s) ? "win" : ""}"><td>${s.n}</td><td>${s.c.map(c => `<span class="chip">${c}</span>`).join("")}</td><td class="num">${s.p}</td><td>${S.includes(s) ? "\u2713 in S*" : ""}</td></tr>`).join("")}</table>`;
    o.innerHTML = log.length ? log.map((l, i) => `${i + 1}. ${l}`).join("<br>") + (U.size ? "" : "<br><b>Done: U is empty. S* = {" + S.map(s => s.n.split(" ")[0]).join(", ") + "}</b>") : "Click <b>Run next greedy step</b>. (P for d\u2084 is illustrative.)";
  }
  reset();
};
