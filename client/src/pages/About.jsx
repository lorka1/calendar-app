import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content - uzima sav dostupan prostor */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">About Our Calendar App</h1>
          <p className="text-lg text-gray-600 mb-4">
            This is a shared calendar application that allows you to manage your schedules 
            and collaborate with other users seamlessly.
          </p>
          <p className="text-lg text-gray-600 mb-4">
            Features include creating events, viewing others' events, and managing your 
            personal calendar in a user-friendly interface.
          </p>
          <p className="text-lg text-gray-600">
            Built with React, Node.js, and MongoDB for a modern web experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;