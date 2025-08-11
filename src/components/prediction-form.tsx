import React, { useState } from 'react'
import { EXPIRY_TIME } from '../lib/utils';
import toast from 'react-hot-toast';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../global-context';
import apiClient from '../lib/api';
// import { EXPIRY_TIME } from '../../lib/utils';

const PredictionForm = () => {
    const [newPrediction, setNewPrediction] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { isAuthenticated, getPredictions, predictionCategories } = useAuth();
  const navigate = useNavigate();
  const [expiryTime, setExpiryTime] = useState(EXPIRY_TIME / (60 * 60 * 1000)); // Default in hours (e.g., 24)

  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create a prediction!', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
      navigate('/login');
      return;
    }
    if (!newPrediction.trim() || !selectedCategory) {
      toast.error('Please enter a prediction and select a category!', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
      return;
    }
    if (expiryTime < 0.0167 || expiryTime > 168) { // 0.0167 hours (1 minute) to 168 hours (7 days)
      toast.error('Expiry time must be between 0.0167 hours (1 minute) and 168 hours (7 days)!', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
      return;
    }
    const newItem = {
      prediction: {
        topic: newPrediction,
        category: selectedCategory,
        expires_at: new Date(Date.now() + expiryTime * 60 * 60 * 1000).toISOString(),
      },
    };
    try {
      const response = await apiClient.post('/predictions', newItem);
      if (response.data.status === 201) {
        await getPredictions();
        setNewPrediction('');
        setSelectedCategory('');
        setExpiryTime(EXPIRY_TIME / (60 * 60 * 1000)); // Reset to default (e.g., 24 hours)
        toast.success('Prediction submitted!', {
          style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
        });
      } else {
        throw new Error(response.data.message || 'Failed to create prediction');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit prediction. Please try again.', {
        style: { background: '#1f2937', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' },
      });
    }
  }, [newPrediction, selectedCategory, expiryTime, isAuthenticated, navigate, getPredictions]);

  return (
    <div className="mb-8 animate-slide-up">
        <textarea
          value={newPrediction}
          onChange={(e) => setNewPrediction(e.target.value)}
          placeholder="Make a bold prediction..."
          className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          rows={4}
        />
        <input
          type="number"
          onChange={(e) => setExpiryTime(Number(e.target.value))}
          placeholder="Expiry time in hours (0.0167-168)"
          min="0.0167"
          max="168"
          step="0.0001"
          className="w-full p-3 mt-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-3 mt-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="" disabled>
            Select a category
          </option>
          {predictionCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          disabled={!newPrediction.trim() || !selectedCategory || !isAuthenticated}
          className="mt-3 w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-red-700 disabled:bg-gray-600 transition-all transform hover:scale-105"
        >
          Predict
        </button>
      </div>
  )
}

export default PredictionForm