import crypto from "crypto"

export function simpleSHA1(text: string): string {
  return crypto.createHash("SHA1").update(text).digest("hex")
}

export function joinUrl(base: string, url: string): string {
  return new URL(url, base).toString()
}
