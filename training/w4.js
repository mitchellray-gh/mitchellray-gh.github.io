/* Module 4 widgets: intent detection and entity resolution */
const num = v => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
const sig = z => 1 / (1 + Math.exp(-Math.max(-60, Math.min(60, z))));
const pct = (x, d = 1) => (100 * x).toFixed(d) + "%";

/* 4.3 naive Bayes over cue words */
Widgets.nbayes = (b, UI) => {
  const K = ["rank", "trend", "lookup"];
  const cues = { "top": [.30, .02, .03], "by": [.20, .15, .10], "over time": [.05, .40, .03], "best": [.15, .02, .02], "changed": [.02, .25, .05] };
  const names = Object.keys(cues);
  const on = new Set(["top", "by"]);
  const pri = [.30, .30, .40];
  const txt = UI.field(b, { label: "Type a question (cue words are detected automatically)", value: "top 5 regions by revenue", onInput: v => { const t = v.toLowerCase(); on.clear(); names.forEach(n => { if (new RegExp("(^|[^a-z])" + n + "([^a-z]|$)").test(t)) on.add(n); }); sync(); draw(); } });
  const chipRow = UI.row(b);
  const chips = names.map(n => { const c = UI.el(`<button type="button" class="chip" aria-pressed="false">${n}</button>`); c.addEventListener("click", () => { on.has(n) ? on.delete(n) : on.add(n); sync(); draw(); }); chipRow.appendChild(c); return c; });
  const sync = () => chips.forEach((c, i) => { const s = on.has(names[i]); c.classList.toggle("on", s); c.setAttribute("aria-pressed", s); });
  const row = UI.row(b);
  const sl = K.map((k, i) => UI.slider(row, { label: `Prior P(${k})`, min: 0, max: 1, step: .05, value: pri[i], fmt: v => v.toFixed(2), onInput: v => { pri[i] = v; draw(); } }));
  UI.buttons(b, [
    ["Worked example (\u201Ctop\u201D, \u201Cby\u201D)", () => preset([.3, .3, .4], ["top", "by"], "top 5 regions by revenue")],
    ["Quiz 1: equal priors, \u201Cover time\u201D", () => preset([.5, .5, 0], ["over time"], "revenue over time")]]);
  const bx = UI.out(b), o = UI.out(b);
  function preset(p, w, t) { p.forEach((v, i) => { pri[i] = v; sl[i].set(v); }); on.clear(); w.forEach(x => on.add(x)); txt.set(t); sync(); draw(); }
  function draw() {
    const prod = K.map((k, i) => [...on].reduce((a, c) => a * cues[c][i], pri[i]));
    const Z = prod.reduce((a, v) => a + v, 0);
    if (Z <= 0) { bx.innerHTML = ""; o.innerHTML = "All intents have zero weight. Raise at least one prior."; return; }
    const post = prod.map(v => v / Z);
    UI.bars(bx, K.map((k, i) => ({ label: k, value: post[i], display: pct(post[i]), color: "" })), { max: 1 });
    const order = post.map((p, i) => i).sort((x, y) => post[y] - post[x]), t1 = order[0], t2 = order[1];
    let h = `Products: ${K.map((k, i) => `${k} = ${prod[i].toFixed(4)}`).join(", ")}; normalizer = <b>${Z.toFixed(4)}</b>.<br>`;
    if (on.size) h += `Cue evidence, <b>${K[t1]}</b> vs. <b>${K[t2]}</b>: ` + [...on].map(c => `\u201C${c}\u201D ln(${cues[c][t1]} / ${cues[c][t2]}) = <b>${Math.log(cues[c][t1] / cues[c][t2]).toFixed(2)} nats</b>`).join("; ") + ". Near zero means the word barely helps.";
    else h += "No cue words selected, so the posterior equals the prior.";
    o.innerHTML = h + `<br><span class="mini">Cue likelihoods for \u201Ctop\u201D and \u201Cby\u201D come from the module; \u201Cover time\u201D (trend 0.40, rank 0.05 from Quiz 1) and the other numbers are illustrative.</span>`;
  }
  sync(); draw();
};

