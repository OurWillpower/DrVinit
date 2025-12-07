/**
 * scripts.js (Netlify-ready)
 * Replaces earlier version to POST appointment forms to Netlify function:
 * Endpoint: /.netlify/functions/submit-appointment
 *
 * If the Netlify function is not available, falls back to mailto: behavior.
 */

const CONFIG = {
  PHONE: '+91-XXXXXXXXXX',
  EMAIL: 'info@shreevaradmaternity.com',
  APPT_ENDPOINT: '/.netlify/functions/submit-appointment'
};

function $qs(sel, root = document) { return root.querySelector(sel); }
function $qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function initContactLinks() {
  $qsa('a[href^="tel:"]').forEach(a => {
    a.href = `tel:${CONFIG.PHONE}`;
    if (/call|phone/i.test(a.textContent) || a.textContent.trim().length < 6) {
      a.textContent = `Call ${CONFIG.PHONE}`;
    }
  });
  $qsa('a[href^="mailto:"]').forEach(a => {
    a.href = `mailto:${CONFIG.EMAIL}`;
  });
}

/* ---------- Appointment modal (same UI as before) ---------- */
function createAppointmentModal() {
  if ($qs('#appointment-modal')) return;
  const modalHtml = `
  <div id="appointment-modal" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:1200;">
    <div id="appointment-backdrop" style="position:absolute;inset:0;background:rgba(10,10,10,0.45)"></div>
    <div role="dialog" style="position:relative;max-width:520px;width:96%;background:#fff;border-radius:12px;padding:18px;z-index:1201;box-shadow:0 20px 60px rgba(2,6,23,0.12)">
      <button id="apt-close" aria-label="Close" style="position:absolute;right:12px;top:10px;background:none;border:0;font-size:18px;cursor:pointer">✕</button>
      <h3 style="margin:0 0 8px;font-family:'Playfair Display',serif">Book an Appointment</h3>
      <form id="apt-form">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <input name="firstName" required placeholder="First name" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
          <input name="lastName" placeholder="Last name" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
          <input name="phone" required placeholder="Mobile number" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
          <input name="email" placeholder="Email (optional)" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
          <input name="date" type="date" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
          <input name="time" type="time" style="padding:10px;border-radius:8px;border:1px solid #e6e9ef" />
        </div>
        <textarea name="notes" placeholder="Short note / symptoms (optional)" rows="4" style="width:100%;margin-top:10px;padding:10px;border-radius:8px;border:1px solid #e6e9ef"></textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
          <button type="button" id="apt-cancel" style="padding:8px 12px;border-radius:8px;border:1px solid #cdd6df;background:#fff;cursor:pointer">Cancel</button>
          <button type="submit" id="apt-submit" style="padding:8px 12px;border-radius:8px;border:0;background:#0B5C4A;color:#fff;cursor:pointer">Send Request</button>
        </div>
        <div id="apt-feedback" style="margin-top:10px;font-size:14px;color:#556074;display:none"></div>
      </form>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  $qs('#apt-close').addEventListener('click', closeModal);
  $qs('#apt-cancel').addEventListener('click', closeModal);
  $qs('#appointment-backdrop').addEventListener('click', closeModal);
  $qs('#apt-form').addEventListener('submit', handleAptSubmit);
  $qs('#apt-form input[name="firstName"]').focus();
}

function closeModal() {
  const modal = $qs('#appointment-modal');
  if (!modal) return;
  modal.remove();
}

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

  // Try POST to Netlify function
  try {
    const resp = await fetch(CONFIG.APPT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (resp.ok) {
      feedback.textContent = 'Request sent — we will call to confirm.';
      setTimeout(() => closeModal(), 1500);
      return;
    } else {
      const txt = await resp.text();
      console.warn('Appointment POST failed', resp.status, txt);
      // fallback to mailto
      throw new Error('Server rejected');
    }
  } catch (err) {
    // fallback: mailto
    const subject = encodeURIComponent('Appointment request - Shree Varad Maternity');
    const body = encodeURIComponent(
      `Name: ${data.firstName} ${data.lastName}\nPhone: ${data.phone}\nEmail: ${data.email}\nDate: ${data.date}\nTime: ${data.time}\nNotes: ${data.notes}`
    );
    window.location.href = `mailto:${CONFIG.EMAIL}?subject=${subject}&body=${body}`;
    feedback.textContent = 'Opening your email client as fallback.';
    setTimeout(() => closeModal(), 1200);
  }
}

/* Wire up book buttons */
function wireAppointmentButtons() {
  $qsa('[data-apt="open"]').forEach(btn => {
    btn.addEventListener('click', ev => { ev.preventDefault(); createAppointmentModal(); });
  });
  // also attach to main CTA if href=#contact or text contains Book
  $qsa('.btn-primary').forEach(btn => {
    if (btn.getAttribute('href') === '#contact' || /book/i.test(btn.textContent)) {
      btn.setAttribute('data-apt', 'open');
      btn.addEventListener('click', ev => { ev.preventDefault(); createAppointmentModal(); });
    }
  });
}

/* Init */
function initSite() {
  initContactLinks();
  wireAppointmentButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSite);
} else {
  initSite();
}

/* Export for debugging */
window.ShreeVarad = {
  createAppointmentModal
};
