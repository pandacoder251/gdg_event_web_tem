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
                    if (menuBtn) { menuBtn.classList.remove('active'); menuBtn.setAttribute('aria-expanded', 'false'); }
                }
            }
        });
    });

    // Mobile menu toggle with backdrop and accessible close (ESC / backdrop click)
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        // create a backdrop element (will be toggled via JS)
        let mobileBackdrop = document.getElementById('mobile-backdrop');
        if (!mobileBackdrop) {
            mobileBackdrop = document.createElement('div');
            mobileBackdrop.id = 'mobile-backdrop';
            document.body.appendChild(mobileBackdrop);
        }

        function openMobileMenu() {
            // if cart is open, close it to avoid overlapping layers
            if (cartDrawer && cartDrawer.classList.contains('open')) {
                cartDrawer.classList.remove('open');
                cartDrawer.setAttribute('aria-hidden', 'true');
                if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false');
            }

            mobileMenu.classList.add('show');
            menuBtn.classList.add('active');
            menuBtn.setAttribute('aria-expanded', 'true');
            mobileMenu.setAttribute('aria-hidden', 'false');
            mobileBackdrop.classList.add('visible');
            // prevent body scroll while menu open
            document.documentElement.style.overflow = 'hidden';
            // focus first link for accessibility
            const firstLink = mobileMenu.querySelector('a');
            if (firstLink) firstLink.focus({ preventScroll: true });

            // install focus-trap for keyboard users
            installMenuFocusTrap();
        }

        function closeMobileMenu() {
            mobileMenu.classList.remove('show');
            menuBtn.classList.remove('active');
            menuBtn.setAttribute('aria-expanded', 'false');
            mobileMenu.setAttribute('aria-hidden', 'true');
            mobileBackdrop.classList.remove('visible');
            document.documentElement.style.overflow = '';
            // return focus to the menu button
            menuBtn.focus({ preventScroll: true });

            // remove focus-trap
            removeMenuFocusTrap();
        }

        menuBtn.addEventListener('click', () => {
            if (mobileMenu.classList.contains('show')) closeMobileMenu(); else openMobileMenu();
        });

        // close when clicking a link inside the menu
        mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', (e) => {
            // allow normal navigation first, then close
            setTimeout(closeMobileMenu, 120);
        }));

        // close on backdrop click
        mobileBackdrop.addEventListener('click', closeMobileMenu);

        // close on ESC
        document.addEventListener('keydown', (ev) => {
            if (ev.key === 'Escape' && mobileMenu.classList.contains('show')) {
                closeMobileMenu();
            }
        });
    }

    // --- Focus trap utilities for mobile menu ---
    let _menuTrapHandler = null;
    function installMenuFocusTrap() {
        if (!mobileMenu) return;
        const focusableSelector = 'a, button, input, textarea, [tabindex]:not([tabindex="-1"])';
        const nodes = Array.from(mobileMenu.querySelectorAll(focusableSelector)).filter(n => !n.hasAttribute('disabled'));
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];

        _menuTrapHandler = function (ev) {
            if (ev.key !== 'Tab') return;
            // shift+tab on first -> move to last
            if (ev.shiftKey && document.activeElement === first) {
                ev.preventDefault();
                last.focus();
            } else if (!ev.shiftKey && document.activeElement === last) {
                ev.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', _menuTrapHandler);
    }

    function removeMenuFocusTrap() {
        if (_menuTrapHandler) {
            document.removeEventListener('keydown', _menuTrapHandler);
            _menuTrapHandler = null;
        }
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
                // award XP for flipping a unique card
                const id = card.dataset.testId || Array.prototype.indexOf.call(flashcards, card);
                awardXpForFlip(id);
            });
            // keyboard support: Enter or Space
            card.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    const flipped = card.classList.toggle('flipped');
                    card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
                    const id = card.dataset.testId || Array.prototype.indexOf.call(flashcards, card);
                    awardXpForFlip(id);
                }
            });
        });
    }
    // grab contact form early so gamification can attach bonuses
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');

    // ---------------- Gamification: XP, progress, badges ----------------
    const xpValueEl = document.getElementById('xp-value');
    const progressBar = document.getElementById('progress-bar');
    const badgeArea = document.getElementById('badge-area');

    const STORAGE_KEYS = { XP: 'th_xp', SEEN: 'th_seen_sections', FLIPS: 'th_flipped' };
    const CART_KEY = 'th_cart';

    function getStored(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def } catch { return def } }
    function setStored(key, val) { try { localStorage.setItem(key, JSON.stringify(val)) } catch (e) { } }

    let XP = getStored(STORAGE_KEYS.XP, 0);
    let seenSections = new Set(getStored(STORAGE_KEYS.SEEN, []));
    let flipped = new Set(getStored(STORAGE_KEYS.FLIPS, []));

    function updateXpDisplay() { if (xpValueEl) xpValueEl.textContent = XP; }
    updateXpDisplay();

    function awardXp(amount) { XP = Math.max(0, XP + amount); setStored(STORAGE_KEYS.XP, XP); updateXpDisplay(); }

    function showBadge(text) { if (!badgeArea) return; const el = document.createElement('div'); el.className = 'badge-toast'; el.textContent = text; badgeArea.appendChild(el); setTimeout(() => el.style.opacity = '1', 50); setTimeout(() => el.remove(), 4000); }

    function awardXpForFlip(id) { if (flipped.has(id)) return; flipped.add(id); setStored(STORAGE_KEYS.FLIPS, Array.from(flipped)); awardXp(5); showBadge('+5 XP — review flipped'); }

    /* -------------------- Cart functionality -------------------- */
    function getCart() { try { const raw = localStorage.getItem(CART_KEY); return raw ? JSON.parse(raw) : { items: [] }; } catch (e) { return { items: [] }; } }
    function saveCart(cart) { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { } }
    function cartTotal(cart) { return (cart.items || []).reduce((s, it) => s + (it.price * (it.qty || 1)), 0); }
    function updateCartCount() { const cart = getCart(); const count = (cart.items || []).reduce((s, it) => s + (it.qty || 1), 0); const el = document.getElementById('cart-count'); if (el) el.textContent = count; }
    function renderCart() {
        const cart = getCart(); const container = document.getElementById('cart-items'); const totalEl = document.getElementById('cart-total');
        if (!container) return;
        container.innerHTML = '';
        (cart.items || []).forEach(it => {
            const row = document.createElement('div'); row.className = 'cart-item';
            const title = document.createElement('div'); title.className = 'title'; title.textContent = it.title + ' — $' + it.price;
            const qty = document.createElement('div'); qty.className = 'qty'; qty.textContent = 'x' + (it.qty || 1);
            const rem = document.createElement('button'); rem.className = 'btn'; rem.textContent = 'Remove'; rem.style.marginLeft = '8px';
            rem.addEventListener('click', () => { removeFromCart(it.id); });
            row.appendChild(title); row.appendChild(qty); row.appendChild(rem);
            container.appendChild(row);
        });
        if (totalEl) totalEl.textContent = cartTotal(cart).toFixed(2);
        updateCartCount();
    }
    function addToCart(item) {
        const cart = getCart(); const idx = (cart.items || []).findIndex(i => i.id === item.id);
        if (idx >= 0) { cart.items[idx].qty = (cart.items[idx].qty || 1) + 1; } else { cart.items = cart.items || []; cart.items.push(Object.assign({}, item, { qty: 1 })); }
        saveCart(cart); renderCart();
    }
    function removeFromCart(id) { const cart = getCart(); cart.items = (cart.items || []).filter(i => i.id !== id); saveCart(cart); renderCart(); }

    // wire add-to-cart buttons
    document.querySelectorAll('.add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id || ('p-' + Math.random().toString(36).slice(2, 9));
            const title = btn.dataset.title || 'Product';
            const price = parseFloat(btn.dataset.price || '0');
            addToCart({ id, title, price });
            awardXp(8); showBadge('+8 XP — added to cart');
        });
    });

    // cart drawer toggle
    const cartBtn = document.getElementById('cart-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartClose = document.getElementById('cart-close');
    const checkoutBtn = document.getElementById('checkout-btn');
    if (cartBtn && cartDrawer) {
        cartBtn.addEventListener('click', () => { const open = cartDrawer.classList.toggle('open'); cartDrawer.setAttribute('aria-hidden', open ? 'false' : 'true'); cartBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); renderCart(); });
    }
    if (cartClose && cartDrawer) cartClose.addEventListener('click', () => { cartDrawer.classList.remove('open'); cartDrawer.setAttribute('aria-hidden', 'true'); if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false'); });
    if (checkoutBtn) checkoutBtn.addEventListener('click', () => { const cart = getCart(); if (!cart.items || cart.items.length === 0) { showBadge('Cart is empty'); return; } // fake checkout
        showBadge('Checkout complete — thanks!'); awardXp(25); saveCart({ items: [] }); renderCart(); cartDrawer.classList.remove('open'); if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false');
    });

    // initialize cart UI
    renderCart();

    // observe sections with data-section to track progress
    const sections = Array.from(document.querySelectorAll('[data-section]'));
    function updateProgress() { const total = sections.length || 1; const seen = seenSections.size; const pct = Math.round((seen / total) * 100); if (progressBar) progressBar.style.width = pct + '%'; }
    updateProgress();

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(en => {
            if (en.isIntersecting) {
                const name = en.target.dataset.section;
                if (name && !seenSections.has(name)) {
                    seenSections.add(name); setStored(STORAGE_KEYS.SEEN, Array.from(seenSections));
                    awardXp(10); showBadge('+10 XP — explored ' + name);
                    updateProgress();
                }
            }
        });
    }, { threshold: 0.45 });
    sections.forEach(s => sectionObserver.observe(s));

    // award XP when feature cards are clicked
    document.querySelectorAll('.card[data-xp]').forEach(c => {
        c.addEventListener('click', () => {
            const v = parseInt(c.dataset.xp || '5', 10); awardXp(v); showBadge('+' + v + ' XP — feature explored');
        });
    });

    // award XP on contact/demo
    if (form) {
        form.addEventListener('submit', (e) => {
            // existing handler runs; give bonus XP
            awardXp(30); showBadge('+30 XP — welcome!');
        });
    }

    // persist XP display immediately and animate small pulse
    function pulseXp() { const el = document.getElementById('xp-value'); if (!el) return; el.classList.add('pulse'); setTimeout(() => el.classList.remove('pulse'), 800); }
    // tie updateXpDisplay to pulse
    const origUpdate = updateXpDisplay;
    updateXpDisplay = function () { origUpdate(); pulseXp(); };
    updateXpDisplay();


    // original contact form handler (fake submit)
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