/* 4.2 single label vs multi label */
Widgets.multilabel = (b, UI) => {
  const K = ["lookup", "count", "aggregate", "trend", "compare", "rank", "distribution", "explain"];
  const z = [-1, -2, 0, -1, -2, 3, -2, -2];
  let mode = "softmax";
  UI.buttons(b, [["Single-label: softmax", () => { mode = "softmax"; draw(); }, 1], ["Multi-label: sigmoids", () => { mode = "sigmoid"; draw(); }, 1]]).firstChild.classList.add("on");
  UI.buttons(b, [
    ["Preset: top 5 stores by revenue", () => load([-1, -2, 0, -1, -2, 3, -2, -2])],
    ["Preset: why did revenue drop vs. the month before?", () => load([-3, -3, -1, 0, 1.6, -2, -3, 2.2])]]);
  const row = UI.row(b);
  const sl = K.map((k, i) => UI.slider(row, { label: `score for ${k}`, min: -4, max: 4, step: .1, value: z[i], fmt: v => v.toFixed(1), onInput: v => { z[i] = v; draw(); } }));
  const bx = UI.out(b), o = UI.out(b);
  function load(a) { a.forEach((v, i) => { z[i] = v; sl[i].set(v); }); draw(); }
  function draw() {
    const p = mode === "softmax" ? UI.softmax(z) : z.map(sig);
    UI.bars(bx, K.map((k, i) => ({ label: k, value: p[i], display: p[i].toFixed(3) })), { max: 1 });
    const sum = p.reduce((a, v) => a + v, 0);
    const chosen = mode === "softmax" ? [K[p.indexOf(Math.max(...p))]] : K.filter((k, i) => p[i] > .5);
    o.innerHTML = `Probabilities sum to <b>${sum.toFixed(3)}</b>. ` + (mode === "softmax"
      ? `Exactly one intent is chosen: <span class="verdict">${chosen[0]}</span>. Raising one score steals probability from the others.`
      : `Each intent is an independent yes/no (include if P &gt; 0.5): <span class="verdict">${chosen.length ? chosen.join(" + ") : "none above 0.5"}</span>.`) +
      `<br><span class="mini">Scores are illustrative; they stand in for W<sub>k</sub>\u00B7q + b<sub>k</sub>.</span>`;
  }
  draw();
};

/* 4.4 explain decomposition */
Widgets.explainwf = (b, UI) => {
  const names = ["North", "South", "East", "West", "Other"], d = [-80, -8, -7, -3, -2];
  let x0 = 1000;
  const row = UI.row(b);
  const fx = UI.field(row, { label: "Revenue before X\u2080 ($k)", type: "number", value: x0, attrs: 'step="any"', onInput: v => { x0 = num(v); draw(); } });
  const fs = names.map((n, i) => UI.field(row, { label: `\u0394 ${n} ($k)`, type: "number", value: d[i], attrs: 'step="any"', onInput: v => { d[i] = num(v); draw(); } }));
  UI.buttons(b, [["Module example (North \u221280 of \u2212100)", () => { x0 = 1000; fx.set(1000); [-80, -8, -7, -3, -2].forEach((v, i) => { d[i] = v; fs[i].set(v); }); draw(); }],
    ["Make it spread evenly", () => { d.forEach((v, i) => { d[i] = -20; fs[i].set(-20); }); draw(); }]]);
  const sv = UI.svg(b, 520, 230), o = UI.out(b);
  function draw() {
    const run = [x0]; d.forEach(v => run.push(run[run.length - 1] + v));
    const x1 = run[run.length - 1], dx = x1 - x0, all = run.concat(x0);
    let lo = Math.min(...all), hi = Math.max(...all); const sp = hi - lo || 1; lo -= sp * .2; hi += sp * .2;
    const y = v => 200 - 175 * (v - lo) / (hi - lo);
    let s = `<line x1="10" y1="200" x2="510" y2="200" stroke="#1a1815"/>`;
    const bar = (i, a, c, col, lab, val) => { const x = 20 + i * 70, t = Math.min(y(a), y(c)), h = Math.max(2, Math.abs(y(a) - y(c)));
      s += `<rect x="${x}" y="${t}" width="56" height="${h}" fill="${col}"/><text x="${x + 28}" y="${t - 4}" font-size="11" text-anchor="middle" font-weight="700">${val}</text><text x="${x + 28}" y="217" font-size="11" text-anchor="middle">${lab}</text>`; };
    bar(0, lo, x0, "#1a1815", "before", UI.f(x0, 0));
    d.forEach((v, i) => bar(i + 1, run[i], run[i + 1], v < 0 ? "#e8481c" : "#1f7a52", names[i], (v > 0 ? "+" : "") + UI.f(v, 0)));
    bar(6, lo, x1, "#1f6f8b", "after", UI.f(x1, 0));
    sv.innerHTML = s;
    const sh = dx === 0 ? null : d.map(v => v / dx);
    o.innerHTML = `\u0394X = X\u2081 \u2212 X\u2080 = ${UI.f(x1, 0)} \u2212 ${UI.f(x0, 0)} = <b>${UI.f(dx, 1)}</b>. ` +
      (sh ? "Share of the change: " + names.map((n, i) => `${n} <b>${pct(sh[i], 0)}</b>`).join(", ") + ` (sum ${pct(sh.reduce((a, v) => a + v, 0), 0)}).` : "The total change is zero, so shares are undefined (segments cancel out).") +
      `<br><span class="mini">Axis is zoomed to show the change, so it does not start at zero. Only North = \u221280 is from the module; the other segments are illustrative.</span>`;
  }
  draw();
};

