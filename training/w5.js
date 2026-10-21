/* Module 5 widgets */
const num = (x, d = 0) => (isFinite(x) ? +x : d);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const pct = x => (100 * x).toFixed(1) + "%";

/* ---------- 5.2 greedy vs optimal matching ---------- */
Widgets.matching = (b, UI) => {
  const presets = {
    rr: { n: 2, rows: ["Revenue", "Refund"], cols: ["amount", "sales_total"], W: [[.9, .8], [.85, .1]] },
    q1: { n: 2, rows: ["A", "B"], cols: ["x", "y"], W: [[.6, .5], [.55, .2]] },
    three: { n: 3, rows: ["Revenue", "Refund", "Date"], cols: ["amount", "sales_total", "order_date"], W: [[.9, .8, .1], [.85, .1, .1], [.1, .1, .9]] }
  };
  let P = presets.rr, W = P.W.map(r => r.slice());
  const bt = UI.buttons(b, [
    ["Revenue / Refund (5.2)", () => load("rr"), 1],
    ["Quiz question 1", () => load("q1"), 1],
    ["3\u00D73 (illustrative)", () => load("three"), 1]]);
  bt.firstChild.classList.add("on");
  const holder = UI.el("<div></div>"); b.appendChild(holder);
  const o = UI.out(b);
  const perms = n => n === 1 ? [[0]] : perms(n - 1).flatMap(p => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]));
  function load(k) { P = presets[k]; W = P.W.map(r => r.slice()); build(); }
  function build() {
    let h = `<table class="mt"><tr><th></th>${P.cols.map(c => `<th>${c}</th>`).join("")}</tr>`;
    P.rows.forEach((r, i) => { h += `<tr><td><b>${r}</b></td>${P.cols.map((c, j) => `<td data-c="${i}-${j}"><input type="number" step="0.05" min="-9" max="9" value="${W[i][j]}" aria-label="Weight ${r} to ${c}" data-i="${i}" data-j="${j}"></td>`).join("")}</tr>`; });
    holder.innerHTML = h + "</table>";
    holder.querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => { W[+inp.dataset.i][+inp.dataset.j] = num(parseFloat(inp.value)); draw(); }));
    draw();
  }
  function draw() {
    const n = P.n;
    const used = { r: new Set(), c: new Set() }, g = [];
    for (let t = 0; t < n; t++) {
      let best = null;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!used.r.has(i) && !used.c.has(j) && (!best || W[i][j] > W[best[0]][best[1]])) best = [i, j];
      used.r.add(best[0]); used.c.add(best[1]); g.push(best);
    }
    let opt = null, ov = -Infinity;
    perms(n).forEach(p => { const v = p.reduce((s, j, i) => s + W[i][j], 0); if (v > ov + 1e-12) { ov = v; opt = p; } });
    const gv = g.reduce((s, [i, j]) => s + W[i][j], 0);
    holder.querySelectorAll("td").forEach(td => td.classList.remove("opt", "grd"));
    opt.forEach((j, i) => holder.querySelector(`td[data-c="${i}-${j}"]`).classList.add("opt"));
    g.forEach(([i, j]) => holder.querySelector(`td[data-c="${i}-${j}"]`).classList.add("grd"));
    const fmtM = m => m.map(([i, j]) => `${P.rows[i]} \u2192 ${P.cols[j]} (${UI.f(W[i][j], 2)})`).join(", ");
    const gap = ov - gv;
    o.className = "out " + (gap > 1e-9 ? "bad" : "good");
    o.innerHTML = `<b>Greedy</b> (dashed orange): ${fmtM(g)} &rarr; total <b>${UI.f(gv, 2)}</b><br><b>Optimal</b> (green, tries all ${n === 2 ? 2 : 6} assignments): ${fmtM(opt.map((j, i) => [i, j]))} &rarr; total <b>${UI.f(ov, 2)}</b><br><span class="verdict">${gap > 1e-9 ? `Greedy loses ${UI.f(gap, 2)}: the locally best pick blocked a better overall pairing.` : "Greedy happens to find the optimum here. Try making a generic column score high for two slots."}</span>`;
  }
  build();
};

