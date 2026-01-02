import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { GeminiService } from './services/geminiService';

// Mock the GeminiService
vi.mock('./services/geminiService', () => {
  return {
    GeminiService: {
      researchBrand: vi.fn(),
      generateConcepts: vi.fn(),
    },
  };
});

// Mock window.aistudio
Object.defineProperty(window, 'aistudio', {
    value: undefined,
    writable: true
});

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.API_KEY;
    (window as any).aistudio = undefined;
  });

  it('renders ApiKeyConfig when no API key is present', async () => {
    render(<App />);
    expect(screen.getByText(/Configuration Required/i)).toBeInTheDocument();
  });

  it('renders Briefing screen when API key is present', async () => {
    process.env.API_KEY = 'test-key';
    render(<App />);

    // Wait for the app to detect the key and switch screens
    await waitFor(() => {
        expect(screen.getByText(/Tell us about your brand/i)).toBeInTheDocument();
    });
  });

  it('renders Briefing screen when window.aistudio has key', async () => {
    (window as any).aistudio = {
        hasSelectedApiKey: vi.fn().mockResolvedValue(true)
    };
    render(<App />);

    await waitFor(() => {
        expect(screen.getByText(/Tell us about your brand/i)).toBeInTheDocument();
    });
  });

  it('renders ApiKeyConfig if window.aistudio has no key', async () => {
    (window as any).aistudio = {
        hasSelectedApiKey: vi.fn().mockResolvedValue(false),
        openSelectKey: vi.fn()
    };
    render(<App />);

    // Should stay on config screen, but might show specific AI studio UI
    // In the code, if aiStudio is true, it shows "To use the Veo video generation..."

    await waitFor(() => {
        expect(screen.getByText(/Configuration Required/i)).toBeInTheDocument();
    });
  });

});
