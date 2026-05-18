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
  /* Estado inicial: o inline script no HTML (logo após o </header>) já removeu
     is-collapsed em desktop top antes do primeiro paint. isCollapsed (declarado acima)
     foi lido do classList atual, então reflete o estado correto. */


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

     LERP: em vez de mapear scroll → posição direto (linear, sem pico de velocidade),
     o valor atual persegue o alvo com interpolação suave. Isso cria aceleração
     natural ao começar a scrollar e desaceleração ao parar. O parallax responde
     ao scroll com a mesma filosofia de pico das outras animações.

     Respeita prefers-reduced-motion.
     ============================================================ */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    var heroVideo   = document.querySelector('.hero__video-shape');
    var heroOndinha = document.querySelector('.hero__ondinha');
    var hero        = document.getElementById('hero');

    if (hero && (heroVideo || heroOndinha)) {
      var ondinhaFactor = 0.3;            // horizontal, sem risco de colisão
      var lerpSpeed     = 0.1;            // 0.08–0.12 = suave; 0.15+ = snappy

      function getVideoFactor() {
        return window.innerWidth <= 768 ? 0.08 : 0.15;
      }

      var videoFactor = getVideoFactor();

      // Estado do lerp: current persegue target a cada frame
      var videoY       = 0;
      var videoTarget  = 0;
      var ondinhaX     = 0;
      var ondinhaTarget = 0;
      var parallaxRunning = false;

      function updateParallaxTargets() {
        var heroHeight = hero.offsetHeight;
        var sy = Math.min(window.scrollY, heroHeight);
        videoTarget  = sy * videoFactor;
        ondinhaTarget = sy * ondinhaFactor;
      }

      function parallaxLoop() {
        // Lerp: current se aproxima do target por fração fixa por frame
        videoY   += (videoTarget - videoY) * lerpSpeed;
        ondinhaX += (ondinhaTarget - ondinhaX) * lerpSpeed;

        if (heroVideo) {
          heroVideo.style.transform = 'translate3d(0, ' + videoY + 'px, 0)';
        }
        if (heroOndinha) {
          heroOndinha.style.backgroundPositionX = ondinhaX + 'px';
        }

        // Continua o loop enquanto ainda tem diferença perceptível (> 0.1px)
        var diffV = Math.abs(videoTarget - videoY);
        var diffO = Math.abs(ondinhaTarget - ondinhaX);
        if (diffV > 0.1 || diffO > 0.1) {
          requestAnimationFrame(parallaxLoop);
        } else {
          // Snap final pra evitar drift residual
          videoY = videoTarget;
          ondinhaX = ondinhaTarget;
          if (heroVideo) heroVideo.style.transform = 'translate3d(0, ' + videoY + 'px, 0)';
          if (heroOndinha) heroOndinha.style.backgroundPositionX = ondinhaX + 'px';
          parallaxRunning = false;
        }
      }

      function onScroll() {
        updateParallaxTargets();
        if (!parallaxRunning) {
          parallaxRunning = true;
          requestAnimationFrame(parallaxLoop);
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', function () {
        videoFactor = getVideoFactor();
        updateParallaxTargets();
      });

      // Estado inicial (caso a página carregue já scrollada)
      updateParallaxTargets();
      videoY = videoTarget;
      ondinhaX = ondinhaTarget;
      if (heroVideo) heroVideo.style.transform = 'translate3d(0, ' + videoY + 'px, 0)';
      if (heroOndinha) heroOndinha.style.backgroundPositionX = ondinhaX + 'px';
    }
  }


  /* ============================================================
     4. HERO — ROTATOR DO TÍTULO ("Artesanal" → "Caseira" → "De mãe" ...)

     Sincronizado com o looping do vídeo: tempo total das 5 palavras = duração do vídeo.
     Cada palavra ocupa videoDuration/5 ms (display + animações). O displayTime de cada
     palavra é o que sobra depois de descontar suas animações — palavras maiores ficam
     menos tempo estáticas (porque gastaram mais tempo na cascata).
     ============================================================ */
  var rotatorEl   = document.querySelector('.hero__title-rotator');
  var heroVideoEl = document.querySelector('.hero__video');
  var palavras    = ['Artesanal', 'Caseira', 'De mãe', 'De vó', 'Saborosa'];
  var rotatorIdx  = 0;
  var charDelay   = 30;               // ms entre cascata de cada char
  var animOutMs   = 350;              // duração da animação de saída por char
  var animInMs    = 400;              // duração da animação de entrada por char
  var scaleDur    = 180;              // duração do scaleX + opacity no container
  var scaleOffset = Math.round(scaleDur * 0.2);  // chars começam quando scale tá em ~20%

  // Fallback caso o vídeo não carregue metadata: 1s display por palavra
  var displayTimes = palavras.map(function () { return 1000; });

  function calcDisplayTimes(videoDurationMs) {
    var timePerWord = videoDurationMs / palavras.length;
    return palavras.map(function (word) {
      var n = word.length;
      var totalStack = animOutMs + (n - 1) * charDelay;
      var totalEntry = scaleOffset + animInMs + (n - 1) * charDelay;
      var totalExit  = Math.max(totalStack, Math.round(totalStack * 0.35) + scaleDur);
      return Math.max(300, timePerWord - totalEntry - totalExit);
    });
  }

  function maybeUpdateDisplayTimes() {
    if (!heroVideoEl) return;
    var dur = heroVideoEl.duration;
    if (!dur || isNaN(dur) || !isFinite(dur) || dur === 0) return;
    displayTimes = calcDisplayTimes(dur * 1000);
  }

  if (heroVideoEl) {
    if (heroVideoEl.readyState >= 1) maybeUpdateDisplayTimes();
    heroVideoEl.addEventListener('loadedmetadata', maybeUpdateDisplayTimes);
  }

  function splitWordToChars(word) {
    if (!rotatorEl) return;
    // Reset: remove classes e inline styles
    rotatorEl.className = 'hero__title-rotator';
    rotatorEl.removeAttribute('style');
    rotatorEl.innerHTML = '';
    var chars = word.split('');
    rotatorEl.style.setProperty('--char-count', chars.length);
    rotatorEl.style.setProperty('--scale-dur', scaleDur + 'ms');
    rotatorEl.style.setProperty('--scale-offset', scaleOffset + 'ms');

    var spans = [];
    for (var i = 0; i < chars.length; i++) {
      var span = document.createElement('span');
      span.className = 'hero__title-char';
      span.style.setProperty('--char-i', i);
      span.textContent = chars[i] === ' ' ? '\u00A0' : chars[i];
      rotatorEl.appendChild(span);
      spans.push(span);
    }

    // Mede offsetLeft de cada char pra calcular o translateX de empilhamento.
    var refX = spans[0] ? spans[0].offsetLeft : 0;
    for (var j = 0; j < spans.length; j++) {
      var dx = spans[j].offsetLeft - refX;
      spans[j].style.setProperty('--char-stack-x', (-dx) + 'px');
    }

    // ScaleX 0→1 + opacity 0→1. Chars ficam parados (delay inclui scaleDur no CSS).
    rotatorEl.classList.add('is-scaling-in');
  }

  function rotatorTick() {
    if (!rotatorEl) return;
    var chars = rotatorEl.querySelectorAll('.hero__title-char');

    // Remove scale-in (default: opacity 1, scaleX 1)
    rotatorEl.classList.remove('is-scaling-in');

    // Aplica saída (empilhamento — cascata via --char-i no CSS)
    for (var i = 0; i < chars.length; i++) {
      chars[i].classList.add('is-leaving');
    }

    // Tempo total do empilhamento dos chars
    var totalStack = animOutMs + ((chars.length - 1) * charDelay);

    // Scale começa quando 35% do empilhamento já aconteceu.
    // Os chars mais visíveis AINDA estão se movendo, a compressão se junta ao movimento.
    // Sem gap de velocidade: quando os chars param, o scale já tem momento próprio.
    var scaleStart = Math.round(totalStack * 0.35);
    window.setTimeout(function () {
      rotatorEl.classList.add('is-scaling-out');
    }, scaleStart);

    // Troca: o que terminar por último (stacking ou scale)
    var totalExit = Math.max(totalStack, scaleStart + scaleDur);
    window.setTimeout(function () {
      rotatorIdx = (rotatorIdx + 1) % palavras.length;
      splitWordToChars(palavras[rotatorIdx]);
      var n = palavras[rotatorIdx].length;
      var nextDelay = displayTimes[rotatorIdx] + scaleOffset + animInMs + ((n - 1) * charDelay);
      window.setTimeout(rotatorTick, nextDelay);
    }, totalExit);
  }

  // Inicia o rotator junto com o vídeo
  var rotatorStarted = false;
  function startRotator() {
    if (rotatorStarted || !rotatorEl || prefersReducedMotion) return;
    rotatorStarted = true;
    splitWordToChars(palavras[0]);
    var n = palavras[0].length;
    var firstDelay = displayTimes[0] + scaleOffset + animInMs + ((n - 1) * charDelay);
    window.setTimeout(rotatorTick, firstDelay);
  }

  if (rotatorEl && !prefersReducedMotion) {
    if (heroVideoEl) {
      if (!heroVideoEl.paused && heroVideoEl.currentTime > 0) {
        // Vídeo já está tocando: sincroniza agora
        startRotator();
      } else {
        heroVideoEl.addEventListener('playing', startRotator, { once: true });
      }
      // Fallback: se autoplay não disparar em 800ms, inicia mesmo assim
      setTimeout(startRotator, 800);
    } else {
      startRotator();
    }
  }

  /* ============================================================
     5. LOGO — Animação de entrada (só na home)

     3 peças (rect → bete → bistrô) com squash-and-stretch escalonado.

     Entrada: só na home (data-page="home").
     Saída: click na logo em qualquer página → animação espelho → navega pra home.
     ============================================================ */
  var logoAnim = document.getElementById('logoAnim');
  if (logoAnim) {
    // Entrada: só na home
    var isHome = document.body.getAttribute('data-page') === 'home';
    if (isHome) {
      logoAnim.classList.add('is-animating');
      // Remove a classe depois da entrada terminar pra liberar o click
      setTimeout(function () {
        logoAnim.classList.remove('is-animating');
      }, 980);
    }

    // Saída: click na logo → animação reversa → navega pra home
    var logoLink = logoAnim.closest('a');
    var logoExiting = false;

    if (logoLink) {
      logoLink.addEventListener('click', function (e) {
        if (logoExiting) { e.preventDefault(); return; }
        if (logoAnim.classList.contains('is-animating')) { e.preventDefault(); return; }

        e.preventDefault();
        logoExiting = true;

        // Fecha a gaveta se tiver aberta
        if (drawerOpen) closeDrawer();

        // Colapsa a nav (sem mostrar o ícone depois)
        if (!isCollapsed) {
          isCollapsed = true;
          header.classList.add('is-collapsed');
        }
        // Garante que o botão some com bounce (não instantâneo)
        hideBtn();

        // Logo: animação de saída
        logoAnim.classList.remove('is-animating');
        logoAnim.classList.add('is-exiting');

        // Navega pra home depois da animação terminar
        setTimeout(function () {
          window.location.href = logoLink.href;
        }, 980);
      });
    }
  }

})();
