## Problema

O modal "Salvar alterações?" abre mesmo sem o usuário ter editado nada. Causa: o tracking de `isDirty` em `src/routes/editor.tsx` marca qualquer mudança de `state` como suja, e existem `set()` automáticos no carregamento que disparam após o "skip" inicial:

1. **Auto-aplicação do escudo global** (linhas 157–165): se o usuário tem um escudo cadastrado e o estado tem `escudo.touched === false`, o effect chama `set(...)`. Em um kit salvo sem escudo personalizado, isso roda *depois* da hidratação e marca dirty.
2. **Ordem de effects na abertura de kit salvo**: o `skipDirtyRef` só absorve a primeira mudança após hidratação; qualquer `set()` subsequente automático (ex.: shield) vira "dirty".
3. **Kit novo (sem `?kit=`)**: o auto-escudo aplica na primeira renderização e já marca dirty antes de qualquer ação do usuário.

## Solução

Substituir o esquema `skipDirtyRef` + `useEffect([state])` por uma **baseline serializada** comparada com o estado atual. Só marca dirty quando o `state` realmente diverge da última baseline registrada — qualquer aplicação automática feita pelo próprio editor é capturada como nova baseline.

### Mudanças em `src/routes/editor.tsx`

1. **Remover** `skipDirtyRef`, `isDirty` (state) e o `useEffect([state])` que seta dirty.
2. **Adicionar** `baselineRef = useRef<string>(JSON.stringify(INITIAL_STATE))` e derivar:
   ```ts
   const isDirty = useMemo(
     () => JSON.stringify(state) !== baselineRef.current,
     [state],
   );
   ```
3. **Helper** `const markPristine = () => { baselineRef.current = JSON.stringify(state); };` — definido com `useEvent`-like via `useRef` para sempre usar o `state` mais recente, ou via `useEffect` que reage à flag `pendingPristineRef`.

   Implementação simples: ao invés de helper que captura `state` por closure, usar um `pendingPristineRef = useRef(false)` e um `useEffect([state])` que, se `pendingPristineRef.current === true`, escreve `baselineRef.current = JSON.stringify(state)` e zera o flag. Quem precisa "limpar" só seta `pendingPristineRef.current = true` antes/depois de aplicar o `set()` automático.

4. **Pontos onde marcar pristine** (setar `pendingPristineRef.current = true`):
   - Logo após `set(() => next, true)` na hidratação do `loadedKit` (linha 137).
   - Dentro do effect de auto-escudo (linha 157) antes do `set(...)`.
   - Após `saveKit.mutateAsync` bem-sucedido (no `handleSave`).
5. **Botão Salvar**: continua usando `disabled={isLocked || saveKit.isPending || !isDirty}` — agora isDirty reflete só mudanças reais do usuário.
6. **`useBlocker`**: continua com `shouldBlockFn: () => isDirty && !saveKit.isPending` — o modal de "sair sem salvar" só aparece quando há diferença real.

### Validação

- Abrir kit salvo → nenhuma alteração → voltar: **sem modal**.
- Abrir kit salvo com escudo global aplicado automaticamente → voltar: **sem modal**.
- Abrir kit novo, sem mexer em nada → voltar: **sem modal**.
- Mudar uma cor → voltar: **modal aparece**.
- Salvar e voltar a editar sem mexer: **sem modal**; mexer de novo: **modal aparece**.

Sem mudanças em `src/lib/kits.ts` ou outros arquivos.