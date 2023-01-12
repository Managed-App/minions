const minionese = [
    'Pōlä nōlä matōkä!',
    'Hello papageéna, tú le bélla cón la papaja!',
    'Terima kasih!',
    'Tulaliloo ti amo!',
    'Gelato!',
    'Kanpai!',
    'Pwede na!',
    'Para tu!',
    'Hana, dul, sae!',
    'Poulet tiki masala!',
    'Et pis c’est tout!'
];

const energy = [
    '⚡',
    '💡',
    '⚛',
    '🍌',
    '💛'
];

function randomSentence() {
    var i = Math.floor(Math.random() * minionese.length);
    return randomEnergy() + " " + minionese[i];
}

function randomEnergy() {
    var i = Math.floor(Math.random() * energy.length);
    return energy[i];
}

function blockifyForChannel(msg) {
    return {
        response_type: "in_channel",
        blocks: blockify(msg)
    }
}

function blockify(msg) {
    return [
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
                "text": msg,
            },
        },
        {
            "type": "divider",
        },
    ]
}

module.exports = {randomSentence, blockify, blockifyForChannel};
