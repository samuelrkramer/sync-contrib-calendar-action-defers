import assert from "assert"
import fetch from "node-fetch"
import * as core from "@actions/core"

import { JSON_REQUEST_HEADERS } from "../common"
import {BaseActivitySource} from "./base"
import { joinUrl } from "../utils"

interface CalendarQueryResult {
  [key: string]: number;
}

export default class GitLabSource extends BaseActivitySource {
  private instanceUrl: string

  constructor(instance?: string) {
    super(instance)

    if (instance) {
      // TODO: canonicalize URL
      this.instanceUrl = instance
    }
    else {
      this.instanceUrl = "https://gitlab.com"
    }
    core.debug("Using GitLab instance: " + this.instanceUrl)
  }

  async getCalendar(username: string, lastSynced: Date): Promise<Date[]> {
    const url = joinUrl(this.instanceUrl, `/users/${username}/calendar.json`)
    core.debug("Calendar API URL: " + url)
    const response = await fetch(url, {
      headers: JSON_REQUEST_HEADERS
    })

    const raw: CalendarQueryResult = await response.json()
    const calendar = []
    for (const yyyymmdd of Object.keys(raw)) {
      const date = new Date(yyyymmdd)
      assert(!isNaN(date.getTime()))
      for (let i = 0; i < raw[yyyymmdd]; i++) {
        // A little trick to distinguish activities between each other within one day
        const offsetDate = new Date(date.getTime() + i)
        if (offsetDate > lastSynced) {
          calendar.push(offsetDate)
        }
      }
    }
    core.debug(`Total days in calendar: ${Object.keys(raw).length}`)
    core.debug(`New activities: ${calendar.length}`)
    return calendar
  }
}
