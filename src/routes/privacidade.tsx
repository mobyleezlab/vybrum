import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Onzee Lab" },
      { name: "description", content: "Política de Privacidade da Onzee Lab." },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <iframe
      src="/legal/privacidade.html"
      title="Política de Privacidade"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 }}
    />
  );
}