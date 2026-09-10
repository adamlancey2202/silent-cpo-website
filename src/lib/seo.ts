import { siteConfig } from "./site";

export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/logo.jpg`,
    image: `${siteConfig.url}/images/logo.jpg`,
    slogan: siteConfig.tagline,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: siteConfig.contact.phone,
      email: siteConfig.contact.email,
      contactType: "sales",
      availableLanguage: "English",
    },
    areaServed: {
      "@type": "Country",
      name: "United Kingdom",
    },
    knowsAbout: siteConfig.services,
    priceRange: "$$$$",
  };
}

export function getWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en-GB",
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
    },
  };
}
