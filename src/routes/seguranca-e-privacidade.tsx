import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Lock, Database, Mail, FileText, Cookie, UserCheck, AlertTriangle } from "lucide-react";
import { SITE_URL } from "@/lib/site";

const PAGE_TITLE = "Segurança e privacidade — Vybrum";
const PAGE_DESC =
  "Como o Vybrum protege seus dados, quais informações coletamos, com quais serviços compartilhamos e como você pode exercer seus direitos.";

export const Route = createFileRoute("/seguranca-e-privacidade")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESC },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESC },
      { property: "og:url", content: `${SITE_URL}/seguranca-e-privacidade` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/seguranca-e-privacidade` }],
  }),
  component: TrustPage,
});

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5">
      <div className="mb-3 flex items-center gap-2 text-white">
        <Icon className="h-5 w-5" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-white/75">{children}</div>
    </section>
  );
}

function TrustPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
      <header className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#111] px-3 py-1 text-xs text-white/70">
          <Shield className="h-3.5 w-3.5" />
          Página mantida pela equipe Vybrum
        </div>
        <h1 className="text-2xl font-bold text-white">Segurança e privacidade</h1>
        <p className="mt-2 text-sm text-white/70">
          Esta página descreve as práticas atuais do Vybrum sobre dados pessoais, autenticação,
          armazenamento e cobrança. Ela é editável pela equipe do app e não constitui certificação
          independente.
        </p>
      </header>

      <div className="space-y-4">
        <Section icon={UserCheck} title="Autenticação e contas">
          <p>
            O acesso à sua conta usa e-mail e senha gerenciados por Supabase Auth. Sessões usam tokens
            de curta duração com renovação automática. Você pode encerrar a sessão a qualquer momento em
            "Editar perfil" e excluir a conta na mesma página.
          </p>
        </Section>

        <Section icon={Database} title="Quais dados coletamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Conta: nome, e-mail e avatar escolhido.</li>
            <li>Conteúdo do app: kits, escudos enviados, modelos desbloqueados.</li>
            <li>Créditos e compras: histórico de pacotes adquiridos e saldo atual.</li>
            <li>Logs de segurança e auditoria administrativa para detectar abusos.</li>
          </ul>
          <p>Não coletamos dados sensíveis (saúde, biometria, localização precisa) nem usamos seu conteúdo para treinar modelos de IA.</p>
        </Section>

        <Section icon={Lock} title="Como protegemos seus dados">
          <ul className="list-disc space-y-1 pl-5">
            <li>Tráfego protegido por HTTPS/TLS de ponta a ponta.</li>
            <li>Banco de dados com Row Level Security: cada usuário só consegue ler e modificar os próprios dados.</li>
            <li>Operações administrativas exigem papel de admin verificado no servidor.</li>
            <li>Arquivos de escudo armazenados em bucket privado, acessíveis apenas pelo dono.</li>
            <li>Senhas nunca são armazenadas em texto puro — o hashing fica a cargo do Supabase Auth.</li>
          </ul>
        </Section>

        <Section icon={FileText} title="Compartilhamento com terceiros (subprocessadores)">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Supabase</strong> — banco de dados, autenticação e armazenamento de arquivos.</li>
            <li><strong>Cloudflare</strong> — hospedagem das páginas e funções de servidor.</li>
            <li><strong>Google Play Billing</strong> — processamento de pagamentos no app Android (quando aplicável).</li>
          </ul>
          <p>Não vendemos dados pessoais. Compartilhamos com terceiros apenas o necessário para operar o serviço.</p>
        </Section>

        <Section icon={Cookie} title="Cookies e armazenamento local">
          <p>
            Usamos armazenamento local do navegador apenas para manter você conectado e preservar
            preferências do editor (cor, escudo, fonte). Não usamos cookies de publicidade nem trackers
            de terceiros.
          </p>
        </Section>

        <Section icon={AlertTriangle} title="Retenção e exclusão">
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir a conta em "Editar perfil",
            removemos seu perfil, kits e escudos. Registros financeiros e de auditoria podem ser
            mantidos pelo prazo exigido por lei.
          </p>
        </Section>

        <Section icon={Mail} title="Seus direitos e como entrar em contato">
          <p>
            Você pode solicitar acesso, correção, portabilidade ou exclusão de seus dados, ou reportar
            uma vulnerabilidade de segurança, escrevendo para{" "}
            <a className="text-white underline" href="mailto:contato@vybrum.com">contato@vybrum.com</a>.
          </p>
        </Section>

        <p className="pt-2 text-center text-xs text-white/40">
          Última atualização: 22/06/2026 ·{" "}
          <Link to="/" className="underline">Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}