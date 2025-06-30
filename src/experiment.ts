/**
 * @title LangTask
 * @description Language task to assess word recognition in distorted speech, modulated by a prior sentence stimulus. Includes sensory titration and assessment of prior expectation.
 * @version 0.9.9-demo
 *
 * @assets Stimuli/,assets/images,assets/audio/training,assets/text
 * 
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import SurveyTextPlugin from "@jspsych/plugin-survey-text";
import HtmlSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import initializeMicrophone from '@jspsych/plugin-initialize-microphone';
import htmlAudioResponse from '@jspsych/plugin-html-audio-response';
import { DataCollection, initJsPsych } from "jspsych";
import survey from '@jspsych/plugin-survey';
import '@jspsych/plugin-survey/css/survey.css';
import AudioButtonResponsePlugin from "@jspsych/plugin-audio-button-response";
import CallFunctionPlugin from "@jspsych/plugin-call-function";
import AudioKeyboardResponsePlugin from "@jspsych/plugin-audio-keyboard-response";
import Papa, { ParseResult } from "papaparse";
import confetti from "canvas-confetti";
import BrowserCheckPlugin from "@jspsych/plugin-browser-check";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";

// TODO: Testen mit verschiedenen Browsern und OSs

async function fetch_csv(csv): Promise<Array<unknown>> {
  return new Promise<ParseResult<unknown>>(
    (resolve, reject) =>
      Papa.parse(csv, { download: true, header: true, skipEmptyLines: true, complete: resolve, error: reject })
  )
    .then(results => results.data);
}

const replacers = [{ from: 'ä', to: 'ae' }, { from: 'ü', to: 'ue' }, { from: 'ö', to: 'oe' }, { from: 'ß', to: 'ss' }];

/**
 * Returns true if any of target_words can be constructed from understood_word by lowercasing and replacing umlauts according to the replacement rules replacers.
 * 
 * @param {Array<string>} target_words Words to match against
 * @param {String} understood_word Word to match
 * @returns {boolean} true if the words match, false otherwise
 */
function words_match(target_words, understood_word) {
  if (understood_word === undefined || understood_word === null) {
    return false;
  }

  const alternatives = new Set();
  alternatives.add(understood_word.toLowerCase());

  for (const { from, to } of replacers) {
    for (const alt of [...alternatives].map(it => it.replaceAll(from, to))) {
      alternatives.add(alt);
    }
  }

  return target_words.some(it => alternatives.has(it.trim()));
}

