'use client';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginButton() {
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { isLoggedIn, login, logout, username: loggedInUser } = useAuth();

  const handleLogin = (e) => {
    e.preventDefault();
    const success = login(username, password);
    if (success) {
      setShowModal(false);
      setUsername('');
      setPassword('');
      setError('');
    } else {
      setError('Login gagal. Username atau password salah.');
    }
  };

  return (
    <div className="absolute top-4 right-4">
      {isLoggedIn ? (
        <div className="flex items-center gap-2 text-[#2e7d61]">
          <span>Hai, {loggedInUser}</span>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#328e6e] text-white px-4 py-2 rounded hover:bg-[#67ae6e] transition"
        >
          Login
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 h-screen w-screen bg-green-200 bg-opacity-50 flex items-center justify-center z-50">
          {/* Background dengan efek blur */}
          <div className="absolute inset-0 backdrop-blur-sm"></div>
          
          {/* Container untuk form dengan background */}
          <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl w-96">
            {/* Background decorative element */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#328e6e] to-[#67ae6e] opacity-20"></div>
            
            {/* Actual form content */}
            <div className="relative p-8 bg-white bg-opacity-90">
              <h2 className="text-2xl font-bold mb-6 text-[#328e6e] text-center">Login Admin</h2>
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-center mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#328e6e] focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 text-center  mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#328e6e] focus:border-transparent"
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#328e6e] text-white rounded-lg hover:bg-[#67ae6e] transition focus:ring-2 focus:ring-offset-2 focus:ring-[#328e6e]"
                  >
                    Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}