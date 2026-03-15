/**
 * SEO Component — per-page meta tags, Open Graph, Twitter cards, and JSON-LD.
 * Uses react-helmet-async (already a project dependency).
 *
 * AEO  — FAQ/Q&A JSON-LD schema support
 * AIO  — canonical + structured data for AI Overview extraction
 * SEO  — complete meta + OG + canonical
 * GEO  — BreadcrumbList + authoritative entity markup
 */
import { Helmet } from "react-helmet-async";

const SITE_NAME = "India Angel Forum";
const SITE_URL = "https://indiaangelforum.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const TWITTER_HANDLE = "@indiaangelforum";

interface FAQItem {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  /** Page title — appended with " — India Angel Forum" unless noSuffix is true */
  title: string;
  /** 120–160 character page description */
  description: string;
  /** Canonical path e.g. "/investors" — defaults to current page */
  canonical?: string;
  /** OG image override — defaults to site-wide image */
  image?: string;
  /** Page type — "website" | "article" | "profile" */
  type?: string;
  /** Comma-separated keywords */
  keywords?: string;
  /** Set true to suppress "— India Angel Forum" suffix */
  noSuffix?: boolean;
  /** Prevent indexing (private/auth pages) */
  noIndex?: boolean;
  /** JSON-LD FAQ items for AEO */
  faq?: FAQItem[];
  /** Breadcrumb trail for GEO / rich results */
  breadcrumbs?: BreadcrumbItem[];
  /** Extra raw JSON-LD string (stringified object) */
  extraSchema?: string;
}

export function SEO({
  title,
  description,
  canonical,
  image = DEFAULT_IMAGE,
  type = "website",
  keywords,
  noSuffix = false,
  noIndex = false,
  faq,
  breadcrumbs,
  extraSchema,
}: SEOProps) {
  const fullTitle = noSuffix ? title : `${title} — ${SITE_NAME}`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

  const faqSchema =
    faq && faq.length > 0
      ? JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map(({ question, answer }) => ({
            "@type": "Question",
            name: question,
            acceptedAnswer: { "@type": "Answer", text: answer },
          })),
        })
      : null;

  const breadcrumbSchema =
    breadcrumbs && breadcrumbs.length > 0
      ? JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
          })),
        })
      : null;

  return (
    <Helmet>
      {/* Core */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large"} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* FAQ JSON-LD (AEO) */}
      {faqSchema && (
        <script type="application/ld+json">{faqSchema}</script>
      )}

      {/* BreadcrumbList JSON-LD (GEO) */}
      {breadcrumbSchema && (
        <script type="application/ld+json">{breadcrumbSchema}</script>
      )}

      {/* Extra schema */}
      {extraSchema && (
        <script type="application/ld+json">{extraSchema}</script>
      )}
    </Helmet>
  );
}

export default SEO;
