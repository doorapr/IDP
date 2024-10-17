import { initJsPsych } from "jspsych";
import SurveyTextPlugin from "@jspsych/plugin-survey-text";
import HtmlSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";

//TODO: CSS so the experiment doesn't look like ass. Maybe there is a pre-defined JATOS css we can use?

/**
 * Creates the language task as a timeline, using the provided stimuli.
 * Each stimulus is presented, then the clarity, the understood word and the confidence are queried.
 * 
 * @param {any[]} stimuli 
 * @param {boolean} record_data 
 * @returns The created timeline.
 */
function createTrial(stimuli, record_data) { //TODO: Name
    return {
        //TODO: Fixation cross?
        timeline: [
            { // Prior
                type: HtmlButtonResponsePlugin, //TODO: Replace dummy stimulus with actual audio output.
                stimulus: jsPsych.timelineVariable('stimulus'),
                choices: ['Ok'],
                record_data: false // We do not record data here because this is a dummy, also the prior will probably not need to record data.
            }, //TODO: Leave a 100ms gap between prior (start of sentence) and input (distorted word)
            { // Clarity
                type: HtmlSliderResponsePlugin,
                stimulus: 'How clearly did you understand the presented word?', //TODO: english / german prompts
                record_data: record_data
            },
            { // Which word?
                type: SurveyTextPlugin,
                questions: [
                    { prompt: 'Which word did you hear?' }
                ],
                record_data: record_data
            },
            { // Confidence
                type: HtmlSliderResponsePlugin,
                stimulus: 'How confident are you that your answer is correct?',
                record_data: record_data
            }
        ], timeline_variables: stimuli.map(it => ({ stimulus: it }))
    }
}

const jsPsych = initJsPsych();

const timeline = [
    //TODO: Intialization, test trials, etc.
    createTrial(['This is the first stimulus', 'This is the second stimulus'], true) //TODO: Clarify how clarity levels of words are picked across participants.
]

jsPsych.run(
    timeline
)

console.log(jsPsych.data) //TODO: Clarify how data should be saved, which data should be saved.