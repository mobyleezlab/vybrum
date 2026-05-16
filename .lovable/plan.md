# Plano — Editor de Uniformes Profissional

Refatoração completa do editor para um configurador dinâmico baseado em camadas SVG, com texto, escudos, fontes e preview ampliado.

## 1. SVGs em camadas editáveis

Reescrever `UniformFrente.tsx` e `UniformCostas.tsx` a partir dos SVGs anexados (viewBox `0 0 1080 1080`), com IDs/classes padronizados e cada parte como `<g>` independente clicável:

- `fill-body` — corpo da camisa
- `fill-sleeve` — mangas
- `fill-collar` — gola
- `fill-pattern` — listras/estampa da camisa (novo `<g>` sobreposto ao corpo, com padrões SVG: listras verticais, horizontais, sólido)
- `fill-shorts` — calção
- `fill-shorts-pattern` — listras do calção
- `fill-details` — detalhes secundários (punhos, faixa lateral)
- `costuras` — overlay decorativo (não-clicável)

Camadas de conteúdo (renderizadas por cima):
- `<g id="badge-chest">` (frente) e `<g id="badge-shorts">` (calção) — `<image href>` posicionável
- `<text id="player-name">` (costas, centralizado)
- `<text id="player-number-back">` (costas, abaixo do nome)
- `<text id="player-number-front">` (frente, peito ou calção)

## 2. Estado centralizado (`src/lib/kit-state.ts`)

Expandir `KitState`:

```ts
type PartId = 'body'|'sleeves'|'collar'|'pattern'|'shorts'|'shortsPattern'|'details';
type PatternKind = 'solid'|'verticalStripes'|'horizontalStripes'|'sash';

interface TextLayer { value: string; font: string; size: number; color: string; offsetX: number; offsetY: number; }
interface BadgeLayer { src: string|null; x: number; y: number; size: number; }

interface KitState {
  view: 'front'|'back';
  partColors: Record<PartId,string>;
  pattern: PatternKind;
  shortsPattern: PatternKind;
  playerName: TextLayer;
  playerNumber: TextLayer;
  badgeChest: BadgeLayer;
  badgeShorts: BadgeLayer;
  zoom: number;        // 0.5–2.0
  pan: {x:number;y:number};
  selectedPart: PartId;
  activeTab: TabId;
}
```

Histórico undo/redo: stack `past[] / future[]` em hook `useKitHistory` envolvendo `setState`.

## 3. Painéis por aba

Substituir abas atuais por painel dinâmico abaixo da paleta, controlado por `activeTab`:

- **Camisa / Mangas / Gola / Calção** — paleta de cor aplica em `partColors[selectedPart]`
- **Listras (camisa)** — seletor visual de padrão + cor `pattern`
- **Listras (calção)** — idem para shorts
- **Nome** — input texto + slider tamanho + seletor fonte + cor + offset Y
- **Número** — input numérico + tamanho + fonte + cor + posição (frente/costas/short)
- **Escudo peito / Escudo calção** — grid de escudos predefinidos (`src/assets/badges/*.svg` placeholders) + slider tamanho + arrastar para reposicionar; estrutura preparada para upload futuro (input file desabilitado por ora, mas com handler stub)

## 4. Fontes

`src/styles.css`: importar via Google Fonts — Bebas Neue, Anton, Teko, Oswald, Russo One, Rajdhani, Orbitron. Expor lista em `kit-state.ts` (`SPORT_FONTS`) usada pelo seletor visual (cada item renderiza "ABC 10" na própria fonte).

## 5. Preview ampliado e zoom

`src/routes/index.tsx`:

