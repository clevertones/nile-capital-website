const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Anthropic API key is not configured.' });
  }

  const { model, messages, system, max_tokens } = req.body || {};
  if (!model || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing model or messages' });
  }

  const anthropicMessages = messages
    .filter((msg) => msg && msg.role && typeof msg.content === 'string')
    .map((msg) => ({
      role: msg.role,
      content: [{ type: 'text', text: msg.content }],
    }));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages: anthropicMessages,
        system: system || undefined,
        max_tokens: max_tokens || 400,
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Vercel API /api/chat error:', error);
    return res.status(500).json({ error: 'Proxy request failed' });
  }
};
