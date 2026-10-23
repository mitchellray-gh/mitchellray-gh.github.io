/* Lesson engine. Page contract: <body data-module="N"><main id="lesson"><section data-toc="Title">...</section></main> + scripts.
   Widgets: <div class="widget" data-w="name" data-title="Try it: ..."></div>, registered via Widgets.name = (el, UI) => {...}
   Quizzes: <div class="check"><ol><li><span class="q">Question</span><span class="a">Answer</span></li></ol></div> */
window.Widgets = window.Widgets || {};
window.UI = (function () {
  const f = (x, d = 2) => (isFinite(x) ? (+x).toFixed(d) : "\u221E");
  const el = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const softmax = (z, T = 1) => { const m = Math.max(...z), e = z.map(v => Math.exp((v - m) / T)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
  const entropy = p => -p.reduce((a, v) => a + (v > 0 ? v * Math.log(v) : 0), 0);
  let uid = 0;
  /* slider({label,min,max,step,value,fmt,onInput}) -> {set,get,box} appended to parent */
  function slider(parent, o) {
    const id = "s" + ++uid, fmt = o.fmt || (v => v);
    const box = el(`<div class="ctl"><label for="${id}">${o.label}<output></output></label><input id="${id}" type="range" min="${o.min}" max="${o.max}" step="${o.step || 1}" value="${o.value}"></div>`);
    const inp = box.querySelector("input"), out = box.querySelector("output");
    const upd = () => { out.textContent = fmt(+inp.value); };
    inp.addEventListener("input", () => { upd(); o.onInput && o.onInput(+inp.value); });
    upd(); parent.appendChild(box);
    return { box, get: () => +inp.value, set: v => { inp.value = v; upd(); } };
  }
  /* field({label,type,value,onInput}) text/number/date input */
  function field(parent, o) {
    const id = "f" + ++uid;
    const box = el(`<div class="ctl"><label for="${id}">${o.label}</label><input id="${id}" type="${o.type || "text"}" value="${esc(o.value ?? "")}" ${o.attrs || ""}></div>`);
    const inp = box.querySelector("input");
    inp.addEventListener("input", () => o.onInput && o.onInput(inp.value));
    parent.appendChild(box);
    return { box, input: inp, get: () => inp.value, set: v => { inp.value = v; } };
  }
  /* select({label,options:[[value,label]],value,onChange}) */
  function select(parent, o) {
    const id = "d" + ++uid;
    const box = el(`<div class="ctl"><label for="${id}">${o.label}</label><select id="${id}">${o.options.map(([v, l]) => `<option value="${esc(v)}" ${v == o.value ? "selected" : ""}>${l}</option>`).join("")}</select></div>`);
    const s = box.querySelector("select");
    s.addEventListener("change", () => o.onChange && o.onChange(s.value));
    parent.appendChild(box);
    return { box, get: () => s.value, set: v => { s.value = v; } };
  }
  /* buttons(parent,[[label,fn,toggleGroup?]]) */
  function buttons(parent, list) {
    const wrap = el(`<div class="row"></div>`);
    list.forEach(([label, fn, toggle]) => {
      const b = el(`<button type="button">${label}</button>`);
      b.addEventListener("click", () => {
        if (toggle) wrap.querySelectorAll("button.on").forEach(x => x.classList.remove("on"));
        if (toggle) b.classList.add("on");
        fn(b);
      });
      wrap.appendChild(b);
    });
    parent.appendChild(wrap); return wrap;
  }
  /* bars(container, items:[{label,value,display?,color?}], {max,top}) re-renders in place */
  function bars(c, items, o = {}) {
    const max = o.max || 1, best = Math.max(...items.map(i => i.value));
    c.classList.add("bars");
    c.innerHTML = items.map(i => `<div class="b ${o.top !== false && i.value === best ? "top" : ""}"><span>${i.label}</span><span class="t"><i style="width:${Math.max(0, Math.min(100, 100 * i.value / max))}%;${i.color ? "background:" + i.color : ""}"></i></span><span class="v">${i.display ?? f(i.value)}</span></div>`).join("");
  }
  const out = (parent, cls = "") => { const d = el(`<div class="out ${cls}"></div>`); parent.appendChild(d); return d; };
  const row = parent => { const d = el(`<div class="row"></div>`); parent.appendChild(d); return d; };
  const svg = (parent, w, h, inner) => { const d = el(`<div class="diagram"><svg viewBox="0 0 ${w} ${h}" role="img">${inner || ""}</svg></div>`); parent.appendChild(d); return d.querySelector("svg"); };
  return { f, el, esc, softmax, entropy, slider, field, select, buttons, bars, out, row, svg };
})();

document.addEventListener("DOMContentLoaded", function () {
  const T = window.TRAINING, n = +document.body.dataset.module, m = T.modules.find(x => x.id === n), KEY = "training-done";
  const getDone = () => new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  const setDone = s => localStorage.setItem(KEY, JSON.stringify([...s]));
  const stage = ["Relevance", "Concept mapping", "Implicit links", "Intent & entities", "Matching & ranking", "Answer selection"];
  const stageSub = ["Which sources matter?", "Same meaning, many words", "How data connects", "What shape, which things", "Which field, how sure", "Answer, hedge or ask"];
  const page = id => `m${id}.html`;
  document.title = `Module ${n}: ${m.title} | Training`;
  const lesson = document.getElementById("lesson");
  const words = lesson.textContent.trim().split(/\s+/).length, mins = Math.max(5, Math.round(words / 180));
  const dn = getDone();

  document.body.insertAdjacentHTML("afterbegin", `<div id="rp"></div>
  <div class="topbar"><div class="in"><a class="logo" href="../">Mitchell Ray<span>.</span></a>
  <nav><a href="./">All modules</a><a href="${m.file}" download>Original PDF</a></nav></div></div>
  <div class="hero"><div class="eyebrow"><b>&sect;</b> Module ${n} of ${T.modules.length}</div>
  <h1>${UI.esc(m.title)}</h1><p class="sub">${UI.esc(m.subtitle)}</p>
  <div class="meta"><span>${mins} min read</span><span>${lesson.querySelectorAll(".widget").length} interactive tools</span><span>${m.objectives.length} learning objectives</span></div>
  <div class="pmap">${T.modules.map(x => `<a href="${page(x.id)}" class="${x.id === n ? "cur" : ""} ${dn.has(x.id) ? "done" : ""}">${x.id}. ${stage[x.id - 1]}<small>${stageSub[x.id - 1]}</small></a>`).join("")}</div>
  <div class="objcard"><h3>By the end of this module you can</h3><ol>${m.objectives.map(o => `<li>${UI.esc(o)}</li>`).join("")}</ol></div>
  <p class="legend">Everything from the original PDF is here. <i style="background:var(--accent)"></i><b>Orange boxes</b> (&ldquo;In plain English&rdquo;), <i style="background:var(--green)"></i><b>green analogies</b>, diagrams and the <b>interactive tools</b> are additions to help it click.</p></div>
  <div class="layout"><aside class="toc"><h4>On this page</h4></aside></div>`);
  const layout = document.querySelector(".layout");
  layout.appendChild(lesson);
  if (m.summary) lesson.insertAdjacentHTML("afterbegin", `<div class="summary"><h3>The big picture in one paragraph</h3><p>${UI.esc(m.summary).replace(/(The question:|In:|Out:|Why it matters:)/g, "<b>$1</b>")}</p></div>`);

  // TOC + scroll spy
  const secs = [...lesson.querySelectorAll("section[data-toc]")], toc = layout.querySelector(".toc");
  secs.forEach((s, i) => { s.id = s.id || "sec" + i; toc.insertAdjacentHTML("beforeend", `<a href="#${s.id}">${UI.esc(s.dataset.toc)}</a>`); });
  const links = [...toc.querySelectorAll("a")];
  const spy = () => {
    const y = window.scrollY + 120; let cur = 0;
    secs.forEach((s, i) => { if (s.offsetTop <= y) cur = i; });
    links.forEach((a, i) => a.classList.toggle("on", i === cur));
    const h = document.documentElement; document.getElementById("rp").style.width = (100 * window.scrollY / (h.scrollHeight - h.clientHeight || 1)) + "%";
  };
  window.addEventListener("scroll", spy, { passive: true }); spy();

  // quizzes
  lesson.querySelectorAll(".check").forEach(c => {
    c.querySelectorAll("li").forEach(li => {
      const a = li.querySelector(".a"); if (!a) return;
      const tools = UI.el(`<div class="tools"><input placeholder="Your answer (optional)"><button type="button">Reveal answer</button></div>`);
      li.appendChild(tools); li.appendChild(a);
      tools.querySelector("button").addEventListener("click", e => { a.classList.toggle("show"); e.target.textContent = a.classList.contains("show") ? "Hide answer" : "Reveal answer"; });
    });
  });

  // widgets
  lesson.querySelectorAll(".widget[data-w]").forEach(w => {
    const title = w.dataset.title || "Try it", name = w.dataset.w;
    w.innerHTML = `<div class="wh"><i>Interactive</i>${UI.esc(title)}</div><div class="wb"></div>`;
    const body = w.querySelector(".wb");
    try { if (!Widgets[name]) throw new Error("missing widget " + name); Widgets[name](body, UI); }
    catch (e) { body.innerHTML = `<p class="mini">This tool failed to load (${UI.esc(e.message)}).</p>`; console.error(e); }
  });

  // footer pager
  const prev = T.modules.find(x => x.id === n - 1), next = T.modules.find(x => x.id === n + 1);
  const pager = UI.el(`<div class="pager"><div>${prev ? `<a class="btn" href="${page(prev.id)}">&larr; Module ${prev.id}</a>` : `<a class="btn" href="./">&larr; All modules</a>`}</div>
    <button class="btn ${dn.has(n) ? "done" : ""}" id="mk">${dn.has(n) ? "\u2713 Completed" : "Mark module complete"}</button>
    <div>${next ? `<a class="btn primary" href="${page(next.id)}">Module ${next.id}: ${UI.esc(stage[next.id - 1])} &rarr;</a>` : `<a class="btn primary" href="./">Back to all modules</a>`}</div></div>`);
  if (m.mistakes) lesson.appendChild(UI.el(`<div class="mistakes"><h3>Common mistakes to avoid</h3><ul>${m.mistakes.map(x => `<li>${UI.esc(x)}</li>`).join("")}</ul></div>`));
  lesson.appendChild(pager);
  pager.querySelector("#mk").addEventListener("click", e => {
    const s = getDone(); s.has(n) ? s.delete(n) : s.add(n); setDone(s);
    e.target.classList.toggle("done", s.has(n)); e.target.textContent = s.has(n) ? "\u2713 Completed" : "Mark module complete";
    document.querySelector(".pmap a.cur").classList.toggle("done", s.has(n));
  });
  // keep SVG text legible on narrow screens: scroll sideways instead of shrinking below 1x
  document.querySelectorAll("svg.diagram[viewBox]").forEach(s => {
    const w = document.createElement("div"); w.className = "svgscroll"; s.replaceWith(w); w.appendChild(s);
  });
  const fit = () => lesson.querySelectorAll("svg[viewBox]").forEach(s => {
    const vw = s.viewBox.baseVal.width;
    s.style.minWidth = innerWidth < 700 ? Math.round(vw * 1.0) + "px" : "";
  });
  fit(); addEventListener("resize", fit);
  new MutationObserver(fit).observe(lesson, { childList: true, subtree: true });
  document.body.insertAdjacentHTML("beforeend", `<footer class="sf">&copy; Mitchell Ray &middot; Training material</footer>`);
});
