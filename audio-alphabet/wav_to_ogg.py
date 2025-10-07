import os
import ffmpeg
from pydub import AudioSegment

def convert_wav_to_ogg(input_directory, output_directory):
    """
    Traverses the input_directory, converts all .wav files to .ogg,
    and saves them in the output_directory, maintaining the directory structure.
    """
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)

    for root, _, files in os.walk(input_directory):
        relative_path = os.path.relpath(root, input_directory)
        current_output_dir = os.path.join(output_directory, relative_path)

        if not os.path.exists(current_output_dir):
            os.makedirs(current_output_dir)

        for file in files:
            if file.lower().endswith(".wav"):
                wav_filepath = os.path.join(root, file)
                ogg_filename = os.path.splitext(file)[0] + ".ogg"
                ogg_filepath = os.path.join(current_output_dir, ogg_filename)

                try:
                    audio = AudioSegment.from_wav(wav_filepath)
                    audio.export(ogg_filepath, format="ogg")
                    print(f"Converted: {wav_filepath} to {ogg_filepath}")
                except Exception as e:
                    print(f"Error converting {wav_filepath}: {e}")

if __name__ == "__main__":
    input_folder = "/Users/scottowen/Desktop/al_leprob_openai/audio-alphabet"  # Replace with your input directory
    output_folder = "/Users/scottowen/Desktop/al_leprob_openai/audio-alphabet/ogg" # Replace with your desired output directory

    convert_wav_to_ogg(input_folder, output_folder)