/* 4.5 aggregation operators + rows vs entities */
Widgets.aggop = (b, UI) => {
  const ops = [["total", "\u201Ctotal\u201D, \u201Coverall\u201D, \u201Csum of\u201D", "SUM"], ["avg", "\u201Caverage\u201D, \u201Cmean\u201D, \u201Ctypical\u201D, \u201Cper\u201D", "AVG (weighted)"], ["max", "\u201Chighest\u201D, \u201Clargest\u201D, \u201Cpeak\u201D, \u201Cmaximum\u201D", "MAX"], ["min", "\u201Clowest\u201D, \u201Csmallest\u201D, \u201Cminimum\u201D", "MIN"], ["ent", "\u201Chow many [entities]\u201D", "COUNT DISTINCT entity"], ["rec", "\u201Chow many [records / transactions]\u201D", "COUNT rows"], ["med", "\u201Cmedian\u201D, \u201Cmiddle\u201D", "PERCENTILE 0.5"]];
  const sel = UI.select(b, { label: "Modifier words in the question", options: ops.map(o => [o[0], o[1]]), value: "total", onChange: () => draw() });
  const o1 = UI.out(b);
  UI.el; const hr = UI.el(`<h4>Rows vs. entities</h4>`); b.appendChild(hr);
  const f = UI.field(b, { label: "Customer on each order row (comma-separated)", value: "A,B,A,C,D,A,B,C,A,D", onInput: () => draw() });
  const w = UI.select(b, { label: "\u201CHow many \u2026 placed orders?\u201D", options: [["cust", "customers"], ["ord", "orders"]], value: "cust", onChange: () => draw() });
  const o2 = UI.out(b);
  function draw() {
    const op = ops.find(x => x[0] === sel.get());
    o1.innerHTML = `Operator chosen from the words, not the column name: <span class="verdict">${op[2]}</span>`;
    const rows = f.get().split(",").map(s => s.trim()).filter(Boolean), dist = new Set(rows.map(s => s.toLowerCase())).size;
    const ans = w.get() === "cust" ? dist : rows.length;
    o2.innerHTML = `COUNT(rows) = <b>${rows.length}</b> &nbsp; COUNT(DISTINCT customer) = <b>${dist}</b><br>The noun after \u201Chow many\u201D picks the operator, so the answer is <span class="verdict">${ans}</span> ${rows.length === 10 && dist === 4 ? "(the module\u2019s 10 order rows from 4 customers)" : ""}`;
  }
  draw();
};

