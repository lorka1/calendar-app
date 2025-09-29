import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    // korisnik nije ulogiran, preusmjeri na login
    return <Navigate to="/Home" replace />;
  }

  // korisnik je ulogiran, prikazi sadržaj
  return children;
};

export default ProtectedRoute;
