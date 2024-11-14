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
import InstructionsPlugin from "@jspsych/plugin-instructions";
import HtmlSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import initializeMicrophone from '@jspsych/plugin-initialize-microphone';
import htmlAudioResponse from '@jspsych/plugin-html-audio-response';
import { initJsPsych } from "jspsych";

// TODO: Testen mit verschiedenen Browsern und OSs
// TODO: viele Daten -> kann der Browser das handhaben?
// TODO: Einlesen und handeln von randomisation files
// TODO: NACHFRAGEN: Hübscheres CSS

// TODO: Aufnahme & Transcription, dor

const langs = {
  "en": {
    "title": "Language Task",
    "welcome-and-mic-select-text": "<h1>Welcome to this language based task.</h1><p>Since your verbal input will be required during the experiment, please grant the site access to your microphone and select the device you want to use.</p>",
    "welcome-and-mic-select-button": "Select this device.",
    "word-response-stimulus": "<p>Which word did you understand at the end of the sentence?</p>",
    "done-button": "Done",
    "word-question": "<p>Please repeat the last word of the sentence you just heard.</p>",
    "clarity-question": "<p>How clearly did you understand the presented word?</p>",
    "confidence-question": "<p>How confident are you that your answer is correct?</p>",
    "instructions": {
      "pages": [
        `<p>In the following pages the basic procedure of the experiment will be explained. You will then have the opportunity to practice three times on example sentences. Then the actual experiment will begin.</p>
        <p>The task revolves around how you understand the last word of a sentence. First, you will hear the start of a sentence.</p>
        <p>Then, after a short pause, you will hear the final word of the sentence, with a higher or lower distortion. This is supposed to imitate noises that keep you from hearing the word clearly. A real example of this would be that you're at the bus stop, trying to listen to a story your friend is telling you. At a crucial moment a car right next to you honks its horn, preventing you from understanding what your friend said cleary.</p>
        <p>After you've heard the complete sentence, please repeat the last word. This will be recorded. You will then have the opportunity to give feedback how clearly you understood the word and how sure you are the word you understood is the word that was said.</p>`,
        "<p>This is the end of the instructions. Take your time to read through them, you will not be able to return here.</p>"
      ],
      "button-previous": "Previous",
      "button-next": "Next"
    },
    "first-tutorial-stimulus": "<p>You will now hear an example sentence where the last word has not been distorted.</p>",
    "second-tutorial-stimulus": "<p>For the next sentence the last word <b>has</b> been distorted.</p>",
    "third-tutorial-stimulus": "<p>In the experiment you will have to answer the following questions after hearing each sentence.</p>",
    "end-of-tutorial-stimulus": "<p>This is the end of the tutorial and the start of the experiment. Good Luck!</p>"
  },
  "de": {
    "title": "Sprachbasierter Task",
    "welcome-and-mic-select-text": "<h1>Willkommen zum sprach-basierten Task</h1><p>Da im Laufe des Experiments ihre Sprache aufgenommen wird geben Sie bitte der Seite Zugriff auf Ihr Mikrofon. Wählen Sie das Mikrofon, das verwendet werden soll.</p>",
    "welcome-and-mic-select-button": "Dieses Mikrofon verwenden",
    "word-response-stimulus": "<p>Welches Wort haben Sie am Ende des Satzes verstanden?</p>",
    "done-button": "Weiter",
    "word-question": "<p>Bitte wiederholen Sie das letzte Wort des Satzes den Sie eben gehört haben.</p>",
    "clarity-question": "<p>Wie gut haben Sie das letze Wort verstanden?</p>",
    "confidence-question": "<p>Wie sicher sind Sie sich dass Sie das richtige Wort verstanden haben?</p>",
    "instructions": {
      "pages": [
        "<p>Auf den folgenden Seiten wird der Ablauf des Experimentes erklärt. Im Anschluss daran werden Sie die Möglichkeit haben an drei Beispielen den Ablauf auszuprobieren. Danach startet das Experiment.</p>",
        "<p>Ihr Ziel ist es das letze Wort eines Satzes zu identifizieren. Sie hören als erstes den Start eines Satzes.</p>",
        "<p>Dann, nach einer kurzen Pause, hören Sie das letze Wort des Satzes, mit einer stärkeren oder schwächeren Verzerrung. Die Verzerrung soll störende Geäusche aus der Umgebung simulieren. Stellen Sie sich vor Sie stehen an einer Bushaltestelle und versuchen einer Freundin dabei zuzuhören wie sie Ihnen etwas erzählt. An einer entscheidenden Stelle hupt ein Auto neben Ihnen, weshalb Sie das letzte Wort eines Satzes nicht klar verstehen.</p>",
        "<p>Nachdem Sie den ganzen Satz gehört haben wiederholen Sie bitte laut das zuletzt gehört Wort. Hierbei werden Sie aufgenommen. Sie haben dann die Möglichkeit über zwei Slider nacheinander Feedback zu geben wie klar Sie das Wort verstanden haben und wie sicher Sie sind dass Sie das Wort verstanden haben das gesagt wurde.</p>",
        "<p>Sie haben das Ende der Erklärung erreicht. Nehmen Sie sich Zeit die Erklärung zu lesen, Sie können sobald Sie begonnen haben nicht hierher zurückkehren.</p>"
      ],
      "button-previous": "Vorherige Seite",
      "button-next": "Nächste Seite"
    },
    "first-tutorial-stimulus": "<p>Sie hören jetzt einen Satz in dem das letzte Wort nicht verzerrt wurde.</p>",
    "second-tutorial-stimulus": "<p>Jetzt hören Sie einen Satz in dem das letzte Wort verzerrt wurde.</p>",
    "third-tutorial-stimulus": "<p>Die folgenden Fragen werden Ihnen nach jedem Satz gestellt.</p>",
    "end-of-tutorial-stimulus": "<p>Dies ist das Ende der Einführung und der Beginn des Experiments. Viel Erfolg!</p>"
  }
};
var S1 = require('/assets/text/S1_ALL.js');
var S2 = require('/assets/text/S2_ALL.js');
var S3 = require('/assets/text/S3_ALL.js');
var S4 = require('/assets/text/S4_ALL.js');




