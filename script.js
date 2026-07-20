const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('#nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navLinks.classList.toggle('is-open', !isOpen);
  });

  navLinks.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('is-open');
    }
  });
}


const statusWidget = document.querySelector('[data-status-widget]');

async function updatePlexStatus() {
  if (!statusWidget) return;

  const endpoint = statusWidget.dataset.statusEndpoint;
  const label = statusWidget.querySelector('[data-status-label]');
  const detail = statusWidget.querySelector('[data-status-detail]');
  const indicator = statusWidget.querySelector('[data-status-indicator]');

  if (!endpoint || !label || !detail || !indicator) return;

  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Status request failed: ${response.status}`);
    const payload = await response.json();
    const plex = Array.isArray(payload.data)
      ? payload.data.find((monitor) => String(monitor.name).toLowerCase() === 'plex') || payload.data[0]
      : null;
    if (!plex) throw new Error('Plex monitor not found');

    const isUp = String(plex.statusClass).toLowerCase() === 'success';
    indicator.classList.remove('status-unknown', 'status-up', 'status-down');
    indicator.classList.add(isUp ? 'status-up' : 'status-down');
    label.textContent = isUp ? 'Plex status: up' : 'Plex status: down';

    const latestRatio = Array.isArray(plex.dailyRatios) && plex.dailyRatios.length
      ? plex.dailyRatios[plex.dailyRatios.length - 1].ratio
      : null;
    detail.textContent = latestRatio
      ? `Today’s uptime: ${Number(latestRatio).toFixed(2)}%.`
      : 'Live status from UptimeRobot.';
  } catch (error) {
    indicator.classList.remove('status-up', 'status-down');
    indicator.classList.add('status-unknown');
    label.textContent = 'Plex status: unavailable';
    detail.textContent = 'Open details for the full UptimeRobot page.';
  }
}

updatePlexStatus();


const mediaShowcase = document.querySelector('[data-media-showcase]');

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function createMediaListItem(item, metricText) {
  const li = document.createElement('li');
  const title = document.createElement('strong');
  title.textContent = item.title || 'Untitled';

  const meta = document.createElement('span');
  const pieces = [item.type, item.year, metricText].filter(Boolean);
  meta.textContent = pieces.join(' · ');

  li.append(title, meta);
  return li;
}

async function renderMediaShowcase() {
  if (!mediaShowcase) return;

  const statsRoot = mediaShowcase.querySelector('[data-library-stats]');
  const recentRoot = mediaShowcase.querySelector('[data-recently-added]');
  const popularRoot = mediaShowcase.querySelector('[data-popular-media]');
  const generatedRoot = mediaShowcase.querySelector('[data-showcase-generated]');

  try {
    const response = await fetch('data/media-showcase.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Media showcase request failed: ${response.status}`);
    const data = await response.json();

    if (statsRoot) {
      statsRoot.replaceChildren(...(data.stats || []).map((stat) => {
        const card = document.createElement('article');
        card.className = 'library-stat';
        const value = document.createElement('strong');
        value.textContent = formatNumber(stat.value);
        const label = document.createElement('span');
        label.textContent = stat.label || 'Items';
        const detail = document.createElement('small');
        detail.textContent = stat.detail || '';
        card.append(value, label, detail);
        return card;
      }));
    }

    if (recentRoot) {
      recentRoot.replaceChildren(...(data.recently_added || []).map((item) => {
        return createMediaListItem(item, item.added ? `added ${item.added}` : item.library);
      }));
    }

    if (popularRoot) {
      popularRoot.replaceChildren(...(data.popular || []).map((item) => {
        const plays = Number(item.plays || 0);
        return createMediaListItem(item, `${formatNumber(plays)} ${plays === 1 ? 'play' : 'plays'}`);
      }));
    }

    if (generatedRoot && data.generated_at) {
      const generated = new Date(data.generated_at);
      generatedRoot.textContent = `updated ${generated.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
  } catch (error) {
    if (statsRoot) {
      statsRoot.replaceChildren();
    }
    if (recentRoot) {
      const li = document.createElement('li');
      li.textContent = 'Library snapshot is temporarily unavailable.';
      recentRoot.replaceChildren(li);
    }
    if (popularRoot) {
      const li = document.createElement('li');
      li.textContent = 'Popular titles are temporarily unavailable.';
      popularRoot.replaceChildren(li);
    }
  }
}

renderMediaShowcase();