/* ---------- 5.3 value lookup ---------- */
Widgets.lookup = (b, UI) => {
  const cols = {
    state: ["California", "Texas", "New York", "Washington", "Florida", "Nevada"],
    region: ["EMEA", "APAC", "AMER", "LATAM"],
    customer_tier: ["Gold", "Silver", "Bronze"]
  };
  const st = { col: "state", v: "Calfornia", tau: .85 };
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const lev = (a, c) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(c.length).fill(0)]);
    for (let j = 1; j <= c.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= c.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === c[j - 1] ? 0 : 1));
    return d[a.length][c.length];
  };
  const row = UI.row(b);
  const sel = UI.select(row, { label: "Field being searched", options: Object.keys(cols).map(k => [k, k]), value: "state", onChange: v => { st.col = v; draw(); } });
  const fv = UI.field(row, { label: "Literal value from the question", value: st.v, onInput: v => { st.v = v; draw(); } });
  const sl = UI.slider(row, { label: "Threshold \u03C4_v", min: 0.5, max: 1, step: 0.01, value: .85, fmt: v => v.toFixed(2), onInput: v => { st.tau = v; draw(); } });
  UI.buttons(b, [
    ["EMEA", () => set("region", "EMEA")], ["\u201Cemea \u201D", () => set("region", "emea ")],
    ["Calfornia", () => set("state", "Calfornia", .85)], ["Gold in the wrong field", () => set("state", "Gold")],
    ["Nevda (tight \u03C4)", () => set("state", "Nevda", .9)]]);
  const bx = UI.el("<div></div>"); b.appendChild(bx);
  const o = UI.out(b);
  function set(c, v, t) { st.col = c; st.v = v; sel.set(c); fv.set(v); if (t) { st.tau = t; sl.set(t); } draw(); }
  function draw() {
    const V = cols[st.col], v = st.v;
    const sims = V.map(u => { const L = Math.max(norm(v).length, norm(u).length); return { u, s: L ? 1 - lev(norm(v), norm(u)) / L : 0, d: lev(norm(v), norm(u)), L }; });
    const best = sims.reduce((a, c) => (c.s > a.s ? c : a), sims[0]);
    UI.bars(bx, sims.map(x => ({ label: x.u, value: x.s, display: UI.f(x.s, 2) + (x.s >= st.tau ? " \u2713" : "") })), { max: 1 });
    let level, cls, msg;
    if (V.includes(v)) { level = "Exact"; cls = "good"; msg = `\u201C${UI.esc(v)}\u201D is in ${st.col}. Use it as is.`; }
    else if (V.some(u => norm(u) === norm(v)) && norm(v)) { const m = V.find(u => norm(u) === norm(v)); level = "Normalized"; cls = "good"; msg = `Ignoring case, spaces and punctuation it matches \u201C${m}\u201D.`; }
    else if (best.s >= st.tau) { level = "Fuzzy"; cls = "mid"; msg = `Closest is \u201C${best.u}\u201D: ${best.d} edit(s), longer word ${best.L} letters, sim = 1 \u2212 ${best.d}/${best.L} = ${UI.f(best.s, 2)} \u2265 ${UI.f(st.tau, 2)}. Accept, and mention the correction.`; }
    else { level = "No match"; cls = "bad"; msg = `Best sim is ${UI.f(best.s, 2)} (\u201C${best.u}\u201D), below \u03C4 = ${UI.f(st.tau, 2)}. The filter would return zero rows: try another field (see Bayes below) or ask.`; }
    o.className = "out " + cls;
    o.innerHTML = `<span class="verdict">${level}.</span> ${msg}`;
  }
  draw();
};

