'use client';

import { speechToText } from '@/service/openai';
import convert from '@/utils/convert';
import loadFfmpeg from '@/utils/load';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useRef, useState, useEffect } from 'react';

export default function WebcamVideo() {
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const [mediaStream, setMediaStream] = useState<MediaStream>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioChunksRef = useRef<Blob[]>([]); // To store audio chunks
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const audio = useRef<Blob | null>(null);

  const load = async () => {
    console.log('loading');
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {});
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      ),
    });
  };

  useEffect(() => {
    async function setupWebcamVideo() {
      if (!mediaStream) {
        await setupMediaStream();
      } else {
        const videoCurr = videoRef.current;
        if (!videoCurr) return;
        if (!videoCurr.srcObject) {
          videoCurr.srcObject = mediaStream;
        }
      }
    }
    setupWebcamVideo();
  }, [mediaStream]);

  // Set up the webcam media stream with both video and audio
  async function setupMediaStream() {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });

      setMediaStream(ms);

      // Setup MediaRecorder to record audio only
      const audioStream = ms.clone();
      const audioTracks = audioStream.getAudioTracks();

      const recorder = new MediaRecorder(audioStream);
      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        console.log('stop');
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm; codecs=0',
        });
        audioChunksRef.current = []; // Clear the chunks after creation
        try {
          const ffmpeg = ffmpegRef.current;
          console.log('audio: ', audioBlob);
          await ffmpeg.writeFile('input.webm', await fetchFile(audioBlob));
          await ffmpeg.exec(['-i', 'input.webm', 'output.wav']);
          const data = (await ffmpeg.readFile('output.wav')) as any;
          const file = new Blob([data.buffer], { type: 'audio/wav' });
          audio.current = file;
        } catch (err) {
          console.log(err);
        }
        console.log('here');
      };

      setMediaRecorder(recorder);
    } catch (e) {
      alert('Camera or microphone is disabled');
      throw e;
    }
  }

  useEffect(() => {
    if (audio.current) {
      console.log('audio current: ', audio.current);
    }
  }, [audio]);

  const startRecording = () => {
    if (mediaRecorder && !isRecording) {
      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const convertSpeech2Text = async () => {
    const res = await speechToText(audio.current);
    console.log('res: ', res);
  };

  return (
    <div className="w-full h-full relative z-0 rounded-lg overflow-hidden">
      <video
        className="h-full w-full mx-auto"
        ref={videoRef}
        autoPlay
        muted // Mute video playback
      />
    </div>
  );
}
