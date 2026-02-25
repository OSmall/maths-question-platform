class AppError extends Error {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, options)
    this.name = new.target.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, identifier: string | number, options: ErrorOptions = {}) {
    super(`Entity ${entity} identified by ${identifier} was not found`, options)
  }
}

export class PayloadQueryError extends AppError {
  constructor(cause: unknown) {
    super(`Error when querying PayloadCMS`, { cause })
  }
}

export class FormatError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, options)
  }
}

export class NotANumberError extends FormatError {
  constructor(value: unknown, options: ErrorOptions = {}) {
    super(`${value} is not a number`, options)
  }
}
