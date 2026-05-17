/* ============================================================
   Bete Bistrô — main.js

   1. Header: collapse/expand da nav + appear/disappear do botão menu
   2. Drawer: abre/fecha gaveta + accordion dos subitens
   ============================================================ */

(function () {

  /* ------------------------------------------------------------
     ELEMENTOS
     ------------------------------------------------------------ */
  var header  = document.getElementById('header');
  var menuBtn = document.getElementById('menuBtn');
  var drawer  = document.getElementById('drawer');
  var overlay = drawer.querySelector('.drawer__overlay');


  /* ============================================================
     1. HEADER — collapse/expand do nav + appear/disappear do botão
     ============================================================ */
  var isCollapsed = false;
  var btnAnimating = false;

  function cleanBtn() {
    menuBtn.classList.remove('is-appearing', 'is-disappearing', 'is-visible');
  }

  function showBtn() {
    if (btnAnimating) return;
    btnAnimating = true;
    cleanBtn();
    menuBtn.classList.add('is-appearing');
    menuBtn.addEventListener('animationend', function handler() {
      menuBtn.removeEventListener('animationend', handler);
      menuBtn.classList.remove('is-appearing');
      menuBtn.classList.add('is-visible');
      btnAnimating = false;
    });
  }

  function hideBtn(callback) {
    if (menuBtn.classList.contains('is-visible')) {
      btnAnimating = true;
      menuBtn.classList.remove('is-visible');
      menuBtn.classList.add('is-disappearing');
      menuBtn.addEventListener('animationend', function handler() {
        menuBtn.removeEventListener('animationend', handler);
        cleanBtn();
        btnAnimating = false;
        if (callback) callback();
      });
    } else {
      cleanBtn();
      if (callback) callback();
    }
  }

  function updateHeader() {
    var scrolled = window.scrollY > 10;
    var narrow   = window.innerWidth <= 1200;
    var shouldCollapse = narrow || scrolled;

    if (shouldCollapse && !isCollapsed) {
      isCollapsed = true;
      header.classList.add('is-collapsed');
      setTimeout(showBtn, 400);
    } else if (!shouldCollapse && isCollapsed) {
      isCollapsed = false;
      // Se a gaveta tiver aberta, fecha junto
      if (drawer.classList.contains('is-open')) closeDrawer();
      hideBtn();
      header.classList.remove('is-collapsed');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader);
  updateHeader();


  /* ============================================================
     2. DRAWER — open/close + accordion
     ============================================================ */
  var drawerOpen = false;

  function openDrawer() {
    if (drawerOpen) return;
    drawerOpen = true;

    drawer.classList.remove('is-closing');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');

    menuBtn.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Fechar menu');
  }

  function closeDrawer() {
    if (!drawerOpen) return;
    drawerOpen = false;

    drawer.classList.remove('is-open');
    drawer.classList.add('is-closing');

    menuBtn.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Abrir menu');

    // Reseta accordion (todos os subitens voltam pra fechado)
    var expanded = drawer.querySelectorAll('.drawer__item--expanded');
    for (var i = 0; i < expanded.length; i++) {
      expanded[i].classList.remove('drawer__item--expanded');
      var btn = expanded[i].querySelector('.drawer__row');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    // Limpa o is-closing depois da animação pra o estado voltar pro inicial
    setTimeout(function () {
      drawer.classList.remove('is-closing');
      drawer.setAttribute('aria-hidden', 'true');
    }, 350);
  }

  function toggleDrawer() {
    if (drawerOpen) closeDrawer();
    else openDrawer();
  }

  // Click no botão menu
  menuBtn.addEventListener('click', toggleDrawer);

  // Click no overlay fecha (só ativo no mobile, mas listener fica)
  overlay.addEventListener('click', closeDrawer);

  // Click fora do painel da gaveta também fecha (desktop)
  document.addEventListener('click', function (e) {
    if (!drawerOpen) return;
    var panel = drawer.querySelector('.drawer__panel');
    if (panel.contains(e.target)) return;
    if (menuBtn.contains(e.target)) return;
    closeDrawer();
  });

  // ESC fecha
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawerOpen) closeDrawer();
  });

  // Accordion — clicar num row com filhas expande/colapsa
  var parentRows = drawer.querySelectorAll('.drawer__item--has-children > .drawer__row');
  for (var j = 0; j < parentRows.length; j++) {
    (function (row) {
      row.addEventListener('click', function () {
        var item = row.parentElement;
        var willExpand = !item.classList.contains('drawer__item--expanded');

        // Reseta outros itens (accordion exclusivo — só um aberto por vez)
        var allItems = drawer.querySelectorAll('.drawer__item--has-children');
        for (var k = 0; k < allItems.length; k++) {
          if (allItems[k] !== item) {
            allItems[k].classList.remove('drawer__item--expanded');
            var otherBtn = allItems[k].querySelector('.drawer__row');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        }

        item.classList.toggle('drawer__item--expanded', willExpand);
        row.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
      });
    })(parentRows[j]);
  }

})();
