import fetch from "node-fetch"

import * as core from "@actions/core"

import { USER_AGENT } from "../common"

// Generated with https://jvilk.com/MakeTypes/ based on response of LeetCode API
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
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "content-type": "application/json",
      "Cache-Control": "no-cache",
    },
    // "referrer": "https://leetcode.com/",
    body: JSON.stringify(payload),
    method: "POST",
  })

  const data = (await response.json()).data
  data.matchedUser.submissionCalendar = JSON.parse(data.matchedUser.submissionCalendar)

  return data
}

export default async function getCalendar(username: string, lastSynced = new Date(-1)): Promise<Date[]> {
  const userProfile = await getUserProfile(username)
  const submissionCalendar = userProfile.matchedUser.submissionCalendar
  const calendar = []
  // Bisect won't work as the object keys is unordered.
  for (const timestamp of Object.keys(submissionCalendar)) {
    const date = new Date(parseInt(timestamp, 10) * 1000) // TODO: iterator map
    for (let i = 0; i < submissionCalendar[timestamp]; i++) {
      // A little trick to distinguish activities between each other within one day
      const offsetDate = new Date(date.getTime() + i)
      if (offsetDate > lastSynced) {
        // TODO: will it lose some new activities added in a day later?
        calendar.push(offsetDate)
      }
    }
  }
  core.debug(`Total days: ${Object.keys(submissionCalendar).length}`)
  core.debug(`New activities: ${calendar.length}`)
  return calendar
}
