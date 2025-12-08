/**
 * scripts.js — Full replacement
 *
 * - Opens appointment modal from any element with data-apt="open"
 * - If opened from a service card, pre-fills the notes with "Service: <Service Name>"
 * - Submits to Google Form (background GET to formResponse) and opens WhatsApp with that info
 *
 * DELETE your old scripts.js and replace with this exact file.
 */

const CONFIG = {
  // WhatsApp clinic number (E.164 without +)
  WHATSAPP_NUMBER: '917039196489',
  WHATSAPP_MESSAGE_HEADER: 'Appointment request for Shree Varad Maternity',
  // Google Form endpoint (formResponse)
  GOOGLE_FORM_ACTION: 'https://docs.google.com/forms/d/e/1FAIpQLSeeST1jrxlWgftoUHKq8KtmyXjBPj-F8-bzg5EXlj2lrkSorA/formResponse',
  // Field map: update these if your Google Form entry IDs change.
  FIELD_MAP: {
    firstName: 'entry.2000000000',
    lastName: 'entry.2000000001',
    phone: 'entry.2000000002',
    email: 'entry.2000000003',
    date: 'entry.2000000004',
    time: 'entry.2000000005',
    notes: 'entry.2000000006'
  },
  PHONE_DISPLAY: '+91 7039196489',
  CONTACT_EMAIL: 'info@shreevaradmaternity.com'
};

/* ----------------- Helpers ----------------- */
function $qs(sel, root=document){ return root.querySelector(sel); }
function $qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function urlEncode(obj){
  return Object.keys(obj).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])).join('&');
}

/* ----------------- Contact links init ----------------- */
function initContactLinks(){
  $qsa('a[href^="tel:"]').forEach(a => {
    a.href = `tel:${CONFIG.PHONE_DISPLAY.replace(/\s/g,'')}`;
    if (!a.textContent.trim() || /call|phone/i.test(a.textContent)) a.textContent = `Call ${CONFIG.PHONE_DISPLAY}`;
  });
  $qsa('a[href^="mailto:"]').forEach(a => {
    a.href = `mailto:${CONFIG.CONTACT_EMAIL}`;
  });
}

