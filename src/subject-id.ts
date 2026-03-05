import { RunFunction } from "jspsych-builder";
import { initializeJsPsychAndLanguage } from "./common";
import SurveyPlugin from "@jspsych/plugin-survey";
import { JsPsych } from "jspsych";

export const run: RunFunction = async function run({ assetPaths, input, environment, title, version }): Promise<JsPsych> {
    const { jsPsych, lang } = await initializeJsPsychAndLanguage(input);

    jsPsych.run([{
        timeline: [{
            type: SurveyPlugin,
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
            on_finish(data: any) {
                let subject_id = data.response.city + data.response.birthMonth + data.response.birthname + data.response.mother;
                jsPsych.data.addProperties({
                    subject_id
                });
            }
        }]
    }]);

    return jsPsych;
};