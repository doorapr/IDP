# requires installing SpeechRecognition, Vosk

import speech_recognition as sr
import base64
import os
import subprocess
from glob import glob
from vosk import Model

base_dir = 'C:\\Users\\tivor\\Desktop\\jatos_results_20241122080333\\study_result_65\\comp-result_65\\files'
ffmpeg = 'C:\\Users\\tivor\\Desktop\\ffmpeg\\bin\\ffmpeg.exe'
files = glob('*.txt', root_dir=base_dir)
recognizer = sr.Recognizer()
recognizer.vosk_model = Model(model_path='C:\\Users\\tivor\\Desktop\\IDP\\src\\model')

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
        print("Recognized word " + result + " for file " + wavPath)



#  csv file pro person
# index, proband, target_word,  