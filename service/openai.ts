import { OPENAI_API_ENPOINT } from '@/app/lib/constants';
import { doPost } from '@/utils/axios';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
  'Content-Type': 'multipart/form-data',
};

export const speechToText = async (inputFile: Blob | null) => {
  try {
    const formData = new FormData();

    if (inputFile) {
      formData.append('file', inputFile, 'output.wav');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'text');

      const response = await doPost(
        `${OPENAI_API_ENPOINT}/audio/translations`,
        headers,
        formData
      );
      return response.data;
    } else {
      console.log('null audio');
      return '';
    }
  } catch (error) {
    console.error(error);
  }
};
