"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

interface Citation {
  id: string;
  page: number;
  content: string;
  similarity: number;
}

interface CitationPopup {
  citation: Citation;
  x: number;
  y: number;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [citationPopup, setCitationPopup] = useState<CitationPopup | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize audio context for sound effects
  useEffect(() => {
    const AnyWindow = window as unknown as { webkitAudioContext?: typeof AudioContext };
    audioContextRef.current = new (window.AudioContext || AnyWindow.webkitAudioContext!)();
  }, []);

  const playSound = (frequency: number, duration: number) => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  };

  const playLoadingSound = () => {
    playSound(800, 0.1);
  };

  const playResponseSound = () => {
    playSound(1000, 0.2);
  };

  interface ApiSource {
    id?: string;
    page?: number;
    content?: string;
    similarity?: number;
  }

  const parseCitations = (content: string, sources: ApiSource[] = []): { text: string; citations: Citation[] } => {
    const citationRegex = /\[(\d+)\]/g;
    const citations: Citation[] = [];
    const text = content;
    
    // Match citations with actual sources from the API
    const matches = content.match(citationRegex);
    if (matches && sources.length > 0) {
      const uniqueCitations = [...new Set(matches.map(match => parseInt(match.replace(/[\[\]]/g, ''))))];
      
      uniqueCitations.forEach(citationNumber => {
        const sourceIndex = citationNumber - 1;
        if (sources[sourceIndex]) {
          citations.push({
            id: sources[sourceIndex].id ?? `citation-${sourceIndex}`,
            page: typeof sources[sourceIndex].page === 'number' ? sources[sourceIndex].page : sourceIndex + 1,
            content: sources[sourceIndex].content ?? '',
            similarity: typeof sources[sourceIndex].similarity === 'number' ? sources[sourceIndex].similarity : 0
          });
        }
      });
    }
    
    return { text, citations };
  };

  const handleCitationClick = (citation: Citation, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setCitationPopup({
      citation,
      x: rect.left,
      y: rect.top - 10
    });
  };

  const closeCitationPopup = () => {
    setCitationPopup(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    playLoadingSound();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();
      const { text, citations } = parseCitations(data.answer, data.sources);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: text,
        citations
      };

      setMessages(prev => [...prev, assistantMessage]);
      playResponseSound();
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-foreground">Nutrition Assistant</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask questions about human nutrition
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
                <svg className="w-8 h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-foreground mb-2">Welcome to Nutrition Assistant</h2>
              <p className="text-muted-foreground">Ask me anything about human nutrition and I&apos;ll help you find the answers.</p>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground border border-border"
                }`}>
                  <div className="prose prose-sm max-w-none">
                    {message.content.split(/(\[\d+\])/).map((part, i) => {
                      const citationMatch = part.match(/\[(\d+)\]/);
                      if (citationMatch && message.citations) {
                        const citationIndex = parseInt(citationMatch[1]) - 1;
                        const citation = message.citations[citationIndex];
                        if (citation) {
                          return (
                            <button
                              key={i}
                              onClick={(e) => handleCitationClick(citation, e)}
                              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                            >
                              [{citationMatch[1]}]
                            </button>
                          );
                        }
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="rounded-2xl px-4 py-3 bg-secondary text-secondary-foreground border border-border">
                  <div className="flex items-center space-x-2">
                    <div className="loading-dots text-muted-foreground"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border pt-4 mt-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about nutrition..."
                disabled={isLoading}
                className="w-full px-4 py-3 pr-12 bg-input border border-border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                rows={1}
                style={{
                  minHeight: '52px',
                  maxHeight: '120px',
                  height: 'auto'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Citation Popup */}
      {citationPopup && (
        <div
          className="citation-popup"
          style={{
            left: `${citationPopup.x}px`,
            top: `${citationPopup.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Page {citationPopup.citation.page}
            </span>
            <button
              onClick={closeCitationPopup}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
        </button>
      </div>
          <div className="text-sm text-foreground">
            <span className="citation-highlight">
              {citationPopup.citation.content.slice(0, 200)}
              {citationPopup.citation.content.length > 200 && "..."}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Similarity: {(citationPopup.citation.similarity * 100).toFixed(1)}%
          </div>
        </div>
      )}

      {/* Click outside to close popup */}
      {citationPopup && (
        <div
          className="fixed inset-0 z-50"
          onClick={closeCitationPopup}
        />
      )}
    </div>
  );
}