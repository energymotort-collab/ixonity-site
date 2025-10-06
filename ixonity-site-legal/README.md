# Ixonity Landing (GitHub Pages ready)

A bilingual (EN/UA) dark landing with a minimal neon/glass style and logo animation.
Just upload these files to a GitHub repo and enable **Settings → Pages → Deploy from Branch**.

## Quick Start
1. Create a new repository, e.g. `ixonity-site`.
2. Upload all files from this folder to the repo root (keep the `assets/` folder).
3. In **Settings → Pages**, choose `main` branch and `/ (root)`.
4. Wait for the green check — your site is live at `https://YOUR_USERNAME.github.io/REPO_NAME/`.

### Custom domain (optional)
- In **Settings → Pages → Custom domain**, enter your domain (e.g. `ixonity.com`).
- In your domain DNS, add a CNAME record pointing to `YOUR_USERNAME.github.io`.
- Commit a `CNAME` file with your domain as the only line (optional but recommended).

## Editing content
- Change `CONTACT_EMAIL` and `PHONE_WHATSAPP` in `script.js`.
- Replace social links in the Contact card.
- Text is fully localized via `data-i18n` keys in `index.html` and strings in `script.js`.
- Replace images in `assets/` with your preferred artwork.

## Notes
- The contact form opens a pre-filled email (no backend needed for GitHub Pages).
- If you later want true form submissions, plug in services like Formspree or Netlify Forms.
