# S&S Cake House — Website + Owner Dashboard

A responsive multi-page cake shop website with a pink/white luxury style, editable menu, image uploads, order basket, customer checkout, and an owner dashboard.

## Included pages
- `index.html` — home page and featured cakes
- `menu.html` — full cake menu
- `about.html` — story page
- `contact.html` — contact details
- `order.html` — basket and full order form
- `/admin` — owner dashboard (orders, products, prices, photos, contact details)

## Requirements
- Node.js 18 or newer
- An SMTP email account to send new order notifications (optional for local testing)

## Run locally
1. Install Node.js from https://nodejs.org/
2. Extract this ZIP.
3. Open a terminal in the extracted `ss-cake-house` folder.
4. Run `npm install`
5. Copy `.env.example` to `.env`.
6. Set a secure admin password hash (instructions below), session secret, and email SMTP settings.
7. Run `npm start`
8. Visit http://localhost:3000

## Secure owner login setup
Generate a bcrypt password hash in the project folder:
```bash
node -e "require('bcryptjs').hash('ChooseYourOwnStrongPassword',12).then(console.log)"
```
Copy the resulting hash into `.env` as `ADMIN_PASSWORD_HASH=...`.
Set `ADMIN_USERNAME=owner` or your preferred username. Do not leave the hash blank.
Open the dashboard at http://localhost:3000/admin.

## Email notifications for orders (Gmail example)
1. Use a Gmail account for your business (or another SMTP provider).
2. Enable 2-Step Verification on the Google account.
3. Create a Google **App Password** from Google Account security settings.
4. In `.env`, set:
   - `ORDER_EMAIL` = the inbox that should receive new order alerts
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=465`
   - `SMTP_SECURE=true`
   - `SMTP_USER` = Gmail address used to send the alert
   - `SMTP_PASS` = the Google App Password (not your normal Gmail password)
5. Restart the server after changing `.env`.

**Important:** The site stores orders in `data/store.json` even if email is not configured. The dashboard remains the backup place to view every order. The customer receives an order reference, not an automatic email confirmation. Owner email notifications are attempted when SMTP is configured.

## Editing the website
- Use `/admin` → **Cakes & prices** to add, edit or delete menu items and upload photos (JPG, PNG, WEBP, GIF; max 5MB).
- Use `/admin` → **Website details** to change the business name, phone, public email, WhatsApp number, Instagram, address and delivery note.
- Use **Orders** to see customer details and update order status.
- Uploaded photos are stored in `public/uploads/`; order and product data is stored in `data/store.json`.

## Before going live
- Replace sample cake photos, prices, phone, email and address with your real business information.
- Configure SMTP and change the default session secret.
- Deploy to a Node.js host (for example Render, Railway, a VPS, or another Node hosting provider).
- Use HTTPS in production and set `NODE_ENV=production`.
- Set up regular backups of `data/store.json` and `public/uploads/`.
- For a public production store, add a persistent session store and database, rate limiting, payment integration and a privacy/terms page as appropriate.
- Prices and delivery costs are indicative until you confirm the order with the customer. No online payment is collected in this starter project.

## Notes
This is a complete runnable starter project, but it is not hosted online by creating this ZIP. Email sending requires your own SMTP credentials. Keep `.env` private and never upload it to a public repository.
