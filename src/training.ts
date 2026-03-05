import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import { askPrior, Configuration, focusButton, focusButtonByMutationObserver, getReadyNext, makeClarityQuestion, makeConfidenceQuestion, makeSentencePlayback, makeWordQuestion, TranslationMap } from "./common";
import { JsPsych } from "jspsych";
import HtmlAudioResponsePlugin from "@jspsych/plugin-html-audio-response";

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
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['word-question'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false
    },
    { // Which word was understood?
      type: HtmlAudioResponsePlugin,
      stimulus: "<img class=\"main-symbol\" src='assets/images/microphone2.png'></img>",
      recording_duration: null,
      show_done_button: true,
      done_button_label: lang['BUTTONS']['done-button'],
      on_start: () => {
        const container = document.querySelector<HTMLElement>('.jspsych-content');

        if (container == null) {
          console.error("Expected a container with class 'jspsych-content', but found none. RUH ROH.");
          return;
        }

        const observer = new MutationObserver(event => {
          event.find(e => {
            if (e.addedNodes.length > 0) {
              const buttons = document.querySelectorAll<HTMLButtonElement>('.jspsych-btn');
              if (buttons.length == 1) {
                buttons[0].disabled = true;
                setTimeout(() => {
                  buttons[0].disabled = false;
                }, 2500);
              } else {
                console.error(`Expected 1 button, but found ${buttons.length}. RUH ROH.`);
              }
              return true;
            }
          });

          observer.disconnect();
        });

        observer.observe(container, { childList: true });
      },
      record_data: false,
    },
    {
      timeline: [{
        type: HtmlButtonResponsePlugin,
        stimulus: lang['PLANG']['explanation-post-recording'],
        choices: [lang['BUTTONS']['done-button']],
        on_load: focusButton,
        record_data: false,
      }],
      conditional_function: () => 'explanation-post-recording' in lang['PLANG']
    },
    makeConfidenceQuestion(false, lang, () => ""),
    ...(prior ? askPrior(true, true, jsPsych, lang, () => "") : []),
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
        ...getReadyNext(lang),
        ...makeSentencePlayback(config.training[1].prior, config.training[1].word, () => "", jsPsych),

        makeClarityQuestion(false, lang, () => ""),
        ...makeWordQuestion(false, lang, () => "", () => 0),
        makeConfidenceQuestion(false, lang, () => ""),
        ...(prior ? askPrior(true, true, jsPsych, lang, () => "") : []),

        ...getReadyNext(lang),
        ...makeSentencePlayback(config.training[2].prior, config.training[2].word, () => "", jsPsych),

        makeClarityQuestion(false, lang, () => ""),
        ...makeWordQuestion(false, lang, () => "", () => 0),
        makeConfidenceQuestion(false, lang, () => ""),
        ...(prior ? askPrior(true, true, jsPsych, lang, () => "") : []),

        ...getReadyNext(lang),
        ...makeSentencePlayback(config.training[3].prior, config.training[3].word, () => "", jsPsych),

        makeClarityQuestion(false, lang, () => ""),
        ...makeWordQuestion(false, lang, () => "", () => 0),
        makeConfidenceQuestion(false, lang, () => ""),
        ...(prior ? askPrior(true, true, jsPsych, lang, () => "") : []),
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