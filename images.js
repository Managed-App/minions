const {execSync} = require("child_process");
const {stripAnsi, wrapMarkdownCode} = require("./util");
const {randomSentence} = require("./minions");
const limit = 10;

async function Images(command, ack, respond, log) {
    var imgs = await runSkipperListImages(log);
    await ack();

    var version = command.text.split(" ")[1];
    if (version && version === "latest") {
        imgs = [imgs[0]];
    } else if (version && version.length > 0) {
        imgs = imgs.filter(img => img.includes(version));
    }

    //TODO make this better than hardcoding, maybe add a parameter. 
    if (imgs.length > limit) {
        imgs = imgs.slice(0, limit)
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

    if (imgs.length == 0) {
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
        let fmt = imgs.map((el => {
            return `\`${el.split(" ")[1]}\`, hash \`${el.split(" ")[0]}\``;
        })).join("\n");

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
                    "text": fmt,
                },
            },
        ];
    }
    
    blocks = [...blocks,
        {
            "type": "divider",
        },
    ];

    await respond(
        {
            response_type: "in_channel",
            blocks: blocks
        });
    log.info(`'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`);
}

async function runSkipperListImages(log) {
    let cmd = `${process.env.RUBY_HOME}/ruby bin/skipper images`;
    var resp = execSync(cmd, {
        env: {
            ...process.env,
            PATH: process.env.RUBY_PATH + ":$PATH",
            GEM_PATH: process.env.GEM_PATH,
            GEM_HOME: process.env.GEM_HOME,
        },
        cwd: `${process.env.MANAGED_HOME}`,
    });
    log.debug(`os executed ${cmd}`);
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

module.exports = {Images, runSkipperListImages};
