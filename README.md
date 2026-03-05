# Predictive Language Task

## About

This project uses [jsPsych](https://www.jspsych.org/) for browser-based behavioral experiments and is packaged for JATOS via `jspsych-builder`.

## Quick start (non-technical)

If you just want to run and deploy the experiment:

1. Install Node.js from [nodejs.org](https://nodejs.org/).
2. Open this project folder in a terminal.
3. Run `npm install` once.
4. Start one experiment locally with `npm start <experiment-file>` (examples below).
5. Build a JATOS package with `npm run jatos <experiment-file>`.
6. Import the created `.jzip` into JATOS.

## Which experiment files to use

Use one of these module entrypoints directly:

- `src/experiment-de.ts`
- `src/experiment-de-prior.ts`
- `src/experiment-en.ts`
- `src/experiment-en-prior.ts`

`src/experiment.ts` is the shared base implementation and should not be used directly as a study module.

### Module behavior

The module files above enforce these settings in code:

| Module | Language | Prior question |
| --- | --- | --- |
| `experiment-de.ts` | `de` | `false` |
| `experiment-de-prior.ts` | `de` | `true` |
| `experiment-en.ts` | `en` | `false` |
| `experiment-en-prior.ts` | `en` | `true` |

## JATOS setup

### Importing

1. Build a `.jzip` (see commands below) or download one from Releases.
2. In JATOS: **Studies** → **+** → **Import Study**.
3. Select the generated `.jzip`.

No mandatory JATOS `Study input` configuration is required for normal usage of the module entrypoints.

### Optional Study input keys

If provided, these optional flags are read by `experiment.ts`:

| Key | Values | Effect |
| --- | --- | --- |
| `consent` | `true` / `false` | Shows consent form when `true`. |
| `survey_questions` | `true` / `false` | Enables pre/post survey questions when `true`. |

Keys such as `lang_task`, `lang_task_training`, `question_prior`, `titration.*`, and `selected_language` are not needed for these modules.

## Prerequisites

- [Node.js](https://nodejs.org/) (includes npm)
- Python 3 (only needed for `export_participant_csv.py`)

## Install

```sh
npm install
```

## Run locally

You can start a specific experiment directly:

```sh
npm start experiment-en
npm start experiment-en-prior
npm start experiment-de
npm start experiment-de-prior
```

If you want the equivalent explicit `jspsych` call:

```sh
npm run jspsych -- run <experiment-file>
```

## Create `.jzip` for JATOS

Use:

```sh
npm run jatos <experiment-file>
```

Examples:

```sh
npm run jatos experiment-en
npm run jatos experiment-en-prior
npm run jatos experiment-de
npm run jatos experiment-de-prior
```

`npm run jatos` (without an experiment file) builds the base `experiment` entrypoint.

## Additional HTML modules/assets

The experiment entrypoints include `html` in their `@assets` list.

- Create an `html/` folder at project root.
- Every file in that folder is included in the generated `.jzip`.
- In JATOS, you can use these HTML files as additional components in your study.
- Example: add a participant-ID questionnaire component before the jsPsych timeline by adding an HTML file in `html/` and selecting it as a component HTML file in JATOS.

If `html/` does not exist, `jspsych` build/run commands for these module entrypoints fail.

## Participant CSV export

Use `export_participant_csv.py` to create one CSV per participant.

1. In JATOS, download results via **Export as Jatos Results Archive**.
2. Extract the archive to a folder containing `study_result_*` directories.
3. Run the exporter from repository root, for example:

```sh
python export_participant_csv.py --results <extracted-results-folder>
```

Optional with transcription:

```sh
pip install -r requirements-stt.txt
python export_participant_csv.py --results <extracted-results-folder> --transcribe both --stt-backend local-whisper --stt-model small --stt-device cpu
```

For full options and output details, see `EXPORT_PARTICIPANT_CSV.md`.



