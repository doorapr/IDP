import AudioButtonResponsePlugin from "@jspsych/plugin-audio-button-response";
import AudioKeyboardResponsePlugin from "@jspsych/plugin-audio-keyboard-response";
import HtmlAudioResponsePlugin from "@jspsych/plugin-html-audio-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import InitializeMicrophonePlugin from "@jspsych/plugin-initialize-microphone";
import { JsPsych } from "jspsych";
import { Configuration, TranslationMap } from "./common";

export function makeConfigureSpeakersTimeline(lang: TranslationMap, config: Configuration) {
  return {
    timeline: [
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['TECHNICAL_SETTINGS']['speaker-check'],
        choices: [lang['BUTTONS']['done-button']],
        record_data: false
      },
      { // Prior (first part of the sentence)
        type: AudioKeyboardResponsePlugin,
        stimulus: config.audio_test,
        choices: "NO_KEYS",
        prompt: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
        trial_ends_after_audio: true,
        record_data: false
      },
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['TECHNICAL_SETTINGS']['speaker-check-restart'],
        choices: [lang['BUTTONS']['yes-button'], lang['BUTTONS']['no-button']]
      }
    ],
    loop_function(data: any) {
      return data.values()[0].response == 1;
    }
  };
}

export function makeConfigureMicrophoneTimeline(jsPsych: JsPsych, lang: TranslationMap) {
  return {
    timeline: [
      {
        type: InitializeMicrophonePlugin,
        button_label: lang['TECHNICAL_SETTINGS']['mic-select-button'],
        device_select_message: lang['TECHNICAL_SETTINGS']['mic-select-text'],
        record_data: false
      },
      {
        type: HtmlAudioResponsePlugin,
        stimulus: lang['TECHNICAL_SETTINGS']['mic-test'] + "<img class=\"main-symbol\" src='assets/images/microphone2.png'>",
        done_button_label: lang['BUTTONS']['done-button'],
        recording_duration: 7500,
        record_data: true,
        save_audio_url: true
      },
      {
        timeline: [{
          type: AudioButtonResponsePlugin,
          stimulus: () => {
            const last_trial_data = jsPsych.data.getLastTrialData().values()[0];
            return last_trial_data.audio_url || last_trial_data.stimulus;
          },
          on_load() {
            const content = document.getElementById('jspsych-content');
            content?.replaceChildren(content.children[1], content.children[0]); // make the text appear on top of the buttons, this only works in this specific case. YAGNI.
          },
          prompt: lang['TECHNICAL_SETTINGS']['recording-check'],
          choices: [lang['TECHNICAL_SETTINGS']['change-microphone-button'], lang['TECHNICAL_SETTINGS']['listen-again-button'], lang['BUTTONS']['done-button']]
        }],
        loop_function(data: any) {
          if (data.values()[0].response == 1) { // if listen again is pressed, listen again
            return true;
          } else { // if listen again is not pressed, revoke the URL object to save RAM
            URL.revokeObjectURL(data.values()[0].stimulus);
            return false;
          }
        }
      }
    ],
    loop_function(data: any) { // if change microphone is pressed, loop the whole thing
      return data.last(1).values()[0].response == 0;
    }
  }
}