/* 4.5 average of averages */
Widgets.avgavg = (b, UI) => {
  const g = [[10, 100], [90, 200], [0, 0]];
  const fn = [], fa = [];
  const row = UI.row(b);
  g.forEach((v, i) => {
    fn.push(UI.field(row, { label: `Group ${"ABC"[i]} orders`, type: "number", value: v[0], attrs: 'min="0" step="any"', onInput: x => { g[i][0] = Math.max(0, num(x)); draw(); } }));
    fa.push(UI.field(row, { label: `Group ${"ABC"[i]} average ($)`, type: "number", value: v[1], attrs: 'step="any"', onInput: x => { g[i][1] = num(x); draw(); } }));
  });
  const load = a => a.forEach((v, i) => { g[i] = v.slice(); fn[i].set(v[0]); fa[i].set(v[1]); });
  UI.buttons(b, [["Module example (10 \u00D7 $100, 90 \u00D7 $200)", () => { load([[10, 100], [90, 200], [0, 0]]); draw(); }],
    ["Quiz 2 (20 \u00D7 $50, 80 \u00D7 $100)", () => { load([[20, 50], [80, 100], [0, 0]]); draw(); }]]);
  const bx = UI.out(b), o = UI.out(b);
  function draw() {
    const act = g.filter(x => x[0] > 0), N = act.reduce((a, x) => a + x[0], 0);
    if (!N) { bx.innerHTML = ""; o.innerHTML = "Enter at least one group with orders above zero."; return; }
    const naive = act.reduce((a, x) => a + x[1], 0) / act.length, wt = act.reduce((a, x) => a + x[0] * x[1], 0) / N;
    const mx = Math.max(Math.abs(naive), Math.abs(wt), 1);
    UI.bars(bx, [{ label: "Naive mean of averages", value: Math.abs(naive), display: "$" + UI.f(naive, 2), color: "#c0392b" }, { label: "Weighted (true) average", value: Math.abs(wt), display: "$" + UI.f(wt, 2), color: "#1f7a52" }], { max: mx, top: false });
    o.innerHTML = `Weighted = (${act.map(x => `${x[0]} \u00D7 ${x[1]}`).join(" + ")}) / ${N} = <b>$${UI.f(wt, 2)}</b>. Naive = <b>$${UI.f(naive, 2)}</b>, off by <b>$${UI.f(Math.abs(naive - wt), 2)}</b>. Weight each group by its size: \u03A3 n\u00B7avg / \u03A3 n.`;
  }
  draw();
};

/* 4.6 relative time resolver */
Widgets.timeres = (b, UI) => {
  const D = (y, m, d) => new Date(Date.UTC(y, m, d)), iso = d => d.toISOString().slice(0, 10), DAY = 864e5;
  const phrases = [["lq", "last quarter"], ["lm", "last month"], ["lfm", "last full month"], ["ytd", "year to date"], ["l30", "last 30 days"], ["sqly", "same quarter last year"], ["tm", "this month so far"], ["l3c", "last 3 months (previous 3 full calendar months)"], ["l3r", "last 3 months (trailing 90 days)"]];
  const row = UI.row(b);
  const fd = UI.field(row, { label: "Today", type: "date", value: "2026-10-21", onInput: () => draw() });
  const sp = UI.select(row, { label: "Phrase", options: phrases, value: "lq", onChange: () => draw() });
  const sf = UI.select(row, { label: "Year starts", options: [[0, "1 January (calendar)"], [1, "1 February"], [3, "1 April"], [6, "1 July"], [9, "1 October"]], value: 0, onChange: () => draw() });
  const st = UI.select(row, { label: "Does today count?", options: [["0", "No: complete days only"], ["1", "Yes: include today"]], value: "0", onChange: () => draw() });
  UI.buttons(b, [["Module table (today 2026-10-21)", () => { fd.set("2026-10-21"); sf.set(0); st.set("0"); draw(); }], ["Fiscal year from 1 Feb", () => { sf.set(1); sp.set("lq"); draw(); }]]);
  const o = UI.out(b);
  function draw() {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fd.get());
    if (!m) { o.innerHTML = "Pick a valid date for today."; return; }
    const y = +m[1], mo = +m[2] - 1, d = +m[3], fs = +sf.get(), inc = st.get() === "1", t = D(y, mo, d);
    const off = ((mo - fs) % 12 + 12) % 12, qs = mo - off % 3;
    let a, e, note = "";
    switch (sp.get()) {
      case "lq": a = D(y, qs - 3, 1); e = D(y, qs, 1); break;
      case "lm": case "lfm": a = D(y, mo - 1, 1); e = D(y, mo, 1); break;
      case "ytd": a = D(mo >= fs ? y : y - 1, fs, 1); e = D(y, mo, d + 1); note = "Runs through today, so the end is tomorrow."; break;
      case "l30": e = D(y, mo, inc ? d + 1 : d); a = new Date(e - 30 * DAY); note = inc ? "With today counted the interval ends the next day; start moves to keep exactly 30 days." : ""; break;
      case "sqly": a = D(y - 1, qs, 1); e = D(y - 1, qs + 3, 1); break;
      case "tm": a = D(y, mo, 1); e = D(y, mo, d + 1); note = "Partial period: fine for a lookup, risky for a trend."; break;
      case "l3c": a = D(y, mo - 3, 1); e = D(y, mo, 1); break;
      default: e = D(y, mo, d); a = new Date(e - 90 * DAY); note = "Rolling reading of \u201Clast 3 months\u201D."; }
    const days = Math.round((e - a) / DAY);
    let lab = "";
    if (fs === 0 && /^(lq|sqly)$/.test(sp.get())) lab = ` : Q${Math.floor(a.getUTCMonth() / 3) + 1} ${a.getUTCFullYear()}`;
    o.innerHTML = `\u201C${phrases.find(p => p[0] === sp.get())[1]}\u201D \u2192 <span class="verdict">[${iso(a)}, ${iso(e)})${lab}</span> &nbsp; ${days} days<br>Half-open: the end date is excluded, so the next period starting on ${iso(e)} neither overlaps nor leaves a gap. ${note}`;
  }
  draw();
};

