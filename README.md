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
