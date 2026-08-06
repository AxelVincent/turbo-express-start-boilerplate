import { baseTemplate } from "./base_template"

interface PasswordResetParams {
  resetLink: string
  userName: string
}

interface EmailTemplate {
  subject: string
  html: string
}

export function passwordResetTemplate({
  resetLink,
  userName,
}: PasswordResetParams): EmailTemplate {
  const content = `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">Reset your password</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#64748b;">
  Hi <strong style="color:#0f172a;">${userName}</strong>, we received a request to reset your password. Click the button below to choose a new one.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
  <tr>
    <td style="background-color:#0f172a;padding:12px 32px;border-radius:8px;">
      <a href="${resetLink}" target="_blank" style="font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;display:inline-block;">Reset password</a>
    </td>
  </tr>
</table>
<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#94a3b8;">
  If you didn't request this, you can safely ignore this email. The link expires in 1 hour.
</p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;word-break:break-all;">
  <a href="${resetLink}" style="color:#64748b;text-decoration:underline;">${resetLink}</a>
</p>`

  return {
    subject: "Reset your password",
    html: baseTemplate(content),
  }
}
