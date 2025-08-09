import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '../lib/api';

interface Activity {
  id: number;
  username: string;
  action: string;
  target: string;
  created_at: number;
}

const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await apiClient.get('/activities');
      if (response.data.status === 200) {
        setActivities(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchActivities]);

  return (
    <div className="p-4 bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-700 animate-slide-in-right">
      <h3 className="text-lg font-bold text-white mb-2">Live Activity</h3>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-400">No recent activity.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="text-sm text-gray-300 animate-fade-in">
              <span className="font-medium">{activity.username}</span>{' '}
              {activity.action === 'voted' && `voted on "${activity.target}"`}
              {activity.action === 'created_prediction' && `created "${activity.target}"`}
              {activity.action === 'redeemed_reward' && `redeemed "${activity.target}"`}
              <p className="text-xs text-gray-400">
                {new Date(activity.created_at).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
