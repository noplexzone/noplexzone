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
