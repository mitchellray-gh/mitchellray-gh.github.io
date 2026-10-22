/* Shared loader for reference pages: fetches every lesson and returns parsed documents. */
window.loadAll = () => Promise.all(TRAINING.modules.map(m =>
  fetch("m" + m.id + ".html").then(r => r.text()).then(t => ({ m, doc: new DOMParser().parseFromString(t, "text/html") }))));
window.secOf = el => { const s = el.closest("section[data-toc]"); return s ? s.dataset.toc : ""; };
window.esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
