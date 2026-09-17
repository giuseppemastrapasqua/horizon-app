export type SoggiorniamoInsertType = 1 | 2;

export type SoggiorniamoGuestPresence = {
  guestTypeCode: number;
  stayBand?: number;
  checkIn?: string;
  checkOut?: string;
  arrivals: number;
  presences: number;
  unitId?: string;
  residenceCountryCode?: string;
  residenceCityCode?: string;
  tariff: number;
  intermediary?: string;
  taxAmount: number;
};

export type SoggiorniamoMonth = {
  month: number;
  guests: SoggiorniamoGuestPresence[];
};

export type SoggiorniamoDeclaration = {
  year: number;
  period: number;
  totalArrivals: number;
  totalPayingPresences: number;
  totalExemptGuests: number;
  totalTax: number;
  months: SoggiorniamoMonth[];
};

export type SoggiorniamoXmlInput = {
  municipalityCode: string;
  authCode: string;
  userCode: string;

  managerTaxCode: string;
  managerLastName: string;
  managerFirstName: string;

  insertType: SoggiorniamoInsertType;

  structureId: string;
  structureName: string;

  declaration: SoggiorniamoDeclaration;
};
