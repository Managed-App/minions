const { exec } = require("child_process");
const util = require('util')
const { ConcurrentDeploymentError } = require('./errors')
const { stripAnsi, wait } = require('./util')

const execPromise = util.promisify(exec)

const attemptDeployToEnv = async (envName, actorSlackName, actorSlackId, deploymentPromiseCallback) => {
    return new Promise((resolve, reject) => {
        if (global.isEnvironmentBusy(envName)) {
            return reject(new ConcurrentDeploymentError(`Env \`${envName}\` deployment triggered by \`${global.deploymentState[envName]['actor']['userName']}\` is in progress, please try again later.`))
        }

        global.setCurrentDeployment(envName, actorSlackId, actorSlackName)

        deploymentPromiseCallback()
            .then(() => resolve())
            .catch((error) => reject(error))
            .finally(() => global.unsetCurrentDeployment(envName))
    })
}

const checkVersionFromReleasesForAPeriod = async (expectedVersion, envName, timeInMilliseconds, logger) => {
    return new Promise(async (resolve, reject) => {
        setTimeout(() => resolve({ isReleased: false }), timeInMilliseconds)

        let isSuccess = false

        for (let i = 0; i < 100; i++) {
            const deployedVersion = await runDeisReleasesList(envName, logger).catch(reject)
            if (deployedVersion === expectedVersion) {
                isSuccess = true
                break
            }
            await wait(3000)
        }

        resolve({ isReleased: isSuccess })
    })
}

const runDeisReleasesList = async (target, log) => {  //needed for ruby2.6.4
    const command = `${process.env.DEIS_HOME}/deis releases:list -a managed-${target}`;
    const stdout = await execPromise(command, {
        env: {
            ...process.env,
            PATH: process.env.RUBY_PATH + ":$PATH",
            GEM_PATH: process.env.GEM_PATH,
            GEM_HOME: process.env.GEM_HOME,
        },
        cwd: `${process.env.MANAGED_HOME}`,
    }).then(res => res.stdout);
    log.debug(`os executed ${command}`);
    var depls = stripAnsi(stdout.toString("utf8")).split("\n");
    depls = depls.filter((line) => line.includes("deployed"));
    const version = depls[0].slice(depls[0].lastIndexOf(":") + 1);
    log.info(`env ${target} running version ${version}`);
    return version;
}

module.exports = { attemptDeployToEnv, checkVersionFromReleasesForAPeriod, runDeisReleasesList }