- Aumentar a altura do canvas para `min(70vh, 560px)` em mobile e `60vh` em telas maiores; reduzir padding interno para `p-2`.
- SVG `preserveAspectRatio="xMidYMid meet"` com `viewBox` ajustado para enquadrar (`200 0 700 1080`) — uniforme passa a ocupar ~85% da área.
- Zoom inicial `1.1`; range `0.5–2.0`.
- Botão de zoom abre popover com `<Slider>` (Radix) horizontal mostrando `{Math.round(zoom*100)}%`.
- Scroll do mouse no canvas → ajusta zoom (`onWheel`, `e.preventDefault`, step 0.05).
- Pinch mobile: gesto de 2 dedos via `pointerdown/move/up` rastreando distância entre 2 pointers ativos.
- Pan: quando `zoom > 1`, drag com mouse/touch atualiza `pan`. `transform: translate3d(pan.x,pan.y,0) scale(zoom)` + `will-change: transform` para aceleração GPU.
- Limites: clamp de `pan` proporcional a `(zoom-1) * canvasSize/2`.
- Transições: `transition-transform duration-200 ease-out` no flip e troca de cor (já existe `fill` transition).

## 6. Toolbar e ações

Header reorganizado: voltar | título | undo | redo | salvar | download.
- Undo/Redo com ícones `Undo2`/`Redo2` (lucide), desabilitados quando stacks vazios.
- Reset (canto inferior esquerdo do canvas) → restaura `INITIAL_STATE` preservando histórico.
- Flip (canto superior direito) — animação cross-fade 200ms entre frente/costas.

## 7. Exportação

`src/lib/kit-export.ts`:

- `exportKitPng(node, name)` — `toPng` com `backgroundColor: 'transparent'`, `pixelRatio: 4`.
- `exportKitSvg(state)` — gera string SVG a partir de função pura `renderKitSvg(state, view)` (mesma usada nos componentes), serializa via `XMLSerializer`, baixa como `.svg`.
- Modal de download com 2 opções: PNG / SVG.

## 8. Estrutura de arquivos

```
src/
  components/kit/
    UniformFrente.tsx        # camadas + IDs padronizados
    UniformCostas.tsx        # idem
    KitCanvas.tsx            # wrapper preview + zoom/pan/pinch
    KitToolbar.tsx           # header undo/redo/save/download
    KitTabs.tsx              # tira de abas
    panels/
      ColorPanel.tsx         # paleta (reutilizada por body/sleeves/collar/shorts)
      PatternPanel.tsx       # seletor de padrão + cor
      TextPanel.tsx          # nome/número
      BadgePanel.tsx         # grid escudos + tamanho
      FontPicker.tsx
    patterns/
      StripesVertical.tsx    # <pattern> SVG reutilizável
      StripesHorizontal.tsx
      Sash.tsx
  lib/
    kit-state.ts             # types + INITIAL_STATE + listas
    kit-history.ts           # hook undo/redo
    kit-export.ts            # PNG + SVG
    kit-storage.ts           # localStorage (mantido)
  assets/badges/             # 6 escudos SVG placeholder
  routes/index.tsx           # composição
```

## 9. Mobile-first e visual premium

- Container `max-w-[480px]` em mobile, expande para `max-w-2xl` em `md:` com canvas maior.
- Controles flutuantes sobre o canvas usam `bg-white/70 backdrop-blur` para não cobrir o uniforme.
- Animações: `framer-motion` já não está no projeto — usar Tailwind `transition-*` e `animate-fade-in` (definido em `tailwind.config`/`styles.css`).
- Feedback de seleção de parte: ring colorido 2px no `<g>` ativo (via filtro `drop-shadow`).

## 10. Sem bloqueios premium

Todas as abas, fontes, escudos, exportação SVG e undo/redo permanecem 100% acessíveis — nenhum gate.

---

### Detalhes técnicos

- Padrões SVG implementados como `<defs><pattern id="p-stripes-v" patternUnits="userSpaceOnUse" width="60" height="10"><rect .../></pattern></defs>` e referenciados via `fill="url(#p-stripes-v)"` na camada `pattern` por cima do corpo (com `clip-path` no shape do corpo).
- Texto curvo no nome usa `<textPath>` opcionalmente; v1 entrega texto reto centralizado.
- Pinch zoom: implementação manual com Pointer Events (sem libs novas).
- Sem novas dependências npm além de talvez `nanoid` — usar `crypto.randomUUID()` que já existe.
- SSR safe: tudo client-side, mas evitar `window` em escopo de módulo.
