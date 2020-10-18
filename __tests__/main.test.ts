import { wait } from "../src/wait"
import * as process from "process"
import * as cp from "child_process"
import * as path from "path"
import fs from "fs"
import { assert } from "console"
// import * as io from "@actions/io";

test("throws invalid number", async () => {
  const input = parseInt("foo", 10)
  await expect(wait(input)).rejects.toThrow("milliseconds not a number")
})

test("wait 500 ms", async () => {
  const start = new Date()
  await wait(500)
  const end = new Date()
  var delta = Math.abs(end.getTime() - start.getTime())
  expect(delta).toBeGreaterThan(450)
})

// shows how the runner will run a javascript action with env / stdout protocol
test("test runs", async () => {
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
    env: {
      GIT_AUTHOR_DATE: new Date(0).toISOString(),
      GIT_COMMITTER_DATE: new Date(0).toISOString(),
    },
  })
  cp.execSync(`git remote add dummy file://${tempRemotePath}`, {
    cwd: tempRepoPath,
  })
  cp.execSync(`git push -u dummy master`, { cwd: tempRepoPath })

  try {
    process.env["INPUT_LEETCODE-USERNAME"] = "test"
    // const nodePath = await io.which("node", true);
    const ip = path.join(__dirname, "..", "lib", "main.js")
    const options: cp.ExecSyncOptions = {
      cwd: tempRepoPath,
      env: process.env,
      stdio: "inherit",
    }
    cp.execSync(`node ${ip}`, options)
  } finally {
    fs.rmdirSync(tempRepoPath, { recursive: true })
    fs.rmdirSync(tempRemotePath, { recursive: true })
  }
})
