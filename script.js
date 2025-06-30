let papa = require('papaparse')
let fs = require('node:fs')

let csvString = fs.readFileSync("assets/text/titration_random.csv", {encoding: "utf-8"})
let dataArray = papa.parse(csvString, { header: true, skipEmptyLines: true }).data;

for (const word of dataArray) {
    for (const channel of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
        for (const direction of ["original", "reversed"]) {
            if (!fs.statSync("assets/audio/titration/" + direction + "_" + word.syllables + "_" + word.Target_word + "_" + channel + ".wav").isFile()) {
                console.log("assets/audio/titration/" + direction + "_" + word.syllables + "_" + word.Target_word + "_" + channel + ".wav")
            }
        }
    }
}