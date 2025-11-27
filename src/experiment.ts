/**
 * @title LangTask
 * @description Language task to assess word recognition in distorted speech, modulated by a prior sentence stimulus. Includes assessment of prior expectation.
 * @version 0.9.9-demo
 *
 * @assets Stimuli/,assets/images,assets/audio/training,assets/text
 * 
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import PreloadPlugin from "@jspsych/plugin-preload";
import HtmlSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import { DataCollection } from "jspsych";
import '@jspsych/plugin-survey/css/survey.css';
import CallFunctionPlugin from "@jspsych/plugin-call-function";
import BrowserCheckPlugin from "@jspsych/plugin-browser-check";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import { addPercentageToSlider, askPrior, fetchCsv, initializeJsPsychAndLanguage, makeClarityQuestion, makeConfidenceQuestion, makeSentencePlayback, makeWordQuestion } from "./common";
import { RunFunction } from "jspsych-builder";
import { getTrainingTimeline } from "./training";
import { makeConfigureMicrophoneTimeline, makeConfigureSpeakersTimeline } from "./technical-setup";
import Papa from "papaparse";

declare global {
  const jatos: {
    uploadResultFile(obj: Blob | string | object, filename: string, onSuccess?: Function, onError?: Function): Promise<void>,
    submitResultData(obj: object | string, onSuccess?: Function, onError?: Function): Promise<void>,
  };
}

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * 
 */
