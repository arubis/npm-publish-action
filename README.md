# npm-publish-action

This [GitHub Action][github actions] publishes to npm with the following conventions:

| branch | version | tag |
| :----- | :------ | :-- |
| `master` | from `package.json` | `latest` |
| `release-<version>` | `<version>-rc.<sha>` | `next` |
| all others | `0.0.0-<sha>` | `canary` |

...where `<sha>` is the 7-character SHA of the head commit ref.

## Status checks

Depending on the branch, a series of [statuses][status checks] will be created by this action in your checks: **publish** is the action's check, and **publish {package-name}** is a [commit status] created by the action that reports the version published and links to `unpkg.com` via "Details":

![image](https://user-images.githubusercontent.com/113896/52375286-23368980-2a14-11e9-8974-062a3e45a846.png)

If you're on a release branch (`release-<version>`) and the `<version>` portion of the branch name doesn't match the `version` field in `package.json`, you'll get a pending status reminding you to update it:

![image](https://user-images.githubusercontent.com/113896/52388530-b63ae800-2a43-11e9-92ef-14ec9459c109.png)

## Usage

1. Add an [actions/setup-node](https://github.com/actions/setup-node) step to your workflow. If you have one already, ensure that the `registry-url` input is set (e.g. to `https://registry.npmjs.org`) so that this action can populate your `.npmrc` with authentication info:

   ```yaml
   - uses: actions/setup-node@master
     with:
       version: 12
       registry-url: 'https://registry.npmjs.org'
   ```

2. Add this action later in your workflow. I suggest that you place this action after any linting and/or testing actions to catch as many errors as possible before publishing.

   ```yaml
   - uses: shawnbot/npm-publish-action@master
     env:
       GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
       # NOTE: use the NODE_ prefix instead of NPM_ here!
       NODE_AUTH_TOKEN: ${{ secrets.NPM_AUTH_TOKEN }}
   ```

That's it!

[github actions]: https://github.com/features/actions
[commit status]: https://developer.github.com/v3/repos/statuses/
[status checks]: https://help.github.com/articles/about-status-checks/
