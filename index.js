const { createMinionsApp } = require('./app')

global.deploymentState = {}

const app = createMinionsApp()

function validateGithubConfig() {
    app.logger.info(`validating config`);
    var owner = process.env.GITHUB_ORG;
    var repo = process.env.GITHUB_REPONAME;
    var token = process.env.GITHUB_TOKEN;
    if (!(owner && repo && token)) {
        app.logger.error("GITHUB_ORG, GITHUB_REPONAME or GITHUB_TOKEN env not configured, aborting Minions.");
        process.exit(-1);
    }
    app.logger.info(`found GITHUB_ORG ${owner}`);
    app.logger.info(`found GITHUB_REPONAME ${repo}`);
}

function validateSlackConfig() {
    var slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
    var slackBotToken = process.env.SLACK_BOT_TOKEN;
    var slackAppToken = process.env.SLACK_APP_TOKEN;
    if (!(slackSigningSecret && slackBotToken && slackAppToken)) {
        app.logger.error("SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN or SLACK_APP_TOKEN env not configured, aborting Minions.");
        process.exit(-1);
    }
    app.logger.info(`found SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN or SLACK_APP_TOKEN`);
}

function validateRubyConfig() {
    var rubyHome = process.env.RUBY_HOME;
    var rubyPath = process.env.RUBY_PATH;
    var gemHome = process.env.GEM_HOME;
    var gemPath = process.env.GEM_PATH;
    if (!(rubyHome && rubyPath && gemHome && gemPath)) {
        app.logger.error("RUBY_HOME, RUBY_PATH, GEM_HOME, or GEM_PATH env not configured, aborting Minions.");
        process.exit(-1);
    }
    app.logger.info(`found RUBY_HOME ${rubyHome}`);
    app.logger.info(`found RUBY_PATH ${rubyPath}`);
    app.logger.info(`found GEM_HOME ${gemHome}`);
    app.logger.info(`found GEM_PATH ${gemPath}`);
}

function validateManagedConfig() {
    var managedHome = process.env.MANAGED_HOME;
    if (!(managedHome)) {
        app.logger.error("MANAGED_HOME env not configured, aborting Minions.");
        process.exit(-1);
    }
    app.logger.info(`found MANAGED_HOME ${managedHome}`);
}

function validateDeisConfig() {
    var deisHome = process.env.DEIS_HOME;
    if (!(deisHome)) {
        app.logger.error("DEIS_HOME env not configured, aborting Minions.");
        process.exit(-1);
    }
    app.logger.info(`found DEIS_HOME ${deisHome}`);
}

function validateSkipperConfig() {
    var skipperHome = process.env.SKIPPER_HOME;
    if (!(skipperHome)) {
        app.logger.error("SKIPPER_HOME env not configured, aborting Minions.");
        process.exit(-1);
    }
    app.logger.info(`found SKIPPER_HOME ${skipperHome}`);
}

(async () => {
    //validate
    app.logger.info('~(^^)- Minions!');

    validateGithubConfig();
    validateSlackConfig();
    validateRubyConfig();
    validateManagedConfig();
    validateDeisConfig();
    validateSkipperConfig();

    const port = process.env.PORT || 3000;
    app.logger.info(`start listening on ${port}`);
    await app.start(port);
})();
