#!/usr/bin/env python3
import argparse
import base64
import binascii
import csv
from dataclasses import dataclass
import hashlib
import importlib
import json
import math
from pathlib import Path
from typing import Any, Dict, List, Optional, Protocol, Tuple

SENTENCE_TYPES = {
    "clarity",
    "mic_input",
    "confidence",
    "prior_expectation",
    "prior_input",
    "expectation_confidence",
}


@dataclass
class TranscriptionResult:
    text: Optional[str] = None
    language: Optional[str] = None
    confidence: Optional[float] = None
    backend: str = ""
    error: Optional[str] = None


@dataclass
class STTConfig:
    mode: str
    backend: str
    model: str
    device: str
    language: Optional[str]
    cache_dir: Path
    fail_on_error: bool


class SpeechToTextProvider(Protocol):
    backend_name: str

    def transcribe(self, audio_path: Path, language_hint: Optional[str] = None) -> TranscriptionResult:
        ...


class LocalWhisperProvider:
    backend_name = "local-whisper"

    def __init__(self, model_name: str, device: str, download_root: Optional[Path]) -> None:
        self.model_name = model_name
        self.device = device
        self.download_root = str(download_root.resolve()) if download_root else None
        self._model: Any = None

    def _ensure_model(self) -> None:
        if self._model is not None:
            return
        try:
            whisper_module = importlib.import_module("faster_whisper")
            whisper_model_cls = getattr(whisper_module, "WhisperModel")
        except ImportError as exc:
            raise RuntimeError(
                "faster-whisper is not installed. Install dependencies with: "
                "pip install -r requirements-stt.txt"
            ) from exc

        self._model = whisper_model_cls(
            self.model_name,
            device=self.device,
            download_root=self.download_root,
        )

    def transcribe(self, audio_path: Path, language_hint: Optional[str] = None) -> TranscriptionResult:
        self._ensure_model()
        model = self._model
        if model is None:
            raise RuntimeError("STT model initialization failed")

        segments, info = model.transcribe(
            str(audio_path),
            language=language_hint,
            vad_filter=True,
        )

        collected = []
        confidence_scores: List[float] = []

        for segment in segments:
            segment_text = (getattr(segment, "text", "") or "").strip()
            if segment_text:
                collected.append(segment_text)

            avg_logprob = getattr(segment, "avg_logprob", None)
            if isinstance(avg_logprob, (int, float)):
                confidence_scores.append(max(0.0, min(1.0, math.exp(avg_logprob))))

        confidence = None
        if confidence_scores:
            confidence = sum(confidence_scores) / len(confidence_scores)

        return TranscriptionResult(
            text=" ".join(collected).strip() or None,
            language=getattr(info, "language", None),
            confidence=confidence,
            backend=self.backend_name,
            error=None,
        )


def create_stt_provider(config: STTConfig) -> SpeechToTextProvider:
    backend = (config.backend or "").strip().lower()
    if backend == "local-whisper":
        return LocalWhisperProvider(
            model_name=config.model,
            device=config.device,
            download_root=config.cache_dir,
        )
    if backend in {"openai", "azure-speech"}:
        raise NotImplementedError(
            f"STT backend '{backend}' is reserved for future cloud integration and is not implemented yet."
        )
    raise ValueError(f"Unknown STT backend: {config.backend}")


def should_transcribe_channel(mode: str, channel: str) -> bool:
    mode = (mode or "none").lower()
    if mode == "both":
        return True
    if mode == "none":
        return False
    return mode == channel


def resolve_files_dir_from_data_file(data_file: Path) -> Path:
    return data_file.parent / "files"


def decode_base64_audio_file(input_txt: Path, output_dir: Path) -> Path:
    payload = read_text_file(input_txt)
    if payload is None:
        raise ValueError("unable to read payload text")

    payload = payload.strip()
    if not payload:
        raise ValueError("empty payload")

    if "base64," in payload:
        payload = payload.split("base64,", 1)[1]

    normalized = "".join(payload.split())
    try:
        decoded = base64.b64decode(normalized, validate=True)
    except binascii.Error as exc:
        raise ValueError("invalid base64 payload") from exc

    if not decoded:
        raise ValueError("decoded payload is empty")

    output_dir.mkdir(parents=True, exist_ok=True)
    payload_hash = hashlib.sha256(decoded).hexdigest()[:20]
    output_path = output_dir / f"{input_txt.stem}_{payload_hash}.webm"
    if not output_path.exists():
        output_path.write_bytes(decoded)

    return output_path


