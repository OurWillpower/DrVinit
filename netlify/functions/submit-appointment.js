// netlify/functions/submit-appointment.js
// Node 18 runtime compatible. Requires SENDGRID_API_KEY, TO_EMAIL, FROM_EMAIL env vars.

const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

    const payload = JSON.parse(event.body || '{}');
    const {
      firstName = '',
      lastName = '',
      phone = '',
      email = '',
      date = '',
      time = '',
      notes = ''
    } = payload;

    // Basic validation
    if (!firstName || !phone) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: firstName or phone.' })
      };
    }

    const to = process.env.TO_EMAIL;
    const from = process.env.FROM_EMAIL;

    if (!to || !from) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email destination not configured (TO_EMAIL or FROM_EMAIL missing).' })
      };
    }

    const subject = `Appointment Request: ${firstName} ${lastName} (${phone})`;
    const html = `
      <h2>New Appointment Request</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Preferred Date:</strong> ${date || 'Not specified'}</p>
      <p><strong>Preferred Time:</strong> ${time || 'Not specified'}</p>
      <p><strong>Notes:</strong><br/>${notes ? notes.replace(/\n/g, '<br/>') : '—'}</p>
      <hr/>
      <p>Sent from Shree Varad Maternity website</p>
    `;

    const msg = {
      to,
      from,
      subject,
      html,
    };

    await sgMail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Appointment request sent.' })
    };
  } catch (err) {
    console.error('submit-appointment error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email', details: err?.message || err })
    };
  }
};
