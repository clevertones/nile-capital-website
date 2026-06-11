const INTELLIGENCE_REFRESH_MS = 15 * 60 * 1000;
const INTELLIGENCE_FETCH_TIMEOUT_MS = 3500;

function isValidChartPayload(payload) {
  const chart = payload && payload.chart ? payload.chart : payload;
  return !!chart && Array.isArray(chart.labels) && Array.isArray(chart.values);
}

async function fetchJsonWithTimeout(endpoint) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), INTELLIGENCE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) return null;

    const payload = await response.json();
    return isValidChartPayload(payload) ? payload : null;
  } catch (error) {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchIntelligenceData() {
  const endpoints = window.location.protocol === 'file:'
    ? ['data/intelligence-data.json', '/api/intelligence-data']
    : ['/api/intelligence-data', 'data/intelligence-data.json'];

  for (const endpoint of endpoints) {
    const payload = await fetchJsonWithTimeout(endpoint);
    if (payload) return payload;
  }

  return window.NILE_INTELLIGENCE_DATA || null;
}

function applyIntelligenceData(payload) {
  if (!payload) return null;

  const chartData = payload.chart && Array.isArray(payload.chart.labels)
    ? payload.chart
    : payload;

  if (typeof window.setNileIntelligenceData === 'function') {
    const applied = window.setNileIntelligenceData(chartData);
    if (payload.metadata) {
      applied.metadata = payload.metadata;
    }
    window.NILE_INTELLIGENCE_DATA = applied;
    return applied;
  }

  return payload;
}

function formatTickValue(value) {
  const rounded = Number(value).toFixed(1);
  return `$${rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded}B`;
}

function buildTrendChart(data) {
  const canvas = document.getElementById('trendChart');
  if (!canvas || !window.Chart || !data || !data.chart) return;

  if (window.__nileTrendChart) {
    window.__nileTrendChart.destroy();
  }

  const context = canvas.getContext('2d');
  const chartValues = data.chart.values || [];
  const chartLabels = data.chart.labels || [];
  const maxValue = chartValues.length ? Math.max(...chartValues) : 0;

  const footerLeft = document.querySelector('.nc-chart-footer .nc-footer-left');
  if (footerLeft) {
    const updatedSource = data.metadata?.refreshedAt || data.chart.lastUpdated;
    const updatedAt = updatedSource ? new Date(updatedSource) : null;
    const updatedLabel = updatedAt && !Number.isNaN(updatedAt.getTime())
      ? updatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : 'Unknown';
    const latestYear = data.chart.labels?.[data.chart.labels.length - 1] || 'unknown';
    footerLeft.textContent = `Source: ${data.chart.source || 'NiLe Capital data feed'} · Refreshed: ${updatedLabel} · Latest year: ${latestYear}`;
  }

  window.__nileTrendChart = new Chart(context, {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'VC investment ($B)',
        data: chartValues,
        backgroundColor: (context) => data.chart.colors?.[context.dataIndex] || '#5DCAA5',
        borderRadius: 10,
        borderSkipped: false,
        borderColor: 'rgba(255,255,255,0.24)',
        borderWidth: 1,
        barPercentage: 0.88,
        categoryPercentage: 0.78,
        maxBarThickness: 92,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 10, right: 4, bottom: 2, left: 4 },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,0.96)',
          titleColor: '#f8fafc',
          bodyColor: '#e5e7eb',
          borderColor: 'rgba(17,24,39,0.15)',
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            label(context) {
              return ` ${context.dataset.label}: ${formatTickValue(context.raw)}`;
            },
          },
        },
      },
      scales: {
        x: {
          offset: true,
          ticks: {
            color: '#8b8f95',
            font: {
              family: 'IBM Plex Mono, monospace',
              size: 12,
            },
          },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          max: maxValue ? Math.max(4, Math.ceil(maxValue)) : 4,
          grace: 0,
          ticks: {
            color: '#8b8f95',
            font: {
              family: 'IBM Plex Mono, monospace',
              size: 11,
            },
            stepSize: 0.5,
            callback(value) { return formatTickValue(value); },
          },
          grid: { color: 'rgba(15,23,42,0.07)' },
          border: { display: false },
        },
      },
    },
  });
}

function initTrendChartRefresh() {
  if (window.__nileTrendRefreshStarted) return;
  window.__nileTrendRefreshStarted = true;

  let refreshHandle;

  async function refreshTrendChart() {
    const fetchedData = await fetchIntelligenceData();
    const appliedData = applyIntelligenceData(fetchedData || window.NILE_INTELLIGENCE_DATA);
    if (!appliedData) return;
    buildTrendChart(appliedData);
  }

  refreshTrendChart();
  refreshHandle = window.setInterval(refreshTrendChart, INTELLIGENCE_REFRESH_MS);
  window.addEventListener('beforeunload', () => {
    if (refreshHandle) window.clearInterval(refreshHandle);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTrendChartRefresh);
} else {
  initTrendChartRefresh();
}
