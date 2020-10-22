import PACKAGE from "../package.json"

export const PACKAGE_IDENTIFIER = `${PACKAGE.name}/${PACKAGE.NAME}`
export const USER_AGENT = `${PACKAGE_IDENTIFIER} (+${PACKAGE.homepage})`
export const JSON_REQUEST_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "application/json",
  "content-type": "application/json",
  "Cache-Control": "no-cache",
}
export const COMMITTER_NAME = "SyncContribCalBot"
export const COMMITTER_EMAIL = ""
