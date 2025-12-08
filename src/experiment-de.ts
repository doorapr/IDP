/**
 * @title LangTask
 * @description Language task to assess word recognition in distorted speech, modulated by a prior sentence stimulus. Includes assessment of prior expectation.
 * @version 0.9.9-german-prior-demo
 *
 * @assets Stimuli/,assets/images,assets/audio/training,assets/text
 * 
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import '@jspsych/plugin-survey/css/survey.css';
import { RunFunction } from "jspsych-builder";
import { run as runBase } from "./experiment.ts";

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 */
export const run: RunFunction = async function run({ assetPaths, input, environment, title, version }) {
  if (!input) {
    input = {};
  }

  input.selected_language = 'de';
  input.prior = false;
  input.training = true;

  return runBase({ assetPaths, input, environment, title, version });
};
