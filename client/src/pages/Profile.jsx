import React, { useState, useContext } from 'react';
import { User, Edit2, LogOut, Save, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Profile = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const [newUsername, setNewUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading profile...</div>
      </div>
    );
  }

  // Change username
  const handleUsernameChange = async () => {
    if (!newUsername.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return alert('You are not logged in!');

    setIsLoading(true);
    try {
      // Promjena username
      const res = await fetch(`${BASE_URL}/api/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: newUsername })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update username');
      updateUser(data);
      setNewUsername('');
      setIsEditing(false);
      alert('Username successfully updated!');
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => setIsEditing(false);

  // Change password
  const handleChangePassword = async () => {
    const newPassword = prompt('Enter your new password:');
    if (!newPassword) return;

    const token = localStorage.getItem('token');
    if (!token) return alert('You are not logged in!');

    try {
      const res = await fetch(`${BASE_URL}/api/users/${user._id}/change-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password');
      alert('Password changed successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

    const token = localStorage.getItem('token');
    if (!token) return alert('You are not logged in!');

    try {
      const res = await fetch(`${BASE_URL}/api/users/${user._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete account');
      alert('Account deleted successfully!');
      logout();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Upload profile image
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const res = await fetch(`${BASE_URL}/api/users/${user._id}/profile-image`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }, // NE stavljaj Content-Type!
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload image');

      setProfileImage(data.profileImage);
      updateUser(data);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-purple-300 bg-opacity-50 rounded-3xl shadow-lg p-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <User className="w-8 h-8" /> User Profile
            </h1>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-3xl transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

          {/* Profile image */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
              {profileImage ? (
                <img
                  src={
                    profileImage.startsWith('http')
                      ? profileImage
                      : `${BASE_URL}/${profileImage.replace(/^\/+/, '')}`
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            <label className="cursor-pointer text-blue-500 hover:underline">
              {profileImage ? 'Change image' : 'Add profile image'}
              <input type="file" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          {/* Username Section */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">User Information</h2>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
                  {!isEditing ? (
                    <p className="text-lg font-medium text-gray-800">{user.username}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder={user.username}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={handleUsernameChange}
                          disabled={isLoading || !newUsername.trim()}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white p-2 rounded-md transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isLoading}
                          className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-3xl transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Saving changes...
                </div>
              )}
            </div>
          </div>

          {/* Additional Profile Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Additional Information</h3>
            <p className="text-gray-600"><span className="font-medium">Email:</span> {user.email}</p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
            <button
              onClick={handleChangePassword}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-3xl transition-colors"
            >
              Change Password
            </button>
            <button
              onClick={handleDeleteAccount}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-3xl transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
