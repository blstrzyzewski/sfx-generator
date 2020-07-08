from flask import Flask, render_template,flash,make_response,redirect,send_file
import requests
from werkzeug.utils import secure_filename
from pysndfx import AudioEffectsChain
import soundfile as sf
import numpy as np
import io
from pydub import AudioSegment

app = Flask(__name__)
ALLOWED_EXTENSIONS = set(['mp3','wav','m4a','flac'])




@app.route('/')
def index():
    '''

    render homepage

    '''
    return render_template('index.html')


def allowed_file(filename):
    '''

    verify file is compatible type

    '''
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def add_effects(song,type,intensity):
    '''

    adds effects to pydub audio segment given type and intensity as
    integer values from request body

    '''
    file_buffer=io.BytesIO()
    song_array=as_to_array(song)


    #Create effects chans using pysndfx
    slowed_reverb = (
        AudioEffectsChain()

        .reverb(wet_gain=2*intensity)
        .speed(1-(0.06*intensity))

    )
    bass_boost=(

      AudioEffectsChain()
      .equalizer(80,0.6,2.5*intensity)
    )
    distortion=(
      AudioEffectsChain()
      .overdrive(gain=7*intensity)

    )
    speed_increase=(
      AudioEffectsChain()
      .speed(1+0.33*intensity)

    )

    effects=[slowed_reverb,bass_boost,distortion,speed_increase]

    #add effects to each channel individually
    left_channel=effects[type](song_array[:,0])
    right_channel=effects[type](song_array[:,1])



    song_with_effects=array_to_as(left_channel,right_channel,song.frame_rate,song.sample_width)


    song_with_effects.export(file_buffer,format="mp3",bitrate="320k")

    file_buffer.seek(0)
    flash('File successfully processed')
    return file_buffer


@app.route('/download',methods=['POST'])
def download():
    '''

    downloads mp3 from youtube based api into file buffer.
    adds effects to this downloaded song
    returns mp3 with effects and name of file

    '''


    url = "https://youtube-to-mp32.p.rapidapi.com/yt_to_mp3"

    querystring = {"video_id":str(request.form["id"])}

    headers = {
        'x-rapidapi-host': "youtube-to-mp32.p.rapidapi.com",

        }
    # get download url from api
    response = requests.request("GET", url, headers=headers, params=querystring)

    # download mp3 into file buffer
    file= requests.request('GET',response.json().get("Download_url"),allow_redirects=True)
    file_buffer=io.BytesIO(file.content)
    file_buffer.seek(0)

    #audio segment from downloaded mp3
    song = AudioSegment.from_mp3(file_buffer)



    processed_song=add_effects(song,int(request.form["type"]),int(request.form["intensity"]))
    new_response=make_response(send_file(processed_song,mimetype="audio/mp3"))
    new_response.headers["name"]=response.json().get("Title")
    return new_response


def as_to_array(audio_segment):
    '''

    converts pydub audiosegment to an array of samples of shape
    (length, channels)


    '''
    audio_segment.set_channels(2)
    samples = audio_segment.get_array_of_samples()
    samples = np.array(samples)
    samples = samples.reshape(audio_segment.channels, -1, order='F');
    samples=samples.transpose() # (<probably 2>, <len(song)
    return samples


def array_to_as(left_array,right_array,frame_rate,sample_width):
    '''

    converts arrays for left and right audio channels to a stereo pydub
    audiosegment.

    '''
    left = AudioSegment(
        left_array.tobytes(),

        frame_rate=frame_rate,
        sample_width=sample_width,
        channels=1
     )
    right=AudioSegment(
         right_array.tobytes(),

         frame_rate=frame_rate,
         sample_width=sample_width,
         channels=1
      )
    audio_segment=AudioSegment.from_mono_audiosegments(left, right)
    return audio_segment


@app.route('/process', methods=['POST'])
def process_file():
    '''

    process file from request after verifying proper file.
    returns file with effects

    '''


    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            flash('No file selected')
            return redirect(request.url)
        if file and allowed_file(file.filename):

            filename = secure_filename(file.filename)

            #audio segment from file and filetype
            song=AudioSegment.from_file(file,file.filename.rsplit('.', 1)[1].lower())

            #add effects to audio segment
            processed_song=add_effects(song,int(request.form["type"]),int(request.form["intensity"]))





            return send_file(processed_song,mimetype="audio/mp3")
        else:

            return redirect(request.url)











if __name__=="__main__":
    app.run()
