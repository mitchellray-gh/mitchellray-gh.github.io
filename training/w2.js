/* Module 2 widgets: concept mapping */
const lg2 = x => Math.log(x) / Math.log(2);

Widgets.chain = (b, UI) => {
  const words = ["sales", "revenue", "income", "earnings", "salary"];
  const c = [0.9, 0.8, 0.6, 0.5];
  let thr = 0.5;
  const row = UI.row(b);
  const sl = c.map((v, i) => UI.slider(row, {
    label: `conf(${words[i]} ~ ${words[i + 1]})`, min: 0, max: 1, step: 0.05, value: v, fmt: x => x.toFixed(2),
    onInput: x => { c[i] = x; draw(); }
  }));
  const row2 = UI.row(b);
  UI.slider(row2, { label: "Trust threshold (illustrative)", min: 0.1, max: 0.9, step: 0.05, value: thr, fmt: x => x.toFixed(2), onInput: x => { thr = x; draw(); } });
  UI.buttons(b, [["PDF example (0.9, 0.8, 0.6, 0.5)", () => { [0.9, 0.8, 0.6, 0.5].forEach((v, i) => { c[i] = v; sl[i].set(v); }); draw(); }]]);
  const bars = UI.el("<div></div>"); b.appendChild(bars);
  const o = UI.out(b);
  function draw() {
    let p = 1;
    const items = [];
    for (let i = 0; i < c.length; i++) {
      p *= c[i];
      items.push({ label: `sales ~ ${words[i + 1]}`, value: p, display: UI.f(p, 3), color: p >= thr ? "#1f7a52" : "#b4363f" });
    }
    UI.bars(bars, items, { top: false });
    const prod = c.map(x => UI.f(x, 2)).join(" &times; ");
    o.className = "out " + (p >= thr ? "good" : "bad");
    o.innerHTML = `Chain confidence = ${prod} = <b>${UI.f(p, 3)}</b>. ` + (p >= thr ? "Strong enough to trust." : `Below ${UI.f(thr, 2)}: <b>too weak to merge</b> sales with salary.`);
  }
  draw();
};

Widgets.lev = (b, UI) => {
  let A = "revnue", B = "revenue";
  const row = UI.row(b);
  const fa = UI.field(row, { label: "String a (max 14 characters)", value: A, attrs: 'maxlength="14"', onInput: v => { A = v; draw(); } });
  const fb = UI.field(row, { label: "String b (max 14 characters)", value: B, attrs: 'maxlength="14"', onInput: v => { B = v; draw(); } });
  const pre = (x, y) => () => { A = x; B = y; fa.set(x); fb.set(y); draw(); };
  UI.buttons(b, [["revnue / revenue", pre("revnue", "revenue")], ["cost / coast", pre("cost", "coast")], ["revenue / turnover", pre("revenue", "turnover")], ["custmer / customer", pre("custmer", "customer")]]);
  const box = UI.el('<div style="overflow-x:auto"></div>'); b.appendChild(box);
  const o = UI.out(b);
  function draw() {
    const a = A.toLowerCase().trim(), s = B.toLowerCase().trim(), n = a.length, m = s.length;
    const d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] !== s[j - 1] ? 1 : 0));
    const path = new Set(); let i = n, j = m; path.add(i + "," + j);
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (a[i - 1] !== s[j - 1] ? 1 : 0)) { i--; j--; }
      else if (i > 0 && d[i][j] === d[i - 1][j] + 1) i--;
      else j--;
      path.add(i + "," + j);
    }
    const esc = UI.esc;
    let h = `<table style="width:auto;display:table"><tr><th></th><th></th>${[...s].map(ch => `<th>${esc(ch)}</th>`).join("")}</tr>`;
    for (let r = 0; r <= n; r++) {
      h += `<tr><th>${r ? esc(a[r - 1]) : ""}</th>`;
      for (let q = 0; q <= m; q++) h += `<td class="num"${path.has(r + "," + q) ? ' style="background:#fde3d9;font-weight:700"' : ""}>${d[r][q]}</td>`;
      h += "</tr>";
    }
    box.innerHTML = h + "</table>";
    const lev = d[n][m], mx = Math.max(n, m), sim = mx ? 1 - lev / mx : 1;
    o.className = "out " + (sim >= 0.8 ? "good" : sim >= 0.5 ? "mid" : "bad");
    o.innerHTML = `lev = <b>${lev}</b>, max length = ${mx}, sim_lex = 1 &minus; ${lev}/${mx || 1} = <span class="verdict">${UI.f(sim, 3)}</span>. Shaded cells trace one optimal edit path. Remember: a high score only means the <i>spelling</i> is close, not the meaning.`;
  }
  draw();
};