/* ---------- 5.3 which column ---------- */
Widgets.whichcol = (b, UI) => {
  const A = { n: "customer_tier", k: 1200, N: 10000, p: .8 }, B = { n: "product_color", k: 30, N: 50000, p: .1 };
  const row = UI.row(b);
  const mk = (X, d) => {
    const c = UI.el(`<div class="ctl"><b>${X.n}</b></div>`); row.appendChild(c);
    UI.field(c, { label: "Rows containing the value", type: "number", value: X.k, attrs: 'min="0"', onInput: v => { X.k = Math.max(0, num(parseFloat(v))); draw(); } });
    UI.field(c, { label: "Total rows", type: "number", value: X.N, attrs: 'min="1"', onInput: v => { X.N = Math.max(1, num(parseFloat(v), 1)); draw(); } });
    UI.slider(c, { label: "P(f | customer slot)", min: 0, max: 1, step: .01, value: X.p, fmt: v => v.toFixed(2), onInput: v => { X.p = v; draw(); } });
  };
  mk(A); mk(B);
  UI.buttons(b, [["Reset to the Gold example", () => { Object.assign(A, { k: 1200, N: 10000, p: .8 }); Object.assign(B, { k: 30, N: 50000, p: .1 }); b.innerHTML = ""; Widgets.whichcol(b, UI); }]]);
  const o = UI.out(b), bx = UI.el("<div></div>"); o.after(bx);
  function draw() {
    const pa = clamp(A.k / A.N, 0, 1) * A.p, pb = clamp(B.k / B.N, 0, 1) * B.p, tot = pa + pb;
    UI.bars(bx, [{ label: A.n, value: tot ? pa / tot : 0, display: pct(tot ? pa / tot : 0) }, { label: B.n, value: tot ? pb / tot : 0, display: pct(tot ? pb / tot : 0) }], { max: 1 });
    const ratio = pb > 0 ? pa / pb : (pa > 0 ? Infinity : 0);
    o.innerHTML = `${A.n}: P(v|f) = ${A.k}/${A.N} = ${UI.f(A.k / A.N, 4)}; \u00D7 ${UI.f(A.p, 2)} = <b>${pa.toPrecision(3)}</b><br>${B.n}: P(v|f) = ${B.k}/${B.N} = ${UI.f(B.k / B.N, 4)}; \u00D7 ${UI.f(B.p, 2)} = <b>${pb.toPrecision(3)}</b><br><span class="verdict">${pa === 0 && pb === 0 ? "Neither field fits: the value probably does not exist." : (pb > 0 ? `Ratio ${A.n} : ${B.n} = ${(pa / pb).toLocaleString(undefined, { maximumFractionDigits: 1 })} : 1` : `${A.n} is the only possibility`)}</span>`;
    o.className = "out " + (tot === 0 ? "bad" : "good");
  }
  draw();
};

