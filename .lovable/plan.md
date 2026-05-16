# Ajustes do editor

## 1. Experiência "mobile no desktop"

Forçar o editor a se renderizar como um app mobile mesmo em telas grandes:

- Remover o `md:max-w-2xl` do container em `src/routes/index.tsx`. Manter `max-w-[420px]` fixo, centralizado, com sombra leve e cantos arredondados em telas ≥ `md` para parecer um "device frame".
- Fundo da página em `bg-neutral-100` para destacar o frame branco no desktop.

## 2. Acesso à tira de abas (botões cortados à direita)

A barra de abas tem 10 itens e estoura a largura no mobile/frame. Substituir o scroll-touch puro por interação universal:

- Arrastar com o mouse para rolar (pointer down + move atualiza `scrollLeft`), além do swipe nativo.
- Rolar com a roda do mouse vertical → converte em `scrollLeft`.
- Indicadores de borda: gradientes brancos (`mask`) à esquerda/direita aparecem quando há mais conteúdo, sinalizando que rola.
- Pequenos chevrons (`ChevronLeft`/`ChevronRight`) flutuantes nas bordas, visíveis só quando há overflow naquele lado, que rolam ~120px por clique.

Implementação: hook simples `useDragScroll` em `KitTabs.tsx` (componente novo extraído de `index.tsx`).

## 3. Layout sem comprometer o uniforme

Reorganizar verticalmente para garantir que canvas, abas e painel caibam sem cortar:

- Canvas com altura responsiva: `clamp(320px, 50vh, 480px)` (em vez do atual `min(62vh, 540px)`), liberando espaço inferior.
- Abas em altura `h-12` e `text-[9px]` (mais compactas), espaçamento `gap-2`.
- Painel inferior com `max-h` + `overflow-y-auto` discreto, para que paletas/sliders não empurrem a página.
- Header do app `h-12` (era `h-14`).

## 4. Zoom inicial 100%

- `useState(1.0)` no `index.tsx` (era `1.15`).
- `handleReset` também volta para `1.0`.

## 5. Slider de zoom vertical + botão "ajustar"

Reformular o controle de zoom dentro de `KitCanvas.tsx`:

- Substituir o popover horizontal por um popover **vertical** que abre **acima** do botão de zoom (canto inferior direito do canvas).
- Conteúdo do popover (de cima para baixo):
  - Porcentagem atual (`{n}%`).
  - `<Slider orientation="vertical">` (Radix já suporta) com altura `h-32`, range 50–200%, step 5.
- Ao lado do botão de zoom, um novo botão com ícone `Maximize2` (setas de expansão) que reseta zoom para `1.0` e `pan` para `{x:0,y:0}` — "ajustar à tela 100%".
- Clicar fora do popover fecha (overlay invisível ou `onPointerDown` no canvas).

### Componente de slider vertical

O `Slider` atual (`src/components/ui/slider.tsx`) está hardcoded em horizontal. Atualizar para repassar `orientation` e adicionar variantes verticais nos `Track`/`Range`/`Thumb` (largura/altura trocadas quando vertical).

---

## Arquivos afetados

- `src/routes/index.tsx` — container, header compacto, zoom inicial, extrai `KitTabs`.
- `src/components/kit/KitCanvas.tsx` — popover vertical, botão maximize, altura do canvas.
- `src/components/kit/KitTabs.tsx` *(novo)* — abas com drag-scroll, wheel→horizontal, chevrons.
- `src/components/ui/slider.tsx` — suporte a `orientation="vertical"`.
