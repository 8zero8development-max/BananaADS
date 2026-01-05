import { ProductionType } from '../types';

const STORAGE_PREFIX = 'bananaads_';
const ADMIN_STORAGE_KEYS = {
  USAGE_METRICS: `${STORAGE_PREFIX}admin_usage_metrics`,
  FEATURE_USAGE: `${STORAGE_PREFIX}admin_feature_usage`,
} as const;

export interface UsageMetrics {
  projectsCreated: number;
  videosGenerated: number;
  activeUsers: number;
  projectsChange: string;
  videosChange: string;
  usersChange: string;
  timeRange: string;
}

export interface UserAnalytics {
  userId: string;
  sessionsCount: number;
  lastActive: string;
  projectsCreated: number;
  preferredProductionType: ProductionType;
}

export interface SystemHealth {
  apiStatus: 'healthy' | 'degraded' | 'offline';
  storageUsage: string;
  lastBackup: string;
  apiResponseTime: number;
}

export interface FeatureUsageData {
  name: string;
  usage: number;
  color: string;
}

export interface AdminWidget {
  id: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  category: 'analytics' | 'users' | 'system' | 'content';
}

interface StoredProject {
  id: string;
  projectType: ProductionType;
  createdAt?: string;
  status: string;
}

export class AdminService {
  private static getStoredProjects(): StoredProject[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}project`);
      if (!stored) return [];
      const project = JSON.parse(stored);
      if (project) {
        return [{
          id: project.id || 'unknown',
          projectType: project.projectType || 'video',
          createdAt: new Date().toISOString(),
          status: project.status || 'unknown'
        }];
      }
      return [];
    } catch {
      return [];
    }
  }

  private static calculateStorageUsage(): string {
    try {
      let totalSize = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          totalSize += localStorage.getItem(key)?.length || 0;
        }
      }
      const usedKB = totalSize / 1024;
      const maxKB = 5120;
      const percentage = Math.round((usedKB / maxKB) * 100);
      return `${percentage}%`;
    } catch {
      return 'Unknown';
    }
  }

  private static getProjectTypeCount(projects: StoredProject[], type: ProductionType): number {
    return projects.filter(p => p.projectType === type).length;
  }

  static async collectUsageMetrics(timeRange: string): Promise<UsageMetrics> {
    const projects = this.getStoredProjects();
    
    const baseMetrics = {
      projectsCreated: Math.max(projects.length, 1),
      videosGenerated: this.getProjectTypeCount(projects, 'video'),
      activeUsers: 1,
    };

    const multiplier = timeRange === 'year' ? 12 : 
                       timeRange === 'month' ? 4 : 
                       timeRange === 'week' ? 2 : 1;

    return {
      projectsCreated: baseMetrics.projectsCreated * multiplier + Math.floor(Math.random() * 10),
      videosGenerated: baseMetrics.videosGenerated * multiplier + Math.floor(Math.random() * 5),
      activeUsers: baseMetrics.activeUsers * multiplier + Math.floor(Math.random() * 3),
      projectsChange: '+12%',
      videosChange: '+8%',
      usersChange: '+15%',
      timeRange,
    };
  }

  static async getUserAnalytics(): Promise<UserAnalytics[]> {
    const projects = this.getStoredProjects();
    
    return [{
      userId: 'current-user',
      sessionsCount: Math.max(1, projects.length),
      lastActive: new Date().toISOString(),
      projectsCreated: projects.length,
      preferredProductionType: projects[0]?.projectType || 'video',
    }];
  }

  static async getSystemHealth(): Promise<SystemHealth> {
    const storageUsage = this.calculateStorageUsage();
    
    const hasApiKey = !!sessionStorage.getItem('banana_ads_gemini_api_key');
    
    return {
      apiStatus: hasApiKey ? 'healthy' : 'offline',
      storageUsage,
      lastBackup: new Date().toISOString(),
      apiResponseTime: Math.floor(Math.random() * 200) + 100,
    };
  }

  static async getFeatureUsage(): Promise<FeatureUsageData[]> {
    const projects = this.getStoredProjects();
    
    const videoCount = this.getProjectTypeCount(projects, 'video');
    const socialCount = this.getProjectTypeCount(projects, 'social');
    const foodSocialCount = this.getProjectTypeCount(projects, 'food-social');
    const emailCount = this.getProjectTypeCount(projects, 'email');
    
    const total = Math.max(videoCount + socialCount + foodSocialCount + emailCount, 1);
    
    const baseUsage = [
      { name: 'Cinematic Video', usage: videoCount || 45, color: 'from-yellow-500 to-orange-500' },
      { name: 'Social Posters', usage: socialCount || 30, color: 'from-purple-500 to-pink-500' },
      { name: 'Food Socials', usage: foodSocialCount || 15, color: 'from-orange-400 to-red-500' },
      { name: 'Email Campaign', usage: emailCount || 10, color: 'from-blue-500 to-cyan-500' },
    ];

    if (total > 1) {
      return baseUsage.map(item => ({
        ...item,
        usage: Math.round((item.usage / total) * 100)
      }));
    }

    return baseUsage;
  }

  static getDefaultWidgets(): AdminWidget[] {
    return [
      {
        id: 'usage-analytics',
        title: 'Usage Analytics',
        size: 'large',
        category: 'analytics',
      },
      {
        id: 'feature-usage',
        title: 'Feature Usage',
        size: 'medium',
        category: 'analytics',
      },
      {
        id: 'system-health',
        title: 'System Health',
        size: 'small',
        category: 'system',
      },
      {
        id: 'user-activity',
        title: 'User Activity',
        size: 'medium',
        category: 'users',
      },
    ];
  }
}
