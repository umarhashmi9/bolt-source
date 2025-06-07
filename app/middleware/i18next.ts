// app/middleware/i18next.ts
import { createCookie } from "@remix-run/node"; // Or "@remix-run/cloudflare" if deployed on Cloudflare
import { unstable_createI18nextMiddleware } from "remix-i18next/middleware";
import Backend from "i18next-http-backend";

import en from "~/locales/en";
import tr from "~/locales/tr";

// Create a cookie object to store the user's language preference
export const localeCookie = createCookie("lng", {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
});

export const [i18nextMiddleware, getLocale, getInstance] =
  unstable_createI18nextMiddleware({
    detection: {
      supportedLanguages: ["en", "tr"],
      fallbackLanguage: "en",
      cookie: localeCookie, // Use the cookie to detect language
      order: ["cookie", "header"], // Order of detection: cookie, then Accept-Language header
    },
    i18next: {
      supportedLngs: ["en", "tr"],
      fallbackLng: "en",
      defaultNS: "translation", // Default namespace
      resources: {
        en: { translation: en },
        tr: { translation: tr },
      },
      // If you want to load translations from a backend (e.g., /locales/{{lng}}.json)
      // backend: {
      //   loadPath: "/locales/{{lng}}.json", // Path to your translation files
      // },
      // initImmediate: false, // Important for SSR to prevent issues
    },
    // backend: Backend, // Uncomment if using i18next-http-backend to load files
  });
