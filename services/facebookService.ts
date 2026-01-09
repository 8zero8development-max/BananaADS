import { Scene } from "../types";
import { safeResponseJson } from "../utils/safeJson";

const API_KEY_STORAGE_KEY = 'banana_ads_facebook_api_key';
const PAGE_ID_STORAGE_KEY = 'banana_ads_facebook_page_id';

export interface FacebookScheduleOptions {
  pageId: string;
  message: string;
  imageUrl?: string;
  videoUrl?: string;
  scheduledPublishTime?: number;
}

export interface FacebookPostResponse {
  id: string;
  post_id?: string;
  scheduled_publish_time?: number;
}

export interface FacebookPageInfo {
  id: string;
  name: string;
  access_token?: string;
}

export class FacebookService {
  private static encodeKey(key: string): string {
    const encoded = btoa(key);
    return encoded.split('').reverse().join('');
  }

  private static decodeKey(encoded: string): string {
    const reversed = encoded.split('').reverse().join('');
    return atob(reversed);
  }

  private static getStoredApiKey(): string | null {
    try {
      const encoded = sessionStorage.getItem(API_KEY_STORAGE_KEY);
      if (!encoded) return null;
      return this.decodeKey(encoded);
    } catch {
      return null;
    }
  }

  static setApiKey(apiKey: string): void {
    try {
      const encoded = this.encodeKey(apiKey);
      sessionStorage.setItem(API_KEY_STORAGE_KEY, encoded);
    } catch (e) {
      console.error('Failed to store Facebook API key');
    }
  }

  static clearApiKey(): void {
    try {
      sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear Facebook API key');
    }
  }

  static hasApiKey(): boolean {
    return !!this.getStoredApiKey();
  }

  static setPageId(pageId: string): void {
    try {
      sessionStorage.setItem(PAGE_ID_STORAGE_KEY, pageId);
    } catch (e) {
      console.error('Failed to store Facebook Page ID');
    }
  }

