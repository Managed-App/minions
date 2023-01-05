const {randomSentence} = require("./minions");
const {wrapMarkdownCode} = require("./util");

async function Help(command, ack, respond, log) {
    const commands = [
        "/minions env uat           show deployed versions on uat env on EKS.",
        "/minions env prod          show deployed versions on prod env on EKS.",
        "/minions tag vnnn          create docker image with tag vnnn on ECR.",
        "/minions tag vnnn          create docker image with tag vnnn on ECR.",
        "/minions images            list docker images on ECR.",
        "/minions images vnnn       filter for a specific image on ECR",
        "/minions images latest     show the latest image on ECR",
        "/minions help              show this message."
    ];

    await ack();
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
                    "text": wrapMarkdownCode(commands.join("\n")),
                },
            },
        ]
    });
    log.info(`'/minions help' command executed for ${command.user_name} in channel ${command.channel_name}`);
}

module.exports = {Help};
