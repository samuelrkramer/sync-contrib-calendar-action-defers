import { GitController } from "../src/git";

test("getLatestTimestamp", async () => {
  const git = new GitController();
  await git.init();
  const timestamp = await git.getLatestTimestamp();
  expect(timestamp >= new Date(0)).toBeTruthy();
});
