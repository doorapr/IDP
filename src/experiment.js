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
import surveyMultiSelect from '@jspsych/plugin-survey-multi-select';
import surveyMultiChoice from '@jspsych/plugin-survey-multi-choice';
import survey from '@jspsych/plugin-survey';
import '@jspsych/plugin-survey/css/survey.css'

// TODO: Testen mit verschiedenen Browsern und OSs
// TODO: Slider ticks oder Wert anzeigen



// TODO: Transcription, dor

const langs = {
  "en": {
    "title": "Language Task",
    "mic-select-text": "<p>Please select the microphone you want to use for the study. You will test it shortly and can return here if it doesn't work.</p>",
    "mic-select-button": "Use this microphone",
    "word-response-stimulus": "<p>Which word did you hear at the end of the sentence?</p>",
    "done-button": "Done",
    "word-question": "<p>Which word did you hear?</p><br><p>Press \"Next\" and then clearly and loudly say the word you heard. It can also just be a GUESS, but please don't guess randomly. If you didn't understand anything, please say \"NOTHING\".</p>",
    "clarity-question": "<p>How clearly did you hear the last word?</p>",
    "clarity-labels": ["Very unclear", "Very clear"],
    "confidence-labels": ["Very unconfident", "Very confident"],
    "confidence-question": "<p>How confident are you in your answer?</p>",
    "explanation-pre-playback": "<p>You will hear a woman reading a sentence in which the last word will be somewhat unclear. Please press \"Next\" to hear the sentence.</p>",
    "explanation-post-playback": "<p>As you surely noticed, the last word was really unclear. Please listen to the sentence again. Then indicate how clearly you heard the last word.</p>",
    "end-of-first-tutorial-sentence": "<p>With that you've answered all questions regarding this sentence. Click \"Next\" to continue with the next sentence.</p>",
    "end-of-tutorial": "<p>Thank you very much! You've successfully completed the tutorial. The experiment will now begin.</p>",
    "ready-for-next-stimulus": "<p>Ready for the next sentence?</p>",
    "pause-stimulus": "<p>Time for a short break. Click \"Next\" when you're ready for the next 50 sentences.</p>",
    "recording-check": "<p>Did the recording work?</p>",
    "did-not-accept-message": "You did not accept the consent form. This tab will now close.",
    "consent-form": "Welcome & Consent Form",
    "yes-button": "Yes",
    "no-button": "No",
    "mic-test": "<p>Please say a word to test your microphone. Speak loudly and clearly.</p>",
    "speaker-check": "<p>You will now hear a sentence. Please adjust your volume so you can understand the sentence clearly.</p>",
    "speaker-check-restart": "<p>Is the volume comfortable for you?</p>",
  },
  "de": {
    "title": "Sprachbasierter Task",
    "mic-select-text": "<p>Bitte suchen Sie das Mikrofon aus, das verwendet werden soll. Sie werden es gleich testen und können hierher zurückkehren, falls es nicht funktioniert.</p>",
    "mic-select-button": "Dieses Mikrofon verwenden",
    "word-response-stimulus": "<p>Welches Wort haben Sie am Ende des Satzes verstanden?</p>",
    "done-button": "Weiter",
    "word-question": "<p>Welches Wort haben Sie gehört?</p><br><p>Drücken Sie \"Weiter\" und sagen Sie dann gleich laut und deutlich das Wort, welches Sie gehört haben. Es kann auch nur eine VERMUTUNG sein, aber bitte raten Sie nicht. Wenn sie nichts verstanden haben, sagen sie bitte \"NICHTS\".</p>",
    "clarity-question": "<p>Wie deutlich haben sie das Wort gehört?</p>",
    "confidence-question": "<p>Wie sicher sind Sie sich mit Ihrer Antwort?</p>",
    "clarity-labels": ["Sehr deutlich", "Sehr undeutlich"],
    "confidence-labels": ["Sehr unsicher", "Sehr sicher"],
    "explanation-pre-playback": "<p>Sie hören gleich die Stimme einer Frau, die einen Satz vorliest. Das letzte Wort ist etwas undeutlich.</p>",
    "explanation-post-playback": "<p>Wie Sie sicher gemerkt haben, war das letzte Wort wirklich undeutlich. Bitte hören Sie sich den Satz noch einmal an. Geben Sie dann an, wie deutlich Sie das Wort gehört haben.</p>",
    "end-of-first-tutorial-sentence": "<p>Damit haben Sie nun alle Fragen zu diesem Satz beantwortet. Klicken Sie auf \"Weiter\", um den nächsten Satz zu beginnen.</p>",
    "end-of-tutorial": "<p>Vielen Dank! Sie haben das Training erfolgreich beendet. Jetzt beginnt das Experiment.</p>",
    "ready-for-next-stimulus": "<p>Bereit für den nächsten Satz?</p>",
    "pause-stimulus": "<p>Zeit für eine kurze Pause. Wenn Sie bereit für die nächsten 50 Sätze sind, klicken sie auf \"Weiter\".</p>",
    "recording-check": "<p>Hat die Aufnahme funktioniert?</p>",
    "did-not-accept-message": "Sie haben die Einverständniserklärung nicht akzeptiert. Dieser Tab wird sich jetzt schließen.",
    "consent-form": "Willkommen & Einverständniserklärung",
    "yes-button": "Ja",
    "no-button": "Nein",
    "mic-test": "<p>Bitte sagen Sie ein Wort, um Ihr Mikrofon zu testen. Sprechen Sie dafür laut und deutlich.</p>",
    "speaker-check": "<p>Sie hören jetzt einen Satz. Bitte stellen Sie Ihre Lautstärke so ein, dass der Satz klar verständlich ist.</p>",
    "speaker-check-restart": "<p>Ist die Lautstärke so angenehm für Sie?</p>",
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
        record_again_button_label: selected_language['record-again-button'],
        accept_button_label: selected_language['done-button'],
        done_button_label: selected_language['done-button'],
        recording_duration: 7500,
        record_data: false,
        allow_playback: true
      },
      {
        type: HtmlButtonResponsePlugin,
        stimulus: selected_language['recording-check'],
        choices: [selected_language['yes-button'], selected_language['no-button']]
      }
    ],
    loop_function(data) {
      return data.values()[0].response == 1;
    }
  }

  const configure_speakers = {
    timeline: [
      {
        type: HtmlButtonResponsePlugin,
        stimulus: selected_language['speaker-check'],
        choices: [selected_language['done-button']],
        record_data: false
      },
      { // Prior (first part of the sentence)
        type: audioKeyboardResponse,
        stimulus: 'assets/audio/training/audio_test.wav', // audio file here
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
      record_data: false
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
      record_data: false,
      on_finish() {
        const path = (typeof second_stimulus === 'string') ? second_stimulus : jsPsych.evaluateTimelineVariable(second_stimulus.name);
        filename_for_upload = path.substr(8).split(".")[0] + ".txt";
        console.log(filename_for_upload);
      }
    }];
  }

  const make_id_input= {
     timeline: [{
      type: survey,
      survey_json: {
      showQuestionNumbers: false,
      elements:
        [
          {
            type: 'dropdown',
            title: "Select the first letter of the city you were born in", 
            name: 'cityFirst', 
            choices: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
            isRequired: true
          },
          {
            type: 'dropdown',
            title: "Select the second letter of the city you were born in", 
            name: 'citySecond', 
            choices: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
            isRequired: true
          }, 
          {
            type: 'dropdown',
            title: "Enter your birth month", 
            name: 'birthMonth', 
            choices: [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
          ],
          isRequired: true
          },
          {
            type: 'dropdown',
            title: "Select the first letter of your mothers name", 
            name: 'motherFirst', 
            choices: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
            isRequired: true
          },
          {
            type: 'dropdown',
            title: "Select the second letter of your mothers name", 
            name: 'motherSecond', 
            choices: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
            isRequired: true
          },
          
          {
            type: 'dropdown',
            title: "Select the second last letter of your birth surname (lastname)", 
            name: 'birthSecondLast', 
            choices: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
            isRequired: true
          },

          {
            type: 'dropdown',
            title: "Select the last letter of your birth surname (lastname)", 
            name: 'birthLast', 
            choices: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
            isRequired: true
          }
    ]
  },
  //subject_id:data.response.cityFirst + data.response.citySecond + data.response.birthMonth + data.response.motherFirst + data.response.motherSecond + data.response.birthSecondLast + data.response.birthLast,
  on_finish(data) {
    sub_id=data.response.cityFirst + data.response.citySecond + data.response.birthMonth + data.response.motherFirst + data.response.motherSecond + data.response.birthSecondLast + data.response.birthLast
  jsPsych.data.addProperties({
    subject_id: sub_id
   })
  }
    }]
  }

  function make_clarity_question(record_data) {
    return { // Clarity
      type: HtmlSliderResponsePlugin,
      stimulus: selected_language['clarity-question'],
      button_label: selected_language['done-button'],
      record_data,
      labels: selected_language['clarity-labels'],
      require_movement: true,
      slider_width: 600,
      subject_id:sub_id,
      on_finish(data) {
        data.fileName = filename_for_upload
        data.type = "clarity"
      }
    };
  }

  function make_confidence_question(record_data) {
    return { // Confidence
      type: HtmlSliderResponsePlugin,
      stimulus: selected_language['confidence-question'],
      button_label: selected_language['done-button'],
      record_data,
      labels: selected_language['confidence-labels'],
      require_movement: true,
      slider_width: 600,
      on_finish(data) {
        data.fileName = filename_for_upload
        data.type = "confidence"
      }
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
        if (record_data) {
          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(data.response, filename_for_upload)
              .then(() => {
                console.log("File was successfully uploaded");
                data.response = filename_for_upload; // Remove response data from RAM, we already saved it to the server.
              })
              .catch(() => console.log("File upload failed")); // Cancel experiment? Try Again?
          } else {
            data.response = filename_for_upload; // Remove response data from RAM, we are in a developer session and don't care
          }
        }
      }
    }];
  }



  function ready_next_sentence(record_data) {
    return [{
      type: HtmlButtonResponsePlugin,
      stimulus: selected_language['ready-for-next-stimulus'],
      choices: [selected_language['done-button']],
      record_data: false
    }]
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
      record_data: false,
      show_progress_bar:false,
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
  var sub_id
  jsPsych.data.addProperties({
    selected_randomisation
    //fileName: filename_for_upload
  });

  const randomisation = randomisation_lists[selected_randomisation].ALL;

  const block_size = 50;

  const blocks = [
    randomisation.slice(0, block_size),
    randomisation.slice(block_size, 2 * block_size),
    randomisation.slice(2 * block_size, 3 * block_size),
    randomisation.slice(3 * block_size, 4 * block_size)
  ]

  const testing = 1;
  const test_blocks = [
    randomisation.slice(0, testing)
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
    record_data: false,
    show_progress_bar:false
  });
  timeline.push(ready_next_sentence(true));
  timeline.push(...make_sentence_playback(jsPsych.timelineVariable('sentence'), jsPsych.timelineVariable('word')));
  timeline.push({
    timeline: [
      make_clarity_question(true),
      ...make_word_question(true),
      make_confidence_question(true)
      
    ],
    on_timeline_finish() {
      console.log(jsPsych.data.get());
    }
  });

  const pause = {
    type: HtmlButtonResponsePlugin,
    stimulus: selected_language['pause-stimulus'],
    choices: [selected_language['done-button']]
  }
 
  // TESTING
  await jsPsych.run([
    make_id_input,
    {
      type: HtmlButtonResponsePlugin,
      stimulus: selected_language['consent-form'],
      choices: [selected_language['yes-button'], selected_language['no-button']],
      on_finish(data) {
        if (data.response == 1) { // Rejected
          window.alert(selected_language['did-not-accept-message']);
          window.close();
        }
       
      }
    },
    
    configure_microphone,
    configure_speakers,
    {
      timeline,
      timeline_variables: test_blocks[0],
      randomize_order: true
    },])
/* 
  await jsPsych.run([
    {
      type: HtmlButtonResponsePlugin,
      stimulus: selected_language['consent-form'],
      choices: [selected_language['yes-button'], selected_language['no-button']],
      on_finish(data) {
        if (data.response == 1) { // Rejected
          window.alert(selected_language['did-not-accept-message']);
          window.close();
        }
        saveData(jsPsych.data.get().csv());
      }
    },
    configure_microphone,
    configure_speakers,
    explanation,
    {
      timeline,
      timeline_variables: blocks[0],
      randomize_order: true
    },
    pause, {
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
*/
  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
}
