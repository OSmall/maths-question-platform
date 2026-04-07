export function getSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.at(-1)
  }

  return value
}
