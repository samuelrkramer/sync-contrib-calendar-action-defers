// import assert from "assert"
import fetch from "node-fetch"
import * as core from "@actions/core"

import { JSON_REQUEST_HEADERS } from "../common"
import { BaseActivitySource } from "./base"
import { joinUrl, oneYearAgo } from "../utils"

export interface ChangeEntryQueryResult {
  id: string
  project: string
  branch: string
  topic?: string | null
  assignee?: Assignee | null
  hashtags?: null[] | null
  change_id: string
  subject: string
  status: string
  created: string
  updated: string
  submit_type?: string | null
  mergeable?: boolean | null
  insertions: number
  deletions: number
  total_comment_count: number
  unresolved_comment_count: number
  has_review_started: boolean
  _number: number
  owner: AssigneeOrOwnerOrSubmitter
  requirements?: null[] | null
  submitted?: string | null
  submitter?: Submitter | null
  submission_id?: string | null
  work_in_progress?: boolean | null
  _more_changes?: boolean | null
}
export interface Assignee {
  _account_id: number
  name: string
  email: string
  username: string
  status?: string | null
}
export interface AssigneeOrOwnerOrSubmitter {
  _account_id: number
  name: string
  email: string
  username: string
}
export interface Submitter {
  _account_id: number
  name: string
  username: string
  email?: string | null
  status?: string | null
}

export default class GerritSource extends BaseActivitySource {
  private instanceUrl: string

  constructor(instance?: string) {
    super(instance)

    if (instance) {
      // TODO: canonicalize URL
      if (!instance.endsWith("/")) {
        instance += "/"
      }
      this.instanceUrl = instance
    } else {
      throw Error("The instance URL of Gerrit is not specified")
    }
    core.debug("Using Gerrit instance: " + this.instanceUrl)
  }

  async getCalendar(username: string, lastSynced: Date): Promise<Date[]> {
    core.debug(`Getting activities calendar for ${username} starting from ${lastSynced}`)
    // TODO: or instead allow to specify the maximum time range in inputs
    const oldBound = new Date(Math.max(lastSynced.getTime(), oneYearAgo().getTime()))
    let offset = 0
    const changes = []
    let partialChanges
    do {
      partialChanges = await this.queryChanges(username, offset)
      changes.push(...partialChanges)
      offset += partialChanges.length
      core.debug(
        `Current chunk size: ${partialChanges.length}, current cumulative size: ${changes.length}, next offset: ${offset}`
      )
    } while (
      changes.length > 0 &&
      partialChanges[partialChanges.length - 1]._more_changes === true &&
      new Date(`${partialChanges[partialChanges.length - 1].created} UTC`) > oldBound
    )
    core.debug(`Last change created at ${changes[changes.length - 1].created}`)
    core.debug(`First change of the last chunk created at ${changes[changes.length - 1].created}`)

    const calendar = []
    for (const change of changes) {
      const date = new Date(`${change.created} UTC`)
      if (date > oldBound) {
        calendar.push(date)
      }
    }
    core.debug(`Total changes in queryed calendar: ${changes.length}`)
    core.debug(`Effective new activities: ${calendar.length}`)
    return calendar
  }

  async queryChanges(
    owner: string,
    start = 0,
    limit?: number,
    noLimit = false
  ): Promise<ChangeEntryQueryResult[]> {
    core.debug(
      `Querying changes for ${JSON.stringify(owner)} (quoted as: ${encodeURIComponent(owner)})`
    )
    let pathQuery = `changes/?q=owner:${encodeURIComponent(
      owner
    )}&o=DETAILED_ACCOUNTS&start=${start}`
    if (limit !== undefined) {
      pathQuery += `&limit=${limit}`
    }
    if (noLimit) {
      pathQuery += "&no-limit"
    }

    core.debug(`Path query: ${pathQuery}`)
    const url = joinUrl(this.instanceUrl, pathQuery)
    core.debug("Calendar API URL: " + url)
    // Note: with core.debug, the % will be quoted again upon printing!
    const response = await fetch(url, {
      headers: JSON_REQUEST_HEADERS,
    })
    const raw = await response.text()
    core.debug(`Raw response (first 50 of ${raw.length}): ${raw.slice(0, 50)}`)
    return JSON.parse(raw.slice(5))
  }
}
