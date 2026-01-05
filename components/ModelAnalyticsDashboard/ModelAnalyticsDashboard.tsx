import React, { useState, useEffect } from 'react';
import { modelAnalyticsService } from '../../services/providers';
import { ModelAnalytics, ModelUsageRecord, TaskType, ProviderType } from '../../types/providers';

interface ModelAnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const TASK_LABELS: Record<TaskType, string> = {
  textGeneration: 'Text Generation',
  imageGeneration: 'Image Generation',
  speechGeneration: 'Speech/Voiceover',
  videoGeneration: 'Video Generation',
  emailGeneration: 'Email Generation',
  brandResearch: 'Brand Research',
  conceptGeneration: 'Concept Generation',
  scriptGeneration: 'Script Generation'
};

const PROVIDER_COLORS: Record<ProviderType, string> = {
  gemini: 'bg-blue-500',
  openai: 'bg-green-500',
  anthropic: 'bg-orange-500',
  openrouter: 'bg-purple-500'
};

const ModelAnalyticsDashboard: React.FC<ModelAnalyticsDashboardProps> = ({ isOpen, onClose }) => {
  const [analytics, setAnalytics] = useState<ModelAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'models'>('overview');

  useEffect(() => {
    if (isOpen) {
      setAnalytics(modelAnalyticsService.getAnalytics());
    }
  }, [isOpen]);

  const refreshAnalytics = () => {
    setAnalytics(modelAnalyticsService.getAnalytics());
  };

  const clearAnalytics = () => {
    if (confirm('Are you sure you want to clear all analytics data?')) {
      modelAnalyticsService.clearAnalytics();
      refreshAnalytics();
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatCost = (cost: number): string => {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-4xl w-full glass rounded-2xl border border-yellow-500/30 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif">Model Analytics</h2>
            <p className="text-white/50 text-sm">Track AI model usage and performance</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <span className="text-white/60">×</span>
          </button>
        </div>

        <div className="flex border-b border-white/10">
          {(['overview', 'history', 'models'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition ${
                activeTab === tab
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Total Requests</p>
                  <p className="text-2xl font-bold text-white">{analytics.totalRequests}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Success Rate</p>
                  <p className="text-2xl font-bold text-green-400">
                    {analytics.totalRequests > 0
                      ? `${((analytics.successfulRequests / analytics.totalRequests) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Avg Response</p>
                  <p className="text-2xl font-bold text-white">{formatDuration(analytics.averageResponseTime)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Est. Cost</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatCost(analytics.totalEstimatedCost)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/70 mb-4">Usage by Provider</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.usageByProvider).map(([provider, count]) => (
                      <div key={provider} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${PROVIDER_COLORS[provider as ProviderType]}`} />
                        <span className="text-sm text-white/70 flex-1 capitalize">{provider}</span>
                        <span className="text-sm font-medium text-white">{count}</span>
                      </div>
                    ))}
                    {Object.keys(analytics.usageByProvider).length === 0 && (
                      <p className="text-white/40 text-sm">No usage data yet</p>
                    )}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-sm font-medium text-white/70 mb-4">Usage by Task</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.usageByTask).map(([task, count]) => (
                      <div key={task} className="flex items-center gap-3">
                        <span className="text-sm text-white/70 flex-1">{TASK_LABELS[task as TaskType]}</span>
                        <span className="text-sm font-medium text-white">{count}</span>
                      </div>
                    ))}
                    {Object.keys(analytics.usageByTask).length === 0 && (
                      <p className="text-white/40 text-sm">No usage data yet</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={refreshAnalytics}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/70 transition"
                >
                  Refresh
                </button>
                <button
                  onClick={clearAnalytics}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm text-red-400 transition"
                >
                  Clear Data
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && analytics && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/70">Recent Operations</h3>
              {analytics.recentUsage.length === 0 ? (
                <p className="text-white/40 text-sm">No operations recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {analytics.recentUsage.map((record: ModelUsageRecord) => (
                    <div
                      key={record.id}
                      className={`bg-white/5 rounded-lg p-4 border ${
                        record.success ? 'border-white/10' : 'border-red-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${record.success ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm font-medium text-white truncate">{record.modelName}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${PROVIDER_COLORS[record.provider]} text-white`}>
                              {record.provider}
                            </span>
                          </div>
                          <p className="text-xs text-white/50">{record.operation}</p>
                          {record.error && (
                            <p className="text-xs text-red-400 mt-1">{record.error}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-white/40">{formatTime(record.timestamp)}</p>
                          <p className="text-xs text-white/60">{formatDuration(record.durationMs)}</p>
                          {record.estimatedCost !== undefined && (
                            <p className="text-xs text-yellow-400">{formatCost(record.estimatedCost)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'models' && analytics && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/70">Model Usage Breakdown</h3>
              {Object.keys(analytics.usageByModel).length === 0 ? (
                <p className="text-white/40 text-sm">No model usage data yet</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(analytics.usageByModel)
                    .sort(([, a], [, b]) => b - a)
                    .map(([modelId, count]) => {
                      const provider = modelId.split('/')[0] as ProviderType;
                      const percentage = analytics.totalRequests > 0
                        ? (count / analytics.totalRequests) * 100
                        : 0;
                      return (
                        <div key={modelId} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${PROVIDER_COLORS[provider]}`} />
                              <span className="text-sm font-medium text-white">{modelId}</span>
                            </div>
                            <span className="text-sm text-white/70">{count} requests</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${PROVIDER_COLORS[provider]} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {!analytics && (
            <div className="flex items-center justify-center h-40">
              <p className="text-white/40">Loading analytics...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelAnalyticsDashboard;
