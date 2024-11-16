'use client';
import type { StartAvatarResponse } from '@heygen/streaming-avatar';

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from '@heygen/streaming-avatar';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Input,
  Select,
  SelectItem,
  Spinner,
  Chip,
  Tabs,
  Tab,
} from '@nextui-org/react';
import { useEffect, useRef, useState } from 'react';
import { useMemoizedFn } from 'ahooks';

import InteractiveAvatarTextInput from './InteractiveAvatarTextInput';

import { AVATARS, STT_LANGUAGE_LIST } from '@/app/lib/constants';
import { chatting, getBotInfo } from '@/service/coze';
import { getAccessToken } from '@/service/heygen';
import { speechToText } from '@/service/openai';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function InteractiveAvatar() {
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRepeat, setIsLoadingRepeat] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [debug, setDebug] = useState<string>();
  const [knowledgeId, setKnowledgeId] = useState<string>('');
  const [avatarId, setAvatarId] = useState<string>('');
  const [language, setLanguage] = useState<string>('en');

  const [isRecording, setIsRecording] = useState(false);

  const [transcript, setTranscript] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current?.start();

      setIsRecording(true);
    }
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.lang = 'en-US'; // Set your preferred language
      recognitionRef.current.continuous = true; // Set to true for continuous recognition
      recognitionRef.current.interimResults = true; // Set to true for interim results

      // Handle result event
      recognitionRef.current.onresult = (event: any) => {
        const interimTranscript = [];
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            setTranscript((prev) => prev + result[0].transcript);
          } else {
            interimTranscript.push(result[0].transcript);
          }
        }
      };
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  const stopRecording = async () => {
    setIsRecording(false);

    console.log('Transcript:', transcript);
    await handleSpeak(transcript);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setTranscript('');
  };

  const [data, setData] = useState<StartAvatarResponse>();
  const [text, setText] = useState<string>('');
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatar = useRef<StreamingAvatar | null>(null);
  const [chatMode, setChatMode] = useState('text_mode');

  async function startSession() {
    setIsLoadingSession(true);
    const { data } = await getAccessToken();
    const newToken = data.token;

    avatar.current = new StreamingAvatar({
      token: newToken,
    });

    avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
      console.log('Avatar started talking', e);
    });

    avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
      console.log('Avatar stopped talking', e);
    });

    avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log('Stream disconnected');
      endSession();
    });

    avatar.current.on(StreamingEvents.STREAM_READY, async (event) => {
      console.log('>>>>> Stream ready:', event.detail);
      setStream(event.detail);
    });

    try {
      const res = await avatar.current?.createStartAvatar({
        quality: AvatarQuality.Low,
        avatarName: avatarId,
        knowledgeId: knowledgeId, // Or use a custom `knowledgeBase`.
        voice: {
          rate: 1.5, // 0.5 ~ 1.5
          emotion: VoiceEmotion.EXCITED,
        },
        language: language,
      });

      setData(res);
    } catch (error) {
      console.error('Error starting avatar session:', error);
    } finally {
      setIsLoadingSession(false);
    }
  }
  async function handleSpeak(answ: string) {
    setIsLoadingRepeat(true);
    if (!avatar.current) {
      setDebug('Avatar API not initialized');

      return;
    }
    try {
      await chatting(answ, '1234', async (answer) => {
        if (avatar.current) {
          await avatar.current
            .speak({
              text: answer,
              taskType: TaskType.REPEAT,
              taskMode: TaskMode.SYNC,
            })
            .catch((e) => {
              setDebug(e.message);
            });
        }
      });
      setIsLoadingRepeat(false);
    } catch (error: Error | any) {
      console.error('Error fetching response:', error);
      setDebug(error.message);
    }
  }

  async function handleInterrupt() {
    if (!avatar.current) {
      setDebug('Avatar API not initialized');

      return;
    }
    await avatar.current.interrupt().catch((e) => {
      setDebug(e.message);
    });
  }
  async function endSession() {
    await avatar.current?.stopAvatar();
    setStream(undefined);
  }

  const handleChangeChatMode = useMemoizedFn(async (v) => {
    if (v === chatMode) {
      return;
    }
    setChatMode(v);
  });

  useEffect(() => {
    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    const welcoming = async () => {
      const bot = await getBotInfo();
      const { data } = bot;

      avatar.current?.speak({
        text: data.onboarding_info.prologue,
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      });
    };

    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
        setDebug('Playing');
      };
      welcoming();
    }
  }, [mediaStream, stream]);

  return (
    <div className="w-full flex flex-col gap-4">
      <Card>
        <CardBody className="h-[500px] flex flex-col justify-center items-center">
          {stream ? (
            <div className="h-[500px] w-[900px] justify-center items-center flex rounded-lg overflow-hidden">
              <video
                ref={mediaStream}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              >
                <track kind="captions" />
              </video>
              <div className="flex flex-col gap-2 absolute bottom-3 right-3">
                <Button
                  className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white rounded-lg"
                  size="md"
                  variant="shadow"
                  onClick={handleInterrupt}
                >
                  Interrupt task
                </Button>
                <Button
                  className="bg-gradient-to-tr from-indigo-500 to-indigo-300  text-white rounded-lg"
                  size="md"
                  variant="shadow"
                  onClick={endSession}
                >
                  End session
                </Button>
              </div>
            </div>
          ) : !isLoadingSession ? (
            <div className="h-full justify-center items-center flex flex-col gap-8 w-[500px] self-center">
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm font-medium leading-none">
                  Custom Knowledge ID (optional)
                </p>
                <Input
                  placeholder="Enter a custom knowledge ID"
                  value={knowledgeId}
                  onChange={(e) => setKnowledgeId(e.target.value)}
                />
                <p className="text-sm font-medium leading-none">
                  Custom Avatar ID (optional)
                </p>
                <Input
                  placeholder="Enter a custom avatar ID"
                  value={avatarId}
                  onChange={(e) => setAvatarId(e.target.value)}
                />
                <Select
                  placeholder="Or select one from these example avatars"
                  size="md"
                  onChange={(e) => {
                    setAvatarId(e.target.value);
                  }}
                >
                  {AVATARS.map((avatar) => (
                    <SelectItem
                      key={avatar.avatar_id}
                      textValue={avatar.avatar_id}
                    >
                      {avatar.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Select language"
                  placeholder="Select language"
                  className="max-w-xs"
                  selectedKeys={[language]}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                  }}
                >
                  {STT_LANGUAGE_LIST.map((lang) => (
                    <SelectItem key={lang.key}>{lang.label}</SelectItem>
                  ))}
                </Select>
              </div>
              <Button
                className="bg-gradient-to-tr from-indigo-500 to-indigo-300 w-full text-white"
                size="md"
                variant="shadow"
                onClick={startSession}
              >
                Start session
              </Button>
            </div>
          ) : (
            <Spinner color="default" size="lg" />
          )}
        </CardBody>
        <Divider />
        <CardFooter className="flex flex-col gap-3 relative">
          <Tabs
            aria-label="Options"
            selectedKey={chatMode}
            onSelectionChange={(v) => {
              handleChangeChatMode(v);
            }}
          >
            <Tab key="text_mode" title="Text mode" />
            <Tab key="voice_mode" title="Voice mode" />
          </Tabs>
          {chatMode === 'text_mode' ? (
            <div className="w-full flex relative">
              <InteractiveAvatarTextInput
                disabled={!stream}
                input={text}
                label="Chat"
                loading={isLoadingRepeat}
                placeholder="Type something for the avatar to respond"
                setInput={setText}
                onSubmit={() => handleSpeak(text)}
              />
              {text && (
                <Chip className="absolute right-16 top-3">Listening</Chip>
              )}
            </div>
          ) : (
            <div className="w-full text-center">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className="bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white"
                size="md"
                variant="shadow"
              >
                {isRecording ? 'Listening...' : 'Start listening'}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      <p className="font-mono text-right">
        <span className="font-bold">Console:</span>
        <br />
        {debug}
      </p>
    </div>
  );
}
