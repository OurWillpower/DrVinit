/**
 * scripts.js
 * Lightweight interactions for Shree Varad Maternity site
 *
 * IMPORTANT:
 * - Replace placeholders (PHONE_NUMBER, EMAIL) in the markup below if you want them to show real values.
 * - This file uses a graceful fallback: if there's no backend endpoint, it opens a mailto: link.
 */

/* ========== CONFIG (replace these values if desired) ========== */
const CONFIG = {
  PHONE: '+91-XXXXXXXXXX',                 // shown in UI and used by tel: links
  EMAIL: 'info@shreevaradmaternity.com',   // used for fallback form submission
  GA_MEASUREMENT_ID: 'G-XXXXXXXXXX'        // optional: replace to enable gtag (or leave as placeholder)
};
/* ============================================================ */

/* --- Helper: safe querySelector --- */
function $qs(sel, root = document) { return root.querySelector(sel); }
function $qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

/* --- Initialize phone links and contact anchors --- */
function initContactLinks() {
  // Update any phone tel: anchors
  $qsa('a[href^="tel:"]').forEach(a => {
    a.href = `tel:${CONFIG.PHONE}`;
    if (a.dataset.originalText === undefined) {
      a.dataset.originalText = a.textContent.trim();
      // show phone number if anchor text contains 'Call' or is short
      if (/call|phone/i.test(a.textContent) || a.textContent.trim().length < 6) {
        a.textContent = `Call ${CONFIG.PHONE}`;
      }
    }
    // track clicks
    a.addEventListener('click', () => {
      trackEvent('contact_click', { method: 'phone', phone: CONFIG.PHONE });
    });
  });

  // Update email anchors
  $qsa('a[href^="mailto:"]').forEach(a => {
    a.href = `mailto:${CONFIG.EMAIL}`;
    a.addEventListener('click', () => {
      trackEvent('contact_click', { method: 'email', email: CONFIG.EMAIL });
    });
  });
}

/* --- Basic analytics / event tracker (console + gtag if configured) --- */
function trackEvent(name, params = {}) {
  // Console log always for debugging
  console.info('trackEvent', name, params);

  // gtag if present and configured
  try {
    if (window.gtag && CONFIG.GA_MEASUREMENT_ID && !CONFIG.GA_MEASUREMENT_ID.includes('XXXX')) {
      window.gtag('event', name, params);
    }
  } catch (err) {
    console.debug('gtag error', err);
  }
}

