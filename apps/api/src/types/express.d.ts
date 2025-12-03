import 'express-session'

declare global {    
    /* eslint-disable no-unused-vars */
  namespace Express {
    /* eslint-disable no-unused-vars */
    interface Request {
      auth: {
        userId: string
        sessionId: string
        email: string
        firstName: string
        lastName: string
        clerkId: string
        token: string
      }
      rawBody: Buffer
      metadata: {
        ipAddress: string
        userAgent: string
        requestId: string
        timestamp: Date
      }
    }
    interface Response {
      responseTime: number
    }
    /* eslint-enable no-unused-vars */
  }
}

export interface AuthUser {
  userId: string
  sessionId: string
}

// Ensure this file is treated as a module
export {}
