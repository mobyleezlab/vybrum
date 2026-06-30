## Escopo

Conectar checkout Google Play Billing aos pacotes, separar bônus do valor comprado no registro, e garantir saldo só atualiza após a transação concluída.

## 1. Migration de schema (`supabase/migrations/20260630120000_purchase_state_machine.sql`)

- Adicionar colunas em `credit_purchases`:
  - `base_credits int not null default 0` (snapshot do `credit_packages.credits` na hora da compra)
  - `bonus_credits int not null default 0` (snapshot do bônus)
  - `failure_reason text`
  - `updated_at timestamptz default now()`
- Manter `status text` com `CHECK (status in ('pending','completed','failed','refunded'))`.
- Manter `credits_granted` (total = base + bonus) para compatibilidade com queries existentes.
- Índice `(user_id, status)` para listar pendentes.

### RPCs
- `start_purchase(p_package_id uuid, p_google_purchase_token text)` SECURITY DEFINER, chamado pelo usuário autenticado:
  - Lê pacote ativo, faz snapshot de `credits`/`bonus_credits`/`price_brl`.
  - Insere `credit_purchases` com `status='pending'`. NÃO mexe em `credit_balances`.
  - Retorna `purchase_id`.
- `complete_purchase(p_purchase_id uuid, p_google_order_id text)` SECURITY DEFINER, executado **só pelo service_role** (webhook):
  - Trava com `FOR UPDATE`; se já estiver `completed`, é idempotente.
  - Atualiza `status='completed'`, `completed_at=now()`, grava `google_order_id`.
  - Credita `credit_balances.balance += base + bonus`, atualiza `total_earned`.
  - Insere `credit_ledger` (`type='purchase'`, `amount=total`, `ref_id=purchase_id`).
- `fail_purchase(p_purchase_id uuid, p_reason text)` SECURITY DEFINER, service_role:
  - Marca `status='failed'`, salva razão. Não altera saldo.
- REVOKE EXECUTE de complete/fail para `authenticated` e `anon`.

## 2. Server functions

### `src/lib/purchase.functions.ts`
- `startPurchase` (`requireSupabaseAuth`): valida package_id, chama `start_purchase`.
- `listMyPendingPurchases` (auth): lista compras `pending` do usuário.

### Server route `src/routes/api/public/google-play-webhook.ts`
- POST handler para Realtime Developer Notifications.
- Verifica header `Authorization: Bearer <GOOGLE_PLAY_WEBHOOK_SECRET>` (secret a adicionar).
- Decodifica `message.data` base64 → JSON; extrai `purchaseToken`, `orderId`.
- Busca `credit_purchases` por `google_purchase_token` e chama `complete_purchase` ou `fail_purchase` via `supabaseAdmin`.

## 3. Frontend unificado

### `src/lib/credits.ts` (única fonte de verdade)
- Manter `useCreditBalance`, `useCreditPackages`. 
- Adicionar `usePendingPurchases` (lista de pendentes).
- Adicionar helper `splitCredits(pkg) → { base, bonus, total }` exportado.

### `/creditos` (`src/routes/creditos.tsx`)
- Botão "Comprar" agora chama `useStartPurchase` (mutation) → cria pendente e exibe toast "Compra pendente. Aguardando confirmação do Google Play."
- Card de saldo: badge "X compra(s) pendente(s)" se houver, sem somar ao saldo.
- Manter exibição base + `+bônus` separados (já está).

### `/admin/creditos`
- Já mostra créditos e bônus separados (✓).
- Adicionar coluna "Total" exibida como `base + bônus` para clareza, mesma fórmula.

### `/admin/faturamento`
- Já agrega por `status='completed'`. Garantir que pending/failed não entram em receita (✓ já filtrado).

## 4. Secret
- Adicionar `GOOGLE_PLAY_WEBHOOK_SECRET` via `secrets--add_secret`.

## Arquivos a criar
- `supabase/migrations/20260630120000_purchase_state_machine.sql`
- `src/lib/purchase.functions.ts`
- `src/lib/purchase.ts` (hooks de UI)
- `src/routes/api/public/google-play-webhook.ts`

## Arquivos a alterar
- `src/routes/creditos.tsx` — botão Comprar → mutation, badge pendente
- `src/lib/credits.ts` — exportar `splitCredits` + `usePendingPurchases`
- `src/routes/admin.creditos.tsx` — coluna Total (visualização)

## Observações
- Compras criadas ficam visíveis em `/admin/faturamento` na contagem `pending` e não somam receita.
- Como ainda não há SDK Play no app web/PWA, o fluxo real só fechará quando o app Android nativo enviar o `purchaseToken` para `startPurchase` e o webhook for configurado no Play Console. Por enquanto o botão na web cria a compra pendente que pode ser concluída via webhook de teste.