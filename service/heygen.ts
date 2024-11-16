import { HEYGEN_API_ENPOINT_V1, HEYGEN_API_KEY } from '@/app/lib/constants';
import { doPost } from '@/utils/axios';

const headers = {
  'x-api-key': HEYGEN_API_KEY,
  'Content-Type': 'application/json',
};

export const getAccessToken = async () => {
  const response = await doPost(
    `${HEYGEN_API_ENPOINT_V1}/streaming.create_token`,
    headers
  );

  return response.data;
};
