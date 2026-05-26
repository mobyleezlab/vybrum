import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, FolderOpen, User } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Início", icon: Home },
  { to: "/explorar", label: "Explorar", icon: Compass },
  { to: "/kits", label: "Kits", icon: FolderOpen },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hidden = pathname.startsWith("/editor") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/esqueci-senha") ||
    pathname.startsWith("/reset-password");
  if (hidden) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1a1a1a] bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80 pb-safe"
      aria-label="Navegação principal"
    >
      <ul className="mx-auto flex max-w-[520px] items-stretch justify-around px-2 pt-2">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active =
            to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className="press flex h-14 flex-col items-center justify-center gap-1"
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className="h-6 w-6"
                  style={{ color: active ? "#cffc0b" : "#444" }}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ color: active ? "#cffc0b" : "#666" }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
