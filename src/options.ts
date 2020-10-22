import assert from "assert"
import * as core from "@actions/core"

import { getSource, sourceTypes } from "./sources"
import { BaseActivitySource, IActivitySource } from "./sources/base"

// This SHOULD match the definition in action.yml
export interface Options {
  source: BaseActivitySource
  username: string
  authorName: string
  authorEmail: string
}

export default function getOptionsFromInputs(): Options {
  const sourceType = core.getInput("source")
  const instance = core.getInput("instance")
  const username = core.getInput("username")
  const authorName = core.getInput("author-name")
  const authorEmail = core.getInput("author-email")

  assert(sourceType)
  assert(username)
  assert(authorName)
  assert(authorEmail)

  assert(sourceTypes.indexOf(sourceType) !== -1) // FIX: any
  const sourceClass = getSource(sourceType as any)
  const source = new sourceClass(instance)

  const options = {
    source,
    username,
    authorName,
    authorEmail,
  }
  core.debug(`Options:`)
  return options
}
