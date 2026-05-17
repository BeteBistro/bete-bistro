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
  /* HTML começa com is-collapsed (estado mobile = default). Em mobile, é o estado certo.
     Em desktop top, JS no init remove a classe SEM animação (no-anim temporária). */
  var isCollapsed = header.classList.contains('is-collapsed');
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

  /* Threshold de 100px (não 10) pra que a animação de expand TERMINE perto do topo,
     não COMECE no topo. Em rolagem normal, dá tempo de completar a cascata. */
  var collapseThreshold = 100;
  var expandTimer = null;

  function updateHeader() {
    var scrolled = window.scrollY > collapseThreshold;
    var narrow   = window.innerWidth <= 1200;
    var shouldCollapse = narrow || scrolled;

    if (shouldCollapse && !isCollapsed) {
      // Se há um expand pendente (timer), cancela antes
      if (expandTimer) {
        clearTimeout(expandTimer);
        expandTimer = null;
      }
      isCollapsed = true;
      header.classList.add('is-collapsed');
      setTimeout(showBtn, 270);
    } else if (!shouldCollapse && isCollapsed) {
      isCollapsed = false;
      // Se a gaveta tiver aberta, fecha junto
      if (drawer.classList.contains('is-open')) closeDrawer();
      hideBtn();
      // Expand começa quando ícone está ~50% sumido (135ms = metade dos 270ms de disappear)
      expandTimer = setTimeout(function () {
        expandTimer = null;
        header.classList.remove('is-collapsed');
      }, 135);
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader);

  /* Init sem animação: HTML começa com is-collapsed. Se a viewport atual é
     desktop topo, removemos a classe + escondemos o btn instantaneamente
     (no-anim desliga transitions/animations temporariamente). */
  (function initHeader() {
    var initScrolled = window.scrollY > collapseThreshold;
    var initNarrow   = window.innerWidth <= 1200;
    var initShouldCollapse = initNarrow || initScrolled;

    if (!initShouldCollapse) {
      // Desktop top: reverte pro estado expanded sem animação
      header.classList.add('no-anim');
      menuBtn.classList.add('no-anim');
      header.classList.remove('is-collapsed');
      menuBtn.classList.remove('is-visible');
      isCollapsed = false;
      // Re-habilita transitions no próximo frame (depois do paint)
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          header.classList.remove('no-anim');
          menuBtn.classList.remove('no-anim');
        });
      });
    }
    // Em mobile / scrolled: já está no estado certo, nada a fazer
  })();


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
    document.body.classList.add('drawer-open');

    menuBtn.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Fechar menu');
  }

  function closeDrawer() {
    if (!drawerOpen) return;
    drawerOpen = false;

    drawer.classList.remove('is-open');
    drawer.classList.add('is-closing');
    document.body.classList.remove('drawer-open');

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


  /* ============================================================
     3. HERO — PARALLAX (vídeo e ondinha)

     Vídeo: sobe mais devagar que o scroll (translateY positivo). Fator pequeno
     pra não chegar perto da ondinha. Mobile usa fator menor que desktop
     (mobile tem menos espaço abaixo do vídeo).
     Ondinha: background-position-x cresce ao scrollar pra baixo (tile infinito).

     Respeita prefers-reduced-motion.
     ============================================================ */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    var heroVideo   = document.querySelector('.hero__video-shape');
    var heroOndinha = document.querySelector('.hero__ondinha');
    var hero        = document.getElementById('hero');

    if (hero && (heroVideo || heroOndinha)) {
      var lastScrollY = window.scrollY;
      var ticking     = false;
      var ondinhaFactor = 0.3;            // horizontal, sem risco de colisão

      function getVideoFactor() {
        // Mobile tem pouco espaço entre vídeo e ondinha — fator menor pra não encostar
        return window.innerWidth <= 768 ? 0.08 : 0.15;
      }

      var videoFactor = getVideoFactor();

      function updateParallax() {
        // Limita ao tamanho do hero (depois que sai da viewport, não precisa atualizar)
        var heroHeight = hero.offsetHeight;
        var sy = Math.min(lastScrollY, heroHeight);

        if (heroVideo) {
          heroVideo.style.transform = 'translate3d(0, ' + (sy * videoFactor) + 'px, 0)';
        }
        if (heroOndinha) {
          // background-position-x: positivo = bg "anda" pra direita (ondinha vai pra direita)
          heroOndinha.style.backgroundPositionX = (sy * ondinhaFactor) + 'px';
        }

        ticking = false;
      }

      function onScroll() {
        lastScrollY = window.scrollY;
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () {
        videoFactor = getVideoFactor();
        updateParallax();
      });
      updateParallax(); // estado inicial (caso a página carregue já scrollada)
    }
  }


  /* ============================================================
     4. HERO — ROTATOR DO TÍTULO ("Artesanal" → "Caseira" → "De mãe" ...)

     Cada palavra dura 3s. Caracteres entram/saem em cascata (40ms entre cada).
     ============================================================ */
  var rotatorEl = document.querySelector('.hero__title-rotator');
  var palavras = ['Artesanal', 'Caseira', 'De mãe', 'De vó', 'Afetiva', 'Saborosa'];
  var rotatorIdx = 0;
  var displayTime = 1000;             // ms que cada palavra fica estática
  var charDelay   = 30;               // ms entre cascata de cada char
  var animOutMs   = 400;              // duração da animação de saída por char
  var animInMs    = 400;              // duração da animação de entrada por char (mesma — simétrica)

  function splitWordToChars(word) {
    if (!rotatorEl) return;
    rotatorEl.innerHTML = '';
    var chars = word.split('');
    // --char-count fica no rotator e é herdado pelos chars filhos (pra CSS calcular cascata reversa)
    rotatorEl.style.setProperty('--char-count', chars.length);
    for (var i = 0; i < chars.length; i++) {
      var span = document.createElement('span');
      span.className = 'hero__title-char';
      span.style.setProperty('--char-i', i);
      // Preserva espaço com nbsp pra não colapsar
      span.textContent = chars[i] === ' ' ? '\u00A0' : chars[i];
      rotatorEl.appendChild(span);
    }
  }

  function rotatorTick() {
    if (!rotatorEl) return;
    var chars = rotatorEl.querySelectorAll('.hero__title-char');

    // Aplica saída (cascata via --char-i no CSS)
    for (var i = 0; i < chars.length; i++) {
      chars[i].classList.add('is-leaving');
    }

    // Tempo total de saída = duração + cascata do último char
    var totalOut = animOutMs + ((chars.length - 1) * charDelay);

    window.setTimeout(function () {
      rotatorIdx = (rotatorIdx + 1) % palavras.length;
      splitWordToChars(palavras[rotatorIdx]);
      // Próximo tick depois de display + cascata de entrada
      var nextDelay = displayTime + animInMs + ((palavras[rotatorIdx].length - 1) * charDelay);
      window.setTimeout(rotatorTick, nextDelay);
    }, totalOut);
  }

  if (rotatorEl && !prefersReducedMotion) {
    splitWordToChars(palavras[0]);
    var firstDelay = displayTime + animInMs + ((palavras[0].length - 1) * charDelay);
    window.setTimeout(rotatorTick, firstDelay);
  }

})();
