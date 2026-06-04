/* MenuSafe — interactivity: nav, mobile menu, scroll reveal, waitlist form */
(function () {
  "use strict";

  /* ---------- sticky nav shadow ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 8) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("mobileMenu");
  function closeMenu() {
    burger.classList.remove("open");
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
  burger.addEventListener("click", function () {
    var open = burger.classList.toggle("open");
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* ---------- scroll reveal ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  function show(el) { el.classList.add("in"); }

  // hero is always above the fold — reveal it immediately, no timing dependency
  document.querySelectorAll(".hero .reveal").forEach(show);

  // reveal anything already in / near the viewport right away
  function revealInView() {
    var h = window.innerHeight || document.documentElement.clientHeight;
    reveals.forEach(function (el) {
      if (el.classList.contains("in")) return;
      if (el.getBoundingClientRect().top < h * 0.92) show(el);
    });
  }

  if ("IntersectionObserver" in window) {
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 4, 3) * 0.07) + "s";
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });

    // reveal in-view content right away (re-run across a few frames so it works
    // even if layout/innerHeight isn't settled at first tick)
    revealInView();
    requestAnimationFrame(revealInView);
    window.addEventListener("load", revealInView);
    setTimeout(revealInView, 300);
    // safety net: never leave content stuck invisible if IO never fires
    setTimeout(function () { reveals.forEach(show); }, 1500);
  } else {
    reveals.forEach(show);
  }

  /* ---------- waitlist form ---------- */
  var form = document.getElementById("waitlistForm");
  var success = document.getElementById("formSuccess");
  var successMsg = document.getElementById("successMsg");

  function setError(fieldId, on) {
    document.getElementById(fieldId).classList.toggle("error", on);
  }
  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  // clear error as the user types
  ["name", "email", "restaurant"].forEach(function (id) {
    var input = document.getElementById(id);
    input.addEventListener("input", function () {
      input.closest(".field").classList.remove("error");
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim();
    var rest = document.getElementById("restaurant").value.trim();

    var ok = true;
    if (!name) { setError("f-name", true); ok = false; }
    if (!isEmail(email)) { setError("f-email", true); ok = false; }
    if (!rest) { setError("f-restaurant", true); ok = false; }
    if (!ok) {
      var firstErr = form.querySelector(".field.error input");
      if (firstErr) firstErr.focus();
      return;
    }

    // personalise success message
    var first = name.split(" ")[0];
    successMsg.textContent =
      "Thanks " + first + " — we've reserved a spot for " + rest +
      ". We'll be in touch the moment your early access is ready.";

    form.style.display = "none";
    success.classList.add("show");
    success.scrollTop = 0;
  });
})();
