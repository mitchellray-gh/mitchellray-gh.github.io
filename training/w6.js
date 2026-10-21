window.Widgets = window.Widgets || {};

Widgets.utility = (body, UI) => {
  const row = UI.row(body), s = { p: .70, g: 1, l: 2 };
  const controls = [
    UI.slider(row, { label: "P(correct)", min: 0, max: 1, step: .01, value: s.p, fmt: v => v.toFixed(2), onInput: v => { s.p = v; draw(); } }),
    UI.slider(row, { label: "Gain G if correct", min: 0, max: 5, step: .1, value: s.g, fmt: v => v.toFixed(1), onInput: v => { s.g = v; draw(); } }),
    UI.slider(row, { label: "Loss L if wrong", min: 0, max: 10, step: .1, value: s.l, fmt: v => v.toFixed(1), onInput: v => { s.l = v; draw(); } })
  ];
  const table = UI.el(`<table><thead><tr><th>Loss ratio L : G</th><th class="num">Break-even P</th></tr></thead><tbody><tr><td>1 : 1</td><td class="num">0.50</td></tr><tr><td>2 : 1</td><td class="num">0.67</td></tr><tr><td>4 : 1</td><td class="num">0.80</td></tr><tr><td>9 : 1</td><td class="num">0.90</td></tr></tbody></table>`);
  body.appendChild(table);
  const out = UI.out(body);
  function draw() {
    const eu = s.p * s.g - (1 - s.p) * s.l;
    const den = s.g + s.l;
    const be = den ? s.l / den : null;
    out.className = "out " + (eu > 0 ? "good" : eu < 0 ? "bad" : "mid");
    out.innerHTML = `EU = ${UI.f(s.p, 2)} × ${UI.f(s.g, 1)} − ${UI.f(1 - s.p, 2)} × ${UI.f(s.l, 1)} = <b>${eu >= 0 ? "+" : ""}${UI.f(eu, 3)}</b>.<br>` +
      (be === null ? "With G = L = 0, every confidence gives EU = 0; there is no strict break-even threshold." : `Break-even confidence = L / (G + L) = <b>${UI.f(be, 3)}</b>. ` + (s.p > be ? "Answering has positive expected utility." : s.p === be ? "This is exactly break-even." : "The expected utility is non-positive; consider abstaining."));
  }
  draw();
};

Widgets.feasibility = (body, UI) => {
  const constraints = ["κ₁ · Q3", "κ₂ · EMEA", "κ₃ · Excludes returns"], required = [true, true, true];
  const checks = UI.row(body);
  constraints.forEach((label, i) => {
    const id = `m6-k${i}`;
    const wrap = UI.el(`<label class="ctl" for="${id}"><input id="${id}" type="checkbox" checked> ${label} (required)</label>`);
    wrap.querySelector("input").addEventListener("change", e => { required[i] = e.target.checked; draw(); });
    checks.appendChild(wrap);
  });
  const candidates = [
    { name: "A₁ · Gross revenue summary", score: .85, meets: [true, true, false] },
    { name: "A₂ · Net revenue summary", score: .72, meets: [true, true, true] },
    { name: "A₃ · Transactions, returns filtered", score: .65, meets: [true, true, true] }
  ];
  const view = UI.el("<div></div>"); body.appendChild(view);
  const out = UI.out(body);
  function draw() {
    const states = candidates.map(c => ({ c, ok: c.meets.every((v, i) => !required[i] || v) }));
    const feasible = states.filter(x => x.ok), winner = feasible.reduce((best, x) => !best || x.c.score > best.c.score ? x : best, null);
    view.innerHTML = `<table><thead><tr><th>Candidate</th><th class="num">Score</th><th>Q3</th><th>EMEA</th><th>No returns</th><th>Feasible?</th></tr></thead><tbody>${states.map(({ c, ok }) => `<tr class="${winner && winner.c === c ? "win" : !ok ? "lose" : ""}"><td>${c.name}</td><td class="num">${c.score.toFixed(2)}</td>${c.meets.map((v, i) => `<td>${!required[i] ? "— (not required)" : v ? "✓" : "✗"}</td>`).join("")}<td>${ok ? "Yes" : "No"}</td></tr>`).join("")}</tbody></table>`;
    out.className = "out " + (winner ? "good" : "bad");
    out.innerHTML = winner ? `Filter first, then optimize: <b>${winner.c.name}</b> wins among ${feasible.length} feasible candidate${feasible.length === 1 ? "" : "s"}. The 0.85 gross-revenue candidate cannot trade away a required filter.` : "No candidate satisfies every selected hard constraint. Do not relax them silently; report which requirement cannot be met.";
  }
  draw();
};

