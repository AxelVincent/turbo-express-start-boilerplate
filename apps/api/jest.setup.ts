// Config modules validate their env with zod at import time, so anything a
// unit test imports must have its required vars present before the first
// import runs. Only values without a safe default belong here.
process.env.NODE_ENV ??= "test"
process.env.BETTER_AUTH_SECRET ??= "test-secret-at-least-32-characters-long"
