import React from 'react';
import { AppProps } from 'next/app';
import { AuthProdiver } from '../contexts/AuthContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProdiver>
      <Component {...pageProps} />
    </AuthProdiver>
  )
}

export default MyApp