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
