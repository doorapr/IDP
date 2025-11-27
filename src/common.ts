import AudioKeyboardResponsePlugin from "@jspsych/plugin-audio-keyboard-response";
import HtmlAudioResponsePlugin from "@jspsych/plugin-html-audio-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import HtmlSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
import { initJsPsych, JsPsych, TrialType } from "jspsych";
import Papa, { ParseResult } from "papaparse";



// Fake our own TimelineVariable type because it's not exposed by JsPsych :)
type TimelineVariable = ReturnType<typeof JsPsych.prototype.timelineVariable>;

export type Configuration = {
  translation: string;
  randomisations: string[][]; // Array of block file names, e.g. [["block1a.csv", "block1b.csv"], ["block2a.csv", "block2b.csv"]]
  training: {prior: string, word: string}[];
  audio_test: string;
}

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

export async function initializeJsPsychAndLanguage({ selected_language }: { selected_language: string; }): Promise<{ lang: TranslationMap; jsPsych: JsPsych; config: Configuration; }> {
  const jsPsych = initJsPsych();

  jsPsych.data.addProperties({ selected_language });
  const config: Configuration = await fetch(`assets/text/config/${selected_language}.json`).then(response => response.json());
  const lang = await fetch(config.translation).then(response => response.json());
  return { lang, jsPsych, config };
}

export type TranslationMap = {
  [key: string]: any;
};

export function makeClarityQuestion(recordData: boolean, lang: TranslationMap, getFilenameForUpload: () => string) {
  return { // Clarity
    type: HtmlSliderResponsePlugin,
    stimulus: lang['PLANG']['clarity-question'],
    button_label: lang['BUTTONS']['done-button'],
    record_data: recordData,
    labels: lang['PLANG']['clarity-labels'],
    require_movement: true,
    //slider_width: 600,
    on_load: addPercentageToSlider,
    on_finish(data: any) {
      if (!recordData) { return; }
      data.fileName = getFilenameForUpload();
      data.type = "clarity";
    }
  };
}

export function makeConfidenceQuestion(recordData: boolean, lang: TranslationMap, getFilenameForUpload: () => string) {
  return { // Confidence
    type: HtmlSliderResponsePlugin,
    stimulus: lang['PLANG']['confidence-question'],
    button_label: lang['BUTTONS']['done-button'],
    record_data: recordData,
    labels: lang['PLANG']['confidence-labels'],
    require_movement: true,
    //slider_width: 600,
    on_load: addPercentageToSlider,
    on_finish(data: any) {
      if (!recordData) { return; }
      data.fileName = getFilenameForUpload();
      data.type = "confidence";
    }
  };
}

export function makeWordQuestion(recordData: boolean, lang: TranslationMap, getFilenameForUpload: () => string, getRoundIndex: () => number) {
  return [{
    type: HtmlButtonResponsePlugin,
    stimulus: lang['PLANG']['word-question'],
    choices: [lang['BUTTONS']['done-button']],
    record_data: false
  }, { // Which word was understood?
    type: HtmlAudioResponsePlugin,
    stimulus: "<img class=\"main-symbol\" src='assets/images/microphone2.png'></img>",
    recording_duration: 7500,
    show_done_button: true,
    done_button_label: lang['BUTTONS']['done-button'],
    record_data: recordData,
    on_finish(data: any) {
      if (recordData) {
        const filenameForUpload = getFilenameForUpload();
        if (typeof jatos !== 'undefined') {
          const roundIndex = getRoundIndex();
          jatos.uploadResultFile(data.response, filenameForUpload)
            .then(() => {
              data.response = filenameForUpload;
              data.fileName = filenameForUpload;
              data.roundIndex = roundIndex;
              data.type = "mic_input"; // Remove response data from RAM, we already saved it to the server.
            })
            .catch(); // Cancel experiment? Try Again?
        } else {
          data.response = filenameForUpload; // Remove response data from RAM, we are in a developer session and don't care
        }
      }
    }
  }];
}

export function addPercentageToSlider(): void {
  const slider = document.getElementById('jspsych-html-slider-response-response');

  if (slider == null || !(slider instanceof HTMLInputElement)) {
    console.error("Expected a slider with id 'jspsych-html-slider-response-response', but found none.");
    return;
  }

  slider.oninput = () => {
    const span = document.getElementById('slider-value');

    if (span == null) {
      console.error("Expected a span with id 'slider-value', but found none.");
      return;
    }

    span.textContent = `${slider.value}%`;
  };
}

function makeWordQuestionPrior(recordData: boolean, lang: TranslationMap, getFilenameForUpload: () => string) {
    return [
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['PLANG']['word-question-prior'],
        choices: [lang['BUTTONS']['done-button']],
        record_data: false,
      }, { // Which word was understood?
        type: HtmlAudioResponsePlugin,
        stimulus: "<img class=\"main-symbol\" src='assets/images/microphone2.png'></img>",
        recording_duration: 7500,
        show_done_button: true,
        done_button_label: lang['BUTTONS']['done-button'],
        record_data: recordData,
        on_finish(data: any) {
          if (recordData) {
            const priorFilename = "prior_" + getFilenameForUpload();
            if (typeof jatos !== 'undefined') {
              jatos.uploadResultFile(data.response, priorFilename)
                .then(() => {
                  data.response = priorFilename; // Remove response data from RAM, we already saved it to the server.
                  data.fileName = getFilenameForUpload();
                  data.type = "prior_input";
                })
                .catch();
            } else {
              data.response = priorFilename; // Remove response data from RAM, we are in a developer session and don't care
              data.fileName = getFilenameForUpload();
              data.type = "prior_input";
            }
          }
        }
      },
      { // Expectation confidence
        type: HtmlSliderResponsePlugin,
        stimulus: lang['PLANG']['expectation-question'],
        button_label: lang['BUTTONS']['done-button'],
        record_data: recordData,
        labels: lang['PLANG']['expectation-labels'],
        require_movement: true,
        //slider_width: 600,
        on_load: addPercentageToSlider,
        on_finish(data: any) {
          if (!recordData) { return; }
          data.fileName = getFilenameForUpload();
          data.type = "expectation_confidence";
        }
      }];
  }

export function askPrior(recordData: boolean, isInTraining: boolean, jsPsych: JsPsych, lang: TranslationMap, getFilenameForUpload: () => string): any[] {
  return [{
    type: HtmlButtonResponsePlugin,
    stimulus: lang['PLANG']['word-question-prior-question'],
    choices: [lang['BUTTONS']['yes-button'], lang['BUTTONS']['no-button'], lang['BUTTONS']['not-understood']],
    record_data: recordData,
    on_finish(data: any) {
      data.type = "prior_expectation";
      data.fileName = getFilenameForUpload();
      if (isInTraining) {
        data.training = "true";
      }
    }
  },
  { 
    timeline: makeWordQuestionPrior(recordData, lang, getFilenameForUpload),
    record_data: true,
    conditional_function: function () {
      const data = jsPsych.data.get().last(1).values()[0];
      if (data.response == 0) {
        return false;
      } else {
        return true;
      }
    }
  }];
}
