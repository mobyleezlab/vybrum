
# Admin completo — plano

Transformar `/admin` em um painel com navegação por abas (sidebar no desktop, tabs roláveis no mobile), mantendo o tema atual (preto + verde `#68ed00`).

## Estrutura de rotas

```text
src/routes/admin.tsx                 → layout com sidebar/tabs + <Outlet/>
src/routes/admin.index.tsx           → redirect p/ /admin/modelos
src/routes/admin.modelos.tsx         → (atual conteúdo de admin.tsx)
src/routes/admin.usuarios.tsx
src/routes/admin.faturamento.tsx
src/routes/admin.analytics.tsx
src/routes/admin.creditos.tsx
src/routes/admin.drops.tsx
src/routes/admin.moderacao.tsx
src/routes/admin.config.tsx
```

Toda a área `/admin/*` continua client-only (`ssr:false`) e protegida via `adminCheck` no layout. O gate atual de login + `isAdmin` é movido pro layout, então cada aba já assume admin autenticado.

## Abas

### 1. Modelos (já existe)
Mantém o CRUD atual de uniformes (thumbnail, SVGs, categoria, raridade, custo, drop, etc).

### 2. Usuários
Listar usuários do app com busca por email/nome e filtros (plano, admin, criados nos últimos N dias).
Por linha: avatar, email, nome, plano, créditos atuais, total comprado, escudos criados, kits salvos, data de criação, último acesso.
Ações: promover/rebaixar admin, ajustar plano (`free/pro/premium/admin`), adicionar/remover créditos manualmente (registra em `credit_ledger` com motivo), banir/desativar (flag `is_disabled` no profile), exportar CSV.

### 3. Faturamento
KPIs do topo: receita bruta (mês atual e acumulado), receita líquida estimada, nº de compras, ticket médio, MRR aproximado, taxa de conversão free→pago.
Gráficos: receita por dia (últimos 30/90 dias), receita por pacote, receita por plano.
Tabela de transações (`credit_purchases`) com filtros por status, período, usuário; permite reembolso manual (marca status e estorna créditos em `credit_ledger`).
Projeções: estimativa de receita do mês baseada na média diária + comparativo mês anterior.

### 4. Analytics
- **Modelos mais usados**: ranking por nº de kits criados, desbloqueios, visualizações.
- **Categorias preferidas**: distribuição (free/pro/premium/elite/rare).
- **Esportes**: distribuição.
- **Conversão por modelo**: views → unlocks → kits salvos.
- **Funil global**: cadastros → primeiro escudo → primeiro kit → primeira compra.
- **Retenção**: D1/D7/D30 dos novos usuários.
- **Mapa de uso de cores/elementos** nos escudos (top 10 paletas, símbolos).
- Filtro de período global (7/30/90 dias, custom).

### 5. Créditos & Pacotes
CRUD de `credit_packages` (nome, créditos, preço, bônus, ativo, ordem, destaque).
CRUD de `packs` e `pack_items` (drops/coleções de uniformes vendidos juntos).
Edição rápida de custo de desbloqueio em lote por categoria.

### 6. Drops & Campanhas
Agendar drops temporários: selecionar modelos, definir `drop_name`, `available_until`, banner/thumb da campanha, ordem de destaque na home.
Pré-visualização de como aparece na home antes de publicar.

### 7. Moderação
Fila de escudos de usuário (`user_shields`) reportados ou com conteúdo suspeito; aprovar/remover; histórico em `security_logs`.
Listar `security_logs` e `rate_limits` recentes com filtros.

### 8. Configurações
Toggles globais: app em manutenção, registro aberto/fechado, valor padrão de créditos no signup, taxa de conversão BRL→créditos, links de suporte, textos legais.
Gerenciar lista de super-admins (apenas o super admin `mobyleezlab@gmail.com` pode editar).

## Sugestões extras pertinentes ao nicho (uniformes/escudos esportivos)

