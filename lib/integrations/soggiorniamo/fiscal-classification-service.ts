import {
  classifySoggiorniamoGuest,
} from "./fiscal-classifier";
import {
  resolveSoggiorniamoResidence,
} from "./residence-resolver";
import {
  calculateMilanShortRentalTax,
} from "./milan-tax-policy";

export type FiscalClassificationGuestRecord = {
  id: string;
  birthDate: Date;
  residenceCountry: string | null;
  residenceCity: string | null;
  residenceProvince: string | null;
};

export type FiscalClassificationBookingRecord = {
  id: string;
  checkIn: Date;
  checkOut: Date;
  bookingGuests: FiscalClassificationGuestRecord[];
};

export type FiscalClassificationSource =
  | "AUTO"
  | "MANUAL";

export type FiscalClassificationStatus =
  | "CLASSIFIED"
  | "REVIEW_REQUIRED";

export type ExistingFiscalClassification = {
  bookingGuestId: string;
  source: FiscalClassificationSource;
};

export type FiscalClassificationUpsertData = {
  bookingGuestId: string;
  guestTypeCode: number | null;
  tariff: number | null;
  taxAmount: number | null;
  intermediary: string | null;
  source: "AUTO";
  status: FiscalClassificationStatus;
  reason: string;
};

export type FiscalClassificationRepository = {
  findByBookingGuestId(
    bookingGuestId: string,
  ): Promise<ExistingFiscalClassification | null>;

  upsert(input: {
    where: {
      bookingGuestId: string;
    };
    create: FiscalClassificationUpsertData;
    update: Omit<
      FiscalClassificationUpsertData,
      "bookingGuestId"
    >;
  }): Promise<unknown>;
};

export type FiscalClassificationPersistenceResult =
  | {
      bookingGuestId: string;
      action: "UPSERTED";
      classification: FiscalClassificationUpsertData;
    }
  | {
      bookingGuestId: string;
      action: "PRESERVED_MANUAL";
    };

function calendarNights(
  checkIn: Date,
  checkOut: Date,
) {
  const start = Date.UTC(
    checkIn.getUTCFullYear(),
    checkIn.getUTCMonth(),
    checkIn.getUTCDate(),
  );

  const end = Date.UTC(
    checkOut.getUTCFullYear(),
    checkOut.getUTCMonth(),
    checkOut.getUTCDate(),
  );

  const nights =
    (end - start) / (24 * 60 * 60 * 1000);

  if (
    !Number.isInteger(nights) ||
    nights < 1
  ) {
    throw new Error(
      "Booking check-out must be after check-in.",
    );
  }

  return nights;
}

export function buildAutomaticFiscalClassification(
  guest: FiscalClassificationGuestRecord,
  checkIn: Date,
  checkOut: Date,
): FiscalClassificationUpsertData {
  const residence = resolveSoggiorniamoResidence({
    country: guest.residenceCountry,
    city: guest.residenceCity,
    province: guest.residenceProvince,
  });

  const classification =
    classifySoggiorniamoGuest({
      guest: {
        guestId: guest.id,
        birthDate: guest.birthDate,
      },
      checkIn,
      residence,
    });

  let tariff: number | null = null;
  let taxAmount: number | null = null;

  if (
    classification.status === "CLASSIFIED" &&
    (
      classification.guestTypeCode === 2 ||
      classification.guestTypeCode === 13
    )
  ) {
    const tax = calculateMilanShortRentalTax({
      checkIn,
      nights: calendarNights(
        checkIn,
        checkOut,
      ),
      guestTypeCode:
        classification.guestTypeCode,
    });

    if (tax.status === "CALCULATED") {
      tariff = tax.tariff;
      taxAmount = tax.taxAmount;
    }
  }

  return {
    bookingGuestId: guest.id,
    guestTypeCode:
      classification.guestTypeCode,
    tariff,
    taxAmount,
    intermediary: null,
    source: "AUTO",
    status: classification.status,
    reason: classification.reason,
  };
}

export async function classifyAndPersistBookingGuests(
  input: {
    booking: FiscalClassificationBookingRecord;
    repository: FiscalClassificationRepository;
  },
): Promise<
  FiscalClassificationPersistenceResult[]
> {
  const results:
    FiscalClassificationPersistenceResult[] = [];

  for (
    const guest of input.booking.bookingGuests
  ) {
    const existing =
      await input.repository.findByBookingGuestId(
        guest.id,
      );

    if (existing?.source === "MANUAL") {
      results.push({
        bookingGuestId: guest.id,
        action: "PRESERVED_MANUAL",
      });

      continue;
    }

    const data =
      buildAutomaticFiscalClassification(
        guest,
        input.booking.checkIn,
        input.booking.checkOut,
      );

    const {
      bookingGuestId: _bookingGuestId,
      ...update
    } = data;

    await input.repository.upsert({
      where: {
        bookingGuestId: guest.id,
      },
      create: data,
      update,
    });

    results.push({
      bookingGuestId: guest.id,
      action: "UPSERTED",
      classification: data,
    });
  }

  return results;
}
