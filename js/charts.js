(function () {
  "use strict";
  const instances = new Map();

  function showEmpty(canvas, message) {
    const panel = canvas.closest(".chartPanel");
    const wrap = panel && panel.querySelector(".chartCanvasWrap");
    const empty = panel && panel.querySelector(".chartEmpty");
    const chart = instances.get(canvas.id);
    if (chart) { chart.destroy(); instances.delete(canvas.id); }
    if (wrap) wrap.hidden = true;
    if (empty) { empty.hidden = false; empty.textContent = message; }
  }
  function render(canvasId, config, accessibleLabel, emptyMessage) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const panel = canvas.closest(".chartPanel");
    const wrap = panel && panel.querySelector(".chartCanvasWrap");
    const empty = panel && panel.querySelector(".chartEmpty");
    if (!config) { showEmpty(canvas, emptyMessage || "No records available for this chart."); return; }
    if (typeof window.Chart !== "function") { showEmpty(canvas, "Charts could not load. Check your internet connection and refresh the page."); return; }
    if (wrap) wrap.hidden = false;
    if (empty) empty.hidden = true;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", accessibleLabel || "Dashboard chart");
    try {
      const previous = instances.get(canvasId);
      if (previous && previous.config.type === config.type) {
        previous.data = config.data;
        previous.options = config.options;
        previous.update("none");
      } else {
        if (previous) previous.destroy();
        instances.set(canvasId, new window.Chart(canvas.getContext("2d"), config));
      }
    } catch (error) {
      console.error("Dashboard chart could not be rendered.", error);
      showEmpty(canvas, "This chart could not be displayed. Saved records are unchanged.");
    }
  }
  window.HCMCharts = Object.freeze({ render: render });
}());