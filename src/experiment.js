/**
 * @title IDP
 * @description 
 * @version 0.1.0
 *
 * @assets Stimuli/,assets/images,assets/audio/training
 * 
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
// TODO: Slider ticks oder Wert anzeigen


// TODO: Transcription, dor

const langs = {
  "en": {
    "title": "Language Task",
    "mic-select-text": "<p>Please choose the microphone you would like to use for the experiment. You will be able to test it and return here if it doesn't work.</p>",
    "mic-select-button": "Select this device.",
    "word-response-stimulus": "<p>Which word did you understand at the end of the sentence?</p>",
    "done-button": "Done",
    "word-question": "<p>What word did you understand?</p><br><p>Press \"Next\" and immediately say the word that you understood. Also say the word if it's just a guess. If you didn't understand anything, please say \"NOTHING\".</p>",
    "clarity-question": "<p>How clearly did you understand the presented word?</p>",
    "clarity-labels": ["Very unclear", "Very clear"],
    "confidence-labels": ["Very unconfident", "Very confident"],
    "confidence-question": "<p>How confident are you in your answer?</p>",
    "explanation-pre-playback": "<p>You will hear a woman read a sentence where the last word is unclear. Please press \"Next\" to hear the sentence.</p>",
    "explanation-post-playback": "<p>As you've noticed, the last word was really unclear. Please listen to the sentence again. After that, rate how clearly you understood the last word.</p>",
    "end-of-first-tutorial-sentence": "<p>With that you've answered all questions regarding this sentence. Press \"Next\" to continue with the next sentence.</p>",
    "end-of-tutorial": "<p>Thank you very much! You've successfully completed the tutorial. Now the experiment will start.</p>",
    "ready-for-next-stimulus": "<p>Ready for the next sentence?</p>",
    "pause-stimulus": "<p>Time for a short break. Click the \"Next\" button when you're ready for the next 50 sentences.</p>",
    "recording-check": "<p>Did the recording work?</p>",
    "did-not-accept-message": "You did not accept the consent form. This tab will close now.",
    "consent-form": "Welcome & Consent Text",
    "yes-button": "Yes",
    "no-button": "No",
    "mic-test": "<p>Say a test word, speak loudly and clearly.</p>",
    "speaker-check": "<p>You will hear a sample sentence, adjust the volume so you can understand the sentence clearly.</p>",
    "speaker-check-restart": "<p>Do you want to hear the sentence again?</p>",
    "id-questions": [
      "First Name",
      "Favorite Fruit",
      "Sex",
      "Banana"
    ],
    "id-prompt": "<p>Please answer the following questions:</p>"
  },
  "de": {
    "title": "Sprachbasierter Task",
    "mic-select-text": "<p>Bitte suchen Sie das Mikrofon aus das verwendet werden soll. Sie werden es gleich testen und können hierher zurückkehren, falls es nicht funktioniert.</p>",
    "mic-select-button": "Dieses Mikrofon verwenden",
    "word-response-stimulus": "<p>Welches Wort haben Sie am Ende des Satzes verstanden?</p>",
    "done-button": "Weiter",
    "word-question": "<p>Welches Wort haben Sie gehört?</p><br><p>Drücken Sie \"Weiter\" und sagen Sie dann gleich das Wort, welches Sie gehört haben. Es kann auch nur eine VERMUTUNG sein. Wenn sie tatsächlich gar nichts gehört haben, sagen sie bitte \"NICHTS\".</p>",
    "clarity-question": "<p>Wie deutlich haben sie das Wort gehört?</p>",
    "confidence-question": "<p>Wie sicher sind Sie sich mit Ihrer Antwort?</p>",
    "clarity-labels": ["Sehr deutlich", "Sehr undeutlich"],
    "confidence-labels": ["Sehr unsicher", "Sehr sicher"],
    "explanation-pre-playback": "<p>Sie hören gleich die Stimme einer Frau, die einen Satz vorliest. Das letzte Wort ist etwas undeutlich.</p>",
    "explanation-post-playback": "<p>Wie Sie sicher gemerkt haben, war das letzte Wort wirklich undeutlich. Bitte hören Sie sich den Satz noch einmal an. Geben Sie dann an, wie deutlich Sie das Wort gehört haben.</p>",
    "end-of-first-tutorial-sentence": "<p>Damit haben Sie nun alle Fragen zu diesem Satz beantwortet. Klicken Sie auf \"Weiter\", um den nächsten Satz zu beginnen.</p>",
    "end-of-tutorial": "<p>Vielen Dank! Sie haben das Training erfolgreich beendet. Jetzt beginnt das Experiment.</p>",
    "ready-for-next-stimulus": "<p>Bereit für den nächsten Satz?</p>",
    "pause-stimulus": "<p>Zeit für eine kurze Pause. Wenn Sie bereit für die nächsten 50 Sätze sind klicken sie auf \"Weiter\".</p>",
    "recording-check": "<p>Hat die Aufnahme funktioniert?</p>",
    "did-not-accept-message": "Sie haben die Einverständniserklärung nicht akzeptiert. Dieser Tab wird sich jetzt schließen.",
    "consent-form": "Wilkommen & Einverständniserklärung",
    "yes-button": "Ja",
    "no-button": "Nein",
    "mic-test": "<p>Bitte sagen Sie ein Wort. Sprechen Sie laut und deutlich.</p>",
    "speaker-check": "<p>Sie hören jetzt einen Satz. Stellen Sie Ihre Lautstärke so ein dass der Satz klar verständlich ist.</p>",
    "speaker-check-restart": "<p>Möchten Sie den Satz noch einmal hören?</p>",
    "id-questions": [
      "Vorname",
      "Lieblingsfrucht",
      "Geschlecht",
      "Banane"
    ],
    "id-prompt": "<p>Bitte beantworten Sie die folgenden Fragen:</p>"
  }
};


const randomisation_lists = {
  S1: require('/assets/text/S1.js'),
  S2: require('/assets/text/S2_ALL.js'),
  S3: require('/assets/text/S3_ALL.js'),
  S4: require('/assets/text/S4_ALL.js'),
}

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 * 
 */
