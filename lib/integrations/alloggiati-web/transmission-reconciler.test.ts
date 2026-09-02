import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  reconcileAlloggiatiTransmission,
} from "./transmission-reconciler";

const transmission = {
  id: "transmission-1",
  bookingId: "booking-1",
  status: "OUTCOME_UNKNOWN",
};

describe("reconcileAlloggiatiTransmission", () => {
  it("raccoglie la Ricevuta come evidence", async () => {
    const loadBooking = vi.fn().mockResolvedValue({
      checkIn: new Date("2026-09-01T00:00:00.000Z"),
    });

    const getReceipt = vi.fn().mockResolvedValue({
      date: "2026-09-01",
      pdfBase64: "JVBERi0xLjQ=",
    });

    const result =
      await reconcileAlloggiatiTransmission(
        transmission,
        {
          loadBooking,
          getReceipt,
        },
      );

    expect(result).toEqual({
      status: "RECEIPT_AVAILABLE",
      transmissionId: "transmission-1",
      receiptDate: "2026-09-01",
      receipt: {
        date: "2026-09-01",
        pdfBase64: "JVBERi0xLjQ=",
      },
    });

    expect(getReceipt).toHaveBeenCalledWith(
      "2026-09-01",
    );
  });

  it("classifica Ricevuta non disponibile", async () => {
    const result =
      await reconcileAlloggiatiTransmission(
        transmission,
        {
          loadBooking: async () => ({
            checkIn: new Date(
              "2026-09-01T00:00:00.000Z",
            ),
          }),
          getReceipt: async () => {
            throw new Error(
              "Ricevuta non disponibile",
            );
          },
        },
      );

    expect(result.status).toBe(
      "RECEIPT_UNAVAILABLE",
    );
  });

  it("non riconcilia altri stati", async () => {
    const getReceipt = vi.fn();

    const result =
      await reconcileAlloggiatiTransmission(
        {
          ...transmission,
          status: "CONFIRMED",
        },
        {
          loadBooking: vi.fn(),
          getReceipt,
        },
      );

    expect(result.status).toBe(
      "CHECK_FAILED",
    );

    expect(getReceipt).not.toHaveBeenCalled();
  });

  it("classifica errore tecnico separatamente", async () => {
    const result =
      await reconcileAlloggiatiTransmission(
        transmission,
        {
          loadBooking: async () => ({
            checkIn: new Date(
              "2026-09-01T00:00:00.000Z",
            ),
          }),
          getReceipt: async () => {
            throw new Error(
              "Timeout Alloggiati Web",
            );
          },
        },
      );

    expect(result).toMatchObject({
      status: "CHECK_FAILED",
      receiptDate: "2026-09-01",
      message: "Timeout Alloggiati Web",
    });
  });

  it("gestisce prenotazione assente", async () => {
    const getReceipt = vi.fn();

    const result =
      await reconcileAlloggiatiTransmission(
        transmission,
        {
          loadBooking: async () => null,
          getReceipt,
        },
      );

    expect(result).toMatchObject({
      status: "CHECK_FAILED",
      message:
        "Prenotazione Alloggiati non trovata.",
    });

    expect(getReceipt).not.toHaveBeenCalled();
  });
});