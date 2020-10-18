import * as core from "@actions/core"
import * as io from "@actions/io"
import { exec, ExecOptions } from "@actions/exec"
import { assert } from "console"
// import { parse } from "path";

// class GitController
export class GitController {
  private gitPath?: string

  async prepare(): Promise<boolean> {
    this.gitPath = await io.which("git", true)
    core.debug("Path to git:" + this.gitPath)
    return true
  }

  async init() {
    await this.exec(["init"])
  }

  async getLatestTimestamp(): Promise<Date> {
    const raw = await this.exec(["log", "-1", "--format=%at"])
    // console.log("test:", raw.trim());
    return new Date(parseInt(raw.trim(), 10) * 1000)
  }

  async commit(message: string, allowingEmpty: boolean = false, env: { [key: string]: string }) {
    // TODO: properly shell-quote commit message
    let args = ["commit", "-m", `"${message.replace('"', '\\"')}"`]
    if (allowingEmpty) {
      args.push("--allow-empty")
    }

    // TODO: abstract GIT_{COMMITTER,AUTHOR}_{NAME,EMAIL,DATE} into options in params
    await this.exec(args, env)
  }

  async push() {
    await this.exec(["push"])
  }

  async exec(args: string[], additionalEnv?: { [key: string]: string }): Promise<string> {
    assert(this.gitPath)
    // Ref: https://github.com/actions/checkout/blob/a81bbbf8298c0fa03ea29cdc473d45769f953675/src/git-command-manager.ts#L425

    const env = { ...(process.env as any), ...additionalEnv }
    let stdout: string[] = []

    const options = {
      env,
      listeners: {
        stdout: (data: Buffer) => {
          stdout.push(data.toString())
        },
      },
    }

    // Here ignoreReturnCode is unset, resulting in error raised for non-0 exit code.
    const exitCode = await exec(`"${this.gitPath}"`, args, options)
    assert(exitCode === 0)
    core.debug("stdout: " + stdout)
    return stdout.join("")
  }
}
