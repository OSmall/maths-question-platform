class AppError extends Error {
  static ERROR_NAME = 'APP_ERROR'
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, options)
    const ctor = this.constructor as typeof AppError // reads the static value even if it is overwritten by child classes
    this.name = ctor.ERROR_NAME
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NotFoundError extends AppError {
  static ERROR_NAME = 'NOT_FOUND_ERROR'
  constructor(entity: string, identifier: string | number, options: ErrorOptions = {}) {
    super(`Entity ${entity} identified by ${identifier} was not found`, options)
  }
}

export class PayloadQueryError extends AppError {
  static ERROR_NAME = 'PAYLOAD_QUERY_ERROR'
  constructor(cause: unknown) {
    super(`Error when querying PayloadCMS`, { cause })
  }
}

export class FormatError extends AppError {
  static ERROR_NAME = 'FORMAT_ERROR'
}

export class NotANumberError extends FormatError {
  static ERROR_NAME = 'NOT_A_NUMBER_ERROR'
  constructor(value: unknown, options: ErrorOptions = {}) {
    super(`${value} is not a number`, options)
  }
}

export class UnauthorizedError extends AppError {
  static ERROR_NAME = 'UNAUTHORIZED_ERROR'
  constructor(message = 'You are not allowed to access this resource', options: ErrorOptions = {}) {
    super(message, options)
  }
}

export class InvalidPreviewSlugError extends FormatError {
  static ERROR_NAME = 'INVALID_PREVIEW_SLUG_ERROR'
  constructor(slug: unknown, options: ErrorOptions = {}) {
    super(`Invalid preview slug: ${slug}`, options)
  }
}
