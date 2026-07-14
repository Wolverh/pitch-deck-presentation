/* ============================================
   KHATAWAT PITCH DECK — Interactivity
   Navigation · Counters · Animations
   ============================================ */

(function () {
  'use strict';

  // ── State ──
  let currentSlide = 0;
  let isTransitioning = false;
  let touchStartX = 0;
  let touchStartY = 0;

  // ── DOM References ──
  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;
  const progressFill = document.querySelector('.progress-fill');
  const slideCounter = document.querySelector('.slide-counter');
  const navDotsContainer = document.querySelector('.nav-dots');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  // ── Initialize ──
  function init() {
    createNavDots();
    goToSlide(0);
    bindEvents();
  }

  // ── Create Navigation Dots ──
  function createNavDots() {
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('button');
      dot.classList.add('nav-dot');
      dot.setAttribute('aria-label', `الشريحة ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      navDotsContainer.appendChild(dot);
    }
  }

  // ── Navigate to Slide ──
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides || isTransitioning) return;

    isTransitioning = true;

    // Deactivate current
    slides[currentSlide].classList.remove('active');

    // Activate new
    currentSlide = index;
    slides[currentSlide].classList.add('active');

    // Reset scroll position
    const inner = slides[currentSlide].querySelector('.slide-inner');
    if (inner) inner.scrollTop = 0;

    updateUI();
    animateCounters();

    setTimeout(() => {
      isTransitioning = false;
    }, 600);
  }

  function nextSlide() {
    if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  }

  // ── Update UI Elements ──
  function updateUI() {
    // Progress bar
    const progress = ((currentSlide + 1) / totalSlides) * 100;
    progressFill.style.width = progress + '%';

    // Counter
    slideCounter.textContent = `${currentSlide + 1} / ${totalSlides}`;

    // Nav dots
    const dots = navDotsContainer.querySelectorAll('.nav-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });

    // Buttons
    btnPrev.disabled = currentSlide === 0;
    btnNext.disabled = currentSlide === totalSlides - 1;
  }

  // ── Counter Animation ──
  function animateCounters() {
    const activeSlide = slides[currentSlide];
    const counters = activeSlide.querySelectorAll('[data-count]');

    counters.forEach(counter => {
      if (counter.dataset.animated === 'true') return;
      counter.dataset.animated = 'true';

      const target = counter.dataset.count;
      const prefix = counter.dataset.prefix || '';
      const suffix = counter.dataset.suffix || '';
      const isFloat = target.includes('.');
      const targetNum = parseFloat(target.replace(/,/g, ''));
      const duration = 1800;
      const startTime = performance.now();

      function updateCounter(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = targetNum * eased;

        if (isFloat) {
          counter.textContent = prefix + current.toFixed(2) + suffix;
        } else {
          const formatted = Math.floor(current).toLocaleString('en-US');
          counter.textContent = prefix + formatted + suffix;
        }

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          // Set final value exactly
          if (isFloat) {
            counter.textContent = prefix + parseFloat(target).toFixed(2) + suffix;
          } else {
            counter.textContent = prefix + parseInt(target.replace(/,/g, '')).toLocaleString('en-US') + suffix;
          }
        }
      }

      requestAnimationFrame(updateCounter);
    });
  }

  // ── Event Bindings ──
  function bindEvents() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      // RTL: ArrowRight = prev, ArrowLeft = next
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(totalSlides - 1);
      }
    });

    // Buttons
    btnPrev.addEventListener('click', prevSlide);
    btnNext.addEventListener('click', nextSlide);

    // Touch / Swipe
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const deltaX = e.changedTouches[0].screenX - touchStartX;
      const deltaY = e.changedTouches[0].screenY - touchStartY;

      // Only handle horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
        // RTL: swipe left = prev (content moves right), swipe right = next
        if (deltaX > 0) {
          // Swipe right → in RTL this means "next"
          nextSlide();
        } else {
          // Swipe left → in RTL this means "prev"
          prevSlide();
        }
      }
    }, { passive: true });

    // Mouse wheel — strict one-slide-per-scroll, no skipping
    let wheelLocked = false;
    document.addEventListener('wheel', (e) => {
      // Check if we're scrolling inside a slide-inner that has overflow
      const slideInner = slides[currentSlide].querySelector('.slide-inner');
      if (slideInner) {
        const hasScroll = slideInner.scrollHeight > slideInner.clientHeight;
        if (hasScroll) {
          const atTop = slideInner.scrollTop <= 0;
          const atBottom = slideInner.scrollTop + slideInner.clientHeight >= slideInner.scrollHeight - 2;

          if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) {
            return; // Let the inner scroll handle it
          }
        }
      }

      e.preventDefault();

      // Block ALL scroll events while transitioning or locked
      if (wheelLocked || isTransitioning) return;
      wheelLocked = true;

      if (e.deltaY > 0) {
        nextSlide();
      } else if (e.deltaY < 0) {
        prevSlide();
      }

      // Keep locked for 1.2s — longer than transition duration
      setTimeout(() => {
        wheelLocked = false;
      }, 1200);
    }, { passive: false });
  }

  // ── Launch ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