def transcribe_payload_file(
    response_file_name: Any,
    files_dir: Path,
    provider: SpeechToTextProvider,
    language_hint: Optional[str],
    decode_cache_dir: Path,
    stt_cache: Dict[str, TranscriptionResult],
) -> TranscriptionResult:
    backend_name = getattr(provider, "backend_name", "")

    if not isinstance(response_file_name, str) or not response_file_name.strip():
        return TranscriptionResult(backend=backend_name)

    response_path = files_dir / Path(response_file_name).name
    if not response_path.exists() or not response_path.is_file():
        return TranscriptionResult(
            backend=backend_name,
            error=f"audio file not found: {response_path.name}",
        )

    try:
        decoded_audio_path = decode_base64_audio_file(response_path, decode_cache_dir)
    except Exception as exc:
        return TranscriptionResult(
            backend=backend_name,
            error=f"decode failed for {response_path.name}: {exc}",
        )

    cache_key = f"{decoded_audio_path}|{language_hint or ''}|{backend_name}"
    cached = stt_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        result = provider.transcribe(decoded_audio_path, language_hint=language_hint)
        if not result.backend:
            result.backend = backend_name
    except Exception as exc:
        result = TranscriptionResult(
            backend=backend_name,
            error=f"stt failed for {response_path.name}: {exc}",
        )

    stt_cache[cache_key] = result
    return result


def apply_transcription_to_row(
    out: Dict[str, Any],
    bundle: Dict[str, Any],
    files_dir: Path,
    provider: Optional[SpeechToTextProvider],
    config: STTConfig,
    language_hint: Optional[str],
    decode_cache_dir: Path,
    stt_cache: Dict[str, TranscriptionResult],
) -> None:
    def init_fields(prefix: str) -> None:
        out[f"{prefix}_text"] = None
        out[f"{prefix}_stt_backend"] = None
        out[f"{prefix}_stt_language"] = None
        out[f"{prefix}_stt_confidence"] = None
        out[f"{prefix}_stt_error"] = None

    init_fields("mic_input")
    init_fields("prior_input")

    if provider is None:
        return

    channel_to_bundle_key = {
        "mic": "mic_input_file",
        "prior": "prior_input_file",
    }

    for channel, source_key in channel_to_bundle_key.items():
        if not should_transcribe_channel(config.mode, channel):
            continue

        result = transcribe_payload_file(
            response_file_name=bundle.get(source_key),
            files_dir=files_dir,
            provider=provider,
            language_hint=language_hint,
            decode_cache_dir=decode_cache_dir,
            stt_cache=stt_cache,
        )

        prefix = "mic_input" if channel == "mic" else "prior_input"
        out[f"{prefix}_text"] = result.text
        out[f"{prefix}_stt_backend"] = result.backend
        out[f"{prefix}_stt_language"] = result.language
        out[f"{prefix}_stt_confidence"] = result.confidence
        out[f"{prefix}_stt_error"] = result.error

        if result.error and config.fail_on_error:
            raise RuntimeError(result.error)

def read_text_file(path: Path) -> Optional[str]:
    for enc in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return path.read_text(encoding=enc)
        except Exception:
            continue
    return None


def load_trials(data_file: Path) -> Optional[List[Dict[str, Any]]]:
    raw = read_text_file(data_file)
    if not raw:
        return None
    try:
        data = json.loads(raw)
    except Exception:
        return None
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return None


def normalize_audio_stem(value: Any) -> Optional[str]:
    if not isinstance(value, str):
        return None
    value = value.strip().strip('"').strip("'")
    if not value:
        return None
    name = Path(value).name
    if not name:
        return None
    return Path(name).stem


