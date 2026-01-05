import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { AdBrief, AdConcept, Scene } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { GmailService } from '../../services/gmailService';
import BananaPro from '../shared/BananaPro';

// Configure DOMPurify for email-safe HTML
const DOMPURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'html', 'head', 'body', 'style', 'title', 'meta',
    'div', 'span', 'p', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'ul', 'ol', 'li',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'blockquote', 'pre', 'code',
    'center', 'font'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'width', 'height',
    'style', 'class', 'id', 'name',
    'align', 'valign', 'bgcolor', 'color', 'border',
    'cellpadding', 'cellspacing', 'colspan', 'rowspan',
    'target', 'rel'
  ],
  ALLOW_DATA_ATTR: true,
  // Allow inline styles for email formatting
  FORCE_BODY: false,
  // Prevent script execution
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * Used before rendering user-generated or AI-generated HTML in preview
 */
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}

interface EmailTemplateEditorProps {
  brief: AdBrief;
  concept: AdConcept;
  scenes: Scene[];
  onClose: () => void;
  onSave: (html: string) => void;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  brief,
  concept,
  scenes,
  onClose,
  onSave
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'wysiwyg'>('wysiwyg');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [imageEditInstruction, setImageEditInstruction] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  // Gmail send/schedule state
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipients, setRecipients] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);

  // Check Gmail connection status and handle OAuth callback
  useEffect(() => {
    // Handle OAuth callback
    GmailService.handleOAuthCallback();
    
    // Check if Gmail is connected
    const connected = GmailService.isAuthenticated();
    setIsGmailConnected(connected);
    if (connected) {
      setGmailEmail(GmailService.getUserEmail());
    }
  }, []);

  // Set default subject from concept hook
  useEffect(() => {
    if (concept.hook && !emailSubject) {
      setEmailSubject(concept.hook);
    }
  }, [concept.hook, emailSubject]);

  // Calculate minimum datetime for scheduling (15 minutes from now)
  const minScheduleTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    return now.toISOString().slice(0, 16);
  }, []);

  const generateTemplate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const html = await GeminiService.generateEmailHTML(brief, concept, scenes);
      setHtmlContent(html);
    } catch (error) {
      console.error('Failed to generate email template:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [brief, concept, scenes]);

  useEffect(() => {
    generateTemplate();
  }, [generateTemplate]);

  const handleAIEdit = async () => {
    if (!editInstruction.trim() || !htmlContent) return;
    
    setIsEditing(true);
    try {
      const newHtml = await GeminiService.editEmailHTML(htmlContent, editInstruction, brief);
      setHtmlContent(newHtml);
      setEditInstruction('');
    } catch (error) {
      console.error('Failed to edit email template:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleImageEdit = async () => {
    if (!imageEditInstruction.trim() || !selectedImageSrc) return;
    
    setIsEditingImage(true);
    try {
      const newImageUrl = await GeminiService.editHeroImage(selectedImageSrc, imageEditInstruction);
      // Replace the old image URL with the new one in the HTML
      const newHtml = htmlContent.replace(selectedImageSrc, newImageUrl);
      setHtmlContent(newHtml);
      setSelectedImageSrc(newImageUrl);
      setImageEditInstruction('');
    } catch (error) {
      console.error('Failed to edit image:', error);
    } finally {
      setIsEditingImage(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(e.target.value);
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brief.brandName}-email-campaign.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyHTML = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
    } catch (error) {
      console.error('Failed to copy HTML:', error);
    }
  };

  const handleIframeClick = (e: React.MouseEvent) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;
    
    // Get clicked element info for potential editing
    const rect = iframe.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const element = iframe.contentDocument.elementFromPoint(x, y);
    if (element) {
      // Check if it's an image
      if (element.tagName === 'IMG') {
        const imgSrc = (element as HTMLImageElement).src;
        if (imgSrc && imgSrc.startsWith('data:')) {
          setSelectedImageSrc(imgSrc);
          setShowImageEditor(true);
        }
      }
      setSelectedElement(element.tagName);
    }
  };

  // Gmail handlers
  const handleConnectGmail = () => {
    GmailService.initiateOAuth();
  };

  const handleDisconnectGmail = () => {
    GmailService.disconnect();
    setIsGmailConnected(false);
    setGmailEmail(null);
  };

  const handleOpenSendModal = () => {
    setSendError(null);
    setSendSuccess(null);
    setShowSendModal(true);
  };

  const handleCloseSendModal = () => {
    setShowSendModal(false);
    setSendError(null);
    setSendSuccess(null);
  };

  const parseRecipients = (input: string): string[] => {
    return input
      .split(/[,;\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0 && email.includes('@'));
  };

  const handleSendEmail = async () => {
    setSendError(null);
    setSendSuccess(null);

    const recipientList = parseRecipients(recipients);
    if (recipientList.length === 0) {
      setSendError('Please enter at least one valid email address');
      return;
    }

    if (!emailSubject.trim()) {
      setSendError('Please enter a subject line');
      return;
    }

    if (!htmlContent) {
      setSendError('Email content is empty. Please generate a template first.');
      return;
    }

    if (sendMode === 'schedule' && !scheduledTime) {
      setSendError('Please select a scheduled time');
      return;
    }

    setIsSending(true);

    try {
      if (sendMode === 'now') {
        await GmailService.sendEmail({
          to: recipientList,
          subject: emailSubject,
          htmlContent,
        });
        setSendSuccess(`Email sent successfully to ${recipientList.length} recipient(s)!`);
      } else {
        const scheduledDate = new Date(scheduledTime);
        await GmailService.scheduleEmail({
          to: recipientList,
          subject: emailSubject,
          htmlContent,
          scheduledTime: scheduledDate,
        });
        setSendSuccess(`Email scheduled for ${scheduledDate.toLocaleString()} to ${recipientList.length} recipient(s)!`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      setSendError(err.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

    const quickEdits = useMemo(() => [
      { label: 'Change CTA color to brand color', instruction: 'Change the main CTA button color to match the brand primary color', category: 'style' },
      { label: 'Make header darker', instruction: 'Make the header background darker and more prominent', category: 'style' },
      { label: 'Increase font size', instruction: 'Increase the body text font size by 2px for better readability', category: 'style' },
      { label: 'Add more padding', instruction: 'Add more padding around all sections for a more spacious feel', category: 'layout' },
      { label: 'Make CTA larger', instruction: 'Make the CTA button larger and more prominent', category: 'style' },
      { label: 'Center all content', instruction: 'Center align all text content in the email', category: 'layout' },
    ], []);

    const sectionEdits = useMemo(() => [
      { label: 'Improve Hero Section', instruction: 'Make the hero section more impactful with a larger headline, better contrast, and a more prominent call-to-action button', category: 'hero' },
      { label: 'Enhance Body Layout', instruction: 'Improve the body section layout with better spacing, clearer hierarchy, and more readable text formatting', category: 'body' },
      { label: 'Redesign Infographic', instruction: 'Make the infographic section more visually appealing with better data visualization, icons, and color coding', category: 'infographic' },
      { label: 'Professional Footer', instruction: 'Update the footer with a cleaner design, proper social media icons, and well-organized contact information', category: 'footer' },
      { label: 'Add Social Links', instruction: 'Add social media icon links (Facebook, Twitter, Instagram, LinkedIn) to the footer section', category: 'footer' },
      { label: 'Mobile Optimization', instruction: 'Optimize the email layout for mobile devices with larger touch targets, stacked columns, and responsive images', category: 'layout' },
    ], []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition"
          >
            <i className="fa-solid fa-arrow-left text-lg"></i>
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">Email Template Editor</h2>
            <p className="text-xs text-white/50">{concept.title} - {brief.brandName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="flex bg-white/5 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('wysiwyg')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                          viewMode === 'wysiwyg' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <i className="fa-solid fa-pen-to-square mr-2"></i>WYSIWYG
                      </button>
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                          viewMode === 'preview' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <i className="fa-solid fa-eye mr-2"></i>Preview
                      </button>
                      <button
                        onClick={() => setViewMode('code')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                          viewMode === 'code' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <i className="fa-solid fa-code mr-2"></i>Code
                      </button>
                    </div>
          
          {/* Actions */}
          <button
            onClick={handleCopyHTML}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <i className="fa-solid fa-copy"></i>
            Copy HTML
          </button>
          <button
            onClick={handleDownloadHTML}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <i className="fa-solid fa-download"></i>
            Download
          </button>
          
          {/* Gmail Send Button */}
          {isGmailConnected ? (
            <button
              onClick={handleOpenSendModal}
              disabled={!htmlContent}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-brands fa-google"></i>
              Send via Gmail
            </button>
          ) : (
            <button
              onClick={handleConnectGmail}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <i className="fa-brands fa-google"></i>
              Connect Gmail
            </button>
          )}
          
          <button
            onClick={() => onSave(htmlContent)}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-lg text-sm font-bold transition hover:scale-105 flex items-center gap-2"
          >
            <i className="fa-solid fa-check"></i>
            Save & Close
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - AI Edit Controls */}
        <div className="w-80 border-r border-white/10 bg-zinc-900/50 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-yellow-400"></i>
              AI Edit Assistant
            </h3>
            <div className="space-y-3">
              <textarea
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                placeholder="Describe what you want to change... e.g., 'Make the header background navy blue' or 'Add a second CTA button'"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/30 resize-none h-24 focus:border-blue-500 outline-none transition"
              />
              <button
                onClick={handleAIEdit}
                disabled={isEditing || !editInstruction.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isEditing ? (
                  <>
                    <BananaPro role="writer" size="sm" />
                    <span>Editing...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-sparkles"></i>
                    <span>Apply AI Edit</span>
                  </>
                )}
              </button>
            </div>
          </div>

                    {/* Quick Edits */}
                    <div className="p-4 border-b border-white/10">
                      <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Quick Style Edits</h4>
                      <div className="space-y-2">
                        {quickEdits.map((edit, idx) => (
                          <button
                            key={idx}
                            onClick={() => setEditInstruction(edit.instruction)}
                            className="w-full text-left bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-2 rounded-lg text-xs transition"
                          >
                            {edit.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section-Specific Edits */}
                    <div className="p-4 border-b border-white/10">
                      <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Section Edits</h4>
                      <div className="space-y-2">
                        {sectionEdits.map((edit, idx) => (
                          <button
                            key={idx}
                            onClick={() => setEditInstruction(edit.instruction)}
                            className="w-full text-left bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-2 rounded-lg text-xs transition flex items-center gap-2"
                          >
                            <span className={`w-2 h-2 rounded-full ${
                              edit.category === 'hero' ? 'bg-yellow-400' :
                              edit.category === 'body' ? 'bg-blue-400' :
                              edit.category === 'infographic' ? 'bg-green-400' :
                              edit.category === 'footer' ? 'bg-purple-400' :
                              'bg-white/40'
                            }`}></span>
                            {edit.label}
                          </button>
                        ))}
                      </div>
                    </div>

          {/* Regenerate */}
          <div className="p-4 mt-auto border-t border-white/10">
            <button
              onClick={generateTemplate}
              disabled={isGenerating}
              className="w-full bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <BananaPro role="writer" size="sm" />
                  <span>Regenerating...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-rotate"></i>
                  <span>Regenerate Template</span>
                </>
              )}
            </button>
          </div>
        </div>

                {/* Center - Preview/Code/WYSIWYG */}
                <div className="flex-1 bg-zinc-800 overflow-hidden flex flex-col">
                  {isGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <BananaPro role="writer" size="lg" />
                      <p className="text-white/60 mt-4 text-sm">Generating your email template...</p>
                    </div>
                  ) : viewMode === 'wysiwyg' ? (
                    <div className="flex-1 overflow-auto p-4">
                      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">
                        <style>{`
                          .ql-toolbar.ql-snow {
                            border: none;
                            border-bottom: 1px solid #e5e7eb;
                            background: #f9fafb;
                          }
                          .ql-container.ql-snow {
                            border: none;
                            font-family: inherit;
                          }
                          .ql-editor {
                            min-height: 600px;
                            font-size: 14px;
                            line-height: 1.6;
                          }
                          .ql-editor img {
                            max-width: 100%;
                            height: auto;
                          }
                        `}</style>
                        <ReactQuill
                          theme="snow"
                          value={htmlContent}
                          onChange={setHtmlContent}
                          modules={{
                            toolbar: [
                              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ 'color': [] }, { 'background': [] }],
                              [{ 'align': [] }],
                              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                              ['link', 'image'],
                              ['blockquote', 'code-block'],
                              ['clean']
                            ]
                          }}
                          formats={[
                            'header',
                            'bold', 'italic', 'underline', 'strike',
                            'color', 'background',
                            'align',
                            'list', 'bullet',
                            'link', 'image',
                            'blockquote', 'code-block'
                          ]}
                          placeholder="Edit your email content here..."
                        />
                      </div>
                    </div>
                  ) : viewMode === 'preview' ? (
                    <div className="flex-1 overflow-auto p-4">
                      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">
                        <iframe
                          ref={iframeRef}
                          srcDoc={sanitizeHtml(htmlContent)}
                          className="w-full h-[800px] border-0"
                          title="Email Preview"
                          onClick={handleIframeClick}
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </div>
                  ): (
                    <div className="flex-1 overflow-hidden p-4">
                      <textarea
                        ref={codeEditorRef}
                        value={htmlContent}
                        onChange={handleCodeChange}
                        className="w-full h-full bg-zinc-900 text-green-400 font-mono text-sm p-4 rounded-lg border border-white/10 resize-none focus:border-blue-500 outline-none"
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>

        {/* Right Panel - Image Editor (conditional) */}
        {showImageEditor && selectedImageSrc && (
          <div className="w-80 border-l border-white/10 bg-zinc-900/50 flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-image text-blue-400"></i>
                AI Image Editor
              </h3>
              <button
                onClick={() => {
                  setShowImageEditor(false);
                  setSelectedImageSrc('');
                }}
                className="text-white/40 hover:text-white transition"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Image Preview */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <img
                  src={selectedImageSrc}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Edit Controls */}
              <div className="space-y-3">
                <textarea
                  value={imageEditInstruction}
                  onChange={(e) => setImageEditInstruction(e.target.value)}
                  placeholder="Describe how to edit this image... e.g., 'Make the background brighter' or 'Add a subtle glow effect'"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/30 resize-none h-20 focus:border-blue-500 outline-none transition"
                />
                <button
                  onClick={handleImageEdit}
                  disabled={isEditingImage || !imageEditInstruction.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isEditingImage ? (
                    <>
                      <BananaPro role="artist" size="sm" />
                      <span>Editing Image...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-magic"></i>
                      <span>Edit with AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Image Edits */}
              <div>
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Quick Image Edits</h4>
                <div className="space-y-1">
                  {[
                    'Make it brighter',
                    'Add warm tones',
                    'Increase contrast',
                    'Add subtle vignette',
                    'Make colors more vibrant'
                  ].map((edit, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImageEditInstruction(edit)}
                      className="w-full text-left bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded text-xs transition"
                    >
                      {edit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="p-3 border-t border-white/10 bg-zinc-900 flex items-center justify-between text-xs text-white/40">
        <div className="flex items-center gap-4">
          <span>
            <i className="fa-solid fa-code mr-1"></i>
            {htmlContent.length.toLocaleString()} characters
          </span>
          {selectedElement && (
            <span>
              <i className="fa-solid fa-mouse-pointer mr-1"></i>
              Selected: {selectedElement}
            </span>
          )}
          {isGmailConnected && gmailEmail && (
            <span className="flex items-center gap-1">
              <i className="fa-brands fa-google text-red-400"></i>
              <span className="text-white/60">{gmailEmail}</span>
              <button
                onClick={handleDisconnectGmail}
                className="text-white/40 hover:text-red-400 ml-1 transition"
                title="Disconnect Gmail"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400">
            <i className="fa-solid fa-circle text-[6px] mr-1"></i>
            Ready
          </span>
        </div>
      </div>

      {/* Gmail Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                  <i className="fa-brands fa-google text-white"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Send Email via Gmail</h3>
                  <p className="text-xs text-white/50">Sending as {gmailEmail}</p>
                </div>
              </div>
              <button
                onClick={handleCloseSendModal}
                className="text-white/40 hover:text-white transition"
              >
                <i className="fa-solid fa-times text-lg"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Success/Error Messages */}
              {sendSuccess && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
                  <i className="fa-solid fa-check-circle text-green-400"></i>
                  <span className="text-green-300 text-sm">{sendSuccess}</span>
                </div>
              )}
              {sendError && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                  <i className="fa-solid fa-exclamation-circle text-red-400"></i>
                  <span className="text-red-300 text-sm">{sendError}</span>
                </div>
              )}

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Recipients <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="Enter email addresses (comma, semicolon, or newline separated)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/30 resize-none h-20 focus:border-blue-500 outline-none transition"
                />
                <p className="text-xs text-white/40 mt-1">
                  {parseRecipients(recipients).length} valid recipient(s)
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject line"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/30 focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Send Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Send Options
                </label>
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setSendMode('now')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                      sendMode === 'now'
                        ? 'bg-blue-500 text-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-paper-plane mr-2"></i>
                    Send Now
                  </button>
                  <button
                    onClick={() => setSendMode('schedule')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                      sendMode === 'schedule'
                        ? 'bg-blue-500 text-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-clock mr-2"></i>
                    Schedule
                  </button>
                </div>
              </div>

              {/* Schedule Time Picker */}
              {sendMode === 'schedule' && (
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Scheduled Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={minScheduleTime}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none transition"
                  />
                  <p className="text-xs text-white/40 mt-1">
                    Must be at least 15 minutes in the future
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
              <button
                onClick={handleCloseSendModal}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isSending || !recipients.trim() || !emailSubject.trim() || (sendMode === 'schedule' && !scheduledTime)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <BananaPro role="writer" size="sm" />
                    <span>{sendMode === 'now' ? 'Sending...' : 'Scheduling...'}</span>
                  </>
                ) : (
                  <>
                    <i className={`fa-solid ${sendMode === 'now' ? 'fa-paper-plane' : 'fa-clock'}`}></i>
                    <span>{sendMode === 'now' ? 'Send Now' : 'Schedule Send'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateEditor;