- **Biblioteca de assets**: gerenciar paletas de cores, símbolos e padrões disponíveis no editor; subir novos pacotes de elementos.
- **Templates em destaque/Editor's pick**: marcar escudos da comunidade para virarem inspiração na home.
- **Notificações push/in-app**: enviar broadcast quando novo drop sair, lembrete de créditos, promoções.
- **Cupons & códigos promocionais**: gerar códigos de crédito grátis ou desconto em pacotes (com limite de usos, validade).
- **Programa de indicação**: visualizar quem indicou quem, créditos distribuídos por indicação.
- **Exportações**: gerar relatórios CSV/PDF de receita, usuários, top modelos para enviar a parceiros/clubes.
- **Auditoria**: log de ações administrativas (quem alterou plano, créditos, removeu modelo) — tabela `admin_audit_log`.
- **Feature flags**: ligar/desligar features experimentais por usuário ou plano.
- **Sazonalidade**: temas/skins do app por época (libertadores, copa, natal) com agendamento.

## Backend (server functions novas)

Tudo em `src/lib/admin.functions.ts` (já com guard `assertAdmin`):

- `adminListUsers({ search, plan, page })` / `adminUpdateUser` / `adminAdjustCredits` / `adminSetDisabled`
- `adminListPurchases({ from, to, status })` / `adminRefundPurchase`
- `adminBillingSummary({ from, to })` → KPIs e séries diárias
- `adminAnalyticsOverview({ from, to })` → rankings, funil, retenção
- `adminListPackages` / `adminUpsertPackage` / `adminDeletePackage`
- `adminListPacks` / `adminUpsertPack` (com itens) / `adminDeletePack`
- `adminListShieldsForModeration` / `adminModerateShield`
- `adminListSecurityLogs({ from, to, type })`
- `adminGetSettings` / `adminUpdateSettings`
- `adminListAuditLog`

## Migrations necessárias

- `profiles`: adicionar `is_disabled boolean default false`, `last_seen_at timestamptz`.
- Nova tabela `app_settings` (key/value singleton) com RLS só admin.
- Nova tabela `admin_audit_log` (id, actor_id, action, target_type, target_id, payload jsonb, created_at) com RLS leitura admin.
- Opcional (para campanhas/cupons/notificações): tabelas `promo_codes`, `promo_redemptions`, `notifications`, `referrals` — criadas quando construirmos cada aba, não tudo de uma vez.
- Cada tabela nova segue o padrão obrigatório: `GRANT` para `authenticated` + `service_role` + `ENABLE RLS` + policies via `is_admin(auth.uid())`.

## Detalhes técnicos

- Layout `admin.tsx` faz o `adminCheck` uma única vez e expõe via context para os filhos (evita refetch por aba).
- Cada aba usa `useSuspenseQuery` + `ensureQueryData` no loader p/ carregar dados.
- Gráficos: usar `recharts` (já leve, combina com o stack). Adicionar via `bun add recharts` quando implementarmos faturamento/analytics.
- Paginação server-side em todas as listas (default 50/página).
- Toda mutação sensível (mudar plano, refund, ajustar créditos, deletar modelo) registra em `admin_audit_log`.
- Exportar CSV no client a partir do JSON retornado, sem dependência extra.

## Ordem sugerida de implementação (entregas incrementais)

1. **Refatorar layout em abas** + mover Modelos para `admin.modelos.tsx`.
2. **Usuários** (lista, busca, mudar plano/créditos, banir) + `admin_audit_log`.
3. **Faturamento** (KPIs, gráfico diário, tabela de purchases, refund).
4. **Analytics** (rankings + funil + retenção).
5. **Créditos & Pacotes** + **Drops**.
6. **Moderação**, **Configurações**, extras (cupons, notificações, indicações) sob demanda.

Confirma essa estrutura e a ordem 1→6? Posso começar pelo passo 1 (refatorar layout + abas vazias com placeholders) e o passo 2 (Usuários) na mesma rodada, se preferir avançar mais rápido.
