import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/admin/config")({
  ssr: false,
  component: Page,
});

function Page() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <Wrench className="mx-auto h-10 w-10 text-[#444]" />
        <p className="mt-3 text-sm text-[#888]">Em construção — esta seção será habilitada nas próximas etapas.</p>
      </div>
    </div>
  );
}
