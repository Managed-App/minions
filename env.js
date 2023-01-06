const {exec, execSync} = require("child_process");
const {stripAnsi, wait} = require("./util");
const {randomSentence} = require("./minions");
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
                blocks: [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `${randomSentence()}`
                        },
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `managed env \`${target}\` running version \`${result}\``
                        },
                    },
                ]
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
            text: `env \`${target}\` beginning deployment`,
        });
        var result = await runSkipperDeploy(target, version, log);
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
    log.info(`os executed ${command}`);
    var depls = stripAnsi(resp.toString("utf8")).split("\n");
    depls = depls.filter((line) => line.includes("deployed"));
    const version = depls[0].slice(depls[0].lastIndexOf(":") + 1);
    log.info(`env ${target} running version ${version}`);
    return version;
}

async function runSkipperDeploy(target, version, log) {
    const command = `cd ${process.env.MANAGED_HOME} && ${process.env.SKIPPER_HOME}/skipper deploy managed:${version} --group managed-${target}`;
    const resp = execSync(command, {
            env: {
                ...process.env,
                PATH: process.env.RUBY_PATH + ":$PATH",
                GEM_PATH: process.env.GEM_PATH,
                GEM_HOME: process.env.GEM_HOME,
            },
        });
    log.info(`os executed ${command} stdout: ${resp}`);

    let success = false;
    for (let i = 0; i < 100; i++) {
        const deployedVersion = await runDeisReleasesList(target, log);
        if (deployedVersion === version) {
            success = true;
            break;
        }
        await wait(3000);
    }
    if (success) {
        await respond({
            response_type: "in_channel",
            text: `env \`${target}\` deployment \`${version}\` complete`
        });
        log.info(`env \'${target}\' deployment \'${version}\' complete.`);
    } else {
        await respond({
            response_type: "in_channel",
            text: `env \`${target}\` deployment \`${version}\` incomplete`
        });
        log.info(`env \'${target}\' deployment \'${version}\' incomplete. Check results with \`/minions env\``);
    }

    return success;
}

module.exports = {Env};
