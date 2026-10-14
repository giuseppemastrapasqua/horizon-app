import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./send-email", () => ({ sendEmail: vi.fn() }));
import { sendEmail } from "./send-email";
import { sendOwnerInviteEmail } from "./send-owner-invite";

const input = { email: "owner@example.com", fullName: '<Mario & "Rossi">', invitePath: "/invite/owner/test-token" };

describe("owner invitation email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-only");
    vi.stubEnv("HORIZON_EMAIL_FROM", "test@example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://preview.example.com");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("sends to the stored recipient with an escaped name and the configured activation origin", async () => {
    vi.mocked(sendEmail).mockResolvedValue({ id: "email-test" });
    expect(await sendOwnerInviteEmail(input)).toBe("sent");
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: input.email,
      html: expect.stringContaining('href="https://preview.example.com/invite/owner/test-token"'),
    }));
    const html = vi.mocked(sendEmail).mock.calls[0][0].html;
    expect(html).toContain("&lt;Mario &amp; &quot;Rossi&quot;&gt;");
    expect(html).not.toContain(input.fullName);
  });

  it("keeps a usable manual invite when email is unconfigured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(await sendOwnerInviteEmail(input)).toBe("not_configured");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects unsafe activation origins and paths before sending", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://preview.example.com");
    expect(await sendOwnerInviteEmail(input)).toBe("not_configured");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://preview.example.com");
    expect(await sendOwnerInviteEmail({ ...input, invitePath: "//other.example/invite/owner/token" })).toBe("not_configured");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("reports a failed send without returning provider credentials or token details", async () => {
    vi.mocked(sendEmail).mockRejectedValue(new Error("private-provider-token"));
    expect(await sendOwnerInviteEmail(input)).toBe("failed");
  });
});
