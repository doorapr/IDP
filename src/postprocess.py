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
from charset_normalizer import detect
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
        if filename.startswith("prior_"): 
            og_filename = filename[len("prior_"):]
            if og_filename not in transcription_map:
                transcription_map[og_filename] = {"transcription_prior": result}
            else:
                transcription_map[og_filename]["transcription_prior"] = result
        else:        
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
subject_id = json_object[1].get("subject_id", "unknown_subject")
randomisation = json_object[0].get("selected_randomisation", "unknown_randomisation")
print(randomisation)
for x in range(0, len(json_object)):
    if "fileName" in json_object[x]:
        if json_object[x].get("training") == "true":
            continue
        key = json_object[x]["fileName"].replace('.txt', '.wav')
        transcription_map[key]["subject_id"]= subject_id
        transcription_map[key]["randomisation"]= randomisation
        if json_object[x]["type"] == "clarity":
            clarity = json_object[x]["response"]
            transcription_map[key]["clarity"] = clarity
        if json_object[x]["type"] == "mic_input":
            response_audio = json_object[x]["response"]
            transcription_map[key]["response_audio"] = response_audio
            roundIndex = json_object[x]["roundIndex"]
            transcription_map[key]["roundIndex"]=roundIndex
        if json_object[x]["type"] == "confidence":
            confidence = json_object[x]["response"]
            transcription_map[key]["confidence"] = confidence
        if json_object[x]["type"] == "prior_input":
            prior_audio = json_object[x]["response"]
            print(prior_audio)
            transcription_map[key]["prior_audio"] = prior_audio
        if json_object[x]["type"] == "prior_expectation":
            prior_expectation = json_object[x]["response"]
            transcription_map[key]["prior_expectation"] = prior_expectation

    # print(json_object[x])

#path to the S1,S2,S3,S4 csv
path_original_csv="assets/text"



with open(os.path.join(os.path.dirname(data_file), f"results_{subject_id}.csv"), 'w', newline='') as file:
    writer = None
    
    for key, values in transcription_map.items():
        
        with open(os.path.join(path_original_csv,"S"+str(values.get("randomisation")))+".csv", 'rb') as f:
            raw_data = f.read()
            detected_encoding = detect(raw_data)['encoding']
        with open(os.path.join(path_original_csv,"S"+str(values.get("randomisation")))+".csv", 'r',encoding=detected_encoding) as original_file:
            reader = csv.reader(original_file, delimiter=';')
            source_header = next(reader) #the column names
            source_index_map = {col: idx for idx, col in enumerate(source_header)}
            matching_row = None
            #hier key umändern, so dass respond am anfang weg ist
            shortened_key=key[9:]
            for row in reader:
                if row[source_index_map.get("Single_Word", -1)] == shortened_key:
                    matching_row = row
                    break
                    
        if not writer:        
            field = ["subject_id","audio" ,"trial","transcription", "clarity","confidence", "response_audio","randomisation","expected_prior_audio","expected_prior_transcription","was_prior_as_expected"]+ source_header
            writer = csv.writer(file)
            writer.writerow(field)
        
        output_row=[
            subject_id,
            shortened_key, # redundant weil wir ja schon audio unter "Single Word" abspeichern
            values.get("roundIndex",""),
            values.get("transcription", ""),
            values.get("clarity", ""),
            values.get("confidence", ""),
            values.get("response_audio", ""),
            values.get("randomisation", ""),
            values.get("prior_audio",""),
            values.get("transcription_prior",""),
            values.get("prior_expectation","")
        ]
        output_row.extend(matching_row)
        writer.writerow(output_row)



#  csv file pro person
# index, proband, target_word,
