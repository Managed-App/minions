const {execSync} = require("child_process");
const {stripAnsi, wrapMarkdownCode} = require("./util");
const {randomSentence} = require("./minions");

async function Env(command, ack, respond, log) {
    var target = command.text.split(" ")[1];
    await ack();

    if (target && (target === "uat" || target === "prod")) {
        var result = await runDeisReleasesList(target, log);
        await respond({
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
    } else {

        log.warn(`'/minions ${command.text}' command failed for ${command.user_name} in channel ${command.channel_name}`);
        await respond(`'/minions ${command.text}' invalid, try 'uat' | 'prod' for env`);
    }

}

async function runDeisReleasesList(target, log) {  //needed for ruby2.6.4
    const resp = execSync(`cd ${process.env.MANAGED_HOME} && ${process.env.DEIS_HOME}/deis releases:list -a managed-${target}`, {
        env: {
            ...process.env,
            PATH: process.env.RUBY_PATH + ":$PATH",
            GEM_PATH: process.env.GEM_PATH,
            GEM_HOME: process.env.GEM_HOME,
        }
    });
    var depls = stripAnsi(resp.toString("utf8")).split("\n");
    depls = depls.filter((line) => line.includes("deployed"));
    const version = depls[0].slice(depls[0].lastIndexOf(":") + 1);
    log.info(`env ${target} running version ${version}`);
    return version;
}

module.exports = {Env};
