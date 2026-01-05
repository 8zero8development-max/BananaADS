/**
 * Gmail Service for sending and scheduling email campaigns
 * Follows the pattern established by FacebookService
 */

const GMAIL_ACCESS_TOKEN_KEY = 'banana_ads_gmail_access_token';
const GMAIL_REFRESH_TOKEN_KEY = 'banana_ads_gmail_refresh_token';
const GMAIL_USER_EMAIL_KEY = 'banana_ads_gmail_user_email';
const GMAIL_OAUTH_LOCK_KEY = 'banana_ads_gmail_oauth_lock';

// Track if OAuth callback is being processed to prevent race conditions
let oauthCallbackInProgress = false;

export interface GmailSendOptions {
  to: string[];
  subject: string;
  htmlContent: string;
  scheduledTime?: Date;
}

export interface GmailSendResponse {
  id: string;
  threadId?: string;
  labelIds?: string[];
}

export interface GmailUserInfo {
  email: string;
  name?: string;
  picture?: string;
}

export interface ScheduledEmail {
  id: string;
  to: string[];
  subject: string;
  htmlContent: string;
  scheduledTime: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  errorMessage?: string;
}

export class GmailService {
  private static encodeKey(key: string): string {
    const encoded = btoa(key);
    return encoded.split('').reverse().join('');
  }

  private static decodeKey(encoded: string): string {
    const reversed = encoded.split('').reverse().join('');
    return atob(reversed);
  }

  private static getStoredAccessToken(): string | null {
    try {
      const encoded = sessionStorage.getItem(GMAIL_ACCESS_TOKEN_KEY);
      if (!encoded) return null;
      return this.decodeKey(encoded);
    } catch {
      return null;
    }
  }

  static setAccessToken(token: string): void {
    try {
      const encoded = this.encodeKey(token);
      sessionStorage.setItem(GMAIL_ACCESS_TOKEN_KEY, encoded);
    } catch (e) {
      console.error('Failed to store Gmail access token');
    }
  }

  static setRefreshToken(token: string): void {
    try {
      const encoded = this.encodeKey(token);
      sessionStorage.setItem(GMAIL_REFRESH_TOKEN_KEY, encoded);
    } catch (e) {
      console.error('Failed to store Gmail refresh token');
    }
  }

  static getRefreshToken(): string | null {
    try {
      const encoded = sessionStorage.getItem(GMAIL_REFRESH_TOKEN_KEY);
      if (!encoded) return null;
      return this.decodeKey(encoded);
    } catch {
      return null;
    }
  }

  static setUserEmail(email: string): void {
    try {
      sessionStorage.setItem(GMAIL_USER_EMAIL_KEY, email);
    } catch (e) {
      console.error('Failed to store Gmail user email');
    }
  }

  static getUserEmail(): string | null {
    try {
      return sessionStorage.getItem(GMAIL_USER_EMAIL_KEY);
    } catch {
      return null;
    }
  }

