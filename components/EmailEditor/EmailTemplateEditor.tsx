import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AdBrief, AdConcept, Scene } from '../../types';
import { GeminiService } from '../../services/geminiService';
import BananaPro from '../shared/BananaPro';

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
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [imageEditInstruction, setImageEditInstruction] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

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

  const quickEdits = [
    { label: 'Change CTA color to brand color', instruction: 'Change the main CTA button color to match the brand primary color' },
    { label: 'Make header darker', instruction: 'Make the header background darker and more prominent' },
    { label: 'Increase font size', instruction: 'Increase the body text font size by 2px for better readability' },
    { label: 'Add more padding', instruction: 'Add more padding around all sections for a more spacious feel' },
    { label: 'Make CTA larger', instruction: 'Make the CTA button larger and more prominent' },
    { label: 'Center all content', instruction: 'Center align all text content in the email' },
  ];

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
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Quick Edits</h4>
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

        {/* Center - Preview/Code */}
        <div className="flex-1 bg-zinc-800 overflow-hidden flex flex-col">
          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <BananaPro role="writer" size="lg" />
              <p className="text-white/60 mt-4 text-sm">Generating your email template...</p>
            </div>
          ) : viewMode === 'preview' ? (
            <div className="flex-1 overflow-auto p-4">
              <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  className="w-full h-[800px] border-0"
                  title="Email Preview"
                  onClick={handleIframeClick}
                />
              </div>
            </div>
          ) : (
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
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400">
            <i className="fa-solid fa-circle text-[6px] mr-1"></i>
            Ready
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;
