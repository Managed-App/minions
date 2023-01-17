const {App, LogLevel} = require('@slack/bolt');
const {Tag} = require('./tag.js');
const {Env} = require('./env.js');
const {Images} = require('./images.js');
const {Help} = require('./help.js');
const {Hello} = require("./hello");
const { blockifyForChannel } = require('./minions.js');

const createMinionsApp = (receiver) =>  {
    const app = new App({
        name: "Minions",
        developerMode: true,
        token: process.env.SLACK_BOT_TOKEN,
        signingSecret: process.env.SLACK_SIGNING_SECRET,
        socketMode: !receiver, // can't use socket mode with a custom receiver
        appToken: process.env.SLACK_APP_TOKEN,
        logLevel: LogLevel.DEBUG,
        receiver: receiver,
        // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
        // you still need to listen on some port!
        port: process.env.PORT || 3000
    })

    app.command('/minions', async ({ command, ack, respond, client }) => {
        await ack()
        await respond(blockifyForChannel(`\`/minions ${command.text}\` [${command.user_name}]`))
    
        var stem = command.text.split(" ")[0];
        switch (stem) {
            case "env":
                await Env(client, command, ack, respond, app.logger);
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
            case "hello":
                await Hello(command, ack, respond, app.logger);
                break;
            case "help":
                await Help(command, ack, respond, app.logger);
                break;
            default:
                await Help(command, ack, respond, app.logger);
                break;
        }
    })

    return app
}

module.exports = { createMinionsApp }
