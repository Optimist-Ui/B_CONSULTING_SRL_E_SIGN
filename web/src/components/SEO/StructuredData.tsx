// Organization Schema (Google Business)
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "i-Sign",
  "alternateName": ["i-sign.eu", "I-Sign Electronic Signature"],
  "url": "https://i-sign.eu",
  "logo": "https://i-sign.eu/logo.png",
  "description": "Electronic signature platform for Belgium and EU with eIDAS qualified e-signature solutions",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "BE",
    "addressLocality": "Belgium",
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+32-XXX-XXXX", // ⚠️ Replace with real number
    "contactType": "Customer Support",
    "availableLanguage": ["en", "fr", "nl"],
    "email": "support@i-sign.eu", // ⚠️ Replace with real email
  },
  "sameAs": [
    // ⚠️ Add your real social media links
    "https://www.linkedin.com/company/i-sign",
    "https://twitter.com/isign",
    "https://www.facebook.com/isign",
  ],
};

// Software Application Schema
export const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "i-Sign Electronic Signature Platform",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "0",
    "highPrice": "99", // ⚠️ Update with actual pricing
    "priceCurrency": "EUR",
    "offerCount": "3",
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8", // ⚠️ Update with real ratings
    "ratingCount": "150",
    "bestRating": "5",
    "worstRating": "1",
  },
  "featureList": [
    "eIDAS qualified electronic signatures",
    "Salesforce integration",
    "API integration",
    "Multi-language support (EN, FR, NL)",
    "Digital document signing",
    "Online contract management",
  ],
};

// Service Schema (for SEO)
export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Electronic Signature Solution",
  "provider": {
    "@type": "Organization",
    "name": "i-Sign",
    "url": "https://i-sign.eu",
  },
  "areaServed": {
    "@type": "Country",
    "name": ["Belgium", "European Union"],
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Electronic Signature Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "eIDAS Qualified E-Signature",
          "description": "Legally binding electronic signatures compliant with EU eIDAS regulation",
        },
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Salesforce E-Signature Integration",
          "description": "Seamless integration with Salesforce CRM for automated document signing",
        },
      },
    ],
  },
};

// FAQ Schema (if you have FAQ section on landing page)
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is eIDAS qualified electronic signature?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "An eIDAS qualified electronic signature is the highest level of electronic signature under EU regulation (eIDAS). It has the same legal status as a handwritten signature across all EU member states.",
      },
    },
    {
      "@type": "Question",
      "name": "Is i-Sign compliant with Belgian e-signature laws?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, i-Sign is fully compliant with Belgian and EU electronic signature laws, including eIDAS regulation for qualified electronic signatures.",
      },
    },
    {
      "@type": "Question",
      "name": "Can I integrate i-Sign with Salesforce?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, i-Sign offers seamless integration with Salesforce CRM, allowing you to automate document signing workflows directly from Salesforce.",
      },
    },
    // Add more FAQs as needed
  ],
};

// Breadcrumb Schema (for navigation)
export const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://i-sign.eu",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Features",
      "item": "https://i-sign.eu#features",
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Pricing",
      "item": "https://i-sign.eu#pricing",
    },
  ],
};