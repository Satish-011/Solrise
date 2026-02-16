# Solrise - Codeforces Ladder & Analytics Dashboard

Solrise is a modern competitive programming dashboard for Codeforces users. It helps you track your progress, visualize stats, and climb the ladder efficiently.

**Features:**

- Personalized Codeforces ladder
- Contest stats and analytics
- Hide solved problems per topic
- Contribution heatmap, rating charts, streak tracker
- Secure API routes, input validation, and production-ready deployment
- Custom favicon and branding (orange lightning bolt logo)

**Live Demo:** [solrise-alpha.vercel.app](https://solrise-alpha.vercel.app)

---

## Getting Started

## Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/Satish-011/Solrise.git
   cd Solrise
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:8000](http://localhost:8000) in your browser.

## Security

- Sensitive files (security reports, attack simulations) are NOT tracked in git or history.
- `.env` files are ignored; `.env.example` is provided for configuration template.
- All user input is validated; API routes are protected.

## Customization

- Favicon and branding use the Solrise logo (orange rounded square with white lightning bolt).
- To change branding, update `src/app/icon.svg` and navbar logo in `src/components/navbar/Navbar.tsx`.

---

## Deploy

Solrise is deployed on [Vercel](https://vercel.com/). Push to `main` branch to trigger redeploy.

---

## License

MIT License. See LICENSE for details.
