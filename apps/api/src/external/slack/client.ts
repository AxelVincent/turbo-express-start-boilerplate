import { baseLogger, logger } from "@repo/logger"
import { SLACK_CONFIG } from "../../config/slack"

interface SlackArgs {
  title: string
  details?: Record<string, unknown>
  channel?: string
}

async function post(args: SlackArgs, color: string): Promise<void> {
  const channel = args.channel ?? SLACK_CONFIG.defaultChannel
  if (!SLACK_CONFIG.botToken || !channel) {
    logger.info({
      msg: "[slack not configured] Would post",
      event: "slack.not_configured",
      metadata: { ...args, channel },
    })
    return
  }

  // Slack rejects a section over 3000 chars, and stack traces blow past it.
  const detailsText = args.details
    ? "\n```" +
      Object.entries(args.details)
        .map(([k, v]) => {
          const value =
            v instanceof Error
              ? v.message
              : typeof v === "string"
                ? v
                : JSON.stringify(v)
          return `${k}: ${value}`
        })
        .join("\n")
        .slice(0, 2500) +
      "```"
    : ""

  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        authorization: `Bearer ${SLACK_CONFIG.botToken}`,
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        channel,
        attachments: [
          {
            color,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*${args.title}*${detailsText}`,
                },
              },
            ],
          },
        ],
      }),
    })
    const body = (await response.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
    }
    if (!response.ok || body.ok === false) {
      // baseLogger, not logger: logger.error feeds the sink that calls back into here.
      baseLogger.error({
        msg: "Slack post failed",
        event: "slack.post_failed",
        metadata: { status: response.status, error: body.error, channel },
      })
    }
  } catch (err) {
    baseLogger.error({
      msg: "Slack post failed",
      event: "slack.post_failed",
      metadata: { error: err instanceof Error ? err.message : String(err) },
    })
  }
}

export const slack = {
  event: (args: SlackArgs): void => {
    void post(args, "#2eb886")
  },
  alert: (args: SlackArgs): void => {
    void post(args, "#e01e5a")
  },
}