/* 4.6 fake drop */
Widgets.fakedrop = (b, UI) => {
  const s = { e: 21, n: 31, r: 100 };
  const row = UI.row(b);
  const se = UI.slider(row, { label: "Days complete this month", min: 1, max: 31, value: 21, onInput: v => { s.e = v; draw(); } });
  UI.slider(row, { label: "Days in a month", min: 28, max: 31, value: 31, onInput: v => { s.n = v; draw(); } });
  UI.slider(row, { label: "Steady daily revenue ($, illustrative)", min: 10, max: 1000, step: 10, value: 100, fmt: v => "$" + v, onInput: v => { s.r = v; draw(); } });
  const bx = UI.out(b), o = UI.out(b);
  function draw() {
    const e = Math.min(s.e, s.n), cur = s.r * e, prev = s.r * s.n, drop = 1 - e / s.n;
    UI.bars(bx, [{ label: "Previous month (full)", value: prev, display: "$" + UI.f(prev, 0), color: "#1f6f8b" }, { label: "This month (partial)", value: cur, display: "$" + UI.f(cur, 0), color: "#e8481c" }], { max: prev, top: false });
    o.innerHTML = `Apparent drop = 1 \u2212 ${e}/${s.n} = <span class="verdict">${pct(drop)}</span>, even though the daily rate never changed. Comparing per day (or complete periods only) shows <b>0.0%</b>. At 21 of 31 days the drop is ${pct(1 - 21 / 31)}.`;
  }
  draw();
};