Widgets.agreement = (body, UI) => {
  const row = UI.row(body), s = { prior: .70, p2: .60, coincidence: .05 };
  UI.slider(row, { label: "Prior P(A₁ correct)", min: 0, max: 1, step: .01, value: s.prior, fmt: v => v.toFixed(2), onInput: v => { s.prior = v; draw(); } });
  UI.slider(row, { label: "Independent P(A₂ correct)", min: 0, max: 1, step: .01, value: s.p2, fmt: v => v.toFixed(2), onInput: v => { s.p2 = v; draw(); } });
  UI.slider(row, { label: "Coincidental match probability", min: 0, max: .5, step: .01, value: s.coincidence, fmt: v => v.toFixed(2), onInput: v => { s.coincidence = v; draw(); } });
  const row2 = UI.row(body);
  UI.select(row2, { label: "If results disagree, what pattern do you see?", options: [["multiple", "Exact multiple (2×, 3×)"], ["steady", "Small, steady percentage gap"], ["period", "One period differs"], ["sign", "Opposite sign"]], value: "multiple", onChange: v => { s.pattern = v; draw(); } });
  s.pattern = "multiple";
  const clues = { multiple: "Likely fan-out join (Module 3).", steady: "Likely different definition (gross vs. net) or an exclusion rule.", period: "Likely time-window or partial-period mismatch (Module 4).", sign: "Likely refunds or credits treated differently." };
  const out = UI.out(body);
  function draw() {
    const likeH = s.p2 + (1 - s.p2) * s.coincidence;
    const likeNotH = s.coincidence;
    const yes = s.prior * likeH, no = (1 - s.prior) * likeNotH, z = yes + no;
    const post = z > 0 ? yes / z : 0;
    out.className = "out " + (post >= .8 ? "good" : "mid");
    out.innerHTML = `P(agree | H) = ${UI.f(s.p2, 2)} + ${UI.f(1 - s.p2, 2)} × ${UI.f(s.coincidence, 2)} = <b>${UI.f(likeH, 3)}</b>; P(agree | ¬H) = <b>${UI.f(likeNotH, 3)}</b>.<br>` +
      `P(H | agree) = ${UI.f(s.prior, 2)} × ${UI.f(likeH, 3)} / (${UI.f(s.prior, 2)} × ${UI.f(likeH, 3)} + ${UI.f(1 - s.prior, 2)} × ${UI.f(likeNotH, 3)}) = <b>${UI.f(post, 3)}</b>. ` +
      `Agreement ${post >= s.prior ? "raises" : "does not raise"} confidence from ${UI.f(s.prior * 100, 0)}% to ${UI.f(post * 100, 1)}%.<br><b>Disagreement clue:</b> ${clues[s.pattern]}`;
  }
  draw();
};