/* ----------------- Modal UI ----------------- */
function createAppointmentModal(prefillService = '') {
  // If modal exists, just focus first input and update notes
  if ($qs('#appointment-modal')) {
    const notes = $qs('#apt-form textarea[name="notes"]');
    if (notes && prefillService) {
      notes.value = `Service: ${prefillService}\n\n` + (notes.value || '');
    }
    $qs('#apt-form input[name="firstName"]').focus();
    return;
  }

  const modalHtml = `
  <div id="appointment-modal" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:12000;">
    <div id="appointment-backdrop" style="position:absolute;inset:0;background:rgba(6,9,12,0.5)"></div>
    <div role="dialog" aria-modal="true" aria-label="Book appointment" style="position:relative;max-width:580px;width:94%;background:#fff;border-radius:12px;padding:20px;z-index:12001;box-shadow:0 20px 60px rgba(2,6,23,0.18)">
      <button id="apt-close" aria-label="Close" style="position:absolute;right:12px;top:10px;background:none;border:0;font-size:20px;cursor:pointer">✕</button>
      <h3 style="margin:0 0 8px;font-family:'Playfair Display',serif">Book an Appointment</h3>
      <p style="margin:0 0 12px;color:#556074">Please provide a few details and we will contact you to confirm the booking.</p>

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
          <button type="button" id="apt-cancel" style="padding:9px 12px;border-radius:8px;border:1px solid #cdd6df;background:#fff;cursor:pointer">Cancel</button>
          <button type="submit" id="apt-submit" style="padding:9px 14px;border-radius:8px;border:0;background:#0B5C4A;color:#fff;cursor:pointer">Send Request</button>
        </div>

        <div id="apt-feedback" style="margin-top:10px;font-size:14px;color:#556074;display:none"></div>
      </form>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Event wiring
  $qs('#apt-close').addEventListener('click', closeModal);
  $qs('#apt-cancel').addEventListener('click', closeModal);
  $qs('#appointment-backdrop').addEventListener('click', closeModal);
  $qs('#apt-form').addEventListener('submit', handleAptSubmit);

  // Prefill service into notes if provided
  if (prefillService) {
    const notes = $qs('#apt-form textarea[name="notes"]');
    if (notes) notes.value = `Service: ${prefillService}\n\n`;
  }

  // focus on first name
  const first = $qs('#apt-form input[name="firstName"]');
  if (first) first.focus();
}

function closeModal() {
  const modal = $qs('#appointment-modal');
  if (modal) modal.remove();
}

/* ----------------- Submission ----------------- */
function submitToGoogleForm(data) {
  // Build payload mapping using CONFIG.FIELD_MAP
  try {
    const mapping = {};
    const fm = CONFIG.FIELD_MAP || {};
    if (fm.firstName) mapping[fm.firstName] = data.firstName || '';
    if (fm.lastName) mapping[fm.lastName] = data.lastName || '';
    if (fm.phone) mapping[fm.phone] = data.phone || '';
    if (fm.email) mapping[fm.email] = data.email || '';
    if (fm.date) mapping[fm.date] = data.date || '';
    if (fm.time) mapping[fm.time] = data.time || '';
    if (fm.notes) mapping[fm.notes] = data.notes || '';

    // Fallback: if mapping empty, send to generic entry.* placeholders (best-effort)
    const hasMapping = Object.keys(mapping).length > 0;
    let query;
    if (hasMapping) {
      query = urlEncode(mapping);
    } else {
      // last-resort: generic entries (may not match your form)
      query = urlEncode({
        'entry.0': data.firstName || '',
        'entry.1': data.lastName || '',
        'entry.2': data.phone || '',
        'entry.3': data.email || '',
        'entry.4': data.date || '',
        'entry.5': data.time || '',
        'entry.6': data.notes || ''
      });
    }

    const url = CONFIG.GOOGLE_FORM_ACTION + '?' + query;
    // Use GET with no-cors: fire-and-forget record into Google Forms
    fetch(url, { method: 'GET', mode: 'no-cors' })
      .then(() => console.info('Google Form submitted (no-cors)'))
      .catch(err => console.warn('Google Form submit error', err));
  } catch (err) {
    console.warn('submitToGoogleForm failed', err);
  }
}

function handleAptSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const feedback = $qs('#apt-feedback');
  feedback.style.display = 'block';
  feedback.textContent = 'Preparing your request...';

  const data = {
    firstName: form.firstName.value.trim(),
    lastName: form.lastName.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    date: form.date.value,
    time: form.time.value,
    notes: form.notes.value.trim()
  };

  // Submit to Google Form in background
  submitToGoogleForm(data);

  // Build WhatsApp message (including detected Service if present)
  const messageLines = [
    CONFIG.WHATSAPP_MESSAGE_HEADER,
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

  // Open WhatsApp
  try {
    const waUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    feedback.textContent = 'Opening WhatsApp...';
    setTimeout(() => { closeModal(); }, 1200);
  } catch (err) {
    console.warn('WhatsApp open failed', err);
    // fallback: open mailto
    const subject = encodeURIComponent('Appointment request - Shree Varad Maternity');
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    feedback.textContent = 'Opening email as fallback...';
    setTimeout(() => closeModal(), 1200);
  }
}

/* ----------------- Wiring buttons to open modal and prefill service ----------------- */
function wireAppointmentButtons() {
  // Listen for clicks on any element with data-apt="open"
  document.body.addEventListener('click', function(ev){
    const btn = ev.target.closest('[data-apt="open"]');
    if (!btn) return;
    ev.preventDefault();

    // Determine service name:
    // 1) If button has data-service attribute, use it.
    // 2) Else find nearest .service-card and read its <h3> text.
    // 3) Else fallback to aria-label or button text.
    let serviceName = '';

    if (btn.dataset && btn.dataset.service) {
      serviceName = btn.dataset.service;
    } else {
      const serviceCard = btn.closest('.service-card');
      if (serviceCard) {
        const h3 = serviceCard.querySelector('h3');
        if (h3 && h3.textContent.trim()) serviceName = h3.textContent.trim();
      }
    }

    if (!serviceName && btn.getAttribute('aria-label')) {
      serviceName = btn.getAttribute('aria-label').replace(/Book\s*/i,'').trim();
    }

    if (!serviceName) {
      // maybe the button text itself contains the service
      const text = (btn.textContent || '').trim();
      if (text && text.length < 60) serviceName = text;
    }

    // Remove words like "Book Appointment" from serviceName if present
    serviceName = serviceName.replace(/Book Appointment|Book|Appointment/ig,'').trim();

    createAppointmentModal(serviceName);
  });

  // Also attach to top "Book Appointment" primary button(s)
  $qsa('.btn-primary').forEach(btn => {
    // If it's a Book Appointment main CTA (href="#contact" or text contains 'Book')
    const href = btn.getAttribute('href') || '';
    if (href === '#contact' || /book/i.test(btn.textContent)) {
      btn.setAttribute('data-apt','open');
    }
  });
}

/* ----------------- Init ----------------- */
function initSite() {
  initContactLinks();
  wireAppointmentButtons();
  // expose helper for debugging
  window.ShreeVarad = window.ShreeVarad || {};
  window.ShreeVarad.openApt = createAppointmentModal;
  window.ShreeVarad.config = CONFIG;
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSite);
} else {
  initSite();
}
