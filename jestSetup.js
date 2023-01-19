const _ = require('lodash')

// Need to define the globals for the testing environment
global.deploymentState = {}
global.setCurrentDeployment = (envName, deployerSlackId, deployerSlackName) => {
    _.set(global.deploymentState, envName, {
        command: 'deploy',
        actor: {
            id: deployerSlackId,
            userName: deployerSlackName
        }
    })
}
global.unsetCurrentDeployment = (envName) => {
    _.unset(global.deploymentState, envName)
}
global.isEnvironmentBusy = (envName) => _.has(global.deploymentState, envName)
