import fetch from "node-fetch";

import { USER_AGENT } from "./common";

// Generated with https://jvilk.com/MakeTypes/ based on response of LeetCode API
export interface UserProfileQueryResult {
  allQuestionsCount?: AllQuestionsCountEntity[] | null;
  matchedUser: MatchedUser;
}
export interface AllQuestionsCountEntity {
  difficulty: string;
  count: number;
  //__typename: string;
}
export interface MatchedUser {
  username: string;
  socialAccounts?: string[] | null;
  githubUrl?: string | null;
  contributions: Contributions;
  profile: Profile;
  submissionCalendar: { [timestamp: string]: number };
  submitStats: SubmitStats;
  //__typename: string;
}
export interface Contributions {
  points: number;
  questionCount: number;
  testcaseCount: number;
  //__typename: string;
}
export interface Profile {
  realName: string;
  websites?: null[] | null;
  countryName?: null;
  skillTags?: null[] | null;
  company?: null;
  school?: null;
  starRating: number;
  aboutMe: string;
  userAvatar: string;
  reputation: number;
  ranking: number;
  //__typename: string;
}
export interface SubmitStats {
  acSubmissionNum?: AcSubmissionNumEntityOrTotalSubmissionNumEntity[] | null;
  totalSubmissionNum?: AcSubmissionNumEntityOrTotalSubmissionNumEntity[] | null;
  //__typename: string;
}
export interface AcSubmissionNumEntityOrTotalSubmissionNumEntity {
  difficulty: string;
  count: number;
  submissions: number;
  //__typename: string;
}

export async function getUserProfile(
  username: string
): Promise<UserProfileQueryResult> {
  const payload = {
    operationName: "getUserProfile",
    variables: { username },
    query:
      "query getUserProfile($username: String!) {\n  allQuestionsCount {\n    difficulty\n    count\n    __typename\n  }\n  matchedUser(username: $username) {\n    username\n    socialAccounts\n    githubUrl\n    contributions {\n      points\n      questionCount\n      testcaseCount\n      __typename\n    }\n    profile {\n      realName\n      websites\n      countryName\n      skillTags\n      company\n      school\n      starRating\n      aboutMe\n      userAvatar\n      reputation\n      ranking\n      __typename\n    }\n    submissionCalendar\n    submitStats {\n      acSubmissionNum {\n        difficulty\n        count\n        submissions\n        __typename\n      }\n      totalSubmissionNum {\n        difficulty\n        count\n        submissions\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
  };

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
  });

  const data = (await response.json()).data;
  data.matchedUser.submissionCalendar = JSON.parse(
    data.matchedUser.submissionCalendar
  );

  return data;
}
