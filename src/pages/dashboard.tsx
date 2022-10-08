import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { api } from '../services/api';

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