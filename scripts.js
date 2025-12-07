/**
 * scripts.js
 * Complete replacement file — creates appointment modal and opens WhatsApp with a pre-filled message.
 *
 * Behavior:
 * - Wires any element with data-apt="open" or .btn-primary (Book) to open the modal.
 * - On submit:
 *    - If CONFIG.GOOGLE_FORM_ACTION is set (full POST URL), it will submit form data to that URL (background).
 *    - Then it always opens WhatsApp to +91 7039196489 with a prefilled message containing the form details.
 *    - If WhatsApp cannot be opened, falls back to mailto: with the same message.
 *
 * IMPORTANT: Replace CONFIG values below ONLY if you want to enable Google Forms integration later.
 */

const CONFIG = {
  PHONE: '+91-7039196489',           // Display phone
  EMAIL: 'info@shreevaradmaternity.com',
  WHATSAPP_NUMBER_E164: '917039196489', // no plus sign, for wa.me (country+number)
  // Optional: Google Form POST URL (if you later want submissions to go to Google Forms)
  // Example: "https://docs.google.com/forms/d/e/<FORM_ID>/formResponse"
  GOOGLE_FORM_ACTION: '', // leave empty for now
  // If using Google Form, map form fields to entry IDs (optional)
  // Example: { firstName: 'entry.111111111', phone: 'entry.222222222' }
  GOOGLE_FORM_FIELD_MAP: {}
};

/* ---------- helpers ---------- */
function $qs(sel, root = document) { return root.querySelector(sel); }
function $qsa(sel, root = document) { return Array.from((root || document).querySelectorAll(sel)); }

function urlEncodeForm(data) {
  return Object.keys(data).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k])).join('&');
}

/* ---------- contact links initialization ---------- */
function initContactLinks() {
  $qsa('a[href^="tel:"]').forEach(a => {
    a.href = `tel:${CONFIG.PHONE.replace(/[^+\d]/g,'')}`;
    if (/call|phone/i.test(a.textContent) || a.textContent.trim().length < 6) {
      a.textContent = `Call ${CONFIG.PHONE}`;
    }
  });
  $qsa('a[href^="mailto:"]').forEach(a => {
    a.href = `mailto:${CONFIG.EMAIL}`;
  });
}

