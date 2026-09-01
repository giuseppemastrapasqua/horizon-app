export type AlloggiatiWebCredentials = {
  username: string;
  password: string;
  wsKey: string;
};

export type AlloggiatiWebSession = {
  token: string;
};

export type AlloggiatiWebSubmission = {
  records: string[];
  apartmentId?: string;
};

export type AlloggiatiWebValidationResult = {
  success: boolean;
  message?: string;
};

export type AlloggiatiWebSubmissionResult = {
  success: boolean;
  resultCode?: string;
  message?: string;
};

export type AlloggiatiWebReceipt = {
  date: string;
  pdfBase64: string;
};

export type AlloggiatiWebTableType =
  | "Luoghi"
  | "Tipi_Documento";

export type AlloggiatiWebTableResult = {
  csv: string;
};
