// Simple Node/Express proxy for Anthropic API
// Usage: create a .env file with ANTHROPIC_API_KEY and run `npm install` then `npm start`

const path = require('path');
const { readFile } = require('fs/promises');
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
const INTELLIGENCE_FEED_PATH = path.join(__dirname, 'data', 'intelligence-data.json');
const INTELLIGENCE_SOURCE_URLS = (process.env.INTELLIGENCE_SOURCE_URLS || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

if (!ANTHROPIC_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY is not set. Set it in .env before using the proxy.');
}

async function loadLocalIntelligenceFeed() {
  const raw = await readFile(INTELLIGENCE_FEED_PATH, 'utf8');
  const data = JSON.parse(raw);
  return data && data.chart ? data : { chart: data };
}

function normalizeIntelligenceChart(payload, fallbackSource) {
  const chart = payload && payload.chart ? payload.chart : payload;
  if (!chart || !Array.isArray(chart.labels) || !Array.isArray(chart.values)) return null;

  return {
    labels: chart.labels.map((label) => String(label)),
    values: chart.values.map((value) => Number(value)),
    colors: Array.isArray(chart.colors) ? chart.colors : undefined,
    source: chart.source || fallbackSource || 'NiLe Capital intelligence feed',
    lastUpdated: chart.lastUpdated || payload.lastUpdated || new Date().toISOString(),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status} for ${url}`);
  }
  return response.json();
}

function compareChartFreshness(a, b) {
  const aYear = Number((a.labels || [])[a.labels.length - 1]) || 0;
  const bYear = Number((b.labels || [])[b.labels.length - 1]) || 0;
  if (aYear !== bYear) return aYear - bYear;

  const aUpdated = Date.parse(a.lastUpdated || '') || 0;
  const bUpdated = Date.parse(b.lastUpdated || '') || 0;
  return aUpdated - bUpdated;
}

async function resolveIntelligenceFeed() {
  const remoteCharts = [];

  for (const sourceUrl of INTELLIGENCE_SOURCE_URLS) {
    try {
      const payload = await fetchJson(sourceUrl);
      const chart = normalizeIntelligenceChart(payload, sourceUrl);
      if (chart) {
        remoteCharts.push({ ...chart, sourceUrl });
      }
    } catch (error) {
      console.warn('[intelligence] Unable to load source feed:', sourceUrl, error.message);
    }
  }

  if (remoteCharts.length) {
    const freshestChart = remoteCharts.sort(compareChartFreshness).pop();
    return {
      chart: freshestChart,
      metadata: {
        mode: 'remote',
        refreshedAt: new Date().toISOString(),
        sourceCount: remoteCharts.length,
        sourcesChecked: INTELLIGENCE_SOURCE_URLS,
      },
    };
  }

  const localFeed = await loadLocalIntelligenceFeed();
  const localChart = normalizeIntelligenceChart(localFeed, 'local-fallback');

  return {
    chart: localChart || {
      labels: [],
      values: [],
      colors: [],
      source: 'local-fallback',
      lastUpdated: new Date().toISOString(),
    },
    metadata: {
      mode: 'local',
      refreshedAt: new Date().toISOString(),
      sourceCount: 1,
      sourcesChecked: [INTELLIGENCE_FEED_PATH],
    },
  };
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

app.get('/api/intelligence-data', async (req, res) => {
  try {
    const data = await resolveIntelligenceFeed();
    return res.json(data);
  } catch (error) {
    console.error('Intelligence feed error:', error);
    try {
      const localFeed = await loadLocalIntelligenceFeed();
      return res.json({
        chart: normalizeIntelligenceChart(localFeed, 'local-fallback'),
        metadata: {
          mode: 'local',
          refreshedAt: new Date().toISOString(),
          sourceCount: 1,
          sourcesChecked: [INTELLIGENCE_FEED_PATH],
        },
      });
    } catch (fallbackError) {
      console.error('Local intelligence feed fallback failed:', fallbackError);
      return res.status(500).json({ error: 'Unable to load intelligence feed' });
    }
  }
});

app.listen(PORT, () => console.log(`Nile proxy listening on http://localhost:${PORT}`));
