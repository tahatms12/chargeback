import { createRequestHandler } from "@netlify/remix-adapter";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, type AppLoadContext, type EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToPipeableStream } from "react-dom/server";
import { addDocumentResponseHeaders } from "~/shopify.server";

const ABORT_DELAY = 5000;

export default function handleRequest(request: Request, status: number, headers: Headers, context: EntryContext, _loadContext: AppLoadContext) {
  addDocumentResponseHeaders(request, headers);
  return new Promise<Response>((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(<RemixServer context={context} url={request.url} abortDelay={ABORT_DELAY} />, {
      onShellReady() {
        const body = new PassThrough();
        const stream = createReadableStreamFromReadable(body);
        headers.set("Content-Type", "text/html");
        resolve(new Response(stream, { headers, status }));
        pipe(body);
      },
      onShellError(error) { reject(error); },
      onError(error) { console.error(error); }
    });
    setTimeout(abort, ABORT_DELAY);
  });
}
