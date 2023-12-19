import assert from "assert"

import * as core from "@actions/core"

import getOptionsFromInputs from "./options"
import { GitController } from "./git"
import { COMMITTER_EMAIL, COMMITTER_NAME, USER_AGENT } from "./common"
import {
  dateFormatterFull,
  dateFormatterMedium,
  formatDateISO8601,
  oneYearAgo,
  rtrim,
  simpleSHA1,
} from "./utils"

async function run(): Promise<void> {
  core.info(USER_AGENT)
  try {
    const { source, username, authorName, authorEmail, limit1year } = getOptionsFromInputs()
    // TODO: redact username / instance url?
    // In commit messages to distinguish lastSynced.
    const activitySetID = simpleSHA1(`${source}|${username}`)
    core.info(
      `Source: ${source}\nUsername: ${username}\nActivity Set ID: ${activitySetID}\nCommit author: ${authorName} <${authorEmail}>`
    )
    const sourceShortName = rtrim(source.constructor.name, "Source")

    const git = await GitController.createAsync(process.cwd())

    const lastSynced = await git.getLastAuthorDate({
      message: activitySetID,
      committer: COMMITTER_NAME,
    })
    core.info(`Last synced: ${lastSynced}`)
    if (lastSynced < new Date(0)) {
      core.warning(`No previous commits for this source/username are found.
If it is not the first run, then make sure the repo is fully checked out.`)
    }
    const laterThan = limit1year
      ? new Date(Math.max(lastSynced.getTime(), oneYearAgo().getTime()))
      : lastSynced
    const calendar = await source.getCalendar(username, laterThan)
    // Sort here to ensure laterThan works. See git.ts:getLastAuthorDate for more notes.
    // The default fn compares .toString()
    // Ref: https://gist.github.com/onpubcom/1772996#gistcomment-1457940
    calendar.sort((a, b) => a.getTime() - b.getTime())

    for (const date of calendar) {
      // TODO: really need to recheck date again now that it has benn done in source.getCalendar?
      // TODO: bisect
      if (date > laterThan) {

        if (date.getDay() === 6) { // if the date is a Saturday
          date.setDate(date.getDate()+1); // increment it to the next day (Date object handles overflowing month)
        }

        const dateText = await git.commit(
          `Synced activities at ${dateFormatterMedium.format(date)} from ${sourceShortName}

Activity Set ID: ${activitySetID}
Source: ${source}
Username: ${username}
Date: ${dateFormatterFull.format(date)}`,
          true,
          {
            GIT_AUTHOR_DATE: formatDateISO8601(date),
            GIT_AUTHOR_NAME: authorName,
            GIT_AUTHOR_EMAIL: authorEmail,
            GIT_COMMITTER_NAME: COMMITTER_NAME,
            GIT_COMMITTER_EMAIL: COMMITTER_EMAIL,
          }
        )
      }
    }
    core.info(`Activities committed: ${calendar.length}`)
    try {
      await git.push()
    } catch (e) {
      core.error(`Error when pushing!

If the log shows there is conflict, then check if multiple workflows are running simultaneous
or if the job is rerun manually against a stale commit.

Otherwise, please open a new issue if necessary.`)
      throw e
    }
    core.info("Pushed")
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
