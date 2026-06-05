/* ==========================================================================
   OnSun — shared site behaviour
   --------------------------------------------------------------------------
   Theme toggle (dark default, persisted), nav (hamburger + scroll state),
   hero particles, scroll-reveal animations, FAQ + settings accordions,
   smooth anchor scrolling, and the support page's lat/long helpers.

   Everything is element-guarded so a single include is safe on every page.
   Functions used by inline onclick handlers (toggleAccordion, searchLatLong,
   searchLatLongLocation) are attached to window.
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'onsun-theme';
  var root = document.documentElement;

  /* ---- Theme ------------------------------------------------------------ */
  function storedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var pressed = theme === 'light';
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(pressed));
      btn.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0a1a' : '#f6f4ef');
  }
  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function toggleTheme() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    applyTheme(next);
  }

  // Reconcile with the anti-flash inline script; default to light (white).
  applyTheme(storedTheme() === 'dark' ? 'dark' : 'light');

  /* ---- DOM-ready wiring -------------------------------------------------- */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // Theme toggle buttons
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });

    // Hamburger menu
    var hamburger = document.getElementById('nav-hamburger');
    var navLinks = document.getElementById('nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', function () {
        var isOpen = navLinks.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
      });
      navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navLinks.classList.remove('open');
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Navbar scroll state
    var navbar = document.getElementById('navbar');
    if (navbar) {
      var onScroll = function () { navbar.classList.toggle('scrolled', window.scrollY > 50); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Hero particles
    var particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
      for (var i = 0; i < 20; i++) {
        var p = document.createElement('div');
        p.className = 'particle';
        p.style.left = (Math.random() * 100) + '%';
        p.style.top = (Math.random() * 100) + '%';
        p.style.animationDelay = (Math.random() * 8) + 's';
        p.style.animationDuration = (6 + Math.random() * 4) + 's';
        particlesContainer.appendChild(p);
      }
    }

    // Scroll-reveal
    var revealEls = document.querySelectorAll('.animate-on-scroll');
    if (revealEls.length) {
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        revealEls.forEach(function (el) { observer.observe(el); });
      } else {
        revealEls.forEach(function (el) { el.classList.add('visible'); });
      }
    }

    // FAQ accordion (one-open-at-a-time)
    document.querySelectorAll('.faq-question').forEach(function (button) {
      button.addEventListener('click', function () {
        var item = button.parentElement;
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
        document.querySelectorAll('.faq-question').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
        if (!isOpen) {
          item.classList.add('open');
          button.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Smooth scroll for in-page anchors
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var id = this.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Lat/long input: Enter key (support page)
    var cityInput = document.getElementById('cityInput');
    if (cityInput) cityInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') window.searchLatLong(); });
    var cityInputLoc = document.getElementById('cityInputLocation');
    if (cityInputLoc) cityInputLoc.addEventListener('keypress', function (e) { if (e.key === 'Enter') window.searchLatLongLocation(); });
  });

  /* ---- Globals for inline onclick handlers ------------------------------ */
  window.toggleAccordion = function (header) {
    var item = header.parentElement;
    var wasActive = item.classList.contains('active');
    document.querySelectorAll('.accordion-item').forEach(function (el) { el.classList.remove('active'); });
    if (!wasActive) item.classList.add('active');
  };

  window.searchLatLong = function () {
    var el = document.getElementById('cityInput');
    var city = el ? el.value.trim() : '';
    if (city) window.open('https://www.google.com/search?q=' + encodeURIComponent(city + ' latitude longitude decimal degrees'), '_blank');
  };

  window.searchLatLongLocation = function () {
    var el = document.getElementById('cityInputLocation');
    var city = el ? el.value.trim() : '';
    if (city) window.open('https://www.google.com/search?q=' + encodeURIComponent(city + ' latitude longitude decimal degrees'), '_blank');
  };

  // Expose the toggle for any custom triggers.
  window.onsunToggleTheme = toggleTheme;
})();
