import { createContext, ReactNode, useEffect, useState } from "react";
import { setCookie, parseCookies, destroyCookie } from 'nookies'
import Router from 'next/router';
import { api } from "../services/apiClient";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

//Tipo de credentials, utilizanda no método "signIn"
type SignInCredentials = {
  email: string;
  password: string;
}

//O que eu quero salvar de informações do usuário
type AuthContextData = {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  user: User;
  isAuthenticated: boolean;
};

//Tipagem do children
type AuthProviderProps = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

//1. Criando o canal de comunicação.
let authChannel: BroadcastChannel

export function signOut() {
  destroyCookie(undefined, 'signinauth.token')
  destroyCookie(undefined, 'signinauth.refreshToken')

  //2. Envia a mensagem quando o usuário desloga
  authChannel.postMessage('signOut');

  Router.push('/')
}

export function AuthProdiver({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user;

  //3. Ouvi a mensagem
  useEffect(() => {
    authChannel = new BroadcastChannel('auth');
    authChannel.onmessage = (message) => {
      switch(message.data) {
        case 'signOut':
          signOut();
          break;
        // case 'signIn':
        //   Router.push('/dashboard')
        //   break;
        default:
          break;
      }
    }
  }, [])

  useEffect(() => {
    const {'signinauth.token': token} = parseCookies()

    //Busca as informações do usuário pelo token, quando ele já está autenticado.
    if(token) {
      api.get('/me').then(response => {
        const { email, permissions, roles} = response.data

        setUser({email, permissions, roles})
      })
      .catch(() => {
        signOut();
      })
    }

  }, [])

  async function signIn({ email, password}: SignInCredentials) {
    
    try {
      const response = await api.post('sessions', {
        email,
        password,
      })
      
      const { token, refreshToken, permissions, roles } = response.data;

      setCookie(undefined, 'signinauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, //30 dias
        path: '/',
      })
      setCookie(undefined, 'signinauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, //30 dias
        path: '/',
      })

      setUser({
        email,
        permissions,
        roles,
      })

      api.defaults.headers['Authorization'] = `Bearer ${token}`;

      Router.push('/dashboard');

      //authChannel.postMessage('signIn')
    } catch (err) {
      console.log(err)
    }

  }

  return (
    //Em "value" ficam os dados retornados
    <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}