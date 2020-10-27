// import assert from "assert"
import fetch from "node-fetch"
import * as core from "@actions/core"

import { JSON_REQUEST_HEADERS } from "../common"
import { BaseActivitySource } from "./base"
import { constructURLParamString, isWikiMediaProject, joinUrl } from "../utils"

export interface UserContribsQueryResult {
  batchcomplete: string
  continue?: Continue
  query: Query
}
export interface Continue {
  uccontinue: string
  continue: string
}
export interface Query {
  usercontribs?: UsercontribsEntity[] | null
}
export interface UsercontribsEntity {
  userid: number
  user: string
  pageid: number
  revid: number
  parentid: number
  ns: number
  title: string
  timestamp: string
  comment: string
  size: number
}

export default class MediaWikiSource extends BaseActivitySource {
  private instanceUrl: string

  constructor(instance?: string) {
    super(instance)

    if (instance) {
      // TODO: canonicalize URL
      if (!instance.endsWith("/")) {
        instance += "/"
      }
    } else {
      throw Error("The instance URL of MediaWiki is not specified")
    }

    if (isWikiMediaProject(new URL(instance).hostname) && !instance.endsWith("/w/")) {
      // eslint-disable-next-line quotes
      core.warning('For most WikiMedia projects, the instance url should include a trailing "w/".')
      //  or "wiki/."
    }

    this.instanceUrl = instance
    core.debug("Using WikiPedia instance: " + this.instanceUrl)
  }

  async getCalendar(username: string, laterThan: Date): Promise<Date[]> {
    core.debug(`Getting activities calendar for ${username} starting from ${laterThan}`)

    const contribs = []
    let partialContribs: UsercontribsEntity[] | null | undefined
    let uccontinue = undefined
    do {
      const result: UserContribsQueryResult = await this.queryUserContribs(
        username,
        laterThan.toISOString(),
        uccontinue
      )
      partialContribs = result.query.usercontribs ?? []
      contribs.push(...Array.from(partialContribs))
      uccontinue = result?.continue?.uccontinue
      core.debug(
        `Current chunk size: ${partialContribs?.length ?? -1}, current cumulative size: ${
          contribs.length
        }, next uccontinue: ${uccontinue}`
      )
    } while (
      partialContribs &&
      partialContribs.length > 0 &&
      uccontinue &&
      new Date(partialContribs[partialContribs.length - 1].timestamp) > laterThan
    )
    if (contribs.length > 0) {
      core.debug(`Last contrib is at ${contribs[contribs.length - 1].timestamp}`)
      core.debug(`First contrib of the last chunk is at ${partialContribs[0].timestamp}`)
    } else {
      core.warning(
        "No contributions from this user are found. Are the username and instance URL correct?"
      )
    }

    const calendar = []
    for (const contrib of contribs) {
      const date = new Date(contrib.timestamp)
      if (date > laterThan) {
        calendar.push(date)
      }
    }
    core.debug(`Total queryed contribs: ${contribs.length}`)
    core.debug(`Effective new activities: ${calendar.length}`)
    return calendar
  }

  async queryUserContribs(
    ucuser: string,
    ucend?: string,
    uccontinue?: string
  ): Promise<UserContribsQueryResult> {
    core.debug(
      `Querying contribs for ${JSON.stringify(ucuser)} (quoted as: ${encodeURIComponent(ucuser)})`
    )
    // Do not encodeURIComponent the whole param as ":" would be  quoted into %3A.
    const params = {
      action: "query",
      list: "usercontribs",
      ucuser,
      ucend,
      uccontinue,
      uclimit: 500,
      format: "json",
    }

    const url = joinUrl(this.instanceUrl, `api.php?${constructURLParamString(params)}`)
    core.debug("UserContribs API URL: " + url)
    const response = await fetch(url, { headers: JSON_REQUEST_HEADERS })
    const raw = await response.json()
    core.debug(`First-level keys of response: ${Object.keys(raw)}`)
    if (Object.prototype.hasOwnProperty.call(raw, "error")) {
      throw Error(`Error when querying usercontribs: ${raw.error?.code}\n${raw.error?.info}`)
    }
    return raw
  }
}
