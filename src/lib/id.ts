import { randomUUID } from "node:crypto";

export function newId(prefix?: string): string {
  const uuid = randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}
