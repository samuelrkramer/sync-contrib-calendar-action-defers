import { IActivitySource, BaseActivitySource, SourceType, sourceTypes } from "./base"
import LeetCodeSource from "./leetcode"
import GitLabSource from "./gitlab"
import GerritSource from "./gerrit"
import MediaWikiSource from "./mediawiki"

export { IActivitySource, BaseActivitySource, SourceType, sourceTypes }

export function getSource(type: SourceType): IActivitySource {
  switch (type) {
    case "leetcode":
      return LeetCodeSource
    case "gitlab":
      return GitLabSource
    case "mediawiki":
      return MediaWikiSource
    case "gerrit":
      return GerritSource
  }
}
