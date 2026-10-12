import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  authorizeRoss1000TransmissionSend,
} from "./transmission-send-gate";

describe("authorizeRoss1000TransmissionSend", () => {
  it("atomically authorizes PREPARED transmission", async () => {
    const beginSending =
      vi.fn().mockResolvedValue(true);

    await expect(
      authorizeRoss1000TransmissionSend(
        " transmission-1 ",
        { beginSending },
      ),
    ).resolves.toBeUndefined();

    expect(
      beginSending,
    ).toHaveBeenCalledWith(
      "transmission-1",
    );
  });

  it("rejects an empty transmission id", async () => {
    const beginSending = vi.fn();

    await expect(
      authorizeRoss1000TransmissionSend(
        " ",
        { beginSending },
      ),
    ).rejects.toThrow(
      "Transmission ROSS1000 non valida.",
    );

    expect(
      beginSending,
    ).not.toHaveBeenCalled();
  });

  it("rejects a transmission that cannot acquire SENDING", async () => {
    const beginSending =
      vi.fn().mockResolvedValue(false);

    await expect(
      authorizeRoss1000TransmissionSend(
        "transmission-1",
        { beginSending },
      ),
    ).rejects.toThrow(
      "Transmission ROSS1000 non autorizzata all'invio.",
    );
  });
});
