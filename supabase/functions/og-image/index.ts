import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "image/svg+xml",
  "Cache-Control": "public, max-age=31536000, immutable",
};

// Generate SVG-based OG image that can be converted to PNG
function generateOGImage(params: {
  page: string;
  title?: string;
  subtitle?: string;
}): string {
  const { page, title, subtitle } = params;

  // Default content based on page type
  const pageContent: Record<string, { title: string; subtitle: string; badge?: string }> = {
    home: {
      title: "India Angel Forum",
      subtitle: "India's Largest Angel Network",
      badge: "400+ Angels • ₹160Cr+ Deployed • 40+ Companies",
    },
    investors: {
      title: "Join 400+ Angels",
      subtitle: "Invest in India's Most Promising Startups",
      badge: "27% Average IRR • Curated Deal Flow",
    },
    founders: {
      title: "Raise from India's Best",
      subtitle: "Access 400+ Accredited Angel Investors",
      badge: "₹50L - ₹5Cr Rounds • Structured Process",
    },
    events: {
      title: "Investment Events",
      subtitle: "Demo Days • Summits • Networking",
      badge: "Exclusive Access for Members",
    },
    portfolio: {
      title: "Our Portfolio",
      subtitle: "40+ Companies Building the Future",
      badge: "AI • SaaS • FinTech • HealthTech",
    },
    contact: {
      title: "Get in Touch",
      subtitle: "Connect with India Angel Forum",
      badge: "Founders • Investors • Partners",
    },
    terms: {
      title: "Terms of Service",
      subtitle: "India Angel Forum",
    },
    privacy: {
      title: "Privacy Policy",
      subtitle: "India Angel Forum",
    },
    "code-of-conduct": {
      title: "Code of Conduct",
      subtitle: "India Angel Forum",
    },
    about: {
      title: "About Us",
      subtitle: "Building India's Angel Ecosystem",
      badge: "Mission • Values • Team",
    },
  };

  const content = pageContent[page] || pageContent.home;
  const displayTitle = title || content.title;
  const displaySubtitle = subtitle || content.subtitle;
  const badge = content.badge;

  // SVG with navy gradient background and amber accents
  const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#181E35;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2A3654;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#F5A623;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F7BC4F;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- Decorative elements -->
  <circle cx="1100" cy="100" r="200" fill="#F5A623" fill-opacity="0.05"/>
  <circle cx="100" cy="530" r="150" fill="#F5A623" fill-opacity="0.05"/>
  
  <!-- Logo text -->
  <text x="80" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="#FAFAFA">
    <tspan fill="#FAFAFA">India</tspan><tspan fill="#F5A623"> Angel Forum</tspan>
  </text>
  
  <!-- Main title -->
  <text x="80" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700" fill="#FAFAFA">
    ${escapeXml(displayTitle)}
  </text>
  
  <!-- Subtitle -->
  <text x="80" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="36" fill="#FAFAFA" fill-opacity="0.85">
    ${escapeXml(displaySubtitle)}
  </text>
  
  <!-- Badge/Stats (if available) -->
  ${badge ? `
  <rect x="80" y="420" width="${Math.min(badge.length * 14 + 40, 800)}" height="50" rx="25" fill="#F5A623" fill-opacity="0.15"/>
  <text x="100" y="453" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#F5A623" font-weight="500">
    ${escapeXml(badge)}
  </text>
  ` : ''}
  
  <!-- Bottom accent line -->
  <rect x="80" y="580" width="200" height="4" rx="2" fill="url(#accentGradient)"/>
  
  <!-- Website URL -->
  <text x="1120" y="590" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#FAFAFA" fill-opacity="0.6" text-anchor="end">
    indiaangelforum.com
  </text>
</svg>
  `.trim();

  return svg;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const page = url.searchParams.get("page") || "home";
    const title = url.searchParams.get("title") || undefined;
    const subtitle = url.searchParams.get("subtitle") || undefined;

    const svg = generateOGImage({ page, title, subtitle });

    return new Response(svg, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error("OG Image generation error:", error);
    
    // Return a fallback simple SVG
    const fallbackSvg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#181E35"/>
  <text x="600" y="315" font-family="sans-serif" font-size="48" fill="#FAFAFA" text-anchor="middle">India Angel Forum</text>
</svg>
    `.trim();

    return new Response(fallbackSvg, {
      headers: corsHeaders,
      status: 200,
    });
  }
});
