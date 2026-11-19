import { headers } from "next/headers";

export async function backendJson(path) {
  const incomingHeaders = await headers();
  const configuredOrigin = process.env.BACKEND_API_URL;
  const forwardedHost = incomingHeaders.get("x-forwarded-host") || incomingHeaders.get("host");
  const forwardedProtocol = incomingHeaders.get("x-forwarded-proto") || "http";
  const origin = configuredOrigin || (forwardedHost ? `${forwardedProtocol}://${forwardedHost}` : null);
  if (!origin) throw new Error("Backend API origin is not configured.");

  const headersForBackend = new Headers();
  const cookie = incomingHeaders.get("cookie");
  if (cookie) headersForBackend.set("cookie", cookie);

  const response = await fetch(new URL(`/api${path}`, origin), {
    headers: headersForBackend,
    cache: "no-store",
  });
  const data = await response.json();
  return { response, data };
}
