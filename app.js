const {App, LogLevel} = require('@slack/bolt');
const {Tag} = require('./tag.js');
const {Env} = require('./env.js');
const {Images} = require('./images.js');
const {Help} = require('./help.js');

const app = new App({
    name: "Minions",
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
            await Env(app, command, ack, respond, app.logger);
            break;
        case "images":
            await Images(command, ack, respond, app.logger);
            break;
        case "image":
            await Images(command, ack, respond, app.logger);
            break
        case "tag":
            await Tag(command, ack, respond, app.logger);
            break;
        case "help":
            await Help(command, ack, respond, app.logger);
            break;
        default:
            await Help(command, ack, respond, app.logger);
            break;
    }
});



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