Widgets.softmax = (b, UI) => {
  const names = ["Revenue", "UnitsSold", "SalesDepartment"];
  const base = { s: [0.9, 0.7, 0.8], ctx: [0.6, 0.5, 0.1], lam: 1, T: 1, tau: 0.6, delta: 0.2 };
  const st = JSON.parse(JSON.stringify(base));
  const ctls = {};
  const r1 = UI.row(b), r2 = UI.row(b), r3 = UI.row(b);
  names.forEach((n, i) => ctls["s" + i] = UI.slider(r1, { label: `s(t, ${n})`, min: 0, max: 1.5, step: 0.05, value: st.s[i], fmt: v => v.toFixed(2), onInput: v => { st.s[i] = v; draw(); } }));
  names.forEach((n, i) => ctls["c" + i] = UI.slider(r2, { label: `ctx(${n}, Q)`, min: 0, max: 2, step: 0.05, value: st.ctx[i], fmt: v => v.toFixed(2), onInput: v => { st.ctx[i] = v; draw(); } }));
  ctls.lam = UI.slider(r3, { label: "\u03BB (context weight)", min: 0, max: 3, step: 0.1, value: 1, fmt: v => v.toFixed(1), onInput: v => { st.lam = v; draw(); } });
  ctls.T = UI.slider(r3, { label: "T (temperature)", min: 0.1, max: 10, step: 0.1, value: 1, fmt: v => v.toFixed(1), onInput: v => { st.T = v; draw(); } });
  const r4 = UI.row(b);
  ctls.tau = UI.slider(r4, { label: "\u03C4 (min confidence)", min: 0.3, max: 0.95, step: 0.05, value: 0.6, fmt: v => v.toFixed(2), onInput: v => { st.tau = v; draw(); } });
  ctls.delta = UI.slider(r4, { label: "\u03B4 (min margin)", min: 0, max: 0.6, step: 0.05, value: 0.2, fmt: v => v.toFixed(2), onInput: v => { st.delta = v; draw(); } });
  const setAll = () => {
    names.forEach((_, i) => { ctls["s" + i].set(st.s[i]); ctls["c" + i].set(st.ctx[i]); });
    ["lam", "T", "tau", "delta"].forEach(k => ctls[k].set(st[k])); draw();
  };
  UI.buttons(b, [
    ["\u201CShow sales by region\u2026\u201D", () => { Object.assign(st, JSON.parse(JSON.stringify(base))); setAll(); }],
    ["Add \u201C\u2026in dollars\u201D", () => { Object.assign(st, JSON.parse(JSON.stringify(base))); st.ctx[0] = 1.5; setAll(); }],
    ["Raise T to 10", () => { Object.assign(st, JSON.parse(JSON.stringify(base))); st.T = 10; setAll(); }]]);
  const bars = UI.el("<div></div>"); b.appendChild(bars);
  const o = UI.out(b);
  function draw() {
    const z = names.map((_, i) => st.s[i] + st.lam * st.ctx[i]);
    const p = UI.softmax(z, st.T), H = UI.entropy(p), Hm = Math.log(names.length), nh = Hm > 0 ? H / Hm : 0;
    UI.bars(bars, names.map((n, i) => ({ label: `${n} (z = ${UI.f(z[i], 2)})`, value: p[i], display: UI.f(p[i], 3) })));
    const idx = p.map((v, i) => i).sort((x, y) => p[y] - p[x]);
    const p1 = p[idx[0]], p2 = p[idx[1]], margin = p1 - p2;
    const ok = p1 >= st.tau - 1e-9 && margin >= st.delta - 1e-9;
    o.className = "out " + (ok ? "good" : "mid");
    o.innerHTML = `Entropy H = <b>${UI.f(H, 3)}</b> nats (max ln 3 = ${UI.f(Hm, 3)}), normalised <b>${UI.f(nh, 2)}</b>. Top: <b>${names[idx[0]]}</b> P = ${UI.f(p1, 2)}, margin over runner-up = ${UI.f(margin, 2)}.<br>
    <span class="verdict">${ok ? `ACCEPT ${names[idx[0]]}` : "CLARIFY or state the assumption"}</span> (needs P &ge; ${UI.f(st.tau, 2)} and margin &ge; ${UI.f(st.delta, 2)}).`;
  }
  draw();
};

