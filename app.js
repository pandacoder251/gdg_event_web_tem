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
      }
    });
  });

  // Testimonials slider (very small, DOM-replace approach)
  const slider = document.querySelector('.testimonials-slider');
  if (slider) {
    const blocks = Array.from(slider.querySelectorAll('.testimonial'));
    if (blocks.length) {
      let idx = 0;
      const render = (i) => {
        slider.innerHTML = '';
        slider.appendChild(blocks[i].cloneNode(true));
      };
      render(idx);
      const prev = document.querySelector('.t-prev');
      const next = document.querySelector('.t-next');
      if (prev) prev.addEventListener('click', () => { idx = (idx - 1 + blocks.length) % blocks.length; render(idx); });
      if (next) next.addEventListener('click', () => { idx = (idx + 1) % blocks.length; render(idx); });
      setInterval(() => { idx = (idx + 1) % blocks.length; render(idx); }, 6000);
    }
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
    window.location.href = 'mailto:sales@novastack.example?subject=Demo%20request';
  });
});