/* --- Modal appointment form generator --- */
function createAppointmentModal() {
  if ($qs('#appointment-modal')) return; // already created

  const modalHtml = `
    <div id="appointment-modal" aria-hidden="true" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:1200;">
      <div id="appointment-backdrop" style="position:absolute;inset:0;background:rgba(10,10,10,0.45)"></div>
      <div role="dialog" aria-modal="true" aria-label="Book Appointment" style="position:relative;max-width:520px;width:96%;background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(2,6,23,0.2);padding:22px;z-index:1201">
        <button id="apt-close" aria-label="Close appointment dialog" style="position:absolute;right:12px;top:10px;background:none;border:0;font-size:18px;cursor:pointer">✕</button>
        <h3 style="margin:0 0 8px;font-family: 'Playfair Display', serif">Book an Appointment</h3>
        <p style="margin:0 0 12px;color:#556074">Choose date/time and share a short concern. We'll confirm by phone or email.</p>
        <form id="apt-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <input name="firstName" required placeholder="First name" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
            <input name="lastName" placeholder="Last name" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
            <input name="phone" required placeholder="Mobile number" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
            <input name="email" placeholder="Email (optional)" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
            <input name="date" type="date" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
            <input name="time" type="time" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
          </div>
          <textarea name="notes" placeholder="Short note / symptoms (optional)" rows="4" style="width:100%;margin-top:10px;padding:10px;border-radius:8px;border:1px solid #e6e9ef"></textarea>

          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
            <button type="button" id="apt-cancel" style="padding:10px 14px;border-radius:10px;border:1px solid #cdd6df;background:#fff;cursor:pointer">Cancel</button>
            <button type="submit" id="apt-submit" style="padding:10px 14px;border-radius:10px;border:0;background:#0B5C4A;color:#fff;cursor:pointer">Send Request</button>
          </div>

          <div id="apt-feedback" style="margin-top:10px;font-size:14px;color:#556074;display:none"></div>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Event wiring
  const modal = $qs('#appointment-modal');
  $qs('#apt-close').addEventListener('click', () => closeModal(modal));
  $qs('#apt-cancel').addEventListener('click', () => closeModal(modal));
  $qs('#appointment-backdrop').addEventListener('click', () => closeModal(modal));
  $qs('#apt-form').addEventListener('submit', handleAptSubmit);
  // focus trap: focus first input
  const firstInput = $qs('#apt-form input[name="firstName"]');
  if (firstInput) firstInput.focus();
  modal.style.opacity = '0';
  setTimeout(() => modal.style.transition = 'opacity 160ms ease-in-out', 10);
  setTimeout(() => modal.style.opacity = '1', 20);
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.style.opacity = '0';
  setTimeout(() => modalEl.remove(), 180);
}

/* --- Appointment form submission handler --- */
async function handleAptSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const feedback = $qs('#apt-feedback');
  feedback.style.display = 'block';
  feedback.textContent = 'Sending...';

  const data = {
    firstName: form.firstName.value.trim(),
    lastName: form.lastName.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    date: form.date.value,
    time: form.time.value,
    notes: form.notes.value.trim()
  };

  trackEvent('appointment_attempt', { method: 'widget', phone: data.phone });

  // Try to POST to a server endpoint if configured (this repo does not include a backend)
  const endpoint = '/api/appointments'; // replace with real endpoint if you create one
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (resp.ok) {
      feedback.textContent = 'Appointment request sent — we will call to confirm.';
      trackEvent('appointment_success', { method: 'widget' });
      setTimeout(() => {
        const modal = $qs('#appointment-modal');
        if (modal) closeModal(modal);
      }, 1600);
      return;
    } else {
      // fallback to mailto when endpoint isn't available
      throw new Error('Server rejected');
    }
  } catch (err) {
    // Fallback: open mailto with summary (works without server)
    const subject = encodeURIComponent('Appointment request - Shree Varad Maternity');
    const body = encodeURIComponent(
      `Name: ${data.firstName} ${data.lastName}\nPhone: ${data.phone}\nEmail: ${data.email}\nDate: ${data.date}\nTime: ${data.time}\nNotes: ${data.notes}`
    );
    // open mail client
    window.location.href = `mailto:${CONFIG.EMAIL}?subject=${subject}&body=${body}`;
    feedback.textContent = 'No server endpoint found — opening mail client as fallback.';
    trackEvent('appointment_fallback_mailto', { method: 'mailto', email: CONFIG.EMAIL });
    setTimeout(() => {
      const modal = $qs('#appointment-modal');
      if (modal) closeModal(modal);
    }, 1000);
  }
}

/* --- Wire up Book Appointment buttons to open modal --- */
function wireAppointmentButtons() {
  // Add click listeners to any element with data-apt="open"
  $qsa('[data-apt="open"]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      createAppointmentModal();
    });
  });

  // If there are no elements marked, automatically convert ".btn-primary" that link to "#contact"
  $qsa('.btn-primary').forEach(btn => {
    if (btn.getAttribute('href') === '#contact' || /book/i.test(btn.textContent)) {
      btn.setAttribute('data-apt', 'open');
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        createAppointmentModal();
      });
    }
  });
}

/* --- Initialize gtag if provided (optional) --- */
function initGTag() {
  const id = CONFIG.GA_MEASUREMENT_ID;
  if (!id || id.includes('XXXX')) return;
  // create gtag script
  if (!window.gtag) {
    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    window.gtag('js', new Date());
    window.gtag('config', id);
  }
}

/* --- DOM ready init --- */
function initSite() {
  initContactLinks();
  wireAppointmentButtons();
  initGTag();

  // Example: log that the site loaded
  trackEvent('site_loaded', { pathname: location.pathname });
}

/* Run when ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSite);
} else {
  initSite();
}

/* Export for debugging in console */
window.ShreeVarad = {
  trackEvent,
  createAppointmentModal,
  config: CONFIG
};
