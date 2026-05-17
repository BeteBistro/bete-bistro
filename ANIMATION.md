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

### Exceções

| Token | Valor | Quando usar |
|---|---|---|
| `--ease-hover` | `ease` | Hover e interações instantâneas. Sem delay, sem pico. |
| `--ease-bounce-in` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Appear com overshoot (menu-btn). |
| `--ease-bounce-out` | `cubic-bezier(0.6, -0.55, 0.735, 0.045)` | Disappear com pull-back (menu-btn). |

Bounce já reproduz pico de velocidade via escala (overshoot/pull-back). Não precisa da curva assimétrica em cima.

### Tokens legados (sem uso atual, mantidos pra referência)

| Token | Valor | Nota |
|---|---|---|
| `--ease-collapse` | `cubic-bezier(0.55, 0, 1, 0.3)` | Substituído por `--ease-saida` |
| `--ease-expand` | `cubic-bezier(0, 0.2, 0.35, 1)` | Substituído por `--ease-entrada` |

### Quando usar o quê

- **Par principal** (`--ease-entrada` / `--ease-saida`): tudo. Scroll reveals, lettering, parallax, carrosséis, aparições/desaparições, transições de seção, drawers, dropdowns, menu morph, botão appear/disappear.
- **Hover** (`--ease-hover`): qualquer `:hover` ou `:active`. Resposta imediata, sem delay.


## 2. Hover e interações

- Sempre dentro de `@media (hover: hover) and (pointer: fine)` pra evitar sticky hover em mobile/touch.
- Transition sem delay: `transition: [prop] 0.15s ease`.
- Cor por contexto:
  - Texto sobre fundo claro (marfim) → hover `--color-laranja-500`
  - Texto sobre fundo laranja-500 → hover `--color-laranja-300`


## 3. Padrão "empilhamento" (rotator do título)

Efeito de empilhamento horizontal: letras empilhadas em x=0, se desempilham arrastando pra direita.

Cada caractere vira `<span>` com `--char-i` (índice), `--char-count` (total) e `--char-stack-x` (offset medido via JS `offsetLeft`) definidos no JS.

### Princípio: sem máscara

NÃO usar `max-width` + `overflow: hidden` (cria efeito de janela cortando as letras). NÃO usar `translateY` (não é o efeito desejado). Cada letra se move horizontalmente de/para a posição empilhada via `translateX(var(--char-stack-x))`.

### Cascata

Ambos entrada e saída: última letra primeiro (delay 0), primeira letra por último. A última tem mais distância, lidera o movimento.

```css
animation-delay: calc((var(--char-count) - 1 - var(--char-i)) * 30ms);
```

### Entrada (desempilha)
```css
@keyframes hero-char-unstack {
  from { transform: translateX(var(--char-stack-x)); }
  to   { transform: translateX(0); }
}
```
Duração: 400ms. Easing: `--ease-entrada`.

### Saída (empilha)
```css
@keyframes hero-char-stack {
  from { transform: translateX(0); }
  to   { transform: translateX(var(--char-stack-x)); }
}
```
Duração: 350ms. Easing: `--ease-saida`.

### Opacidade (exceção: flat/linear)

Opacidade é no CONTAINER (`.hero__title-rotator`), não por caractere. Usa curva flat (`linear`), exceção à regra de pico.

- **Entrada**: `opacity 0→1`, 120ms linear, sem delay. Letras ficam visíveis assim que começam a se arrastar.
- **Saída**: `opacity 1→0`, 120ms linear, delay = totalSaída - 120ms. Letras somem quando a última termina de empilhar.

Classes: `.is-entering` (fade in) e `.is-exiting` (fade out), controladas via JS.


## 4. Animações por tipo de trigger

| Trigger | Implementação | Easing |
|---|---|---|
| Hover / active | CSS `transition`, sem delay | `--ease-hover` (ou `ease`) |
| Appear / disappear | `@keyframes` ou propriedades controladas por JS | `--ease-entrada` / `--ease-saida` |
| Scroll (parallax) | JS lerp com `requestAnimationFrame` | Lerp (ver seção 5) |
| Collapse/expand por char | `@keyframes` com cascata `--char-i` | `--ease-entrada` / `--ease-saida` |


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


## 8. Acessibilidade

- `prefers-reduced-motion: reduce` desativa parallax, rotator, e qualquer animação que não seja essencial pra compreensão.
- Hover states mantidos (não são motion).
- `will-change` só em elementos que realmente animam via JS (parallax). Não usar em hover CSS.


## 9. Overflow e acentos

`overflow: hidden` em elementos com texto acentuado corta os acentos. Solução:
```css
overflow: hidden;
padding-top: 6px;   /* ou 0.2em */
margin-top: -6px;   /* compensa pra não empurrar a linha */
```
`overflow-x: hidden` sozinho NÃO resolve (browser força `overflow-y: auto`).
