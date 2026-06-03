/* ═══════════════════════════════════════ NiLe Capital Fund — main.js All JavaScript for the website ═══════════════════════════════════════ */

const EMAILJS_SERVICE_ID = 'nile_service';
const EMAILJS_TEMPLATE_ID = 'nile_enquiry';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
const EMAILJS_RECIPIENT = 'ceo.nilecapital@gmail.com';

// ── Run everything when page is loaded ──
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initActiveNav();
  initScrollAnimations();
  initCounters();
  initFormValidation();
  initAllocBars();
  initBackToTop();
  initCookieConsent();
});

/* ══════════════════════════════════════ FEATURE 1 — HAMBURGER MENU ══════════════════════════════════════ */
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('nav-links');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    nav.classList.toggle('open');
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('open');
      nav.classList.remove('open');
    });
  });
}

/* ══════════════════════════════════════ FEATURE 2 — ACTIVE NAV LINK ══════════════════════════════════════ */
function initActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll('.nav-links a[data-link]').forEach(link => {
    if (link.dataset.link === page) {
      link.classList.add('active');
    }
  });
}

/* ══════════════════════════════════════ FEATURE 3 — SCROLL FADE-IN ANIMATIONS ══════════════════════════════════════ */
function initScrollAnimations() {
  const targets = document.querySelectorAll(
    '.stat, .v-card, .why-card, .mv-card, .vertical-card, .founder-section, .cta-strip, .section-header'
  );

  targets.forEach((el, i) => {
    el.classList.add('fade-up');
    el.style.transitionDelay = `${(i % 4) * 0.1}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════ FEATURE 4 — ANIMATED NUMBER COUNTERS ══════════════════════════════════════ */
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function animateCounter(el) {
  const target = Number(el.dataset.target) || 0;
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = `${prefix}${Math.floor(ease * target)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = `${prefix}${target}${suffix}`;
    }
  }

  requestAnimationFrame(step);
}

function initAllocBars() {
  const bars = document.querySelectorAll('.alloc-fill');
  if (!bars.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.width + '%';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(b => obs.observe(b));
}

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ══════════════════════════════════════ FEATURE 5 — CONTACT FORM VALIDATION ══════════════════════════════════════ */
function initFormValidation() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  // ── EmailJS init — paste YOUR keys here ──
  if (window.emailjs && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.info('EmailJS initialized');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const name = form.querySelector('[name="name"]');
    const email = form.querySelector('[name="email"]');
    const invest = form.querySelector('[name="investment"]');
    const msg = form.querySelector('[name="message"]');
    const submitButton = form.querySelector('button[type="submit"]');
    let valid = true;

    if (!name.value.trim()) {
      showError(name, 'Please enter your full name');
      valid = false;
    }

    if (!email.value.trim() || !validateEmail(email.value)) {
      showError(email, 'Please enter a valid email address');
      valid = false;
    }

    if (invest && !invest.value) {
      showError(invest, 'Please select an investment amount');
      valid = false;
    }

    if (!msg.value.trim()) {
      showError(msg, 'Please write a short message');
      valid = false;
    }

    if (!valid) return;

    setSubmitButtonState(submitButton, true);

    // If EmailJS credentials are configured, send via EmailJS and explicitly set recipient
    if (
      window.emailjs &&
      EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
      EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
      EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY'
    ) {
      try {
        const templateParams = {
          from_name: name.value.trim(),
          from_email: email.value.trim(),
          investment: invest ? invest.value : '',
          message: msg.value.trim(),
          to_email: EMAILJS_RECIPIENT
        };

        const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        console.info('EmailJS sent', response);
        showSuccess();
        return;
      } catch (error) {
        console.error('EmailJS error:', error);
        showFormError(form, 'Message could not be sent. Please contact ceo.nilecapital@gmail.com directly.');
        setSubmitButtonState(submitButton, false);
        return;
      }
    }

    // Fallback: open user's mail client when EmailJS isn't configured
    const contactData = buildContactEmailData(
      name.value.trim(),
      email.value.trim(),
      invest ? invest.value : '',
      msg.value.trim()
    );
    openMailClient(contactData.subject, contactData.body, EMAILJS_RECIPIENT);
    showSuccess();
    return;
  });
}

function setSubmitButtonState(button, sending) {
  if (!button) return;
  button.disabled = sending;
  button.textContent = sending ? 'Sending…' : 'Send Message';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildContactEmailData(name, email, investment, message) {
  const subject = 'New Investor Enquiry — NiLe Capital Fund';
  const body = `From: ${name} (${email})\nInvestment Amount: ${investment}\nMessage: ${message}\n\n---\nSent from NiLe Capital Website`;
  return { subject, body };
}

function openMailClient(subject, body, recipient = EMAILJS_RECIPIENT) {
  const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailto, '_blank');
}

function showError(field, message) {
  if (!field) return;
  field.style.borderColor = '#e74c3c';
  const err = document.createElement('div');
  err.className = 'form-error';
  err.textContent = `⚠ ${message}`;
  field.parentNode.insertBefore(err, field.nextSibling);

  field.addEventListener('input', () => {
    field.style.borderColor = '';
    err.remove();
  }, { once: true });
}

function showFormError(form, message) {
  if (!form) return;
  const err = document.createElement('div');
  err.className = 'form-error';
  err.textContent = `⚠ ${message}`;
  form.prepend(err);
}

function clearErrors() {
  document.querySelectorAll('.form-error').forEach(e => e.remove());
}

function showSuccess() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.innerHTML = `
    <div class="form-success">
      <div class="success-icon">✓</div>
      <h3>Message Received!</h3>
      <p>Thank you for your interest in NiLe Capital Fund. Clever Gwakabale will be in touch within 24 hours.</p>
    </div>
  `;
}

/* ══════════════════════════════════════ FEATURE 6 — COOKIE CONSENT BANNER ══════════════════════════════════════ */
function initCookieConsent() {
  try {
    const stored = localStorage.getItem('nile_cookie_consent');
    if (stored === 'accepted' || stored === 'declined') return; // already decided
  } catch (e) {
    // ignore storage errors
  }

  if (document.getElementById('cookie-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.className = 'cookie-banner';
  banner.innerHTML = `
    <p>We use cookies to improve the site and provide analytics. By clicking "Accept" you consent to Google Analytics. <a href="privacy.html" class="cookie-link">Privacy Policy</a></p>
    <div class="cookie-actions">
      <button class="cookie-btn decline">Decline</button>
      <button class="cookie-btn accept">Accept</button>
    </div>
  `;

  document.body.appendChild(banner);

  const accept = banner.querySelector('.accept');
  const decline = banner.querySelector('.decline');

  accept.addEventListener('click', () => {
    try { localStorage.setItem('nile_cookie_consent', 'accepted'); } catch(e){}
    window['ga-disable-G-HH4CZYWJXX'] = false;
    if (typeof gtag === 'function') {
      try { gtag('consent', 'update', { 'analytics_storage': 'granted' }); } catch(e){}
      try { gtag('config', 'G-HH4CZYWJXX'); } catch(e){}
    }
    banner.remove();
  });

  decline.addEventListener('click', () => {
    try { localStorage.setItem('nile_cookie_consent', 'declined'); } catch(e){}
    window['ga-disable-G-HH4CZYWJXX'] = true;
    banner.remove();
  });
}
