import React, { useState, useEffect } from 'react';
import { AdminService, FeatureUsageData } from '../../services/adminService';

const FeatureUsage: React.FC = () => {
  const [featureData, setFeatureData] = useState<FeatureUsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatureUsage = async () => {
      setLoading(true);
      try {
        const data = await AdminService.getFeatureUsage();
        setFeatureData(data);
      } catch (error) {
        console.error('Failed to fetch feature usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureUsage();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-32"></div>
            <div className="flex-1 h-6 bg-white/5 rounded-full"></div>
            <div className="h-4 bg-white/10 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  if (featureData.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-center">
        <p className="text-white/50">No feature usage data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {featureData.map((feature, i) => (
        <div key={i} className="flex items-center gap-4 group">
          <span className="text-white/70 w-36 text-sm font-medium truncate">{feature.name}</span>
          <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full bg-gradient-to-r ${feature.color} rounded-full transition-all duration-700 ease-out group-hover:opacity-90`}
              style={{ width: `${feature.usage}%` }}
            />
          </div>
          <span className="text-white/50 w-12 text-right text-sm font-medium">{feature.usage}%</span>
        </div>
      ))}
    </div>
  );
};

export default FeatureUsage;
