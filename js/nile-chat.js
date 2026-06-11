// Nile chatbot widget script (externalized)
// IMPORTANT: The API key must NOT be stored in client-side code.
// This client calls the local proxy at `/api/chat` which attaches the server-side key.

const NILE_CONFIG = {
  model: 'claude-sonnet-4-6',
  systemPrompt: `You are Nile, NiLe Capital Fund's friendly and knowledgeable AI assistant on the website nilecapitals.com.

Your role is to help visitors learn about NiLe Capital and guide them toward investing.

About NiLe Capital:
- NiLe Capital Fund I is now open for investment
- Tagline: "Flow. Grow. Prosper."
- A technology-forward private capital fund investing in Africa's highest-growth sectors
- Focus: East and Central Africa

Investment Verticals:
1. Technology & Fintech (35%) — SaaS platforms, mobile finance, AI applications, digital infrastructure
2. Agritech (25%) — Food systems, supply chain optimisation, agricultural finance
3. Infrastructure (25%) — Renewable energy, logistics networks, telecoms
4. Real Estate (15%) — Grade-A commercial property, REIT-structured assets

Key Differentiators (The NiLe Advantage):
- Technology-Driven: AI-powered deal sourcing, real-time investor dashboards
- Radical Transparency: Quarterly reports, independent audits, live portfolio data
- Africa-First Focus: Deep regional expertise and on-the-ground networks

Investment Details:
- Minimum commitment: $25,000
- Open to accredited investors only
- This is not an offer to sell securities

Contact:
- Email: ceo.nilecapital@gmail.com
- Phone: +255 768 736 334
- Website: nilecapitals.com
- Contact/Invest page: contact.html

Pages: Home, About (about.html), Strategy (strategy.html), Legal (legal.html), Contact (contact.html)
- When you mention site pages in responses, use local relative URLs like about.html, strategy.html, legal.html, and contact.html.

Personality:
- Warm, professional, and knowledgeable
- Keep answers concise (2–4 sentences unless more detail is needed)
- Use plain language, avoid heavy jargon
- Always encourage visitors to visit the Contact page or email directly for investment queries
- Never fabricate figures or facts not listed above
- If asked something you don't know, politely direct them to contact the team`,
};

const NILE_PAGE_PROFILES = {
  default: {
    greeting: "Hello! 👋 I'm Nile, your NiLe Capital assistant. I'm here to answer your questions about our fund and Africa investment opportunities. How can I help you today?",
    quickReplies: [
      'What is NiLe Capital?',
      'How do I invest?',
      'What sectors do you invest in?',
      'Minimum investment?',
      'Contact the team',
    ],
    systemPromptSuffix: '',
  },
  intelligence: {
    greeting: "Hello! 👋 I'm Nile in market analyst mode. Ask me about the charts, sectors, countries, or live opportunities on this page.",
    quickReplies: [
      'Which sector is strongest?',
      'What is driving fintech?',
      'Why Kenya and Tanzania?',
      'Explain the VC trend',
      'How do I contact the team?',
    ],
    systemPromptSuffix: `

Intelligence page mode:
- Answer like a market analyst using the dashboard context when relevant
- Be more analytical and data-driven than on the standard site pages
- Refer to the charts, metrics, sectors, and opportunities visible on the page
- Do not invent statistics; if the user asks for more detail than the page provides, direct them to contact.html
- If the question is about investing or next steps, keep the answer concise and point to contact.html`,
  },
};

let isOpen = false;
let isTyping = false;
let hasGreeted = false;
let conversationHistory = [];
let activePageProfile = NILE_PAGE_PROFILES.default;

function $(id) {
  return document.getElementById(id);
}

