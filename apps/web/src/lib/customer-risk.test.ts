import assert from "node:assert/strict";
import test from "node:test";
import { calculateAccumulatedCustomerRisk } from "./customer-risk";

const referenceDate = new Date("2026-05-03T00:00:00.000Z");

test("calculates critical status from recent high risk reviews and critical signals", () => {
  const result = calculateAccumulatedCustomerRisk(
    [
      {
        reviewDate: "2026-04-20T00:00:00.000Z",
        riskLabel: "HIGH",
        npsScore: 2,
        primaryCause: "Solicitud de cancelación o no renovación",
        detectedSignals: ["cancelacion"],
      },
    ],
    referenceDate,
  );

  assert.equal(result.totalScore, 10);
  assert.equal(result.status, "CRITICAL");
  assert.equal(result.reviewsConsidered, 1);
  assert.deepEqual(result.mainAccumulatedCauses, ["Solicitud de cancelación o no renovación"]);
  assert.deepEqual(result.detectedCriticalSignals, ["cancelacion"]);
});

test("ignores reviews older than 90 days", () => {
  const result = calculateAccumulatedCustomerRisk(
    [
      {
        reviewDate: "2026-01-01T00:00:00.000Z",
        riskLabel: "HIGH",
        npsScore: 0,
        primaryCause: "Retrasos o incumplimiento de tiempos",
        detectedSignals: ["incumplimiento"],
      },
      {
        reviewDate: "2026-04-15T00:00:00.000Z",
        riskLabel: "MEDIUM",
        npsScore: 6,
        primaryCause: "Problemas de comunicación",
      },
    ],
    referenceDate,
  );

  assert.equal(result.totalScore, 4);
  assert.equal(result.status, "STABLE");
  assert.equal(result.reviewsConsidered, 1);
});

test("returns watchlist for five to nine points", () => {
  const result = calculateAccumulatedCustomerRisk(
    [
      {
        reviewDate: "2026-04-15T00:00:00.000Z",
        riskLabel: "MEDIUM",
        npsScore: 5,
        primaryCause: "Mala atención o falta de seguimiento",
      },
      {
        reviewDate: "2026-04-18T00:00:00.000Z",
        riskLabel: "MANUAL_REVIEW",
        primaryCause: "Otro / no especificado",
      },
    ],
    referenceDate,
  );

  assert.equal(result.totalScore, 6);
  assert.equal(result.status, "WATCHLIST");
  assert.equal(result.reviewsConsidered, 2);
});

test("returns manual review when there is insufficient recent data", () => {
  const result = calculateAccumulatedCustomerRisk([], referenceDate);

  assert.equal(result.totalScore, 0);
  assert.equal(result.status, "MANUAL_REVIEW");
  assert.equal(result.reviewsConsidered, 0);
});

test("returns manual review for contradictory high risk with high NPS and no signals", () => {
  const result = calculateAccumulatedCustomerRisk(
    [
      {
        reviewDate: "2026-04-15T00:00:00.000Z",
        riskLabel: "HIGH",
        npsScore: 10,
        primaryCause: "Otro / no especificado",
      },
    ],
    referenceDate,
  );

  assert.equal(result.status, "MANUAL_REVIEW");
  assert.equal(result.totalScore, 5);
});
