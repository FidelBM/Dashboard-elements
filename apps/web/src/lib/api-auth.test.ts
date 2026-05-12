import assert from "node:assert/strict";
import test from "node:test";
import { canUseApiAction } from "./api-auth";

test("commercial direction cannot execute mutation actions", () => {
  assert.equal(canUseApiAction("COMMERCIAL_DIRECTION", "MANUAL_REVIEW_CREATE"), false);
  assert.equal(canUseApiAction("COMMERCIAL_DIRECTION", "FILE_UPLOAD_PROCESS"), false);
  assert.equal(canUseApiAction("COMMERCIAL_DIRECTION", "FOLLOW_UP_WRITE"), false);
  assert.equal(canUseApiAction("COMMERCIAL_DIRECTION", "CORRECTION_SUGGESTION"), false);
  assert.equal(canUseApiAction("COMMERCIAL_DIRECTION", "CORRECTION_OFFICIAL"), false);
});

test("customer success can execute operational V1 actions", () => {
  assert.equal(canUseApiAction("CUSTOMER_SUCCESS", "MANUAL_REVIEW_CREATE"), true);
  assert.equal(canUseApiAction("CUSTOMER_SUCCESS", "FILE_UPLOAD_PROCESS"), true);
  assert.equal(canUseApiAction("CUSTOMER_SUCCESS", "FOLLOW_UP_WRITE"), true);
  assert.equal(canUseApiAction("CUSTOMER_SUCCESS", "CORRECTION_SUGGESTION"), true);
  assert.equal(canUseApiAction("CUSTOMER_SUCCESS", "CORRECTION_OFFICIAL"), false);
});

test("analyst quality can only write quality observations and official corrections", () => {
  assert.equal(canUseApiAction("ANALYST_QUALITY", "MANUAL_REVIEW_CREATE"), false);
  assert.equal(canUseApiAction("ANALYST_QUALITY", "FILE_UPLOAD_PROCESS"), false);
  assert.equal(canUseApiAction("ANALYST_QUALITY", "FOLLOW_UP_OBSERVATION"), true);
  assert.equal(canUseApiAction("ANALYST_QUALITY", "CORRECTION_OFFICIAL"), true);
});
