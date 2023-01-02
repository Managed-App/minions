# Minions
A SlackBot for ManagedApp

## Development Goals
Deployments are difficult to achieve because access is limited to workstations with a local DEIS acccount. Wrap current
process in a Slackbot

## Feature Ideas
### build/tag Github repo master branch and trigger image build on ECR.
```
/minions tag vnnn
```

### list previously built images
```
/minions images
/minions images vnnn
/minions images latest
```

### deploy release to specified environment.
```
/minions deploy vnnn uat
/minions deploy vnnn prod
```

### allow developers to check currently deployed version for an environment using SlackBot.
```
/minions env uat
/minions env prod
```
