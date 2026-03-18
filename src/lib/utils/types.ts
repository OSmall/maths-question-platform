/**
 * @return {value} if it is non-nullable
 * @throws {Error} if the value is nullable
 */
export function toNonNullableOrThrow<T>(value: T | null | undefined, message?: string): T {
  if (value == null) {
    throw new Error(message ?? `Expected: non-nullable value. Actual: ${value}.`)
  }
  return value
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`)
}