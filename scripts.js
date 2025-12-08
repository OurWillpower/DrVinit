/**
 * scripts.js — Full replacement (service-aware + first-time/repeat option)
 *
 * - Opens appointment modal from any element with data-apt="open"
 * - If opened from a service card (or button with data-service), pre-fills the notes with "Service: <Service Name>"
 * - Adds "First time visit / Repeat visit" radio fields into the modal
 * - Submits to Google Forms (background GET) and opens WhatsApp with the selected service and visit type
 *
 * Replace Google Form entry IDs in CONFIG.FIELD_MAP with your real entry.* IDs when available.
 */

const CONFIG = {
  WHATSAPP_NUMBER: '917039196489',  // E.164 without plus
  WHATSAPP_MESSAGE_HEADER: 'Appointment request for Shree Varad Maternity',
  GOOGLE_FORM_ACTION: 'https://docs.google.com/forms/d/e/1FAIpQLSeeST1jrxlWgftoUHKq8KtmyXjBPj-F8-bzg5EXlj2lrkSorA/formResponse',
  // Add your real Google Form entry IDs here (update when you have them).
  FIELD_MAP: {
    firstName: 'entry.2000000000',
    lastName: 'entry.2000000001',
    phone: 'entry.2000000002',
    email: 'entry.2000000003',
    date: 'entry.2000000004',
    time: 'entry.2000000005',
    notes: 'entry.2000000006',
    firstTime: 'entry.2000000007'  // NEW: first-time vs repeat
  },
  PHONE_DISPLAY: '+91 7039196489',
  CONTACT_EMAIL: 'info@shreevaradmaternity.com'
};

/* Helpers */
function $qs(sel, root=document){ return root.querySelector(sel); }
function $qsa(sel, root=document){ return Array.from((root||document).querySelectorAll(sel)); }
function urlEncode(obj){ return Object.keys(obj).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])).join('&'); }

/* Init contact links */
function initContactLinks(){
  $qsa('a[href^="tel:"]').forEach(a => {
    a.href = `tel:${CONFIG.PHONE_DISPLAY.replace(/\s/g,'')}`;
    if (!a.textContent.trim() || /call|phone/i.test(a.textContent)) a.textContent = `Call ${CONFIG.PHONE_DISPLAY}`;
  });
  $qsa('a[href^="mailto:"]').forEach(a => {
    a.href = `mailto:${CONFIG.CONTACT_EMAIL}`;
  });
}