/* ---------- Modal creation ---------- */
function createAppointmentModal() {
  if ($qs('#appointment-modal')) return; // already present

  const html = `
  <div id="appointment-modal" aria-hidden="true" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:12000">
    <div id="appointment-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.45)"></div>
    <div role="dialog" aria-modal="true" aria-label="Book Appointment" style="position:relative;background:#fff;border-radius:12px;max-width:560px;width:94%;padding:20px;box-shadow:0 20px 60px rgba(2,6,23,0.18);z-index:12001">
      <button id="apt-close" aria-label="Close" style="position:absolute;right:12px;top:10px;background:none;border:0;font-size:20px;cursor:pointer">✕</button>
      <h3 style="margin:0 0 8px;font-family:'Playfair Display',serif">Book an Appointment</h3>
      <p style="margin:0 0 12px;color:#56606c">Choose a date/time and share a short note. We'll confirm via phone, email or WhatsApp.</p>

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

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
          <button type="button" id="apt-cancel" style="padding:10px 14px;border-radius:10px;border:1px solid #cdd6df;background:#fff;cursor:pointer">Cancel</button>
          <button type="submit" id="apt-submit" style="padding:10px 14px;border-radius:10px;border:0;background:#0B5C4A;color:#fff;cursor:pointer">Send via WhatsApp</button>
        </div>

        <div id="apt-feedback" style="margin-top:10px;font-size:14px;color:#556074;display:none"></div>
      </form>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  // Wire events
  $qs('#apt-close').addEventListener('click', closeModal);
  $qs('#apt-cancel').addEventListener('click', closeModal);
  $qs('#appointment-backdrop').addEventListener('click', closeModal);
  $qs('#apt-form').addEventListener('submit', handleAptSubmit);

  // focus
  const first = $qs('#apt-form input[name="firstName"]');
  if (first) first.focus();
}

function closeModal() {
  const el = $qs('#appointment-modal');
  if (el) el.remove();
}

/* ---------- Form handling ---------- */
async function handleAptSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const feedback = $qs('#apt-feedback');
  feedback.style.display = 'block';
  feedback.textContent = 'Preparing message...';

  const data = {
    firstName: form.firstName.value.trim(),
    lastName: form.lastName.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    date: form.date.value,
    time: form.time.value,
    notes: form.notes.value.trim()
  };

  // Build a friendly message
  const messageLines = [
    'Appointment request for Shree Varad Maternity',
    '',
    `Name: ${data.firstName}${data.lastName ? ' ' + data.lastName : ''}`,
    `Phone: ${data.phone}`,
    data.email ? `Email: ${data.email}` : '',
    data.date ? `Preferred Date: ${data.date}` : '',
    data.time ? `Preferred Time: ${data.time}` : '',
    '',
    `Notes: ${data.notes || '-'}`,
    '',
    'Please confirm available slots. Thank you!'
  ].filter(Boolean);

  const message = messageLines.join('\n');

  // If GOOGLE_FORM_ACTION is provided, submit to it (background)
  if (CONFIG.GOOGLE_FORM_ACTION && CONFIG.GOOGLE_FORM_ACTION.trim() !== '') {
    try {
      // if FIELD_MAP is provided, map fields; otherwise send as generic keys
      let body;
      let headers = {};
      if (Object.keys(CONFIG.GOOGLE_FORM_FIELD_MAP || {}).length > 0) {
        const mapped = {};
        const fm = CONFIG.GOOGLE_FORM_FIELD_MAP;
        if (fm.firstName) mapped[fm.firstName] = data.firstName;
        if (fm.lastName) mapped[fm.lastName] = data.lastName;
        if (fm.phone) mapped[fm.phone] = data.phone;
        if (fm.email) mapped[fm.email] = data.email;
        if (fm.date) mapped[fm.date] = data.date;
        if (fm.time) mapped[fm.time] = data.time;
        if (fm.notes) mapped[fm.notes] = data.notes;
        body = urlEncodeForm(mapped);
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        // fallback: send human-friendly payload
        body = urlEncodeForm({
          "entry.0": data.firstName,
          "entry.1": data.lastName,
          "entry.2": data.phone,
          "entry.3": data.email,
          "entry.4": data.date,
          "entry.5": data.time,
          "entry.6": data.notes
        });
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      // Fire-and-forget POST (don't block WhatsApp opening)
      fetch(CONFIG.GOOGLE_FORM_ACTION, { method: 'POST', body, headers, mode: 'no-cors' })
        .then(() => console.info('Google Form submitted (no-cors).'))
        .catch(err => console.warn('Google Form submit error', err));
    } catch (err) {
      console.warn('Form submit failed', err);
    }
  }

  // Build WhatsApp URL (wa.me)
  const waNumber = CONFIG.WHATSAPP_NUMBER_E164.replace(/\D/g,''); // e.g. 917039196489
  const encoded = encodeURIComponent(message);
  const waUrl = `https://wa.me/${waNumber}?text=${encoded}`;

  // Try opening WhatsApp in a new window/tab
  try {
    // For mobile, this will open the app. For desktop, it opens web.whatsapp.
    window.open(waUrl, '_blank');

    feedback.textContent = 'Opening WhatsApp...';
    setTimeout(() => {
      feedback.textContent = 'If WhatsApp did not open, an email will be prepared as fallback.';
    }, 1200);

    // close modal shortly after
    setTimeout(() => {
      closeModal();
    }, 1500);
  } catch (err) {
    console.warn('WhatsApp open failed', err);
    // fallback to mailto
    const subject = encodeURIComponent('Appointment request - Shree Varad Maternity');
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${CONFIG.EMAIL}?subject=${subject}&body=${body}`;
    feedback.textContent = 'Opening your email client as fallback.';
    setTimeout(() => closeModal(), 1200);
  }
}

/* ---------- Wire buttons to open modal ---------- */
function wireAppointmentButtons() {
  // elements explicitly marked
  $qsa('[data-apt="open"]').forEach(btn => {
    btn.addEventListener('click', ev => { ev.preventDefault(); createAppointmentModal(); });
  });

  // auto-attach to Book buttons (btn-primary with href=#contact or text contains book)
  $qsa('.btn-primary').forEach(btn => {
    const href = btn.getAttribute('href');
    if (href === '#contact' || /book/i.test(btn.textContent)) {
      btn.setAttribute('data-apt', 'open');
      btn.addEventListener('click', ev => { ev.preventDefault(); createAppointmentModal(); });
    }
  });
}

/* ---------- Init ---------- */
function initSite() {
  initContactLinks();
  wireAppointmentButtons();
  // expose for debugging
  window.ShreeVarad = window.ShreeVarad || {};
  window.ShreeVarad.createAppointmentModal = createAppointmentModal;
  window.ShreeVarad.config = CONFIG;
}

/* Run on DOM ready */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSite);
} else {
  initSite();
}
