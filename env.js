const {exec} = require("child_process");
const util = require('util')
const { wait } = require("./util");
const { attemptDeployToEnv, checkVersionFromReleasesForAPeriod, runDeisReleasesList } = require('./helpers')
const { ConcurrentDeploymentError, DeploymentIncompleteError } = require('./errors');
const {blockify, blockifyForChannel} = require("./minions");
const {Help} = require("./help");
const uatAdminLink = "https://managed-uat.man.redant.com.au/admin";
const prodAdminLink = "https://go.managedapp.com.au/admin"

const execPromise = util.promisify(exec)

async function Env(client, command, ack, respond, log) {
    var cs = command.text.split(" ")
    await ack();
    if (cs.length == 2) {
        var target = cs[1];

        if (target && (target === "uat" || target === "prod")) {
            var result = await runDeisReleasesList(target, log);

            await respond(blockifyForChannel(`Managed env \`${target}\` (${target=='uat'?uatAdminLink:prodAdminLink}) running version \`${result}\``));
            log.info(`'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`);
            return result;
        } else {
            log.warn(`'/minions ${command.text}' command failed for ${command.user_name} in channel ${command.channel_name}`);
            await respond(blockifyForChannel(`'/minions ${command.text}' invalid, try 'uat' | 'prod' for env`));
        }
    } else if (cs.length == 4) {
        const target = cs[1];
        const action = cs[2];
        if (action !== "deploy") {
            await Help(command, ack, respond, log);
            return;
        }
        const version = cs[3];

        attemptDeployToEnv(target, command.user_name, command.user_id, async () =>
            respond(blockifyForChannel(`Beginning deployment for \`${target}\` env, version \`${version}\`. ETA ~7m.`))
                .then(() => runSkipperDeploy(target, version, respond, log))
                .then(() => log.info(`'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`))
        )
        .catch(async error => {
            if (Object.getPrototypeOf(error) === Error.prototype) {
                return respond(blockifyForChannel(`An unexpected error occurred: \`${error.message}\``))
            }

            if (error instanceof ConcurrentDeploymentError) {
                messageCurrentDeployerAboutAttemptedDeployment(client, target, command.user_name)
            }

            respond(blockifyForChannel(error.message))
        })
    } else {
        await Help(command, ack, respond, log);
    }
}

const messageCurrentDeployerAboutAttemptedDeployment = async (client, envName, attemptedDeployerName) => {
    return client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: global.deploymentState[envName]['actor']['id'],
        blocks: blockify(`blocked ${attemptedDeployerName} from deploying to ${envName} while job is in progress.`)
    })
}

async function runSkipperDeploy(target, version, respond, log) {
    return new Promise((resolve, reject) => {
        const command = `${process.env.RUBY_HOME}/ruby bin/skipper deploy managed:${version} --group managed-${target}`;
        execPromise(command, {
            env: {
                ...process.env,
                PATH: process.env.RUBY_PATH + ":" + process.env.PATH,
                RUBY_PATH: process.env.RUBY_PATH,
                GEM_PATH: process.env.GEM_PATH,
                GEM_HOME: process.env.GEM_HOME,
                RUBY_VERSION: "ruby-2.6.4",
            },
            cwd: `${process.env.MANAGED_HOME}`,
        })
            .then(resp => log.debug(`os executed ${command} stdout: ${resp.stdout}`))
            .then(async () => {
                let isSuccess = false;
                for (let i = 0; i < 100; i++) {
                    const deployedVersion = await runDeisReleasesList(target, log);
                    if (deployedVersion === version) {
                        isSuccess = true;
                        break;
                    }
                    await wait(3000);
                }

                return isSuccess
            })
            .then(async isSuccess => {
                log.info(`Deployment for ${target}, version ${version} is ${isSuccess ? 'complete' : 'incomplete'}`)

                if (isSuccess) {
                    await respond(blockifyForChannel(`Deployment complete for \`${target}\` env , version \`${version}\`.`))
                } else {
                    throw new DeploymentIncompleteError(`Uh oh, deployment incomplete for \`${target}\` env , version \`${version}\`. Check results with \`/minions env\``)
                }

                return isSuccess
            })
            .then(isSuccess => resolve(isSuccess))
            .catch(error => {
                reject(error)
            })
    })
}

module.exports = {Env};
