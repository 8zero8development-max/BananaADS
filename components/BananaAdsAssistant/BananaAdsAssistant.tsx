import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AdBrief } from '../../types';
import { GeminiService } from '../../services/geminiService';
import BananaPro, { BananaRole } from '../shared/BananaPro';
import bananaAssistantImg from '../../attached_assets/banana-assistant.png';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  action?: {
    type: 'autofill' | 'research' | 'generate';
    data?: Partial<AdBrief>;
  };
}

interface BananaAdsAssistantProps {
  brief: AdBrief;
  setBrief: React.Dispatch<React.SetStateAction<AdBrief>>;
  productionType: 'video' | 'social' | 'food-social';
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const BananaAdsAssistant: React.FC<BananaAdsAssistantProps> = ({
  brief,
  setBrief,
  productionType,
  showToast
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `Hi! I'm your BananaAds Assistant. I can help you with:\n\n- Auto-filling form fields (just tell me your brand details)\n- Researching your brand's DNA\n- Answering questions about the ${productionType} workflow\n\nHow can I help you today?`,
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRole, setCurrentRole] = useState<BananaRole>('default');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const processAutoFill = (text: string): Partial<AdBrief> => {
    const updates: Partial<AdBrief> = {};
    
    const brandMatch = text.match(/brand(?:\s+name)?[:\s]+([^\n,]+)/i);
    if (brandMatch) updates.brandName = brandMatch[1].trim();
    
    const productMatch = text.match(/product(?:\s+name)?[:\s]+([^\n,]+)/i);
    if (productMatch) updates.productName = productMatch[1].trim();
    
    const audienceMatch = text.match(/(?:target\s+)?audience[:\s]+([^\n]+)/i);
    if (audienceMatch) updates.targetAudience = audienceMatch[1].trim();
    
    const toneMatch = text.match(/tone[:\s]+([^\n]+)/i);
    if (toneMatch) {
      const tones = toneMatch[1].split(/[,;]/).map(t => t.trim()).filter(t => t);
      if (tones.length > 0) updates.tone = tones;
    }
    
    const featuresMatch = text.match(/(?:key\s+)?features[:\s]+([^\n]+)/i);
    if (featuresMatch) {
      const features = featuresMatch[1].split(/[,;]/).map(f => f.trim()).filter(f => f);
      if (features.length > 0) updates.keyFeatures = features;
    }
    
    const directionMatch = text.match(/(?:creative\s+)?direction[:\s]+([^\n]+)/i);
    if (directionMatch) updates.creativeDirection = directionMatch[1].trim();
    
    const urlMatch = text.match(/(?:product\s+)?url[:\s]+(https?:\/\/[^\s]+)/i);
    if (urlMatch) updates.productUrl = urlMatch[1].trim();
    
    return updates;
  };

  const detectIntent = (text: string): 'autofill' | 'research' | 'help' | 'general' => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('research') || lowerText.includes('brand dna') || 
        lowerText.includes('find out') || lowerText.includes('look up')) {
      return 'research';
    }
    
    if (lowerText.includes('fill') || lowerText.includes('set') || 
        lowerText.includes('update') || lowerText.includes('change') ||
        lowerText.match(/brand[:\s]/i) || lowerText.match(/product[:\s]/i)) {
      return 'autofill';
    }
    
    if (lowerText.includes('help') || lowerText.includes('how') || 
        lowerText.includes('what') || lowerText.includes('?')) {
      return 'help';
    }
    