/* ---------- 5.4 confidence chain ---------- */
Widgets.chain = (b, UI) => {
  const S = [["Intent", .9], ["Source choice", .66], ["Join path", .74], ["Entity", .69], ["Field matching", .85]];
  const p = S.map(s => s[1]), clar = S.map(() => false);
  const sw = UI.el(`<div class="stg" role="group" aria-label="Click a stage to clarify it"></div>`); b.appendChild(sw);
  const row = UI.row(b);
  S.forEach((s, i) => UI.slider(row, { label: s[0] + " p", min: 0, max: 1, step: .01, value: s[1], fmt: v => v.toFixed(2), onInput: v => { p[i] = v; draw(); } }));
  const btns = S.map((s, i) => { const x = UI.el(`<button type="button" aria-pressed="false">Clarify: ${s[0]}</button>`); x.onclick = () => { clar[i] = !clar[i]; draw(); }; sw.appendChild(x); return x; });
  const reset = UI.el(`<button type="button">Reset</button>`); reset.onclick = () => { b.innerHTML = ""; Widgets.chain(b, UI); }; sw.appendChild(reset);
  const o = UI.out(b), bx = UI.el("<div></div>"); b.appendChild(bx);
  const eff = i => (clar[i] ? 1 : p[i]);
  function draw() {
    btns.forEach((x, i) => { x.classList.toggle("on", clar[i]); x.setAttribute("aria-pressed", clar[i]); });
    const prod = S.reduce((a, _, i) => a * eff(i), 1), base = S.reduce((a, _, i) => a * p[i], 1);
    const geo = Math.pow(prod, 1 / S.length);
    const gain = S.map((s, i) => ({ i, s: s[0], v: S.reduce((a, _, k) => a * (k === i ? 1 : eff(k)), 1) }));
    UI.bars(bx, gain.map(g => ({ label: (clar[g.i] ? "\u2713 " : "") + g.s, value: g.v, display: UI.f(g.v, 3), color: clar[g.i] ? "var(--green)" : "" })), { max: 1, top: false });
    const open = gain.filter(g => !clar[g.i]);
    let rec = "All stages are settled.";
    if (open.length) { const w = open.reduce((a, c) => (eff(c.i) < eff(a.i) ? c : a)); rec = `Weakest unsettled link: <b>${w.s}</b> (p = ${UI.f(p[w.i], 2)}). Clarifying it lifts Conf from ${UI.f(prod, 3)} to <b>${UI.f(w.v, 3)}</b>.`; }
    o.className = "out " + (prod < .4 ? "bad" : prod < .7 ? "mid" : "good");
    o.innerHTML = `Conf = \u03A0 p<sub>i</sub> = <span class="big">${UI.f(prod, 3)}</span> <small>(unclarified: ${UI.f(base, 3)})</small><br>Geometric mean (typical stage quality) = Conf<sup>1/5</sup> = <b>${UI.f(geo, 2)}</b><br>${rec}<br><small>Bars show the Conf you would get by clarifying each stage (click a button to set its p to 1).</small>`;
  }
  draw();
};

/* ---------- 5.5 consistency ---------- */
Widgets.consistency = (b, UI) => {
  const s = { A: 1.05, R: 1, eta: 2 }, row = UI.row(b);
  UI.slider(row, { label: "Answer A ($M)", min: 0, max: 3, step: .05, value: 1.05, fmt: v => v.toFixed(2), onInput: v => { s.A = v; draw(); } });
  UI.slider(row, { label: "Reference A_ref ($M)", min: .1, max: 3, step: .05, value: 1, fmt: v => v.toFixed(2), onInput: v => { s.R = v; draw(); } });
  UI.slider(row, { label: "\u03B7 (strictness)", min: 0, max: 6, step: .25, value: 2, fmt: v => v.toFixed(2), onInput: v => { s.eta = v; draw(); } });
  const sv = UI.svg(b, 420, 150), o = UI.out(b);
  function draw() {
    const gap = Math.abs(s.A - s.R) / Math.abs(s.R), c = Math.exp(-s.eta * gap);
    let pts = ""; for (let i = 0; i <= 100; i++) { const g = i / 100; pts += `${40 + 350 * g},${130 - 100 * Math.exp(-s.eta * g)} `; }
    const gx = 40 + 350 * Math.min(gap, 1);
    sv.innerHTML = `<line x1="40" y1="130" x2="390" y2="130" stroke="#1a1815"/><line x1="40" y1="30" x2="40" y2="130" stroke="#1a1815"/>
      <polyline points="${pts}" fill="none" stroke="#e8481c" stroke-width="2.5"/><circle cx="${gx}" cy="${130 - 100 * c}" r="5" fill="#1a1815"/>
      <text x="215" y="146" font-size="11" text-anchor="middle">relative gap (0 to 100%)</text><text x="12" y="34" font-size="10">1.0</text>`;
    o.className = "out " + (c > .8 ? "good" : c > .5 ? "mid" : "bad");
    o.innerHTML = `Relative gap = |${UI.f(s.A, 2)} \u2212 ${UI.f(s.R, 2)}| / ${UI.f(s.R, 2)} = <b>${pct(gap)}</b><br>Consistency = exp(\u2212${UI.f(s.eta, 2)} \u00D7 ${UI.f(gap, 3)}) = <span class="big">${UI.f(c, 3)}</span>`;
  }
  draw();
};

