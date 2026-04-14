(function () {
  const navbar = document.querySelector('.navbar');
  const toggleBtn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  const year = document.getElementById('year');
  const langButtons = document.querySelectorAll('.lang-btn');

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  if (toggleBtn && nav) {
    toggleBtn.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
      toggleBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  if (langButtons.length) {
    langButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        langButtons.forEach(function (item) {
          item.classList.remove('is-active');
          item.setAttribute('aria-pressed', 'false');
        });

        button.classList.add('is-active');
        button.setAttribute('aria-pressed', 'true');
      });
    });
  }

  if (navbar) {
    const updateNavbarState = function () {
      navbar.classList.toggle('scrolled', window.scrollY > 80);
    };

    window.addEventListener('scroll', updateNavbarState);
    updateNavbarState();

    navbar.addEventListener('mouseenter', function () {
      navbar.classList.add('scrolled');
    });

    navbar.addEventListener('mouseleave', function () {
      if (window.scrollY <= 80) {
        navbar.classList.remove('scrolled');
      }
    });
  }

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.main-nav a, .footer-nav a');

  navLinks.forEach(function (link) {
    const href = link.getAttribute('href');

    if (href === currentPath) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('active');
    } else if (link.getAttribute('aria-current') === 'page') {
      link.removeAttribute('aria-current');
      link.classList.remove('active');
    }
  });
})();
