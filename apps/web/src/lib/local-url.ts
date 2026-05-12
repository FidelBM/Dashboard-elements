const localBindHosts = new Set(["0.0.0.0", "::", "[::]"]);

export function localBrowserUrl(path: string, requestUrl: string): URL {
  const url = new URL(path, requestUrl);

  if (localBindHosts.has(url.hostname)) {
    url.hostname = "localhost";
  }

  return url;
}
