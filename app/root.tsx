import { useStore } from '@nanostores/react';
import type { LinksFunction } from '@remix-run/cloudflare';
import { json, Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import { unstable_LoaderFunctionArgs as LoaderFunctionArgs } from "@remix-run/node"; // or cloudflare
import { useChangeLanguage } from "remix-i18next/react";
import { i18nextMiddleware, getLocale, localeCookie } from "~/middleware/i18next"; // Adjust path if necessary
import { useTranslation } from "react-i18next";
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClientOnly } from 'remix-utils/client-only';

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

export const unstable_middleware = [i18nextMiddleware];

export async function loader({ request, context }: LoaderFunctionArgs) {
  // Note: getLocale now takes context if using the latest remix-i18next middleware style
  // For older versions or direct RemixI18Next class, it might take request directly.
  // Assuming context is passed correctly by the middleware setup.
  let locale = await getLocale(context); // Or simply getLocale(request) with older remix-i18next
  return json(
    { locale },
    { headers: { "Set-Cookie": await localeCookie.serialize(locale) } }
  );
}

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
  },
  { rel: 'stylesheet', href: reactToastifyStyles },
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: xtermStyles },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('bolt_theme');

    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.querySelector('html')?.setAttribute('data-theme', theme);
  }
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Meta />
    <Links />
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
  </>
));

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);
  let { i18n } = useTranslation();
  let { locale } = useLoaderData<typeof loader>();

  useChangeLanguage(locale);

  useEffect(() => {
    // Theme setting logic remains, but now it's inside the html tag rendered by this Layout
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <html lang={i18n.language} dir={i18n.dir(i18n.language)} data-theme={theme}>
      <Head />
      <body>
        <ClientOnly>{() => <DndProvider backend={HTML5Backend}>{children}</DndProvider>}</ClientOnly>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import { logStore } from './lib/stores/logs';

export default function App() {
  const theme = useStore(themeStore); // This theme is for the log, Layout handles the html attribute

  useEffect(() => {
    logStore.logSystem('Application initialized', {
      theme,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep theme dependency if log needs to re-run on theme change, otherwise remove. For init, empty array is fine.


  // useChangeLanguage was moved to Layout as it needs loaderData.
  // The main Outlet is rendered within the Layout defined above.
  return <Outlet />;
}
