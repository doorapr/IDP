# Participant CSV Export

`export_participant_csv.py` creates one CSV per participant by merging:
- stimulus sentence rows from `assets/text/*.csv`
- participant responses from `demo_results/study_result_*/comp-result_*/data.txt`

It also supports optional speech-to-text (STT) transcription of participant audio payloads (`response_*.txt`, `prior_response_*.txt`).

## Baseline run (no transcription)

From repository root:

```bash
python export_participant_csv.py
```

Optional paths:

```bash
python export_participant_csv.py --results demo_results --assets-text assets/text --output demo_results/participant_exports
```

## Enable transcription

Install Python STT dependencies first:

```bash
pip install -r requirements-stt.txt
```

Then run with transcription enabled:

```bash
python export_participant_csv.py --transcribe both --stt-backend local-whisper --stt-model small --stt-device cpu
```

## STT CLI options

- `--transcribe none|mic|prior|both`
  - `none` (default): disables transcription
  - `mic`: transcribe only `mic_input_file`
  - `prior`: transcribe only `prior_input_file`
  - `both`: transcribe both channels
- `--stt-backend`: STT backend identifier (default `local-whisper`)
- `--stt-model`: model name/path for backend (default `small`)
- `--stt-device`: inference device (default `cpu`)
- `--stt-language`: optional language hint (for example `en`, `de`)
  - if omitted, uses `selected_language` from trial data when available
- `--stt-cache-dir`: cache directory for model downloads and decoded audio (default `.stt_cache`)
- `--fail-on-stt-error`: abort on first STT/decode/missing-file error

## Output

One file per participant is written to `demo_results/participant_exports/`:
- `study_result_XXXX.csv`

Each row is one detected sentence-response bundle and contains:
- all available columns from the matched stimulus CSV row
- simplified response fields such as:
  - `sentence_index`
  - `file_name`
  - `round_index`
  - `clarity_rating`
  - `confidence_rating`
  - `prior_expectation`
  - `expectation_confidence`
  - `mic_input_file`
  - `prior_input_file`
  - `trial_index_first`
  - `trial_index_last`

STT-related fields are also included:

Mic channel:
- `mic_input_text`
- `mic_input_stt_backend`
- `mic_input_stt_language`
- `mic_input_stt_confidence`
- `mic_input_stt_error`

Prior channel:
- `prior_input_text`
- `prior_input_stt_backend`
- `prior_input_stt_language`
- `prior_input_stt_confidence`
- `prior_input_stt_error`

The export intentionally does **not** include:
- `participant__*` fields
- `response__*` prefixes
- `asset__file` and `asset__row` helper columns

## Audio payload format and decoding

- Audio response files are Base64 payloads stored in `.txt` files under `comp-result_*/files/`.
- Payloads are decoded to binary WebM/EBML audio before transcription.
- Decoded artifacts are cached in `--stt-cache-dir`.

## Robustness behavior

- Participants with missing or unusable data are skipped without stopping the run.
- The script automatically selects the most complete `data.txt` per participant.
- Stimulus rows are read from participant `selected_randomisation` files and matched using language config (`assets/text/config/<lang>.json`).
- With transcription enabled, row-level STT failures are captured in `*_stt_error` and export continues by default.
- Use `--fail-on-stt-error` to stop immediately on STT/decode/missing-file errors.