Widgets.action = (body, UI) => {
  const row = UI.row(body), s = { p: .60, cost: .30 };
  const pControl = UI.slider(row, { label: "P(w₁), the leading interpretation", min: .5, max: 1, step: .01, value: s.p, fmt: v => v.toFixed(2), onInput: v => { s.p = v; draw(); } });
  const cControl = UI.slider(row, { label: "Cost of asking c", min: 0, max: 1, step: .05, value: s.cost, fmt: v => v.toFixed(2), onInput: v => { s.cost = v; draw(); } });
  UI.buttons(body, [["PDF example · P = 0.6, c = 0.3", () => { s.p = .6; s.cost = .3; pControl.set(s.p); cControl.set(s.cost); draw(); }], ["More confidence · P = 0.9, c = 0.3", () => { s.p = .9; s.cost = .3; pControl.set(s.p); cControl.set(s.cost); draw(); }]]);
  const chart = UI.svg(body, 560, 220); chart.setAttribute("aria-label", "Expected utility bars for answer, hedge, and ask");
  const out = UI.out(body);
  function draw() {
    const answer = s.p - (1 - s.p) * 2;
    const hedge = s.p - (1 - s.p) * .5;
    const ask = 1 - s.cost;
    const vals = [{ n: "Answer", v: answer, c: "#e8481c" }, { n: "Hedge", v: hedge, c: "#1f6f8b" }, { n: "Ask", v: ask, c: "#1f7a52" }];
    const min = -1, max = 1, x0 = 135, w = 370, scale = w / (max - min), zero = x0 + (0 - min) * scale;
    chart.innerHTML = `<line x1="${zero}" y1="24" x2="${zero}" y2="188" stroke="#1a1815" stroke-dasharray="4 3"/><text x="${zero}" y="211" text-anchor="middle" font-size="11">EU = 0</text>` +
      vals.map((x, i) => { const y = 42 + i * 52, end = x0 + (x.v - min) * scale, left = Math.min(zero, end), width = Math.abs(end - zero); return `<text x="8" y="${y + 18}" font-size="13">${x.n}</text><rect x="${left}" y="${y}" width="${width}" height="28" fill="${x.c}"/><text x="${Math.max(x0, end + 5)}" y="${y + 19}" font-size="12">${UI.f(x.v, 2)}</text>`; }).join("") + `<text x="${x0}" y="18" font-size="10">−1</text><text x="${x0 + w}" y="18" text-anchor="end" font-size="10">+1</text>`;
    const bestValue = Math.max(answer, hedge, ask), winners = vals.filter(x => Math.abs(x.v - bestValue) < 1e-9).map(x => x.n);
    const voi = 1 - answer;
    out.className = "out " + (winners.includes("Ask") ? "good" : "mid");
    out.innerHTML = `Answer = ${UI.f(s.p, 2)} − ${UI.f(1 - s.p, 2)}×2 = <b>${UI.f(answer, 2)}</b>; hedge = ${UI.f(s.p, 2)} − ${UI.f(1 - s.p, 2)}×0.5 = <b>${UI.f(hedge, 2)}</b>; ask = 1 − ${UI.f(s.cost, 2)} = <b>${UI.f(ask, 2)}</b>.<br>` +
      `VOI vs. a silent answer = 1 − (${UI.f(answer, 2)}) = <b>${UI.f(voi, 2)}</b>; ask when this exceeds c. Best action by expected utility: <b>${winners.join(" / ")}</b>.`;
  }
  draw();
};

