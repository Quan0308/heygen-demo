import { API_ENDPOINT } from '../app/lib/constants';

import { doGet } from '@/utils/axios';

const headers = {
  'Content-Type': 'application/json',
};

export const getBotInfo = async () => {
  const response = await doGet(
    `${API_ENDPOINT}/agent/mock-interview/welcoming`,
    headers
  );

  return response.data;
};

export const chatting = async (
  message: string,
  userId: string,
  streamingSpeech: (data: any) => void
) => {
  const eventSource = new EventSource(
    `${API_ENDPOINT}/agent/mock-interview/chatting?userId=${userId}&message=${message}`
  );

  let answer = '';

  eventSource.addEventListener('conversation.chat.created', function (event) {
    const data = JSON.parse(event.data);

    console.log('Received chat message:', data);
  });

  eventSource.addEventListener(
    'conversation.chat.in_progress',
    function (event) {
      const data = JSON.parse(event.data);

      console.log('Chat in progress:', data);
    }
  );

  eventSource.addEventListener('conversation.message.delta', function (event) {
    const data = JSON.parse(event.data);

    const { content } = data;

    answer += content;
  });

  eventSource.addEventListener(
    'conversation.message.completed',
    function (event) {
      const data = JSON.parse(event.data);

      console.log('Message completed:', data);
    }
  );

  eventSource.addEventListener('done', function () {
    console.log('Chat stream ended');
    eventSource.close();
    streamingSpeech(answer);
  });

  eventSource.onerror = function (error) {
    console.error('Error in chat stream:', error);
    eventSource.close();
  };
};
