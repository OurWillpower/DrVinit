# Shree Varad Maternity — Website

This repository contains a static website for Shree Varad Maternity and optional Netlify Function to receive appointment requests.

## Quick deploy (GitHub Pages)
1. Push this repository to your GitHub account (already done).
2. Go to **Repo → Settings → Pages** and ensure:
   - Source: `main` branch
   - Folder: `/ (root)`
3. Your site will be available at `https://<your-username>.github.io/<repo>/` within minutes.

## Optional: Enable appointment emails via Netlify Functions + SendGrid

### 1. Create a Netlify site and connect this GitHub repo
- Sign in to Netlify and click **New site from Git**. Connect your GitHub repo and deploy.

### 2. Add Netlify Function
- The function is at `netlify/functions/submit-appointment.js`.
- Ensure the function is committed and deployed.

### 3. Configure environment variables (Netlify site settings → Build & deploy → Environment)
- `SENDGRID_API_KEY` — your SendGrid API key
- `TO_EMAIL` — email address to receive appointment emails
- `FROM_EMAIL` — a verified sender in SendGrid (noreply@yourdomain.com)

### 4. SendGrid
- Create a SendGrid account and get an API key.
- Verify the `FROM_EMAIL` in SendGrid (domain or single sender verification).

### 5. Test
- Open the site and click **Book Appointment**. Submit the form — you should receive an email at `TO_EMAIL`.

## Local testing for functions
- You can test Netlify functions locally using `netlify dev` (Netlify CLI).
- Install with `npm i -g netlify-cli`, then run `netlify dev`.

## Google Analytics
- Add the GA4 snippet to your `<head>` (replace `G-XXXXXXXXXX` with your ID). See `analytics-head.html`.

## Privacy & Terms
- `privacy.html` and `terms.html` are ready. Customize contact info if required.

## Notes
- All assets are in `/assets/`. If you move files, update `index.html` paths to match.
