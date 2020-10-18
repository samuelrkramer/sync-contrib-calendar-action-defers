import * as core from "@actions/core"

import { getUserProfile } from "./lcapi"
import { wait } from "./wait"
import { GitController } from "./git"
import { assert } from "console"

async function run(): Promise<void> {
  try {
    // core.getInput("leetcode");

    const username = core.getInput("leetcode-username")
    assert(username)
    core.info(`LeetCode username: ${username}`)
    const userProfile = await getUserProfile(username)
    core.debug(`Profile: ${JSON.stringify(userProfile.matchedUser.profile)}`)

    const git = await GitController.createAsync(process.cwd())

    const lastCommitted = await git.getLatestTimestamp()

    core.info(`Entries count: ${Object.keys(userProfile.matchedUser.submissionCalendar).length}`)
    for (const timestamp of Object.keys(userProfile.matchedUser.submissionCalendar)) {
      // TODO: bisect?
      const date = new Date(parseInt(timestamp, 10) * 1000) // TODO: iterator map
      if (date > lastCommitted) {
        await git.commit(`Synced activities at ${date.toDateString()}`, true, {
          GIT_AUTHOR_DATE: date.toISOString(),
          GIT_COMMITTER_NAME: "SyncContribCalBot",
          GIT_COMMITTER_EMAIL: "",
        })
      }
      // console.log(date, lastCommitted);
    }
    await git.push()

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
