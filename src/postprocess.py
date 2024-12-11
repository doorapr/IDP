# requires installing SpeechRecognition, Vosk

import speech_recognition as sr
import base64
import os
import subprocess
from glob import glob
from vosk import Model
import csv
import json


## Data file manuel runterladen?
base_dir = '/Users/dorapruteanu/Downloads/study_result_27/comp-result_29/files'
ffmpeg = 'C:\\Users\\tivor\\Desktop\\ffmpeg\\bin\\ffmpeg.exe'
files = glob('*.txt', root_dir=base_dir)
recognizer = sr.Recognizer()
recognizer.vosk_model = Model(model_path='C:\\Users\\tivor\\Desktop\\IDP\\src\\model')

fileName="data_test.txt"
data_path='/Users/dorapruteanu/Downloads'
binPath = os.path.join(data_path, fileName)
study_data = open(binPath, "r").read()
#study_data ="{"+study_data[1:-2]+"}"
#print(study_data)


transcription_map = {}
for fileName in files:
    file = open(os.path.join(base_dir, fileName), 'r')
    binPath = os.path.join(base_dir, fileName.replace('.txt', '.bin'))
    wavPath = os.path.join(base_dir, fileName.replace('.txt', '.wav'))
    binFile = open(binPath, 'wb')
    binFile.write(base64.b64decode(file.read()))
    binFile.close()
    subprocess.run([ffmpeg, '-i', binPath, wavPath, '-y'])
    file.close()
    with sr.AudioFile(wavPath) as source:
        audio_data = recognizer.record(source)
        result = recognizer.recognize_vosk(audio_data, 'de')
        transcription_map[wavPath]["transcription"]=result
        print("Recognized word " + result + " for file " + wavPath)

json_object = json.loads(study_data)
subject_id= json_object[0]["subject_id"]
for x in range(0,len(json_object)):
    if "fileName" in json_object[x]:
        key=json_object[x]["fileName"].replace('.txt', '.wav')
        if json_object[x]["type"] == "clarity":
            clarity = json_object[x]["response"]
            transcription_map[key]["clarity"]=clarity
        if json_object[x]["type"] == "confidence":
            confidence = json_object[x]["response"]
            transcription_map[key]["confidence"]=confidence
    #print(json_object[x])

print(transcription_map)
with open('{subject_id}.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    field = ["audio", "transcription", "confidence","clarity"]
    writer.writerow(field)

#  csv file pro person
# index, proband, target_word,  