Widgets.noisy = (b, UI) => {
  const f = ["North America", "Not Applicable", "Net Amount"];
  const pri = { none: [0.3, 0.5, 0.2], region: [0.85, 0.10, 0.05] };
  const lik = [0.9, 0.8, 0.7];
  let ctx = "none";
  const row = UI.row(b);
  const sel = UI.select(row, { label: "Context around \u201CNA\u201D", options: [["none", "A: none (\u201CWhat is NA?\u201D)"], ["region", "B: region column (\u201CRevenue for NA vs EMEA\u201D)"]], value: ctx, onChange: v => { ctx = v; draw(); } });
  f.forEach((n, i) => UI.slider(row, { label: `P(a | ${n})`, min: 0, max: 1, step: 0.05, value: lik[i], fmt: v => v.toFixed(2), onInput: v => { lik[i] = v; draw(); } }));
  const bars = UI.el("<div></div>"); b.appendChild(bars);
  const o = UI.out(b);
  function draw() {
    const pr = pri[ctx], prod = f.map((_, i) => lik[i] * pr[i]), Z = prod.reduce((a, c) => a + c, 0);
    const post = prod.map(v => (Z > 0 ? v / Z : 0));
    UI.bars(bars, f.map((n, i) => ({ label: `${n}`, value: post[i], display: UI.f(post[i], 2) })));
    const best = post.indexOf(Math.max(...post));
    const rows = f.map((n, i) => `<tr><td>${n}</td><td class="num">${UI.f(lik[i], 2)}</td><td class="num">${UI.f(pr[i], 2)}</td><td class="num">${UI.f(prod[i], 3)}</td><td class="num">${UI.f(post[i], 2)}</td></tr>`).join("");
    o.className = "out " + (post[best] >= 0.6 ? "good" : "mid");
    o.innerHTML = `<table style="display:table"><tr><th>f</th><th>P(a | f)</th><th>P(f${ctx === "region" ? " | region" : ""})</th><th>Product</th><th>Posterior</th></tr>${rows}</table>
    Normaliser = ${UI.f(Z, 3)}. ` + (Z > 0 ? `<span class="verdict">Leader: ${f[best]} (${UI.f(post[best], 2)})</span>. ` : "No candidate is plausible. ") + (ctx === "none" ? "Ambiguous: switch the context on." : "The prior, not the likelihood, did the work.");
  }
  draw();
};

