// Packing JSON into short, link-safe text: deflate, then base64url. Used by share links (sim/share.js) and save
// codes for moving a shop into the app (core/transfer.js). CompressionStream is in every browser and in Node 18+.

export function toBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(text) {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

/** Any JSON value as deflated base64url text. */
export async function packJson(value) {
  return toBase64Url(await pipe(new TextEncoder().encode(JSON.stringify(value)), new CompressionStream('deflate-raw')));
}

/** packJson's text back into the value; throws if it isn't one, or would unpack to more than `maxBytes`. */
export async function unpackJson(text, maxBytes) {
  const bytes = await pipe(fromBase64Url(text), new DecompressionStream('deflate-raw'));
  if (bytes.length > maxBytes) throw new Error('too big');
  return JSON.parse(new TextDecoder().decode(bytes));
}
