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
      setTimeout(showBtn, 240);
    } else if (!shouldCollapse && isCollapsed) {
      isCollapsed = false;
      // Se a gaveta tiver aberta, fecha junto
      if (drawer.classList.contains('is-open')) closeDrawer();
      hideBtn();
      // Expand começa quando ícone está ~50% sumido (120ms = metade dos 240ms de disappear)
      expandTimer = setTimeout(function () {
        expandTimer = null;
        header.classList.remove('is-collapsed');
      }, 120);
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

     Sincronizado com o looping do vídeo: tempo total das 4 palavras = duração do vídeo.
     Cada palavra ocupa videoDuration/4 ms (display + animações). O displayTime de cada
     palavra é o que sobra depois de descontar suas animações — palavras maiores ficam
     menos tempo estáticas (porque gastaram mais tempo na cascata).
     ============================================================ */
  var rotatorEl   = document.querySelector('.hero__title-rotator');
  var heroVideoEl = document.querySelector('.hero__video');
  var palavras    = ['Artesanal', 'Caseira', 'De mãe', 'De vó'];
  var rotatorIdx  = 0;
  var charDelay   = 40;               // ms entre cascata de cada char (0.5x base 80ms)
  var animOutMs   = 320;              // duração da animação de saída por char (4x)
  var animInMs    = 400;              // duração da animação de entrada por char (5x)
  var scaleDur    = 160;              // duração do scaleX + opacity no container (2x)
  var scaleOffset = 40;               // chars começam quando scale tá em ~25% (0.5x)

  // Tempo total fixo por palavra: 2.8s (35x base 80ms)
  var wordCycleMs = 2800;

  var displayTimes = palavras.map(function () { return 1000; });

  function calcDisplayTimes() {
    return palavras.map(function (word) {
      var n = word.length;
      var totalEntry = scaleOffset + animInMs + (n - 1) * charDelay;
      var totalStack = animOutMs + (n - 1) * charDelay;
      var totalExit  = Math.max(totalStack, Math.round(totalStack * 0.35) + scaleDur);
      return Math.max(300, wordCycleMs - totalEntry - totalExit);
    });
  }

  displayTimes = calcDisplayTimes();

  // Display times fixos (não dependem do vídeo)

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
    // Mobile: stack-x SIMÉTRICO (chars tratados como largura igual) pra
    //   funcionar com transform-origin: center sem assimetria.
    // Desktop: stack-x real (baseado em offsetLeft, origin: left).
    var isMobile = window.innerWidth < 769;
    if (isMobile) {
      var evenStep = rotatorEl.offsetWidth / spans.length;
      var mid = (spans.length - 1) / 2;
      for (var j = 0; j < spans.length; j++) {
        var dx = (j - mid) * evenStep;
        spans[j].style.setProperty('--char-stack-x', (-dx) + 'px');
      }
    } else {
      var refX = spans[0] ? spans[0].offsetLeft : 0;
      for (var j = 0; j < spans.length; j++) {
        var dx = spans[j].offsetLeft - refX;
        spans[j].style.setProperty('--char-stack-x', (-dx) + 'px');
      }
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
      // Fallback: se autoplay não disparar em 640ms (8x), inicia mesmo assim
      setTimeout(startRotator, 640);
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
      }, 960);

      // Menu-btn entra com stagger após o logo (5x base 80ms).
      // Só em mobile/tablet (header colapsado). Desktop não precisa (nav expandido).
      if (isCollapsed) setTimeout(showBtn, 400);
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
        }, 960);
      });
    }
  }

})();


/* ============================================================
   CATEGORIAS — Carousel infinito com drag + snap + loop
   Clona os 4 cards nas duas pontas. Ao snapar num clone,
   pula instantaneamente pro card real equivalente.
   ============================================================ */
