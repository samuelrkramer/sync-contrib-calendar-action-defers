import assert from "assert"
import * as core from "@actions/core"

import { getSource, sourceTypes } from "./sources"
import { BaseActivitySource, IActivitySource, SourceType } from "./sources/base"

// This SHOULD match the definition in action.yml
export interface Options {
  source: BaseActivitySource
  username: string
  authorName: string
  authorEmail: string
}

export default function getOptionsFromInputs(): Options {
  const sourceType = core.getInput("source").toLowerCase()
  const instance = core.getInput("instance")
  const username = core.getInput("username")
  const authorName = core.getInput("author-name")
  const authorEmail = core.getInput("author-email")

  // The action runtime will return empty strings instead of undefined for unfilled fields.
  assert(sourceType)
  assert(username)
  assert(authorName)
  assert(authorEmail)

  assert(sourceTypes.indexOf(sourceType) !== -1)
  const sourceClass = getSource(sourceType as SourceType)
  const source = new sourceClass(instance)

  const options = {
    source,
    username,
    authorName,
    authorEmail,
  }
  return options
}
