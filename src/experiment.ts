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
import { DataCollection, initJsPsych } from "jspsych";
import '@jspsych/plugin-survey/css/survey.css';
import CallFunctionPlugin from "@jspsych/plugin-call-function";
import BrowserCheckPlugin from "@jspsych/plugin-browser-check";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import { addPercentageToSlider, askPrior, fetchCsv, focusButton, getReadyNext, initializeJsPsych, initializeJsPsychAndLanguage, initializeLanguage, makeClarityQuestion, makeConfidenceQuestion, makeSentencePlayback, makeWordQuestion } from "./common";
import { RunFunction } from "jspsych-builder";
import { getTrainingTimeline } from "./training";
import { makeConfigureMicrophoneTimeline, makeConfigureSpeakersTimeline } from "./technical-setup";
import Papa from "papaparse";
import AudioButtonResponsePlugin from "@jspsych/plugin-audio-button-response";

declare global {
  const jatos: {
    uploadResultFile(obj: Blob | string | object, filename: string, onSuccess?: Function, onError?: Function): Promise<void>,
    submitResultData(obj: object | string, onSuccess?: Function, onError?: Function): Promise<void>,
  };
}

/**
 * If jatos is defined, upload the experiment data as a CSV file
 * to "experiment_data.csv".
 * 
 * @param experimentData 
 */
function updateExperimentData(experimentData: DataCollection) {
  if (typeof jatos !== 'undefined') {
    jatos.uploadResultFile(experimentData.csv(), "experiment_data.csv");
  }
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
      training: true,
    };
  }

  // timeout handling
  let warningHandler: number | undefined = undefined;
  let killHandler: number | undefined = undefined;

  const { lang, config } = await initializeLanguage(input);

  const settings = {
    on_trial_start() {
      // set a 4 minute timeout
      warningHandler = window.setTimeout(() => {
        window.alert(lang['timeout-warning']);
      }, 4 * 60 * 1000);
      killHandler = window.setTimeout(() => {
        window.alert(lang['timeout-exceeded']);
        window.close();
      }, 5 * 60 * 1000);
    },
    on_trial_finish() {
      window.clearTimeout(warningHandler);
      warningHandler = undefined;
      window.clearTimeout(killHandler);
      killHandler = undefined;
    },
  }

  const jsPsych = await initializeJsPsych(input, settings);

  const experimentData = new DataCollection([{}]);

  let filenameForUpload: string;

  const selected_randomisation: string[] = jsPsych.randomization.sampleWithoutReplacement(config.randomisations, 1)[0];
  console.log("Selected randomisation: ", selected_randomisation);
  jsPsych.data.addProperties({
    selected_randomisation
  });

  let blocks: any[][] = await Promise.all(selected_randomisation.map((block: string) => fetch(`${block}`).then(response => response.text()).then(csv => Papa.parse(csv, { header: true, skipEmptyLines: true }).data)));

  if (config.randomize_blocks) {
    blocks = jsPsych.randomization.shuffle(blocks);
  }

  console.log(blocks);

  var roundIndex = 1;
  const single_trial_timeline: any[] = [];

  // 4 Blöcke â 50 Sätze
  // Preload assets

  single_trial_timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: () => ['Stimuli/' + jsPsych.evaluateTimelineVariable(config.prior_stimulus_column), 'Stimuli/' + jsPsych.evaluateTimelineVariable(config.word_stimulus_column)],
    record_data: false,
    show_progress_bar: false
  });
  single_trial_timeline.push(getReadyNext(lang));
  single_trial_timeline.push(...makeSentencePlayback(jsPsych.timelineVariable(config.prior_stimulus_column), jsPsych.timelineVariable(config.word_stimulus_column), filename => filenameForUpload = filename, jsPsych));

  single_trial_timeline.push({
    timeline: [
      makeClarityQuestion(true, lang, () => filenameForUpload),
      ...makeWordQuestion(true, lang, () => filenameForUpload, () => roundIndex),
      makeConfidenceQuestion(true, lang, () => filenameForUpload),
      ...(input.prior ? askPrior(true, false, jsPsych, lang, () => filenameForUpload) : []),
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
      choices: [lang['BUTTONS']['done-button']],
      on_load: focusButton
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
  if ('WELCOME_PAGE' in lang) {
    final_timeline.push({
      type: AudioButtonResponsePlugin,
      stimulus: config.audio_welcome,
      prompt: lang['WELCOME_PAGE']['welcome'],
      choices: [lang['BUTTONS']['done-button']],
      on_load() {
        const content = document.getElementById('jspsych-content');
        const rest = []
        for (let i = 1; i < (content?.children.length ?? 0); i++) {
          if (content?.children[i])
            rest.push(content.children[i]);
        }
        content?.replaceChildren(...rest, content.children[0]); // make the text appear on top of the buttons, this only works in this specific case. YAGNI.
        focusButton();
      },
      record_data: false
    });
  }
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
    button_label: lang['BUTTONS']['done-button'],
    on_load: focusButton,
  });
  final_timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: lang['TECHNICAL_SETTINGS']['begin-technical'],
    choices: [lang['BUTTONS']['done-button']],
    on_load: focusButton,
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

          updateExperimentData(experimentData);
        }
      });
  }
  if (input?.training) {
    final_timeline.push(...getTrainingTimeline(jsPsych, lang, config, assetPaths.images, input.prior));
  }
  final_timeline.push({
    type: CallFunctionPlugin,
    func() {
      experimentData.addToAll({ start_time: jsPsych.getStartTime().toISOString() });

      updateExperimentData(experimentData);
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

          updateExperimentData(experimentData);
        }
      });
    final_timeline.push(
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['POST_SURVEY']['self-report-random'],
        choices: [lang['BUTTONS']["yes-button"], lang['BUTTONS']["no-button"]],
        on_finish(data: any) {
          experimentData.addToAll({ random: data.response == 0 });

          updateExperimentData(experimentData);
        }
      });
    final_timeline.push(
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['POST_SURVEY']['self-report-honest'],
        choices: [lang['BUTTONS']["yes-button"], lang['BUTTONS']["no-button"]],
        on_finish(data: any) {
          experimentData.addToAll({ honest: data.response == 0 });

          updateExperimentData(experimentData);
        }
      });
    final_timeline.push(
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['POST_SURVEY']['self-report-headphones'],
        choices: [lang['BUTTONS']["yes-button"], lang['BUTTONS']["no-button"]],
        on_finish(data: any) {
          experimentData.addToAll({ headphones: data.response == 0 });

          updateExperimentData(experimentData);
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

          updateExperimentData(experimentData);
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

          updateExperimentData(experimentData);
        }
      });
  }

  await jsPsych.run(final_timeline);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
};
