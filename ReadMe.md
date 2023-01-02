# Minions
A SlackBot for ManagedApp

## Development Goals
Deployments are difficult to achieve because access is limited to workstations with a local DEIS acccount. Wrap current
process in a Slackbot

## Feature Ideas

### build/tag Github repo master branch to trigger image build. 
`/minions image create`

### list previously built images
`/minions images`
`/minions image vnnn`

### deploy release to specified environment.
```
/minions image vnnn deploy uat
/minions image vnnn deploy prod
```

### allow developers to check currently deployed version for an environment using SlackBot.
```
/minions env uat
/minions env prod
```
