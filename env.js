const {exec, execSync} = require("child_process");
const {stripAnsi, wait} = require("./util");
const {randomSentence, blockify} = require("./minions");
const {Help} = require("./help");

async function Env(app, command, ack, respond, log) {
    var cs = command.text.split(" ")
    await ack();
    if (cs.length == 2) {
        var target = cs[1];

        if (target && (target === "uat" || target === "prod")) {
            var result = await runDeisReleasesList(target, log);
            await respond({
                response_type: "in_channel",
                blocks: blockify(`Managed env \`${target}\` running version \`${result}\``)
            });
            log.info(`'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`);
            return result;
        } else {
            log.warn(`'/minions ${command.text}' command failed for ${command.user_name} in channel ${command.channel_name}`);
            await respond(
                {
                    response_type: "in_channel",
                    text: `'/minions ${command.text}' invalid, try 'uat' | 'prod' for env`
                });
        }
    } else if (cs.length == 4) {
        const target = cs[1];
        const action = cs[2];
        if (action !== "deploy") {
            await Help(command, ack, respond, log);
            return;
        }
        const version = cs[3];

        await respond({
            response_type: "in_channel",
            blocks: blockify(`Beginning deployment for \`${target}\` env, version \`${version}\`. ETA ~7m.`)
        });
        var result = await runSkipperDeploy(target, version, respond, log);
        log.info(`'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`);
    } else {
        await Help(command, ack, respond, log);
    }
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
    const command = `cd ${process.env.MANAGED_HOME} && ${process.env.SKIPPER_HOME}/skipper deploy managed:${version} --group managed-${target}`;
    const resp = execSync(command, {
            env: {
                ...process.env,
                PATH: process.env.RUBY_PATH + ":$PATH",
                GEM_PATH: process.env.GEM_PATH,
                GEM_HOME: process.env.GEM_HOME,
            },
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
        await respond({
            response_type: "in_channel",
            text: msg,
        });
    }
    if (success) {
        await logAndRespond(`Deployment complete for \`${target}\` env , version \`${version}\`.`);
    } else {
        await logAndRespond(`Uh oh, deployment incomplete for \`${target}\` env , version \`${version}\`. Check results with \`/minions env\``);
    }

    return success;
}

module.exports = {Env};
