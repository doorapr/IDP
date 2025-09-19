import AudioKeyboardResponsePlugin from "@jspsych/plugin-audio-keyboard-response";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import { JsPsych, TrialType } from "jspsych";
import Papa, { ParseResult } from "papaparse";



// Fake our own TimelineVariable type because it's not exposed by JsPsych :)
type TimelineVariable = ReturnType<typeof JsPsych.prototype.timelineVariable>;

export function makeSentencePlayback(firstStimulus: TimelineVariable | string, secondStimulus: TimelineVariable | string, setFilenameFunction: (filename: string) => void, jsPsych: JsPsych): Array<TrialType<any>> {
    return [{
      type: HtmlKeyboardResponsePlugin,
      stimulus: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
      choices: "NO_KEYS",
      trial_duration: 300,
      record_data: false
    }, { // Prior (first part of the sentence)
      type: AudioKeyboardResponsePlugin,
      stimulus: firstStimulus,
      choices: "NO_KEYS",
      prompt: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
      trial_ends_after_audio: true,
      record_data: false
    }, {
      type: HtmlKeyboardResponsePlugin,
      stimulus: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
      choices: "NO_KEYS",
      trial_duration: 300,
      record_data: false
    }, { // Stimulus (last word of the sentence + distortion)
      type: AudioKeyboardResponsePlugin,
      stimulus: secondStimulus,
      choices: "NO_KEYS",
      prompt: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
      trial_ends_after_audio: true,
      record_data: false,
      on_finish() {
        const path = (typeof secondStimulus === 'string') ? secondStimulus : jsPsych.evaluateTimelineVariable(secondStimulus.name);
        setFilenameFunction("response_" + path.substr(8).split(".")[0] + ".txt");
      }
    }];
  }

  export async function fetchCsv(csvUrl: string): Promise<Array<unknown>> {
    return new Promise<ParseResult<unknown>>(
      (resolve, reject) =>
        Papa.parse(csvUrl, { download: true, header: true, skipEmptyLines: true, complete: resolve, error: reject })
    )
      .then(results => results.data);
  }