/**
 * @title LangTaskTraining
 * @description Training for the language task described in langtask.ts; this training is its separate module because it may not be needed and study designers may want to include it in varying places in the study e.g. before or after any intake questionnaires.
 * @version 0.9.9-demo
 *
 * 
 */

import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import { RunFunction } from "jspsych-builder";
import { askPrior, Configuration, initializeJsPsychAndLanguage, makeClarityQuestion, makeConfidenceQuestion, makeSentencePlayback, makeWordQuestion, TranslationMap } from "./common";
import { JsPsych } from "jspsych";

export function getTrainingTimeline(jsPsych: JsPsych, lang: TranslationMap, config: Configuration, imagePaths: string[]) {
  return [
    {
      type: PreloadPlugin,
      images: imagePaths,
      audio: config.training.flatMap(item => [item.prior, item.word]),
      record_data: false,
      show_progress_bar: false,
    },
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['begin-training-session'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false
    },
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['explanation-pre-playback'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false
    },
    ...makeSentencePlayback(config.training[0].prior, config.training[0].word, () => { }, jsPsych),
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['explanation-post-playback'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false
    },
    ...makeSentencePlayback(config.training[0].prior, config.training[0].word, () => { }, jsPsych),
    makeClarityQuestion(false, lang, () => ""),
    ...makeWordQuestion(false, lang, () => "", () => 0),
    makeConfidenceQuestion(false, lang, () => ""),
    ...askPrior(true, true, jsPsych, lang, () => ""),
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['end-of-first-tutorial-sentence'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false,
      require_movement: true
    },
    {
      timeline: [
        ...makeSentencePlayback(jsPsych.timelineVariable('sentence'), jsPsych.timelineVariable('word'), () => "", jsPsych),

        makeClarityQuestion(false, lang, () => ""),
        ...makeWordQuestion(false, lang, () => "", () => 0),
        makeConfidenceQuestion(false, lang, () => ""),
        ...askPrior(true, true, jsPsych, lang, () => ""),
      ],
      timeline_variables: [
        {
          sentence: config.training[1].prior,
          word: config.training[1].word
        },
        {
          sentence: config.training[2].prior,
          word: config.training[2].word
        },
        {
          sentence: config.training[3].prior,
          word: config.training[3].word
        }
      ]
    },
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['end-of-tutorial'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false,
      require_movement: true
    }
  ];
}

/**
 * 
 */
export const run: RunFunction = async function ({ assetPaths, input, environment, title, version }) {

  const { jsPsych, lang, config } = await initializeJsPsychAndLanguage(input);

  jsPsych.run(getTrainingTimeline(jsPsych, lang, config, assetPaths.images));

  return jsPsych;
};