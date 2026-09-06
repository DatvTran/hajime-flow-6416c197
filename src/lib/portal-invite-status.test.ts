import { describe, expect, it } from "vitest";
import { portalInviteUserMessage } from "@/lib/portal-invite-status";

describe("portalInviteUserMessage", () => {
  it("describes a dispatched invite", () => {
    expect(portalInviteUserMessage({ status: "sent", emailDispatched: true })).toMatch(/Invitation email sent/);
  });

  it("holds sales-rep retail until approval", () => {
    expect(portalInviteUserMessage({ status: "pending_distributor_approval" })).toMatch(/wholesaler must approve/);
  });

  it("notes existing logins", () => {
    expect(
      portalInviteUserMessage({ status: "skipped", reason: "email_already_registered" }),
    ).toMatch(/already has a login/);
  });
});