function initNileWidget() {
  const pageMode = document.body?.dataset?.nileMode || 'default';
  activePageProfile = NILE_PAGE_PROFILES[pageMode] || NILE_PAGE_PROFILES.default;

  const bubble = $('nile-chat-bubble');
  const window_ = $('nile-chat-window');
  const messagesEl = $('nile-chat-messages');
  const inputEl = $('nile-chat-input');
  const sendBtn = $('nile-send-btn');
  const closeBtn = $('nile-close-btn');
  const badge = $('nile-unread-badge');
  const labelTag = $('nile-label-tag');
  const introCard = $('nile-intro-card');
  const introCta = $('nile-intro-cta');
  const introDismiss = $('nile-intro-dismiss');

  if (!bubble || !window_ || !messagesEl || !inputEl || !sendBtn || !closeBtn || !badge || !labelTag || !introCard || !introCta || !introDismiss) {
    return;
  }

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      window_.classList.remove('hidden');
      introCard.classList.add('hidden');
      badge.classList.add('hidden');
      if (!hasGreeted) {
        showGreeting();
        hasGreeted = true;
      }
      setTimeout(() => inputEl.focus(), 250);
    } else {
      window_.classList.add('hidden');
    }
  }

  bubble.addEventListener('click', toggleChat);
  labelTag.addEventListener('click', toggleChat);
  labelTag.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') toggleChat();
  });
  closeBtn.addEventListener('click', () => {
    isOpen = true;
    toggleChat();
  });

  introCta.addEventListener('click', () => {
    introCard.classList.add('hidden');
    if (!isOpen) toggleChat();
  });
  introDismiss.addEventListener('click', (event) => {
    event.stopPropagation();
    introCard.classList.add('hidden');
  });

  function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = 'nile-msg ' + role;
    div.innerHTML = text
      .replace(/\n/g, '<br>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi, '<a href="mailto:$1">$1</a>')
      .replace(/\b([a-zA-Z0-9_-]+\.html)\b/g, '<a href="$1">$1</a>');
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showGreeting() {
    setTimeout(() => {
      addMessage(activePageProfile.greeting, 'bot');
      showQuickReplies();
    }, 300);
  }

  function showQuickReplies() {
    const wrap = document.createElement('div');
    wrap.className = 'nile-quick-btns';
    activePageProfile.quickReplies.forEach((label) => {
      const btn = document.createElement('button');
      btn.className = 'nile-quick-btn';
      btn.textContent = label;
      btn.onclick = () => {
        wrap.remove();
        sendMessage(label);
      };
      wrap.appendChild(btn);
    });
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'nile-typing';
    el.id = 'nile-typing-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const el = $('nile-typing-indicator');
    if (el) el.remove();
  }

  function sanitizeText(text) {
    if (typeof text !== 'string') return text;
    return text
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
      .replace(/\*\*(.*?)\*\*/gs, '$1')
      .replace(/__(.*?)__/gs, '$1')
      .replace(/\*(.*?)\*/gs, '$1')
      .replace(/_(.*?)_/gs, '$1')
      .replace(/~~(.*?)~~/gs, '$1')
      .replace(/`(.*?)`/gs, '$1');
  }

  async function sendMessage(text) {
    const message = text.trim();
    if (!message || isTyping) return;
    addMessage(message, 'user');
    inputEl.value = '';
    sendBtn.disabled = true;
    isTyping = true;
    conversationHistory.push({ role: 'user', content: message });
    showTyping();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: NILE_CONFIG.model,
          max_tokens: 400,
          system: `${NILE_CONFIG.systemPrompt}${activePageProfile.systemPromptSuffix || ''}`,
          messages: conversationHistory,
        }),
      });

      const data = await response.json();
      hideTyping();

      if (!response.ok) {
        console.error('Chat proxy error', response.status, data);
        addMessage("I'm having a little trouble right now. Please try again or email us at ceo.nilecapital@gmail.com.", 'bot');
        return;
      }

      let reply = '';
      if (typeof data.completion === 'string' && data.completion.trim()) {
        reply = data.completion.trim();
      } else if (data.message) {
        const msg = data.message;
        if (typeof msg === 'string') {
          reply = msg;
        } else if (msg.content) {
          const content = Array.isArray(msg.content) ? msg.content : [msg.content];
          reply = content.map((item) => item.text || item?.message || '').join('');
        }
      } else if (Array.isArray(data.output)) {
        reply = data.output.map((item) => {
          if (typeof item === 'string') return item;
          if (item?.content) {
            if (Array.isArray(item.content)) return item.content.map((c) => c.text || '').join('');
            return item.content.text || '';
          }
          return '';
        }).join('');
      } else if (data.content) {
        const content = Array.isArray(data.content) ? data.content : [data.content];
        reply = content.map((item) => {
          if (typeof item === 'string') return item;
          if (item?.text) return item.text;
          if (item?.content) {
            if (Array.isArray(item.content)) return item.content.map((c) => c.text || '').join('');
            return item.content.text || '';
          }
          return '';
        }).join('');
      } else if (typeof data.output === 'string' && data.output.trim()) {
        reply = data.output.trim();
      } else if (typeof data.response === 'string' && data.response.trim()) {
        reply = data.response.trim();
      }

      if (reply) {
        reply = sanitizeText(reply);
        conversationHistory.push({ role: 'assistant', content: reply });
        addMessage(reply, 'bot');
      } else {
        console.error('Unexpected Anthropic response:', data);
        addMessage("I'm having a little trouble right now. Please try again or email us at ceo.nilecapital@gmail.com.", 'bot');
      }
    } catch (error) {
      hideTyping();
      addMessage("Oops, something went wrong. Please email us at <a href='mailto:ceo.nilecapital@gmail.com'>ceo.nilecapital@gmail.com</a> and we'll be happy to help.", 'bot');
      console.error('Nile chatbot error:', error);
    }

    isTyping = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
  inputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(inputEl.value);
    }
  });

  setTimeout(() => {
    if (!hasGreeted && pageMode !== 'intelligence') {
      introCard.classList.remove('hidden');
      $('nile-unread-badge')?.classList.remove('hidden');
    }
  }, 3000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('nile-chat-launcher')) initNileWidget();
  });
} else if (document.getElementById('nile-chat-launcher')) {
  initNileWidget();
}