/* ---------- 5.5 robust outlier ---------- */
Widgets.outlier = (b, UI) => {
  const s = { med: 1, mad: .08, x: 3.1 }, row = UI.row(b);
  UI.slider(row, { label: "Historical median ($M)", min: .2, max: 3, step: .05, value: 1, fmt: v => v.toFixed(2), onInput: v => { s.med = v; draw(); } });
  UI.slider(row, { label: "MAD ($M)", min: .01, max: .5, step: .01, value: .08, fmt: v => v.toFixed(2), onInput: v => { s.mad = v; draw(); } });
  UI.slider(row, { label: "New result x ($M)", min: 0, max: 5, step: .05, value: 3.1, fmt: v => v.toFixed(2), onInput: v => { s.x = v; draw(); } });
  const o = UI.out(b);
  function draw() {
    const mad = Math.max(s.mad, 1e-9), z = .6745 * (s.x - s.med) / mad, flag = Math.abs(z) > 3.5, ratio = s.med > 0 ? s.x / s.med : 0;
    o.className = "out " + (flag ? "bad" : "good");
    o.innerHTML = `modified z = 0.6745 \u00D7 (${UI.f(s.x, 2)} \u2212 ${UI.f(s.med, 2)}) / ${UI.f(mad, 2)} = 0.6745 \u00D7 ${UI.f((s.x - s.med) / mad, 2)} = <span class="big">${UI.f(z, 1)}</span><br><span class="verdict">${flag ? "FLAG: |z| > 3.5." : "Within the normal range (|z| \u2264 3.5)."}</span> The result is ${UI.f(ratio, 1)}\u00D7 the median.${flag && ratio > 2.5 && ratio < 3.6 ? " About 3\u00D7 normal is the classic signature of a fan-out join." : ""}`;
  }
  draw();
};

/* ---------- 5.5 red flag ---------- */
Widgets.redflag = (b, UI) => {
  const s = { pc: .8, fc: .02, fw: .5 }, row = UI.row(b);
  UI.slider(row, { label: "Prior P(correct)", min: 0, max: 1, step: .01, value: .8, fmt: v => v.toFixed(2), onInput: v => { s.pc = v; draw(); } });
  UI.slider(row, { label: "P(flag | correct)", min: 0, max: 1, step: .01, value: .02, fmt: v => v.toFixed(2), onInput: v => { s.fc = v; draw(); } });
  UI.slider(row, { label: "P(flag | wrong)", min: 0, max: 1, step: .01, value: .5, fmt: v => v.toFixed(2), onInput: v => { s.fw = v; draw(); } });
  const o = UI.out(b), bx = UI.el("<div></div>"); b.appendChild(bx);
  function draw() {
    const a = s.fc * s.pc, w = s.fw * (1 - s.pc), pf = a + w, post = pf > 0 ? a / pf : s.pc;
    UI.bars(bx, [{ label: "Before flag", value: s.pc, display: pct(s.pc) }, { label: "After flag", value: post, display: pct(post), color: "var(--rose)" }], { max: 1, top: false });
    o.className = "out " + (post < .5 ? "bad" : "good");
    o.innerHTML = `P(flag) = ${UI.f(s.fc, 2)} \u00D7 ${UI.f(s.pc, 2)} + ${UI.f(s.fw, 2)} \u00D7 ${UI.f(1 - s.pc, 2)} = ${UI.f(a, 3)} + ${UI.f(w, 3)} = <b>${UI.f(pf, 3)}</b><br>P(correct | flag) = ${UI.f(a, 3)} / ${UI.f(pf, 3)} = <span class="big">${UI.f(post, 2)}</span>${pf > 0 ? "" : "<br>The flag can never fire under these numbers, so nothing is learned."}<br>${post < .5 ? "Re-examine the plan; do not report the number." : "The flag barely moves confidence."}`;
  }
  draw();
};

