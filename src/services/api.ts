import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'

interface AxiosErrorResponse {
  code?: string;
}

let cookies = parseCookies(undefined);
let isRefreshing = false;
let failedrequestsQueue = [];

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
      cookies = parseCookies(undefined);

      const {'signinauth.refreshToken': refreshToken} = cookies;
      //error.config -> carrega todas as informações da requisição original 
      //que falhou, sendo assim possível repeti-las.
      const originalConfig = error.config

      if(!isRefreshing){
        api.post('/refresh', {
          refreshToken,
        }).then(response => {
          console.log(response)
          const { token, refreshToken } = response.data;
  
          setCookie(undefined, 'signinauth.token', token, {
            maxAge: 60 * 60 * 24 * 30, //30 dias
            path: '/',
          })
          setCookie(undefined, 'signinauth.refreshToken', refreshToken, {
            maxAge: 60 * 60 * 24 * 30, //30 dias
            path: '/',
          })
  
          api.defaults.headers['Authorization'] = `Bearer ${token}`;
          
          //Faz a chamada novamente para todas as requisições que falharam
          failedrequestsQueue.forEach(request => request.onSuccess(token))
          failedrequestsQueue = [];
        }).catch(err => {
          //Faz a chamada novamente para todas as requisições que falharam
          failedrequestsQueue.forEach(request => request.onFailure(err))
          failedrequestsQueue = [];
        }).finally(() => {
          isRefreshing = false;
        });
      }

      return new Promise((resolve, reject) => {
        failedrequestsQueue.push({
          onSuccess: (token: string) => {
            originalConfig.headers['Authorization'] = `Bearer ${token}`

            resolve(api(originalConfig))
          },
          onFailure: (err: AxiosError) => {
            reject(err)
          }
        })
      })

    } else {
      //deslogar o usuário
    }
  }
});