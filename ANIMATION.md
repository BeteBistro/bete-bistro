# Bete Bistrô — Padrões de Animação

Referência para todas as animações do site. Consultar antes de implementar qualquer movimento.


## 1. Curvas de velocidade (easings)

Definidas como tokens em `tokens.css`.

### Par principal: `--ease-entrada` / `--ease-saida`

| Token | Valor | Pico | Uso |
|---|---|---|---|
| `--ease-entrada` | `cubic-bezier(0.88, 0, 0.48, 1)` | ~66% da duração | Elementos aparecendo |
| `--ease-saida` | `cubic-bezier(0.52, 0, 0.12, 1)` | ~34% da duração | Elementos saindo |

Regras:
- Pico de velocidade NUNCA é flat (platô). Sempre tem um pico pronunciado.
- Entrada e saída são espelhos: soma dos picos = 100%.
- Velocidade começa e termina em zero nos dois casos.
- Direção inverte: se entra de baixo pra cima, sai de cima pra baixo. Se fade in da esquerda pra direita, fade out da direita pra esquerda.

### Exceções ao par principal

| Contexto | Easing | Razão |
|---|---|---|
| Hover / interações | `ease` (`--ease-hover`) | Resposta instantânea, sem pico. |
| Bounce (menu-btn) | `--ease-bounce-in` / `--ease-bounce-out` | Bounce já tem pico via overshoot/pull-back. |
| Dropdown (nav desktop) | `ease-in` / `ease-out` | Popup rápido, curva assimétrica não cabe. |
| Opacidade do rotator | `linear` | Sincronizada com scaleX, sem pico próprio. |
| Logo squash-and-stretch | `linear` (entre keyframes) | Keyframes multi-stop definem a curva internamente. |

### Tokens legados (sem uso atual, mantidos pra referência)

| Token | Valor | Nota |
|---|---|---|
| `--ease-collapse` | `cubic-bezier(0.55, 0, 1, 0.3)` | Substituído por `--ease-saida` |
| `--ease-expand` | `cubic-bezier(0, 0.2, 0.35, 1)` | Substituído por `--ease-entrada` |

### Quando usar o quê

- **Par principal** (`--ease-entrada` / `--ease-saida`): padrão pra tudo. Scroll reveals, empilhamento de chars, parallax, carrosséis, aparições/desaparições, transições de seção, drawers, menu morph.
- **Exceções**: ver tabela acima.


## 2. Hover e interações

- Sempre dentro de `@media (hover: hover) and (pointer: fine)` pra evitar sticky hover em mobile/touch.
- Transition sem delay: `transition: [prop] 0.15s ease`.
- Cor por contexto:
  - Texto sobre fundo claro (marfim) → hover `--color-laranja-500`
  - Texto sobre fundo laranja-500 → hover `--color-laranja-300`


## 3. Padrão "empilhamento" (rotator do título)

Efeito visual: amassar e abrir uma massa. Três fases sobrepostas (scaleX, empilhamento, opacidade) que formam um contínuo único.

### Componentes

**Container** (`.hero__title-rotator`): `scaleX` + `opacity`, `transform-origin: left center`, easing `linear`.
**Chars**: `translateX(var(--char-stack-x))`, `--char-stack-x` medido via JS `offsetLeft`. Easing `--ease-entrada`/`--ease-saida`.

### Cascata

Ambos entrada e saída: última letra primeiro (delay 0), primeira por último.

### Sequência de entrada

1. Container: `scaleX(0) + opacity(0)` → `scaleX(1) + opacity(1)` em 180ms
2. Chars começam a desempilhar quando o scale tá em ~20% (overlap de 80%)
3. Chars: `translateX(--char-stack-x)` → `translateX(0)` em 400ms, cascata 30ms

### Sequência de saída

1. Chars: `translateX(0)` → `translateX(--char-stack-x)` em 350ms, cascata 30ms
2. Container scale começa a 35% do empilhamento (os chars mais visíveis AINDA estão se movendo)
3. Container: `scaleX(1) + opacity(1)` → `scaleX(0) + opacity(0)` em 180ms

### Princípio: sem máscara

NÃO usar `max-width` + `overflow: hidden` (efeito de janela/cortina). Cada letra se move via `translateX`.

### Princípio: continuidade de velocidade (overlap)

Animações sequenciais (chars → scale) precisam se SOBREPOR. Se uma fase termina e a próxima começa, a desaceleração da primeira + aceleração da segunda criam um gap de velocidade perceptível como pausa. A segunda fase precisa começar enquanto a primeira ainda tem momento, formando um contínuo.

Valores atuais de overlap:
- Saída: scale começa a 35% do totalStack (`totalStack * 0.35`)
- Entrada: chars começam a 20% do scaleDur (`scaleDur * 0.2`)


## 4. Animações por tipo de trigger