/* ---------- 5.6 two-stage retrieval ---------- */
Widgets.retrieval = (b, UI) => {
  const s = { K: 50, k0: 18, t: .95 }, row = UI.row(b);
  UI.slider(row, { label: "Stage 1 cut-off K", min: 1, max: 200, value: 50, onInput: v => { s.K = v; draw(); } });
  UI.slider(row, { label: "Difficulty (illustrative, higher = relevant items rank lower)", min: 5, max: 60, value: 18, onInput: v => { s.k0 = v; draw(); } });
  UI.slider(row, { label: "Recall target", min: .8, max: .99, step: .01, value: .95, fmt: v => pct(v), onInput: v => { s.t = v; draw(); } });
  const sv = UI.svg(b, 440, 170), o = UI.out(b);
  const rec = K => 1 - Math.exp(-K / s.k0);
  function draw() {
    let pts = ""; for (let k = 0; k <= 200; k += 4) pts += `${40 + 380 * k / 200},${140 - 110 * rec(k)} `;
    const r = rec(s.K), need = Math.ceil(-s.k0 * Math.log(1 - s.t));
    sv.innerHTML = `<line x1="40" y1="140" x2="420" y2="140" stroke="#1a1815"/><line x1="40" y1="30" x2="40" y2="140" stroke="#1a1815"/>
      <line x1="40" y1="${140 - 110 * s.t}" x2="420" y2="${140 - 110 * s.t}" stroke="#1f6f8b" stroke-dasharray="4 3"/>
      <polyline points="${pts}" fill="none" stroke="#e8481c" stroke-width="2.5"/>
      <circle cx="${40 + 380 * s.K / 200}" cy="${140 - 110 * r}" r="5" fill="#1a1815"/>
      <text x="230" y="160" font-size="11" text-anchor="middle">K (items passed to Stage 2)</text><text x="44" y="24" font-size="10">Recall@K</text>`;
    o.className = "out " + (r >= s.t ? "good" : "mid");
    o.innerHTML = `Recall@${s.K} \u2248 <b>${pct(r)}</b> &middot; Stage 2 work \u2248 ${UI.f(s.K / 50, 1)}\u00D7 the K = 50 baseline<br>Smallest K for ${pct(s.t)} recall: <b>${need}</b>. ${r >= s.t ? "Target met." : `Below target: about ${pct(1 - r)} of relevant items are lost for good.`}<br><small>Illustrative model, Recall@K = 1 \u2212 e<sup>\u2212K/difficulty</sup>; real curves come from measuring your own data.</small>`;
  }
  draw();
};

/* ---------- 5.7 pairwise loss ---------- */
Widgets.pairloss = (b, UI) => {
  const s = { p: 2, m: 1 }, row = UI.row(b);
  const sp = UI.slider(row, { label: "r(d\u207A) score of the more relevant item", min: -3, max: 4, step: .1, value: 2, fmt: v => v.toFixed(1), onInput: v => { s.p = v; draw(); } });
  const sm = UI.slider(row, { label: "r(d\u207B) score of the less relevant item", min: -3, max: 4, step: .1, value: 1, fmt: v => v.toFixed(1), onInput: v => { s.m = v; draw(); } });
  const set = (p, m) => { s.p = p; s.m = m; sp.set(p); sm.set(m); draw(); };
  UI.buttons(b, [["Correct (2, 1)", () => set(2, 1)], ["Tied (1, 1)", () => set(1, 1)], ["Wrong order (1, 2)", () => set(1, 2)]]);
  const sv = UI.svg(b, 420, 170), o = UI.out(b);
  const L = g => Math.log1p(Math.exp(-g));
  function draw() {
    const gap = s.p - s.m; let pts = "";
    for (let g = -4; g <= 4.001; g += .2) pts += `${40 + 350 * (g + 4) / 8},${140 - 100 * L(g) / 4.1} `;
    const gx = 40 + 350 * (clamp(gap, -4, 4) + 4) / 8;
    sv.innerHTML = `<line x1="40" y1="140" x2="390" y2="140" stroke="#1a1815"/><line x1="215" y1="30" x2="215" y2="140" stroke="#d8d2c4"/>
      <polyline points="${pts}" fill="none" stroke="#e8481c" stroke-width="2.5"/><circle cx="${gx}" cy="${140 - 100 * L(clamp(gap, -4, 4)) / 4.1}" r="5" fill="#1a1815"/>
      <text x="215" y="160" font-size="11" text-anchor="middle">gap r(d\u207A) \u2212 r(d\u207B)  (\u22124 \u2026 +4)</text><text x="44" y="30" font-size="10">loss</text>`;
    o.className = "out " + (gap > 0 ? "good" : gap === 0 ? "mid" : "bad");
    o.innerHTML = `Gap = ${UI.f(s.p, 1)} \u2212 ${UI.f(s.m, 1)} = <b>${UI.f(gap, 1)}</b> &rarr; loss = ln(1 + e<sup>\u2212(${UI.f(gap, 1)})</sup>) = <span class="big">${UI.f(L(gap), 3)}</span><br>${gap > 0 ? "Correct order: loss shrinks smoothly toward 0 as the gap grows." : gap === 0 ? "Tied: loss is ln 2 \u2248 0.693." : "Wrong order: loss grows roughly linearly with the size of the mistake."}`;
  }
  draw();
};

