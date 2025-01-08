/**
 * @title IDP
 * @description 
 * @version 0.1.0
 *
 * @assets Stimuli/,assets/images,assets/audio/training,assets/text
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
import AudioButtonResponsePlugin from "@jspsych/plugin-audio-button-response";

// TODO: Testen mit verschiedenen Browsern und OSs

const langs = {
  "en": {
    "title": "Language Task",
    "mic-select-text": "<p>Please select the microphone you want to use for the study. You will test it shortly and can return here if it doesn't work.</p>",
    "mic-select-button": "Use this microphone",
    "word-response-stimulus": "<p>Which word did you hear at the end of the sentence?</p>",
    "done-button": "Next",
    "word-question": "<p>Which word did you hear?</p><br><p>Press \"Next\" and then <b>clearly</b> and <b>loudly</b> say the word you heard. It can also just be a GUESS, but please don't guess randomly. If you didn't understand anything, please say \"NOTHING\".</p>",
    "clarity-question": "<p>How clearly did you hear the last word?</p>",
    "clarity-labels": ["Very unclear<br>0%", "<span id='slider-value'>50%</span>", "Very clear<br>100%"],
    "confidence-labels": ["Very unconfident<br>0%", "<span id='slider-value'>50%</span>", "Very confident<br>100%"],
    "confidence-question": "<p>How confident are you in your answer?</p>",
    "explanation-pre-playback": "<p>You will hear a woman reading a sentence in which the last word will be somewhat unclear. Please press \"Next\" to hear the sentence.</p>",
    "explanation-post-playback": "<p>As you surely noticed, the last word was really unclear. Please listen to the sentence again. Then indicate how clearly you heard the last word.</p>",
    "end-of-first-tutorial-sentence": "<p>With that you've answered all questions regarding this sentence. Click \"Next\" to continue with the next sentence.</p>",
    "end-of-tutorial": "<p>Thank you very much! You've successfully completed the tutorial. The experiment will now begin.</p>",
    "ready-for-next-stimulus": "<p>Ready for the next sentence?</p>",
    "pause-stimulus": "<p>Time for a short break. Click \"Next\" when you're ready for the next 50 sentences.</p>",
    "did-not-accept-message": "You did not accept the consent form. This tab will now close.",
    "consent-form": "Welcome & Consent Form",
    "yes-button": "Yes",
    "no-button": "No",
    "mic-test": "<p>Please say a word to test your microphone. Speak <b>loudly</b> and <b>clearly</b>.</p>",
    "recording-check": "<p>Did you hear the word you recorded? If you want to try recording again press \"Change microphone\". If you want to hear the recording again press \"Listen again\". If you're finished setting up press \"Next\".</p>",
    "listen-again-button": "Listen again",
    "change-microphone-button": "Change microphone",
    "speaker-check": "<p>You will now hear a sentence. Please adjust your volume so you can understand the sentence clearly.</p>",
    "speaker-check-restart": "<p>Is the volume comfortable for you?</p>",
    "begin-training-session": "<p>You will now start the <b>training</b> session.</p>",
    "begin-technical":"<p>In the next step, you will be asked to make some <b>technical</b> configurations to optimize the experiment.</p>",
    "id": {
      "city": "Please provide the first two letters of the city you were born in:",
      "birthMonth": "Enter your birth month:",
      "mother": "Please provide the first two letters of your Mother's first name:",  
      "birthname": "Please provide the last two letters of your birth surname (last name):",
      "months": [
        "01", "02", "03", "04", "05", "06",
        "07", "08", "09", "10", "11", "12"
      ],
      "placeholder": 'Select...'
    }
  },
  "de": {
    "title": "Sprachbasierter Task",
    "mic-select-text": "<p>Bitte suchen Sie das Mikrofon aus, das verwendet werden soll. Sie werden es gleich testen und können hierher zurückkehren, falls es nicht funktioniert.</p>",
    "mic-select-button": "Dieses Mikrofon verwenden",
    "word-response-stimulus": "<p>Welches Wort haben Sie am Ende des Satzes verstanden?</p>",
    "done-button": "Weiter",
    "word-question": "<p>Welches Wort haben Sie gehört?</p><br><p>Drücken Sie \"Weiter\" und sagen Sie dann gleich <b>laut</b> und <b>deutlich</b> das Wort, welches Sie gehört haben.</p><p> Es kann auch nur eine VERMUTUNG sein, aber bitte raten Sie nicht. Wenn Sie nichts verstanden haben, sagen Sie bitte \"NICHTS\".</p>",
    "clarity-question": "<p>Wie deutlich haben Sie das Wort gehört?</p>",
    "confidence-question": "<p>Wie sicher sind Sie sich mit Ihrer Antwort?</p>",
    "clarity-labels": ["Sehr undeutlich<br>0%", "<span id='slider-value'>50%</span>", "Sehr deutlich<br>100%"],
    "confidence-labels": ["Sehr unsicher<br>0%", "<span id='slider-value'>50%</span>", "Sehr sicher<br>100%"],
    "explanation-pre-playback": "<p>Sie hören gleich die Stimme einer Frau, die einen Satz vorliest. Das letzte Wort ist etwas undeutlich.</p>",
    "explanation-post-playback": "<p>Wie Sie sicher gemerkt haben, war das letzte Wort wirklich undeutlich. Bitte hören Sie sich den Satz noch einmal an. Geben Sie dann an, wie deutlich Sie das Wort gehört haben.</p>",
    "end-of-first-tutorial-sentence": "<p>Damit haben Sie nun alle Fragen zu diesem Satz beantwortet. Klicken Sie auf \"Weiter\", um den nächsten Satz zu beginnen.</p>",
    "end-of-tutorial": "<p>Vielen Dank! Sie haben das Training erfolgreich beendet. Jetzt beginnt das Experiment.</p>",
    "ready-for-next-stimulus": "<p>Bereit für den nächsten Satz?</p>",
    "pause-stimulus": "<p>Zeit für eine kurze Pause. Wenn Sie bereit für die nächsten 50 Sätze sind, klicken Sie auf \"Weiter\".</p>",
    "did-not-accept-message": "Sie haben die Einverständniserklärung nicht akzeptiert. Dieser Tab wird sich jetzt schließen.",
    "consent-form": "Willkommen & Einverständniserklärung",
    "yes-button": "Ja",
    "no-button": "Nein",
    "mic-test": "<p>Bitte sagen Sie ein Wort, um Ihr Mikrofon zu testen. Sprechen Sie dafür <b>laut</b> und <b>deutlich</b>.</p>",
    "recording-check": "<p'>Haben Sie das Wort gehört, das Sie aufgenommen haben?</p><p>Wenn Sie die Aufnahme nochmal probieren wollen drücken Sie \"Mikrofon ändern\".</p><p>Wenn Sie die Aufnahme nochmal anhören wollen drücken Sie \"Aufnahme abspielen\".</p><p>Wenn Sie mit der Aufnahme zufrieden sind drücken Sie \"Weiter\".</p>",
    "change-microphone-button": "Mikrofon ändern",
    "listen-again-button": "Aufnahme abspielen",
    "speaker-check": "<p>Sie hören jetzt einen Satz. Bitte stellen Sie Ihre Lautstärke so ein, dass der Satz klar verständlich ist.</p>",
    "speaker-check-restart": "<p>Ist die Lautstärke so angenehm für Sie?</p>",
    "begin-training-session": "<p>Sie beginnen jetzt die <b>Trainingssession</b>.</p>",
    "begin-technical":"<p>Im nächsten Schritt werden Sie gebeten einige <b>technische Konfigurationen</b> vorzunehmen, um das Experiment optimal anzupassen.</p>",
    "id": {
      "city": "Geben Sie die ersten zwei Buchstaben Ihrer Geburtsstadt an (Umlaute werden durch den entsprechenden Vokal ersetzt, z. B. ä → a, ü → u, etc.):",
      "birthMonth": "Wählen Sie Ihren Geburtsmonat:",
      "mother": "Geben Sie die ersten zwei Buchstaben des Vornamens Ihrer Mutter an:",
      "birthname": "Geben Sie die letzten zwei Buchstaben Ihres Geburtsnachnamens an:",
      "months": [
        "01", "02", "03", "04", "05", "06",
        "07", "08", "09", "10", "11", "12"
      ],
      "placeholder": 'Auswählen...'
    }
  }
};

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 * 
 */
