import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { SITE_URL } from "@/lib/site";
import { TabBar } from "@/components/TabBar";

const APP_DESCRIPTION =
  "Vybrum é o app para criar, personalizar e exportar uniformes esportivos direto do celular.";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-extrabold tracking-tight text-white">404</h1>
        <h2 className="mt-4 text-lg font-semibold text-white">Página não encontrada</h2>
        <p className="mt-2 text-sm text-[#888]">A tela que você procura não existe ou foi movida.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="press inline-flex h-12 items-center justify-center rounded-2xl bg-[#68ed00] px-6 text-sm font-bold text-black"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold text-white">Algo deu errado</h1>
        <p className="mt-2 text-sm text-[#888]">Tente novamente ou volte para o início.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="press h-12 rounded-2xl bg-[#68ed00] px-5 text-sm font-bold text-black"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="press h-12 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] px-5 text-sm font-semibold text-white inline-flex items-center"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" },
      { title: "Vybrum" },
      { name: "application-name", content: "Vybrum" },
      { name: "description", content: APP_DESCRIPTION },
      { name: "author", content: "Vybrum" },
      { name: "theme-color", content: "#000000" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Vybrum" },
      { property: "og:title", content: "Vybrum" },
      { property: "og:description", content: APP_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:site_name", content: "Vybrum" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Vybrum" },
      { name: "description", content: "Vybrum is a real-time visual sports uniform configurator." },
      { property: "og:description", content: "Vybrum is a real-time visual sports uniform configurator." },
      { name: "twitter:description", content: "Vybrum is a real-time visual sports uniform configurator." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f00d030d-935d-4924-8b42-1e72f4cfaa5c/id-preview-843164ad--2ed1b39b-63fd-4128-8f9f-7eb22fd0233e.lovable.app-1780490324037.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f00d030d-935d-4924-8b42-1e72f4cfaa5c/id-preview-843164ad--2ed1b39b-63fd-4128-8f9f-7eb22fd0233e.lovable.app-1780490324037.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Bebas+Neue&family=Anton&family=Teko:wght@400;600;700&family=Oswald:wght@400;600;700&family=Russo+One&family=Rajdhani:wght@500;600;700&family=Orbitron:wght@500;700&display=swap",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-black text-white">
          <Outlet />
        </div>
        <TabBar />
      </AuthProvider>
    </QueryClientProvider>
  );
}