/* ---------- 5.8 MMR ---------- */
Widgets.mmr = (b, UI) => {
  const D = [{ n: "d\u2081 certified summary table", r: .9, s: 0 }, { n: "d\u2082 copy of d\u2081 in another workspace", r: .88, s: .95 }, { n: "d\u2083 detailed transaction table", r: .7, s: .2 }];
  let lam = .7;
  const sl = UI.slider(b, { label: "\u03BB (1 = pure relevance, 0 = pure novelty)", min: 0, max: 1, step: .01, value: .7, fmt: v => v.toFixed(2), onInput: v => { lam = v; draw(); } });
  UI.buttons(b, [["\u03BB = 0.7 (worked example)", () => { lam = .7; sl.set(.7); draw(); }], ["\u03BB = 1", () => { lam = 1; sl.set(1); draw(); }], ["\u03BB = 0.5", () => { lam = .5; sl.set(.5); draw(); }]]);
  const bx = UI.el("<div></div>"); b.appendChild(bx);
  const o = UI.out(b);
  function draw() {
    const sc = D.slice(1).map(d => ({ ...d, m: lam * d.r - (1 - lam) * d.s }));
    UI.bars(bx, sc.map(d => ({ label: d.n, value: Math.max(0, d.m), display: UI.f(d.m, 3) })), { max: 1 });
    const win = sc[0].m >= sc[1].m ? sc[0] : sc[1], lose = win === sc[0] ? sc[1] : sc[0];
    o.className = "out " + (win === sc[1] ? "good" : "mid");
    o.innerHTML = `Pick 1: <b>${D[0].n}</b> (most relevant).<br>Pick 2: ${sc.map(d => `MMR(${d.n.slice(0, 2)}) = ${UI.f(lam, 2)} \u00D7 ${UI.f(d.r, 2)} \u2212 ${UI.f(1 - lam, 2)} \u00D7 ${UI.f(d.s, 2)} = <b>${UI.f(d.m, 3)}</b>`).join("; ")}<br><span class="verdict">Order: ${D[0].n.slice(0, 2)}, ${win.n.slice(0, 2)}, ${lose.n.slice(0, 2)}.</span> ${win === sc[1] ? "The detail table beats the near-duplicate." : "The near-duplicate is back on top because relevance dominates."}<br><small>d\u2082 only wins when \u03BB \u2265 0.75 / 0.93 \u2248 ${UI.f(.75 / .93, 2)}.</small>`;
  }
  draw();
};