| Trigger | Implementação | Easing |
|---|---|---|
| Hover / active | CSS `transition`, sem delay | `--ease-hover` (ou `ease`) |
| Appear / disappear | `@keyframes` ou propriedades controladas por JS | `--ease-entrada` / `--ease-saida` |
| Scroll (parallax) | JS lerp com `requestAnimationFrame` | Lerp (ver seção 5) |
| Collapse/expand por char | `@keyframes` com cascata `--char-i` | `--ease-entrada` / `--ease-saida` |
| Logo entrada/saída | `@keyframes` multi-stop + JS click handler | `linear` (keyframes controlam) |


## 5. Parallax

### Lerp (interpolação suave)

O parallax NÃO mapeia scroll → posição diretamente (isso é linear, sem pico de velocidade). Em vez disso, usa lerp: o valor atual persegue o alvo com fração fixa por frame.

```js
current += (target - current) * lerpSpeed;
```

- `lerpSpeed = 0.1` (0.08–0.12 = suave, 0.15+ = snappy).
- Cria aceleração natural ao começar a scrollar e desaceleração ao parar.
- O loop para automaticamente quando a diferença é < 0.1px (snap final).

### Stack técnico
- `requestAnimationFrame` loop (não scroll listener direto).
- `translate3d` pro vídeo, `backgroundPositionX` pra ondinha.
- `will-change: transform` / `will-change: background-position` nos elementos.
- `prefers-reduced-motion: reduce` desativa tudo.

### Factors por viewport
- Vídeo hero: 0.08 mobile, 0.15 desktop (translateY positivo, afunda mais devagar).
- Ondinha hero: 0.3 (background-position-x).


## 6. Encadeamento de animações

Quando animação A termina e animação B começa em sequência:
- Delay entre A e B = 50% da duração do disappear de A.
- Timer cancelável (`clearTimeout`) se a condição inverter (ex: scroll muda de direção).
- Exemplo concreto: header collapse → expand. Delay 135ms (50% de 270ms do menu-btn disappear) entre `hideBtn()` e `remove('is-collapsed')`.


## 7. Drop-shadow padrão

```css
filter: drop-shadow(0 0 16px rgba(56, 18, 0, 0.20));
```
- Cor: laranja-950 a 20% opacidade, blur 16px.
- Aplicado em: logo, menu-btn, dropdown desktop, drawer panel.
- Mobile drawer: `filter: none` (override).


## 8. Logo (squash-and-stretch escalonado)

Animação de abertura da marca. 3 peças separadas (rect, "Bete", "Bistrô") com squash-and-stretch estilo AE.

### Estrutura

Logo dividida em 3 elementos dentro de `.logo-anim`:
- `.logo-anim__rect` — retângulo marfim (CSS, não SVG)
- `.logo-anim__bete` — `<img>` SVG "Bete"
- `.logo-anim__bistro` — `<img>` SVG "Bistrô"

Posicionamento via percentuais (top/left/width) pra escalar com `--logo-size` fluido.

### Entrada (só na home)

Só dispara quando `<body data-page="home">`. Classe `.is-animating` adicionada via JS, removida após 980ms.

Stagger: rect (0ms) → bete (180ms) → bistrô (340ms). Origin: `center top` (cresce de cima pra baixo).

### Saída (qualquer página)

Click na logo em qualquer página:
1. Fecha drawer se aberto
2. Colapsa nav (`.is-collapsed`, sem mostrar hamburger depois)
3. Hamburger faz bounce-out via `hideBtn()` (se visível)
4. Logo faz saída: mesmos keyframes em `reverse`, stagger invertido: bistrô (0ms) → bete (180ms) → rect (340ms)
5. Após 980ms, `window.location.href` navega pra home
6. Home carrega, entrada toca

### Keyframes (multi-stop, easing `linear`)

```
0%   scaleY(0)    opacity(0)   shadow(0)
10%  scaleY(0.15) opacity(0.4) shadow(parcial)
38%  scaleY(1)    opacity(1)   — grow completo
48%  scaleX(1.2)                — stretch começa
56%  scaleX(1.4)                — stretch pico
66%  scaleX(1.1)  scaleY(0.75) — squash
75%  scaleX(1)    scaleY(0.6)  — squash pico
88%  scaleX(1.05) scaleY(1.05) — overshoot sutil
100% scaleX(1)    scaleY(1)    — repouso
```

Motion blur sutil (max 0.6px) nos keyframes rápidos. Drop-shadow cresce de 0 ao padrão (`0 0 16px rgba(56,18,0,0.20)`) sincronizado com opacity.

### Duração

640ms por peça. Total com stagger: 980ms (640 + 340 delay).


## 9. Acessibilidade

- `prefers-reduced-motion: reduce` desativa parallax, rotator, e qualquer animação que não seja essencial pra compreensão.
- Hover states mantidos (não são motion).
- `will-change` só em elementos que realmente animam via JS (parallax). Não usar em hover CSS.


## 10. Overflow e acentos

`overflow: hidden` em elementos com texto acentuado corta os acentos. Solução:
```css
overflow: hidden;
padding-top: 6px;   /* ou 0.2em */
margin-top: -6px;   /* compensa pra não empurrar a linha */
```
`overflow-x: hidden` sozinho NÃO resolve (browser força `overflow-y: auto`).
