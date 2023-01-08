const {randomSentence, blockify} = require("./minions");
const {wrapMarkdownCode} = require("./util");

async function Help(command, ack, respond, log) {
    const commands = [
        "/minions env uat               show deployed version on uat.",
        "/minions env prod              show deployed version on prod.",
        "/minions env uat deploy vnnn   deploy verson vnnn to uat.",
        "/minions env prod deploy vnnn  deploy verson vnnn to prod.",
        "/minions tag vnnn              create image with tag vnnn on ECR.",
        "/minions images                list recent images on ECR.",
        "/minions images vnnn           filter for a specific image on ECR",
        "/minions images latest         show the latest image on ECR",
        "/minions hello                 bananas!",
        "/minions help                  show this message."
    ];

    await ack();
    await respond(blockify(wrapMarkdownCode(commands.join("\n"))));
    log.info(`'/minions help' command executed for ${command.user_name} in channel ${command.channel_name}`);
}

module.exports = {Help};
