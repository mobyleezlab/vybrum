## Objetivo

Tornar o app instalável no smartphone (Adicionar à tela inicial no iOS e Android), abrindo em tela cheia sem barra do navegador — comportamento de app nativo.

## Abordagem

**Manifest-only, sem service worker.** Para instalar e abrir em tela cheia, basta um Web App Manifest + meta tags. Service workers (vite-plugin-pwa) só fazem sentido se você quiser uso offline, e na Lovable eles causam cache obsoleto no preview e travam atualizações. Como você não pediu offline, vou pelo caminho seguro.

Limitação importante: a instalação só aparece quando o app está aberto na URL publicada (`.lovable.app` ou domínio próprio), não dentro do preview do editor. iOS exige adicionar manualmente pelo Safari → Compartilhar → "Adicionar à Tela de Início".

## Passos

1. **Ícones do app** — gerar dois PNGs em `public/`:
   - `icon-192.png` (192×192) — ícone padrão
   - `icon-512.png` (512×512) — splash/tela inicial Android
   - `apple-touch-icon.png` (180×180) — iOS home screen
   Usar o tema atual do app (fundo escuro + camisa/escudo) para a arte.

2. **`public/manifest.webmanifest`** — novo arquivo com:
   - `name`, `short_name`, `description` em português
   - `start_url: "/"`, `scope: "/"`, `id: "/"`
   - `display: "standalone"` (tela cheia, sem barra)
   - `orientation: "portrait"`
   - `background_color` e `theme_color` baseados nos tokens do `styles.css`
   - `icons` apontando para os 3 PNGs com `purpose: "any maskable"`

3. **`src/routes/__root.tsx`** — adicionar ao `head().links/meta`:
   - `<link rel="manifest" href="/manifest.webmanifest">`
   - `<meta name="theme-color" content="...">`
   - `<meta name="apple-mobile-web-app-capable" content="yes">`
   - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
   - `<meta name="apple-mobile-web-app-title" content="...">`
   - `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
   - Ajustar viewport para incluir `viewport-fit=cover` (suporte ao notch)

4. **CSS — safe-area no iPhone (notch/Dynamic Island)** — em `src/styles.css`:
   - Padding utilitário usando `env(safe-area-inset-*)` para topo/baixo, já que `display: standalone` esconde a barra do Safari.

5. **Sem service worker, sem `vite-plugin-pwa`** — nada de cache que quebre o preview ou trave atualizações.

## Notas para o usuário

- A instalação só funciona no app **publicado** (botão Publish). No preview do editor não aparece.
- Android/Chrome: aparece o prompt "Instalar app" automaticamente após visitar.
- iOS/Safari: o usuário precisa abrir o menu Compartilhar e tocar em "Adicionar à Tela de Início".
- Se mais tarde quiser **modo offline**, é outro passo (service worker com cuidados especiais) — me avisa.
