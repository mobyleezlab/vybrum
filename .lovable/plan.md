
# Kit Designer — Plano do MVP

Simulador de uniforme esportivo mobile-first. SVG editável em tempo real, paleta de cores por peça, frente/costas, salvar e exportar PNG. Sem backend nesta fase (Lovable Cloud está desabilitado) — persistência local via `localStorage`. Estrutura preparada para evoluir para Supabase + premium + IA depois.

## Escopo do MVP (Fase 1)

Incluso:
- 1 modelo (#BR041) com vista frente e costas
- Edição de cores por peça: corpo, manga esquerda, manga direita, gola, shorts
- 6 abas de seleção de peça/categoria (camisa lisa, camisa listrada, shorts longo, shorts curto, texto, escudo premium)
- Paleta de 13 cores fixas + cor personalizada (color picker nativo)
- Reset, zoom, troca frente/costas
- Salvar design (modal com nome) → `localStorage`
- Exportar PNG do uniforme
- Animação suave na troca de cor

Fora de escopo (fases futuras): patterns, logos, IA, mockup 3D, marketplace, auth, multi-modelo.

## Estrutura de arquivos

```
src/
  routes/
    index.tsx                 # Tela única do designer
  components/
    kit/
      KitHeader.tsx           # Voltar / título / salvar / download
      UniformCanvas.tsx       # Wrapper do SVG + zoom + flip + reset
      UniformFrente.tsx       # SVG inline com IDs editáveis
      UniformCostas.tsx       # SVG inline com IDs editáveis
      PartTabs.tsx            # 6 abas scroll horizontal
      ColorPalette.tsx        # Grid 7col + eyedropper
      SaveDialog.tsx          # Modal "Modelo salvo!"
  lib/
    kit-state.ts              # Tipos + defaults + helpers
    kit-export.ts             # html-to-image → PNG
    kit-storage.ts            # save/load localStorage
```

## Modelo de estado

```ts
type PartId = 'body' | 'sleeveLeft' | 'sleeveRight' | 'collar' | 'shorts';
type TabId = 'jersey' | 'jerseyStriped' | 'shortsLong' | 'shortsShort' | 'text' | 'badge';

interface KitState {
  view: 'front' | 'back';
  activeTab: TabId;
  selectedColor: string;
  partColors: Record<PartId, string>;
}
```

Mapeamento aba → peças que recebem a próxima cor:
- jersey / jerseyStriped → body (+ pattern futuro)
- shortsLong / shortsShort → shorts
- text / badge → reservados para fase 2 (sem efeito agora, mas UI ativa)

Para edição direta de manga/gola, clicar na própria peça do SVG seleciona-a (UX inteligente mencionada no brief). Aba é o caminho rápido; clique no SVG é o caminho preciso.

## SVG

Reusar os SVGs anexos (`hub_sports_layout_uniforme_frente.svg` e `_costa.svg`) inline em componentes React. Atribuir `id` e `data-part` a cada `<path>` do grupo correspondente:
- `#shorts path` → `data-part="shorts"`
- `#mangas path` → split em sleeveLeft/sleeveRight (o SVG atual é uma única path; faremos clip por reflexão CSS ou cor única `sleeves` no MVP — decisão: tratar mangas como uma única peça `sleeves` para simplificar; "esquerda/direita separadas" entra em fase 2)
- `#camisa path` → `data-part="body"`
- `#gola path` → `data-part="collar"`

Ajuste do tipo: `PartId = 'body' | 'sleeves' | 'collar' | 'shorts'`. Cores aplicadas via `fill={partColors[part]}` com `transition: fill 200ms`.

## Paleta de cores

Constantes exatas conforme brief:
```
['#F5E52A','#F5A623','#F07D1A','#E85D00','#E52222','#D61FA0','#8B00E8',
 '#3B22E8','#2196F3','#00BFA5','#1ACC2A','#8BC34A','#111111']
```
+ botão eyedropper que abre `<input type="color">` nativo.

Cor selecionada tem ring externo (`ring-2 ring-blue-500 ring-offset-2`).

## Layout

- `max-w-[420px] mx-auto` fundo branco
- Stack vertical: Header (56px) → Canvas (h-80, bg `#ECECEC`, rounded-xl) → PartTabs (scroll-x, py-3) → ColorPalette (grid-cols-7 gap-3)
- Lucide icons: `ChevronLeft`, `Save`, `Download`, `RotateCcw`, `ZoomIn`, `Shirt`, `ShirtIcon` (listrada via custom), `Type`, `Shield`, `Pipette`

## Export & Save

- **PNG**: `html-to-image` (`bun add html-to-image`) — leve, sem deps nativas, funciona no Worker. Captura o `<div>` do canvas e dispara download.
- **Save**: serializa `KitState` em `localStorage` chave `kit-designer:designs:<uuid>`. Modal com input de nome.

## Design tokens

Atualizar `src/styles.css`:
- `--background: oklch(1 0 0)` (já é branco)
- `--muted: oklch(0.96 0 0)` (canvas bg `#ECECEC`)
- `--accent: oklch(0.62 0.19 259)` (ring azul `#2196F3`)
- Tipografia: Inter (já default Tailwind) com tracking-widest no título do header

## Detalhes técnicos

- Tudo client-side; rota única `/` em `src/routes/index.tsx` substitui o placeholder
- Sem TanStack loaders (estado é puramente local, `useState`)
- Tabs com `overflow-x-auto scrollbar-none` (utility custom no styles.css)
- Botão "premium" (escudo) abre toast "Disponível em breve"
- Flip frente/costas: botão discreto sobre o canvas (canto superior direito do preview) com `RefreshCw` rotacionando

## Critério de pronto

- Trocar cor da paleta atualiza o SVG instantaneamente com transição
- Aba ativa tem borda destacada
- Reset restaura cores padrão (body `#1A3DB5`, sleeves/shorts `#00E5C8`, collar branco)
- Download gera PNG fiel ao preview
- Salvar persiste e mostra confirmação
- Funciona bem em viewport 375px (iPhone)