/* 4.8 entity linking scorer */
Widgets.entlink = (b, UI) => {
  const C = [["Paris, France (city)", [1, .6, 1, .8]], ["Paris, Texas (city)", [1, .1, 1, .3]], ["Paris Retail Ltd (customer)", [.7, .2, .2, .2]], ["\u201CParis\u201D perfume line (product)", [.6, .1, 0, .1]]];
  const th = [1, 1, 2, 1], F = C.map(c => c[1].slice()), S = { T: 1, tau: .6, delta: .2, data: "off", fr: 12, tx: 0 };
  const row = UI.row(b);
  ["sim_lex", "P(e|m)", "type_fit", "coherence"].forEach((n, i) => UI.slider(row, { label: `\u03B8${i + 1} weight on ${n}`, min: 0, max: 4, step: .1, value: th[i], fmt: v => v.toFixed(1), onInput: v => { th[i] = v; draw(); } }));
  const tb = UI.el(`<table><thead><tr><th>Candidate e</th><th>sim_lex</th><th>P(e|m)</th><th>type_fit</th><th>coherence</th><th>score</th><th>P</th></tr></thead><tbody></tbody></table>`);
  const tbody = tb.querySelector("tbody"), cells = [];
  C.forEach((c, i) => {
    const tr = UI.el(`<tr><td>${c[0]}</td></tr>`);
    F[i].forEach((v, j) => { const td = UI.el(`<td class="num"><input type="number" min="0" max="1" step="0.1" value="${v}" aria-label="${c[0]} feature ${j + 1}" style="width:4.5rem"></td>`); td.firstChild.addEventListener("input", e => { F[i][j] = num(e.target.value); draw(); }); tr.appendChild(td); });
    const sc = UI.el(`<td class="num"></td>`), pp = UI.el(`<td class="num"></td>`); tr.appendChild(sc); tr.appendChild(pp); cells.push([sc, pp, tr]); tbody.appendChild(tr);
  });
  b.appendChild(tb);
  const r2 = UI.row(b);
  UI.slider(r2, { label: "Temperature T", min: .25, max: 4, step: .05, value: 1, fmt: v => v.toFixed(2), onInput: v => { S.T = v; draw(); } });
  UI.slider(r2, { label: "Accept threshold \u03C4", min: .3, max: .95, step: .01, value: .6, fmt: v => v.toFixed(2), onInput: v => { S.tau = v; draw(); } });
  UI.slider(r2, { label: "Margin \u03B4", min: 0, max: .5, step: .01, value: .2, fmt: v => v.toFixed(2), onInput: v => { S.delta = v; draw(); } });
  const r3 = UI.row(b);
  UI.select(r3, { label: "Step 3: check against the data", options: [["off", "Ignore the data"], ["on", "Apply store counts"]], value: "off", onChange: v => { S.data = v; draw(); } });
  UI.field(r3, { label: "Stores in Paris, France", type: "number", value: 12, attrs: 'min="0"', onInput: v => { S.fr = Math.max(0, num(v)); draw(); } });
  UI.field(r3, { label: "Stores in Paris, Texas", type: "number", value: 0, attrs: 'min="0"', onInput: v => { S.tx = Math.max(0, num(v)); draw(); } });
  const bx = UI.out(b), o = UI.out(b);
  function draw() {
    const sc = F.map(f => f.reduce((a, v, j) => a + th[j] * v, 0)), p0 = UI.softmax(sc, S.T);
    let p = p0.slice();
    if (S.data === "on") { const w = [S.fr > 0 ? 1 : 0, S.tx > 0 ? 1 : 0, 1, 1]; p = p0.map((v, i) => v * w[i]); const z = p.reduce((a, v) => a + v, 0); p = z > 0 ? p.map(v => v / z) : p.map(() => 0); }
    cells.forEach((c, i) => { c[0].textContent = UI.f(sc[i], 2); c[1].textContent = p[i].toFixed(3); c[2].classList.toggle("win", i === p.indexOf(Math.max(...p)) && Math.max(...p) > 0); });
    UI.bars(bx, C.map((c, i) => ({ label: c[0], value: p[i], display: p[i].toFixed(3) })), { max: 1 });
    const order = p.map((v, i) => i).sort((x, y) => p[y] - p[x]), p1 = p[order[0]], p2 = p[order[1]], mg = p1 - p2;
    let h;
    if (p1 <= 0) h = `No candidate has any data support: <span class="verdict">NIL</span> (report \u201Cnot found\u201D).`;
    else if (p1 >= S.tau - 1e-9 && mg >= S.delta - 1e-9) h = `P = ${p1.toFixed(3)} \u2265 \u03C4 ${S.tau.toFixed(2)} and margin ${mg.toFixed(3)} \u2265 \u03B4 ${S.delta.toFixed(2)}: <span class="verdict">accept ${C[order[0]][0]}</span>`;
    else h = `P = ${p1.toFixed(3)} (\u03C4 ${S.tau.toFixed(2)}), margin ${mg.toFixed(3)} (\u03B4 ${S.delta.toFixed(2)}): <span class="verdict">not confident enough: ask or state an assumption</span> (leading: ${C[order[0]][0]})`;
    o.innerHTML = h + `<br><span class="mini">Defaults reproduce the module (4.4, 3.4, 1.5, 0.8 \u2192 0.690, 0.254, 0.038, 0.019). Store counts apply to the two city candidates; the other two are left unchanged.</span>`;
  }
  draw();
};

