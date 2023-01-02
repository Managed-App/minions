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
            await images(command.text, ack, respond);
            break;
        case "image":
            await images(command.text, ack, respond);
            break
        case "tag":
            await tag(command.text, ack, respond);
            break;
        case "help":
            await help(ack, respond);
            break;
        default:
            await help(ack, respond);
            break;
    }// Acknowledge command request
});

async function images(txt, ack, respond) {
    var imgs = listImages().split("\n");

    var version = txt.split(" ")[1];
    if (version && version.length>0) {
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
                    "text": `${wrapCode(imgs.join("\n"))}`
                },
            },
        ]
    });
}

async function tag(txt, ack, respond) {
    await ack();
    await respond(`image tagged ${txt.split(" ")[1]}`);
}

async function help(ack, respond) {
    const commands = [
        "/minions image vnnn          create a new docker image with tag vnnn.",
        "/minions images              shows managed's successfully built docker images.",
        "/minions images vnnn         filter for a specific image",
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
