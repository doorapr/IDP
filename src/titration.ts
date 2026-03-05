import AudioKeyboardResponsePlugin from "@jspsych/plugin-audio-keyboard-response";
import CallFunctionPlugin from "@jspsych/plugin-call-function";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import PreloadPlugin from "@jspsych/plugin-preload";
import SurveyTextPlugin from "@jspsych/plugin-survey-text";
import { DataCollection, initJsPsych, JsPsych } from "jspsych";
import { RunFunction } from "jspsych-builder";
import { fetchCsv, initializeJsPsychAndLanguage } from "./common";
import confetti from "canvas-confetti";

const replacers = [{ from: 'ä', to: 'ae' }, { from: 'ü', to: 'ue' }, { from: 'ö', to: 'oe' }, { from: 'ß', to: 'ss' }];

/**
 * Returns true if any of target_words can be constructed from understood_word by lowercasing and replacing umlauts according to the replacement rules replacers.
 * 
 * @param target_words Words to match against
 * @param understood_word Word to match
 * @returns true if the words match, false otherwise
 */
function words_match(target_words: Array<string>, understood_word: string): boolean {
  if (understood_word === undefined || understood_word === null) {
    return false;
  }

  const alternatives = new Set<string>();
  alternatives.add(understood_word.toLowerCase());

  for (const { from, to } of replacers) {
    for (const alt of [...alternatives].map(it => it.replaceAll(from, to))) {
      alternatives.add(alt);
    }
  }

  return target_words.some(it => alternatives.has(it.trim()));
}

export const run: RunFunction = async function ({ input }): Promise<JsPsych> {

  const { lang, jsPsych } = await initializeJsPsychAndLanguage(input);

  input.titration = (input.titration || {});
  input.titration.random = (input.titration.random || []);
  input.titration.linear = (input.titration.linear || []);

  const linear_titration_required = input.titration.linear.length > 0, random_titration_required = input.titration.random.length > 0;
  const titration_required = linear_titration_required || random_titration_required;

  let titration_data: any; //TODO: refine type
  const experiment_data = new DataCollection([{}]);
  var titration_trial_data: any = {
    typed_word: "NA",
    entered_words: []
  };
  var skip_rest = false;
  var last_understood_word = "NA";
  var language_detected: boolean;
  var word_understood: boolean;

  function make_titration(stimulus: string) {
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
          on_finish(data: any) {
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
          on_finish(data: any) {
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
            if (!input || !(input instanceof HTMLInputElement)) {
              return; // somethings definitely wrong
            }
            input.pattern = "[A-ZÄÖÜa-zäöüß]+";
            input.title = lang['TITRATION']['titration-word-input-help'];

            if (jsPsych.data.getLastTrialData().values()[0].response == 1) {
              input.value = last_understood_word;
            }
          },
          on_finish(data: any) {
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
            on_finish(data: any) {
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
      loop_function(data: any) {
        return data.values().reverse()[0].response == 1;
      }
    }];
  }

  function make_titration_cycle(timeline_variables: any, variant: any) {
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
        channel_list.flatMap((num_channels: number) => ({
          timeline: [
            ...make_titration(`${reversed ? 'reversed' : 'original'}_${syllables}_${Target_word}_${num_channels}.wav`),
            {
              type: CallFunctionPlugin,
              func() {
                const data = {
                  ...titration_trial_data,
                  entered_words: titration_trial_data.entered_words.length == 0 ? "NA" : titration_trial_data.entered_words,
                  num_channels,
                  syllables,
                  Target_word: Target_word + (reversed ? '_reversed' : ''),
                  actual_word: Target_word,
                  frequency_ZipfSUBTLEX: reversed ? 'NA' : frequency_ZipfSUBTLEX,
                  reversed
                };
                if ("subject_id" in jsPsych.data.get().last(1).values()[0]) {
                  data.subject_id = jsPsych.data.get().last(1).values()[0].subject_id;
                }
                titration_data.push(data);

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

  const linear_titration_sheet: any[] = linear_titration_required ? await fetchCsv('assets/text/titration_linear.csv') : [];
  const random_titration_sheet: any[] = random_titration_required ? await fetchCsv('assets/text/titration_random.csv') : [];

  const syllable_groups = random_titration_sheet.reduce((acc: { [key: number]: any[]; }, it: { syllables: number; }): { [key: number]: any[]; } => {
    if (!(it.syllables in acc))
      acc[it.syllables] = [];

    acc[it.syllables].push(it);
    return acc;
  }, {});

  let random_titration_data: any[] = [];

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

      const randomized: ("linear" | "random")[] = jsPsych.randomization.sampleWithoutReplacement(["linear", "random"], 2);

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


  jsPsych.run([{
    type: HtmlButtonResponsePlugin,
    stimulus: lang['TITRATION']['begin-titration'],
    choices: [lang['BUTTONS']['done-button']],
    record_data: false
  }]);

  return jsPsych;
};
