const _ = require('lodash');

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

const attemptDeployToEnv = async (envName, actorName, deploymentPromiseCallback) => {
    return new Promise((resolve, reject) => {
        if (_.has(global.deploymentState, envName)) {
            reject(`Env ${env} deployment triggered by ${global.deploymentState[envName][user]} is in progress, please try again later.`)
        }

        _.set(global.deploymentState, envName, { command: 'deploy', user: actorName })

        deploymentPromiseCallback
            .then(() => _.unset(global.deploymentState, envName))
            .then(() => resolve())
            .catch((error) => reject(error))
    })
}

module.exports = {wait, stripAnsi, wrapMarkdownCode, attemptDeployToEnv};
