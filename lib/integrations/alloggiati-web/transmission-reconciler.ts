import type {
  AlloggiatiWebReceipt,
} from "./types";

export type AlloggiatiReconciliationTransmission = {
  id: string;
  bookingId: string;
  status: string;
};

export type AlloggiatiReconciliationBooking = {
  checkIn: Date;
};

export type AlloggiatiReconciliationResult =
  | {
      status: "RECEIPT_AVAILABLE";
      transmissionId: string;
      receiptDate: string;
      receipt: AlloggiatiWebReceipt;
    }
  | {
      status: "RECEIPT_UNAVAILABLE";
      transmissionId: string;
      receiptDate: string;
      message: string;
    }
  | {
      status: "CHECK_FAILED";
      transmissionId: string;
      receiptDate?: string;
      message: string;
    };

export type AlloggiatiReconciliationDependencies = {
  loadBooking(
    bookingId: string,
  ): Promise<
    AlloggiatiReconciliationBooking | null
  >;

  getReceipt(
    date: string,
  ): Promise<AlloggiatiWebReceipt>;
};

export async function reconcileAlloggiatiTransmission(
  transmission: AlloggiatiReconciliationTransmission,
  dependencies: AlloggiatiReconciliationDependencies,
): Promise<AlloggiatiReconciliationResult> {
  if (transmission.status !== "OUTCOME_UNKNOWN") {
    return {
      status: "CHECK_FAILED",
      transmissionId: transmission.id,
      message:
        "Solo una transmission OUTCOME_UNKNOWN può essere riconciliata.",
    };
  }

  let booking:
    | AlloggiatiReconciliationBooking
    | null;

  try {
    booking =
      await dependencies.loadBooking(
        transmission.bookingId,
      );
  } catch (error) {
    return {
      status: "CHECK_FAILED",
      transmissionId: transmission.id,
      message: errorMessage(
        error,
        "Impossibile caricare la prenotazione Alloggiati.",
      ),
    };
  }

  if (!booking) {
    return {
      status: "CHECK_FAILED",
      transmissionId: transmission.id,
      message:
        "Prenotazione Alloggiati non trovata.",
    };
  }

  const receiptDate =
    formatReceiptDate(booking.checkIn);

  if (!receiptDate) {
    return {
      status: "CHECK_FAILED",
      transmissionId: transmission.id,
      message:
        "Data check-in Alloggiati non valida.",
    };
  }

  try {
    const receipt =
      await dependencies.getReceipt(
        receiptDate,
      );

    return {
      status: "RECEIPT_AVAILABLE",
      transmissionId: transmission.id,
      receiptDate,
      receipt,
    };
  } catch (error) {
    const message = errorMessage(
      error,
      "Verifica Ricevuta Alloggiati Web fallita.",
    );

    if (isReceiptUnavailable(message)) {
      return {
        status: "RECEIPT_UNAVAILABLE",
        transmissionId: transmission.id,
        receiptDate,
        message,
      };
    }

    return {
      status: "CHECK_FAILED",
      transmissionId: transmission.id,
      receiptDate,
      message,
    };
  }
}

function formatReceiptDate(
  date: Date,
): string | undefined {
  if (
    !(date instanceof Date) ||
    Number.isNaN(date.getTime())
  ) {
    return undefined;
  }

  return date.toISOString().slice(0, 10);
}

function isReceiptUnavailable(
  message: string,
): boolean {
  const normalized =
    message.toLowerCase();

  return (
    normalized.includes(
      "ricevuta non disponibile",
    ) ||
    normalized.includes(
      "non ha restituito la ricevuta pdf",
    )
  );
}

function errorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return fallback;
}