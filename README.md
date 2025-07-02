# Predictive Language Task

## About the Project

This project uses [jsPsych](https://www.jspsych.org/), a JavaScript library for creating experiments in behavioral research. The project is designed as a web application and can be run locally.

## Creating a study using this template

Download a .jzip from the Releases page or build it yourself (see instructions below).
Go to your JATOS server, click the `Studies` button at the top left, then the blue plus at the top and click "Import Study".
Choose the .jzip you aquired previously.
After import is complete, change study name and description to your liking. Before the experiment works, you have to configure it by providing a `Study input`.
Below, you can see an example Study input.
```
{
  "titration": {
    "linear": [
      1,
      5,
      10,
      20
    ],
    "random": [
      1,
      5,
      20
    ]
  },
  "selected_language": "de",
  "lang_task": false,
  "lang_task_training": false,
  "question_prior": true
}
```

Available options: 

| Key  | Possible Values | Description | Example |
| ------------- | ------------- | ------------ | --------- |
| `selected_language`  | `de`  | Sets the selected language. Currently only german is supported. | `"selected_language": "de"` |
| `lang_task`  | `true`, `false` | Should the lang task be included? | `"lang_task": true` |
| `lang_task_training` | `true`, `false` | Should the lang task training be included? | `"lang_task_training": true` |
| `question_prior` | `true`, `false` | Should the explicit prior question be included? This only has an effect if `lang_task` is `true`. | `"question_prior": false` |
| `titration` | Nothing, or an object containing titration configuration | This is a container for all titration settings. | `"titration": {} |
| `titration.linear` | Nothing, or an array of channel numbers | If this option is present, linear titration will be included with the given channels. | `"titration: { "linear": [5, 10, 15, 20] }` |
| `titration.random` | Nothing, or an array of channel numbers | If this option is present, random titration will be included with the given channels. | `"titration: { "random": [5, 10, 15, 20] }` |


## Prerequisites

Before you start the project, make sure the following software is installed:

- [Node.js](https://nodejs.org/) 
- npm (installed with Node.js)

## Installing Node.js and npm

If Node.js and npm are not installed, follow these steps:

1. Visit the official [Node.js website](https://nodejs.org/).
2. Download the current LTS version for your operating system.
3. Install Node.js by following the instructions in the installation wizard.
4. After installation, you can check if Node.js and npm were successfully installed by typing the following commands in the terminal:
   ```sh
   node -v  # Shows the installed Node.js version
   npm -v   # Shows the installed npm version

## Installing the Project
1. Clone the repository or download the files:
    ```sh
    git clone <repository-url>
    cd <project-directory>
2. Install the dependencies:
    ```sh
    npm install

## Running the Project

To start the project, use the following command in the terminal:
    ```
    npm start
    ```

The project will be available at http://localhost:3000/ in your browser by default.

## Creating a .jzip for Jatos

Create a .jzip that can be imported with a JATOS server:
    ```
    npm run jatos
    ```
>[!NOTE]
>If you use sensory titration, you will have to manually copy the audio assets for that to the .jzip file. To do that open the .jzip file using an archive manager, then copy the `assets/audio/titration` folder into the .jzip file under `experiment\assets\audio\titration`.



