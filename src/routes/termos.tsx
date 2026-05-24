import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/site";

const TERMS_DESCRIPTION =
  "Termos de Uso do Onzee Lab, aplicativo para criar e personalizar uniformes esportivos.";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Onzee Lab" },
      { name: "description", content: TERMS_DESCRIPTION },
      { property: "og:title", content: "Termos de Uso — Onzee Lab" },
      { property: "og:description", content: TERMS_DESCRIPTION },
      { property: "og:url", content: `${SITE_URL}/termos` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/termos` }],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground">
      <article className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-3 border-b border-border pb-6">
          <a href="/" className="text-sm font-bold text-primary">Onzee Lab</a>
          <h1 className="text-3xl font-extrabold tracking-tight">Termos de Uso</h1>
          <p className="text-muted-foreground">
            Ao usar o Onzee Lab, você concorda com estes termos. Leia com atenção antes de utilizar o app.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">1. Finalidade do app</h2>
          <p className="text-muted-foreground">
            O Onzee Lab é um aplicativo de simulação, criação e personalização de uniformes esportivos,
            desenvolvido e operado pela Mobyleez Lab.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">2. Conta e acesso</h2>
          <p className="text-muted-foreground">
            Para acessar recursos como salvar kits, créditos, modelos premium e exportações, pode ser necessário criar
            uma conta ou fazer login com um provedor de autenticação.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">3. Créditos e recursos premium</h2>
          <p className="text-muted-foreground">
            O Onzee Lab pode oferecer créditos virtuais, modelos pagos, packs e funcionalidades desbloqueadas. As regras
            de uso, disponibilidade e valores podem variar conforme a oferta exibida no app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">4. Conteúdo do usuário</h2>
          <p className="text-muted-foreground">
            Você é responsável pelos nomes, números, escudos, imagens e designs que inserir ou criar. É proibido usar
            o app para conteúdo ilegal, ofensivo ou que viole direitos de terceiros.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-bold">5. Privacidade</h2>
          <p className="text-muted-foreground">
            O tratamento de dados pessoais é descrito na nossa <a href="/privacidade" className="underline">Política de Privacidade</a>.
          </p>
        </section>

        <footer className="border-t border-border pt-6 text-sm text-muted-foreground">
          <p>© 2026 Mobyleez Lab — Onzee Lab. Todos os direitos reservados.</p>
          <p className="mt-2"><a href="/privacidade" className="underline">Política de Privacidade</a></p>
        </footer>
      </article>
    </main>
  );
}