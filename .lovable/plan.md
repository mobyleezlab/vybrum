## 1. Estampas (listras vermelhas do SVG) como peças coloríveis

No SVG enviado os retângulos em vermelho são **listras de estampa**:

- **Camisa frente** — 3 listras verticais no corpo: centro `x=518.6 y=201.1 w=42.9 h=461.1`, esquerda `x=426.9 y=323.7 w=42.9 h=338.6`, direita `x=610.2 y=323.7 w=42.9 h=338.6`.
- **Camisa costas** — mesmas 3 listras verticais.
- **Calção** — 2 listras laterais rotacionadas: direita `x=693.2 y=710.6 w=42.9 h=163.1 rotate(-12.1)`, esquerda `x=283.6 y=770.6 w=163.1 h=42.9 rotate(-77.9)`.

Os retângulos rotacionados das mangas que estão hoje em `partColors.details` continuam existindo — são detalhes da manga, não estampa.

**Mudanças:**
- `src/lib/kit-state.ts`: adicionar 3 novos `PartId`: `estampaFrente`, `estampaCostas`, `estampaCalcao`. Cor padrão `#E52222` (vermelho). Adicionar 3 novas `TabId` correspondentes com labels "Estampa Frente", "Estampa Costas", "Estampa Calção" e mapeamento em `TAB_TO_PART`.
- `src/components/kit/KitSvg.tsx`: renderizar as listras com os paths/rects acima, usando `fill={partColors.estampa*}`. Frente mostra `estampaFrente` + `estampaCalcao`; costas mostra `estampaCostas` + `estampaCalcao`.
- `src/routes/index.tsx`: adicionar 3 botões ao array `TABS` (ícone simples de listras).

## 2. Escudo no calção (lado direito)

- `kit-state.ts`: adicionar de volta `badgeShorts: BadgeLayer` em `KitState` e `INITIAL_STATE` com `x=360, y=950, size=70, src=null`.
- `KitSvg.tsx` (view front): renderizar `<image>` para `state.badgeShorts` quando `src` definido.
- `routes/index.tsx`: adicionar aba `badgeShorts` com label "Escudo Calção" OU reutilizar o painel do escudo com um seletor interno. **Proposta:** manter UMA aba "Escudo" (como o usuário pediu antes) e adicionar dentro do `BadgePanel` um toggle "Peito / Calção" para escolher qual editar. Assim o usuário não recria 2 abas.

## 3. Painel sai da "moldura"

Em `src/routes/index.tsx` o container do painel tem `max-h-[40vh] overflow-y-auto`, que cria a sensação de frame interno apertado ao abrir Nome/Número/Escudo. Remover `max-h-[40vh] overflow-y-auto pr-1` e deixar o painel fluir naturalmente abaixo das tabs (o body já rola).

## 4. Clicar no uniforme NÃO deve trocar cor

Em `routes/index.tsx`, `handlePartClick` hoje faz `partColors: { ...s.partColors, [part]: s.selectedColor }`. Remover essa atribuição — manter apenas `selectedPart: part` (ou remover a função por completo e passar `onPartClick={undefined}` ao `KitCanvas`, deixando os `<g onClick>` no SVG sem efeito visual). Vou remover a prop `onPartClick` do `KitCanvas` e os handlers de clique nos `<g>` do `KitSvg`, deixando o SVG puramente visual. Cores são alteradas apenas pelas abas + paleta.

## 5. Escudo sem X/Y

Em `src/components/kit/panels/BadgePanel.tsx`, remover o bloco com os sliders "Posição X" e "Posição Y". Mantém apenas: presets, upload, remover, e slider de tamanho. Posições ficam fixas no `INITIAL_STATE` (peito: 655/258, calção: 360/950).

## Arquivos alterados

- `src/lib/kit-state.ts` — novos PartId/TabId/cores padrão, `badgeShorts` de volta
- `src/components/kit/KitSvg.tsx` — render das listras, escudo do calção, sem onClick nas partes
- `src/components/kit/KitCanvas.tsx` — remover prop `onPartClick` da assinatura/uso
- `src/components/kit/panels/BadgePanel.tsx` — remover sliders X/Y; adicionar toggle Peito/Calção
- `src/routes/index.tsx` — 3 novas tabs de estampa, remover `handlePartClick` (ou neutralizar), remover `max-h-[40vh] overflow-y-auto` do painel, passar ambos `badgeChest` e `badgeShorts` ao `BadgePanel`
