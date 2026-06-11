# NiLe Capital Fund Website

Official website for NiLe Capital Fund - Strategic investment solutions for sustainable growth.

## Project Structure

```
nile-capital-website/
├── index.html              # Main landing page
├── assets/
│   ├── css/
│   │   └── style.css       # Main stylesheet
│   └── js/
│       └── script.js       # JavaScript functionality
├── README.md               # This file
└── .gitignore              # Git ignore rules
```

## Features

- **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- **Professional Styling** - Modern gradient design with smooth animations
- **Navigation Menu** - Easy navigation between sections
- **Hero Section** - Eye-catching introduction
- **Services Overview** - Showcase your offerings
- **Contact Form** - Collect inquiries from visitors
- **Smooth Scrolling** - Enhanced user experience

## Getting Started

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/clevertones/nile-capital-website.git
cd nile-capital-website
```

2. Open `index.html` in your browser or use a local server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server
```

3. Visit `http://localhost:8000` in your browser

### Deployment on GitHub Pages

1. Push your changes to the repository:
```bash
git add .
git commit -m "Add website structure"
git push origin main
```

2. Enable GitHub Pages:
   - Go to your repository settings on GitHub
   - Navigate to "Pages" in the left sidebar
   - Select "main" branch as the source
   - Save

3. Your website will be available at: `https://clevertones.github.io/nile-capital-website/`

### Deployment on Vercel

1. Create a new Vercel project and connect it to this repository.
2. Add a project environment variable:
   - `ANTHROPIC_API_KEY`
3. Keep `api/chat.js` in the repo root so Vercel serves it as a serverless function.
4. Deploy the project.

After deployment, the chat widget should use `/api/chat` on your Vercel domain.

## Customization

### Colors
Edit the color values in `assets/css/style.css`:
- Primary Color: `#667eea` (purple)
- Secondary Color: `#00d4ff` (cyan)
- Dark Background: `#1a1a1a`

### Content
Edit `index.html` to update:
- Company name and tagline
- About section text
- Services description
- Contact form

### Contact Form
Currently, the contact form shows a success message. To make it functional:
- Use a service like Formspree, Netlify Forms, or EmailJS
- Or set up a backend server to handle form submissions

## Technologies Used

- HTML5
- CSS3 (with animations and responsive design)
- Vanilla JavaScript (no dependencies)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use this project for commercial or personal purposes.

## Contact

For more information about NiLe Capital Fund, visit our website or contact us through the contact form.

## Local proxy for chat (Anthropic)

This project includes a small Node/Express proxy that forwards `/api/chat` requests to the Anthropic API using a server-side API key.

1. Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`.
2. Install dependencies:

```bash
npm install
```

3. Start the proxy (default port 3000):

```bash
npm start
```

4. Open your site (if using a static server) and ensure the chat widget POSTs to `/api/chat`.

Important: Do NOT commit your real API key to the repository. Use environment variables and a secure host for production.

## Live intelligence feed

The intelligence page now refreshes from `/api/intelligence-data` and polls for updates automatically.

1. Run the Node server so the endpoint is available:

```bash
npm start
```

2. Configure remote JSON feeds in `.env` if you have them:

```bash
INTELLIGENCE_SOURCE_URLS=https://source1.example/data.json,https://source2.example/data.json
```

3. Each source should return either `{ "chart": { "labels": [...], "values": [...], "colors": [...] } }` or the chart object directly.

If no remote source is configured, the endpoint falls back to `data/intelligence-data.json` so the page still renders locally.

