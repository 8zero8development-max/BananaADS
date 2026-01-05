import React, { useState, useEffect } from 'react';
import { AdminService, AdminWidget, SystemHealth, UserAnalytics } from '../services/adminService';
import UsageAnalytics from '../components/admin/UsageAnalytics';
import FeatureUsage from '../components/admin/FeatureUsage';

type TimeRange = 'day' | 'week' | 'month' | 'year';

interface WidgetContainerProps {
  widget: AdminWidget;
  children: React.ReactNode;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({ widget, children }) => {
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-3',
  };

  return (
    <div className={`${sizeClasses[widget.size]} bg-white/5 rounded-xl border border-white/5 overflow-hidden`}>
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{widget.title}</h2>
        <span className="text-xs uppercase tracking-wider text-white/40 bg-white/5 px-2 py-1 rounded">
          {widget.category}
        </span>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

const SystemHealthWidget: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      try {
        const data = await AdminService.getSystemHealth();
        setHealth(data);
      } catch (error) {
        console.error('Failed to fetch system health:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-24"></div>
        <div className="h-4 bg-white/10 rounded w-32"></div>
        <div className="h-4 bg-white/10 rounded w-28"></div>
      </div>
    );
  }

  if (!health) {
    return <p className="text-white/50">Unable to load system health</p>;
  }

  const statusColors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    offline: 'bg-red-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm">API Status</span>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[health.apiStatus]}`}></span>
          <span className="text-white text-sm capitalize">{health.apiStatus}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm">Storage Usage</span>
        <span className="text-white text-sm">{health.storageUsage}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm">Response Time</span>
        <span className="text-white text-sm">{health.apiResponseTime}ms</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm">Last Backup</span>
        <span className="text-white text-sm">{new Date(health.lastBackup).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

const UserActivityWidget: React.FC = () => {
  const [users, setUsers] = useState<UserAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await AdminService.getUserAnalytics();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch user analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10"></div>
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return <p className="text-white/50">No user activity data available</p>;
  }

  return (
    <div className="space-y-4">
      {users.map((user, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
            <i className="fa-solid fa-user text-white text-sm"></i>
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">User Session</p>
            <p className="text-white/50 text-xs">
              {user.projectsCreated} projects | {user.sessionsCount} sessions
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs capitalize">{user.preferredProductionType}</p>
            <p className="text-white/40 text-xs">
              {new Date(user.lastActive).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminApp: React.FC = () => {
  const [widgets] = useState<AdminWidget[]>(AdminService.getDefaultWidgets());
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const renderWidgetContent = (widget: AdminWidget) => {
    switch (widget.id) {
      case 'usage-analytics':
        return <UsageAnalytics timeRange={timeRange} />;
      case 'feature-usage':
        return <FeatureUsage />;
      case 'system-health':
        return <SystemHealthWidget />;
      case 'user-activity':
        return <UserActivityWidget />;
      default:
        return <p className="text-white/50">Widget not found</p>;
    }
  };

  const timeRangeOptions: TimeRange[] = ['day', 'week', 'month', 'year'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif gradient-text mb-2">Admin Dashboard</h1>
            <p className="text-white/50">Monitor your BananaADS platform analytics and system health</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
              {timeRangeOptions.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <WidgetContainer key={widget.id} widget={widget}>
              {renderWidgetContent(widget)}
            </WidgetContainer>
          ))}
        </div>

        <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
              <i className="fa-solid fa-puzzle-piece text-white"></i>
            </div>
            <div>
              <h3 className="text-white font-bold">Extensible Widget System</h3>
              <p className="text-white/50 text-sm">Add new widgets to customize your dashboard</p>
            </div>
          </div>
          <p className="text-white/40 text-sm">
            This dashboard uses an extensible widget architecture. New analytics features can be added 
            by creating new widget components and registering them with the AdminService. Each widget 
            supports three sizes (small, medium, large) and four categories (analytics, users, system, content).
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminApp;