(function () {
  var carousel = document.querySelector('.categorias__carousel');
  var track = document.querySelector('.categorias__track');
  if (!carousel || !track) return;

  var originals = Array.prototype.slice.call(
    track.querySelectorAll('.categorias__card')
  );
  var N = originals.length;
  if (N < 2) return;

  /* --- Clonar cards: [clones do grupo] + [originais] + [clones do grupo] --- */
  var preFrag = document.createDocumentFragment();
  var postFrag = document.createDocumentFragment();
  for (var i = 0; i < N; i++) {
    var pre = originals[i].cloneNode(true);
    pre.setAttribute('aria-hidden', 'true');
    pre.removeAttribute('href');
    preFrag.appendChild(pre);

    var post = originals[i].cloneNode(true);
    post.setAttribute('aria-hidden', 'true');
    post.removeAttribute('href');
    postFrag.appendChild(post);
  }
  track.insertBefore(preFrag, track.firstChild);
  track.appendChild(postFrag);

  /* Agora o track tem 3×N cards: [0..N-1] clones | [N..2N-1] reais | [2N..3N-1] clones */
  var allCards = track.querySelectorAll('.categorias__card');
  var totalCards = allCards.length;  // 3 * N

  var currentTx = 0;
  var isDragging = false;
  var startX = 0;
  var dragStartTx = 0;
  var cardW, cardH, gap, step, groupWidth, scaleX, scaleY;
  var activeIdx = -1;   // índice do card ativo (mais próximo do centro)

  function measure() {
    cardW = allCards[0].offsetWidth;
    cardH = allCards[0].offsetHeight;
    gap = parseFloat(getComputedStyle(track).gap) || 16;
    step = cardW + gap;
    groupWidth = N * step;

    // Shrink: lê do CSS custom property
    var shrink = parseFloat(
      getComputedStyle(carousel.closest('.categorias')).getPropertyValue('--cat-shrink')
    ) || 32;
    scaleX = (cardW - shrink) / cardW;
    scaleY = (cardH - shrink) / cardH;

    // Expõe como CSS custom properties pro hover desktop usar
    var section = carousel.closest('.categorias');
    if (section) {
      section.style.setProperty('--cat-sx', scaleX);
      section.style.setProperty('--cat-sy', scaleY);
    }
  }

  function txForCardCenter(idx) {
    return carousel.offsetWidth / 2 - (idx * step + cardW / 2);
  }

  /* --- Scale: card ativo (mais perto do centro) faz downscale --- */
  function isDesktop() { return carousel.offsetWidth >= 1200; }

  function clearAllInlineScales() {
    for (var i = 0; i < totalCards; i++) {
      var inner = allCards[i].querySelector('.categorias__card-inner');
      if (inner) inner.style.transform = '';
    }
    activeIdx = -1;
  }

  function updateCardScales() {
    // Desktop: scale é via CSS :hover, limpa qualquer inline residual
    if (isDesktop()) {
      if (activeIdx >= 0) clearAllInlineScales();
      return;
    }

    var vwCenter = carousel.offsetWidth / 2;
    var bestIdx = -1;
    var bestDist = Infinity;

    for (var i = 0; i < totalCards; i++) {
      var cardCenter = i * step + cardW / 2 + currentTx;
      var dist = Math.abs(cardCenter - vwCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    if (bestIdx === activeIdx) return;

    // Remove escala do anterior
    if (activeIdx >= 0 && activeIdx < totalCards) {
      var prevInner = allCards[activeIdx].querySelector('.categorias__card-inner');
      if (prevInner) prevInner.style.transform = '';
    }

    // Aplica escala no novo ativo
    activeIdx = bestIdx;
    if (activeIdx >= 0 && activeIdx < totalCards) {
      var newInner = allCards[activeIdx].querySelector('.categorias__card-inner');
      if (newInner) newInner.style.transform = 'scale(' + scaleX + ', ' + scaleY + ')';
    }
  }

  /* --- Snap pro card mais próximo do centro --- */
  var isSnapping = false;

  function snapToNearest(animate) {
    if (animate === undefined) animate = true;

    var viewCenter = -currentTx + carousel.offsetWidth / 2;
    var idx = Math.round((viewCenter - cardW / 2) / step);
    idx = Math.max(0, Math.min(idx, totalCards - 1));

    currentTx = txForCardCenter(idx);

    if (animate) {
      isSnapping = true;
      track.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    } else {
      track.style.transition = 'none';
    }
    track.style.transform = 'translateX(' + currentTx + 'px)';
    updateCardScales();
  }

  /* --- Loop: reposiciona pro grupo real se tiver nos clones.
         Usado tanto no snap (transitionend) quanto DURANTE drag/wheel. --- */
  function wrapPosition() {
    var viewCenter = -currentTx + carousel.offsetWidth / 2;
    var idx = Math.round((viewCenter - cardW / 2) / step);
    var shift = 0;

    if (idx < N) {
      shift = -groupWidth;
    } else if (idx >= 2 * N) {
      shift = groupWidth;
    } else {
      return false;
    }

    currentTx += shift;
    dragStartTx += shift;

    // Atualiza activeIdx pro equivalente no grupo real (sem animação visual)
    if (activeIdx >= 0) {
      var newActive = shift < 0 ? activeIdx + N : activeIdx - N;
      // Desliga transition, troca o ativo, religa
      if (newActive >= 0 && newActive < totalCards) {
        var oldInner = allCards[activeIdx].querySelector('.categorias__card-inner');
        var newInner = allCards[newActive].querySelector('.categorias__card-inner');
        if (oldInner) { oldInner.style.transition = 'none'; oldInner.style.transform = ''; }
        if (newInner) { newInner.style.transition = 'none'; newInner.style.transform = 'scale(' + scaleX + ',' + scaleY + ')'; }
        activeIdx = newActive;
        // Força reflow e religa transition
        void track.offsetHeight;
        if (oldInner) oldInner.style.transition = '';
        if (newInner) newInner.style.transition = '';
      }
    }

    track.style.transition = 'none';
    track.style.transform = 'translateX(' + currentTx + 'px)';
    return true;
  }

  // Após animação de snap, faz o jump se necessário
  track.addEventListener('transitionend', function () {
    isSnapping = false;
    wrapPosition();
  });

  /* --- Posição inicial (no grupo real, índices N..2N-1) --- */
  function setInitialPosition() {
    measure();
    var vw = carousel.offsetWidth;

    if (vw >= 768) {
      // Desktop + Tablet: card real 2 (índice N+1) centralizado
      currentTx = txForCardCenter(N + 1);
    } else {
      // Mobile: card real 1 (índice N) centralizado
      currentTx = txForCardCenter(N);
    }

    track.style.transition = 'none';
    track.style.transform = 'translateX(' + currentTx + 'px)';
    activeIdx = -1;
    updateCardScales();
  }

  /* --- Drag (pointer events = touch + mouse) --- */
  carousel.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    isDragging = true;
    isSnapping = false;
    startX = e.clientX;
    dragStartTx = currentTx;
    track.style.transition = 'none';
    carousel.setPointerCapture(e.pointerId);
    carousel.style.cursor = 'grabbing';
  });

  carousel.addEventListener('pointermove', function (e) {
    if (!isDragging) return;
    var dx = e.clientX - startX;
    currentTx = dragStartTx + dx;
    track.style.transform = 'translateX(' + currentTx + 'px)';
    wrapPosition();
    updateCardScales();
  });

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    carousel.style.cursor = '';
    snapToNearest();
  }

  carousel.addEventListener('pointerup', endDrag);
  carousel.addEventListener('pointercancel', endDrag);
  carousel.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* --- Prevenir click em links se houve drag significativo --- */
  var dragThreshold = 5;
  carousel.addEventListener('click', function (e) {
    var dx = Math.abs((startX || 0) - (e.clientX || 0));
    if (dx > dragThreshold) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  /* --- Scroll lateral via touchpad/wheel --- */
  var wheelTimer = null;
  var prevAbsDelta = 0;
  carousel.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    e.preventDefault();

    // Se tá no meio de um snap mas o usuário scrollou com força, cancela o snap
    if (isSnapping) {
      if (Math.abs(e.deltaX) > 4) {
        isSnapping = false;
        track.style.transition = 'none';
      } else {
        return;  // momentum residual, deixa o snap terminar
      }
    }

    track.style.transition = 'none';
    currentTx -= e.deltaX;
    track.style.transform = 'translateX(' + currentTx + 'px)';
    wrapPosition();
    updateCardScales();

    var absDelta = Math.abs(e.deltaX);
    clearTimeout(wheelTimer);

    // Quando a velocidade tá caindo e ficou pequena, snapa imediatamente
    // (o scroll tá desacelerando, snap pega o bastão antes de parar)
    if (absDelta <= 2 && prevAbsDelta > absDelta) {
      prevAbsDelta = 0;
      snapToNearest();
    } else {
      // Fallback curto pra quando os eventos param de vez
      wheelTimer = setTimeout(function () {
        prevAbsDelta = 0;
        snapToNearest();
      }, 80);
    }

    prevAbsDelta = absDelta;
  }, { passive: false });

  /* --- Init + resize --- */
  setInitialPosition();
  window.addEventListener('resize', function () {
    measure();
    setInitialPosition();
  });
})();
