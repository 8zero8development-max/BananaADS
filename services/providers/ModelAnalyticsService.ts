import {
  ModelUsageRecord,
  ModelAnalytics,
  ProviderType,
  TaskType,
  getModelInfo
} from '../../types/providers';

const ANALYTICS_STORAGE_KEY = 'banana_ads_model_analytics';
const MAX_RECENT_RECORDS = 100;

class ModelAnalyticsService {
  private usageRecords: ModelUsageRecord[] = [];

  constructor() {
    this.loadRecords();
  }

  private loadRecords(): void {
    try {
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (stored) {
        this.usageRecords = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load analytics records:', e);
      this.usageRecords = [];
    }
  }

  private saveRecords(): void {
    try {
      if (this.usageRecords.length > MAX_RECENT_RECORDS) {
        this.usageRecords = this.usageRecords.slice(-MAX_RECENT_RECORDS);
      }
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.usageRecords));
    } catch (e) {
      console.error('Failed to save analytics records:', e);
    }
  }

  recordUsage(record: Omit<ModelUsageRecord, 'id' | 'timestamp'>): ModelUsageRecord {
    const fullRecord: ModelUsageRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.usageRecords.push(fullRecord);
    this.saveRecords();

    return fullRecord;
  }

  startOperation(
    modelId: string,
    taskType: TaskType,
    operation: string
  ): { complete: (success: boolean, error?: string, tokens?: { input?: number; output?: number }) => ModelUsageRecord } {
    const startTime = Date.now();
    const modelInfo = getModelInfo(modelId);
    const provider = modelId.split('/')[0] as ProviderType;

    return {
      complete: (success: boolean, error?: string, tokens?: { input?: number; output?: number }) => {
        const durationMs = Date.now() - startTime;
        const totalTokens = (tokens?.input || 0) + (tokens?.output || 0);
        const costPer1k = modelInfo?.costPer1kTokens || 0;
        const estimatedCost = (totalTokens / 1000) * costPer1k;

        return this.recordUsage({
          modelId,
          modelName: modelInfo?.name || modelId,
          provider,
          taskType,
          operation,
          inputTokens: tokens?.input,
          outputTokens: tokens?.output,
          durationMs,
          success,
          error,
          estimatedCost: estimatedCost > 0 ? estimatedCost : undefined
        });
      }
    };
  }

  getAnalytics(): ModelAnalytics {
    const analytics: ModelAnalytics = {
      totalRequests: this.usageRecords.length,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalEstimatedCost: 0,
      averageResponseTime: 0,
      usageByModel: {},
      usageByTask: {} as Record<TaskType, number>,
      usageByProvider: {} as Record<ProviderType, number>,
      recentUsage: this.usageRecords.slice(-20).reverse()
    };

    let totalDuration = 0;

    for (const record of this.usageRecords) {
      if (record.success) {
        analytics.successfulRequests++;
      } else {
        analytics.failedRequests++;
      }

      analytics.totalTokensUsed += (record.inputTokens || 0) + (record.outputTokens || 0);
      analytics.totalEstimatedCost += record.estimatedCost || 0;
      totalDuration += record.durationMs;

      analytics.usageByModel[record.modelId] = (analytics.usageByModel[record.modelId] || 0) + 1;
      analytics.usageByTask[record.taskType] = (analytics.usageByTask[record.taskType] || 0) + 1;
      analytics.usageByProvider[record.provider] = (analytics.usageByProvider[record.provider] || 0) + 1;
    }

    if (this.usageRecords.length > 0) {
      analytics.averageResponseTime = totalDuration / this.usageRecords.length;
    }

    return analytics;
  }

  getRecentUsage(limit: number = 20): ModelUsageRecord[] {
    return this.usageRecords.slice(-limit).reverse();
  }

  getUsageByTimeRange(startTime: number, endTime: number): ModelUsageRecord[] {
    return this.usageRecords.filter(
      record => record.timestamp >= startTime && record.timestamp <= endTime
    );
  }

  clearAnalytics(): void {
    this.usageRecords = [];
    this.saveRecords();
  }

  getCurrentModelInUse(): { modelId: string; modelName: string; operation: string } | null {
    const recent = this.usageRecords[this.usageRecords.length - 1];
    if (recent && Date.now() - recent.timestamp < 60000) {
      return {
        modelId: recent.modelId,
        modelName: recent.modelName,
        operation: recent.operation
      };
    }
    return null;
  }
}

export const modelAnalyticsService = new ModelAnalyticsService();
export { ModelAnalyticsService };
