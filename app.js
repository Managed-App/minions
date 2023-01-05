const {App, LogLevel} = require('@slack/bolt');
const {listImages, createGithubArtefacts} = require('./commands.js');
const {randomSentence} = require("./minions");
const {wrapMarkdownCode} = require("./util");
const {showEnv} = require("./commands");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    logLevel: LogLevel.DEBUG,
    // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
    // you still need to listen on some port!
    port: process.env.PORT || 3000
});

app.command('/minions', async ({ command, ack, respond }) => {
    var stem = command.text.split(" ")[0];
    switch (stem) {
        case "env":
            await env(command, ack, respond, app.logger);
            break;
        case "images":
            await images(command, ack, respond, app.logger);
            break;
        case "image":
            await images(command, ack, respond, app.logger);
            break
        case "tag":
            await tag(command, ack, respond, app.logger);
            break;
        case "help":
            await help(command, ack, respond, app.logger);
            break;
        default:
            await help(command, ack, respond, app.logger);
            break;
    }// Acknowledge command request
});

async function env(command, ack, respond, log) {
    var target = command.text.split(" ")[1];
    await ack();

    if (target && (target === "uat" || target === "prod")) {
        var result = await showEnv(target, log);
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
                        "text": `${wrapMarkdownCode(result)}`
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

async function images(command, ack, respond, log) {
    var imgs = listImages(log);

    var version = command.text.split(" ")[1];
    if (version && version==="latest") {
        imgs = [imgs[0]];
    } else if (version && version.length>0) {
        imgs = imgs.filter(img => img.includes(version));
    }
    if (imgs.length==0) {
        imgs = [`no images found for '${version}'`]
    }
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
                    "text": `${wrapMarkdownCode(imgs.join("\n"))}`
                },
            },
        ]
    });
    log.info(`'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`);
}

async function tag(command, ack, respond, log) {
    const version = command.text.split(" ")[1];
    if (version && version.length >0) {
        const gh = await createGithubArtefacts(app, version, log);
        if (gh) {
            await ack();
            await respond(wrapMarkdownCode(`master revision tagged and release created on github ${txt.split(" ")[1]}`));
            log.info(`'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`);
        } else {
            await respond(wrapMarkdownCode(`command failed`));
            log.warn(`'/minions ${command.text}' command failed for ${command.user_name} in channel ${command.channel_name}`);
        }

    } else {
        await help(command, ack, respond, log);
    }
}

async function help(command, ack, respond, log) {
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
    app.logger.info(`'/minions help' command executed for ${command.user_name} in channel ${command.channel_name}`);
}

function validateGithubConfig() {
    app.logger.info(`validating config`);
    var owner = process.env.GITHUB_ORG;
    var repo = process.env.GITHUB_REPONAME;
    if (!(owner || repo)) {
        log.error("GITHUB_ORG or GITHUB_REPONAME env not configured, aborting Minions ");
        process.exit(-1);
    }
    app.logger.info(`found GITHUB_ORG ${owner}`);
    app.logger.info(`found GITHUB_REPONAME ${repo}`);
}

function validateSlackConfig() {
    var slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
    var slackBotToken = process.env.SLACK_BOT_TOKEN;
    var slackAppToken = process.env.SLACK_APP_TOKEN;
    if (!(slackSigningSecret || slackBotToken || slackAppToken)) {
        log.error("SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN or SLACK_APP_TOKEN env not configured, aborting Minions ");
        process.exit(-1);
    }
    app.logger.info(`found SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN or SLACK_APP_TOKEN`);
}

function validateRubyConfig() {
    var rubyPath = process.env.RUBY_PATH;
    var gemHome = process.env.GEM_HOME;
    var gemPath = process.env.GEM_PATH;
    if (!(rubyPath || gemHome || gemPath)) {
        log.error("RUBY_PATH, GEM_HOME, or GEM_PATH env not configured, aborting Minions ");
        process.exit(-1);
    }
    app.logger.info(`found RUBY_PATH ${rubyPath}`);
    app.logger.info(`found GEM_HOME ${gemHome}`);
    app.logger.info(`found GEM_PATH ${gemPath}`);
}

function validateManagedConfig() {
    var managedHome = process.env.MANAGED_HOME;
    if (!(managedHome)) {
        log.error("MANAGED_HOME env not configured, aborting Minions ");
        process.exit(-1);
    }
    app.logger.info(`found MANAGED_HOME ${managedHome}`);
}

function validateDeisConfig() {
    var deisHome = process.env.DEIS_HOME;
    if (!(deisHome)) {
        log.error("DEIS_HOME env not configured, aborting Minions ");
        process.exit(-1);
    }
    app.logger.info(`found DEIS_HOME ${deisHome}`);
}

(async () => {
    //validate
    app.logger.info('~(^^)- Minions!');

    validateGithubConfig();
    validateSlackConfig();
    validateRubyConfig();
    validateManagedConfig();
    validateDeisConfig();

    const port = process.env.PORT || 3000;
    app.logger.info(`start listening on ${port}`);
    await app.start(port);
})();
