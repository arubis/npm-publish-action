FROM node:10-slim

RUN apt-get update && \
  apt-get install -y --no-install-recommends git jq

WORKDIR /npm-publish-action
COPY . .
RUN npm install --production

ENTRYPOINT ["/npm-publish-action/entrypoint.sh"]
