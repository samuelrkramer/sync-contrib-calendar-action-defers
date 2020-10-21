[![Build and Test](https://github.com/Gowee/sync-contrib-calendar-action/workflows/Build%20and%20Test/badge.svg)](https://github.com/Gowee/sync-contrib-calendar-action/actions)

# Sync Contrib Calendar Action
(WIP) A :octocat:GitHub 🔀action that helps grabs activities from GitLab, LeetCode, etc., to populate the contribution calendar graph on GitHub. 

*Only LeetCode is supported currently.*

## What it actually does?
For every contribution/activity on other platforms, it accordingly creates an emtpy commit to light (or deepen the color of) a little square on the contribution graph.

## Setup
To setup this action, create a new empty repository and activate the action by applying the following <abbr title="Minimum Viable Product">MVP</abbr> workflow (e.g. into `.github/workflows/sync-leetcode.yml`). After that, manually trigger the workflow in the Action tab. 
<!-- For a complete workflow example, refers to examples/sync-leetcode.yml -->

```yml
on: 
  workflow_dispatch

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
      with:
        fetch-depth: 0
    - uses: gowee/sync-contrib-calendar-action@v0.0.1-alpha
      with:
        leetcode_username: <USERNAME>
```

## Notes
### Security
The action has access to the the [GitHub token](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token) provided automatically by the GitHub Action runtime, so that to push commits without requiring manual configuration.
Outgoing requests are made only to fetch actitivies from data sources such as GitLab.
But be reminded that the software is provided as-is, with NO WARRANTY. 

### Caveat
The action is still under heavy development and have all its functions unstable with few test cases, which, in the worst cases, may result in tons of repeated commits unexpectedly.
It is strongly recommended to create a new repository for the action to work separately.
