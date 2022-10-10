import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { SignOut } from '../contexts/AuthContext';
import { AuthTokenError } from './errors/AuthToeknError';

interface AxiosErrorResponse {
  code?: string;
}

let isRefreshing = false;
let failedrequestsQueue = [];

export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx);
  
  const api = axios.create({
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
        cookies = parseCookies(ctx);
  
        const {'signinauth.refreshToken': refreshToken} = cookies;
        //error.config -> carrega todas as informações da requisição original 
        //que falhou, sendo assim possível repeti-las.
        const originalConfig = error.config
  
        if(!isRefreshing){
          api.post('/refresh', {
            refreshToken,
          }).then(response => {
            const { token, refreshToken } = response.data;
    
            setCookie(ctx, 'signinauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, //30 dias
              path: '/',
            })
            setCookie(ctx, 'signinauth.refreshToken', refreshToken, {
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
  
            //Verificar se está no navegador
            if(process.browser) {
              SignOut()
            }
  
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
        if(process.browser) {
          SignOut()
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
  
    return Promise.reject(error)
  });
  return api;
}
