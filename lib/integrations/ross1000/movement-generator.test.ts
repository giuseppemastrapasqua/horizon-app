import { describe, expect, it, vi } from "vitest";

import type { AlloggiatiReferenceResolver } from "../alloggiati-web/reference-resolver";

import { generateRoss1000Movements } from "./movement-generator";
import type { Ross1000MovementGeneratorInput } from "./movement-generator-types";

function createResolver(): AlloggiatiReferenceResolver {
  return {
    resolveCountryCode: vi.fn(async (country: string) =>
      country === "Italia" ? "100000100" : null,
    ),
    isItaly: vi.fn(async (country: string) => country === "Italia"),
    resolveMunicipalityCode: vi.fn(
      async (city: string, province?: string | null) =>
        city === "Milano" && province === "MI" ? "015146" : null,
    ),
    resolveDocumentTypeCode: vi.fn(async () => null),
  };
}

function createInput(): Ross1000MovementGeneratorInput {
  return {
    product: "Horizon",
    movementDate: new Date("2026-09-29T00:00:00.000Z"),
    property: {
      structureCode: "A00000",
      roomsAvailable: 2,
      bedsAvailable: 4,
      isOpen: true,
    },
    bookings: [
      {
        id: "booking-1",
        checkIn: new Date("2026-09-29T00:00:00.000Z"),
        checkOut: new Date("2026-10-01T00:00:00.000Z"),
        guests: 2,
        tourismType: "Culturale",
        transportType: "Auto",
        roomsOccupied: 1,
        bookingGuests: [
          {
            id: "guest-head",
            ross1000Idswh: "H1111111111111111111",
            role: "FAMILY_HEAD",
            firstName: "Mario",
            lastName: "Rossi",
            gender: "MALE",
            birthDate: new Date("1980-01-02T00:00:00.000Z"),
            birthCity: "Milano",
            birthProvince: "MI",
            birthCountry: "Italia",
            citizenship: "Italia",
            residenceCountry: "Italia",
            residenceCity: "Milano",
            residenceProvince: "MI",
          },
          {
            id: "guest-member",
            ross1000Idswh: "H2222222222222222222",
            role: "FAMILY_MEMBER",
            firstName: "Anna",
            lastName: "Rossi",
            gender: "FEMALE",
            birthDate: new Date("1982-03-04T00:00:00.000Z"),
            birthCity: "Milano",
            birthProvince: "MI",
            birthCountry: "Italia",
            citizenship: "Italia",
            residenceCountry: "Italia",
            residenceCity: "Milano",
            residenceProvince: "MI",
          },
        ],
      },
    ],
  };
}

describe("generateRoss1000Movements", () => {
  it("generates an Italian family arrival with the correct leader link", async () => {
    const result = await generateRoss1000Movements(
      createInput(),
      createResolver(),
    );

    expect(result.codice).toBe("A00000");
    expect(result.prodotto).toBe("Horizon");
    expect(result.movimenti).toHaveLength(1);

    const movement = result.movimenti[0];

    expect(movement.data).toBe("20260929");
    expect(movement.struttura).toEqual({
      apertura: "SI",
      camereOccupate: 1,
      camereDisponibili: 2,
      lettiDisponibili: 4,
    });

    expect(movement.arrivi).toHaveLength(2);

    expect(movement.arrivi?.[0]).toMatchObject({
      idswh: "H1111111111111111111",
      tipoAlloggiato: "17",
      cognome: "Rossi",
      nome: "Mario",
      sesso: "M",
      cittadinanza: "100000100",
      statoResidenza: "100000100",
      luogoResidenza: "015146",
      dataNascita: "19800102",
      statoNascita: "100000100",
      comuneNascita: "015146",
      tipoTurismo: "Culturale",
      mezzoTrasporto: "Auto",
    });

    expect(movement.arrivi?.[1]).toMatchObject({
      idswh: "H2222222222222222222",
      tipoAlloggiato: "19",
      idCapo: "H1111111111111111111",
    });
  });

  it("generates departures on the checkout date", async () => {
    const input = createInput();
    input.movementDate = new Date("2026-10-01T00:00:00.000Z");

    const result = await generateRoss1000Movements(
      input,
      createResolver(),
    );

    const movement = result.movimenti[0];

    expect(movement.arrivi).toBeUndefined();
    expect(movement.partenze).toEqual([
      {
        idswh: "H1111111111111111111",
        tipoAlloggiato: "17",
        arrivo: "20260929",
      },
      {
        idswh: "H2222222222222222222",
        tipoAlloggiato: "19",
        arrivo: "20260929",
      },
    ]);
    expect(movement.struttura.camereOccupate).toBe(0);
  });
  it("rejects a family member without a family head", async () => {
    const input = createInput();
    input.bookings[0].bookingGuests = [
      input.bookings[0].bookingGuests[1],
    ];
    input.bookings[0].guests = 1;

    await expect(
      generateRoss1000Movements(input, createResolver()),
    ).rejects.toThrow(
      "ROSS1000: componente famiglia senza capofamiglia nel booking booking-1.",
    );
  });
  it("rejects occupied rooms above property capacity", async () => {
    const input = createInput();
    input.bookings[0].roomsOccupied = 3;

    await expect(
      generateRoss1000Movements(input, createResolver()),
    ).rejects.toThrow(
      "ROSS1000: camere occupate superiori alle camere disponibili.",
    );
  });
  it("rejects an invalid tourism type", async () => {
    const input = createInput();
    input.bookings[0].tourismType = "INVALID";

    await expect(
      generateRoss1000Movements(input, createResolver()),
    ).rejects.toThrow(
      "ROSS1000: tipo turismo non valido: INVALID.",
    );
  });

  it("rejects an invalid transport type", async () => {
    const input = createInput();
    input.bookings[0].transportType = "INVALID";

    await expect(
      generateRoss1000Movements(input, createResolver()),
    ).rejects.toThrow(
      "ROSS1000: mezzo di trasporto non valido: INVALID.",
    );
  });
  it("generates a closed structure with zero capacity and occupancy", async () => {
    const input = createInput();

    input.property.isOpen = false;
    input.bookings = [];

    const result =
      await generateRoss1000Movements(
        input,
        createResolver(),
      );

    expect(
      result.movimenti[0].struttura,
    ).toEqual({
      apertura: "NO",
      camereOccupate: 0,
      camereDisponibili: 0,
      lettiDisponibili: 0,
    });

    expect(
      result.movimenti[0].arrivi,
    ).toBeUndefined();

    expect(
      result.movimenti[0].partenze,
    ).toBeUndefined();
  });

  it("rejects a closed structure with active stays or movements", async () => {
    const input = createInput();

    input.property.isOpen = false;

    await expect(
      generateRoss1000Movements(
        input,
        createResolver(),
      ),
    ).rejects.toThrow(
      "ROSS1000: struttura chiusa con movimenti o soggiorni attivi.",
    );
  });
});




