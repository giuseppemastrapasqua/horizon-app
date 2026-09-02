export type AlloggiatiTransmissionSendStore = {
  beginSending(
    transmissionId: string,
  ): Promise<boolean>;
};

export async function authorizeAlloggiatiTransmissionSend(
  transmissionId: string,
  store: AlloggiatiTransmissionSendStore,
): Promise<void> {
  const id = transmissionId.trim();

  if (!id) {
    throw new Error(
      "Transmission Alloggiati Web non valida.",
    );
  }

  const authorized =
    await store.beginSending(id);

  if (!authorized) {
    throw new Error(
      "Transmission Alloggiati Web non autorizzata all'invio.",
    );
  }
}