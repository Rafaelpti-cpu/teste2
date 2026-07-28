/**
 * Privacy policy — route `/privacy-policy`.
 *
 * Exists because the cookie banner and the preferences modal both link to it;
 * without it, the one legal link on the site was a 404.
 *
 * The path stays English to match the link the cookie component already ships
 * with. The content describes what this site actually does — cookie categories,
 * WhatsApp, Google Maps — and deliberately does not invent practices the shop
 * has not agreed to. **Have it reviewed before launch** (LGPD).
 */
import Link from "next/link";

import { readSiteContent } from "@/lib/content";

import { WhatsAppFab } from "@/components/ui/whatsapp-fab";

import { SiteFooter } from "@/views/home/sections/site-footer";
import { SiteHeader } from "@/views/home/sections/site-header";

const SECTIONS = [
  {
    title: "Quem somos",
    body: [
      "A Renova Closet é uma loja física de roupas em Santa Helena, no Paraná. Este site é a nossa vitrine: ele mostra as peças disponíveis e leva a conversa para o WhatsApp.",
      "Não vendemos pelo site, não pedimos cadastro e não guardamos dados de pagamento.",
    ],
  },
  {
    title: "Que dados coletamos",
    body: [
      "Navegar pelo site não exige nenhum dado seu. Não há login, formulário de cadastro nem carrinho.",
      "Quando você toca em “falar no WhatsApp”, é aberta uma conversa no aplicativo com uma mensagem pronta sobre a peça. A partir daí valem as regras do WhatsApp, e nós passamos a ver o que você nos escrever — como em qualquer conversa com a loja.",
    ],
  },
  {
    title: "Contagem de acessos",
    body: [
      "Registramos quais páginas e quais peças foram abertas, e quando alguém toca no botão do WhatsApp. Usamos isso só para saber o que está fazendo falta na loja.",
      "Não guardamos nada que identifique você: sem nome, sem e-mail, sem endereço de IP, sem localização e sem informação do aparelho. Também não usamos cookie para isso.",
      "Para não contar a mesma visita várias vezes, o site guarda um número sorteado na memória temporária da aba. Ele não diz nada sobre você e o próprio navegador o apaga quando a aba é fechada — se você voltar amanhã, será uma visita nova e sem ligação com a de hoje.",
    ],
  },
  {
    title: "Cookies",
    body: [
      "Cookies necessários mantêm o site funcionando e guardam a sua própria escolha sobre cookies. Eles não podem ser desligados.",
      "Cookies de análise e de marketing só são usados se você aceitar. Você escolhe categoria por categoria no aviso que aparece na primeira visita, e pode mudar de ideia depois pelo mesmo aviso.",
    ],
  },
  {
    title: "Serviços de terceiros",
    body: [
      "O mapa e as avaliações levam para o Google, e os botões de conversa levam para o WhatsApp e para o Instagram. Ao seguir esses links você passa a ser regido pelas políticas dessas empresas, não por esta.",
    ],
  },
  {
    title: "Seus direitos",
    body: [
      "Você pode pedir a qualquer momento para saber quais dados seus temos, corrigi-los ou apagá-los. É só falar com a gente pelo WhatsApp ou pelo telefone da loja.",
    ],
  },
];

export const PrivacyView = async () => {
  const { nav, store } = await readSiteContent();

  return (
    <>
      <SiteHeader nav={nav} whatsappHref={store.whatsappHref} />

      <main id="main" className="container-page py-12 md:py-20">
        <div className="flex max-w-[68ch] flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-4xl font-light text-foreground">
              Política de privacidade
            </h1>
            <p className="text-sm text-foreground-muted">
              Em resumo: este site não pede seus dados. A conversa acontece no
              WhatsApp, e os cookies não essenciais só rodam se você deixar.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-light text-foreground">
                {section.title}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="text-base text-foreground-muted"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-light text-foreground">
              Falar com a gente
            </h2>
            <address className="flex flex-col gap-1 text-base text-foreground-muted not-italic">
              <span>
                {store.street} — {store.city}, {store.state}, {store.postalCode}
              </span>
              <a
                href={store.phoneHref}
                className="underline underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
              >
                {store.phoneLabel}
              </a>
            </address>
          </section>

          <Link
            href="/"
            className="text-sm text-foreground-muted underline underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground"
          >
            Voltar para o site
          </Link>
        </div>
      </main>

      <SiteFooter nav={nav} store={store} />

      <WhatsAppFab href={store.whatsappHref} />
    </>
  );
};
