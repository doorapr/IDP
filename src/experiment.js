/**
 * @title IDP
 * @description 
 * @version 0.1.0
 *
 * @assets Stimuli/,assets/images,assets/audio/training,assets/text,assets/typo-dictionaries
 * 
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import audioKeyboardResponse from '@jspsych/plugin-audio-keyboard-response';
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import SurveyTextPlugin from "@jspsych/plugin-survey-text";
import HtmlSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import initializeMicrophone from '@jspsych/plugin-initialize-microphone';
import htmlAudioResponse from '@jspsych/plugin-html-audio-response';
import { initJsPsych } from "jspsych";
import survey from '@jspsych/plugin-survey';
import '@jspsych/plugin-survey/css/survey.css'
import AudioButtonResponsePlugin from "@jspsych/plugin-audio-button-response";
import CallFunctionPlugin from "@jspsych/plugin-call-function";

// TODO: Testen mit verschiedenen Browsern und OSs

function normalize_word(word) {
  return word.trim().toLowerCase();
}

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 * 
 */
export async function run({ assetPaths, input, environment, title, version, stimulus, record_data }) {
  if (!input) {
    input = {
      titration: "LINEAR",
      question_prior: true
    }
  }


  const jsPsych = initJsPsych();

  jsPsych.data.addProperties({ selected_language: 'de' })
  const lang = await fetch('assets/text/langs/de.json').then(response => response.json()); // selecting the language introduced problems and will be fed in from JATOS anyway.

  const configure_microphone = {
    timeline: [
      {
        type: initializeMicrophone,
        button_label: lang['mic-select-button'],
        device_select_message: lang['mic-select-text'],
        record_data: false
      },
      {
        type: htmlAudioResponse,
        stimulus: lang['mic-test'] + "<img class=\"main-symbol\" src='assets/images/microphone2.png'>",
        done_button_label: lang['done-button'],
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
            content.replaceChildren(content.children[1], content.children[0]); // make the text appear on top of the buttons, this only works in this specific case. YAGNI.
          },
          prompt: lang['recording-check'],
          choices: [lang['change-microphone-button'], lang['listen-again-button'], lang['done-button']]
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
        stimulus: lang['speaker-check'],
        choices: [lang['done-button']],
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
        stimulus: lang['speaker-check-restart'],
        choices: [lang['yes-button'], lang['no-button']]
      }
    ],
    loop_function(data) {
      return data.values()[0].response == 1;
    }
  }

  var titration_trial_data = undefined;
  var understood_word = undefined;

  const titration_csv_header = "subject;target_word;num_channels;"

  /**
   * Save and reset the titration_trial_data variable, has to be called once per target_word / num_channels combination.
   */
  function reset_titration_data() {
    titration_trial_data.target_word = jsPsych.evaluateTimelineVariable('target_word');
    titration_trial_data.num_channels = jsPsych.evaluateTimelineVariable('num_channels');

    jsPsych.data.get().addToLast(titration_trial_data);

    titration_trial_data = undefined;
  }

  /**
   * 
   * @returns boolean True if subsequent trials regarding the current word should be skipped
   */
  function word_done() {
    // We don't want to show trials or save data if the word was understood correctly AND THE RESULT SAVED
    return understood_word == normalize_word(jsPsych.evaluateTimelineVariable('target_word')) && titration_trial_data === undefined;
  }


  function make_titration_cycle(timeline_variables) {
    // show word
    // ask if language detected
    // -> only if true: 
    //    ask if word understood
    //    -> only if true:
    //       ask for word
    //       ask if typo corrected is intended
    //       check for correctness
    // show word
    return {
      timeline: [{
        timeline: [
          {
            type: PreloadPlugin,
            audio() {
              return [`Stimuli/${jsPsych.evaluateTimelineVariable('stimulus')}_${jsPsych.evaluateTimelineVariable('num_channels')}.wav`];
            },
            show_progress_bar: false,
            record_data: false
          },
          { // delay
            type: HtmlKeyboardResponsePlugin,
            stimulus: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
            choices: "NO_KEYS",
            trial_duration: 500,
            record_data: false
          }, { // actual playback
            type: audioKeyboardResponse,
            stimulus() {
              return `Stimuli/${jsPsych.evaluateTimelineVariable('stimulus')}_${jsPsych.evaluateTimelineVariable('num_channels')}.wav`;
            },
            choices: "NO_KEYS",
            prompt: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
            trial_ends_after_audio: true,
            record_data: false
          }, { // ask if language detected
            type: HtmlButtonResponsePlugin,
            stimulus: lang['language-detected-question'],
            choices: [lang['yes-button'], lang['no-button']],
            on_finish(data) {
              titration_trial_data = {};
              titration_trial_data.language_detected_response_time = data.rt;
              titration_trial_data.language_detected = (data.response == 0);
            }
          }
        ],
        conditional_function() {
          return !word_done();
        }
      }, {
        timeline: [
          { //    ask if word understood
            type: HtmlButtonResponsePlugin,
            stimulus: lang['word-detected-question'],
            choices: [lang['yes-button'], lang['no-button']]
          }
        ],
        conditional_function() { // This references the language detected question
          return !word_done() && jsPsych.data.getLastTrialData().values()[0].response == 0;
        },
      }, {
        timeline: [
          { //       ask for word
            type: SurveyTextPlugin,
            questions: [{
              prompt: lang['titration-which-word-question'],
              name: 'understood_word',
              required: true,
            }],
            button_label: lang['done-button'],
            on_finish(data) {
              if (!('entered_words' in titration_trial_data)) {
                titration_trial_data.entered_words = [];
              }

              titration_trial_data.entered_words.push(data.response.understood_word);
            }
          }, {//       ask if entered word is intended
            timeline: [{
              type: HtmlButtonResponsePlugin,
              stimulus: () => {
                const entered_word = jsPsych.data.getLastTrialData().values()[0].response.understood_word;
                return lang['titration-typo-question'] + entered_word;
              },
              choices: [lang['yes-button'], lang['no-button']],
              on_finish(data) {
                if (data.response == 0) {
                  titration_trial_data.understood_word = jsPsych.data.get().values().toReversed()[1].response.understood_word
                  titration_trial_data.correct = normalize_word(titration_trial_data.understood_word) == normalize_word(jsPsych.evaluateTimelineVariable('target_word'));
                  understood_word = titration_trial_data.understood_word
                }
              }
            }]
          }
        ],
        conditional_function() { // This references the specific word detected question
          return !word_done() && jsPsych.data.getLastTrialData().values()[0].response == 0;
        },
        loop_function(data) {
          return data.values().reverse()[0].response == 1;
        }
      }, {
        timeline: [
          {
            type: CallFunctionPlugin,
            func: reset_titration_data
          }
        ],
        conditional_function() {
          return !word_done();
        }
      },
      ],
      timeline_variables,
      on_timeline_finish() {
        console.log(jsPsych.data.get().filterCustom(data => 'target_word' in data).csv())
      }
    };
  }

  const fake_titration_sheet = [
    {
      stimulus: "s_em_lc_247tw",
      target_word: "hals",
      syllables: 1
    },
    {
      stimulus: "s_eh_400tw",
      target_word: "muster",
      syllables: 2
    },
    {
      stimulus: "s_em_hc_259tw",
      target_word: "uhr",
      syllables: 1
    },
    {
      stimulus: "s_em_hc_164tw",
      target_word: "tauben",
      syllables: 2,
    },
  ]

  const channels = jsPsych.randomization.shuffle([
    1, 3, 6, 12
  ])

  const stimuli = jsPsych.randomization.sampleWithoutReplacement(fake_titration_sheet, channels.length)

  const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => jsPsych.utils.deepMerge(d, e))));

  let fake_titration_data;
  if (input.titration == "RANDOM") {
    fake_titration_data = stimuli.map((stimulus, index) => ({ ...stimulus, num_channels: channels[index] }));
  } else if (input.titration == "LINEAR") {
    fake_titration_data = [...cartesian(fake_titration_sheet, [{ num_channels: 1 }, { num_channels: 3 }, { num_channels: 6 }, { num_channels: 12 }])];
  }

  function make_sensory_titration() {
    return input.titration ? {
      timeline: [
        {
          type: HtmlButtonResponsePlugin,
          stimulus: lang['begin-titration'],
          choices: [lang['done-button']],
          record_data: false
        },
        {
          type: HtmlButtonResponsePlugin,
          stimulus: lang['titration-before-first'],
          choices: [lang['done-button']],
          record_data: false
        },
        make_titration_cycle(fake_titration_data)
      ]
    } : { timeline: [] }
  }

  var filename_for_upload;
  function make_sentence_playback(first_stimulus, second_stimulus) {
    return [{
      type: HtmlKeyboardResponsePlugin,
      stimulus: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
      choices: "NO_KEYS",
      trial_duration: 300,
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
      trial_duration: 300,
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
        filename_for_upload = "response_" + path.substr(8).split(".")[0] + ".txt";
        console.log(filename_for_upload);
        console.log("FILENAME")
      }
    }];
  }

  const make_id_input = {
    timeline: [{
      type: survey,
      survey_json: {
        completeText: lang['done-button'],
        showQuestionNumbers: false,
        elements:
          [{
            readOnly: true,
            html: lang['id']['umlaut'],
            type: 'html'
          },
          {
            type: 'text',
            title: lang['id']['city'],
            name: 'city',
            maskType: "pattern",
            maskSettings: {
              pattern: "aa"
            },

            isRequired: true,
            description: "München → mu"
          },
          {
            type: 'dropdown',
            title: lang['id']['birthMonth'],
            name: 'birthMonth',
            choices: lang['id']['months'],
            isRequired: true,
            placeholder: lang['id']['placeholder']
          },
          {
            type: 'text',
            title: lang['id']['mother'],
            name: 'mother',
            maskType: "pattern",
            maskSettings: {
              pattern: "aa"
            },
            isRequired: true,
            description: "Emma → em"
          },
          {
            type: 'text',
            title: lang['id']['birthname'],
            name: 'birthname',
            description: "Mustermann → nn",
            showCommentArea: true,
            maskType: "pattern",
            maskSettings: {
              pattern: "aa",

            },
            isRequired: true,

          }
          ]
      },
      on_finish(data) {
        sub_id = data.response.city + data.response.birthMonth + data.response.mother + data.response.birthname
        jsPsych.data.addProperties({
          subject_id: sub_id
        })
      }
    }]
  }

  function make_clarity_question(record_data) {
    return { // Clarity
      type: HtmlSliderResponsePlugin,
      stimulus: lang['clarity-question'],
      button_label: lang['done-button'],
      record_data,
      labels: lang['clarity-labels'],
      require_movement: true,
      //slider_width: 600,
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
      stimulus: lang['confidence-question'],
      button_label: lang['done-button'],
      record_data,
      labels: lang['confidence-labels'],
      require_movement: true,
      //slider_width: 600,
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
      stimulus: lang['word-question'],
      choices: [lang['done-button']],
      record_data: false
    }, { // Which word was understood?
      type: htmlAudioResponse,
      stimulus: "<img class=\"main-symbol\" src='assets/images/microphone2.png'></img>",
      recording_duration: 7500,
      show_done_button: true,
      done_button_label: lang['done-button'],
      record_data,
      on_finish(data) {
        if (record_data) {
          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(data.response, filename_for_upload)
              .then(() => {
                data.response = filename_for_upload;
                data.fileName = filename_for_upload;
                data.roundIndex = roundIndex;
                data.type = "mic_input"; // Remove response data from RAM, we already saved it to the server.
                console.log("File was successfully uploaded");
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
      stimulus: lang['ready-for-next-stimulus'],
      choices: [lang['done-button']],
      record_data: false
    }]
  }

  function ask_prior(record_data, in_training) { //TODO: check how explain part influences csv
    return input.question_prior ? {
      type: HtmlButtonResponsePlugin,
      // TODO: den namen schöner
      stimulus: lang['word-question-prior-question'],
      choices: [lang['yes-button'], lang['no-button'], lang['not-understood']],
      record_data,
      on_finish(data) {
        data.type = "prior_expectation";
        data.fileName = filename_for_upload;
        if (in_training) {
          data.training = "true";
        }
      }
    } : { timeline: [] };
  }

  function conditional_prior(record_data) {
    return input.question_prior ? {
      timeline: make_word_question_prior(record_data),// The trial to execute conditionally
      record_data: true,
      conditional_function: function () {
        const data = jsPsych.data.get().last(1).values()[0];
        if (data.response == 0) {
          return false;
        } else {
          return true;
        }
      }
    } : { timeline: [] };
  }

  function make_word_question_prior(record_data) {
    return [
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['word-question-prior'],
        choices: [lang['done-button']],
        record_data: false,
      }, { // Which word was understood?
        type: htmlAudioResponse,
        stimulus: "<img class=\"main-symbol\" src='assets/images/microphone2.png'></img>",
        recording_duration: 7500,
        show_done_button: true,
        done_button_label: lang['done-button'],
        record_data,
        on_finish(data) {
          if (record_data) {
            if (typeof jatos !== 'undefined') {
              var prior_filename_for_upload = "prior_" + filename_for_upload
              jatos.uploadResultFile(data.response, prior_filename_for_upload)
                .then(() => {
                  data.response = prior_filename_for_upload; // Remove response data from RAM, we already saved it to the server.
                  data.fileName = filename_for_upload;
                  data.type = "prior_input";
                  console.log(data.response)
                  console.log(prior_filename_for_upload)
                  console.log("File was successfully uploaded");
                })
                .catch(() => console.log("File upload failed")); // Cancel experiment? Try Again?
            } else {
              data.response = prior_filename_for_upload; // Remove response data from RAM, we are in a developer session and don't care
              data.fileName = filename_for_upload;
              data.type = "prior_input";
            }
          }
        }
      },
      { // Expectation confidence
        type: HtmlSliderResponsePlugin,
        stimulus: lang['expectation-question'],
        button_label: lang['done-button'],
        record_data,
        labels: lang['expectation-labels'],
        require_movement: true,
        //slider_width: 600,
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
          data.type = "expectation_confidence"
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
      record_data: false,
      show_progress_bar: false,
    },
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['begin-training-session'],
      choices: [lang['done-button']],
      record_data: false
    },
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['explanation-pre-playback'],
      choices: [lang['done-button']],
      record_data: false
    },
    ...make_sentence_playback('assets/audio/training/t_380p.wav', 'assets/audio/training/t_380tw_6.wav'),
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['explanation-post-playback'],
      choices: [lang['done-button']],
      record_data: false
    },
    ...make_sentence_playback('assets/audio/training/t_380p.wav', 'assets/audio/training/t_380tw_6.wav'),
    make_clarity_question(false),
    ...make_word_question(false),
    make_confidence_question(false),
    ask_prior(true, true),
    conditional_prior(true),
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['end-of-first-tutorial-sentence'],
      choices: [lang['done-button']],
      record_data: false,
      require_movement: true
    },
    {
      timeline: [
        ...make_sentence_playback(jsPsych.timelineVariable('sentence'), jsPsych.timelineVariable('word')),

        make_clarity_question(false),
        ...make_word_question(false),
        make_confidence_question(false),
        ask_prior(true, true),
        conditional_prior(true),
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
      stimulus: lang['end-of-tutorial'],
      choices: [lang['done-button']],
      record_data: false,
      require_movement: true
    }
  ];

  const selected_randomisation = jsPsych.randomization.randomInt(1, 4)
  var sub_id
  jsPsych.data.addProperties({
    selected_randomisation
  });

  const blocks = jsPsych.randomization.shuffle(await Promise.all([
    fetch(`assets/text/S${selected_randomisation}A.json`).then((response) => response.json()),
    fetch(`assets/text/S${selected_randomisation}B.json`).then((response) => response.json()),
    fetch(`assets/text/S${selected_randomisation}C.json`).then((response) => response.json()),
    fetch(`assets/text/S${selected_randomisation}D.json`).then((response) => response.json()),
  ]))
  var roundIndex = 1;
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
      make_confidence_question(true),
      ask_prior(true, false),
      conditional_prior(true)
    ],

    on_timeline_finish() {
      if (typeof jatos !== 'undefined') {
        jatos.submitResultData(jsPsych.data.get().json()) // send the whole data every time, it's not that big
      }
      roundIndex += 1;
    }
  });

  const pause = {
    type: HtmlButtonResponsePlugin,
    stimulus: lang['pause-stimulus'],
    choices: [lang['done-button']]
  }

  await jsPsych.run([
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['consent-form'],
      choices: [lang['yes-button'], lang['no-button']],
      on_finish(data) {
        if (data.response == 1) { // Rejected
          window.alert(lang['did-not-accept-message']);
          window.close();
        }
      }
    },
    make_id_input,
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['begin-technical'],
      choices: [lang['done-button']],
      record_data: false
    },
    configure_microphone,
    configure_speakers,
    make_sensory_titration(),
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