def build_stimuli_map(stim_paths: List[Path], word_stimulus_column: str) -> Dict[str, Dict[str, Any]]:
    key_to_row: Dict[str, Dict[str, Any]] = {}

    for stim_path in stim_paths:
        if not stim_path.exists() or not stim_path.is_file():
            continue
        try:
            with stim_path.open("r", encoding="utf-8-sig", newline="") as f:
                reader = csv.DictReader(f)
                for row_index, row in enumerate(reader, start=1):
                    if row is None:
                        continue
                    row_data = dict(row)

                    stem = normalize_audio_stem(row_data.get(word_stimulus_column))
                    if not stem:
                        continue

                    key = stem[8:] if len(stem) > 8 else stem
                    if key not in key_to_row:
                        key_to_row[key] = row_data
        except Exception:
            continue

    return key_to_row


def select_best_data_file(study_dir: Path) -> Optional[Path]:
    candidates = sorted(study_dir.glob("comp-result_*/data.txt"))
    best_file: Optional[Path] = None
    best_score: Tuple[int, int] = (-1, -1)

    for data_file in candidates:
        size = data_file.stat().st_size if data_file.exists() else 0
        trials = load_trials(data_file)
        trial_count = len(trials) if trials is not None else -1
        score = (trial_count, size)
        if score > best_score:
            best_score = score
            best_file = data_file

    return best_file


def extract_selected_randomisation(trials: List[Dict[str, Any]]) -> List[str]:
    for trial in trials:
        selected = trial.get("selected_randomisation")
        if isinstance(selected, list) and selected:
            values = [str(v) for v in selected if isinstance(v, str)]
            if values:
                return values
    return []


def extract_selected_language(trials: List[Dict[str, Any]]) -> Optional[str]:
    for trial in trials:
        if isinstance(trial.get("selected_language"), str):
            return trial.get("selected_language")
    return None


def get_word_stimulus_column(assets_text_dir: Path, selected_language: Optional[str]) -> str:
    default_col = "Single_Word"
    if not selected_language:
        return default_col

    config_file = assets_text_dir / "config" / f"{selected_language}.json"
    raw = read_text_file(config_file)
    if not raw:
        return default_col

    try:
        config = json.loads(raw)
    except Exception:
        return default_col

    value = config.get("word_stimulus_column")
    if isinstance(value, str) and value:
        return value
    return default_col


def find_workspace_path(workspace_root: Path, maybe_asset_path: str) -> Path:
    cleaned = maybe_asset_path.replace("\\", "/")
    if cleaned.startswith("/"):
        cleaned = cleaned[1:]
    return (workspace_root / cleaned).resolve()


def parse_file_key(file_name: Any) -> Optional[str]:
    if not isinstance(file_name, str):
        return None
    name = Path(file_name).name
    for prefix in ("prior_response_", "response_", "prior_"):
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    if name.endswith(".txt"):
        name = name[:-4]
    name = name.strip()
    return name or None


