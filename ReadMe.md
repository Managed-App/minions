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
/minions env uat deploy vnnn
/minions env prod deploy vnnn
```

### allow developers to check currently deployed version for an environment using SlackBot.
```
/minions env uat
/minions env prod
```

## Deployment
The app runs on [CircleCI](https://circleci.com/) for CI/CD. The deployment is triggered by changes pushed into either the `master` branch or `dev` branch and will run the tests then deploy the changes into their respective environments.
