const localBindHosts = new Set(["0.0.0.0", "::", "[::]"]);
const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::", "[::]"]);

export function localBrowserUrl(path: string, requestUrl: string, headers?: Headers): URL {
  const url = new URL(path, requestUrl);
  const forwardedHost = headers?.get("x-forwarded-host");
  const forwardedProto = headers?.get("x-forwarded-proto");

  if (forwardedHost && !isLocalHost(forwardedHost)) {
    url.protocol = `${forwardedProto || "https"}:`;
    url.host = forwardedHost;
    if (!forwardedHost.includes(":")) {
      url.port = "";
    }
    return url;
  }

  if (localBindHosts.has(url.hostname)) {
    url.hostname = "localhost";
  }

  return url;
}

function isLocalHost(host: string): boolean {
  const hostname = host.split(":")[0];
  return localHosts.has(hostname);
}
