import getCalendarLeetCode from "./leetcode"
import getCalendarGitLab from "./gitlab"

export interface GetCalendarFn {
  (username: string, lastSynced: Date): Promise<Date[]>
}

export type Source = "leetcode" | "gitlab" | "wikipedia"

export function getSource(source: Source): GetCalendarFn {
  switch (source) {
    case "leetcode":
      return getCalendarLeetCode;
    case "gitlab":
    default:
      return getCalendarGitLab
  }
}
