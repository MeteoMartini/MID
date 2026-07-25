const ACCESS_CODE = "HIER-EIGENEN-LANGEN-CODE-EINTRAGEN";

function base64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.searchParams.get("code") !== ACCESS_CODE) {
      return new Response("Nicht erlaubt", {
        status: 403,
        headers: {"Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store"},
      });
    }
    const keyPair = await crypto.subtle.generateKey(
      {name: "ECDSA", namedCurve: "P-256"},
      true,
      ["sign", "verify"],
    );
    const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    const output = [
      `VAPID_PUBLIC_KEY=${base64Url(publicKeyRaw)}`,
      `VAPID_PRIVATE_KEY=${privateKeyJwk.d}`,
      "VAPID_SUBJECT=mailto:DEINE-EMAILADRESSE@example.com",
    ].join("\n");
    return new Response(output, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
};
