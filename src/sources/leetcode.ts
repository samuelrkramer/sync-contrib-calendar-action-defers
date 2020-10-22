// import assert from "assert"
import fetch from "node-fetch"
import * as core from "@actions/core"

import { JSON_REQUEST_HEADERS } from "../common"
import { BaseActivitySource } from "./base"
import { assert } from "console"

// Interface definitions are generated with
// https://jvilk.com/MakeTypes/ based on response of LeetCode API.

// The following interfaces and API endpoints are for leetcode.com only.
interface UserProfileQueryResult {
  allQuestionsCount?: AllQuestionsCountEntity[] | null
  matchedUser: MatchedUser
}
interface AllQuestionsCountEntity {
  difficulty: string
  count: number
  //__typename: string;
}
interface MatchedUser {
  username: string
  socialAccounts?: string[] | null
  githubUrl?: string | null
  contributions: Contributions
  profile: Profile
  submissionCalendar: { [timestamp: string]: number }
  submitStats: SubmitStats
  //__typename: string;
}
interface Contributions {
  points: number
  questionCount: number
  testcaseCount: number
  //__typename: string;
}
interface Profile {
  realName: string
  websites?: null[] | null
  countryName?: null
  skillTags?: null[] | null
  company?: null
  school?: null
  starRating: number
  aboutMe: string
  userAvatar: string
  reputation: number
  ranking: number
  //__typename: string;
}
interface SubmitStats {
  acSubmissionNum?: AcSubmissionNumEntityOrTotalSubmissionNumEntity[] | null
  totalSubmissionNum?: AcSubmissionNumEntityOrTotalSubmissionNumEntity[] | null
  //__typename: string;
}
interface AcSubmissionNumEntityOrTotalSubmissionNumEntity {
  difficulty: string
  count: number
  submissions: number
  //__typename: string;
}

async function getUserProfile(username: string): Promise<UserProfileQueryResult> {
  const payload = {
    operationName: "getUserProfile",
    variables: { username },
    query:
      "query getUserProfile($username: String!) {\n  allQuestionsCount {\n    difficulty\n    count\n    __typename\n  }\n  matchedUser(username: $username) {\n    username\n    socialAccounts\n    githubUrl\n    contributions {\n      points\n      questionCount\n      testcaseCount\n      __typename\n    }\n    profile {\n      realName\n      websites\n      countryName\n      skillTags\n      company\n      school\n      starRating\n      aboutMe\n      userAvatar\n      reputation\n      ranking\n      __typename\n    }\n    submissionCalendar\n    submitStats {\n      acSubmissionNum {\n        difficulty\n        count\n        submissions\n        __typename\n      }\n      totalSubmissionNum {\n        difficulty\n        count\n        submissions\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
  }

  const response = await fetch("https://leetcode.com/graphql", {
    headers: JSON_REQUEST_HEADERS,
    // "referrer": "https://leetcode.com/",
    body: JSON.stringify(payload),
    method: "POST",
  })

  const data = (await response.json()).data
  data.matchedUser.submissionCalendar = JSON.parse(data.matchedUser.submissionCalendar)

  // core.debug(`Profile: ${JSON.stringify(userProfile.matchedUser.profile)}`)
  return data
}

// The following interfaces and API endpoints are for leetcode-cn.com only.
interface UserSubmissionCalendarQueryResult {
  [timestamp: string]: number
}

async function getUserSubmissionCalendar(
  username: string
): Promise<UserSubmissionCalendarQueryResult> {
  const response = await fetch(
    `https://leetcode-cn.com/api/user_submission_calendar/${username}/`,
    {
      headers: JSON_REQUEST_HEADERS,
      // "referrer": `https://leetcode-cn.com/u/${username}/`,
      method: "GET",
    }
  )
  return await response.json()
}

export default class LeetCodeSource extends BaseActivitySource {
  constructor(instance?: string) {
    super(instance)

    switch (instance) {
      case "us":
      case "":
      case undefined:
        this.getSubmissionCalendar = async (username) => {
          const userProfile = await getUserProfile(username)
          return userProfile.matchedUser.submissionCalendar
        }
        core.debug("LeetCode: leetcode.com")
        break
      case "cn":
        this.getSubmissionCalendar = getUserSubmissionCalendar
        core.debug("LeetCode: leetcode-cn.com")
        break
      default:
        throw Error(`Supported instances are us and cn only, not ${JSON.stringify(instance)}`)
    }
  }

  private getSubmissionCalendar: { (username: string): Promise<UserSubmissionCalendarQueryResult> }

  async getCalendar(username: string, lastSynced = new Date(-1)): Promise<Date[]> {
    // const userProfile = await getUserProfile(username)
    const submissionCalendar = await this.getSubmissionCalendar(username)
    const calendar = []
    // Bisect won't work as the object keys is unordered.
    for (const timestamp of Object.keys(submissionCalendar)) {
      const date = new Date(parseInt(timestamp, 10) * 1000) // TODO: iterator map
      assert(!isNaN(date.getTime()))
      for (let i = 0; i < submissionCalendar[timestamp]; i++) {
        // A little trick to distinguish activities between each other within one day
        const offsetDate = new Date(date.getTime() + i)
        if (offsetDate > lastSynced) {
          // TODO: will it lose some new activities added in a day later?
          calendar.push(offsetDate)
        }
      }
    }
    core.debug(`Total days in calendar: ${Object.keys(submissionCalendar).length}`)
    core.debug(`New activities: ${calendar.length}`)
    return calendar
  }
}
