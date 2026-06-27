import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { BackButton } from "@/components/BackButton";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso · Vybrum" },
      { name: "description", content: "Termos de Uso do Vybrum." },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
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
          <h1 className="ml-2 text-base font-semibold text-white">Termos de Uso</h1>
        </header>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Termos de Uso</h2>
        <p className="mt-2 text-xs text-[#888]">
          Versão 1.0 — Vigente a partir de [DATA DE LANÇAMENTO]<br />
          Mobyleez Lab — CNPJ: [INSERIR CNPJ]
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#cfcfcf]">
          <section>
            <h3 className="mb-2 text-base font-bold text-white">1. Aceitação dos termos</h3>
            <p>Ao criar uma conta no Vybrum, você declara que leu, entendeu e concorda com estes Termos de Uso. Se não concordar, não utilize o app.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">2. O que é o Vybrum</h3>
            <p>O Vybrum é um simulador de uniformes esportivos que permite criar, personalizar e exportar designs de uniformes, operando com sistema de créditos para acesso a modelos e recursos premium.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">3. Cadastro e conta</h3>
            <p>Idade mínima: 13 anos. Informações verdadeiras obrigatórias. Você é responsável pela segurança da sua senha. Cada pessoa pode ter apenas uma conta. Não são permitidas contas falsas ou automatizadas.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">4. Sistema de créditos</h3>
            <p>Créditos são a moeda virtual do Vybrum, adquiridos por compras dentro do app. Créditos não têm valor monetário e não podem ser transferidos, revendidos ou trocados por dinheiro. Créditos não expiram enquanto a conta estiver ativa. Em caso de exclusão de conta, créditos são perdidos sem reembolso. Compras são definitivas, salvo casos previstos pela legislação de defesa do consumidor.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">5. Modelos e conteúdo</h3>
            <p>Modelos free são acessíveis a todos. Modelos pro, premium, elite e rare requerem desbloqueio por créditos — acesso permanente após desbloqueio. Exportação HD/SVG/PDF de modelos free requer 5 créditos por modelo (desbloqueio permanente). Modelos pagos já incluem exportação premium.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">6. Conteúdo do usuário</h3>
            <p>Ao enviar escudos, você declara possuir os direitos sobre a imagem. É proibido enviar: imagens que violem direitos autorais, conteúdo ofensivo ou ilegal, logotipos de clubes profissionais sem autorização.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">7. Uso permitido</h3>
            <p>Criar designs para uso pessoal, compartilhar designs criados no app, usar designs exportados para fins pessoais e não comerciais.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">8. Uso proibido</h3>
            <p>Burlar o sistema de créditos ou desbloqueios. Usar engenharia reversa, scraping ou automação. Revender designs como produto comercial. Criar conteúdo que infrinja marcas ou direitos autorais. Compartilhar credenciais de acesso.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">9. Suspensão e encerramento</h3>
            <p>A Mobyleez Lab pode suspender ou encerrar contas por: violação dos Termos, atividade fraudulenta, uso abusivo, inatividade superior a 24 meses. Em caso de encerramento por violação, créditos não serão reembolsados.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">10. Disponibilidade do serviço</h3>
            <p>O app pode sofrer interrupções para manutenção. Não garantimos disponibilidade ininterrupta. Descontinuação com aviso prévio de 30 dias.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">11. Limitação de responsabilidade</h3>
            <p>A Mobyleez Lab não se responsabiliza por perdas de dados por falhas técnicas externas, uso indevido por terceiros, ou danos indiretos decorrentes do uso do app.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">12. Propriedade intelectual</h3>
            <p>Modelos, código, design e marca Vybrum são propriedade da Mobyleez Lab. Designs criados pelo usuário pertencem a ele para uso pessoal. Não transferimos direitos sobre os modelos base.</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">13. Lei aplicável e foro</h3>
            <p>Regido pelas leis brasileiras. Foro: [INSERIR CIDADE/ESTADO].</p>
          </section>

          <section>
            <h3 className="mb-2 text-base font-bold text-white">14. Contato</h3>
            <p>contato@vybrum.com | suporte@vybrum.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}