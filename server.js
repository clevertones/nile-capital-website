// Simple Node/Express proxy for Anthropic API
// Usage: create a .env file with ANTHROPIC_API_KEY and run `npm install` then `npm start`

const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const staticDir = path.join(__dirname);
app.use(express.static(staticDir));

const PORT = process.env.PORT || 3000;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY is not set. Set it in .env before using the proxy.');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { model, messages, system, max_tokens } = req.body;
    if (!model || !messages) return res.status(400).json({ error: 'Missing model or messages' });
    if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'Anthropic API key is not configured.' });

    // Debug: log basic request info (do not log secrets)
    console.log('[proxy] Incoming /api/chat', { model, messagesCount: Array.isArray(messages) ? messages.length : 0, hasSystem: !!system, max_tokens });

    const anthropicMessages = [];
    for (const msg of messages) {
      if (!msg.role || !msg.content) continue;
      anthropicMessages.push({
        role: msg.role,
        content: [{ type: 'text', text: msg.content }]
      });
    }

    const body = {
      model,
      messages: anthropicMessages,
      system: system || undefined,
      max_tokens: max_tokens || 400,
      temperature: 0.2
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    // Debug: log Anthropic response body (trim large fields in production)
    console.log('[proxy] Anthropic response', { status: response.status, body: data });
    if (!response.ok) {
      console.error('Anthropic API returned error:', response.status, data);
    }
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy error' });
  }
});

app.listen(PORT, () => console.log(`Nile proxy listening on http://localhost:${PORT}`));