  static clearTokens(): void {
    try {
      sessionStorage.removeItem(GMAIL_ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(GMAIL_REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(GMAIL_USER_EMAIL_KEY);
    } catch (e) {
      console.error('Failed to clear Gmail tokens');
    }
  }

  static hasAccessToken(): boolean {
    return !!this.getStoredAccessToken();
  }

  static isAuthenticated(): boolean {
    return this.hasAccessToken() && !!this.getUserEmail();
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

  /**
   * Initiates the OAuth2 flow by redirecting to the backend auth endpoint
   */
  static initiateOAuth(): void {
    const currentUrl = window.location.href;
    const redirectUrl = `/api/gmail/auth?redirect=${encodeURIComponent(currentUrl)}`;
    window.location.href = redirectUrl;
  }

  /**
   * Handles the OAuth callback by extracting tokens from URL params
   * Uses a lock mechanism to prevent race conditions when multiple components
   * call this method simultaneously
   */
  static handleOAuthCallback(): boolean {
    // Prevent concurrent processing of OAuth callback
    if (oauthCallbackInProgress) {
      return this.isAuthenticated();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('gmail_access_token');
    const refreshToken = urlParams.get('gmail_refresh_token');
    const email = urlParams.get('gmail_email');

    if (accessToken && email) {
      // Set lock to prevent race conditions
      oauthCallbackInProgress = true;
      
      try {
        // Check if we've already processed this callback (using sessionStorage as a lock)
        const lockValue = sessionStorage.getItem(GMAIL_OAUTH_LOCK_KEY);
        const currentLockValue = `${accessToken.slice(0, 10)}_${Date.now()}`;
        
        if (lockValue && lockValue.startsWith(accessToken.slice(0, 10))) {
          // Already processed this token, just return current auth state
          return this.isAuthenticated();
        }
        
        // Set the lock before storing tokens
        sessionStorage.setItem(GMAIL_OAUTH_LOCK_KEY, currentLockValue);
        
        // Store tokens atomically (all or nothing)
        this.setAccessToken(accessToken);
        if (refreshToken) {
          this.setRefreshToken(refreshToken);
        }
        this.setUserEmail(email);
        
        // Clean up URL params only after tokens are stored
        const url = new URL(window.location.href);
        url.searchParams.delete('gmail_access_token');
        url.searchParams.delete('gmail_refresh_token');
        url.searchParams.delete('gmail_email');
        window.history.replaceState({}, document.title, url.toString());
        
        return true;
      } finally {
        // Release the lock
        oauthCallbackInProgress = false;
        // Clear the lock after a short delay to allow for page reloads
        setTimeout(() => {
          try {
            sessionStorage.removeItem(GMAIL_OAUTH_LOCK_KEY);
          } catch {
            // Ignore errors during cleanup
          }
        }, 5000);
      }
    }
    return false;
  }

  /**
   * Refreshes the access token using the refresh token
   */
  static async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch('/api/gmail/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      if (data.accessToken) {
        this.setAccessToken(data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh Gmail access token:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Gets the current user's Gmail profile info
   */
  static async getUserInfo(): Promise<GmailUserInfo | null> {
    const accessToken = this.getStoredAccessToken();
    if (!accessToken) {
      return null;
    }

    return this.retry(async () => {
      const response = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/profile',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.getUserInfo();
        }
        throw new Error('Gmail authentication expired. Please reconnect your account.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gmail API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        email: data.emailAddress,
      };
    });
  }

  /**
   * Creates a MIME message for sending via Gmail API
   */
  private static createMimeMessage(to: string[], subject: string, htmlContent: string, fromEmail: string): string {
    const boundary = 'boundary_' + Date.now().toString(16);
    
    const mimeMessage = [
      `From: ${fromEmail}`,
      `To: ${to.join(', ')}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      btoa(unescape(encodeURIComponent(this.htmlToPlainText(htmlContent)))),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      btoa(unescape(encodeURIComponent(htmlContent))),
      '',
      `--${boundary}--`,
    ].join('\r\n');

    return btoa(unescape(encodeURIComponent(mimeMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Converts HTML to plain text for the text/plain part of the email
   */
  private static htmlToPlainText(html: string): string {
    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Replace <br> and block elements with newlines
    const blockElements = temp.querySelectorAll('p, div, br, h1, h2, h3, h4, h5, h6, li, tr');
    blockElements.forEach(el => {
      if (el.tagName === 'BR') {
        el.replaceWith('\n');
      } else {
        el.insertAdjacentText('afterend', '\n');
      }
    });
    
    return temp.textContent || temp.innerText || '';
  }

  /**
   * Sends an email immediately via Gmail API
   */
  static async sendEmail(options: GmailSendOptions): Promise<GmailSendResponse> {
    const accessToken = this.getStoredAccessToken();
    if (!accessToken) {
      throw new Error('Gmail not authenticated. Please connect your Gmail account.');
    }

    const userEmail = this.getUserEmail();
    if (!userEmail) {
      throw new Error('Gmail user email not found. Please reconnect your account.');
    }

    const { to, subject, htmlContent } = options;

    if (!to || to.length === 0) {
      throw new Error('At least one recipient email is required.');
    }

    if (!subject) {
      throw new Error('Email subject is required.');
    }

    if (!htmlContent) {
      throw new Error('Email content is required.');
    }

    return this.retry(async () => {
      const raw = this.createMimeMessage(to, subject, htmlContent, userEmail);

      const response = await fetch(
        'https://www.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw }),
        }
      );

      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.sendEmail(options);
        }
        throw new Error('Gmail authentication expired. Please reconnect your account.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gmail API error: ${response.status}`);
      }

      return response.json();
    });
  }

  /**
   * Schedules an email to be sent at a future time via backend
   */
  static async scheduleEmail(options: GmailSendOptions): Promise<ScheduledEmail> {
    const accessToken = this.getStoredAccessToken();
    if (!accessToken) {
      throw new Error('Gmail not authenticated. Please connect your Gmail account.');
    }

    const userEmail = this.getUserEmail();
    if (!userEmail) {
      throw new Error('Gmail user email not found. Please reconnect your account.');
    }

    const { to, subject, htmlContent, scheduledTime } = options;

    if (!to || to.length === 0) {
      throw new Error('At least one recipient email is required.');
    }

    if (!subject) {
      throw new Error('Email subject is required.');
    }

    if (!htmlContent) {
      throw new Error('Email content is required.');
    }

    if (!scheduledTime) {
      throw new Error('Scheduled time is required for scheduling emails.');
    }

    // Validate scheduled time is in the future
    const now = new Date();
    if (scheduledTime <= now) {
      throw new Error('Scheduled time must be in the future.');
    }

    // Validate scheduled time is not more than 30 days in the future
    const maxScheduleTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (scheduledTime > maxScheduleTime) {
      throw new Error('Scheduled time cannot be more than 30 days in the future.');
    }

    return this.retry(async () => {
      const response = await fetch('/api/gmail/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          refreshToken: this.getRefreshToken(),
          userEmail,
          to,
          subject,
          htmlContent,
          scheduledTime: scheduledTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to schedule email: ${response.status}`);
      }

      return response.json();
    });
  }

  /**
   * Gets all scheduled emails for the current user
   */
  static async getScheduledEmails(): Promise<ScheduledEmail[]> {
    const userEmail = this.getUserEmail();
    if (!userEmail) {
      return [];
    }

    try {
      const response = await fetch(`/api/gmail/scheduled?email=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        console.error('Failed to fetch scheduled emails');
        return [];
      }

      const data = await response.json();
      return data.emails || [];
    } catch (error) {
      console.error('Error fetching scheduled emails:', error);
      return [];
    }
  }

  /**
   * Cancels a scheduled email
   */
  static async cancelScheduledEmail(emailId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/gmail/schedule/${emailId}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('Error canceling scheduled email:', error);
      return false;
    }
  }

  /**
   * Disconnects the Gmail account
   */
  static disconnect(): void {
    this.clearTokens();
  }
}
