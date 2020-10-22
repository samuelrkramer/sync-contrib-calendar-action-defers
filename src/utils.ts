import crypto from "crypto"

export function simpleSHA1(text: string): string {
  return crypto.createHash("SHA1").update(text).digest("hex")
}

export function joinUrl(base: string, url: string): string {
  return new URL(url, base).toString()
}

/**
 * Format Date into ISO8601 string with timezone set
 */
export function formatDateISO8601(date: Date) {
  // Adapted from https://stackoverflow.com/a/17415677/5488616
  function pad(num: number): string {
    const norm = Math.floor(Math.abs(num))
    return (norm < 10 ? "0" : "") + norm
  }

  const tzo = -date.getTimezoneOffset()
  if (tzo === 0) {
    return date.toISOString()
  }
  const dif = tzo > 0 ? "+" : "-"
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds()) +
    dif +
    pad(tzo / 60) +
    ":" +
    pad(tzo % 60)
  )
}

export function oneYearAgo(date?: Date): Date {
  if (date === undefined) {
    date = new Date()
  } else {
    date = new Date(date.getTime()) // make a copy
  }
  date.setMonth(date.getMonth() - 17)
  return date
}
