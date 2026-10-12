import {
  describe,
  expect,
  it,
} from "vitest";
import {
  matchRoss1000Response,
} from "./response-matcher";
import type {
  Ross1000ParsedResponse,
} from "./response-parser";

const payloadXml =
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<movimenti>` +
  `<codice>TEST</codice>` +
  `<prodotto>Horizon</prodotto>` +
  `<movimento>` +
  `<data>20260929</data>` +
  `<arrivi>` +
  `<arrivo><idswh>H001</idswh></arrivo>` +
  `</arrivi>` +
  `<partenze>` +
  `<partenza><idswh>H002</idswh></partenza>` +
  `</partenze>` +
  `</movimento>` +
  `</movimenti>`;

describe("matchRoss1000Response", () => {
  it("accepts a complete successful response", () => {
    const response: Ross1000ParsedResponse = {
      days: [],
      results: [
        {
          kind: "arrival",
          idswh: "H001",
          success: true,
        },
        {
          kind: "departure",
          idswh: "H002",
          success: true,
        },
      ],
      allSuccessful: true,
    };

    const result =
      matchRoss1000Response(
        payloadXml,
        response,
      );

    expect(result.complete).toBe(true);
    expect(result.successful).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.unexpected).toEqual([]);
    expect(result.rejected).toEqual([]);
  });

  it("detects a partial response", () => {
    const response: Ross1000ParsedResponse = {
      days: [],
      results: [
        {
          kind: "arrival",
          idswh: "H001",
          success: true,
        },
      ],
      allSuccessful: true,
    };

    const result =
      matchRoss1000Response(
        payloadXml,
        response,
      );

    expect(result.complete).toBe(false);
    expect(result.successful).toBe(false);
    expect(result.missing).toEqual([
      {
        kind: "departure",
        idswh: "H002",
      },
    ]);
  });

  it("detects an unexpected response record", () => {
    const response: Ross1000ParsedResponse = {
      days: [],
      results: [
        {
          kind: "arrival",
          idswh: "H001",
          success: true,
        },
        {
          kind: "departure",
          idswh: "H002",
          success: true,
        },
        {
          kind: "arrival",
          idswh: "H999",
          success: true,
        },
      ],
      allSuccessful: true,
    };

    const result =
      matchRoss1000Response(
        payloadXml,
        response,
      );

    expect(result.complete).toBe(false);
    expect(result.successful).toBe(false);
    expect(result.unexpected).toEqual([
      {
        kind: "arrival",
        idswh: "H999",
        success: true,
      },
    ]);
  });

  it("preserves a certain application rejection", () => {
    const response: Ross1000ParsedResponse = {
      days: [],
      results: [
        {
          kind: "arrival",
          idswh: "H001",
          success: false,
          error: "Codice non valido",
        },
        {
          kind: "departure",
          idswh: "H002",
          success: true,
        },
      ],
      allSuccessful: false,
    };

    const result =
      matchRoss1000Response(
        payloadXml,
        response,
      );

    expect(result.complete).toBe(true);
    expect(result.successful).toBe(false);
    expect(result.rejected).toEqual([
      {
        kind: "arrival",
        idswh: "H001",
        success: false,
        error: "Codice non valido",
      },
    ]);
  });
});
