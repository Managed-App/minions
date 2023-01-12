const _ = require('lodash');
const { ConcurrentDeploymentError } = require('./errors');

function stripAnsi(raw) {
    return raw.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function wrapMarkdownCode(raw) {
    return "```" + raw + "```";
}

function wait(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(ms);
        }, ms )
    })
}

const attemptDeployToEnv = async (envName, actorSlackName, actorSlackId, deploymentPromiseCallback) => {
    return new Promise((resolve, reject) => {
        if (_.has(global.deploymentState, envName)) {
            reject(new ConcurrentDeploymentError(`Env ${env} deployment triggered by ${global.deploymentState[envName][user_name]} is in progress, please try again later.`))
        }

        _.set(global.deploymentState, envName, {
            command: 'deploy',
            actor: {
                id: actorSlackId,
                userName: actorSlackName
            }
        })

        deploymentPromiseCallback
            .then(() => _.unset(global.deploymentState, envName))
            .then(() => resolve())
            .catch((error) => reject(new Error(error)))
    })
}

module.exports = {wait, stripAnsi, wrapMarkdownCode, attemptDeployToEnv};
