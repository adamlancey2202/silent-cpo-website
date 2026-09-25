import { siteConfig } from "./site";
import { faqs } from "./faqs";
import { projects } from "./projects";

export function getHomeJsonLd() {
  const url = siteConfig.url;
  const organization = `${url}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organization,
        name: siteConfig.name,
        description: siteConfig.description,
        url,
        logo: `${url}/images/logo.jpg`,
        slogan: siteConfig.tagline,
        email: siteConfig.contact.email,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: siteConfig.contact.phone,
          email: siteConfig.contact.email,
          contactType: "sales",
          availableLanguage: "English",
        },
        knowsAbout: siteConfig.services,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Digital product services",
          itemListElement: siteConfig.services.map((name) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name, provider: { "@id": organization } },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        name: siteConfig.name,
        url,
        description: siteConfig.description,
        inLanguage: "en-GB",
        publisher: { "@id": organization },
      },
      {
        "@type": "WebPage",
        "@id": `${url}/#webpage`,
        url,
        name: siteConfig.seoTitle,
        description: siteConfig.description,
        inLanguage: "en-GB",
        isPartOf: { "@id": `${url}/#website` },
        about: { "@id": organization },
        hasPart: [{ "@id": `${url}/#faq` }, { "@id": `${url}/#work` }],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}/#faq`,
        mainEntity: faqs.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${url}/#work`,
        name: "Selected work",
        itemListElement: projects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            name: project.name,
            description: project.description,
            image: `${url}/images/work/${project.image}.webp`,
            ...(project.url ? { url: project.url } : {}),
          },
        })),
      },
    ],
  };
}