/* Modal creation with firstTime radio */
function createAppointmentModal(prefillService = '') {
  if ($qs('#appointment-modal')) {
    const notes = $qs('#apt-form textarea[name="notes"]');
    if (notes && prefillService) {
      notes.value = `Service: ${prefillService}\n\n` + (notes.value || '');
    }
    $qs('#apt-form input[name="firstName"]').focus();
    return;
  }

  const html = `
  <div id="appointment-modal" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:12000">
    <div id="appointment-backdrop" style="position:absolute;inset:0;background:rgba(6,9,12,0.5)"></div>
    <div role="dialog" aria-modal="true" aria-label="Book appointment" style="position:relative;max-width:600px;width:94%;background:#fff;border-radius:12px;padding:20px;z-index:12001;box-shadow:0 20px 60px rgba(2,6,23,0.18)">
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

        <!-- First time / Repeat -->
        <fieldset style="margin-top:10px;border:0;padding:0">
          <legend style="font-weight:700;margin-bottom:6px">Visit type</legend>
          <label style="margin-right:12px"><input type="radio" name="firstTime" value="First time visit" checked /> First time</label>
          <label><input type="radio" name="firstTime" value="Repeat visit" /> Repeat</label>
        </fieldset>

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

  document.body.insertAdjacentHTML('beforeend', html);

  $qs('#apt-close').addEventListener('click', closeModal);
  $qs('#apt-cancel').addEventListener('click', closeModal);
  $qs('#appointment-backdrop').addEventListener('click', closeModal);
  $qs('#apt-form').addEventListener('submit', handleAptSubmit);

  if (prefillService) {
    const notes = $qs('#apt-form textarea[name="notes"]');
    if (notes) notes.value = `Service: ${prefillService}\n\n`;
  }

  const first = $qs('#apt-form input[name="firstName"]');
  if (first) first.focus();
}

function closeModal(){ const modal = $qs('#appointment-modal'); if (modal) modal.remove(); }

/* Submit to Google Form (background) */
function submitToGoogleForm(data) {
  try {
    const fm = CONFIG.FIELD_MAP || {};
    const payload = {};
    if (fm.firstName) payload[fm.firstName] = data.firstName || '';
    if (fm.lastName) payload[fm.lastName] = data.lastName || '';
    if (fm.phone) payload[fm.phone] = data.phone || '';
    if (fm.email) payload[fm.email] = data.email || '';
    if (fm.date) payload[fm.date] = data.date || '';
    if (fm.time) payload[fm.time] = data.time || '';
    if (fm.notes) payload[fm.notes] = data.notes || '';
    if (fm.firstTime) payload[fm.firstTime] = data.firstTime || '';

    const query = urlEncode(payload);
    const url = CONFIG.GOOGLE_FORM_ACTION + '?' + query;
    fetch(url, { method: 'GET', mode: 'no-cors' })
      .then(() => console.info('Google Form submitted (no-cors)'))
      .catch(err => console.warn('Google Form submit error', err));
  } catch (err) {
    console.warn('submitToGoogleForm failed', err);
  }
}

/* Form submit handler */
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
    firstTime: (form.firstTime && form.firstTime.value) ? form.firstTime.value : 'First time visit',
    notes: form.notes.value.trim()
  };

  // Ensure service line exists in notes (if not, try to include firstTime)
  if (!data.notes.toLowerCase().includes('service:') && data.firstTime) {
    data.notes = `Visit type: ${data.firstTime}\n\n` + data.notes;
  }

  submitToGoogleForm(data);

  // Build WhatsApp message
  const messageLines = [
    CONFIG.WHATSAPP_MESSAGE_HEADER,
    '',
    `Name: ${data.firstName}${data.lastName ? ' ' + data.lastName : ''}`,
    `Phone: ${data.phone}`,
    data.email ? `Email: ${data.email}` : '',
    data.date ? `Preferred Date: ${data.date}` : '',
    data.time ? `Preferred Time: ${data.time}` : '',
    '',
    `Visit Type: ${data.firstTime || '-'}`,
    '',
    `Notes: ${data.notes || '-'}`,
    '',
    'Please confirm available slots. Thank you!'
  ].filter(Boolean);

  const message = messageLines.join('\n');

  try {
    const waUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    feedback.textContent = 'Opening WhatsApp...';
    setTimeout(() => closeModal(), 1200);
  } catch (err) {
    console.warn('WhatsApp open failed', err);
    const subject = encodeURIComponent('Appointment request - Shree Varad Maternity');
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    feedback.textContent = 'Opening email as fallback...';
    setTimeout(() => closeModal(), 1200);
  }
}

/* Wire service Book buttons and top links */
function wireAppointmentButtons() {
  document.body.addEventListener('click', function(ev){
    const btn = ev.target.closest('[data-apt="open"]');
    if (!btn) return;
    ev.preventDefault();

    // explicit service via data-service preferred
    let serviceName = (btn.dataset && btn.dataset.service) ? btn.dataset.service.trim() : '';

    if (!serviceName) {
      const card = btn.closest('.service-card');
      if (card) {
        const h3 = card.querySelector('h3');
        if (h3 && h3.textContent) serviceName = h3.textContent.trim();
      }
    }

    if (!serviceName && btn.getAttribute('aria-label')) {
      serviceName = btn.getAttribute('aria-label').replace(/Book\s*/i,'').trim();
    }

    createAppointmentModal(serviceName);
  });

  // ensure no global Book CTA conflicts — if someone still has a .btn-primary with Book text, treat it as scroll to services
  $qsa('.btn-primary').forEach(btn => {
    const txt = (btn.textContent || '').toLowerCase();
    if (txt.includes('book') && !btn.hasAttribute('data-apt')) {
      // keep as link to #services
      if (btn.getAttribute('href') === '#contact') btn.setAttribute('href','#services');
    }
  });
}

/* Init */
function initSite() {
  initContactLinks();
  wireAppointmentButtons();
  window.ShreeVarad = window.ShreeVarad || {};
  window.ShreeVarad.openApt = createAppointmentModal;
  window.ShreeVarad.config = CONFIG;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSite);
else initSite();
