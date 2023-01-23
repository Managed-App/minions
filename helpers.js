const { ConcurrentDeploymentError } = require('./errors')

const attemptDeployToEnv = async (envName, actorSlackName, actorSlackId, deploymentPromiseCallback) => {
    return new Promise((resolve, reject) => {
        if (global.isEnvironmentBusy(envName)) {
            return reject(new ConcurrentDeploymentError(`Env \`${envName}\` deployment triggered by \`${global.deploymentState[envName]['actor']['userName']}\` is in progress, please try again later.`))
        }

        global.setCurrentDeployment(envName, actorSlackId, actorSlackName)

        deploymentPromiseCallback()
            .then(() => resolve())
            .catch((error) => reject(new Error(error)))
            .finally(() => global.unsetCurrentDeployment(envName))
    })
}

module.exports = { attemptDeployToEnv }
