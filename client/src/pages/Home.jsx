import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import heroImage from '../images/background.jpg'; // slika iz src/assets

const Home = () => {
  const { user } = useContext(AuthContext);
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-br from-blue-100 to-purple-200 gap-6 md:gap-10 md:pl-4 lg:pl-8">
      
      {/* Lijeva strana: slika */}


      {/* Desna strana: tekst */}
      <div className="w-full md:w-1/2 text-center md:text-left max-w-xl md:pl-20">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-gray-800">
          Welcome to the Shared Calendar App
        </h1>
        <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 text-gray-600">
          Manage your schedules and collaborate with others seamlessly.
        </p>

        {user ? (
          <div className="space-y-4 md:space-y-6">
            <p className="text-lg sm:text-xl md:text-2xl mb-4 text-gray-700">
              Welcome back, {user.username}! 👋
            </p>
            <Link
              to="/calendar"
              className="inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 sm:px-8 md:px-10 py-2 sm:py-3 md:py-4 rounded-3xl font-medium transition-colors duration-200 shadow-sm hover:shadow-md text-sm sm:text-base md:text-lg"
            >
              Go to Calendar
            </Link>
          </div>
        ) : !showOptions ? (
          // Prvi korak - glavna call-to-action
          <div className="space-y-4">
            <button
              onClick={() => setShowOptions(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 sm:px-10 md:px-12 py-3 sm:py-4 md:py-5 rounded-3xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl text-base sm:text-lg md:text-xl hover:scale-105 transform"
            >
              Get Started
            </button>
          </div>
        ) : (
          // Drugi korak - opcije za postojeće i nove korisnike
          <div className="space-y-6">
            <div className="text-center md:text-left mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-2">
                Choose your path
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Are you new here or returning?
              </p>
            </div>

            {/* Opcija za nove korisnike */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border-2 border-transparent hover:border-purple-300 transition-all duration-200">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">New User?</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Create your account and start planning
                </p>
                <Link
                  to="/register"
                  className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors duration-200 shadow-sm hover:shadow-md text-sm sm:text-base w-full"
                >
                  Create Account
                </Link>
              </div>
            </div>

            {/* Opcija za postojeće korisnike */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border-2 border-transparent hover:border-blue-300 transition-all duration-200">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Already have an account?</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Welcome back! Sign in to continue
                </p>
                <Link
                  to="/login"
                  className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium transition-colors duration-200 shadow-sm hover:shadow-md text-sm sm:text-base w-full"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Povratak na početak */}
            <div className="text-center md:text-left pt-4">
              <button
                onClick={() => setShowOptions(false)}
                className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors duration-200"
              >
                ← Back to start
              </button>
            </div>
          </div>
        )}
      </div>

            <div className="w-full md:w-1/2 flex justify-center md:justify-end ml-20">
        <img
          src={heroImage}
          alt="Calendar illustration"
          className="w-full max-w-4xl"
        />
      </div>
    </div>
  );
};

export default Home;