Widgets.risk = (body, UI) => {
  const data = [{ t: "0.0", a: 100, w: 20, cov: 1, risk: .20 }, { t: "0.5", a: 80, w: 10, cov: .8, risk: .125 }, { t: "0.7", a: 60, w: 3, cov: .6, risk: .05 }, { t: "0.9", a: 30, w: 1, cov: .3, risk: 1 / 30 }];
  const s = { point: 2, target: .05 }, row = UI.row(body);
  const pCtl = UI.slider(row, { label: "Threshold operating point τ", min: 0, max: 3, step: 1, value: s.point, fmt: v => data[Math.round(v)].t, onInput: v => { s.point = Math.round(v); draw(); } });
  const rCtl = UI.slider(row, { label: "Maximum acceptable risk", min: 0, max: .2, step: .005, value: s.target, fmt: v => `${(100 * v).toFixed(1)}%`, onInput: v => { s.target = v; draw(); } });
  const table = UI.el(`<table><thead><tr><th>Threshold τ</th><th>Answered</th><th>Wrong</th><th>Coverage</th><th>Risk</th></tr></thead><tbody></tbody></table>`); body.appendChild(table);
  const out = UI.out(body);
  function draw() {
    const selected = data[s.point], recommended = data.find(x => x.risk <= s.target);
    table.querySelector("tbody").innerHTML = data.map(x => `<tr class="${x === selected ? "win" : ""}"><td>${x.t}</td><td>${x.a}</td><td>${x.w}</td><td>${(x.cov * 100).toFixed(0)}%</td><td>${(x.risk * 100).toFixed(1)}%</td></tr>`).join("");
    out.className = "out " + (selected.risk <= s.target ? "good" : "bad");
    out.innerHTML = `At τ = ${selected.t}: coverage ${(selected.cov * 100).toFixed(0)}%, risk ${(selected.risk * 100).toFixed(1)}% (${selected.w}/${selected.a} wrong). ` +
      (recommended ? `For a risk budget of ${(s.target * 100).toFixed(1)}%, τ* = <b>${recommended.t}</b>, the lowest listed threshold that meets the target; it answers ${recommended.a}% of questions.` : `No listed threshold meets the ${(s.target * 100).toFixed(1)}% risk budget; abstain more or improve calibration.`);
  }
  draw();
};

Widgets.precision = (body, UI) => {
  const row = UI.row(body), s = { eps: .05, value: 1047382 };
  UI.slider(row, { label: "Relative uncertainty ε", min: .001, max: .10, step: .001, value: s.eps, fmt: v => `${(100 * v).toFixed(1)}%`, onInput: v => { s.eps = v; draw(); } });
  UI.field(row, { label: "Estimated value ($)", type: "number", value: s.value, attrs: "min=0 step=any", onInput: v => { const n = Number(v); s.value = Number.isFinite(n) && n >= 0 ? n : 0; draw(); } });
  const out = UI.out(body);
  function draw() {
    const sig = Math.max(1, Math.min(15, Math.ceil(-Math.log10(s.eps)) + 1));
    const rounded = Number(s.value.toPrecision(sig));
    let formatted;
    if (rounded >= 1e6 || (rounded > 0 && rounded < .01)) formatted = `$${rounded.toPrecision(sig)}`;
    else formatted = `$${rounded.toLocaleString("en-US", { maximumSignificantDigits: sig })}`;
    out.className = "out good";
    out.innerHTML = `−log₁₀ ε = <b>${UI.f(-Math.log10(s.eps), 2)}</b>; meaningful significant figures ≈ ⌈−log₁₀ ε⌉ + 1 = <b>${sig}</b>.<br>Report <span class="big">${formatted}</span> instead of implying unsupported precision.`;
  }
  draw();
};

Widgets.intent = (body, UI) => {
  const formats = {
    "lookup / count": ["One headline number", "State the requested value directly; add a small qualifier if needed."],
    aggregate: ["Table or bar chart by group", "Keep categories comparable and show the totals or denominator."],
    trend: ["Line chart over time", "Use an explicit time axis and clarify complete vs. partial periods."],
    compare: ["Paired values with the difference and % change", "Put both values, the absolute change, and relative change together."],
    rank: ["Ordered bar chart or table", "Sort consistently and make rank direction explicit."],
    distribution: ["Histogram or shares of a whole", "Show the distribution, not only an average."],
    explain: ["Waterfall: start → contributions → end", "Lead with the change, then show which segments caused or offset it."]
  };
  const row = UI.row(body), options = Object.keys(formats).map(x => [x, x[0].toUpperCase() + x.slice(1)]);
  UI.select(row, { label: "Detected question intent", options, value: "explain", onChange: v => draw(v) });
  const cards = UI.el('<div class="cards"></div>'); body.appendChild(cards);
  function draw(selected = "explain") {
    cards.innerHTML = Object.entries(formats).map(([intent, f]) => `<div class="card" style="${intent === selected ? "border:2px solid var(--green);background:#eef6f3" : ""}"><h5>${intent === selected ? "Selected · " : ""}${intent}</h5><p><b>${f[0]}</b></p><p class="dim">${f[1]}</p></div>`).join("");
  }
  draw();
};

