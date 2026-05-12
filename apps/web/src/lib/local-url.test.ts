import assert from "node:assert/strict";
import test from "node:test";
import { localBrowserUrl } from "./local-url";

test("rewrites 0.0.0.0 redirects to localhost", () => {
  const url = localBrowserUrl("/dashboard", "http://0.0.0.0:3000/login");

  assert.equal(url.toString(), "http://localhost:3000/dashboard");
});

test("keeps localhost redirects unchanged", () => {
  const url = localBrowserUrl("/dashboard", "http://localhost:3000/login");

  assert.equal(url.toString(), "http://localhost:3000/dashboard");
});

test("uses forwarded railway host instead of internal localhost", () => {
  const headers = new Headers({
    "x-forwarded-host": "demo-v1.up.railway.app",
    "x-forwarded-proto": "https",
  });

  const url = localBrowserUrl("/dashboard", "http://localhost:8080/login", headers);

  assert.equal(url.toString(), "https://demo-v1.up.railway.app/dashboard");
});
