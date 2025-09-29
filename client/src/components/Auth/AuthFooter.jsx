// components/AuthFooter.js
import React from 'react';
import { Link } from 'react-router-dom';

const AuthFooter = ({ message, linkText, linkTo }) => {
  return (
    <div className="mt-4 text-center text-sm text-gray-600">
      {message}{' '}
      <Link to={linkTo} className="text-blue-500 hover:underline">
        {linkText}
      </Link>
    </div>
  );
};

export default AuthFooter;
