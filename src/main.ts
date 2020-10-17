import * as core from "@actions/core";

import { getUserProfile } from "./lcapi";
import { wait } from "./wait";
import { GitController } from "./git";

async function run(): Promise<void> {
  try {
    core.getInput("leetcode");

    const username = core.getInput("leetcode-username");
    core.info(`LeetCode username: ${username}`);
    const userProfile = await getUserProfile(username);
    console.log(userProfile.matchedUser.profile);

    const git = new GitController();
    await git.prepare();

    const lastCommitted = await git.getLatestTimestamp();

    for (const timestamp of Object.keys(
      userProfile.matchedUser.submissionCalendar
    )) {
      // TODO: bisect?
      const date = new Date(parseInt(timestamp, 10)); // TODO: iterator map
      if (date > lastCommitted) {
        await git.commit(`Synced activities at ${date.toDateString()}`, true, {
          GIT_AUTHOR_DATE: date.toISOString(),
          GIT_COMMITTER_NAME: "SyncContribCalBot",
          GIT_COMMITTER_EMAIL: "",
        });
      }
    }
    await git.push();

    const ms: string = "3000";
    core.debug(`Waiting ${ms} milliseconds ...`); // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    core.debug(new Date().toTimeString());
    await wait(parseInt(ms, 10));
    core.debug(new Date().toTimeString());

    core.setOutput("time", new Date().toTimeString());
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
