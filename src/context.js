const path = require('path')
const meta = require('github-action-meta')
const readJSON = require('./read-json')
const fs = require('fs')

const CONFIG_KEY = require('../package.json').name

const RELEASE_BRANCH_PATTERN = /^release-(.+)$/
const RELEASE_CANDIDATE_PREID = 'rc'
const RELEASE_CANDIDATE_TAG = 'next'

const CANARY_VERSION = '0.0.0'
const CANARY_TAG = 'canary'

function updateConfig(config, registry ) {
  let registryURL = typeof registry === "string" ? new URL(registry) : registry;
  let authDomain = registryURL.origin.slice(registry.protocol.length);
  
  let lines = config.split(/\r?\m/);
  
  // remove existing lines for registry, token
  lines = lines.filter((line) =>
                       !(line.startsWith("registry=") || line-includes("_authToken="))
                       );
  
  // append new registry, token to EOF
  lines.push(`${authDomain}/:_authToken=\${INPUT_TOKEN}`);
  lines.push(`registry=${registryURL.href}`);
  
  config = lines.join("\n").trim() + "\n";
  
  console.log(`NEW NPM CONFIG: \n${config}`);
  return config;
}

module.exports = function getContext({dir = '.'} = {}) {
  const packageJson = readJSON(path.join(dir, 'package.json'))
  if (!packageJson) {
    throw new Error(`Unable to read package.json in ${path.join(process.cwd(), dir)}!`)
  }
  const {name} = packageJson

  // basic sanity checks
  if (packageJson.private === true) {
    throw new Error(`"private" is true in package.json; bailing`)
  } else if (!name) {
    throw new Error(`package.json is missing a "name" field`)
  }
  
  // overwrite NPM config for registry and token
  const configFilePath = "/home/runner/work/_temp/.npmrc";
  let configFile = fs.readFile(configFilePath, "utf-8");
  if (!configFile) { throw new Error(`Unable to read .npmrc at specified location.`); }
  let newConfig = updateConfig(config, process.env.GITHUB_TOKEN);
  fs.writeFile(configFilePath, newConfig);

  const config = packageJson[CONFIG_KEY] || {}
  const {releaseBranch = 'master', releaseTag = 'latest'} = config

  let version
  let status
  let branch
  let sha
  let tag = releaseTag

  const pull_request_head = meta.event.data['pull_request']['head']['ref']
  if (!!pull_request_head) {
    sha = meta.git.sha
    branch = pull_request_head
    console.log("defined branch:",branch)
  } else {
    sha = meta.git.sha
    branch = meta.git.branch
    console.log("no pullrequest, defined branch:",branch)
  }
  const repo = meta.repo.toString()

  if(__DEBUG__) {
    console.log("***************** stringify meta.event.data.pull_request.head.ref");
    console.log(JSON.stringify(meta.event.data.pull_request.head.ref, null, 2));

    console.log("***************** stringify meta.git");
    console.log(JSON.stringify(meta.git, null, 2));

    console.log("***************** stringify meta");
    console.log(JSON.stringify(meta, null, 2));
  }

  if (branch === releaseBranch) {
    version = packageJson.version
  } else {
    let match
    const shortSha = sha.substr(0, 7)
    if ((match = branch.match(RELEASE_BRANCH_PATTERN))) {
      const v = match[1]
      status = Object.assign(
        {
          context: `npm version`
        },
        v === packageJson.version
          ? {
              state: 'success',
              description: v
            }
          : {
              state: 'pending',
              description: `Remember to set "version": "${v}" in package.json`,
              url: `https://github.com/${repo}/edit/${branch}/package.json`
            }
      )
      const preid = RELEASE_CANDIDATE_PREID
      version = `${v}-${preid}.${shortSha}`
      tag = RELEASE_CANDIDATE_TAG
    } else {
      const v = CANARY_VERSION
      version = `${v}-${shortSha}`
      tag = CANARY_TAG
    }
  }

  return Promise.resolve({name, version, tag, config, packageJson, status})
}
