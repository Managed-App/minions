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

function randomSentence() {
    var i = Math.floor(Math.random()*minionese.length);
    return minionese[i];
}

module.exports = {randomSentence};