export async function run({ assetPaths, input = {}, environment, title, version, stimulus, record_data }) {

  const jsPsych = initJsPsych(
  );

  await jsPsych.run([{ // Instead of choosing the language this will probably come from the input / environment from JATOS
    type: HtmlButtonResponsePlugin,
    stimulus: '<p>Please choose the language you would like to take the experiment in. / Bitte wählen Sie die Sprache in der Sie das Experiment absolvieren möchten.</p>',
    choices: Object.keys(langs),
    button_html: (choice) => `<button class="jspsych-btn"><img src="assets/images/flag-${choice}.svg" style="width: 100%"></img></button>`
  }])

  const selected_language = langs[Object.keys(langs)[jsPsych.data.results.trials[0].response]];

  const configure_microphone = {
    timeline: [
      {
        type: initializeMicrophone,
        button_label: selected_language['mic-select-button'],
        device_select_message: selected_language['mic-select-text'],
        record_data: false
      },
      {
        type: htmlAudioResponse,
        stimulus: selected_language['mic-test'] + "<img class=\"main-symbol\" src='assets/images/microphone2.png'>",
        recording_duration: 7500,
        record_data: true,
        save_audio_url: true,
        allow_playback: true
      },
      {
        type: HtmlButtonResponsePlugin,
        stimulus: selected_language['recording-check'],
        choices: [selected_language['yes-button'], selected_language['no-button']]
      }
    ],
    loop_function(data) {
      const should_loop = data.values()[1].response == 1;
      URL.revokeObjectURL(data.values()[0].audio_url);
      return should_loop;
    }
  }

  const configure_speakers = {
    timeline: [
      {
        type: HtmlButtonResponsePlugin,
        stimulus: selected_language['speaker-check'],
        choices: [selected_language['next-button']],
        record_data: false
      },
      { // Prior (first part of the sentence)
        type: audioKeyboardResponse,
        stimulus: 'assets/audio/training/t_382p.wav', // audio file here
        choices: "NO_KEYS",
        prompt: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
        trial_ends_after_audio: true,
        record_data: false
      },
      {
        type: HtmlButtonResponsePlugin,
        stimulus: selected_language['speaker-check-restart'],
        choices: [selected_language['yes-button'], selected_language['no-button']]
      }
    ],
    loop_function(data) {
      return data.values()[0].response == 0;
    }
  }

  var filename_for_upload;
  function make_sentence_playback(first_stimulus, second_stimulus) {
    return [{
      type: HtmlKeyboardResponsePlugin,
      stimulus: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
      choices: "NO_KEYS",
      trial_duration: 150,
      record_data: false
    }, { // Prior (first part of the sentence)
      type: audioKeyboardResponse,
      stimulus: first_stimulus,
      choices: "NO_KEYS",
      prompt: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
      trial_ends_after_audio: true,
      record_data: true
    }, {
      type: HtmlKeyboardResponsePlugin,
      stimulus: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
      choices: "NO_KEYS",
      trial_duration: 150,
      record_data: false
    }, { // Stimulus (last word of the sentence + distortion)
      type: audioKeyboardResponse,
      stimulus: second_stimulus,
      choices: "NO_KEYS",
      prompt: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
      trial_ends_after_audio: true,
      record_data: true,
      on_finish(data) {
        const path = data.stimulus;
        filename_for_upload = path.substr(8).split(".")[0] + ".txt";
      }
    }];
  }

  function make_id_input() {
    return {
      type: SurveyTextPlugin,
      questions: selected_language['id-questions'],
      preabmle: selected_language['id-prompt'],
      button_label: selected_language['next-button'],
      on_finish(data) {

      }
    }
  }

  function make_clarity_question(record_data) {
    return { // Clarity
      type: HtmlSliderResponsePlugin,
      stimulus: selected_language['clarity-question'],
      button_label: selected_language['done-button'],
      record_data,
      labels: selected_language['clarity-labels'],
      require_movement: true
    };
  }

  function make_confidence_question(record_data) {
    return { // Confidence
      type: HtmlSliderResponsePlugin,
      stimulus: selected_language['confidence-question'],
      button_label: selected_language['done-button'],
      record_data,
      labels: selected_language['confidence-labels'],
      require_movement: true
    };
  }

  function make_word_question(record_data) {
    return [{
      type: HtmlButtonResponsePlugin,
      stimulus: selected_language['word-question'],
      choices: [selected_language['done-button']],
      record_data: false
    }, { // Which word was understood?
      type: htmlAudioResponse,
      stimulus: "<img class=\"main-symbol\" src='assets/images/microphone2.png'></img>",
      recording_duration: 7500,
      show_done_button: true,
      done_button_label: selected_language['done-button'],
      record_data,
      on_finish(data) {
        if (typeof jatos !== 'undefined' && record_data) {
          jatos.uploadResultFile(data.response, filename_for_upload)
            .then(() => {
              console.log("File was successfully uploaded");
              data.response = filename_for_upload; // Remove response data from RAM, we already saved it to the server.
            })
            .catch(() => console.log("File upload failed")); // Cancel experiment? Try Again?
        }
      }
    }];
  }

  const explanation = [
    {
      type: PreloadPlugin,
      images: assetPaths.images,
      audio: [
        'assets/audio/training/t_382p.wav', // Keep these in sync with the files used in the training. Maybe make dynamic?
        'assets/audio/training/t_382tw.wav',
        'assets/audio/training/t_380p.wav',
        'assets/audio/training/t_380tw_6.wav',
        'assets/audio/training/t_264p.wav',
        'assets/audio/training/t_264tw_12.wav',
        'assets/audio/training/t_311p.wav',
        'assets/audio/training/t_311tw_3.wav',
        'assets/audio/training/t_313p.wav',
        'assets/audio/training/t_313tw_6.wav'
      ],
      record_data: false
    },
    {
      type: HtmlButtonResponsePlugin,
      stimulus: selected_language['explanation-pre-playback'],
      choices: [selected_language['done-button']],
      record_data: false
    },
    ...make_sentence_playback('assets/audio/training/t_380p.wav', 'assets/audio/training/t_380tw_6.wav'),
    {
      type: HtmlButtonResponsePlugin,
      stimulus: selected_language['explanation-post-playback'],
      choices: [selected_language['done-button']],
      record_data: false
    },
    ...make_sentence_playback('assets/audio/training/t_380p.wav', 'assets/audio/training/t_380tw_6.wav'),
    make_clarity_question(false),
    ...make_word_question(false),
    make_confidence_question(false),
    {
      type: HtmlButtonResponsePlugin,
      stimulus: selected_language['end-of-first-tutorial-sentence'],
      choices: [selected_language['done-button']],
      record_data: false,
      require_movement: true
    },
    {
      timeline: [
        ...make_sentence_playback(jsPsych.timelineVariable('sentence'), jsPsych.timelineVariable('word')),
        make_clarity_question(false),
        ...make_word_question(false),
        make_confidence_question(false),
      ],
      timeline_variables: [
        {
          sentence: 'assets/audio/training/t_264p.wav',
          word: 'assets/audio/training/t_264tw_12.wav'
        },
        {
          sentence: 'assets/audio/training/t_311p.wav',
          word: 'assets/audio/training/t_311tw_3.wav'
        },
        {
          sentence: 'assets/audio/training/t_313p.wav',
          word: 'assets/audio/training/t_313tw_6.wav'
        }
      ]
    },
    {
      type: HtmlButtonResponsePlugin,
      stimulus: selected_language['end-of-tutorial'],
      choices: [selected_language['done-button']],
      record_data: false,
      require_movement: true
    }
  ];

  const selected_randomisation = jsPsych.randomization.sampleWithoutReplacement(Object.keys(randomisation_lists), 1)[0]

  jsPsych.data.addProperties({
    selected_randomisation,
    subject_id: "invalid"
  });

  const randomisation = jsPsych.randomization.shuffle(jsPsych.randomization.sampleWithReplacement(require('/assets/text/out.js').ALL, 200)); // replace this with const participant = randomisation_lists[selected_randomisation].ALL;

  const block_size = 50;

  const blocks = [
    randomisation.slice(0, block_size),
    randomisation.slice(block_size, 2 * block_size),
    randomisation.slice(2 * block_size, 3 * block_size),
    randomisation.slice(3 * block_size, 4 * block_size)
  ]

  // timeline.push({ // 
  //   type: initializeMicrophone,
  //   button_label: selected_language['mic-select-button'],
  //   device_select_message: selected_language['mic-select-text'],
  //   record_data: false
  // });

  // 4 Blöcke â 50 Sätze
  // Preload assets
  
  const timeline = [];
  timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: () => [jsPsych.evaluateTimelineVariable('sentence'), jsPsych.evaluateTimelineVariable('word')],
    record_data: false
  });
  timeline.push(...make_sentence_playback(jsPsych.timelineVariable('sentence'), jsPsych.timelineVariable('word')));
  timeline.push(make_clarity_question(true));
  timeline.push(...make_word_question(true));
  timeline.push(make_confidence_question(true));

  const pause = {
    type: HtmlButtonResponsePlugin,
    stimulus: selected_language['pause-stimulus'],
    button_label: selected_language['done-button']
  }

  await jsPsych.run([
    {
      type: HtmlButtonResponsePlugin,
      stimulus: selected_language['consent-form'],
      choices: [selected_language['yes-button'], selected_language['no-button']],
      on_finish(data) {
        if (data.response == 1) { // Rejected
          window.alert(selected_language['word-question']);
          window.close();
        }
      }
    },
    configure_microphone,
    configure_speakers,
    explanation,
    {
      timeline,
      timeline_variables: blocks[0],
      randomize_order: true
    }, pause, {
      timeline,
      timeline_variables: blocks[1],
      randomize_order: true
    }, pause, {
      timeline,
      timeline_variables: blocks[2],
      randomize_order: true
    }, pause, {
      timeline,
      timeline_variables: blocks[3],
      randomize_order: true
    }]);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
}
