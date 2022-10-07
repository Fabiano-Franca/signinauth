import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'

interface AxiosErrorResponse {
  code?: string;
}

let cookies = parseCookies();

export const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    Authorization: `Bearer ${cookies['signinauth.token']}`
  }
});

api.interceptors.response.use(response => {
  return response;
}, (error: AxiosError<AxiosErrorResponse>) => {
  if(error.response.status === 401) {
    if(error.response.data?.code === 'token.expired') {
      //renovar o token
      cookies = parseCookies();

      const {'signinauth.refreshToken': refreshToken} = cookies;

      api.post('/refresh', {
        refreshToken,
      }).then(response => {
        const { token } = response.data;

        setCookie(undefined, 'signinauth.token', token, {
          maxAge: 60 * 60 * 24 * 30, //30 dias
          path: '/',
        })
        setCookie(undefined, 'signinauth.refreshToken', response.data.refreshToken, {
          maxAge: 60 * 60 * 24 * 30, //30 dias
          path: '/',
        })

        api.defaults.headers['Authorization'] = `Bearer ${token}`;

      });

    } else {
      //deslogar o usuário
    }
  }
});