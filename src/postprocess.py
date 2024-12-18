# requires installing SpeechRecognition, Vosk
try:
    import speech_recognition as sr
except ImportError:
    print('This script requires the SpeechRecognition package to be installed. Install it with "python -m pip install SpeechRecognition", see also: https://pypi.org/project/SpeechRecognition/')
    exit(1)
    
try:
    from vosk import Model
except ImportError:
    print('This script requires the vosk package to be installed. Install it with "python -m pip install vosk", see also: https://pypi.org/project/vosk/')
    exit(1)
    
import base64
import os
import subprocess
from glob import glob
import csv
import json
import sys
import time
from inspect import getsourcefile
from os.path import abspath
#import pandas as pd

print(sys.argv)

current_dir = os.path.dirname(abspath(getsourcefile(lambda: 0)))
ffmpeg = os.path.join(current_dir, 'ffmpeg', sys.platform, 'ffmpeg' + ('.exe' if sys.platform == 'win32' else ''))

if not os.path.exists(ffmpeg) or not os.path.isfile(ffmpeg):
    print(f'Your system is not supported (platform is {sys.platform}, looking for {ffmpeg}).')
    if not os.path.exists(ffmpeg):
        print("Does not exist")
    if not os.path.isfile(ffmpeg):
        print("Is not a regular file")
    exit(1)


if len(sys.argv) == 1:
    print('''
          postprocess.py - post process results for a study of the LangTask experiment
          
          To use this script you need python >= 3.9 <= 3.12, and to install the SpeechRecognition and vosk packages.
          
          The script should be called like this: python3 postprocess.py [directory of the results of one participant e.g. study_results_39 (always contains one comp_results_...)].
          ''')
    exit(0)

# Data file manuel runterladen?
base_dir = sys.argv[1]

if not os.path.exists(base_dir):
    print(f'The given location ({base_dir}) does not exist.')
    exit(1)

if not os.path.isdir(base_dir):
    print(f'The given location ({base_dir}) is not a directory.')
    exit(1)

files = glob(os.path.join(base_dir, '*/files/*.txt'))
data_file = glob(os.path.join(base_dir, '*/data.txt'))[0]

if not os.path.exists(data_file):
    print(f'Could not find results file data.txt for participant, expected it at {data_file}.')
    exit(1)

print(f'Found data file at {data_file}.')
print(f'Found {len(files)} files to do speech recognition on.')

model_dir = os.path.join(current_dir, 'de-small')
if not os.path.exists(model_dir):
    print(f'Vosk speech model not found, it was expected at this path: {model_dir}. You can download it from here: https://alphacephei.com/vosk/models currently we use the vosk-model-de-0.21 for german language recognition.')
    exit(1)

recognizer = sr.Recognizer()
recognizer.vosk_model = Model(
    # TODO: Internationalisation, english model
    model_path=model_dir
)

overall_start = time.time()

json_decoder = json.decoder.JSONDecoder()

transcription_map = {}
for fileName in files:
    start = time.time()
    file = open(os.path.join(base_dir, fileName), 'r')
    binPath = os.path.join(base_dir, fileName.replace('.txt', '.bin'))
    wavPath = os.path.join(base_dir, fileName.replace('.txt', '.wav'))
    binFile = open(binPath, 'wb')
    binFile.write(base64.b64decode(file.read()))
    binFile.close()
    subprocess.run([ffmpeg, '-i', binPath, "-ar", "16000", "-ac", "1", wavPath, '-y'])
    file.close()
    with sr.AudioFile(wavPath) as source:
        audio_data = recognizer.record(source)
        result = json_decoder.decode(recognizer.recognize_vosk(audio_data, 'de'))['text']
        filename = os.path.basename(wavPath)
        if filename not in transcription_map:
            transcription_map[filename] = {"transcription": result}
        else:
            transcription_map[filename]["transcription"] = result
        end = time.time()
        print("Recognized word " + result + " for file " + wavPath + " in " + str(end - start) + " seconds.")
    
overall_end = time.time()
print("Recognized " + str(len(files)) + " words in " + str(overall_end - overall_start) + " seconds, "  + str(len(files) / (overall_end - overall_start)) + " per second.")

study_data = open(data_file, "r").read()

json_object = json.loads(study_data)
subject_id = json_object[0].get("subject_id", "unknown_subject")
randomisation = json_object[0].get("selected_randomisation", "unknown_randomisation")
for x in range(0, len(json_object)):
    if "fileName" in json_object[x]:
        key = json_object[x]["fileName"].replace('.txt', '.wav')
        transcription_map[key]["subject_id"]= subject_id
        transcription_map[key]["randomisation"]= randomisation
        if json_object[x]["type"] == "clarity":
            clarity = json_object[x]["response"]
            transcription_map[key]["clarity"] = clarity
        if json_object[x]["type"] == "confidence":
            confidence = json_object[x]["response"]
            transcription_map[key]["confidence"] = confidence
        if json_object[x]["type"] == "mic_input":
            response_audio = json_object[x]["response"]
            transcription_map[key]["response_audio"] = response_audio

    # print(json_object[x])

#print(transcription_map)
path_original_csv="src/original_csv.csv"

with open(os.path.join(os.path.dirname(data_file), "results.csv"), 'w', newline='') as file:
    writer = csv.writer(file)
    field = ["subject_id","audio" "transcription", "confidence", "clarity", "response_audio","randomisation"]
    writer.writerow(field)
    for key, values in transcription_map.items():
        writer.writerow([
            subject_id,
            key,
            values.get("transcription", ""),
            values.get("confidence", ""),
            values.get("clarity", ""),
            values.get("response_audio", ""),
            values.get("randomisation", "")
        ])



#original = pd.read_csv(path_original_csv)
#dict_df = pd.DataFrame.from_dict(transcription_map, orient='index').reset_index()
#print(dict_df)
#  csv file pro person
# index, proband, target_word,
