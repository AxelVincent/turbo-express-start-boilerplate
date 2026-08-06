import { describe, it, expect, jest, beforeEach } from "@jest/globals"

// Create mock logger instance once
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}

// Mock pino to return the same mock logger instance
jest.mock("pino", () => {
  return jest.fn(() => mockLogger)
})

// Import after mocking
import { logger, baseLogger } from ".."

describe("@repo/logger", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("logs an info message with payload", () => {
    logger.info({
      msg: "Test message",
      event: "test.event",
    })

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Test message",
        event: "test.event",
      }),
    )
  })

  it("logs an error message with payload and metadata", () => {
    logger.error({
      msg: "Error occurred",
      event: "error.event",
      metadata: { errorCode: 500 },
    })

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Error occurred",
        event: "error.event",
        metadata: { errorCode: 500 },
      }),
    )
  })

  it("injects context when available", () => {
    logger.runWithContext(
      {
        user: {
          id: "123",
          email: "test@example.com",
          name: "Test User",
          role: "admin",
          orgId: "org_42",
          orgRole: "owner",
        },
      },
      () => {
        logger.info({
          msg: "Message with context",
          event: "context.test",
        })
      },
    )

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Message with context",
        event: "context.test",
        user: {
          id: "123",
          email: "test@example.com",
          name: "Test User",
          role: "admin",
          orgId: "org_42",
          orgRole: "owner",
        },
      }),
    )
  })

  it("forwards errors to the error sink with context folded in", () => {
    const sink = jest.fn()
    logger.setErrorSink(sink)

    logger.runWithContext(
      {
        request: { id: "req_1", ipAddress: "127.0.0.1", timestamp: new Date() },
      },
      () => {
        logger.error({ msg: "Boom", event: "boom.event" })
      },
    )

    expect(sink).toHaveBeenCalledTimes(1)
    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Boom",
        event: "boom.event",
        request: expect.objectContaining({ id: "req_1" }),
      }),
    )

    logger.setErrorSink(undefined)
  })

  it("does not send info, warn or debug to the error sink", () => {
    const sink = jest.fn()
    logger.setErrorSink(sink)

    logger.info({ msg: "i", event: "e" })
    logger.warn({ msg: "w", event: "e" })
    logger.debug({ msg: "d", event: "e" })

    expect(sink).not.toHaveBeenCalled()

    logger.setErrorSink(undefined)
  })

  it("stops forwarding once the sink is cleared", () => {
    const sink = jest.fn()
    logger.setErrorSink(sink)
    logger.setErrorSink(undefined)

    logger.error({ msg: "Boom", event: "boom.event" })

    expect(sink).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalled()
  })

  it("can get current context", () => {
    const context = logger.getContext()
    expect(context).toBeUndefined()

    logger.runWithContext(
      {
        user: {
          id: "123",
          email: "test@example.com",
          name: "Test User",
          role: "admin",
          orgId: "org_42",
          orgRole: "owner",
        },
      },
      () => {
        const contextInside = logger.getContext()
        expect(contextInside).toEqual({
          user: {
            id: "123",
            email: "test@example.com",
            name: "Test User",
            role: "admin",
            orgId: "org_42",
            orgRole: "owner",
          },
        })
      },
    )
  })
})
