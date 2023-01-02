function stripAnsi(raw) {
    return raw.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function wrapMarkdownCode(raw) {
    return "```" + raw + "```";
}

module.exports = {stripAnsi, wrapMarkdownCode};