export const run: RunFunction = async function run({ assetPaths, input, environment, title, version }) {
  if (!input) {
    input = {
      selected_language: 'de',
      training: false,
    };
  }
  const { lang, jsPsych, config } = await initializeJsPsychAndLanguage(input);

  const experimentData = new DataCollection([{}]);

  let filenameForUpload: string;

  const readyNextSentence = [{
    type: HtmlButtonResponsePlugin,
    stimulus: lang['PLANG']['ready-for-next-stimulus'],
    choices: [lang['BUTTONS']['done-button']],
    record_data: false
  }];

  const selected_randomisation: string[] = jsPsych.randomization.sampleWithoutReplacement(config.randomisations, 1)[0];
  console.log("Selected randomisation: ", selected_randomisation);
  jsPsych.data.addProperties({
    selected_randomisation
  });

  const blocks: any[][] = await Promise.all(selected_randomisation.map((block: string) => fetch(`${block}`).then(response => response.text()).then(csv => Papa.parse(csv, {header: true, skipEmptyLines: true}).data)));

  console.log(blocks); 

  var roundIndex = 1;
  const single_trial_timeline: any[] = [];

  // 4 Blöcke â 50 Sätze
  // Preload assets

  single_trial_timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: () => [jsPsych.evaluateTimelineVariable('sentence'), jsPsych.evaluateTimelineVariable('word')],
    record_data: false,
    show_progress_bar: false
  });
  single_trial_timeline.push(readyNextSentence);
  single_trial_timeline.push(...makeSentencePlayback(jsPsych.timelineVariable('sentence'), jsPsych.timelineVariable('word'), filename => filenameForUpload = filename, jsPsych));

  single_trial_timeline.push({
    timeline: [
      makeClarityQuestion(true, lang, () => filenameForUpload),
      ...makeWordQuestion(true, lang, () => filenameForUpload, () => roundIndex),
      makeConfidenceQuestion(true, lang, () => filenameForUpload),
      ...askPrior(true, false, jsPsych, lang, () => filenameForUpload),
    ],

    on_timeline_finish() {
      if (typeof jatos !== 'undefined') {
        jatos.submitResultData(jsPsych.data.get().json()); // send the whole data every time, it's not that big
      }
      roundIndex += 1;
    }
  });

  function getPause(nextBlockSize: number) {
    return {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['pause-stimulus'].replace('$1', nextBlockSize),
      choices: [lang['BUTTONS']['done-button']]
    };
  };

  const final_timeline: any[] = [];
  final_timeline.push({
    type: BrowserCheckPlugin,
    on_finish(data: any) {
      if (data.brower == 'safari') {
        window.alert(lang['browser-exclusion-message']);
        window.close();
      }
    },
    record_data: true
  });
  if (input?.consent) {
    final_timeline.push({
      type: HtmlButtonResponsePlugin,
      stimulus: lang['CONSENT_FORM']['consent-form-titration'],
      choices: [lang['CONSENT_FORM']['consent-button'], lang['CONSENT_FORM']['no-consent-button']],
      on_finish(data: any) {
        if (data.response == 1) { // Rejected
          window.alert(lang['CONSENT_FORM']['did-not-accept-message']);
          window.close();
        }
      }
    });
  }
  final_timeline.push({
    type: FullscreenPlugin,
    message: lang['TECHNICAL_SETTINGS']['fullscreen-message'],
    button_label: lang['BUTTONS']['done-button']
  });
  final_timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: lang['TECHNICAL_SETTINGS']['begin-technical'],
    choices: [lang['BUTTONS']['done-button']],
    record_data: false
  });
  final_timeline.push(makeConfigureSpeakersTimeline(lang, config));
  final_timeline.push(makeConfigureMicrophoneTimeline(jsPsych, lang));
  if (input.survey_questions) {
    final_timeline.push(
      { // Speaker intensity
        type: HtmlSliderResponsePlugin,
        stimulus: lang['TECHNICAL_SETTINGS']['speaker-intensity'],
        button_label: lang['BUTTONS']['done-button'],
        record_data: true,
        labels: lang['TECHNICAL_SETTINGS']['speaker-intensity-labels'],
        require_movement: true,
        //slider_width: 600,
        on_load: addPercentageToSlider,
        on_finish(data: any) {
          experimentData.addToAll({ speaker_intensity: data.response });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experimentData.csv(), "experiment_data.csv");
          }
        }
      });
  }
  if (input?.training) {
    final_timeline.push(...getTrainingTimeline(jsPsych, lang, config, assetPaths.images));
  }
  final_timeline.push({
    type: CallFunctionPlugin,
    func() {
      experimentData.addToAll({ start_time: jsPsych.getStartTime().toISOString() });

      if (typeof jatos !== 'undefined') {
        jatos.uploadResultFile(experimentData.csv(), "experiment_data.csv");
      }
    }
  });
  final_timeline.push({
    type: CallFunctionPlugin,
    func() {
      document.getElementsByTagName("html")[0].classList.add("task3");
    }
  });
  final_timeline.push({
    timeline: [
      ...(blocks.map((block, index) => (
        [
          {
            timeline: single_trial_timeline,
            timeline_variables: block,
            randomize_order: true
          },
          ...(index < blocks.length - 1 ? [getPause(blocks[index + 1]!.length)] : [])
        ]
      )))
    ]
  });

  final_timeline.push({
    type: CallFunctionPlugin,
    func() {
      document.getElementsByTagName("html")[0].classList.remove("task3");
    }
  });
  if (input.survey_questions) {
    final_timeline.push(
      { // Concentration
        type: HtmlSliderResponsePlugin,
        stimulus: lang['POST_SURVEY']['concentration-question'],
        button_label: lang['BUTTONS']['done-button'],
        record_data: true,
        labels: lang['POST_SURVEY']['concentration-labels'],
        require_movement: true,
        //slider_width: 600,
        on_load: addPercentageToSlider,
        on_finish(data: any) {
          experimentData.addToAll({ concentration: data.response });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experimentData.csv(), "experiment_data.csv");
          }
        }
      });
    final_timeline.push(
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['POST_SURVEY']['self-report-random'],
        choices: [lang['BUTTONS']["yes-button"], lang['BUTTONS']["no-button"]],
        on_finish(data: any) {
          experimentData.addToAll({ random: data.response == 0 });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experimentData.csv(), "experiment_data.csv");
          }
        }
      });
    final_timeline.push(
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['POST_SURVEY']['self-report-honest'],
        choices: [lang['BUTTONS']["yes-button"], lang['BUTTONS']["no-button"]],
        on_finish(data: any) {
          experimentData.addToAll({ honest: data.response == 0 });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experimentData.csv(), "experiment_data.csv");
          }
        }
      });
    final_timeline.push(
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['POST_SURVEY']['self-report-headphones'],
        choices: [lang['BUTTONS']["yes-button"], lang['BUTTONS']["no-button"]],
        on_finish(data: any) {
          experimentData.addToAll({ headphones: data.response == 0 });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experimentData.csv(), "experiment_data.csv");
          }
        }
      });
    final_timeline.push(
      { // Quietness of environment
        type: HtmlSliderResponsePlugin,
        stimulus: lang['POST_SURVEY']['quietness-question'],
        button_label: lang['BUTTONS']['done-button'],
        record_data: true,
        labels: lang['POST_SURVEY']['quietness-labels'],
        require_movement: true,
        //slider_width: 600,
        on_load: addPercentageToSlider,
        on_finish(data: any) {
          experimentData.addToAll({ quietness: data.response });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experimentData.csv(), "experiment_data.csv");
          }
        }
      });
    final_timeline.push(
      { // Disruptiveness
        type: HtmlSliderResponsePlugin,
        stimulus: lang['POST_SURVEY']['disruptiveness-question'],
        button_label: lang['BUTTONS']['done-button'],
        record_data: true,
        labels: lang['POST_SURVEY']['disruptiveness-labels'],
        require_movement: true,
        //slider_width: 600,
        on_load: addPercentageToSlider,
        on_finish(data: any) {
          experimentData.addToAll({ disruptiveness: data.response });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experimentData.csv(), "experiment_data.csv");
          }
        }
      });
  }
  final_timeline.push(
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['TITRATION']['end-titration-final'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false
    }
  );

  await jsPsych.run(final_timeline);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
};
