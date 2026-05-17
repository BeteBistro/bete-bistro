# Bete Bistrô — Padrões de Animação

Referência para todas as animações do site. Consultar antes de implementar qualquer movimento.


## 1. Curvas de velocidade (easings)

Definidas como tokens em `tokens.css`.

### Par principal: `--ease-entrada` / `--ease-saida`

| Token | Valor | Pico | Uso |
|---|---|---|---|
| `--ease-entrada` | `cubic-bezier(0.82, 0, 0.42, 1)` | ~65% da duração | Elementos aparecendo |
| `--ease-saida` | `cubic-bezier(0.58, 0, 0.18, 1)` | ~35% da duração | Elementos saindo |

Regras:
- Pico de velocidade NUNCA é flat (platô). Sempre tem um pico pronunciado.
- Entrada e saída são espelhos: soma dos picos = 100%.
- Velocidade começa e termina em zero nos dois casos.
- Direção inverte: se entra de baixo pra cima, sai de cima pra baixo. Se fade in da esquerda pra direita, fade out da direita pra esquerda.

### Exceções ao par principal

| Token | Valor | Quando usar |
|---|---|---|
| `--ease-hover` | `ease` | Hover e interações instantâneas. Sem delay, sem pico. |
| `--ease-collapse` | `cubic-bezier(0.55, 0, 1, 0.3)` | Colapso do menu/chars (ease-in). Legado, manter. |
| `--ease-expand` | `cubic-bezier(0, 0.2, 0.35, 1)` | Expansão do menu/chars (ease-out). Legado, manter. |

### Quando usar o quê

- **Par principal** (`--ease-entrada` / `--ease-saida`): scroll reveals, lettering, parallax, carrosséis, aparições/desaparições de elementos, transições de seção.
- **Hover** (`--ease-hover`): qualquer `:hover` ou `:active`. Resposta imediata, sem delay.
- **Collapse/expand**: animação de colapso por caractere (menu desktop, rotator do hero). Essas usam cascata por `--char-i` e têm lógica própria (ver seção 3).


## 2. Hover e interações

- Sempre dentro de `@media (hover: hover) and (pointer: fine)` pra evitar sticky hover em mobile/touch.
- Transition sem delay: `transition: [prop] 0.15s ease`.
- Cor por contexto:
  - Texto sobre fundo claro (marfim) → hover `--color-laranja-500`
  - Texto sobre fundo laranja-500 → hover `--color-laranja-300`


## 3. Padrão "colapsar" (cascata por caractere)

Usado em: nav desktop, rotator do hero.

Cada caractere/item recebe `--char-i` (índice) e `--char-count` (total) via JS ou CSS.

### Entrada (expandir)
```css
animation-name: expand-width, fade-in;
animation-duration: 400ms, 300ms;
animation-timing-function: var(--ease-expand), ease-out;
animation-fill-mode: backwards;
animation-delay:
  calc(var(--char-i) * 30ms),                    /* max-width */
  calc(var(--char-i) * 30ms + 100ms);            /* opacity: delay menor, acompanha cedo */
```

### Saída (colapsar)
```css
animation-name: collapse-width, fade-out;
animation-duration: 400ms, 120ms;
animation-timing-function: var(--ease-collapse), linear;
animation-fill-mode: forwards;
animation-delay:
  calc((var(--char-count) - 1 - var(--char-i)) * 30ms),       /* cascata REVERSA */
  calc((var(--char-count) - 1 - var(--char-i)) * 30ms + 280ms); /* opacity: 70% do colapso */
```

Regras:
- Stagger: 30ms entre cada char/item.
- Saída em cascata REVERSA: último char some primeiro (comprime da direita pra esquerda).
- Opacity na saída só começa em ~70% do colapso do max-width (delay 280ms de 400ms). Duração curta (120ms, linear) pra terminar junto com max-width mas só cair no fim. Sem esse delay alto, o fade tampa o efeito de movimento.
- Opacity na entrada com delay menor (~100ms) pra acompanhar mais cedo. Easing ease-out.


## 4. Animações por tipo de trigger

| Trigger | Implementação | Easing |
|---|---|---|
| Hover / active | CSS `transition`, sem delay | `--ease-hover` |
| Appear / disappear | `@keyframes` ou propriedades controladas por JS | `--ease-entrada` / `--ease-saida` |
| Scroll (parallax, reveal) | JS `requestAnimationFrame` + `translate3d` | `--ease-entrada` / `--ease-saida` em JS |
| Collapse/expand por char | `@keyframes` com cascata `--char-i` | `--ease-collapse` / `--ease-expand` |


## 5. Parallax

- Stack: `requestAnimationFrame` + passive scroll listener + `translate3d` + `will-change`.
- Limitar scroll ao `offsetHeight` do container (não animar fora da viewport).
- `prefers-reduced-motion: reduce` desativa tudo.
- Factors por viewport:
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
