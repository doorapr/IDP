/**
 * @title IDP
 * @description 
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import audioKeyboardResponse from '@jspsych/plugin-audio-keyboard-response';
import audioButtonResponse from '@jspsych/plugin-audio-button-response';
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import SurveyTextPlugin from "@jspsych/plugin-survey-text";
import HtmlSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import { initJsPsych } from "jspsych";


// TODO: Testen mit verschiedenen Browsern und OSs
// TODO: viele Daten -> kann der Browser das handhaben?
// TODO: Einlesen und handeln von randomisation files
// TODO: NACHFRAGEN: Hübscheres CSS

// TODO: Text / Symbol / Fixation Cross während Audio Playback anzeigen, dor
// TODO: Aufnahme & Transcription, dor

// TODO: english / german prompts, beh
// TODO: Tutorial / Anleitung, beh

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 * 
 */
export async function run({ assetPaths, input = {}, environment, title, version, stimulus, record_data }) {
  const jsPsych = initJsPsych();

  const timeline = [];
  var node = {
    timeline: timeline,
    repetitions: 2
  }

  // Preload assets
  timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: assetPaths.audio,
    video: assetPaths.video,

  });

  // Welcome screen
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p>Welcome to IDP!<p/>",
  });
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p>You will now hear an audio.<p/>",
  });
  timeline.push({ // Prior
    type: audioKeyboardResponse,
    stimulus: 'assets/audio/Schimpanse.mp3', // audio file here
    choices: "ALL_KEYS",
    trial_ends_after_audio: true,
    record_data: false // We do not record data here because this is a dummy, also the prior will probably not need to record data.
  });
  timeline.push({ // Clarity
    type: HtmlSliderResponsePlugin,
    stimulus: 'How clearly did you understand the presented word?',
    record_data: record_data
  });
  timeline.push({ // Which word?
    type: SurveyTextPlugin,
    questions: [
      { prompt: 'Which word did you hear?' }
    ],
    record_data: record_data
  });
  timeline.push({ // Confidence
    type: HtmlSliderResponsePlugin,
    stimulus: 'How confident are you that your answer is correct?',
    record_data: record_data
  });





  await jsPsych.run(node);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
}
