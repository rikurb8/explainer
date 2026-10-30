import { Book, activate } from "../../../lib/render.mjs";

// Keep user HTML in an opaque-origin iframe; never insert it into the docs DOM.
export function previewDocument(source, css) {
  const body = new Book().blocks(source);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'">
<title>Explainer preview</title><style>${css}
body{padding:24px}.book{padding:24px;box-shadow:none}.fig.wide{margin:2rem 0}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important}}
</style></head><body><main class="book">${body}</main>
<script>(${activate.toString()})(document)</script></body></html>`;
}
