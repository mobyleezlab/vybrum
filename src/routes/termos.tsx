import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Onzee Lab" },
      { name: "description", content: "Termos de Uso da Onzee Lab." },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <iframe
      src="/legal/termos.html"
      title="Termos de Uso"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 }}
    />
  );
}