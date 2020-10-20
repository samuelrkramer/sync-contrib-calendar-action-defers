import * as core from "@actions/core"

import { getUserProfile } from "./lcapi"
import { GitController } from "./git"
import assert from "assert"
import { COMMITTER_EMAIL, COMMITTER_NAME } from "./common"

async function run(): Promise<void> {
  try {
    const username = core.getInput("leetcode_username")
    const authorName = core.getInput("author_name")
    const authorEmail = core.getInput("author_email")
    assert(username)
    assert(authorName)
    assert(authorEmail)
    core.info(`LeetCode username: ${username}\nCommit author: ${authorName} <${authorEmail}>`)

    const userProfile = await getUserProfile(username)
    core.debug(`Profile: ${JSON.stringify(userProfile.matchedUser.profile)}`)

    const git = await GitController.createAsync(process.cwd())

    const lastCommitted = await git.getLatestTimestamp({ committer: COMMITTER_NAME })
    core.info(`Last synced: ${lastCommitted.toString()}`)
    if (lastCommitted < new Date(0)) {
      core.warning(`No previous commits by this action are found. Is this repo a shallow clone?`)
    }
    const submissionCalendar = userProfile.matchedUser.submissionCalendar
    let daysCommited = 0
    for (const timestamp of Object.keys(submissionCalendar)) {
      // TODO: bisect?
      const date = new Date(parseInt(timestamp, 10) * 1000) // TODO: iterator map
      if (date > lastCommitted) {
        // TODO: will it lose some new activities added in a day later?
        // TODO: i-th commits in a day?
        daysCommited += 1
        for (let i = 0; i < submissionCalendar[timestamp]; i++) {
          await git.commit(`Synced activities at ${date.toDateString()}`, true, {
            GIT_AUTHOR_DATE: date.toISOString(),
            GIT_AUTHOR_NAME: authorName,
            GIT_AUTHOR_EMAIL: authorEmail,
            GIT_COMMITTER_NAME: COMMITTER_NAME,
            GIT_COMMITTER_EMAIL: COMMITTER_EMAIL,
          })
        }
      }
    }
    core.info(`Days committed: ${daysCommited}/${Object.keys(submissionCalendar).length}`)
    await git.push()
    core.info("Pushed")

    // core.setOutput("time", new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
