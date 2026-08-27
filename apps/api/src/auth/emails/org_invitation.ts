import { baseTemplate } from "./base_template"

interface OrgInvitationParams {
  inviterName: string
  orgName: string
  inviteLink: string
  role: string
}

interface EmailTemplate {
  subject: string
  html: string
}

export function orgInvitationTemplate({
  inviterName,
  orgName,
  inviteLink,
  role,
}: OrgInvitationParams): EmailTemplate {
  const content = `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">You've been invited</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#64748b;">
  ${inviterName} has invited you to join <strong style="color:#0f172a;">${orgName}</strong> as a <strong style="color:#0f172a;">${role}</strong>.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
  <tr>
    <td style="background-color:#0f172a;padding:12px 32px;border-radius:8px;">
      <a href="${inviteLink}" target="_blank" style="font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;display:inline-block;">Accept invitation</a>
    </td>
  </tr>
</table>
<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#94a3b8;">
  If you weren't expecting this invitation, you can safely ignore this email.
</p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;word-break:break-all;">
  <a href="${inviteLink}" style="color:#64748b;text-decoration:underline;">${inviteLink}</a>
</p>`

  return {
    subject: `${inviterName} invited you to join ${orgName}`,
    html: baseTemplate(content),
  }
}
