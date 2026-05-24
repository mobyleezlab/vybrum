import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/site";

const PRIVACY_DESCRIPTION =
  "Política de Privacidade do Onzee Lab, aplicativo para criar e personalizar uniformes esportivos.";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Onzee Lab" },
      { name: "description", content: PRIVACY_DESCRIPTION },
      { property: "og:title", content: "Política de Privacidade — Onzee Lab" },
      { property: "og:description", content: PRIVACY_DESCRIPTION },
      { property: "og:url", content: `${SITE_URL}/privacidade` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/privacidade` }],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground">
      <article className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-3 border-b border-border pb-6">
          <a href="/" className="text-sm font-bold text-primary">Onzee Lab</a>
          <h1 className="text-3xl font-extrabold tracking-tight">Política de Privacidade</h1>
          <p className="text-muted-foreground">
            Esta política descreve como o Onzee Lab coleta, usa e protege as informações dos usuários.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">1. Sobre o Onzee Lab</h2>
          <p className="text-muted-foreground">
            O Onzee Lab é um aplicativo de criação, simulação e personalização de uniformes esportivos.
            O app permite escolher modelos, editar cores, nomes, números, escudos e exportar designs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">2. Informações coletadas</h2>
          <p className="text-muted-foreground">
            Podemos coletar dados de conta, como nome, e-mail e identificador de autenticação, além de
            informações necessárias para salvar kits, créditos, preferências e arquivos enviados pelo usuário.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">3. Uso das informações</h2>
          <p className="text-muted-foreground">
            Usamos os dados para autenticação, funcionamento do editor, armazenamento dos kits, entrega de
            recursos comprados ou desbloqueados, suporte, segurança e melhoria da experiência no app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">4. Compartilhamento e segurança</h2>
          <p className="text-muted-foreground">
            Não vendemos dados pessoais. Podemos usar provedores essenciais para autenticação, hospedagem,
            banco de dados, pagamentos e operação do serviço. Aplicamos medidas técnicas para proteger as informações.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">5. Direitos do usuário</h2>
          <p className="text-muted-foreground">
            Você pode solicitar acesso, correção ou exclusão de dados pessoais, conforme aplicável. Para solicitações,
            entre em contato informando o app Onzee Lab.
          </p>
        </section>

        <footer className="border-t border-border pt-6 text-sm text-muted-foreground">
          <p>© 2026 Mobyleez Lab — Onzee Lab. Todos os direitos reservados.</p>
          <p className="mt-2"><a href="/termos" className="underline">Termos de Uso</a></p>
        </footer>
      </article>
    </main>
  );
}