Widgets.pmi = (b, UI) => {
  const s = { N: 1000, v: 50, c: 200, vc: 40, k: 0, V: 2 };
  const num = (k, label, extra) => UI.field(row, { label, type: "number", value: s[k], attrs: `min="0" step="1" ${extra || ""}`, onInput: v => { s[k] = Math.max(0, +v || 0); draw(); } });
  const row = UI.row(b);
  const fN = num("N", "Total contexts N"), fv = num("v", "Contexts with code v"), fc = num("c", "Contexts with concept c"), fvc = num("vc", "Contexts with both");
  const row2 = UI.row(b);
  const fk = UI.field(row2, { label: "Smoothing constant k (0 = none)", type: "number", value: 0, attrs: 'min="0" step="0.5"', onInput: v => { s.k = Math.max(0, +v || 0); draw(); } });
  const fV = UI.field(row2, { label: "Vocabulary size |V| (for smoothing)", type: "number", value: 2, attrs: 'min="1" step="1"', onInput: v => { s.V = Math.max(1, +v || 1); draw(); } });
  const set = (v, c, vc) => () => { s.N = 1000; s.v = v; s.c = c; s.vc = vc; fN.set(1000); fv.set(v); fc.set(c); fvc.set(vc); draw(); };
  UI.buttons(b, [["R01 & Region (50, 200, 40)", set(50, 200, 40)], ["R01 & Revenue (50, 300, 5)", set(50, 300, 5)], ["Rare code (2, 200, 2)", set(2, 200, 2)]]);
  const o = UI.out(b);
  function draw() {
    const N = s.N, den = N + s.k * s.V;
    const vc = Math.min(s.vc, s.v, s.c);
    if (!(N > 0) || !(den > 0)) { o.className = "out mid"; o.textContent = "Enter a total N greater than zero."; return; }
    const pv = (s.v + s.k) / den, pc = (s.c + s.k) / den, pj = (vc + s.k) / den;
    let msg;
    if (pv <= 0 || pc <= 0 || pj <= 0) {
      o.className = "out mid";
      msg = `P(v) = ${UI.f(pv, 4)}, P(c) = ${UI.f(pc, 4)}, P(v, c) = ${UI.f(pj, 4)}. A zero probability makes PMI undefined (&minus;&infin; if they never co-occur). Add smoothing k &gt; 0 or collect more data.`;
    } else {
      const p = lg2(pj / (pv * pc)), ppmi = Math.max(0, p), ratio = pj / (pv * pc);
      o.className = "out " + (p > 0.5 ? "good" : p < -0.5 ? "bad" : "mid");
      msg = `P(v) = ${UI.f(pv, 3)}, P(c) = ${UI.f(pc, 3)}, P(v, c) = ${UI.f(pj, 4)}.<br>
      PMI = log<sub>2</sub>( ${UI.f(pj, 4)} / (${UI.f(pv, 3)} &times; ${UI.f(pc, 3)}) ) = log<sub>2</sub>(${UI.f(ratio, 3)}) = <span class="verdict">${p >= 0 ? "+" : ""}${UI.f(p, 2)} bits</span> &nbsp; PPMI = ${UI.f(ppmi, 2)}<br>
      ${p > 0.5 ? "Appear together more than chance: likely related." : p < -0.5 ? "Appear together less than chance: likely unrelated." : "Close to independent."}` + (s.v < 5 || vc < 3 ? " <b>Rare-event caution:</b> counts are small, so this value is noisy." : "");
    }
    o.innerHTML = msg + (s.vc > Math.min(s.v, s.c) ? "<br><i>Joint count capped at the smaller marginal count.</i>" : "");
  }
  draw();
};

