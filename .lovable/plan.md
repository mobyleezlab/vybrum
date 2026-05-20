
# Plano de Implementação — Kit Designer x Supabase

Escopo grande. Vou dividir em fases entregáveis e validáveis, na ordem sugerida pelo usuário. Cada fase é um marco utilizável; não vou mesclar tudo em um único PR gigante.

## Fase 1 — Autenticação (base de tudo)
- Criar `src/lib/auth-context.tsx` com `AuthProvider` (Supabase `onAuthStateChange` + `getSession`).
- Plugar provider em `__root.tsx`.
- Rotas novas: `/login`, `/cadastro`, `/esqueci-senha`, `/reset-password`.
- Login email/senha + botão Google (via `supabase.auth.signInWithOAuth`). *Obs: Google requer configurar provider no dashboard Supabase — vou avisar.*
- App segue acessível como visitante.
- Header: avatar/iniciais quando logado, botão "Entrar" quando não.
- Hook `useRequireAuth()` para gates (salvar/exportar/desbloquear).

## Fase 2 — Templates dinâmicos
- `useModels()` lê de `models_with_status` (view já existe).
- Componente `ModelSelector` (scroll horizontal, badges por categoria, cadeado, expiração).
- `KitSvg` passa a receber `svgFrenteUrl`/`svgCostasUrl`; fetch + parse + cache via `useQuery`.
- Manter compat: se URL ausente, usa SVG local atual (fallback).
- Mapear IDs reais da view (`zona-corpo`, `zona-manga-esq` etc.) — vou inspecionar 1 modelo do banco para confirmar antes de codar.

## Fase 3 — Créditos
- Hook `useCreditBalance()` (realtime via channel).
- Header mostra saldo quando logado.
- Rota `/creditos`: lista `credit_packages`, destaca "Melhor custo-benefício", botão mock "Em breve".

## Fase 4 — Gating de features
- Helper `canUseFeature(feature, featuresLevel)`.
- Cadeado nas abas SVG/PDF/Fontes Premium/Patrocinador/Goleiro/Time.
- Componente `UnlockSheet` (bottom sheet) reaproveitável.

## Fase 5 — Salvar kits
- Substituir `kit-storage.ts` (localStorage) por server fns: `saveKit`, `listKits`, `deleteKit`, `loadKit`.
- Rota `/meus-kits` (grid).
- Fluxo: clicar Salvar sem login → abre `/login` com redirect.

## Fase 6 — Packs
- Seção dentro de `/creditos` listando `packs` + `pack_items`.

## Fase 7 — Admin
- Constraint `plan` aceitar `admin` (migration).
- Rota `/admin` protegida (checa `profile.plan === 'admin'`).
- Abas Templates/Packs/Créditos com CRUD básico + upload para Storage.
- **Requer bucket Storage** (`models`) com policies — incluído na migration.

---

## Detalhes técnicos

- **Server fns**: kits e admin via `createServerFn` + `requireSupabaseAuth`. Leituras públicas (models, packages, packs) via cliente browser (RLS já permite a authenticated; visitante anônimo vê via server fn com `supabaseAdmin` somente leitura de colunas seguras).
- **Visitante explora templates**: como RLS atual exige `authenticated`, vou criar um server fn público `listModelsPublic` usando `supabaseAdmin` para o modo visitante; quando logado, usa cliente do browser.
- **Realtime créditos**: subscribe em `credit_balances` filtrado por `user_id`.
- **Google OAuth**: configurar no painel Supabase (vou instruir o usuário; o código já chama corretamente).
- **PWA já feito**, não mexo.

## Pergunta antes de começar

Confirmação: posso começar pela **Fase 1 (Auth)** agora? As fases 2–7 entram em mensagens seguintes para manter cada entrega testável. Sem isso, viraria um único drop gigante difícil de revisar/corrigir.

Se preferir tudo de uma vez assumindo riscos de regressão, me diga "vai tudo" e eu emendo as fases.
