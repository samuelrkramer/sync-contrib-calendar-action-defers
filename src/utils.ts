import assert from "assert"
import crypto from "crypto"
import { encode } from "punycode"

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
  date.setMonth(date.getMonth() - 12)
  return date
}

export function constructURLParamString(paramMap: {
  [key: string]: string | number | boolean | undefined
}): string {
  let params = []
  for (const name of Object.keys(paramMap)) {
    const value = paramMap[name]
    if (value !== undefined) {
      params.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
    }
  }
  return params.join("&")
}

const WIKIMEDIA_PROECTS = [
  "wikipedia",
  "Wiktionary",
  "wikiquote",
  "wikinews",
  "wikisource",
  "wikibook",
  "wikiversity",
  "wikivoyage",
  "wikimedia",
  "wikidata",
] // , "wikispecies"

export function isWikiMediaProject(fqdn: string): boolean {
  const parts = fqdn.split(".")
  try {
    const top = parts.pop()
    assert(top === "org")
    const second = parts.pop()
    assert(second !== undefined)
    assert(WIKIMEDIA_PROECTS.indexOf(second as string) !== -1)
  } catch (e) {
    return false
  }
  return true
}

export function rtrim(str: string, suffix: string) {
  if (str.endsWith(suffix)) {
    str.slice(0, str.length - suffix.length)
  }
}

export const dateFormatterFull = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
  timeStyle: "full",
} as any)

export const dateFormatterMedium = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
} as any)
// TODO: Fix any
// Ref: https://github.com/microsoft/TypeScript/issues/35865