Widgets.onto = (b, UI) => {
  const T = {
    Metric: { par: null, P: 1, x: 210, y: 28 },
    "Financial Metric": { par: "Metric", P: 0.5, x: 210, y: 82 },
    Revenue: { par: "Financial Metric", P: 0.2, x: 120, y: 142 },
    Cost: { par: "Financial Metric", P: 0.25, x: 300, y: 142 },
    "Gross Rev": { par: "Revenue", P: 0.05, x: 66, y: 200 },
    "Net Rev": { par: "Revenue", P: 0.08, x: 180, y: 200 }
  };
  const names = Object.keys(T);
  let A = "Gross Rev", B = "Net Rev", mu = 0.5;
  const row = UI.row(b);
  const opt = names.map(n => [n, n]);
  UI.select(row, { label: "Concept 1", options: opt, value: A, onChange: v => { A = v; draw(); } });
  UI.select(row, { label: "Concept 2", options: opt, value: B, onChange: v => { B = v; draw(); } });
  UI.slider(row, { label: "\u03BC (distance decay)", min: 0.1, max: 2, step: 0.1, value: mu, fmt: v => v.toFixed(1), onInput: v => { mu = v; draw(); } });
  const sel = (x, y) => () => { A = x; B = y; row.querySelectorAll("select")[0].value = x; row.querySelectorAll("select")[1].value = y; draw(); };
  UI.buttons(b, [["Gross \u2194 Net", sel("Gross Rev", "Net Rev")], ["Gross \u2194 Cost", sel("Gross Rev", "Cost")], ["Revenue \u2194 Cost", sel("Revenue", "Cost")]]);
  const svg = UI.svg(b, 380, 225), o = UI.out(b);
  const anc = n => { const a = []; for (let c = n; c; c = T[c].par) a.push(c); return a; };
  const ic = n => -Math.log(T[n].P);
  function draw() {
    const aa = anc(A), ab = anc(B), lcs = aa.find(n => ab.includes(n));
    const pa = aa.slice(0, aa.indexOf(lcs) + 1), pb = ab.slice(0, ab.indexOf(lcs) + 1);
    const path = new Set([...pa, ...pb]), dist = pa.length - 1 + pb.length - 1;
    const sim = Math.exp(-mu * dist), den = ic(A) + ic(B);
    const lin = A === B ? 1 : den > 0 ? 2 * ic(lcs) / den : 0;
    let g = "";
    names.forEach(n => { const p = T[n].par; if (p) { const on = path.has(n) && path.has(p) && (pa.includes(n) || pb.includes(n)); g += `<line x1="${T[p].x}" y1="${T[p].y}" x2="${T[n].x}" y2="${T[n].y}" stroke="${on ? "#e8481c" : "#6f685b"}" stroke-width="${on ? 4 : 1.5}"/>`; } });
    names.forEach(n => {
      const t = T[n], on = path.has(n), w = n.length * 6.6 + 18;
      g += `<rect x="${t.x - w / 2}" y="${t.y - 13}" width="${w}" height="26" fill="${n === lcs ? "#1f7a52" : on ? "#fde3d9" : "#fff"}" stroke="#1a1815"/><text x="${t.x}" y="${t.y + 4}" font-size="11" text-anchor="middle" fill="${n === lcs ? "#fff" : "#1a1815"}">${n}</text>`;
    });
    svg.innerHTML = g + `<text x="372" y="218" font-size="10" text-anchor="end" fill="#6f685b">green = lowest common subsumer</text>`;
    o.className = "out " + (lin >= 0.5 ? "good" : "mid");
    o.innerHTML = `Path: <b>${[...pa, ...pb.slice(0, -1).reverse()].join(" &rarr; ")}</b> (every edge is an is-a link, cost 1)<br>
    dist = <b>${dist}</b>, sim<sub>path</sub> = e<sup>&minus;${UI.f(mu, 1)}&times;${dist}</sup> = <b>${UI.f(sim, 2)}</b><br>
    lcs = <b>${lcs}</b> (IC ${UI.f(ic(lcs), 3)}); IC(1) = ${UI.f(ic(A), 3)}, IC(2) = ${UI.f(ic(B), 3)}; sim<sub>Lin</sub> = <span class="verdict">${UI.f(lin, 2)}</span>
    <br><small>P(c) values are the module&rsquo;s; the root &ldquo;Metric&rdquo; with P = 1 (IC = 0) is an illustrative addition.</small>`;
  }
  draw();
};

