function initNileIntelligenceAI() {
  const data = window.NILE_INTELLIGENCE_DATA;
  const openButton = document.getElementById('open-nile-widget');
  if (!data) return;

  if (openButton) {
    openButton.addEventListener('click', () => {
      const bubble = document.getElementById('nile-chat-bubble');
      if (bubble) {
        bubble.click();
      }
    });
  }

  const clockEl = document.getElementById('clock');
  if (clockEl) {
    function updateClock() {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    updateClock();
    setInterval(updateClock, 30000);
  }

  renderDataLists();

  function renderDataLists() {
    const sectorsEl = document.getElementById('sectors');
    const countriesEl = document.getElementById('countries');
    const opportunitiesEl = document.getElementById('opportunities');

    if (sectorsEl) {
      sectorsEl.innerHTML = data.sectors.map((sector) => `
        <div class="nc-sector-row">
          <div class="nc-sector-label">${sector.name}</div>
          <div class="nc-sector-bar-wrap"><div class="nc-sector-bar" style="width:${sector.score}%; background: ${sector.color || '#1D9E75'};"></div></div>
          <div class="nc-sector-pct">${sector.score}%</div>
        </div>
        <div class="nc-sector-copy" style="margin-bottom: 10px; font-size: 12px; color: var(--color-text-muted);">${sector.copy}</div>
      `).join('');
    }

    if (countriesEl) {
      countriesEl.innerHTML = data.countries.map((country, index) => `
        <article class="nc-country">
          <div class="nc-country-left">
            <div class="nc-flag">${country.flag || country.name.charAt(0)}</div>
            <div>
              <div class="nc-country-name">${country.name}</div>
              <div class="nc-country-gdp">GDP ${country.gdp || '—'} · ${country.rank || 'Growth signal score'}</div>
            </div>
          </div>
          <div class="nc-country-right">
            <div class="nc-country-growth">${country.growth || `${country.score}%`}</div>
            <div class="nc-country-rank">${country.rank || `Rank ${index + 1}`}</div>
          </div>
        </article>
        <div class="nc-country-copy" style="margin: 0 0 10px 0; font-size: 12px; color: var(--color-text-muted); line-height: 1.5;">${country.copy}</div>
      `).join('');
    }

    if (opportunitiesEl) {
      opportunitiesEl.innerHTML = data.opportunities.map((opportunity) => `
        <article class="nc-opp">
          <div class="nc-opp-icon" style="background: ${opportunity.bg || 'var(--color-green-light)'}; color: ${opportunity.iconColor || 'var(--color-green-dark)'}; font-family: var(--font-mono); font-size: 11px; font-weight: 700;">
            <i class="ti ${opportunity.icon || 'ti-arrow-up-right'}"></i>
          </div>
          <div>
            <div class="nc-opp-title">${opportunity.name}</div>
            <div class="nc-opp-meta">${opportunity.stage || 'Pipeline'} · ${opportunity.copy}</div>
          </div>
        </article>
      `).join('');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNileIntelligenceAI);
} else {
  initNileIntelligenceAI();
}