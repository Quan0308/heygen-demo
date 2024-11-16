import axios, { ResponseType } from 'axios';

axios.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error' && !error.response) {
      return Promise.reject(error);
    }
    if (!error.response) return Promise.reject(error);

    return Promise.reject(error);
  }
);

const doAxios = (
  method: string,
  apiEndpoint: string,
  data: object | FormData | null = null, // Allow FormData type
  headers: object = {},
  params = null,
  responseType: ResponseType = 'json'
) => {
  // Only stringify if data is not FormData
  const body = data instanceof FormData ? data : JSON.stringify(data);

  // When using FormData, remove 'Content-Type' to let Axios set it automatically
  const requestHeaders =
    data instanceof FormData
      ? headers
      : { ...headers, 'Content-Type': 'application/json' };

  return axios({
    method: method,
    url: apiEndpoint,
    params: params,
    data: body,
    timeout: 30000,
    headers: requestHeaders,
    responseType,
  });
};

export const doGet = (
  action: string,
  headers: object,
  params: any = null,
  responseType: ResponseType = 'json'
) => {
  return doAxios('get', action, null, headers, params, responseType);
};

export const doPost = (
  action: string,
  headers: object,
  data: object | FormData = {}, // Allow FormData type
  responseType: ResponseType = 'json'
) => {
  return doAxios('post', action, data, headers, null, responseType);
};
