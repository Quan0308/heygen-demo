import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default async function convert(ffmpeg: FFmpeg, audioBlob: Blob) {
  ffmpeg.writeFile('input.webm', await fetchFile(audioBlob));
  ffmpeg.exec(['-i', 'webm', 'output.wav']);
  const data = await ffmpeg.readFile('output.wav');
  const blob = new Blob([data], { type: 'audio/wav' });
  return blob;
}