  static getPageId(): string | null {
    try {
      return sessionStorage.getItem(PAGE_ID_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  static clearPageId(): void {
    try {
      sessionStorage.removeItem(PAGE_ID_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear Facebook Page ID');
    }
  }

  private static async retry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as { status?: number; response?: { status?: number }; message?: string };
      const status = err?.status || err?.response?.status;
      const message = err?.message || '';
      if (retries > 0 && (
          status === 429 || 
          status === 503 || 
          message.includes('429') || 
          message.includes('rate limit') ||
          message.includes('temporarily unavailable')
      )) {
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  static async getPageInfo(): Promise<FacebookPageInfo | null> {
    const accessToken = this.getStoredApiKey();
    if (!accessToken) {
      throw new Error("Facebook API key not configured. Please add your Facebook Page Access Token in settings.");
    }

    return this.retry(async () => {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`
      );

      if (!response.ok) {
        const errorData = await safeResponseJson<{ error?: { message?: string } }>(response, 'Facebook API (getPageInfo)', {});
        throw new Error(errorData.error?.message || `Facebook API error: ${response.status}`);
      }

      return safeResponseJson<FacebookPageInfo>(response, 'Facebook API (getPageInfo)');
    });
  }

  static async uploadPhoto(pageId: string, imageUrl: string, caption?: string, published: boolean = false): Promise<{ id: string }> {
    const accessToken = this.getStoredApiKey();
    if (!accessToken) {
      throw new Error("Facebook API key not configured. Please add your Facebook Page Access Token in settings.");
    }

    return this.retry(async () => {
      const formData = new FormData();
      
      if (imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        formData.append('source', blob, 'image.png');
      } else {
        formData.append('url', imageUrl);
      }
      
      if (caption) {
        formData.append('caption', caption);
      }
      formData.append('published', published.toString());
      formData.append('access_token', accessToken);

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/photos`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await safeResponseJson<{ error?: { message?: string } }>(response, 'Facebook API (uploadPhoto)', {});
        throw new Error(errorData.error?.message || `Facebook API error: ${response.status}`);
      }

      return safeResponseJson<{ id: string }>(response, 'Facebook API (uploadPhoto)');
    });
  }

  static async uploadVideo(pageId: string, videoUrl: string, description?: string): Promise<{ id: string }> {
    const accessToken = this.getStoredApiKey();
    if (!accessToken) {
      throw new Error("Facebook API key not configured. Please add your Facebook Page Access Token in settings.");
    }

    return this.retry(async () => {
      const formData = new FormData();
      
      if (videoUrl.startsWith('data:')) {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        formData.append('source', blob, 'video.mp4');
      } else {
        formData.append('file_url', videoUrl);
      }
      
      if (description) {
        formData.append('description', description);
      }
      formData.append('access_token', accessToken);

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/videos`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await safeResponseJson<{ error?: { message?: string } }>(response, 'Facebook API (uploadVideo)', {});
        throw new Error(errorData.error?.message || `Facebook API error: ${response.status}`);
      }

      return safeResponseJson<{ id: string }>(response, 'Facebook API (uploadVideo)');
    });
  }

  static async createPagePost(options: FacebookScheduleOptions): Promise<FacebookPostResponse> {
    const accessToken = this.getStoredApiKey();
    if (!accessToken) {
      throw new Error("Facebook API key not configured. Please add your Facebook Page Access Token in settings.");
    }

    const { pageId, message, imageUrl, videoUrl, scheduledPublishTime } = options;

    return this.retry(async () => {
      if (videoUrl) {
        const formData = new FormData();
        
        if (videoUrl.startsWith('data:')) {
          const response = await fetch(videoUrl);
          const blob = await response.blob();
          formData.append('source', blob, 'video.mp4');
        } else {
          formData.append('file_url', videoUrl);
        }
        
        formData.append('description', message);
        formData.append('access_token', accessToken);
        
        if (scheduledPublishTime) {
          formData.append('scheduled_publish_time', scheduledPublishTime.toString());
          formData.append('published', 'false');
        }

        const response = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}/videos`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await safeResponseJson<{ error?: { message?: string } }>(response, 'Facebook API (createPagePost video)', {});
          throw new Error(errorData.error?.message || `Facebook API error: ${response.status}`);
        }

        return safeResponseJson<FacebookPostResponse>(response, 'Facebook API (createPagePost video)');
      }

      if (imageUrl) {
        const formData = new FormData();
        
        if (imageUrl.startsWith('data:')) {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          formData.append('source', blob, 'image.png');
        } else {
          formData.append('url', imageUrl);
        }
        
        formData.append('caption', message);
        formData.append('access_token', accessToken);
        
        if (scheduledPublishTime) {
          formData.append('scheduled_publish_time', scheduledPublishTime.toString());
          formData.append('published', 'false');
        }

        const response = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}/photos`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await safeResponseJson<{ error?: { message?: string } }>(response, 'Facebook API (createPagePost image)', {});
          throw new Error(errorData.error?.message || `Facebook API error: ${response.status}`);
        }

        return safeResponseJson<FacebookPostResponse>(response, 'Facebook API (createPagePost image)');
      }

      const params = new URLSearchParams();
      params.append('message', message);
      params.append('access_token', accessToken);
      
      if (scheduledPublishTime) {
        params.append('scheduled_publish_time', scheduledPublishTime.toString());
        params.append('published', 'false');
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const errorData = await safeResponseJson<{ error?: { message?: string } }>(response, 'Facebook API (createPagePost feed)', {});
        throw new Error(errorData.error?.message || `Facebook API error: ${response.status}`);
      }

      return safeResponseJson<FacebookPostResponse>(response, 'Facebook API (createPagePost feed)');
    });
  }

  static async schedulePost(
    scene: Scene,
    pageId: string,
    scheduledTime: Date,
    customMessage?: string
  ): Promise<FacebookPostResponse> {
    const message = customMessage || scene.audioScript;
    const scheduledPublishTime = Math.floor(scheduledTime.getTime() / 1000);

    const minScheduleTime = Math.floor(Date.now() / 1000) + 600;
    if (scheduledPublishTime < minScheduleTime) {
      throw new Error("Scheduled time must be at least 10 minutes in the future.");
    }

    const maxScheduleTime = Math.floor(Date.now() / 1000) + (75 * 24 * 60 * 60);
    if (scheduledPublishTime > maxScheduleTime) {
      throw new Error("Scheduled time cannot be more than 75 days in the future.");
    }

    return this.createPagePost({
      pageId,
      message,
      imageUrl: scene.imageUrl,
      videoUrl: scene.videoUrl,
      scheduledPublishTime,
    });
  }

  static async publishNow(
    scene: Scene,
    pageId: string,
    customMessage?: string
  ): Promise<FacebookPostResponse> {
    const message = customMessage || scene.audioScript;

    return this.createPagePost({
      pageId,
      message,
      imageUrl: scene.imageUrl,
      videoUrl: scene.videoUrl,
    });
  }

  static async getScheduledPosts(pageId: string): Promise<{ data: FacebookPostResponse[] }> {
    const accessToken = this.getStoredApiKey();
    if (!accessToken) {
      throw new Error("Facebook API key not configured. Please add your Facebook Page Access Token in settings.");
    }

    return this.retry(async () => {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/scheduled_posts?access_token=${encodeURIComponent(accessToken)}`
      );

      if (!response.ok) {
        const errorData = await safeResponseJson<{ error?: { message?: string } }>(response, 'Facebook API (getScheduledPosts)', {});
        throw new Error(errorData.error?.message || `Facebook API error: ${response.status}`);
      }

      return safeResponseJson<{ data: FacebookPostResponse[] }>(response, 'Facebook API (getScheduledPosts)');
    });
  }

  static async deleteScheduledPost(postId: string): Promise<{ success: boolean }> {
    const accessToken = this.getStoredApiKey();
    if (!accessToken) {
      throw new Error("Facebook API key not configured. Please add your Facebook Page Access Token in settings.");
    }

    return this.retry(async () => {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${postId}?access_token=${encodeURIComponent(accessToken)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await safeResponseJson<{ error?: { message?: string } }>(response, 'Facebook API (deleteScheduledPost)', {});
        throw new Error(errorData.error?.message || `Facebook API error: ${response.status}`);
      }

      return safeResponseJson<{ success: boolean }>(response, 'Facebook API (deleteScheduledPost)');
    });
  }
}
