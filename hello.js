const {randomSentence, blockify} = require("./minions");

async function Hello(command, ack, respond, log) {
    await ack();
    await respond(
        {
            response_type: "in_channel",
            blocks: [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `${randomSentence()}`
                    },
                },
                {
                    "type": "image",
                    "title": {
                        "type": "plain_text",
                        "text": "Bob"
                    },
                    "block_id": "bob",
                    "image_url": "https://i0.wp.com/princetonbuffer.princeton.edu/wp-content/uploads/sites/185/2015/10/minions_2015-wide.jpg?resize=672%2C372&ssl=1",
                    "alt_text": "Bob"
                },
                {
                    "type": "divider",
                },
            ]
        });
    log.info(`'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`);
}

module.exports = {Hello};
