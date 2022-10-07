import { createContext, ReactNode, useEffect, useState } from "react";
import { setCookie, parseCookies } from 'nookies'
import Router from 'next/router';

import { api } from "../services/api";

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
  signIn(credentials: SignInCredentials): Promise<void>;
  user: User;
  isAuthenticated: boolean;
};

//Tipagem do children
type AuthProviderProps = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProdiver({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user;

  useEffect(() => {
    const {'signinauth.token': token} = parseCookies()

    if(token) {
      api.get('/me').then(response => {
        const { email, permissions, roles} = response.data

        setUser({email, permissions, roles})
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

    } catch (err) {
      console.log(err)
    }

  }

  return (
    //Em "value" ficam os dados retornados
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}