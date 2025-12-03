import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Create mock logger instance once
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Mock pino to return the same mock logger instance
jest.mock("pino", () => {
  return jest.fn(() => mockLogger);
});

// Import after mocking
import { logger, baseLogger } from "..";

describe("@repo/logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs an info message with payload", () => {
    logger.info({
      msg: "Test message",
      event: "test.event",
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Test message",
        event: "test.event",
      })
    );
  });

  it("logs an error message with payload and metadata", () => {
    logger.error({
      msg: "Error occurred",
      event: "error.event",
      metadata: { errorCode: 500 },
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Error occurred",
        event: "error.event",
        metadata: { errorCode: 500 },
      })
    );
  });

  it("injects context when available", () => {
    logger.runWithContext(
      {
        user: {
          id: "123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        },
      },
      () => {
        logger.info({
          msg: "Message with context",
          event: "context.test",
        });
      }
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "Message with context",
        event: "context.test",
        user: {
          id: "123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        },
      })
    );
  });

  it("can get current context", () => {
    const context = logger.getContext();
    expect(context).toBeUndefined();

    logger.runWithContext(
      {
        user: {
          id: "123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
        },
      },
      () => {
        const contextInside = logger.getContext();
        expect(contextInside).toEqual({
          user: {
            id: "123",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
          },
        });
      }
    );
  });
});
