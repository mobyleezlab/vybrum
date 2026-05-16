# Plano de ajustes do editor de uniformes

## 1. Remover botão "Resetar" do canvas
**Arquivo:** `src/components/kit/KitCanvas.tsx` e `src/routes/index.tsx`
- Remover o `<button>` com `RotateCcw` (canto inferior esquerdo) e a prop `onReset`.
- Remover `handleReset` em `index.tsx`. (O botão `Maximize2` continua resetando zoom/pan).

## 2. Remover seleção visual da parte clicada no uniforme
**Arquivo:** `src/components/kit/KitSvg.tsx`
- Remover a função `ringFor` e o `filter: drop-shadow(...)` aplicado quando `selectedPart` está ativa. Os grupos continuam clicáveis (para trocar cor), mas sem highlight azul.

## 3, 4, 5 e 10. Reposicionar número, nome e escudo conforme o SVG enviado
**Arquivos:** `src/lib/kit-state.ts`, `src/components/kit/KitSvg.tsx`

Coordenadas extraídas dos SVGs anexados (viewBox 0 0 1080 1080):

| Elemento | Vista | x (text-anchor middle) | y (baseline) | font-size |
|---|---|---|---|---|
| Número peito | front | 440 | 281 | 70 |
| Escudo peito | front | 632 (centro ~655) | centro ~258 | ~75 |
| Número calção | front | 710 | 973 | 60 |
| Escudo calção | front | 360 (centro ~380) | centro ~950 | ~70 |
| Nome jogador | back | 540 | 280 | 70 |
| Número grande | back | 540 | 535 | 250 |

Ações:
- Atualizar `INITIAL_STATE.playerNumberFront`, `badgeChest.x/y`, `badgeShorts.x/y`, `playerName`, `playerNumberBack` para esses valores.
- Em `KitSvg.tsx`, ajustar os `<text>` para usar essas coordenadas absolutas (sem cálculos do tipo `280 + offsetY` que estavam desalinhados). Manter `offsetY` apenas como fine-tuning relativo (somado/subtraído ao y base).
- Remover `text-anchor="middle"` do número do calção (no SVG é `text-anchor="start"` em x=691.9).

## 6 e 7. Botões Nome e Número não devem mudar a vista automaticamente
**Arquivo:** `src/routes/index.tsx`
- Remover `view: "back"` e `view: "front"` dos handlers `onChange` em `renderPanel` para os casos `name`, `number`, `badgeChest`.
- Usuário usa o botão de flip (canto superior direito do canvas) manualmente.

## 8. Unificar botões de escudo
**Arquivos:** `src/routes/index.tsx`, `src/lib/kit-state.ts`, `src/components/kit/panels/BadgePanel.tsx`
- Remover a aba `badgeShorts` da lista `TABS` e do tipo `TabId`.
- Remover `badgeShorts` do `KitState` e `INITIAL_STATE`.
- Remover renderização do escudo no calção em `KitSvg.tsx`.
- A aba "Escudo" passa a editar apenas `badgeChest` (peito).

## 9. Remover estampas pré-definidas
**Arquivos:** `src/routes/index.tsx`, `src/lib/kit-state.ts`, `src/components/kit/KitSvg.tsx`, deletar `src/components/kit/panels/PatternPanel.tsx`
- Remover as abas `pattern` e `shortsPattern` da lista `TABS` e do tipo `TabId`.
- Remover `pattern`, `shortsPattern`, `partColors.pattern`, `partColors.shortsPattern` do estado.
- Remover toda a lógica de `patternDef`, `<defs>` de pattern, `<clipPath>` e os `<rect fill="url(#pat-...)">` em `KitSvg.tsx`. Camisa e calção ficam apenas com cor sólida.
- Deletar `PatternPanel.tsx` e seu import em `index.tsx`.

Quando o usuário enviar arquivos SVG personalizados de estampa, faremos uma feature de upload separada que substitui a malha do corpo/calção pelo SVG enviado.

## Detalhes técnicos

- Os SVGs enviados usam `viewBox="0 0 1080 1080"` (igual ao atual), então as coordenadas mapeiam 1:1 sem conversão.
- O `viewBox` atual do `KitSvg` é `180 0 720 1080` (cropped). Mantemos esse crop — as coordenadas absolutas (ex.: x=440) continuam válidas pois estão dentro da janela visível 180-900.
- Nenhuma mudança em `kit-export.ts`, `kit-history.ts`, `KitTabs.tsx` ou `KitCanvas.tsx` (exceto remoção do botão reset).
- Estado de zoom inicial permanece 1.0.

## Arquivos alterados
- `src/lib/kit-state.ts` (tipo + estado inicial enxutos)
- `src/components/kit/KitSvg.tsx` (sem highlight, sem patterns, posições corretas, sem escudo do calção)
- `src/components/kit/KitCanvas.tsx` (sem botão reset, sem prop onReset)
- `src/routes/index.tsx` (TABS reduzidas, sem auto-flip, sem handleReset, sem import PatternPanel)
- `src/components/kit/panels/PatternPanel.tsx` (deletado)