/* ---------- 5.9 ranking metrics ---------- */
Widgets.metrics = (b, UI) => {
  const g = [2, 3, 0, 0, 1, 0], st = { n: 3, k: 3, total: 0 };
  const row = UI.row(b), selRow = UI.row(b), sels = [];
  const sn = UI.slider(row, { label: "List length", min: 1, max: 6, value: 3, onInput: v => { st.n = v; draw(); } });
  const sk = UI.slider(row, { label: "k", min: 1, max: 6, value: 3, onInput: v => { st.k = v; draw(); } });
  UI.field(row, { label: "Relevant items in whole collection (optional)", type: "number", value: "", attrs: 'min="0" placeholder="auto"', onInput: v => { st.total = Math.max(0, Math.round(num(parseFloat(v)))); draw(); } });
  for (let i = 0; i < 6; i++) sels.push(UI.select(selRow, { label: `Grade at rank ${i + 1}`, options: [[0, "0 irrelevant"], [1, "1 weak"], [2, "2 good"], [3, "3 perfect"]], value: g[i], onChange: v => { g[i] = +v; draw(); } }));
  const set = a => { st.n = a.length; sn.set(a.length); st.k = a.length; sk.set(a.length); a.forEach((v, i) => { g[i] = v; sels[i].set(v); }); draw(); };
  UI.buttons(b, [["[2, 3, 0] (5.9 example)", () => set([2, 3, 0])], ["[0, 3] (quiz 4)", () => set([0, 3])], ["[3, 2, 0] ideal", () => set([3, 2, 0])]]);
  const o = UI.out(b);
  const lg = i => Math.log2(i + 1);
  function draw() {
    sels.forEach((s, i) => { s.box.style.display = i < st.n ? "" : "none"; });
    const list = g.slice(0, st.n), k = Math.min(st.k, st.n), top = list.slice(0, k);
    const rel = top.filter(x => x > 0).length, relAll = list.filter(x => x > 0).length, tot = Math.max(st.total, relAll);
    const dcg = a => a.reduce((s, x, i) => s + (Math.pow(2, x) - 1) / lg(i + 1), 0);
    const ideal = list.slice().sort((a, c) => c - a).slice(0, k), D = dcg(top), I = dcg(ideal);
    const first = list.findIndex(x => x > 0), rr = first >= 0 ? 1 / (first + 1) : 0;
    o.innerHTML = `Top ${k} = [${top.join(", ")}] &middot; ideal order = [${ideal.join(", ")}] (relevant = grade \u2265 1)<br>
      Precision@${k} = ${rel}/${k} = <b>${UI.f(rel / k, 3)}</b> &middot; Recall@${k} = ${rel}/${tot} = <b>${tot ? UI.f(rel / tot, 3) : "n/a"}</b><br>
      Reciprocal rank (this query) = <b>${first >= 0 ? `1/${first + 1} = ${UI.f(rr, 3)}` : "0 (no relevant item)"}</b><br>
      DCG@${k} = ${UI.f(D, 3)} &middot; IDCG@${k} = ${UI.f(I, 3)} &rarr; nDCG@${k} = <span class="big">${I > 0 ? UI.f(D / I, 3) : "n/a"}</span>`;
    o.className = "out " + (I > 0 && D / I > .95 ? "good" : "mid");
  }
  draw();
};

/* ---------- 5.9 MRR ---------- */
Widgets.mrr = (b, UI) => {
  const o = (() => { const f = UI.field(b, { label: "Rank of the first relevant item for each query (comma-separated; 0 = none found)", value: "1, 3, 2", onInput: () => draw() }); return f; })();
  const out = UI.out(b);
  function draw() {
    const r = o.get().split(/[\s,;]+/).filter(Boolean).map(Number).filter(x => isFinite(x) && x >= 0).map(Math.floor);
    if (!r.length) { out.className = "out mid"; out.textContent = "Enter at least one rank, e.g. 1, 3, 2."; return; }
    const rr = r.map(x => (x > 0 ? 1 / x : 0)), m = rr.reduce((a, c) => a + c, 0) / r.length;
    out.className = "out good";
    out.innerHTML = `MRR = (${r.map((x, i) => (x > 0 ? `1/${x}` : "0")).join(" + ")}) / ${r.length} = ${UI.f(rr.reduce((a, c) => a + c, 0), 3)} / ${r.length} = <span class="big">${UI.f(m, 3)}</span><br><small>Try 2, 4 for the quiz (0.375).</small>`;
  }
  draw();
};