def parse_sentence_bundles(trials: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    ordered = sorted(trials, key=lambda t: (int(t.get("trial_index", 10**9)), int(t.get("time_elapsed", 10**9))))
    bundles: List[Dict[str, Any]] = []

    def get_or_create_bundle(file_name: str) -> Dict[str, Any]:
        for bundle in reversed(bundles):
            if bundle.get("fileName") == file_name:
                return bundle
        bundle = {
            "fileName": file_name,
            "trial_index_first": None,
            "trial_index_last": None,
            "round_index": None,
        }
        bundles.append(bundle)
        return bundle

    for trial in ordered:
        ttype = trial.get("type")
        file_name = trial.get("fileName")
        if ttype not in SENTENCE_TYPES or not isinstance(file_name, str) or not file_name:
            continue

        if ttype == "clarity":
            bundle = {
                "fileName": file_name,
                "trial_index_first": trial.get("trial_index"),
                "trial_index_last": trial.get("trial_index"),
                "round_index": None,
            }
            bundles.append(bundle)
        else:
            bundle = get_or_create_bundle(file_name)
            bundle["trial_index_last"] = trial.get("trial_index")

        if bundle.get("trial_index_first") is None:
            bundle["trial_index_first"] = trial.get("trial_index")

        if ttype == "clarity":
            bundle["clarity_rating"] = trial.get("response")
        elif ttype == "mic_input":
            bundle["mic_input_file"] = trial.get("response")
            bundle["round_index"] = trial.get("roundIndex")
        elif ttype == "confidence":
            bundle["confidence_rating"] = trial.get("response")
        elif ttype == "prior_expectation":
            bundle["prior_expectation_response"] = trial.get("response")
        elif ttype == "prior_input":
            bundle["prior_input_file"] = trial.get("response")
        elif ttype == "expectation_confidence":
            bundle["expectation_confidence_rating"] = trial.get("response")

    return bundles


def allocate_stimulus_row(
    key_to_row: Dict[str, Dict[str, Any]],
    response_key: str,
) -> Optional[Dict[str, Any]]:
    return key_to_row.get(response_key)


def gather_stimulus_paths(
    workspace_root: Path,
    selected_randomisation: List[str],
    assets_text_dir: Path,
) -> List[Path]:
    if selected_randomisation:
        paths = []
        for item in selected_randomisation:
            p = find_workspace_path(workspace_root, item)
            if p.exists() and p.is_file() and p.suffix.lower() == ".csv":
                paths.append(p)
        if paths:
            return paths

    fallback = [
        p for p in sorted(assets_text_dir.glob("*.csv"))
        if p.name.lower() not in {"titration_linear.csv", "titration_random.csv"}
    ]
    return fallback


def process_participant(
    study_dir: Path,
    workspace_root: Path,
    assets_text_dir: Path,
    provider: Optional[SpeechToTextProvider],
    config: STTConfig,
) -> Optional[List[Dict[str, Any]]]:
    data_file = select_best_data_file(study_dir)
    if not data_file:
        return None

    trials = load_trials(data_file)
    if not trials:
        return None

    selected_randomisation = extract_selected_randomisation(trials)
    selected_language = extract_selected_language(trials)
    stt_language_hint = (config.language or selected_language or None)
    word_stimulus_column = get_word_stimulus_column(assets_text_dir, selected_language)
    stim_paths = gather_stimulus_paths(workspace_root, selected_randomisation, assets_text_dir)
    key_to_row = build_stimuli_map(stim_paths, word_stimulus_column)
    files_dir = resolve_files_dir_from_data_file(data_file)
    decode_cache_dir = config.cache_dir / "decoded_audio"
    stt_cache: Dict[str, TranscriptionResult] = {}

    bundles = parse_sentence_bundles(trials)
    if not bundles:
        return None

    participant_rows: List[Dict[str, Any]] = []

    for bundle_index, bundle in enumerate(bundles, start=1):
        file_name = bundle.get("fileName")
        response_key = parse_file_key(file_name)
        if not response_key:
            continue

        stim_row = allocate_stimulus_row(key_to_row, response_key)

        out: Dict[str, Any] = {}
        if stim_row:
            out.update(stim_row)

        out.update({
            "sentence_index": bundle_index,
            "file_name": file_name,
            "round_index": bundle.get("round_index"),
            "clarity_rating": bundle.get("clarity_rating"),
            "confidence_rating": bundle.get("confidence_rating"),
            "prior_expectation": bundle.get("prior_expectation_response"),
            "expectation_confidence": bundle.get("expectation_confidence_rating"),
            "mic_input_file": bundle.get("mic_input_file"),
            "prior_input_file": bundle.get("prior_input_file"),
            "trial_index_first": bundle.get("trial_index_first"),
            "trial_index_last": bundle.get("trial_index_last"),
        })

        apply_transcription_to_row(
            out=out,
            bundle=bundle,
            files_dir=files_dir,
            provider=provider,
            config=config,
            language_hint=stt_language_hint,
            decode_cache_dir=decode_cache_dir,
            stt_cache=stt_cache,
        )

        participant_rows.append(out)

    return participant_rows


def write_rows_to_csv(rows: List[Dict[str, Any]], output_file: Path) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)
    fieldnames: List[str] = []
    seen = set()

    for row in rows:
        for key in row.keys():
            if key not in seen:
                seen.add(key)
                fieldnames.append(key)

    with output_file.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Export one CSV per participant by merging stimulus rows with jsPsych response data."
    )
    parser.add_argument(
        "--results",
        default="demo_results",
        help="Directory containing study_result_* folders (default: demo_results)",
    )
    parser.add_argument(
        "--assets-text",
        default="assets/text",
        help="Directory containing stimulus CSV files (default: assets/text)",
    )
    parser.add_argument(
        "--output",
        default="demo_results/participant_exports",
        help="Output directory for per-participant CSV files",
    )
    parser.add_argument(
        "--transcribe",
        default="none",
        choices=["none", "mic", "prior", "both"],
        help="Transcribe participant audio responses: none|mic|prior|both (default: none)",
    )
    parser.add_argument(
        "--stt-backend",
        default="local-whisper",
        help="STT backend identifier (default: local-whisper)",
    )
    parser.add_argument(
        "--stt-model",
        default="small",
        help="Model name/path for STT backend (default: small)",
    )
    parser.add_argument(
        "--stt-device",
        default="cpu",
        help="Device for STT backend (default: cpu)",
    )
    parser.add_argument(
        "--stt-language",
        default=None,
        help="Optional language hint for STT (e.g. en, de). If omitted, uses selected_language from trials.",
    )
    parser.add_argument(
        "--stt-cache-dir",
        default=".stt_cache",
        help="Directory for decoded audio and backend model cache (default: .stt_cache)",
    )
    parser.add_argument(
        "--fail-on-stt-error",
        action="store_true",
        help="Abort export on first STT/decode/missing-audio error instead of writing *_stt_error.",
    )

    args = parser.parse_args()

    workspace_root = Path.cwd().resolve()
    results_dir = (workspace_root / args.results).resolve()
    assets_text_dir = (workspace_root / args.assets_text).resolve()
    output_dir = (workspace_root / args.output).resolve()
    stt_cache_dir = (workspace_root / args.stt_cache_dir).resolve()

    if not results_dir.exists() or not results_dir.is_dir():
        print(f"Results directory not found: {results_dir}")
        return 1
    if not assets_text_dir.exists() or not assets_text_dir.is_dir():
        print(f"Assets text directory not found: {assets_text_dir}")
        return 1

    study_dirs = [p for p in sorted(results_dir.glob("study_result_*")) if p.is_dir()]
    if not study_dirs:
        print(f"No study_result_* folders found in {results_dir}")
        return 1

    stt_config = STTConfig(
        mode=args.transcribe,
        backend=args.stt_backend,
        model=args.stt_model,
        device=args.stt_device,
        language=args.stt_language,
        cache_dir=stt_cache_dir,
        fail_on_error=args.fail_on_stt_error,
    )

    provider: Optional[SpeechToTextProvider] = None
    if stt_config.mode != "none":
        stt_config.cache_dir.mkdir(parents=True, exist_ok=True)
        try:
            provider = create_stt_provider(stt_config)
        except Exception as exc:
            print(f"Failed to initialize STT provider '{stt_config.backend}': {exc}")
            return 1

    exported = 0
    skipped = 0

    for study_dir in study_dirs:
        try:
            rows = process_participant(
                study_dir,
                workspace_root,
                assets_text_dir,
                provider=provider,
                config=stt_config,
            )
            if not rows:
                skipped += 1
                print(f"[skip] {study_dir.name}: no usable sentence-response data")
                continue

            out_file = output_dir / f"{study_dir.name}.csv"
            write_rows_to_csv(rows, out_file)
            exported += 1
            print(f"[ok] {study_dir.name}: wrote {len(rows)} rows -> {out_file}")
        except Exception as exc:
            skipped += 1
            print(f"[skip] {study_dir.name}: {exc}")

    print(f"Done. Exported={exported}, Skipped={skipped}, Output={output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
