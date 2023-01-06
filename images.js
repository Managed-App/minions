const {execSync} = require("child_process");
const {stripAnsi, wrapMarkdownCode} = require("./util");
const {randomSentence} = require("./minions");

async function Images(command, ack, respond, log) {
    var imgs = await runSkipperListImages(log);

    var version = command.text.split(" ")[1];
    if (version && version==="latest") {
        imgs = [imgs[0]];
    } else if (version && version.length>0) {
        imgs = imgs.filter(img => img.includes(version));
    }

    //TODO make this better than hardcoding
    if (imgs.length > 25) {
        imgs = imgs.slice(0, 25)
    }

    let blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `${randomSentence()}`
            },
        }
    ];

    if (imgs.length==0) {
        blocks = [...blocks,
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `No images matching your filter`
                },
            },
        ];
    } else {
        blocks = [...blocks,
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `These are the most recent \`${imgs.length}\` images matching your filter`
                },
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `${wrapMarkdownCode(imgs.join("\n"))}`
                },
            },
        ];
    }

    await ack();
    await respond(
        {
            response_type: "in_channel",
            blocks: blocks
        });
    log.info(`'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`);
}

async function runSkipperListImages(log) {
    var resp = execSync("cd " + process.env.MANAGED_HOME + " && bin/skipper images", {
        env: {
            ...process.env,
            PATH: process.env.RUBY_PATH + ":$PATH",
            GEM_PATH: process.env.GEM_PATH,
            GEM_HOME: process.env.GEM_HOME,
        }
    });
    resp = stripAnsi(resp.toString("utf8")).split("\n").sort(
        (a, b) => {
            if (a.split(" ")[1] > b.split(" ")[1]) {
                return -11;
            } else {
                return 1;
            }
        }
    );
    log.info(`${resp.length} images found`);
    return resp;
}

module.exports = {Images};
