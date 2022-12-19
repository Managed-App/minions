# Minions
A SlackBot for ManagedApp

## Development Goals
Deployments are difficult to achieve because access is limited to workstations with a local DEIS acccount. Wrap current
process in a Slackbot

## Feature Ideas

merge PRs on the managed repo.
`/merge branchname`

build/tag Github repo master branch to trigger image build. 
`/image create`

list previously built images
`/image list`

deploy release to specified environment.
`/image vnnn deploy uat`
`/image vnnn deploy prod`

release PRs on the managed repo.
`/release branchname uat`
`/release branchname prod`

allow developers to check currently deployed version for an environment using SlackBot.
`/env uat`
`/env prod`
