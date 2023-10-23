export type TYPE = {
  a: number
}

export function isT(obj: unknown): obj is TYPE {
  return obj !== null
    && typeof obj === "object"
    && "a" in obj
    && typeof obj.a === "number";
}
