import React, { useState } from 'react';
import axios from 'axios';
import { User, Phone, Lock, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../global-context';
import apiClient from '../../lib/api';

const SignIn = () => {
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username && !formData.phone) {
      setError('Please enter either a username or phone number.');
      return;
    }

    if (!formData.password) {
      setError('Please enter your password.');
      return;
    }

    try {
        const response = await apiClient.post('/login', {
            
              identifier: formData.username || formData.phone || null,
              password: formData.password,
            
          });

      const { user, token } = response.data.data;
      login(user, token);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#15202B]' : 'bg-[#F5F8FA]'}`}>
      <div className={`w-full max-w-md p-6 ${theme === 'dark' ? 'bg-[#1A242F] text-white' : 'bg-white text-[#14171A]'} rounded-2xl shadow-lg relative`}>
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#1DA1F2] text-white hover:bg-[#1A91DA] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>
        {error && <p className="text-[#F4212E] mb-4 text-center text-sm">{error}</p>}
        {success && <p className="text-[#17BF63] mb-4 text-center text-sm">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`flex items-center border ${theme === 'dark' ? 'border-[#38444D] bg-[#253341]' : 'border-[#E1E8ED] bg-[#F5F8FA]'} rounded-full p-3`}>
            <User size={18} className={`${theme === 'dark' ? 'text-[#8899A6]' : 'text-[#657786]'} mr-2`} />
            <input
              type="text"
              name="username"
                autoComplete='off'
              value={formData.username}
              onChange={handleChange}
              className={`w-full bg-transparent outline-none ${theme === 'dark' ? 'text-white placeholder-[#8899A6]' : 'text-[#14171A] placeholder-[#657786]'}`}
              placeholder="Username (optional)"
            />
          </div>
          <div className={`flex items-center border ${theme === 'dark' ? 'border-[#38444D] bg-[#253341]' : 'border-[#E1E8ED] bg-[#F5F8FA]'} rounded-full p-3`}>
            <Phone size={18} className={`${theme === 'dark' ? 'text-[#8899A6]' : 'text-[#657786]'} mr-2`} />
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              autoComplete='off'
              className={`w-full bg-transparent outline-none ${theme === 'dark' ? 'text-white placeholder-[#8899A6]' : 'text-[#14171A] placeholder-[#657786]'}`}
              placeholder="Phone number (optional)"
            />
          </div>
          <div className={`flex items-center border ${theme === 'dark' ? 'border-[#38444D] bg-[#253341]' : 'border-[#E1E8ED] bg-[#F5F8FA]'} rounded-full p-3`}>
            <Lock size={18} className={`${theme === 'dark' ? 'text-[#8899A6]' : 'text-[#657786]'} mr-2`} />
            <input
              type="password"
              name="password"
              value={formData.password}
                autoComplete='off'
              onChange={handleChange}
              className={`w-full bg-transparent outline-none ${theme === 'dark' ? 'text-white placeholder-[#8899A6]' : 'text-[#14171A] placeholder-[#657786]'}`}
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#1DA1F2] text-white p-3 rounded-full hover:bg-[#1A91DA] transition-colors font-semibold text-base"
          >
            Sign In
          </button>
        </form>
        <p className={`mt-4 text-center ${theme === 'dark' ? 'text-[#8899A6]' : 'text-[#657786]'}`}>
          Don't have an account?{' '}
          <a href="/signup" className="text-[#1DA1F2] hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
