import { ValidationError } from 'payload'

type ThrowValidationArgs = {
  req?: any
  field?: string
  message: string
}

export function throwValidation({ req, field = 'file', message }: ThrowValidationArgs): never {
  if (typeof ValidationError === 'function') {
    const t = req?.t
    const fieldLabel = `field: ${field} - ${message}`
    throw new ValidationError({
      errors: [
        {
          label: fieldLabel,
          message,
          path: field,
        },
      ]
    }, t)
  }

  throw new Error(message)
}
