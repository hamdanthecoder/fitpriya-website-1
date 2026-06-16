const header = document.querySelector('[data-header]');
const cursorGlow = document.querySelector('[data-cursor-glow]');
const contactForm = document.querySelector('[data-contact-form]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const lenis = !prefersReducedMotion && window.Lenis
  ? new Lenis({
      duration: 1.08,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.12,
    })
  : null;

if (lenis) {
  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };

  requestAnimationFrame(raf);

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;

      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target, { offset: -92, duration: 1.18 });
      history.pushState(null, '', hash);
    });
  });

  if (window.location.hash) {
    window.addEventListener('load', () => {
      const target = document.querySelector(window.location.hash);
      if (target) lenis.scrollTo(target, { offset: -92, immediate: true });
    });
  }
}

document.querySelectorAll([
  '.trust-item',
  '.feature-card',
  '.coach-copy',
  '.coach-visual',
  '.progress-wrap',
  '.privacy-card',
  '.support-card',
  '.contact-hero',
  '.download-hero',
  '.download-trust',
  '.download-notes article',
  '.metrics-panel div',
].join(',')).forEach((el) => {
  el.classList.add('reveal');
});

const revealEls = document.querySelectorAll('.reveal');

if (header) {
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -56px 0px' });

  revealEls.forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 5, 4) * 85}ms`;
    observer.observe(el);
  });
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    cursorGlow.style.setProperty('--x', `${event.clientX}px`);
    cursorGlow.style.setProperty('--y', `${event.clientY}px`);
  }, { passive: true });
}

const interactiveEls = document.querySelectorAll([
  '.feature-card',
  '.trust-item',
  '.support-card',
  '.metrics-panel div',
  '.privacy-card',
  '.download-panel',
  '.download-trust',
  '.download-notes article',
].join(','));

if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
  interactiveEls.forEach((el) => {
    el.classList.add('is-interactive');

    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rx = ((y / rect.height) - 0.5) * -4.5;
      const ry = ((x / rect.width) - 0.5) * 4.5;

      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    });

    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

if (contactForm) {
  const statusEl = contactForm.querySelector('[data-form-status]');
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const fields = [...contactForm.querySelectorAll('[data-error-for]')];

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const setFieldError = (field, message = '') => {
    const errorEl = contactForm.querySelector(`[data-field-error="${field.name}"]`);
    field.classList.toggle('is-invalid', Boolean(message));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorEl) errorEl.textContent = message;
  };

  const validateField = (field) => {
    const value = field.value.trim();

    if (field.required && !value) {
      return `${field.previousElementSibling?.textContent || 'This field'} is required.`;
    }

    if (field.name === 'name' && value.length < 2) {
      return 'Please enter at least 2 characters.';
    }

    if (field.name === 'email' && !emailPattern.test(value)) {
      return 'Please enter a valid email address, like name@example.com.';
    }

    if (field.name === 'message' && value.length < 12) {
      return 'Please write at least 12 characters.';
    }

    return '';
  };

  const validateForm = () => {
    let firstInvalid = null;

    fields.forEach((field) => {
      const message = validateField(field);
      setFieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      if (statusEl) {
        statusEl.textContent = 'Please fix the highlighted fields.';
        statusEl.className = 'form-status is-error';
      }
      return false;
    }

    return true;
  };

  fields.forEach((field) => {
    field.addEventListener('input', () => {
      if (field.classList.contains('is-invalid')) {
        setFieldError(field, validateField(field));
      }
    });

    field.addEventListener('blur', () => {
      setFieldError(field, validateField(field));
    });
  });

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const originalText = submitBtn?.textContent || 'Send message';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = 'form-status';
    }

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      contactForm.reset();
      if (statusEl) {
        statusEl.textContent = 'Message sent. We will reply by email soon.';
        statusEl.className = 'form-status is-success';
      }
    } catch {
      if (statusEl) {
        statusEl.textContent = 'Could not send message right now. Please try again or email xbrostudioind@gmail.com.';
        statusEl.className = 'form-status is-error';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}
