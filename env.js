const {exec, execSync} = require("child_process");
const {stripAnsi, wait, attemptDeployToEnv} = require("./util");
const { ConcurrentDeploymentError } = require('./errors');
const {blockify, blockifyForChannel} = require("./minions");
const {Help} = require("./help");
const uatAdminLink = "https://managed-uat.man.redant.com.au/admin";
const prodAdminLink = "https://go.managedapp.com.au/admin"
async function Env(client, command, ack, respond, log) {
    var cs = command.text.split(" ")
    await ack();
    if (cs.length == 2) {
        var target = cs[1];

        if (target && (target === "uat" || target === "prod")) {
            var result = await runDeisReleasesList(target, log);

            await respond(blockifyForChannel(`Managed env \`${target}\` (${target=='uat'?uatAdminLink:prodAdminLink}) running version \`${result}\` `));
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

        attemptDeployToEnv(target, command.user_name, command.user_id, async () => {
            await respond(blockifyForChannel(`Beginning deployment for \`${target}\` env, version \`${version}\`. ETA ~7m.`));

            var result = await runSkipperDeploy(target, version, respond, log);
            log.info(`'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`);

            return result
        })
        .catch(error => {
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

async function runDeisReleasesList(target, log) {  //needed for ruby2.6.4
    const command = `cd ${process.env.MANAGED_HOME} && ${process.env.DEIS_HOME}/deis releases:list -a managed-${target}`;
    const resp = execSync(command, {
        env: {
            ...process.env,
            PATH: process.env.RUBY_PATH + ":$PATH",
            GEM_PATH: process.env.GEM_PATH,
            GEM_HOME: process.env.GEM_HOME,
        },
    });
    log.debug(`os executed ${command}`);
    var depls = stripAnsi(resp.toString("utf8")).split("\n");
    depls = depls.filter((line) => line.includes("deployed"));
    const version = depls[0].slice(depls[0].lastIndexOf(":") + 1);
    log.info(`env ${target} running version ${version}`);
    return version;
}

async function runSkipperDeploy(target, version, respond, log) {
    const command = `${process.env.RUBY_HOME}/ruby bin/skipper deploy managed:${version} --group managed-${target}`;
    const resp = execSync(command, {
            env: {
                ...process.env,
                PATH: process.env.RUBY_PATH + ":" + process.env.PATH,
                RUBY_PATH: process.env.RUBY_PATH,
                GEM_PATH: process.env.GEM_PATH,
                GEM_HOME: process.env.GEM_HOME,
                RUBY_VERSION: "ruby-2.6.4",
            },
            cwd: `${process.env.MANAGED_HOME}`,
        });
    log.debug(`os executed ${command} stdout: ${resp}`);

    let success = false;
    for (let i = 0; i < 100; i++) {
        const deployedVersion = await runDeisReleasesList(target, log);
        if (deployedVersion === version) {
            success = true;
            break;
        }
        await wait(3000);
    }

    let logAndRespond = async (msg) => {
        log.info(msg);
        await respond(blockifyForChannel(msg));
    }
    if (success) {
        await logAndRespond(`Deployment complete for \`${target}\` env , version \`${version}\`.`);
    } else {
        await logAndRespond(`Uh oh, deployment incomplete for \`${target}\` env , version \`${version}\`. Check results with \`/minions env\``);
    }

    return success;
}

module.exports = {Env};
