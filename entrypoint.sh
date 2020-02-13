#!/bin/bash
set -e

# configure git with sensible defaults
git config --global user.email "${GIT_USER_EMAIL:-$(jq -r .pusher.email $GITHUB_EVENT_PATH)}"
git config --global user.name "${GIT_USER_NAME:-$(jq -r .pusher.name $GITHUB_EVENT_PATH)}"

sh -c "$(dirname $0)/cli.js $*"
