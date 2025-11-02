document.addEventListener('DOMContentLoaded', () => {
  // set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // close mobile menu if open
        const menuBtn = document.getElementById('menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && mobileMenu.classList.contains('show')) {
          mobileMenu.classList.remove('show');
          if (menuBtn) { menuBtn.classList.remove('active'); menuBtn.setAttribute('aria-expanded','false'); }
        }
      }
    });
  });

  // Mobile menu toggle
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const showing = mobileMenu.classList.toggle('show');
      menuBtn.classList.toggle('active');
      menuBtn.setAttribute('aria-expanded', showing ? 'true' : 'false');
      mobileMenu.setAttribute('aria-hidden', showing ? 'false' : 'true');
    });
    // close when clicking a link
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileMenu.classList.remove('show');
      menuBtn.classList.remove('active');
      menuBtn.setAttribute('aria-expanded','false');
      mobileMenu.setAttribute('aria-hidden','true');
    }));
  }

  // Testimonials: flashcard boxes interaction (flip on click / keyboard)
  const flashcards = document.querySelectorAll('.flashcard');
  if (flashcards.length) {
    flashcards.forEach(card => {
      // ensure accessible role and state
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', 'false');
      // click/tap to flip
      card.addEventListener('click', () => {
        const flipped = card.classList.toggle('flipped');
        card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
      });
      // keyboard support: Enter or Space
      card.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          const flipped = card.classList.toggle('flipped');
          card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
        }
      });
    });
  }

  // Contact form (fake submit)
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const email = (fd.get('email') || '').toString().trim();
      if (!name || !email) {
        if (status) status.textContent = 'Please provide name and email.';
        return;
      }
      if (status) status.textContent = 'Sending...';
      setTimeout(() => {
        if (status) status.textContent = 'Thanks — we received your request!';
        form.reset();
      }, 800);
    });
  }

  const demoBtn = document.getElementById('demo-btn');
  if (demoBtn) demoBtn.addEventListener('click', () => {
    window.location.href = 'mailto:sales@techiehouse.example?subject=Demo%20request';
  });

  // Scroll reveal using IntersectionObserver
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('active');
        // optionally unobserve to only animate once
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
});
