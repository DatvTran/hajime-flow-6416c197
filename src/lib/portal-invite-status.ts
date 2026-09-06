export type PortalInviteStatus = {
  status?: string;
  reason?: string;
  emailDispatched?: boolean;
  inviteUrl?: string;
};

export function portalInviteUserMessage(invite?: PortalInviteStatus | null): string {
  if (!invite?.status) return "Account created.";
  if (invite.status === "sent" || invite.status === "logged") {
    return invite.emailDispatched
      ? "Invitation email sent — they can open the link to confirm and create a password."
      : "Invite created. Email was logged on the server (set RESEND_API_KEY to send).";
  }
  if (invite.status === "pending_distributor_approval") {
    return (
      invite.reason ||
      "Saved. Your wholesaler must approve before the portal invite is sent."
    );
  }
  if (invite.status === "delivery_failed") {
    return "Account saved, but the invitation email failed. Resend from Settings → CRM.";
  }
  if (invite.status === "skipped" && invite.reason === "email_already_registered") {
    return "Account saved. No invite sent — that email already has a login.";
  }
  if (invite.status === "skipped" && invite.reason === "no_email") {
    return "Account saved. Add an email in CRM to send a portal invite.";
  }
  if (invite.status === "skipped" && invite.reason === "email_used_by_other_role") {
    return "Account saved. That email is already a CRM contact with a different role.";
  }
  if (invite.status === "skipped") {
    return "Account saved. Portal invite was not sent.";
  }
  return "Account created.";
}
