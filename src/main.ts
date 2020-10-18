import * as core from "@actions/core"

import { getUserProfile } from "./lcapi"
import { wait } from "./wait"
import { GitController } from "./git"
import { assert } from "console"
import { COMMITTER_EMAIL, COMMITTER_NAME } from "./common"

async function run(): Promise<void> {
  try {
    const username = core.getInput("leetcode_username")
    const authorName = core.getInput("author_name")
    const authorEmail = core.getInput("author_email")
    assert(username)
    assert(authorName)
    assert(authorEmail)

    core.info(`LeetCode username: ${username}\nAuthor: ${authorName} <${authorEmail}>`)
    const userProfile = await getUserProfile(username)
    core.debug(`Profile: ${JSON.stringify(userProfile.matchedUser.profile)}`)

    const git = await GitController.createAsync(process.cwd())

    const lastCommitted = await git.getLatestTimestamp({ committer: COMMITTER_NAME })

    const submissionCalendar = userProfile.matchedUser.submissionCalendar
    let daysCommited = 0
    for (const timestamp of Object.keys(submissionCalendar)) {
      // TODO: bisect?
      const date = new Date(parseInt(timestamp, 10) * 1000) // TODO: iterator map
      if (date > lastCommitted) {
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
      // console.log(date, lastCommitted);
    }
    await git.push()
    core.info(`Days committed: ${daysCommited}/${Object.keys(submissionCalendar).length}`)

    const ms: string = "3000"
    core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    core.setOutput("time", new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
