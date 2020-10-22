import assert from "assert"

import * as core from "@actions/core"

import getOptionsFromInputs from "./options"
import { GitController } from "./git"
import { COMMITTER_EMAIL, COMMITTER_NAME } from "./common"
import { simpleSHA1 } from "./utils"

async function run(): Promise<void> {
  try {
    const { source, username, authorName, authorEmail } = await getOptionsFromInputs()
    // In commit messages to distinguish lastSynced.
    // TODO: or distinguish lastSyned by activitySetID=simpleSHA1(`${source} for ${username}`)?
    const sourceID = simpleSHA1(`${source}`)
    core.info(
      `Source: ${source}\tSource ID:${sourceID}\nUsername: ${username}\nCommit author: ${authorName} <${authorEmail}>`
    )

    const git = await GitController.createAsync(process.cwd())

    const lastSynced = await git.getLatestTimestamp({
      message: sourceID,
      committer: COMMITTER_NAME,
    })
    const calendar = await source.getCalendar(username, lastSynced)
    core.info(`Last synced: ${lastSynced}`)
    if (lastSynced < new Date(0)) {
      core.warning("No previous commits by this action are found. Is this repo a shallow clone?")
    }

    for (const date of calendar) {
      // TODO: really need to recheck date again now that it has benn done in source.getCalendar?
      if (date > lastSynced) {
        // daysCommited += 1
        // for (let i = 0; i < submissionCalendar[timestamp]; i++) {
        await git.commit(
          `Synced activities at ${date.toDateString()} from ${source.constructor.name}

Source: ${source}\tSource ID:${sourceID}`,
          true,
          {
            GIT_AUTHOR_DATE: date.toISOString(),
            GIT_AUTHOR_NAME: authorName,
            GIT_AUTHOR_EMAIL: authorEmail,
            GIT_COMMITTER_NAME: COMMITTER_NAME,
            GIT_COMMITTER_EMAIL: COMMITTER_EMAIL,
          }
        )
      }
    }
    core.info(`Activities committed: ${calendar.length}`)
    await git.push()
    core.info("Pushed")

    // core.setOutput("time", new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