function slider_percentages() {
  const slider = document.getElementById('jspsych-html-slider-response-response');
  slider.oninput = () => {
    const span = document.getElementById('slider-value');
    span.textContent = `${slider.value}%`;
  };
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
      selected_language: 'de',
      question_prior: false,
      lang_task: true,
      lang_task_training: true,
      lang_task_block_length: 5,
      skip_survey_questions: true,
      skip_id: true,
      skip_consent: true
    };
  }

  input.titration = (input.titration || {});
  input.titration.random = (input.titration.random || []);
  input.titration.linear = (input.titration.linear || []);

  const jsPsych = initJsPsych();

  const linear_titration_required = input.titration.linear.length > 0, random_titration_required = input.titration.random.length > 0;
  const titration_required = linear_titration_required || random_titration_required;

  jsPsych.data.addProperties({ selected_language: input.selected_language });
  const lang = await fetch(`assets/text/langs/${input.selected_language}.json`).then(response => response.json());

  let titration_data;
  const experiment_data = new DataCollection([{}]);
  var titration_trial_data = {
    typed_word: "NA",
    entered_words: []
  };
  var skip_rest = false;
  var last_understood_word = "NA";
  var language_detected;
  var word_understood;

  const configure_microphone = {
    timeline: [
      {
        type: initializeMicrophone,
        button_label: lang['TECHNICAL_SETTINGS']['mic-select-button'],
        device_select_message: lang['TECHNICAL_SETTINGS']['mic-select-text'],
        record_data: false
      },
      {
        type: htmlAudioResponse,
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
            content.replaceChildren(content.children[1], content.children[0]); // make the text appear on top of the buttons, this only works in this specific case. YAGNI.
          },
          prompt: lang['TECHNICAL_SETTINGS']['recording-check'],
          choices: [lang['TECHNICAL_SETTINGS']['change-microphone-button'], lang['TECHNICAL_SETTINGS']['listen-again-button'], lang['BUTTONS']['done-button']]
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
  };

  const configure_speakers = {
    timeline: [
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['TECHNICAL_SETTINGS']['speaker-check'],
        choices: [lang['BUTTONS']['done-button']],
        record_data: false
      },
      { // Prior (first part of the sentence)
        type: AudioKeyboardResponsePlugin,
        stimulus: 'assets/audio/training/audio_test.wav',
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
    loop_function(data) {
      return data.values()[0].response == 1;
    }
  };

  function make_titration(stimulus) {
    return [{
      timeline: [
        {
          type: PreloadPlugin,
          audio() {
            return [`assets/audio/titration/${stimulus}`];
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
          type: AudioKeyboardResponsePlugin,
          stimulus() {
            return `assets/audio/titration/${stimulus}`;
          },
          choices: "NO_KEYS",
          prompt: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
          trial_ends_after_audio: true,
          record_data: false
        }, { // ask if language detected
          type: HtmlButtonResponsePlugin,
          stimulus: lang['TITRATION']['language-detected-question'],
          choices: [lang['BUTTONS']['yes-button'], lang['BUTTONS']['no-button']],
          on_finish(data) {
            titration_trial_data.language_detected_response_time = data.rt;
            titration_trial_data.language_detected = (data.response == 0);
            language_detected = (data.response == 0);
            word_understood = false;
          }
        }
      ]
    }, {
      timeline: [
        { //    ask if word understood
          type: HtmlButtonResponsePlugin,
          stimulus: lang['TITRATION']['word-detected-question'],
          choices: () => [lang['BUTTONS']['yes-button'], ...(last_understood_word != 'NA') ? [lang['BUTTONS']["same-as-last-button"]] : [], lang['BUTTONS']['no-button'],],
          on_finish(data) {
            word_understood = data.response == 0 || (last_understood_word != 'NA' && data.response == 1);
          }
        }
      ],
      conditional_function() {
        return language_detected;
      },
    }, {
      timeline: [
        { //       ask for word
          type: SurveyTextPlugin,
          questions: [{
            prompt: lang['TITRATION']['titration-which-word-question'],
            name: 'understood_word',
            required: true,
          }],
          button_label: lang['BUTTONS']['done-button'],
          on_load() {
            const input = document.getElementById("input-0");
            input.pattern = "[A-ZÄÖÜa-zäöüß]+";
            input.title = lang['TITRATION']['titration-word-input-help'];

            if (jsPsych.data.getLastTrialData().values()[0].response == 1) {
              input.value = last_understood_word;
            }
          },
          on_finish(data) {
            titration_trial_data.entered_words.push(data.response.understood_word);
          }
        }, {//       ask if entered word is intended
          timeline: [{
            type: HtmlButtonResponsePlugin,
            stimulus: () => {
              const entered_word = jsPsych.data.getLastTrialData().values()[0].response.understood_word;
              return lang['TITRATION']['titration-typo-question'] + entered_word;
            },
            choices: [lang['BUTTONS']['yes-button'], lang['BUTTONS']['no-button']],
            on_finish(data) {
              if (data.response == 0) {
                titration_trial_data.typed_word = jsPsych.data.get().values().toReversed()[1].response.understood_word;
              }
            }
          }]
        }
      ],
      conditional_function() { // This references the specific word detected question
        return word_understood;
      },
      loop_function(data) {
        return data.values().reverse()[0].response == 1;
      }
    }];
  }

  function make_titration_cycle(timeline_variables, variant) {
    const timeline = [];
    for (const [index, it] of timeline_variables.entries()) {
      const { word, channel_list, reversed } = it;
      let { Target_word, Target_word_sing_plural, syllables, frequency_ZipfSUBTLEX } = word;

      if (Target_word_sing_plural) {
        Target_word_sing_plural = Target_word_sing_plural.split(",");
      }

      timeline.push([
        {
          type: HtmlKeyboardResponsePlugin,
          stimulus: lang['TITRATION']['titration-next-word'],
          choices: "NO_KEYS",
          trial_duration: 2000,
          record_data: false
        },
        {
          type: CallFunctionPlugin,
          func() {
            skip_rest = false;
            last_understood_word = 'NA';
          },
          record_data: false
        },
        channel_list.flatMap(num_channels => ({
          timeline: [
            ...make_titration(`${reversed ? 'reversed' : 'original'}_${syllables}_${Target_word}_${num_channels}.wav`),
            {
              type: CallFunctionPlugin,
              func() {
                titration_data.push({
                  ...titration_trial_data,
                  entered_words: titration_trial_data.entered_words.length == 0 ? "NA" : titration_trial_data.entered_words,
                  num_channels,
                  syllables,
                  Target_word: Target_word + (reversed ? '_reversed' : ''),
                  actual_word: Target_word,
                  frequency_ZipfSUBTLEX: reversed ? 'NA' : frequency_ZipfSUBTLEX,
                  reversed,
                  subject_id: sub_id
                });

                if (typeof jatos !== 'undefined') {
                  jatos.uploadResultFile(titration_data.csv(), `titration_results_${variant}.csv`);
                }

                skip_rest = !reversed && words_match([Target_word, ...Target_word_sing_plural], titration_trial_data.typed_word);
                last_understood_word = titration_trial_data.typed_word;
                titration_trial_data = {
                  entered_words: [],
                  typed_word: "NA",
                };
              },
              record_data: false
            }
          ],
          conditional_function() {
            return !skip_rest;
          }
        }))
      ]);
      if ((index + 1) % 10 == 0) { // every 10 words
        timeline.push(
          {
            type: CallFunctionPlugin,
            func() {
              confetti();
            }
          },
          {
            type: HtmlButtonResponsePlugin,
            stimulus: lang['TITRATION']['titration-motivation'].replace("$1", index + 1).replace("$2", timeline_variables.length),
            choices: [lang['BUTTONS']['done-button']],
            record_data: false
          },
        );
      }
    }

    return {
      timeline
    };
  }

  const linear_titration_sheet = linear_titration_required ? await fetch_csv('assets/text/titration_linear.csv') : [];
  const random_titration_sheet = random_titration_required ? await fetch_csv('assets/text/titration_random.csv') : [];

  const syllable_groups = random_titration_sheet.reduce((acc, it) => {
    if (!(it.syllables in acc))
      acc[it.syllables] = [];

    acc[it.syllables].push(it);
    return acc;
  }, {});

  let random_titration_data = [];

  for (const syllables in syllable_groups) {
    random_titration_data.push(
      ...jsPsych.randomization
        .sampleWithoutReplacement(syllable_groups[syllables], input.titration.random.length)
        .flatMap((it, index) => ([
          { word: it, reversed: false, channel_list: [input.titration.random[index]] },
          { word: it, reversed: true, channel_list: [input.titration.random[index]] },
        ])),
    );
  }

  random_titration_data = jsPsych.randomization.shuffle(random_titration_data);

  const linear_titration_data = jsPsych.randomization.shuffle([
    ...linear_titration_sheet.map(it => ({ word: it, channel_list: input.titration.linear, reversed: false })),
    ...linear_titration_sheet.map(it => ({ word: it, channel_list: input.titration.linear, reversed: true }))
  ]);

  function make_sensory_titration() {
    if (titration_required) {
      const choices = {
        linear: (linear_titration_required ? [
          {
            type: CallFunctionPlugin,
            func() {
              titration_data = new DataCollection();
            },
            record_data: false
          },
          {
            type: HtmlButtonResponsePlugin,
            stimulus: lang['TITRATION']['begin-titration-linear'],
            choices: [lang['BUTTONS']['done-button']],
            record_data: false
          },
          {
            type: CallFunctionPlugin,
            func() {
              document.getElementsByTagName("html")[0].classList.add("task1");
            },
            record_data: false
          },
          {
            type: HtmlButtonResponsePlugin,
            stimulus: lang['TITRATION']['titration-before-first'],
            choices: [lang['BUTTONS']['done-button']],
            record_data: false
          },
          make_titration_cycle(linear_titration_data, "linear"),
          {
            type: CallFunctionPlugin,
            func() {
              document.getElementsByTagName("html")[0].classList.remove("task1");
            },
            record_data: false
          },
        ] : []),

        random: (random_titration_required ?
          [
            {
              type: CallFunctionPlugin,
              func() {
                titration_data = new DataCollection();
              },
              record_data: false
            },
            {
              type: HtmlButtonResponsePlugin,
              stimulus: lang['TITRATION']['begin-titration-random-sampling'],
              choices: [lang['BUTTONS']['done-button']],
              record_data: false
            },
            {
              type: CallFunctionPlugin,
              func() {
                document.getElementsByTagName("html")[0].classList.add("task2");
              }
            },
            {
              type: HtmlButtonResponsePlugin,
              stimulus: lang['TITRATION']['titration-before-first'],
              choices: [lang['BUTTONS']['done-button']],
              record_data: false
            },
            make_titration_cycle(random_titration_data, "random"),
            {
              type: CallFunctionPlugin,
              func() {
                document.getElementsByTagName("html")[0].classList.remove("task2");
              }
            },
          ] : []
        )
      };

      const randomized = jsPsych.randomization.sampleWithoutReplacement(["linear", "random"], 2);

      experiment_data.addToAll({ linear_first: randomized[0] == "linear", random_first: randomized[0] == "random" });

      return {
        timeline: [
          ...choices[randomized[0]],
          {
            type: HtmlButtonResponsePlugin,
            stimulus: lang['TITRATION']['end-titration-part1'],
            choices: [lang['BUTTONS']['done-button']],
            record_data: false
          },
          ...choices[randomized[1]],
          {
            type: HtmlButtonResponsePlugin,
            stimulus: lang['TITRATION']['end-titration-part2'],
            choices: [lang['BUTTONS']['done-button']],
            record_data: false
          },
        ]
      };
    } else {
      return { timeline: [] };
    }
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
      type: AudioKeyboardResponsePlugin,
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
      type: AudioKeyboardResponsePlugin,
      stimulus: second_stimulus,
      choices: "NO_KEYS",
      prompt: "<img class=\"main-symbol\" src='assets/images/volume.png'>",
      trial_ends_after_audio: true,
      record_data: false,
      on_finish() {
        const path = (typeof second_stimulus === 'string') ? second_stimulus : jsPsych.evaluateTimelineVariable(second_stimulus.name);
        filename_for_upload = "response_" + path.substr(8).split(".")[0] + ".txt";
      }
    }];
  }

  const make_id_input = {
    timeline: [{
      type: survey,
      survey_json: {
        completeText: lang['BUTTONS']['done-button'],
        showQuestionNumbers: false,
        elements:
          [{
            readOnly: true,
            html: lang['ID']['umlaut'],
            type: 'html'
          },
          {
            type: 'text',
            title: lang['ID']['city'],
            name: 'city',
            maskType: "pattern",
            maskSettings: {
              pattern: "a"
            },

            isRequired: true,
            description: "München → m"
          },
          {
            type: 'dropdown',
            title: lang['ID']['birthMonth'],
            name: 'birthMonth',
            choices: lang['ID']['months'],
            isRequired: true,
            placeholder: lang['ID']['placeholder']
          },
          {
            type: 'text',
            title: lang['ID']['birthname'],
            name: 'birthname',
            description: "Lena → la",
            showCommentArea: true,
            maskType: "pattern",
            maskSettings: {
              pattern: "aa",

            },
            isRequired: true,

          },
          {
            type: 'text',
            title: lang['ID']['mother'],
            name: 'mother',
            maskType: "pattern",
            maskSettings: {
              pattern: "aa"
            },
            isRequired: true,
            description: "Emma → ea"
          }
          ]
      },
      on_finish(data) {
        sub_id = data.response.city + data.response.birthMonth + data.response.birthname + data.response.mother;
        jsPsych.data.addProperties({
          subject_id: sub_id
        });
        experiment_data.addToAll({
          subject_id: sub_id
        });
      }
    }]
  };

  function make_clarity_question(record_data) {
    return { // Clarity
      type: HtmlSliderResponsePlugin,
      stimulus: lang['PLANG']['clarity-question'],
      button_label: lang['BUTTONS']['done-button'],
      record_data,
      labels: lang['PLANG']['clarity-labels'],
      require_movement: true,
      //slider_width: 600,
      subject_id: sub_id,
      on_load: slider_percentages,
      on_finish(data) {
        if (!record_data) { return; }
        data.fileName = filename_for_upload;
        data.type = "clarity";

      }
    };
  }

  function make_confidence_question(record_data) {
    return { // Confidence
      type: HtmlSliderResponsePlugin,
      stimulus: lang['PLANG']['confidence-question'],
      button_label: lang['BUTTONS']['done-button'],
      record_data,
      labels: lang['PLANG']['confidence-labels'],
      require_movement: true,
      //slider_width: 600,
      on_load: slider_percentages,
      on_finish(data) {
        if (!record_data) { return; }
        data.fileName = filename_for_upload;
        data.type = "confidence";
      }
    };
  }

  function make_word_question(record_data) {
    return [{
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['word-question'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false
    }, { // Which word was understood?
      type: htmlAudioResponse,
      stimulus: "<img class=\"main-symbol\" src='assets/images/microphone2.png'></img>",
      recording_duration: 7500,
      show_done_button: true,
      done_button_label: lang['BUTTONS']['done-button'],
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
            console.log(roundIndex);
          }
        }
      }
    }];
  }

  function ready_next_sentence(record_data) {
    return [{
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['ready-for-next-stimulus'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false
    }];
  }

  function ask_prior(record_data, in_training) { //TODO: check how explain part influences csv
    return input.question_prior ? {
      type: HtmlButtonResponsePlugin,
      // TODO: den namen schöner
      stimulus: lang['PLANG']['word-question-prior-question'],
      choices: [lang['BUTTONS']['yes-button'], lang['BUTTONS']['no-button'], lang['BUTTONS']['not-understood']],
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
        stimulus: lang['PLANG']['word-question-prior'],
        choices: [lang['BUTTONS']['done-button']],
        record_data: false,
      }, { // Which word was understood?
        type: htmlAudioResponse,
        stimulus: "<img class=\"main-symbol\" src='assets/images/microphone2.png'></img>",
        recording_duration: 7500,
        show_done_button: true,
        done_button_label: lang['BUTTONS']['done-button'],
        record_data,
        on_finish(data) {
          if (record_data) {
            if (typeof jatos !== 'undefined') {
              var prior_filename_for_upload = "prior_" + filename_for_upload;
              jatos.uploadResultFile(data.response, prior_filename_for_upload)
                .then(() => {
                  data.response = prior_filename_for_upload; // Remove response data from RAM, we already saved it to the server.
                  data.fileName = filename_for_upload;
                  data.type = "prior_input";
                  console.log(data.response);
                  console.log(prior_filename_for_upload);
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
        stimulus: lang['PLANG']['expectation-question'],
        button_label: lang['BUTTONS']['done-button'],
        record_data,
        labels: lang['PLANG']['expectation-labels'],
        require_movement: true,
        //slider_width: 600,
        on_load: slider_percentages,
        on_finish(data) {
          if (!record_data) { return; }
          data.fileName = filename_for_upload;
          data.type = "expectation_confidence";
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
    ...make_sentence_playback('assets/audio/training/t_380p.wav', 'assets/audio/training/t_380tw_6.wav'),
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['PLANG']['explanation-post-playback'],
      choices: [lang['BUTTONS']['done-button']],
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
      stimulus: lang['PLANG']['end-of-first-tutorial-sentence'],
      choices: [lang['BUTTONS']['done-button']],
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
      stimulus: lang['PLANG']['end-of-tutorial'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false,
      require_movement: true
    }
  ];

  const selected_randomisation = jsPsych.randomization.randomInt(1, 4);
  console.log("Selected randomisation: ", selected_randomisation);
  var sub_id;
  jsPsych.data.addProperties({
    selected_randomisation
  });

  const blocks = jsPsych.randomization.shuffle(await Promise.all([
    fetch_csv(`assets/text/S${selected_randomisation}A.csv`),
    fetch_csv(`assets/text/S${selected_randomisation}B.csv`),
    fetch_csv(`assets/text/S${selected_randomisation}C.csv`),
    fetch_csv(`assets/text/S${selected_randomisation}D.csv`),
  ]));

  var roundIndex = 1;
  const single_trial_timeline: any[] = [];

  // 4 Blöcke â 50 Sätze
  // Preload assets

  single_trial_timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: () => [jsPsych.evaluateTimelineVariable('sentence'), jsPsych.evaluateTimelineVariable('word')],
    record_data: false,
    show_progress_bar: false
  });
  single_trial_timeline.push(ready_next_sentence(true));
  single_trial_timeline.push(...make_sentence_playback(jsPsych.timelineVariable('sentence'), jsPsych.timelineVariable('word')));

  single_trial_timeline.push({
    timeline: [
      make_clarity_question(true),
      ...make_word_question(true),
      make_confidence_question(true),
      ask_prior(true, false),
      conditional_prior(true)
    ],

    on_timeline_finish() {
      if (typeof jatos !== 'undefined') {
        jatos.submitResultData(jsPsych.data.get().json()); // send the whole data every time, it's not that big
      }
      roundIndex += 1;
    }
  });

  const pause = {
    type: HtmlButtonResponsePlugin,
    stimulus: lang['PLANG']['pause-stimulus'].replace('$1', input.lang_task_block_length),
    choices: [lang['BUTTONS']['done-button']]
  };

  const final_timeline: any[] = [];
  final_timeline.push({
    type: BrowserCheckPlugin,
    on_finish(data) {
      if (data.brower == 'safari') {
        window.alert(lang['browser-exclusion-message']);
        window.close();
      }
    },
    record_data: true
  });
  if (!input.skip_consent) {
    final_timeline.push({
      type: HtmlButtonResponsePlugin,
      stimulus: lang['CONSENT_FORM']['consent-form-titration'],
      choices: [lang['CONSENT_FORM']['consent-button'], lang['CONSENT_FORM']['no-consent-button']],
      on_finish(data) {
        if (data.response == 1) { // Rejected
          window.alert(lang['CONSENT_FORM']['did-not-accept-message']);
          window.close();
        }
      }
    });
  }
  final_timeline.push({
    type: FullscreenPlugin,
    message: lang['TECHNICAL_SETTINGS']['fullscreen-message'],
    button_label: lang['BUTTONS']['done-button']
  });
  if (!input.skip_id) {
    final_timeline.push(make_id_input);
  }
  if (titration_required) {
    final_timeline.push({
      type: HtmlButtonResponsePlugin,
      stimulus: lang['TITRATION']['begin-titration'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false
    });
  }
  final_timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: lang['TECHNICAL_SETTINGS']['begin-technical'],
    choices: [lang['BUTTONS']['done-button']],
    record_data: false
  });
  if (input.lang_task) {
    final_timeline.push(configure_microphone);
  }
  final_timeline.push(configure_speakers);
  if (!input.skip_survey_questions) {
    final_timeline.push(
      { // Speaker intensity
        type: HtmlSliderResponsePlugin,
        stimulus: lang['TECHNICAL_SETTINGS']['speaker-intensity'],
        button_label: lang['BUTTONS']['done-button'],
        record_data: true,
        labels: lang['TECHNICAL_SETTINGS']['speaker-intensity-labels'],
        require_movement: true,
        //slider_width: 600,
        on_load: slider_percentages,
        on_finish(data) {
          experiment_data.addToAll({ speaker_intensity: data.response });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experiment_data.csv(), "experiment_data.csv");
          }
        }
      });
  }
  final_timeline.push({
    type: CallFunctionPlugin,
    func() {
      experiment_data.addToAll({ start_time: jsPsych.getStartTime().toISOString() });

      if (typeof jatos !== 'undefined') {
        jatos.uploadResultFile(experiment_data.csv(), "experiment_data.csv");
      }
    }
  });
  final_timeline.push(make_sensory_titration());
  final_timeline.push({
    type: CallFunctionPlugin,
    func() {
      document.getElementsByTagName("html")[0].classList.add("task3");
    }
  });
  if (input.lang_task_training) {
    final_timeline.push(explanation);
  }
  if (input.lang_task) {
    final_timeline.push({
      timeline: [
        {
          timeline: single_trial_timeline,
          timeline_variables: jsPsych.randomization.sampleWithoutReplacement(blocks[0], input.lang_task_block_length),
          randomize_order: true
        },
        pause,
        {
          timeline: single_trial_timeline,
          timeline_variables: jsPsych.randomization.sampleWithoutReplacement(blocks[1], input.lang_task_block_length),
          randomize_order: true
        },
        pause,
        {
          timeline: single_trial_timeline,
          timeline_variables: jsPsych.randomization.sampleWithoutReplacement(blocks[2], input.lang_task_block_length),
          randomize_order: true
        },
        pause,
        {
          timeline: single_trial_timeline,
          timeline_variables: jsPsych.randomization.sampleWithoutReplacement(blocks[3], input.lang_task_block_length),
          randomize_order: true
        }
      ]
    });
  }
  final_timeline.push({
    type: CallFunctionPlugin,
    func() {
      document.getElementsByTagName("html")[0].classList.remove("task3");
    }
  });
  if (!input.skip_survey_questions) {
    final_timeline.push(
      { // Concentration
        type: HtmlSliderResponsePlugin,
        stimulus: lang['POST_SURVEY']['concentration-question'],
        button_label: lang['BUTTONS']['done-button'],
        record_data: true,
        labels: lang['POST_SURVEY']['concentration-labels'],
        require_movement: true,
        //slider_width: 600,
        on_load: slider_percentages,
        on_finish(data) {
          experiment_data.addToAll({ concentration: data.response });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experiment_data.csv(), "experiment_data.csv");
          }
        }
      });
    final_timeline.push(
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['POST_SURVEY']['self-report-random'],
        choices: [lang['BUTTONS']["yes-button"], lang['BUTTONS']["no-button"]],
        on_finish(data) {
          experiment_data.addToAll({ random: data.response == 0 });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experiment_data.csv(), "experiment_data.csv");
          }
        }
      });
    final_timeline.push(
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['POST_SURVEY']['self-report-honest'],
        choices: [lang['BUTTONS']["yes-button"], lang['BUTTONS']["no-button"]],
        on_finish(data) {
          experiment_data.addToAll({ honest: data.response == 0 });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experiment_data.csv(), "experiment_data.csv");
          }
        }
      });
    final_timeline.push(
      {
        type: HtmlButtonResponsePlugin,
        stimulus: lang['POST_SURVEY']['self-report-headphones'],
        choices: [lang['BUTTONS']["yes-button"], lang['BUTTONS']["no-button"]],
        on_finish(data) {
          experiment_data.addToAll({ headphones: data.response == 0 });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experiment_data.csv(), "experiment_data.csv");
          }
        }
      });
    final_timeline.push(
      { // Quietness of environment
        type: HtmlSliderResponsePlugin,
        stimulus: lang['POST_SURVEY']['quietness-question'],
        button_label: lang['BUTTONS']['done-button'],
        record_data: true,
        labels: lang['POST_SURVEY']['quietness-labels'],
        require_movement: true,
        //slider_width: 600,
        on_load: slider_percentages,
        on_finish(data) {
          experiment_data.addToAll({ quietness: data.response });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experiment_data.csv(), "experiment_data.csv");
          }
        }
      });
    final_timeline.push(
      { // Disruptiveness
        type: HtmlSliderResponsePlugin,
        stimulus: lang['POST_SURVEY']['disruptiveness-question'],
        button_label: lang['BUTTONS']['done-button'],
        record_data: true,
        labels: lang['POST_SURVEY']['disruptiveness-labels'],
        require_movement: true,
        //slider_width: 600,
        on_load: slider_percentages,
        on_finish(data) {
          experiment_data.addToAll({ disruptiveness: data.response });

          if (typeof jatos !== 'undefined') {
            jatos.uploadResultFile(experiment_data.csv(), "experiment_data.csv");
          }
        }
      });
  }
  final_timeline.push(
    {
      type: HtmlButtonResponsePlugin,
      stimulus: lang['TITRATION']['end-titration-final'],
      choices: [lang['BUTTONS']['done-button']],
      record_data: false
    });

  await jsPsych.run(final_timeline);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
}
