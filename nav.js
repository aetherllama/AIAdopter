/* ============================================================
   nav.js — Shared Navigation
   Injected into all pages via DOMContentLoaded
   ============================================================ */

const NAV_LINKS = [
  { href: 'index.html',       label: 'Home' },
  { href: 'assessment.html',  label: 'Self-Assessment' },
  { href: 'stages.html',      label: 'Maturity Stages' },
  { href: 'use-cases.html',   label: 'AI Use Cases' },
  { href: 'mindforge.html',   label: '⬡ MAS MindForge' },
];

function initNav() {
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';

  // Build desktop nav links
  const nav = document.getElementById('main-nav');
  if (nav) {
    nav.innerHTML = NAV_LINKS.map(l => {
      const isActive = currentFile === l.href || (currentFile === '' && l.href === 'index.html');
      return `<a href="${l.href}" class="${isActive ? 'active' : ''}">${l.label}</a>`;
    }).join('');
  }

  // Build mobile nav
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) {
    mobileNav.innerHTML = NAV_LINKS.map(l => {
      const isActive = currentFile === l.href;
      return `<a href="${l.href}" class="${isActive ? 'active' : ''}">${l.label}</a>`;
    }).join('');
  }

  // Hamburger toggle
  const hamburger = document.getElementById('hamburger');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      hamburger.textContent = mobileNav.classList.contains('open') ? '✕' : '☰';
    });

    // Close on nav link click
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.textContent = '☰';
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', initNav);
