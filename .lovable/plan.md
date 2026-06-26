## Objetivo
No editor, ao salvar um kit já existente (aberto via `?kit=<id>`), o clique no botão **Salvar** deve persistir direto, sem abrir o modal de nome. Além disso, o botão fica desativado quando não há alterações pendentes e volta a ativar assim que o usuário muda qualquer coisa.

## Mudanças (apenas `src/routes/editor.tsx`)

1. **Rastrear estado "sujo" (dirty)**
   - Adicionar `const [isDirty, setIsDirty] = useState(false)`.
   - Em um `useEffect` com dependência em `state`, marcar `setIsDirty(true)` — exceto logo após hidratar de um kit salvo ou logo após um save bem-sucedido.
   - Usar um `ref` (`baselineRef`) para guardar a "linha de base" (o `state` no momento da última hidratação/salvamento) e ignorar a primeira mudança correspondente à hidratação. Implementação simples: depois de hidratar, fazer `setIsDirty(false)` num microtask; idem após `handleSave` sucesso.
   - Para um kit novo (sem `currentKitId`), considerar dirty assim que o usuário alterar qualquer coisa em relação ao `INITIAL_STATE`.

2. **Comportamento do botão Salvar (header)**
   - Atual: `onClick={() => { if (requireAuth()) setSaveOpen(true); }}`.
   - Novo:
     - Se `currentKitId` existir → chamar `handleSave()` direto (sem abrir modal).
     - Se não existir (kit novo) → manter abertura do modal `setSaveOpen(true)` para capturar o nome na primeira vez.
   - `disabled` passa a ser `isLocked || saveKit.isPending || !isDirty`.
   - Ajustar classes para refletir o estado desativado (já existe `disabled:opacity-50` em uso; manter consistência visual).

3. **Reset do dirty**
   - Em `handleSave`, ao sucesso: `setIsDirty(false)` e atualizar `baselineRef` para o `state` atual.
   - Na hidratação do `loadedKit`: `setIsDirty(false)` após `set(next)`.

4. **Sem mudanças** em `src/lib/kits.ts`, modal de nome, ou outras telas. Modal continua existindo só para criação inicial.

## Detalhe técnico
Para evitar marcar dirty durante a hidratação inicial (que dispara `set(next)` e em seguida o `useEffect` de `state`), usar um `hydratingRef` que `handleHydrate` seta para `true` e um `queueMicrotask` reseta para `false` depois do `setIsDirty(false)`. O mesmo padrão se aplica ao pós-save.

## Validação
- Abrir um kit salvo → botão Salvar começa desativado.
- Alterar qualquer cor/texto → botão ativa.
- Clicar Salvar → persiste sem modal, mostra toast, volta a desativar.
- Criar kit novo do zero → primeira alteração ativa o botão; clicar abre o modal de nome (fluxo atual).