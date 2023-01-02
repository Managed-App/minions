const {App} = require('@slack/bolt');
const {listImages} = require('./commands.js');
const {randomSentence} = require("./minions");

// Initializes your app with your bot token and signing secret
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    // Socket Mode doesn't listen on a port, but in case you want your app to respond to OAuth,
    // you still need to listen on some port!
    port: process.env.PORT || 3000
});

app.command('/minions', async ({ command, ack, respond }) => {
    var stem = command.text.split(" ")[0];
    switch (stem) {
        case "images":
            await images(ack, respond);
            break;
        case "image":
            var cmdlen = command.text.split(" ").length;
            if (cmdlen == 2) {
                await image(command.text, ack, respond);
            } else {
                await help(ack, respond);
            }
            break;
        case "help":
            await help(ack, respond);
            break;
        default:
            await help(ack, respond);
            break;
    }// Acknowledge command request
});

async function images(ack, respond) {
    var imgs = listImages();
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
                    "text": `${wrapCode(imgs)}`
                },
            },
        ]
    });
}

async function image(txt, ack, respond) {
    var version = txt.split(" ")[1];

    var imgs = listImages().split("\n");
    imgs = imgs.filter(img => img.includes(version));

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
                    "text": `${wrapCode(imgs.join("\n"))}`
                },
            },
        ]
    });
}

async function help(ack, respond) {
    const commands = [
        "/minions images              shows managed's successfully built docker images.",
        "/minions image vnnn          filter for a specific image",
        "/minions help                show this message."
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
                    "text": "```"+commands.join("\n")+"```"
                },
            },
        ]
    });
}

function wrapCode(raw) {
    return "```" + raw + "```";
}

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');
})();
