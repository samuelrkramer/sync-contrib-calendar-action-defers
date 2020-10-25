import * as process from "process"
import * as cp from "child_process"
import * as path from "path"
import fs from "fs"
import assert from "assert"

// shows how the runner will run a javascript action with env / stdout protocol
test("test runs", () => {
  const tempRepoPath = path.join(__dirname, "..", "__tests__", "__temprepo__")
  const tempRemotePath = path.join(__dirname, "..", "__tests__", "__tempremote__")
  fs.mkdirSync(tempRepoPath)
  fs.mkdirSync(tempRemotePath)
  cp.execSync(`git init --bare`, { cwd: tempRemotePath })
  cp.execSync(`git init`, { cwd: tempRepoPath })
  cp.execSync(`git config user.name Test`, { cwd: tempRepoPath })
  cp.execSync(`git config user.email test@localhost`, { cwd: tempRepoPath })
  cp.execSync(`git commit -m "Init" --allow-empty`, {
    cwd: tempRepoPath,
    // env: {
    //   GIT_AUTHOR_DATE: new Date(0).toISOString(),
    //   GIT_COMMITTER_DATE: new Date(0).toISOString(),
    // },
  })
  cp.execSync(`git remote add dummy file://${tempRemotePath}`, {
    cwd: tempRepoPath,
  })
  cp.execSync(`git push -u dummy master`, { cwd: tempRepoPath })

  try {
    process.env["INPUT_SOURCE"] = "leetcode"
    process.env["INPUT_INSTANCE"] = "us"
    if (!process.env.hasOwnProperty("INPUT_USERNAME")) {
      // allow overriding for local testing
      process.env["INPUT_USERNAME"] = "test"
    }
    process.env["INPUT_AUTHOR-NAME"] = "Someone"
    process.env["INPUT_AUTHOR-EMAIL"] = "Someone@localhost"
    const nodePath = process.execPath
    const ip = path.join(__dirname, "..", "lib", "main.js")
    const options: cp.ExecFileSyncOptions = {
      cwd: tempRepoPath,
      env: process.env,
      // If the test gets stuck for long, then uncomment here for real-time stdout/err output
      // stdio: "inherit",
    }
    // <del>
    // DO NOT use execSync that spawns a shell by default. Some Debain-based distros have dash as
    // the default non-interactive shell (usually located in /bin/sh) which silently ignores
    // passed-in environment variables with dashes (-) in variable names.
    // </del>
    // The above comment still holds. But even though with cp.execFileSync("node ..."), some of
    // environment variables whose names contains dash are ignored anyway. After hours of
    // debugging (1day+ in total along with the process of reaching the above conclusion), here
    // is the problem, finally: yarn has a mechanism that wraps node with a script that internally
    // calls `exec /path/to/node ...`. The script is installed into a new temporary directory which
    // is put into env.PATH when execSyncing here. That script is where /bin/sh resides again.
    // See https://github.com/yarnpkg/yarn/blob/a4708b29ac74df97bac45365cba4f1d62537ceb7/src/util/portable-script.js#L48
    console.log(`stdout: ${cp.execFileSync(nodePath, [ip], options)}`)
  } catch (e) {
    console.log(`stdout: ${e.stdout}`)
    console.log(`stderr: ${e.stderr}`)
    throw e
  } finally {
    fs.rmdirSync(tempRepoPath, { recursive: true })
    fs.rmdirSync(tempRemotePath, { recursive: true })
  }
})