/* 4.9 joint resolution */
Widgets.joint = (b, UI) => {
  const S = { psi: 1.5, sA: 4, joint: true, j: 10, K: 10 };
  UI.buttons(b, [["Resolve jointly (with \u03C8)", () => { S.joint = true; draw(); }, 1], ["Resolve one at a time", () => { S.joint = false; draw(); }, 1]]).firstChild.classList.add("on");
  const row = UI.row(b);
  UI.slider(row, { label: "\u03C8(Paris TX, Austin TX) bonus", min: 0, max: 3, step: .1, value: 1.5, fmt: v => v.toFixed(1), onInput: v => { S.psi = v; draw(); } });
  UI.slider(row, { label: "s_A: score of Austin, Texas (illustrative)", min: 0, max: 8, step: .1, value: 4, fmt: v => v.toFixed(1), onInput: v => { S.sA = v; draw(); } });
  const tb = UI.el(`<table><thead><tr><th>Joint assignment</th><th>Individual</th><th>\u03C8</th><th>Total</th></tr></thead><tbody></tbody></table>`);
  b.appendChild(tb);
  const bx = UI.out(b), o = UI.out(b);
  UI.el; b.appendChild(UI.el(`<h4>Why not just enumerate? K<sup>j</sup> assignments</h4>`));
  const r2 = UI.row(b);
  UI.slider(r2, { label: "Mentions j", min: 1, max: 12, value: 10, onInput: v => { S.j = v; cost(); } });
  UI.slider(r2, { label: "Candidates each K", min: 1, max: 20, value: 10, onInput: v => { S.K = v; cost(); } });
  const oc = UI.out(b);
  function cost() {
    const v = Math.pow(S.K, S.j), B = 5;
    oc.innerHTML = `${S.K}<sup>${S.j}</sup> = <b>${v < 1e12 ? Math.round(v).toLocaleString("en-US") : v.toExponential(2)}</b> joint assignments. Beam search with B = ${B} scores about ${S.j} \u00D7 ${B} \u00D7 ${S.K} = <b>${(S.j * B * S.K).toLocaleString("en-US")}</b> partial options instead (illustrative count).`;
  }
  function draw() {
    const psi = S.joint ? S.psi : 0, A = [["(Paris FR, Austin TX)", 4.4 + S.sA, 0], ["(Paris TX, Austin TX)", 3.4 + S.sA, psi]];
    const tot = A.map(a => a[1] + a[2]), p = UI.softmax(tot);
    tb.querySelector("tbody").innerHTML = A.map((a, i) => `<tr class="${tot[i] === Math.max(...tot) ? "win" : ""}"><td>${a[0]}</td><td class="num">${UI.f(a[1], 1)}</td><td class="num">${UI.f(a[2], 1)}</td><td class="num">${UI.f(tot[i], 1)}</td></tr>`).join("");
    UI.bars(bx, A.map((a, i) => ({ label: a[0], value: p[i], display: p[i].toFixed(3) })), { max: 1 });
    const w = p[0] >= p[1] ? 0 : 1, mg = Math.abs(p[0] - p[1]), ok = p[w] >= .6 - 1e-9 && mg >= .2 - 1e-9;
    o.innerHTML = `Leader: <b>${A[w][0]}</b> with P = ${p[w].toFixed(3)}, margin ${mg.toFixed(3)}. ` + (ok ? `Passes \u03C4 = 0.6 and \u03B4 = 0.2: accepted${p[w] < .65 ? `, but only just, so state the assumption (\u201Cinterpreting Paris as ${w ? "Paris, Texas" : "Paris, France"}\u201D)` : ""}.` : `Fails \u03C4 = 0.6 or \u03B4 = 0.2: ask or flag as ambiguous.`) +
      `<br>The assignment flips to Paris, Texas when \u03C8 &gt; 1.0 (4.4 vs. 3.4 + \u03C8). The Austin score cancels out: P = 1 / (1 + e<sup>\u2212(\u03C8 \u2212 1)</sup>) = ${sig(psi - 1).toFixed(3)}.`;
  }
  draw(); cost();
};