export async function run({ assetPaths, input = {}, environment, title, version, stimulus, record_data }) {

  const jsPsych = initJsPsych();

  jsPsych.data.addProperties({selected_language: 'de'})
  const selected_language = langs['de']; // selecting the language introduced problems and will be fed in from JATOS anyway.

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
        done_button_label: selected_language['done-button'],
        recording_duration: 7500,
        record_data: true,
        save_audio_url: true
      },
      {
        timeline: [{
          type: AudioButtonResponsePlugin,
          stimulus: () => {
            const last_trial_data = jsPsych.data.get().last(1).values()[0];
            return last_trial_data.audio_url || last_trial_data.stimulus;
          },
          on_load() {
            const content = document.getElementById('jspsych-content');
            content.replaceChildren(content.children[1], content.children[0]); // make the text appear on top of the buttons, this only works in this specific case. YAGNI.
          },
          prompt: selected_language['recording-check'],
          choices: [selected_language['change-microphone-button'], selected_language['listen-again-button'], selected_language['done-button']]
        }],
        loop_function(data) { 
          if (data.values()[0].response == 1) { // if listen again is pressed, listen again
            return true; 
          } else { // if listen again is not pressed, revoke the URL object to save RAM
            URL.revokeObjectURL(data.values()[0].stimulus);
            return false;
          }
        }
      }
    ],
    loop_function(data) { // if change microphone is pressed, loop the whole thing
      return data.last(1).values()[0].response == 0;
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
      return data.values()[0].response == 1;
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

  const make_id_input = {
    timeline: [{
      type: survey,
      survey_json: {
        completeText: selected_language['done-button'],
        showQuestionNumbers: false,
        elements:
          [
            {
              type: 'text',
              title: selected_language['id']['city'],
              name: 'city',
              maskType: "pattern",
              maskSettings: {
                pattern: "aa"
              },
              
              isRequired: true,
              placeholder: selected_language['id']['placeholder']
            },
            {
              type: 'dropdown',
              title: selected_language['id']['birthMonth'],
              name: 'birthMonth',
              choices: selected_language['id']['months'],
              isRequired: true,
              placeholder: selected_language['id']['placeholder']
            },
            {
              type: 'text',
              title: selected_language['id']['mother'],
              name: 'mother',
              maskType: "pattern",
              maskSettings: {
                pattern: "aa"
              },
              isRequired: true,
              placeholder: selected_language['id']['placeholder']
            },
            {
              type: 'text',
              title: selected_language['id']['birthname'],
              name: 'birthname',
              maskType: "pattern",
              maskSettings: {
                pattern: "aa"
              },
              isRequired: true,
              placeholder: selected_language['id']['placeholder']
            }
          ]
      },
      on_finish(data) {
        sub_id = data.response.city + data.response.birthMonth + data.response.mother  + data.response.birthname
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
      subject_id: sub_id,
      on_load() {
        const slider = document.getElementById('jspsych-html-slider-response-response');
        slider.oninput = () => {
          const span = document.getElementById('slider-value');
          span.textContent = `${slider.value}%`
        };
      },
      on_finish(data) {
        if (!record_data) { return }
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
      on_load() {
        const slider = document.getElementById('jspsych-html-slider-response-response');
        slider.oninput = () => {
          const span = document.getElementById('slider-value');
          span.textContent = `${slider.value}%`
        };
      },
      on_finish(data) {
        if (!record_data) { return }
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
                data.response = filename_for_upload;
                data.fileName = filename_for_upload;
                data.roundIndex=roundIndex;
                data.type="mic_input"; // Remove response data from RAM, we already saved it to the server.
              })
              .catch(() => console.log("File upload failed")); // Cancel experiment? Try Again?
          } else {
            data.response = filename_for_upload; // Remove response data from RAM, we are in a developer session and don't care
            console.log(roundIndex)
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
      show_progress_bar: false,
    },
    {
      type: HtmlButtonResponsePlugin,
      stimulus: selected_language['begin-training-session'],
      choices: [selected_language['done-button']],
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

  const selected_randomisation = jsPsych.randomization.randomInt(1, 4)
  var sub_id
  jsPsych.data.addProperties({
    selected_randomisation
  });

  const blocks = await Promise.all([
    fetch(`assets/text/S${selected_randomisation}A.json`).then((response) => response.json()),
    fetch(`assets/text/S${selected_randomisation}B.json`).then((response) => response.json()),
    fetch(`assets/text/S${selected_randomisation}C.json`).then((response) => response.json()),
    fetch(`assets/text/S${selected_randomisation}D.json`).then((response) => response.json()),
  ])

  const timeline = [];

  // 4 Blöcke â 50 Sätze
  // Preload assets

  timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: () => [jsPsych.evaluateTimelineVariable('sentence'), jsPsych.evaluateTimelineVariable('word')],
    record_data: false,
    show_progress_bar: false
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
      if (typeof jatos !== 'undefined') {
        jatos.submitResultData(jsPsych.data.get().json()) // send the whole data every time, it's not that big
      }
      roundIndex+=1;
    }
  });

  const pause = {
    type: HtmlButtonResponsePlugin,
    stimulus: selected_language['pause-stimulus'],
    choices: [selected_language['done-button']]
  }

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
    {
      type: HtmlButtonResponsePlugin,
      stimulus: selected_language['begin-technical'],
      choices: [selected_language['done-button']],
      record_data: false
    },
    configure_microphone,
    configure_speakers,
    explanation,
    {
      timeline,
      timeline_variables: blocks[0],
      randomize_order: true
    },
    pause, 
    {
      timeline,
      timeline_variables: blocks[1],
      randomize_order: true
    }, 
    pause, 
    {
      timeline,
      timeline_variables: blocks[2],
      randomize_order: true
    }, 
    pause, 
    {
      timeline,
      timeline_variables: blocks[3],
      randomize_order: true
    }
  ]);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
}
