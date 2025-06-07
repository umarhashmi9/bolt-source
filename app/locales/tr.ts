// app/locales/tr.ts
import type en from "./en";

export default {
  greeting: "Merhaba",
  description: "Bolt.diy'e Hoş Geldiniz",
  logoAlt: "Logo", // Turkish translation can be the same if "Logo" is standard
  deployingToPlatform: "{{platform}} platformuna dağıtılıyor...",
  deploy: "Dağıt",
  noNetlifyAccount: "Netlify Hesabı Bağlı Değil",
  deployToNetlify: "Netlify'a Dağıt",
  noVercelAccount: "Vercel Hesabı Bağlı Değil",
  deployToVercel: "Vercel'e Dağıt",
  comingSoonSR: "Yakında",
  deployToCloudflareComingSoon: "Cloudflare'e Dağıt (Yakında)",
  vercelAlt: "Vercel logosu",
  cloudflareAlt: "Cloudflare logosu",
  languageSelectorLabel: "Dil seçin"
} satisfies typeof en;
