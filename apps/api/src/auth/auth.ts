import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins"
import { Pool } from "pg"
import { BETTER_AUTH_CONFIG } from "../config/better_auth"
import { SERVER_CONFIG } from "../config/server"
import { logger } from "@repo/logger"
import { USER_ROLES } from "./user_roles"
import { sendEmail } from "../services/email/email_service"
import { passwordResetTemplate } from "../services/email/templates/password_reset"
import { emailVerificationTemplate } from "../services/email/templates/email_verification"
import { orgInvitationTemplate } from "../services/email/templates/org_invitation"

export const auth = betterAuth({
  database: new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    max: 10,
  }),

  secret: BETTER_AUTH_CONFIG.secret,
  baseURL: BETTER_AUTH_CONFIG.baseURL,
  trustedOrigins: BETTER_AUTH_CONFIG.trustedOrigins,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      logger.info({
        msg: "Password reset requested",
        event: "auth.password_reset.requested",
        metadata: { userId: user.id, email: user.email },
      })
      const { subject, html } = passwordResetTemplate({
        resetLink: url,
        userName: user.name,
      })
      await sendEmail({ to: user.email, subject, html })
    },
    resetPasswordTokenExpiresIn: 3600,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      logger.info({
        msg: "Email verification requested",
        event: "auth.email_verification.requested",
        metadata: { userId: user.id, email: user.email },
      })
      const { subject, html } = emailVerificationTemplate({
        verificationLink: url,
        userName: user.name,
      })
      await sendEmail({ to: user.email, subject, html })
    },
  },

  socialProviders: BETTER_AUTH_CONFIG.oauth.google
    ? {
        google: {
          clientId: BETTER_AUTH_CONFIG.oauth.google.clientId,
          clientSecret: BETTER_AUTH_CONFIG.oauth.google.clientSecret,
        },
      }
    : {},

  user: {
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      role: {
        type: "string",
        defaultValue:
          SERVER_CONFIG.nodeEnv === "development"
            ? USER_ROLES.SUPER_ADMIN
            : USER_ROLES.USER,
        input: false,
      },
    },
  },

  session: {
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh every 24 hours
  },

  account: {
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  verification: {
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "admin",
      schema: {
        session: {
          fields: {
            activeOrganizationId: "active_organization_id",
          },
        },
        organization: {
          fields: {
            createdAt: "created_at",
          },
        },
        member: {
          fields: {
            organizationId: "organization_id",
            userId: "user_id",
            createdAt: "created_at",
          },
        },
        invitation: {
          fields: {
            organizationId: "organization_id",
            expiresAt: "expires_at",
            createdAt: "created_at",
            inviterId: "inviter_id",
          },
        },
      },
      sendInvitationEmail: async (data) => {
        const inviteLink = `${SERVER_CONFIG.frontendBaseURL}/organization/accept-invitation?id=${data.id}`
        logger.info({
          msg: "Organization invitation email sending",
          event: "auth.organization.invitation.sending",
          metadata: {
            email: data.email,
            organizationId: data.organization.id,
            role: data.role,
            invitationId: data.id,
          },
        })
        const { subject, html } = orgInvitationTemplate({
          inviterName: data.inviter.user.name,
          orgName: data.organization.name,
          inviteLink,
          role: data.role,
        })
        await sendEmail({ to: data.email, subject, html })
      },
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
