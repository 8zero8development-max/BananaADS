import React, { useState, useEffect } from 'react';
import { AdminService, UsageMetrics } from '../../services/adminService';

interface UsageAnalyticsProps {
  timeRange: 'day' | 'week' | 'month' | 'year';
}

const UsageAnalytics: React.FC<UsageAnalyticsProps> = ({ timeRange }) => {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const data = await AdminService.collectUsageMetrics(timeRange);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch usage metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/5 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-24 mb-4"></div>
            <div className="h-8 bg-white/10 rounded w-16 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white/5 rounded-xl p-6 border border-white/5 text-center">
        <p className="text-white/50">Unable to load metrics</p>
      </div>
    );
  }

  const metricCards = [
    { 
      label: 'Projects Created', 
      value: metrics.projectsCreated, 
      change: metrics.projectsChange,
      icon: 'fa-folder-plus',
      gradient: 'from-yellow-500 to-orange-500'
    },
    { 
      label: 'Videos Generated', 
      value: metrics.videosGenerated, 
      change: metrics.videosChange,
      icon: 'fa-video',
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      label: 'Active Users', 
      value: metrics.activeUsers, 
      change: metrics.usersChange,
      icon: 'fa-users',
      gradient: 'from-blue-500 to-cyan-500'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metricCards.map((metric, i) => (
        <div 
          key={i} 
          className="bg-white/5 rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.07] group"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/70 text-sm font-bold uppercase tracking-wider">{metric.label}</h3>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${metric.gradient} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
              <i className={`fa-solid ${metric.icon} text-white text-sm`}></i>
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{metric.value.toLocaleString()}</p>
          <p className="text-green-400 text-sm font-medium flex items-center gap-1">
            <i className="fa-solid fa-arrow-trend-up text-xs"></i>
            {metric.change}
            <span className="text-white/40 ml-1">vs last {timeRange}</span>
          </p>
        </div>
      ))}
    </div>
  );
};

export default UsageAnalytics;
