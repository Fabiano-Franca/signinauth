import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { setupAPIClient } from '../services/api';
import { withSSRAuth } from '../utils/withSSRAuth';
import { api } from '../services/apiClient';
import { AuthTokenError } from '../services/errors/AuthToeknError';
import { destroyCookie } from 'nookies';


export default function Dashboard() {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api.get('/me')
      .then(response => console.log(response))
      .catch(err => console.log(err))
  }, [])

  return (
    <h1>Dashboard: {user?.email}</h1>
  );
}

export const getServerSideProps = withSSRAuth(async (ctx)  => {
  const apiClient = setupAPIClient(ctx);
  const response = await apiClient.get('/me')
  
  return {
    props: {}
  }
})