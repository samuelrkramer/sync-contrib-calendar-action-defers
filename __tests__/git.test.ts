import { GitController } from "../src/git"

test("getLastAuthorDate", async () => {
  // TODO: create temporary repo
  const git = await GitController.createAsync(process.cwd())
  await git.init()
  const timestamp = await git.getLastAuthorDate()
  expect(timestamp >= new Date(0)).toBeTruthy()
})
