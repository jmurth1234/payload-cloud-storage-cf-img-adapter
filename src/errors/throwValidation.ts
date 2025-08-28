// Centralized helper to surface field-level validation errors in Payload
// Falls back to a normal Error if ValidationError is not available


let ValidationErrorCtor: any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const errors = require('payload/errors')
  ValidationErrorCtor = errors?.ValidationError
} catch (_) {
  ValidationErrorCtor = Error
}

export function throwValidation({ req, field = 'file', message }: { req?: any; field?: string; message: string }): never {
  if (ValidationErrorCtor) {
    const t = req?.t
    const errorMsg = `field: ${field} - ${message}`
    throw new ValidationErrorCtor([
      { field: errorMsg, message },
    ], t)
  }
  throw new Error(message)
}