/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 * 
 */
export async function run({ assetPaths, input = {}, environment, title, version, stimulus, record_data }) {

  const jsPsych = initJsPsych();

  await jsPsych.run([{
    type: HtmlButtonResponsePlugin,
    stimulus: '<p>Please choose the language you would like to take the experiment in. / Bitte wählen Sie die Sprache in der Sie das Experiment absolvieren möchten.</p>',
    choices: Object.keys(langs),
    button_html: (choice) => `<button class="jspsych-btn"><img src="assets/images/flag-${choice}.svg" style="width: 100%"></img></button>`
  }])

  const selected_language = langs[Object.keys(langs)[jsPsych.data.results.trials[0].response]];

  const explain = [{
    type: initializeMicrophone,
    button_label: selected_language['welcome-and-mic-select-button'],
    device_select_message: selected_language['welcome-and-mic-select-text'],
    record_data: false
  }, {
    type: InstructionsPlugin,
    pages: selected_language.instructions.pages,
    show_clickable_nav: true,
    button_label_previous: selected_language['instructions']['button-previous'],
    button_label_next: selected_language['instructions']['button-next'],
    record_data: false
  }, {
    type: HtmlButtonResponsePlugin,
    stimulus: selected_language['first-tutorial-stimulus'],
    choices: [selected_language['done-button']],
    record_data: false
  }, { // Prior (first part of the sentence)
    type: audioKeyboardResponse,
    stimulus: 'assets/audio/training/t_382p.wav', // audio file here
    choices: "NO_KEYS",
    prompt: "<img src='assets/images/volume.png'>",
    trial_ends_after_audio: true,
    record_data: false
  }, {
    type: HtmlKeyboardResponsePlugin,
    stimulus: '+',
    choices: "NO_KEYS",
    trial_duration: 150,
    record_data: false
  }, { // Stimulus (last word of the sentence + distortion)
    type: audioKeyboardResponse,
    stimulus: 'assets/audio/training/t_382tw.wav', // audio file here
    choices: "NO_KEYS",
    prompt: "<img src='assets/images/volume.png'>",
    trial_ends_after_audio: true,
    record_data: false
  }, {
    type: HtmlButtonResponsePlugin,
    stimulus: selected_language['second-tutorial-stimulus'],
    choices: [selected_language['done-button']],
    record_data: false
  }, { // Prior (first part of the sentence)
    type: audioKeyboardResponse,
    stimulus: 'assets/audio/training/t_380p.wav', // audio file here
    choices: "NO_KEYS",
    prompt: "<img src='assets/images/volume.png'>",
    trial_ends_after_audio: true,
    record_data: false
  }, {
    type: HtmlKeyboardResponsePlugin,
    stimulus: '+',
    choices: "NO_KEYS",
    trial_duration: 150,
    record_data: false
  }, { // Stimulus (last word of the sentence + distortion)
    type: audioKeyboardResponse,
    stimulus: 'assets/audio/training/t_380tw_6.wav', // audio file here
    choices: "NO_KEYS",
    prompt: "<img src='assets/images/volume.png'>",
    trial_ends_after_audio: true,
    record_data: false
  }, {
    type: HtmlButtonResponsePlugin,
    stimulus: selected_language['third-tutorial-stimulus'],
    choices: [selected_language['done-button']],
    record_data: false
  }, { // Which word was understood?
    type: htmlAudioResponse,
    stimulus: selected_language['word-question'] + "<img src='assets/images/microphone.png'></img>",
    recording_duration: 5000,
    show_done_button: true,
    done_button_label: selected_language['done-button'],
    record_data: false
  }, { // Clarity
    type: HtmlSliderResponsePlugin,
    stimulus: selected_language['clarity-question'],
    button_label: selected_language['done-button'],
    record_data: false
  }, { // Confidence
    type: HtmlSliderResponsePlugin,
    stimulus: selected_language['confidence-question'],
    button_label: selected_language['done-button'],
    record_data: false
  }, {
    type: HtmlButtonResponsePlugin,
    stimulus: selected_language['end-of-tutorial-stimulus'],
    choices: [selected_language['done-button']],
    record_data: false
  },];

  var participant = S1.ALL;
  
  const timeline = [];
  var node = {
    timeline: timeline,
    timeline_variables: participant,
    randomize_order: true
  }
  console.log(participant)
  // Preload assets
  timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: assetPaths.audio,
    record_data: false
  });
  console.log(jsPsych.timelineVariable('Sentences'))
  timeline.push({ // Prior (first part of the sentence)
    type: audioKeyboardResponse,
    stimulus: 'assets/audio/stimuli/'+jsPsych.timelineVariable('Web_Audio'), // audio file here
    choices: "NO_KEYS",
    prompt: "<img src='assets/images/volume.png'>",
    trial_ends_after_audio: true,
    record_data: true
  });
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: '+',
    choices: "NO_KEYS",
    trial_duration: 150,
    record_data: false
  });
  timeline.push({ // Stimulus (last word of the sentence + distortion)
    type: audioKeyboardResponse,
    stimulus: 'assets/audio/stimuli/el_076tw_12.wav', // audio file here
    choices: "NO_KEYS",
    prompt: "<img src='assets/images/volume.png'>",
    trial_ends_after_audio: true,
    record_data: true,
  });
  timeline.push({ // Which word was understood?
    type: htmlAudioResponse,
    stimulus: selected_language['word-question'],
    recording_duration: 15000,
    show_done_button: true,
    done_button_label: selected_language['done-button'],
    on_finish: function (data) {
      if (!jatos)
        return

      jatos.uploadResultFile(data.response, "response_data.txt")
        .then(() => console.log("File was successfully uploaded"))
        .catch(() => console.log("File upload failed"));
    }
  });
  timeline.push({ // Clarity
    type: HtmlSliderResponsePlugin,
    stimulus: selected_language['clarity-question'],
    button_label: selected_language['done-button']
  });
  timeline.push({ // Confidence
    type: HtmlSliderResponsePlugin,
    stimulus: selected_language['confidence-question'],
    button_label: selected_language['done-button']
  });
  
  await jsPsych.run([explain, node]);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
}
