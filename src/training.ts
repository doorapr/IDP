/**
 * @title LangTaskTraining
 * @description Training for the language task described in langtask.ts; this training is its separate module because it may not be needed and study designers may want to include it in varying places in the study e.g. before or after any intake questionnaires.
 * @version 0.9.9-demo
 *
 * @assets assets/images,assets/audio/training,assets/text
 * 
 */

import { JsPsych } from "jspsych";
import { RunFunction } from "jspsych-builder";

/**
 * 
 * @type {import("jspsych-builder").RunFunction}
 */
export const run: RunFunction = async function({ assetPaths, input, environment, title, version }) {
    return new JsPsych();
}