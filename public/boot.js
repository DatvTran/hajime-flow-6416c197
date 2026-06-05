(function () {
  var RELOAD_KEY = "hajime_entry_reload";
  var booted = false;
  window.__hajimeMarkBooted = function () {
    booted = true;
    sessionStorage.removeItem(RELOAD_KEY);
  };

  function showBootFailure(message, withReload) {
    var fb = document.getElementById("boot-fallback");
    if (!fb || booted) return;
    fb.innerHTML =
      '<p style="margin:0;font-size:1.25rem;font-weight:600;letter-spacing:0.04em">Hajime</p>' +
      '<p style="margin:0;max-width:28rem;font-size:0.875rem;line-height:1.5;color:#888888">' +
      message +
      "</p>" +
      (withReload
        ? '<button type="button" style="margin-top:0.5rem;border:1px solid rgba(255,255,255,0.14);background:#1a1a1a;color:#faf9f7;border-radius:0.75rem;padding:0.625rem 1rem;font-size:0.875rem;cursor:pointer" onclick="sessionStorage.removeItem(\'' +
          RELOAD_KEY +
          "');location.reload()\">Reload page</button>"
        : "");
  }

  window.addEventListener(
    "error",
    function (evt) {
      var target = evt.target;
      if (!target || target.tagName !== "SCRIPT") return;
      var src = target.src || "";
      if (src.indexOf("/assets/") === -1) return;
      if (sessionStorage.getItem(RELOAD_KEY)) {
        showBootFailure(
          "The app could not load after an update. Clear cache or use Reload page.",
          true
        );
        return;
      }
      sessionStorage.setItem(RELOAD_KEY, "1");
      location.reload();
    },
    true
  );

  window.addEventListener("unhandledrejection", function (evt) {
    var reason = evt.reason && evt.reason.message ? evt.reason.message : String(evt.reason || "");
    if (
      reason.indexOf("Failed to fetch dynamically imported module") === -1 &&
      reason.indexOf("Importing a module script failed") === -1 &&
      reason.indexOf("error loading dynamically imported module") === -1 &&
      reason.indexOf("not a valid JavaScript MIME type") === -1
    ) {
      return;
    }
    if (sessionStorage.getItem(RELOAD_KEY)) {
      showBootFailure(
        "The app could not load after an update. Clear cache or use Reload page.",
        true
      );
      return;
    }
    sessionStorage.setItem(RELOAD_KEY, "1");
    location.reload();
  });

  window.setTimeout(function () {
    if (booted) return;
    showBootFailure("Still loading… If this screen stays blank, reload once.", true);
  }, 12000);
})();