Widgets.unified = (b, UI) => {
  const sig = ["w\u2081 embedding", "w\u2082 edit distance", "w\u2083 abbreviation", "w\u2084 PMI (codes)", "w\u2085 ontology", "w\u2086 prior"];
  const forms = {
    turnover: { dom: [0, 4], c: [["Revenue", [.9, .2, 0, 0, .8, .5]], ["Cost", [.6, .1, 0, 0, .3, .5]], ["Region", [.1, 0, 0, 0, .1, .3]]] },
    revnue: { dom: [1], c: [["Revenue", [.8, .9, 0, 0, .6, .5]], ["Cost", [.5, .3, 0, 0, .3, .5]], ["Region", [.2, .2, 0, 0, .1, .3]]] },
    NA: { dom: [2], c: [["North America", [.4, 0, .9, 0, .6, .3]], ["Not Applicable", [.2, 0, .8, 0, .1, .5]], ["Net Amount", [.3, 0, .7, 0, .2, .2]]] },
    R01: { dom: [3], c: [["Region", [.1, .1, 0, .9, .5, .4]], ["Revenue", [.3, .1, 0, .1, .5, .5]], ["Cost", [.1, .1, 0, 0, .2, .4]]] },
    sales: { dom: [4], c: [["Revenue", [.8, .3, 0, 0, .9, .5]], ["UnitsSold", [.7, .3, 0, 0, .5, .4]], ["SalesDepartment", [.7, .3, 0, 0, .1, .3]]] }
  };
  let form = "sales", T = 1, w = [];
  const row = UI.row(b);
  UI.select(row, { label: "Surface form", options: [["turnover", "Synonym: \u201Cturnover\u201D"], ["revnue", "Typo: \u201Crevnue\u201D"], ["NA", "Abbreviation: \u201CNA\u201D"], ["R01", "Internal code: \u201CR01\u201D"], ["sales", "Ambiguous word: \u201Csales\u201D"]], value: form, onChange: v => { form = v; reset(); } });
  UI.slider(row, { label: "T (temperature)", min: 0.2, max: 3, step: 0.1, value: 1, fmt: v => v.toFixed(1), onInput: v => { T = v; draw(); } });
  const row2 = UI.row(b), ws = [];
  sig.forEach((n, i) => ws.push(UI.slider(row2, { label: n, min: 0, max: 3, step: 0.1, value: 1, fmt: v => v.toFixed(1), onInput: v => { w[i] = v; draw(); } })));
  UI.buttons(b, [["Dominant signal only", () => { const d = forms[form].dom; w = sig.map((_, i) => (d.includes(i) ? 3 : 0)); sync(); draw(); }], ["Equal weights", () => { w = sig.map(() => 1); sync(); draw(); }]]);
  const sync = () => ws.forEach((s, i) => s.set(w[i]));
  const bars = UI.el("<div></div>"), o = UI.out(b);
  b.insertBefore(bars, o);
  function reset() { const d = forms[form].dom; w = sig.map((_, i) => (d.includes(i) ? 2.5 : 0.5)); sync(); draw(); }
  function draw() {
    const cs = forms[form].c, z = cs.map(([, v]) => v.reduce((a, x, i) => a + w[i] * x, 0)), p = UI.softmax(z, T);
    UI.bars(bars, cs.map(([n], i) => ({ label: `${n} (z = ${UI.f(z[i], 2)})`, value: p[i], display: UI.f(p[i], 2) })));
    const idx = p.map((_, i) => i).sort((x, y) => p[y] - p[x]), ok = p[idx[0]] >= 0.6 && p[idx[0]] - p[idx[1]] >= 0.2;
    o.className = "out " + (ok ? "good" : "mid");
    o.innerHTML = `Dominant signal for this form: <b>${forms[form].dom.map(i => sig[i]).join(", ")}</b>. Accept rule (\u03C4 = 0.6, \u03B4 = 0.2): <span class="verdict">${ok ? "accept " + cs[idx[0]][0] : "clarify / state the assumption"}</span>.<br><small>Signal strengths per candidate are illustrative numbers invented for this demo (0 to 1), not from the source.</small>`;
  }
  reset();
};
