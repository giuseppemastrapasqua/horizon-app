export type Ross1000TransmissionSendStore = {
  beginSending(
    transmissionId: string,
  ): Promise<boolean>;
};

export async function authorizeRoss1000TransmissionSend(
  transmissionId: string,
  store: Ross1000TransmissionSendStore,
): Promise<void> {
  const id = transmissionId.trim();

  if (!id) {
    throw new Error(
      "Transmission ROSS1000 non valida.",
    );
  }

  const authorized =
    await store.beginSending(id);

  if (!authorized) {
    throw new Error(
      "Transmission ROSS1000 non autorizzata all'invio.",
    );
  }
}