Widgets.pipeline = (body, UI) => {
  const steps = [
    { title: "Module 1 · Relevance", detail: "Hybrid relevance × prior favours the certified monthly revenue summary. Source confidence is 0.70.", conf: .70 },
    { title: "Module 2 · Concept mapping", detail: "Revenue means net revenue (curated default); EMEA maps to Region; test accounts maps to the TestAccount flag.", conf: .70 },
    { title: "Module 3 · Implicit relationships", detail: "A Steiner tree links Transactions → Customers → Regions and Transactions → Products at cost ≈ 0.25 (P ≈ e⁻⁰·²⁵ ≈ 0.78). Many-to-one revenue flow avoids fan-out; explicit test-account exclusion has P = 1.", conf: .70 },
    { title: "Module 4 · Intent and entities", detail: "Explain (0.85) plus compare (0.80) selects the explain template; SUM aggregates two complete calendar months.", conf: .70 },
    { title: "Module 5 · Matching, checks and ranking", detail: "Hungarian matching assigns revenue, region, date and test-flag fields; EMEA is an exact region match. Combined five-stage confidence: 0.85 × 0.70 × 0.90 × 0.95 × 0.90 ≈ 0.46.", conf: .46 },
    { title: "Module 6 · Answer selection", detail: "Independent reference agreement (September $4.42M) updates confidence to ≈ 0.89. All hard constraints pass; hedge the answer with calendar-month and net-revenue assumptions.", conf: .89 }
  ];
  let index = 0;
  const status = UI.out(body);
  const controls = UI.el('<div class="step-control"><button type="button" data-prev>← Previous</button><button type="button" data-next>Next step →</button><button type="button" data-reset>Start over</button><output aria-live="polite"></output></div>');
  controls.querySelector("[data-prev]").addEventListener("click", () => { index = Math.max(0, index - 1); draw(); });
  controls.querySelector("[data-next]").addEventListener("click", () => { index = Math.min(steps.length - 1, index + 1); draw(); });
  controls.querySelector("[data-reset]").addEventListener("click", () => { index = 0; draw(); });
  body.appendChild(controls);
  const detail = UI.el('<div class="pipeline-detail" aria-live="polite"></div>'); body.appendChild(detail);
  const confidence = UI.svg(body, 560, 180); confidence.setAttribute("aria-label", "Confidence evolves from 0.70 at source selection to 0.46 after five stages and 0.89 after independent agreement");
  const waterfall = UI.svg(body, 640, 250); waterfall.setAttribute("aria-label", "Hypothetical revenue waterfall from August 5.00 million to September 4.40 million");
  function draw() {
    const step = steps[index];
    controls.querySelector("output").textContent = `Stage ${index + 1} of ${steps.length}: ${step.title}`;
    controls.querySelector("[data-prev]").disabled = index === 0;
    controls.querySelector("[data-next]").disabled = index === steps.length - 1;
    detail.innerHTML = `<b>${step.title}</b><p>${step.detail}</p>`;
    const pts = [{ x: 75, y: 125 - .70 * 95, l: "Source selection", v: .70 }, { x: 280, y: 125 - .46 * 95, l: "All five stages", v: .46 }, { x: 485, y: 125 - .89 * 95, l: "Agreement", v: .89 }];
    const highlighted = index < 4 ? 0 : index === 4 ? 1 : 2;
    confidence.innerHTML = `<line x1="48" y1="130" x2="535" y2="130" stroke="#1a1815"/><line x1="48" y1="35" x2="48" y2="130" stroke="#1a1815"/>` +
      [0, .5, 1].map(v => `<line x1="44" y1="${130 - v * 95}" x2="535" y2="${130 - v * 95}" stroke="#d8d2c4"/><text x="8" y="${134 - v * 95}" font-size="10">${v.toFixed(1)}</text>`).join("") +
      `<polyline points="${pts.map(p => `${p.x},${p.y}`).join(" ")}" fill="none" stroke="#1f6f8b" stroke-width="3"/>` +
      pts.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="${i === highlighted ? 8 : 5}" fill="${i === highlighted ? "#e8481c" : "#1f6f8b"}"/><text x="${p.x}" y="${p.y - 12}" text-anchor="middle" font-size="12" font-weight="700">${p.v.toFixed(2)}</text><text x="${p.x}" y="153" text-anchor="middle" font-size="11">${p.l}</text>`).join("");
    const vals = [5.00, -.45, -.20, .05, 0];
    const names = ["Aug", "Germany", "France", "UK", "Other", "Sep"];
    const cumulative = [5, 4.55, 4.35, 4.40, 4.40];
    const top = 45, bottom = 200, scale = (bottom - top) / 5.5, baseY = bottom;
    let bars = `<line x1="34" y1="${baseY}" x2="615" y2="${baseY}" stroke="#1a1815"/>`;
    const xs = [55, 145, 235, 325, 415, 525], bw = 54;
    bars += `<rect x="${xs[0]}" y="${baseY - 5 * scale}" width="${bw}" height="${5 * scale}" fill="#1f6f8b"/><text x="${xs[0] + bw / 2}" y="${baseY - 5 * scale - 7}" text-anchor="middle" font-size="11">$5.00M</text>`;
    let previous = 5;
    for (let i = 1; i <= 4; i++) {
      const change = vals[i], current = cumulative[i];
      const y1 = baseY - previous * scale, y2 = baseY - current * scale;
      const rectY = Math.min(y1, y2), rectH = Math.max(2, Math.abs(y2 - y1));
      const color = change < 0 ? "#e8481c" : change > 0 ? "#1f7a52" : "#9b9487";
      bars += `<line x1="${xs[i - 1] + bw}" y1="${y1}" x2="${xs[i]}" y2="${y1}" stroke="#6f685b" stroke-dasharray="3 3"/><rect x="${xs[i]}" y="${rectY}" width="${bw}" height="${rectH}" fill="${color}"/><text x="${xs[i] + bw / 2}" y="${rectY - 6}" text-anchor="middle" font-size="10">${change < 0 ? "−" : change > 0 ? "+" : ""}$${Math.abs(change).toFixed(2)}M</text>`;
      previous = current;
    }
    bars += `<line x1="${xs[4] + bw}" y1="${baseY - 4.4 * scale}" x2="${xs[5]}" y2="${baseY - 4.4 * scale}" stroke="#6f685b" stroke-dasharray="3 3"/><rect x="${xs[5]}" y="${baseY - 4.4 * scale}" width="${bw}" height="${4.4 * scale}" fill="#1f6f8b"/><text x="${xs[5] + bw / 2}" y="${baseY - 4.4 * scale - 7}" text-anchor="middle" font-size="11">$4.40M</text>`;
    bars += names.map((name, i) => `<text x="${xs[i] + bw / 2}" y="220" text-anchor="middle" font-size="10">${name}</text>`).join("");
    bars += `<text x="335" y="242" text-anchor="middle" font-size="11" fill="#6f685b">Hypothetical change contributions · total −$0.60M (−12%)</text>`;
    waterfall.innerHTML = bars;
    status.innerHTML = `The confidence chart highlights <b>${step.title}</b> at ${step.conf.toFixed(2)}. The waterfall shows Aug $5.00M → Germany −$0.45M → France −$0.20M → UK +$0.05M → Other $0.00M → Sep $4.40M.`;
  }
  draw();
};