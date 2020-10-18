import { GitController } from "../src/git"

test("getLatestTimestamp", async () => {
  // TODO: create temporary repo
  const git = new GitController(process.cwd())
  await git.init()
  const timestamp = await git.getLatestTimestamp()
  expect(timestamp >= new Date(0)).toBeTruthy()
})
