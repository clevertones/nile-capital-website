/* ============================================================
   js/data.js — All dashboard data in one place.
   Edit this file to update sectors, countries, opportunities.
   ============================================================ */

const SECTORS = [
  { name: 'Mobile Financial Services', pct: 94, color: '#1D9E75' },
  { name: 'AI / SaaS Platforms', pct: 88, color: '#7F77DD' },
  { name: 'Digital Infrastructure', pct: 81, color: '#378ADD' },
  { name: 'AgriTech', pct: 73, color: '#639922' },
  { name: 'HealthTech', pct: 67, color: '#D4537E' },
  { name: 'E-commerce & Logistics', pct: 62, color: '#BA7517' },
];

const COUNTRIES = [
  { flag: '🇰🇪', name: 'Kenya', gdp: '$123B', growth: '+5.4%', rank: '#1 Fintech hub' },
  { flag: '🇹🇿', name: 'Tanzania', gdp: '$84B', growth: '+5.1%', rank: '#2 Mobile money' },
  { flag: '🇪🇹', name: 'Ethiopia', gdp: '$156B', growth: '+7.2%', rank: '#1 by GDP size' },
  { flag: '🇺🇬', name: 'Uganda', gdp: '$49B', growth: '+5.8%', rank: '#3 Startup exits' },
  { flag: '🇷🇼', name: 'Rwanda', gdp: '$14B', growth: '+7.0%', rank: '#1 Ease of doing biz' },
];

const OPPORTUNITIES = [
  {
    icon: 'ti-device-mobile',
    bg: '#E1F5EE', iconColor: '#1D9E75',
    title: 'M-Pesa API integration plays',
    meta: 'Kenya · Fintech · $2M–$15M range',
  },
  {
    icon: 'ti-solar-panel',
    bg: '#EAF3DE', iconColor: '#639922',
    title: 'Off-grid solar + pay-as-you-go',
    meta: 'Tanzania, Uganda · CleanTech · Series A',
  },
  {
    icon: 'ti-building-bank',
    bg: '#E6F1FB', iconColor: '#378ADD',
    title: 'SME digital lending infrastructure',
    meta: 'Ethiopia · Fintech · High growth, low competition',
  },
  {
    icon: 'ti-cpu',
    bg: '#EEEDFE', iconColor: '#7F77DD',
    title: 'AI crop advisory platforms',
    meta: 'Rwanda, Kenya · AgriTech + AI · Seed stage',
  },
];

const DEFAULT_CHART_DATA = {
  labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
  values: [0.4, 0.6, 1.1, 1.8, 2.9, 3.6],
  colors: ['#9FE1CB', '#9FE1CB', '#5DCAA5', '#5DCAA5', '#1D9E75', '#0F6E56'],
  source: 'World Bank, IMF, GSMA, Partech Africa',
  lastUpdated: '2025-01-01',
};

const AI_SYSTEM_PROMPT = `You are an expert East Africa investment analyst for Nile Capital, a fintech-focused investment firm. You have deep knowledge of East African markets including Kenya, Tanzania, Ethiopia, Uganda, Rwanda, and surrounding regions. You specialize in: mobile financial services, fintech SaaS, digital infrastructure, AI applications, and emerging market investments. Give concise, data-driven, actionable insights. Keep answers under 120 words. Be specific to East Africa context. Sound like a senior analyst briefing investors.`;

function buildIntelligenceData(chartData = DEFAULT_CHART_DATA) {
  return {
    sectors: SECTORS.map((sector) => ({
      name: sector.name,
      score: sector.pct,
      copy: sector.name === 'Mobile Financial Services'
        ? 'Payments, wallet rails, and embedded finance continue to dominate the regional opportunity stack.'
        : sector.name === 'AI / SaaS Platforms'
          ? 'Workflow automation and enterprise software are rising as firms digitise operations.'
          : sector.name === 'Digital Infrastructure'
            ? 'Connectivity, cloud, and network infrastructure remain the backbone of growth.'
            : sector.name === 'AgriTech'
              ? 'Farm productivity, climate resilience, and supply-chain tooling are moving fast.'
              : sector.name === 'HealthTech'
                ? 'Care access, diagnostics, and distributed health systems are gaining traction.'
                : 'Marketplace logistics and last-mile infrastructure are becoming increasingly investable.',
      color: sector.color,
    })),
    countries: COUNTRIES.map((country) => ({
      name: country.name,
      score: Number(country.growth.replace('%', '').replace('+', '')) * 10,
      copy: `${country.gdp} · ${country.rank}`,
      flag: country.flag,
      gdp: country.gdp,
      growth: country.growth,
      rank: country.rank,
    })),
    opportunities: OPPORTUNITIES.map((item) => ({
      stage: item.meta.split(' · ')[1] || '',
      name: item.title,
      copy: item.meta,
      icon: item.icon,
      bg: item.bg,
      iconColor: item.iconColor,
    })),
    chart: chartData,
    promptContext: AI_SYSTEM_PROMPT,
  };
}

window.NILE_INTELLIGENCE_DATA = buildIntelligenceData(DEFAULT_CHART_DATA);
window.setNileIntelligenceData = function setNileIntelligenceData(chartData) {
  const payload = buildIntelligenceData(chartData || DEFAULT_CHART_DATA);
  window.NILE_INTELLIGENCE_DATA = payload;
  return payload;
};