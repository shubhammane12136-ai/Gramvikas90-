/* =========================================================
   GRAMVIKAS — pro-effects.js
   Drop-in file: builds the opening preloader, reveals the
   page with a staggered entrance, and wires up ripple / shine
   / magnetic effects on buttons — without touching your
   existing script.js or login.js.

   Include AFTER style.css/login.css are linked, and AFTER
   the page's own <body> markup — right before your other
   scripts (auth-guard.js / login.js / script.js) works fine,
   order relative to those doesn't matter.
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. BUILD & RUN THE PRELOADER
  --------------------------------------------------------- */
  function buildPreloader() {
    const pre = document.createElement("div");
    pre.className = "pro-preloader";
    pre.id = "proPreloader";
    pre.innerHTML = `
      <div class="pro-preloader-inner">
        <div class="pro-preloader-logo"><i class="fa-solid fa-house-chimney"></i></div>
        <div class="pro-preloader-text">Gram<span>Vikas</span></div>
        <div class="pro-preloader-sub">Loading your dashboard</div>
        <div class="pro-preloader-bar"><div class="pro-preloader-bar-fill" id="proPreloaderFill"></div></div>
      </div>
    `;
    document.body.prepend(pre);
    return pre;
  }

  function runPreloader() {
    const pre = buildPreloader();
    const fill = pre.querySelector("#proPreloaderFill");

    // Animate the bar toward ~90% while we wait, then snap to 100%
    // and fade out once the page is actually ready.
    let progress = 0;
    const tick = setInterval(() => {
      progress += (90 - progress) * 0.12 + 1;
      if (progress > 90) progress = 90;
      fill.style.width = progress + "%";
    }, 120);

    const finish = () => {
      clearInterval(tick);
      fill.style.width = "100%";
      setTimeout(() => {
        pre.classList.add("pro-hide");
        revealPage();
        setTimeout(() => pre.remove(), 700);
      }, 220);
    };

    if (document.readyState === "complete") {
      setTimeout(finish, 350); // tiny minimum so it doesn't just flash
    } else {
      window.addEventListener("load", () => setTimeout(finish, 250));
      // Safety net in case 'load' takes too long (slow images/CDNs etc.)
      setTimeout(finish, 2500);
    }
  }

  /* ---------------------------------------------------------
     2. STAGGERED PAGE ENTRANCE (runs once preloader clears)
  --------------------------------------------------------- */
  function revealPage() {
    // Dashboard (index.html) layout
    const sidebar = document.querySelector(".sidebar");
    const main = document.querySelector(".main-content");
    if (sidebar) sidebar.classList.add("pro-in");
    if (main) main.classList.add("pro-in", "pro-in-delay-1");

    // Login page layout
    const authShell = document.querySelector(".auth-shell");
    if (authShell) authShell.classList.add("pro-auth-in");
  }

  /* ---------------------------------------------------------
     3. RIPPLE + MAGNETIC EFFECTS ON BUTTONS
  --------------------------------------------------------- */
  const BUTTON_SELECTOR = [
    ".primary-btn", ".secondary-btn", ".text-btn", ".more-btn",
    ".header-icon", ".role-tab", ".auth-submit", ".toggle-eye"
  ].join(",");

  function tagButtons() {
    document.querySelectorAll(BUTTON_SELECTOR).forEach((btn) => {
      btn.classList.add("pro-btn");
    });
  }

  function spawnRipple(e, btn) {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.3;
    const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
    const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;

    const ripple = document.createElement("span");
    const isLight = btn.classList.contains("secondary-btn") ||
                     btn.classList.contains("header-icon") ||
                     btn.classList.contains("role-tab") ||
                     btn.classList.contains("text-btn");
    ripple.className = "pro-ripple" + (isLight ? " pro-ripple-dark" : "");
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";

    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  }

  function wireRipples() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(BUTTON_SELECTOR);
      if (!btn || btn.disabled) return;
      spawnRipple(e, btn);
    });
  }

  function wireMagnetic() {
    const magneticTargets = () =>
      document.querySelectorAll(".primary-btn, .auth-submit, .header-icon");

    document.addEventListener("mousemove", (e) => {
      // Cheap-ish: only bother if the pointer is over a candidate button.
      const btn = e.target.closest(".primary-btn, .auth-submit, .header-icon");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      btn.style.setProperty("--mx", mx.toFixed(3));
      btn.style.setProperty("--my", my.toFixed(3));
      btn.classList.add("pro-magnetic");
    });

    document.addEventListener("mouseout", (e) => {
      const btn = e.target.closest(".primary-btn, .auth-submit, .header-icon");
      if (!btn) return;
      btn.classList.remove("pro-magnetic");
      btn.style.removeProperty("--mx");
      btn.style.removeProperty("--my");
    });
  }

  /* ---------------------------------------------------------
     4. RE-TAG DYNAMICALLY INSERTED BUTTONS
     script.js / login.js render lots of markup after load
     (modals, table action buttons, register-form fields...).
     A light MutationObserver keeps new buttons ripple-ready.
  --------------------------------------------------------- */
  function watchForNewButtons() {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(BUTTON_SELECTOR)) {
            node.classList.add("pro-btn");
          }
          if (node.querySelectorAll) {
            node.querySelectorAll(BUTTON_SELECTOR).forEach((el) =>
              el.classList.add("pro-btn")
            );
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  function init() {
    tagButtons();
    wireRipples();
    wireMagnetic();
    watchForNewButtons();
  }

  runPreloader();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
