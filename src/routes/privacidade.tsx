import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade · Vybrum" },
      { name: "description", content: "Política de Privacidade do Vybrum." },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="min-h-dvh bg-black pt-safe">
      <div className="mx-auto max-w-[720px] px-5 pb-16 pt-3">
        <header className="flex h-12 items-center">
          <BackButton
            fallback="/"
            className="press flex h-10 items-center gap-1 rounded-full pl-1 pr-3 text-sm font-semibold text-white hover:bg-[#1a1a1a]"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </BackButton>
          <h1 className="ml-2 text-base font-semibold text-white">Política de Privacidade</h1>
        </header>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Política de Privacidade</h2>
        <p className="mt-2 text-xs text-[#888]">
          Versão 1.0 — Vigente a partir de [DATA DE LANÇAMENTO]<br />
          Mobyleez Lab — CNPJ: [INSERIR CNPJ]<br />
          Contato: privacidade@vybrum.com
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#cfcfcf]">
          <section>
            <h3 className="mb-2 text-base font-bold text-white">1. Quem somos</h3>
            <p>O Vybrum é um simulador de uniformes esportivos desenvolvido e operado pela Mobyleez Lab. Este documento explica como coletamos, usamos, armazenamos e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">2. Quais dados coletamos</h3>
            <p><strong className="text-white">Dados fornecidos por você:</strong> nome completo ou apelido, endereço de e-mail, senha (armazenada de forma criptografada), avatar escolhido, escudo personalizado enviado por você.</p>
            <p className="mt-2"><strong className="text-white">Dados gerados pelo uso:</strong> kits criados e salvos, modelos desbloqueados, saldo e histórico de créditos, compras realizadas, data e hora de cadastro e último acesso.</p>
            <p className="mt-2"><strong className="text-white">Dados técnicos:</strong> endereço IP, informações do dispositivo e navegador, logs de segurança.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">3. Para que usamos seus dados</h3>
            <p>Criar e gerenciar sua conta (execução de contrato). Processar compras de créditos (execução de contrato). Enviar e-mails transacionais (execução de contrato). Garantir a segurança da plataforma (legítimo interesse). Melhorar o app com base no uso (legítimo interesse). Cumprir obrigações legais (cumprimento de obrigação legal).</p>
            <p className="mt-2">Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins publicitários.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">4. Com quem compartilhamos seus dados</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Supabase (EUA) — banco de dados e autenticação — supabase.com/privacy</li>
              <li>Cloudflare (EUA) — hospedagem e proteção — cloudflare.com/privacypolicy</li>
              <li>Resend (EUA) — envio de e-mails — resend.com/privacy</li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">5. Por quanto tempo guardamos seus dados</h3>
            <p>Conta ativa: enquanto a conta existir. Histórico de créditos e compras: 5 anos (obrigação fiscal). Logs de segurança: 90 dias. Dados após exclusão: excluídos imediatamente, exceto o que a lei exige manter.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">6. Seus direitos (Art. 18 da LGPD)</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Acessar seus dados: Perfil → Configurações → Exportar meus dados.</li>
              <li>Corrigir dados: Perfil → Editar perfil.</li>
              <li>Excluir conta e dados: Perfil → Configurações → Excluir conta.</li>
              <li>Exportar dados (JSON): Perfil → Configurações → Exportar meus dados.</li>
              <li>Revogar consentimento a qualquer momento.</li>
              <li>Solicitar informações: privacidade@vybrum.com</li>
            </ul>
            <p className="mt-2">Respondemos em até 15 dias úteis.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">7. Segurança dos dados</h3>
            <p>Criptografia em trânsito (HTTPS/TLS 1.3), controle de acesso por usuário (Row Level Security), autenticação com confirmação de e-mail, monitoramento de segurança, backups regulares, acesso administrativo restrito e auditado.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">8. Cookies e armazenamento local</h3>
            <p>Utilizamos localStorage apenas para manter sua sessão ativa. Não utilizamos cookies de rastreamento ou publicidade.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">9. Menores de idade</h3>
            <p>O Vybrum não é destinado a menores de 13 anos. Entre 13 e 18 anos, é necessária autorização de responsável legal.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">10. Alterações nesta política</h3>
            <p>Notificaremos por e-mail ou aviso no app com pelo menos 7 dias de antecedência.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">11. Contato</h3>
            <p>E-mail: privacidade@vybrum.com<br />ANPD: gov.br/anpd</p>
          </section>
        </div>
      </div>
    </div>
  );
}