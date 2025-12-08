import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import { askPrior, Configuration, focusButton, makeClarityQuestion, makeConfidenceQuestion, makeSentencePlayback, makeWordQuestion, TranslationMap } from "./common";
import { JsPsych } from "jspsych";

export function getTrainingTimeline(jsPsych: JsPsych, lang: TranslationMap, config: Configuration, imagePaths: string[], prior: boolean) {
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
      on_load: focusButton,
      record_data: false
    },
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['explanation-pre-playback'],
      choices: [lang['BUTTONS']['done-button']],
      on_load: focusButton,
      record_data: false
    },
    ...makeSentencePlayback(config.training[0].prior, config.training[0].word, () => { }, jsPsych),
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['explanation-post-playback'],
      choices: [lang['BUTTONS']['done-button']],
      on_load: focusButton,
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
      on_load: focusButton,
      require_movement: true
    },
    {
      timeline: [
        ...makeSentencePlayback(config.training[1].prior, config.training[1].word, () => "", jsPsych),

        makeClarityQuestion(false, lang, () => ""),
        ...makeWordQuestion(false, lang, () => "", () => 0),
        makeConfidenceQuestion(false, lang, () => ""),
        ...askPrior(true, true, jsPsych, lang, () => ""),

        ...makeSentencePlayback(config.training[2].prior, config.training[2].word, () => "", jsPsych),

        makeClarityQuestion(false, lang, () => ""),
        ...makeWordQuestion(false, lang, () => "", () => 0),
        makeConfidenceQuestion(false, lang, () => ""),
        ...askPrior(true, true, jsPsych, lang, () => ""),

        ...makeSentencePlayback(config.training[3].prior, config.training[3].word, () => "", jsPsych),

        makeClarityQuestion(false, lang, () => ""),
        ...makeWordQuestion(false, lang, () => "", () => 0),
        makeConfidenceQuestion(false, lang, () => ""),
        ...askPrior(true, true, jsPsych, lang, () => ""),
      ]
    },
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['end-of-tutorial'],
      choices: [lang['BUTTONS']['done-button']],
      on_load: focusButton,
      record_data: false,
      require_movement: true
    }
  ];
}