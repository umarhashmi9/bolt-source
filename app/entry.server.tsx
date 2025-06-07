import type { AppLoadContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
// import { themeStore } from '~/lib/stores/theme'; // themeStore.value will be replaced by i18n instance logic for lang
import { I18nextProvider } from 'react-i18next';
import { getInstance } from '~/middleware/i18next';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: any,
  loadContext: AppLoadContext, // Use loadContext
) {
  const i18nInstance = await getInstance(loadContext);
  // Ensure i18next is initialized. The middleware should handle this.
  // await i18nInstance.init(); // Not typically needed if middleware does its job

  const readable = await renderToReadableStream(
    <I18nextProvider i18n={i18nInstance}>
      <RemixServer context={remixContext} url={request.url} />
    </I18nextProvider>,
    {
      signal: request.signal,
      onError(error: unknown) {
      console.error(error);
      responseStatusCode = 500;
    },
  });

  const body = new ReadableStream({
    start(controller) {
      const head = renderHeadToString({ request, remixContext, Head });
      // The theme can be obtained from the i18n context or another store if needed here.
      // For now, root.tsx's Layout handles theme on client side and initial data-theme.
      // The lang and dir will be set by root.tsx's Layout. The initial HTML here can omit them
      // or try to sync, but root.tsx is the source of truth after hydration.
      // For simplicity, we'll let root.tsx handle lang, dir, and data-theme attributes on the html tag.
      // The Head component itself is rendered to string here.
      // The `html` tag attributes `lang` and `dir` are set in `root.tsx`'s `Layout`.
      // The `data-theme` is also set there. The `entry.server.tsx` only provides the initial structure.
      // The `root.tsx` Layout will overwrite these on the client if necessary.
      // However, it's better to have the server output the correct lang from the start.
      const lang = i18nInstance.language || 'en';
      const dir = i18nInstance.dir(lang);
      // Theme value: if you have a way to get it on server for initial paint, use it. Otherwise, client will set it.
      // For now, let's remove direct themeStore.value as it might not be in sync with what root.tsx loader provides.
      // root.tsx's loader and Layout are now responsible for theme, lang, dir.
      // This initial HTML structure is minimal.
      controller.enqueue(
        new Uint8Array(
          new TextEncoder().encode(
            // `<!DOCTYPE html><html lang="${lang}" dir="${dir}" data-theme="${themeStore.value}"><head>${head}</head><body><div id="root" class="w-full h-full">`
            // Let root.tsx handle these attributes via loader and Layout for consistency
            `<!DOCTYPE html><html><head>${head}</head><body><div id="root" class="w-full h-full">`
          ),
        ),
      );

      const reader = readable.getReader();

      function read() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.enqueue(new Uint8Array(new TextEncoder().encode('</div></body></html>')));
              controller.close();

              return;
            }

            controller.enqueue(value);
            read();
          })
          .catch((error) => {
            controller.error(error);
            readable.cancel();
          });
      }
      read();
    },

    cancel() {
      readable.cancel();
    },
  });

  if (isbot(request.headers.get('user-agent') || '')) {
    await readable.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');

  responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
