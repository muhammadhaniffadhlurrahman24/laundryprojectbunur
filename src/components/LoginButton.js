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
        <div className="flex items-center gap-2 text-[#328e6e]">
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
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#90C67C] p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-xl font-bold mb-4 text-white">Login Admin</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-white mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 border border-[#a3d98c] rounded bg-white text-black"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-white mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-[#a3d98c] rounded bg-white text-black"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white text-gray-800 rounded hover:bg-gray-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#328e6e] text-white rounded hover:bg-[#67ae6e] transition"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
