# requires installing SpeechRecognition, Vosk

import speech_recognition as sr
import base64
import os
import subprocess
from glob import glob
from vosk import Model
import csv
import json
import sys
import time
from inspect import getsourcefile
from os.path import abspath

print(sys.argv)

current_dir = os.path.dirname(abspath(getsourcefile(lambda: 0)))
ffmpeg = os.path.join(current_dir, 'ffmpeg', sys.platform,
                      'ffmpeg' + ('.exe' if sys.platform == 'win32' else ''))

if not os.path.exists(ffmpeg) or not os.path.isfile(ffmpeg):
    print(f'Your system is not supported (platform is {
          sys.platform}, looking for {ffmpeg}).')
    if not os.path.exists(ffmpeg):
        print("Does not exist")
    if not os.path.isfile(ffmpeg):
        print("Is not a regular file")
    exit(1)


if len(sys.argv) == 1:
    print('''
          postprocess.py - post process results for a study of the LangTask experiment
          
          To use this script you need python >= 3.9 <= 3.12, and to install the SpeechRecognition and vosk packages.
          
          The script should be called like this: python3 postprocess.py [base directory of the results].
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

files = glob('**/*.txt', root_dir=base_dir, recursive=True)

print(f'Found {len(files)} files to do speech recognition on.')

recognizer = sr.Recognizer()
recognizer.vosk_model = Model(
    # TODO: Internationalisation, english model
    model_path=os.path.join(current_dir, 'de-big')
)

overall_start = time.time()

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
        result = recognizer.recognize_vosk(audio_data, 'de')
        if wavPath not in transcription_map:
            transcription_map[wavPath] = {"transcription": result}
        else:
            transcription_map[wavPath]["transcription"] = result
        end = time.time()
        print("Recognized word " + result + " for file " + wavPath + " in " + str(end - start) + " seconds.")
    
overall_end = time.time()
print("Recognized " + str(len(files)) + " words in " + str(overall_end - overall_start) + " seconds, "  + str(len(files) / (overall_end - overall_start)) + " per second.")


fileName = "data_test.txt"
data_path = '/Users/dorapruteanu/Downloads'
dataPath = os.path.join(data_path, fileName)
study_data = open(dataPath, "r").read()

json_object = json.loads(study_data)
subject_id = json_object[0].get("subject_id", "unknown_subject")
for x in range(0, len(json_object)):
    if "fileName" in json_object[x]:
        key = json_object[x]["fileName"].replace('.txt', '.wav')
        if json_object[x]["type"] == "clarity":
            clarity = json_object[x]["response"]
            transcription_map[key]["clarity"] = clarity
        if json_object[x]["type"] == "confidence":
            confidence = json_object[x]["response"]
            transcription_map[key]["confidence"] = confidence
    # print(json_object[x])

print(transcription_map)
with open(f"{subject_id}.csv", 'w', newline='') as file:
    writer = csv.writer(file)
    field = ["audio", "transcription", "confidence", "clarity"]
    writer.writerow(field)
    for key, values in transcription_map.items():
        writer.writerow([
            key,
            values.get("transcription", ""),
            values.get("confidence", ""),
            values.get("clarity", "")
        ])
#  csv file pro person
# index, proband, target_word,