/* 4.10 calibration and temperature scaling */
Widgets.ece = (b, UI) => {
  const bins = [[.9, 100, 70], [.8, 0, 0], [.7, 0, 0], [.6, 0, 0]];
  let T = 1;
  const tb = UI.el(`<table><thead><tr><th>Bin</th><th>Stated confidence</th><th>Links made</th><th>Correct</th></tr></thead><tbody></tbody></table>`);
  const inputs = [];
  bins.forEach((r, i) => {
    const tr = UI.el(`<tr><td>${i + 1}</td></tr>`), ins = [];
    [["0.01", "0.99", "0.01"], ["0", "100000", "1"], ["0", "100000", "1"]].forEach((a, j) => {
      const td = UI.el(`<td class="num"><input type="number" min="${a[0]}" max="${a[1]}" step="${a[2]}" value="${r[j]}" aria-label="Bin ${i + 1} ${["confidence", "links made", "correct"][j]}" style="width:5.5rem"></td>`);
      td.firstChild.addEventListener("input", e => { r[j] = num(e.target.value); draw(); }); tr.appendChild(td); ins.push(td.firstChild);
    });
    inputs.push(ins); tb.querySelector("tbody").appendChild(tr);
  });
  b.appendChild(tb);
  const load = a => a.forEach((r, i) => { bins[i] = r.slice(); r.forEach((v, j) => { inputs[i][j].value = v; }); });
  UI.buttons(b, [["Module example (100 links at 90%, 70 correct)", () => { load([[.9, 100, 70], [.8, 0, 0], [.7, 0, 0], [.6, 0, 0]]); draw(); }],
    ["Illustrative mix of four bins", () => { load([[.9, 150, 105], [.8, 120, 84], [.7, 80, 52], [.6, 50, 38]]); draw(); }]]);
  const sl = UI.slider(b, { label: "Temperature T (confidence \u2192 sigmoid(logit/T))", min: .5, max: 4, step: .05, value: 1, fmt: v => v.toFixed(2), onInput: v => { T = v; draw(); } });
  const bx = UI.out(b), o = UI.out(b);
  const adj = (c, t) => { const q = Math.min(1 - 1e-6, Math.max(1e-6, c)); return sig(Math.log(q / (1 - q)) / t); };
  const ece = t => { const act = bins.filter(r => r[1] > 0), N = act.reduce((a, r) => a + r[1], 0); return N ? act.reduce((a, r) => a + (r[1] / N) * Math.abs(Math.min(r[2], r[1]) / r[1] - adj(r[0], t)), 0) : 0; };
  function draw() {
    const act = bins.filter(r => r[1] > 0);
    if (!act.length) { bx.innerHTML = ""; o.innerHTML = "Enter at least one bin with links made above zero."; return; }
    const N = act.reduce((a, r) => a + r[1], 0), e1 = ece(1), eT = ece(T);
    let best = 1, be = e1; for (let t = .5; t <= 4.001; t += .05) { const v = ece(t); if (v < be - 1e-12) { be = v; best = t; } }
    UI.bars(bx, [{ label: "ECE at T = 1", value: e1, display: e1.toFixed(3), color: "#c0392b" }, { label: `ECE at T = ${T.toFixed(2)}`, value: eT, display: eT.toFixed(3), color: "#1f7a52" }], { max: Math.max(e1, eT, .05), top: false });
    o.innerHTML = act.map(r => { const acc = Math.min(r[2], r[1]) / r[1]; return `bin @${r[0].toFixed(2)}: accuracy ${acc.toFixed(2)} vs. confidence ${adj(r[0], T).toFixed(3)} \u2192 gap ${Math.abs(acc - adj(r[0], T)).toFixed(3)} \u00D7 weight ${(r[1] / N).toFixed(2)}`; }).join("<br>") +
      `<br>ECE = <b>${eT.toFixed(3)}</b>. ` + (act.length === 1 && T === 1 ? "A single bin of 100 links at 90% with 70 correct gives |0.70 \u2212 0.90| = 0.20: overconfident. " : "") +
      `Best T on this grid: <b>${best.toFixed(2)}</b> (ECE ${be.toFixed(3)}). T &gt; 1 softens, T &lt; 1 sharpens; accuracy and ranking are unchanged.`;
  }
  draw();
};
