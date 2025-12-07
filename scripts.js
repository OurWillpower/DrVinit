/**
 * scripts.js — Form + WhatsApp combo for Shree Varad Maternity
 * Submits data to Google Form, then opens WhatsApp with same info
 */

const CONFIG = {
  WHATSAPP_NUMBER: '917039196489',  // Doctor / clinic WhatsApp (country code + number)
  WHATSAPP_MESSAGE_HEADER: 'Appointment request for Shree Varad Maternity',
  GOOGLE_FORM_ACTION: 'https://docs.google.com/forms/d/e/1FAIpQLSeeST1jrxlWgftoUHKq8KtmyXjBPj-F8-bzg5EXlj2lrkSorA/formResponse',
  // Map your form fields (entry.xxxxxx). Adjust if you change form structure.
  FIELD_MAP: {
    firstName: 'entry.2000000000',
    lastName: 'entry.2000000001',
    phone: 'entry.2000000002',
    email: 'entry.2000000003',
    date: 'entry.2000000004',
    time: 'entry.2000000005',
    notes: 'entry.2000000006'
  }
};

function serialize(obj) {
  return Object.keys(obj)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]))
    .join('&');
}

function openWhatsApp(message) {
  const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function submitToGoogleForm(data) {
  const payload = {};
  for (const key in CONFIG.FIELD_MAP) {
    if (data[key] !== undefined) payload[CONFIG.FIELD_MAP[key]] = data[key];
  }
  const body = serialize(payload);
  // Google Forms requires no CORS, send via GET fallback
  const url = `${CONFIG.GOOGLE_FORM_ACTION}?${body}`;
  fetch(url, { method: 'GET', mode: 'no-cors' })
    .then(() => console.log('Google Form submitted'))
    .catch(e => console.warn('Google Form submit error', e));
}

function createAppointmentModal() {
  if (document.getElementById('appointment-modal')) return;
  const html = `
  <div id="appointment-modal" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:2000;">
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.5)"></div>
    <div style="background:#fff;padding:20px;border-radius:12px;max-width:500px;width:95%;box-shadow:0 10px 40px rgba(0,0,0,0.2);position:relative;">
      <button id="apt-close" style="position:absolute;top:12px;right:14px;border:none;background:none;font-size:20px;cursor:pointer">✕</button>
      <h3 style="margin:0 0 12px;font-family:'Playfair Display',serif">Book an Appointment</h3>
      <form id="apt-form">
        <div style="display:grid;gap:10px">
          <input name="firstName" required placeholder="First name" style="padding:10px;border:1px solid #ccc;border-radius:6px" />
          <input name="lastName" placeholder="Last name" style="padding:10px;border:1px solid #ccc;border-radius:6px" />
          <input name="phone" required placeholder="Mobile number" style="padding:10px;border:1px solid #ccc;border-radius:6px" />
          <input name="email" placeholder="Email (optional)" style="padding:10px;border:1px solid #ccc;border-radius:6px" />
          <input name="date" type="date" style="padding:10px;border:1px solid #ccc;border-radius:6px" />
          <input name="time" type="time" style="padding:10px;border:1px solid #ccc;border-radius:6px" />
          <textarea name="notes" placeholder="Notes / symptoms (optional)" rows="4" style="padding:10px;border:1px solid #ccc;border-radius:6px"></textarea>
        </div>
        <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">
          <button type="button" id="apt-cancel" style="padding:10px 16px;border:1px solid #999;background:#fff;border-radius:6px;cursor:pointer">Cancel</button>
          <button type="submit" style="padding:10px 16px;background:#0B5C4A;color:#fff;border:none;border-radius:6px;cursor:pointer">Send via WhatsApp</button>
        </div>
      </form>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('apt-close').onclick = closeModal;
  document.getElementById('apt-cancel').onclick = closeModal;
  document.getElementById('apt-form').onsubmit = onFormSubmit;
}

function closeModal() {
  const m = document.getElementById('appointment-modal');
  if (m) m.remove();
}

function onFormSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const data = {
    firstName: f.firstName.value.trim(),
    lastName: f.lastName.value.trim(),
    phone: f.phone.value.trim(),
    email: f.email.value.trim(),
    date: f.date.value,
    time: f.time.value,
    notes: f.notes.value.trim()
  };
  // Submit to Google Form for record
  submitToGoogleForm(data);
  // Build message
  const msgLines = [
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
  ];
  const message = msgLines.filter(Boolean).join('\n');
  // Open WhatsApp
  openWhatsApp(message);
  // close modal after short delay
  setTimeout(closeModal, 1500);
}

function initAppointment() {
  // Book Appointment buttons
  const btns = Array.from(document.querySelectorAll('.btn-primary, a[href="#contact"]'));
  btns.forEach(b => {
    b.addEventListener('click', ev => {
      ev.preventDefault();
      createAppointmentModal();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAppointment();
});
