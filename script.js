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
