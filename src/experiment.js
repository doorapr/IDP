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
import HtmlSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import initializeMicrophone from '@jspsych/plugin-initialize-microphone';
import htmlAudioResponse from '@jspsych/plugin-html-audio-response';
import { initJsPsych } from "jspsych";
import fs from "fs";
import OpenAI from "openai";




// TODO: Testen mit verschiedenen Browsern und OSs
// TODO: viele Daten -> kann der Browser das handhaben?
// TODO: Einlesen und handeln von randomisation files
// TODO: NACHFRAGEN: Hübscheres CSS

// TODO: Text / Symbol / Fixation Cross während Audio Playback anzeigen, dor
// TODO: Aufnahme & Transcription, dor

// TODO: english / german prompts, beh
// TODO: Tutorial / Anleitung, beh

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 * 
 */
export async function run({ assetPaths, input = {}, environment, title, version, stimulus, record_data }) {
  //const fs = require('fs');
  //const OpenAI = require('openai');

  //const apiKey = 'your-api-key';        // Replace with your actual API key
  //const openai = new OpenAI({apiKey});
  const openai = new OpenAI();
  const language = "en"
  
  const jsPsych = initJsPsych();

  const timeline = [];
  const explain=[];
  var node = {
    timeline: timeline,
    repetitions: 2
  }
  explain.push({type: initializeMicrophone});
  // Preload assets
  timeline.push({
    type: PreloadPlugin,
    images: assetPaths.images,
    audio: assetPaths.audio,
    video: assetPaths.video,

  });

  // Welcome screen
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p>Welcome to IDP!<p/>",
  });

  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p>You will now hear an audio.<p/>",
  });
  timeline.push({ // Prior
    type: audioKeyboardResponse,
    stimulus: 'assets/audio/Schimpanse.mp3', // audio file here
    choices: "",
    prompt:"<img src='assets/images/volume.png'>",
    trial_ends_after_audio: true,
    record_data: false // We do not record data here because this is a dummy, also the prior will probably not need to record data.
  });
  timeline.push({ 
      type: htmlAudioResponse,
      stimulus: `
          <p>Please say what you heard</p>
      `,
      recording_duration: 15000,
      show_done_button: true,
      done_button_label:"Done",
      //record_data:record_data,
      on_finish: function(data){
        const transcription = openai.audio.transcriptions.create({
          file: fs.createReadStream(data.response),
          model: "whisper-1",
          language:language, // set language
        });
        saveAs(transcription.text,'output/transcription.txt');
        fetch('output/audio.php', { audio_base64: data.response })
            .then((audio_id)=>{
                data.response = audio_id;
            });
    }
  });
 





  await jsPsych.run([explain,node]);

  // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
  // if you handle results yourself, be it here or in `on_finish()`)
  return jsPsych;
}
