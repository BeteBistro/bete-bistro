/* ============================================================
   Bete Bistrô — main.js
   Header: collapse/expand da nav + appear/disappear do hamburger
   ============================================================ */

(function () {
  var header = document.getElementById('header');
  var menuBtn = document.getElementById('menuBtn');
  var isCollapsed = false;
  var animating = false;

  /* Remove todas as classes de animação do botão */
  function cleanBtn() {
    menuBtn.classList.remove('is-appearing', 'is-disappearing', 'is-visible');
  }

  /* Mostra o hamburger com bounce */
  function showBtn() {
    if (animating) return;
    animating = true;
    cleanBtn();
    menuBtn.classList.add('is-appearing');
    menuBtn.addEventListener('animationend', function handler() {
      menuBtn.removeEventListener('animationend', handler);
      menuBtn.classList.remove('is-appearing');
      menuBtn.classList.add('is-visible');
      animating = false;
    });
  }

  /* Esconde o hamburger com bounce invertido */
  function hideBtn(callback) {
    if (menuBtn.classList.contains('is-visible')) {
      animating = true;
      menuBtn.classList.remove('is-visible');
      menuBtn.classList.add('is-disappearing');
      menuBtn.addEventListener('animationend', function handler() {
        menuBtn.removeEventListener('animationend', handler);
        cleanBtn();
        animating = false;
        if (callback) callback();
      });
    } else {
      cleanBtn();
      if (callback) callback();
    }
  }

  /* Lógica central: colapsa se scrollou OU se tela é estreita */
  function update() {
    var scrolled = window.scrollY > 10;
    var narrow = window.innerWidth <= 1200;
    var shouldCollapse = narrow || scrolled;

    if (shouldCollapse && !isCollapsed) {
      isCollapsed = true;
      header.classList.add('is-collapsed');
      setTimeout(showBtn, 400);
    } else if (!shouldCollapse && isCollapsed) {
      isCollapsed = false;
      hideBtn();
      header.classList.remove('is-collapsed');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
