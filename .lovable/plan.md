## Ajustes na aba Perfil + design system

### 1. Corrigir "Editar perfil" travado em carregamento
**Causa:** `editar-perfil.tsx` renderiza skeleton enquanto `!ready || !profile`. Se o usuário não tem linha em `profiles` (ou ela ainda não foi criada), `useProfile` retorna `null` e a tela fica travada para sempre.

**Correção:**
- Em `src/routes/editar-perfil.tsx`, mudar a guarda para depender apenas de `ready` (auth pronta) + estado de loading da query (`isLoading`). Tratar `profile === null` como "perfil novo" e usar fallbacks (nome de `user.user_metadata.full_name` / e-mail).
- Em `src/lib/profile.ts`, no `useUpdateProfile` fazer `upsert` em vez de `update`, garantindo criação da linha caso ainda não exista (preservar `id = user.id`). Também expor `isLoading`/`error` corretamente.
- Garantir `enabled` da query usa `ready` real (já está com `!loading && !!user`, ok). Adicionar `retry: 1` para não loopar em erro.

### 2. Configurações — remover o que pertence ao perfil
Em `src/routes/configuracoes.tsx`:
- Remover botão "Sair da conta" (item 1).
- Remover seção **Conta** inteira (Editar nome, Alterar avatar, E-mail) — item 3. Esses fluxos já existem em "Editar perfil".
- Manter apenas preferências do app (item 4): Notificações, Reduzir animações, Tema (placeholder), e itens informativos (versão do app, termos, política de privacidade — como links externos placeholder). Sem ações de conta.

### 3. Remover degradês do design system
Substituir `bg-gradient-to-br from-[#68ed00] via-[#a8d109] to-[#0f0f0f]` e similares por superfície sólida (`bg-[#68ed00]` ou `bg-[#0f0f0f]` conforme contexto) em:
- `src/routes/index.tsx` (card de destaque, placeholder de imagem)
- `src/routes/creditos.tsx` (card de saldo, placeholder de imagem)
- `src/routes/meus-creditos.tsx` (card de saldo)
- `src/components/UnlockSheet.tsx` (ícone diamante)

Manter os gradientes **funcionais** (color picker, grid do canvas, máscara de scroll de abas) — não são decorativos.

### 4. Mais cara de app nativo + padronização de espaçamentos
Aplicar nas telas do perfil (`perfil`, `editar-perfil`, `configuracoes`, `meus-creditos`, `comprar-creditos`, `historico`):
- Header sticky padrão: altura 56px, mesmo padding horizontal (`px-4`), título centralizado em caixa-alta tracking-widest.
- Cards/linhas de ação com altura uniforme `h-14`, raio `rounded-2xl`, padding `px-4`, gap `gap-3`, ícone `h-5 w-5` em `text-[#68ed00]`, chevron `›` à direita.
- Spacing vertical entre seções: `mt-5` entre grupos, `mb-2` no título de seção (já é o padrão, garantir consistência).
- Botão primário: `h-12 rounded-2xl bg-[#68ed00] text-black font-bold`.
- Botão destrutivo (sair, na tela de Perfil): manter como link discreto no fim da página.
- `press` class para feedback tátil em todos elementos interativos (já existe, garantir aplicação).

### 5. Arquivos a tocar
- `src/routes/editar-perfil.tsx` — fix de loading, fallback de perfil
- `src/lib/profile.ts` — `useUpdateProfile` com upsert
- `src/routes/configuracoes.tsx` — remover conta + logout, manter só preferências
- `src/routes/perfil.tsx` — manter logout aqui (único lugar), padronizar espaçamentos
- `src/routes/index.tsx`, `src/routes/creditos.tsx`, `src/routes/meus-creditos.tsx`, `src/components/UnlockSheet.tsx` — remover gradientes decorativos

### Fora de escopo
- Mudanças em RLS, migrations ou backend (perfil já existe via trigger ou será criado via upsert).
- Upload de avatar (já decidido antes: apenas avatares pré-definidos).
- Implementação real de persistência das preferências de Configurações (mantém UI local com TODO).
