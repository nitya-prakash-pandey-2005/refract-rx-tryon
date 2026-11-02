/*! Refract embed — "Try with my prescription" for any eyewear store.
 *  <script src="https://YOUR-REFRACT-HOST/embed.js" async></script>
 *  <button data-refract-sku="juno">Try with my prescription</button>
 *  Listen for purchases:  window.addEventListener("refract:add-to-cart", (e) => e.detail)
 */
(function () {
  if (window.__refractEmbed) return;
  window.__refractEmbed = true;
  var script = document.currentScript;
  var origin = new URL(script ? script.src : location.href).origin;

  var css = [
    ".rfx-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(5,6,15,.62);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s}",
    ".rfx-overlay.on{opacity:1}",
    ".rfx-modal{position:relative;width:min(1180px,96vw);height:min(820px,92vh);border-radius:22px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.55);transform:translateY(14px) scale(.98);transition:transform .3s cubic-bezier(.22,1,.36,1);background:#05060f}",
    ".rfx-overlay.on .rfx-modal{transform:none}",
    ".rfx-modal iframe{width:100%;height:100%;border:0;display:block}",
    ".rfx-close{position:absolute;top:10px;right:12px;z-index:2;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font:600 20px/36px system-ui;cursor:pointer}",
    ".rfx-close:hover{background:rgba(255,255,255,.22)}",
    "@media (max-width:640px){.rfx-modal{width:100vw;height:100vh;border-radius:0}}",
  ].join("");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var overlay = null, lastFocus = null, bodyOverflow = "";

  function close() {
    if (!overlay) return;
    var o = overlay;
    overlay = null;
    o.classList.remove("on");
    document.body.style.overflow = bodyOverflow;
    setTimeout(function () { o.remove(); }, 260);
    document.removeEventListener("keydown", onKey);
    if (lastFocus) lastFocus.focus();
  }
  function onKey(e) { if (e.key === "Escape") close(); }

  function open(sku) {
    if (overlay) { overlay.remove(); overlay = null; } else { lastFocus = document.activeElement; bodyOverflow = document.body.style.overflow; }
    document.body.style.overflow = "hidden";
    overlay = document.createElement("div");
    overlay.className = "rfx-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Try on with your prescription");
    overlay.innerHTML = '<div class="rfx-modal"><button class="rfx-close" aria-label="Close">×</button><iframe allow="camera; fullscreen" title="Refract prescription try-on"></iframe></div>';
    overlay.querySelector("iframe").src = origin + "/?embed=1&store=" + encodeURIComponent(location.hostname) + "#/live/" + encodeURIComponent(sku || "");
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.querySelector(".rfx-close").addEventListener("click", close);
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay && overlay.classList.add("on"); });
    document.addEventListener("keydown", onKey);
    overlay.querySelector(".rfx-close").focus();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-refract-sku]");
    if (!btn) return;
    e.preventDefault();
    open(btn.getAttribute("data-refract-sku"));
  });

  // The try-on tells the store what the shopper chose; the store decides what to do with it.
  window.addEventListener("message", function (e) {
    if (e.origin !== origin || !e.data) return;
    if (e.data.type === "refract:close") return close();
    if (e.data.type !== "refract:add-to-cart") return;
    window.dispatchEvent(new CustomEvent("refract:add-to-cart", { detail: e.data.item }));
    close();
  });

  window.Refract = { open: open, close: close };
})();