    return 'general';
  };

  const handleBrandResearch = async (): Promise<string> => {
    setCurrentRole('research');
    
    try {
      if (productionType === 'food-social') {
        if (!brief.keyFeatures.length && !brief.productUrl) {
          return "I need some information to research. Please provide either a product description (key features) or a product URL first.";
        }
        
        const research = await GeminiService.autoFillFoodBrief(
          brief.keyFeatures.join(', '),
          brief.productUrl || ''
        );
        
        return `I found some information about your brand!\n\n` +
          `Brand Name: ${research.brandName || 'Not found'}\n` +
          `Product: ${research.productName || 'Not found'}\n` +
          `Target Audience: ${research.targetAudience || 'Not found'}\n` +
          `Tone: ${research.tone?.join(', ') || 'Not found'}\n` +
          `Key Features: ${research.keyFeatures?.join(', ') || 'Not found'}\n\n` +
          `Would you like me to apply these findings to your brief? Just say "apply" or "yes".`;
      } else {
        if (!brief.brandName && !brief.productName) {
          return "I need a brand name or product name to research. Please provide at least one of these first.";
        }
        
        const research = await GeminiService.researchBrand(
          brief.brandName,
          brief.productName
        );
        
        let response = `I researched ${brief.brandName || brief.productName}!\n\n` +
          `Target Audience: ${research.targetAudience || 'Not found'}\n` +
          `Tone: ${research.tone?.join(', ') || 'Not found'}\n` +
          `Key Features: ${research.keyFeatures?.join(', ') || 'Not found'}`;
        
        if (research.researchSources && research.researchSources.length > 0) {
          response += `\n\nSources:\n${research.researchSources.slice(0, 3).map(s => `- ${s}`).join('\n')}`;
        }
        
        response += `\n\nWould you like me to apply these findings? Say "apply" or "yes".`;
        
        return response;
      }
    } catch (error: any) {
      console.error('Research failed:', error);
      return `Sorry, I couldn't complete the research. ${error.message || 'Please try again later.'}`;
    } finally {
      setCurrentRole('default');
    }
  };

  const applyResearchFindings = async () => {
    setCurrentRole('writer');
    
    try {
      if (productionType === 'food-social') {
        const research = await GeminiService.autoFillFoodBrief(
          brief.keyFeatures.join(', '),
          brief.productUrl || ''
        );
        
        setBrief(prev => ({
          ...prev,
          brandName: research.brandName || prev.brandName,
          productName: research.productName || prev.productName,
          targetAudience: research.targetAudience || prev.targetAudience,
          tone: research.tone || prev.tone,
          keyFeatures: research.keyFeatures || prev.keyFeatures,
          logoImage: research.logoImage || prev.logoImage,
        }));
      } else {
        const research = await GeminiService.researchBrand(
          brief.brandName,
          brief.productName
        );
        
        setBrief(prev => ({
          ...prev,
          targetAudience: research.targetAudience || prev.targetAudience,
          tone: research.tone || prev.tone,
          keyFeatures: research.keyFeatures || prev.keyFeatures,
          logoImage: research.logoImage || prev.logoImage,
          researchSources: research.researchSources
        }));
      }
      
      showToast('Research findings applied to your brief!', 'success');
      return "Done! I've applied the research findings to your brief.";
    } catch (error: any) {
      return `Sorry, I couldn't apply the findings. ${error.message || 'Please try again.'}`;
    } finally {
      setCurrentRole('default');
    }
  };

  const getHelpResponse = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (productionType === 'video') {
      if (lowerText.includes('storyboard') || lowerText.includes('scene')) {
        return "In video mode, after you select a concept, I'll help generate a cinematic storyboard with multiple scenes. Each scene includes a visual prompt for image generation and an audio script for voiceover.";
      }
      if (lowerText.includes('voiceover') || lowerText.includes('voice')) {
        return "You can generate AI voiceovers for each scene! Just click the microphone icon on any scene card. You can also choose different voice styles in the brief settings.";
      }
    }
    
    if (productionType === 'social') {
      if (lowerText.includes('poster') || lowerText.includes('image')) {
        return "In social mode, I'll generate portrait-oriented (3:4) poster images perfect for Instagram, TikTok, and other social platforms. Each concept will have multiple post variations.";
      }
    }
    
    if (productionType === 'food-social') {
      if (lowerText.includes('cta') || lowerText.includes('headline')) {
        return "For food-social campaigns, each concept comes with 3 different CTA/headline options. You can select which one to use for each post, and I'll render it directly on the image!";
      }
      if (lowerText.includes('brand dna') || lowerText.includes('visual style')) {
        return "I analyze your uploaded product images and logo to extract your brand's visual DNA - colors, style, and aesthetic. This ensures all generated content matches your brand identity.";
      }
    }
    
    return `I'm here to help with your ${productionType} campaign! You can:\n\n` +
      `1. Tell me your brand details and I'll auto-fill the form\n` +
      `2. Ask me to research your brand's DNA\n` +
      `3. Ask questions about the workflow\n\n` +
      `Try saying something like "Brand: Nike, Product: Air Max" or "Research my brand"`;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    const userMessage: Message = {
      id: generateId(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);
    
    const intent = detectIntent(userMessage.text);
    let responseText = '';
    let action: Message['action'] | undefined;
    
    try {
      const lowerText = userMessage.text.toLowerCase();
      
      if (lowerText === 'apply' || lowerText === 'yes' || lowerText.includes('apply the findings')) {
        responseText = await applyResearchFindings();
      } else if (intent === 'research') {
        responseText = await handleBrandResearch();
      } else if (intent === 'autofill') {
        setCurrentRole('writer');
        const updates = processAutoFill(userMessage.text);
        
        if (Object.keys(updates).length > 0) {
          setBrief(prev => ({ ...prev, ...updates }));
          
          const updatedFields = Object.keys(updates).map(key => {
            const value = updates[key as keyof AdBrief];
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          });
          
          responseText = `Got it! I've updated the following fields:\n\n${updatedFields.join('\n')}\n\nAnything else you'd like to add or change?`;
          action = { type: 'autofill', data: updates };
          showToast('Brief updated!', 'success');
        } else {
          responseText = "I couldn't find any specific field values in your message. Try formatting like:\n\n" +
            "Brand: Your Brand Name\n" +
            "Product: Your Product\n" +
            "Audience: Your target audience\n" +
            "Tone: Premium, Modern, Bold";
        }
        setCurrentRole('default');
      } else if (intent === 'help') {
        responseText = getHelpResponse(userMessage.text);
      } else {
        responseText = getHelpResponse(userMessage.text);
      }
    } catch (error: any) {
      console.error('Error processing message:', error);
      responseText = `Sorry, something went wrong. ${error.message || 'Please try again.'}`;
    } finally {
      setIsProcessing(false);
      setCurrentRole('default');
    }
    
    const assistantMessage: Message = {
      id: generateId(),
      text: responseText,
      sender: 'assistant',
      timestamp: new Date(),
      action
    };
    
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const chatBubbleStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    zIndex: 50,
  };

  return (
    <div style={chatBubbleStyles}>
      {isOpen && (
        <div 
          className="glass rounded-2xl mb-4 w-80 sm:w-96 max-h-[500px] flex flex-col overflow-hidden shadow-2xl"
          style={{ 
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <div className="flex items-center justify-between p-4 border-b border-yellow-500/20">
            <div className="flex items-center gap-3">
              <BananaPro role={currentRole} size="sm" />
              <div>
                <h3 className="font-bold text-white text-sm">BananaAds Assistant</h3>
                <p className="text-xs text-white/50">
                  {isProcessing ? 'Thinking...' : `${productionType} mode`}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white transition p-1"
              aria-label="Close chat"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]"
            style={{ maxHeight: '350px' }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-yellow-500/20 text-white'
                      : 'bg-white/5 text-white/90'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className="text-[10px] text-white/30 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-yellow-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-yellow-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-yellow-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-yellow-500/20">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition"
                disabled={isProcessing}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isProcessing}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-yellow-500 rounded-full w-10 h-10 flex items-center justify-center transition"
                aria-label="Send message"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-black/60 border-2 border-white/30 hover:bg-black/80' 
            : 'bg-black/60 border-2 border-yellow-400 hover:scale-110 hover:border-yellow-300'
        }`}
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
        style={{
          boxShadow: isOpen ? 'none' : '0 0 30px rgba(250, 204, 21, 0.5)',
        }}
      >
        {isOpen ? (
          <i className="fa-solid fa-xmark text-white text-2xl"></i>
        ) : (
          <img 
            src={bananaAssistantImg} 
            alt="BananaAds Assistant" 
            className="w-16 h-16 object-contain"
          />
        )}
      </button>
      
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default BananaAdsAssistant;
