import path from "path"
import * as core from "@actions/core"
import * as io from "@actions/io"
import { exec, ExecOptions } from "@actions/exec"
import { assert, timeStamp } from "console"

// class GitController
export class GitController {
  private inited = false
  private repoPath: string
  private gitPath?: string

  constructor(repoPath: string) {
    this.repoPath = repoPath
  }

  static async createAsync(repoPath: string, allowingNotInited = false): Promise<GitController> {
    const controller = new GitController(repoPath)
    core.debug("Repo path: " + repoPath)
    await controller.prepare()
    return controller
  }

  async prepare(allowingNotInited = false) {
    this.gitPath = await io.which("git", true)
    core.debug("Git path: " + this.gitPath)
    let isGitRoot = true
    try {
      isGitRoot = await this.isTopLevel()
      this.inited = true
    } catch (e) {
      if (!allowingNotInited) {
        throw e
      }
    }
    if (!isGitRoot) {
      throw Error(`${this.repoPath} is not a root of a git repository`)
    }
    core.debug(`Inited: ${this.inited}`)
  }

  async configUser(name?: string, email?: string) {
    assert(this.gitPath);
    if (name !== undefined) {
      await this.exec(["config", "user.name", name]);
    }
    if (email !== undefined) {
      await this.exec(["config", "user.email", email]);
    }
  }

  async init() {
    assert(this.gitPath)
    await this.exec(["init"])
  }

  private async isTopLevel() {
    const topLevel = await this.getTopLevel() // .../.git
    console.log("Repo toplevel: " + path.resolve(topLevel))
    return path.resolve(topLevel) === path.resolve(this.repoPath)
  }

  private async getTopLevel(): Promise<string> {
    const raw = await this.exec(["rev-parse", "--show-toplevel"])
    return raw.trim()
  }

  async getLatestTimestamp(): Promise<Date> {
    assert(this.inited)
    if (parseInt((await this.exec(["rev-list", "--all", "--count"])).trim(), 10) === 0) {
      return new Date(-1)
    }
    return new Date(parseInt((await this.exec(["log", "-1", "--format=%at"])).trim(), 10) * 1000)
  }


  async commit(message: string, allowingEmpty: boolean = false, env: { [key: string]: string }) {
    assert(this.inited)
    // TODO: properly shell-quote commit message
    let args = ["commit", "-m", `"${message.replace('"', '\\"')}"`]
    if (allowingEmpty) {
      args.push("--allow-empty")
    }

    // TODO: abstract GIT_{COMMITTER,AUTHOR}_{NAME,EMAIL,DATE} into options in params
    await this.exec(args, env)
  }

  async push() {
    assert(this.inited)
    await this.exec(["push"])
  }

  async exec(args: string[], additionalEnv?: { [key: string]: string }): Promise<string> {
    // Ref: https://github.com/actions/checkout/blob/a81bbbf8298c0fa03ea29cdc473d45769f953675/src/git-command-manager.ts#L425

    const env = { ...(process.env as any), ...additionalEnv }
    let stdout: string[] = []

    const options = {
      cwd: this.repoPath,
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
