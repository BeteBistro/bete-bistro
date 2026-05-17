# Bete Bistrô — Padrões de Animação

Referência para todas as animações do site. Consultar antes de implementar qualquer movimento.


## 1. Curvas de velocidade (easings)

Definidas como tokens em `tokens.css`.

### Par principal: `--ease-entrada` / `--ease-saida`

| Token | Valor | Pico | Uso |
|---|---|---|---|
| `--ease-entrada` | `cubic-bezier(0.93, 0, 0.55, 1)` | ~67% da duração | Elementos aparecendo |
| `--ease-saida` | `cubic-bezier(0.45, 0, 0.07, 1)` | ~33% da duração | Elementos saindo |

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


## 3. Padrão "rotator" (cascata por caractere)

Usado em: rotator do hero. Pode ser reaproveitado em outros textos animados.

Cada caractere vira `<span>` com `--char-i` (índice) e `--char-count` (total) via JS.

### Princípio: sem máscara

NÃO usar `max-width` + `overflow: hidden` (cria efeito de janela/máscara cortando as letras). Em vez disso, cada letra aparece/some por conta própria via `opacity` + `transform`.

### Entrada (letras sobem e aparecem)
```css
animation: hero-char-enter 400ms var(--ease-entrada) backwards;
animation-delay: calc(var(--char-i) * 30ms);  /* cascata esq → dir */
```
```css
@keyframes hero-char-enter {
  from { opacity: 0; transform: translateY(0.35em); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Saída (letras sobem e somem)
```css
animation: hero-char-leave 350ms var(--ease-saida) forwards;
animation-delay: calc((var(--char-count) - 1 - var(--char-i)) * 30ms);  /* cascata REVERSA */
```
```css
@keyframes hero-char-leave {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-0.35em); }
}
```

Regras:
- Stagger: 30ms entre cada char.
- Entrada: cascata normal (esquerda → direita, primeira letra primeiro).
- Saída: cascata REVERSA (direita → esquerda, última letra primeiro).
- Uma única animation por estado (opacity + transform juntos). Sem separar em 2 animations com delays diferentes.


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
