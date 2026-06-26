'use client';

import { useState, useEffect } from 'react';
import { Share2, MessageCircle, ExternalLink, AtSign, Link, Check } from 'lucide-react';

interface ShareButtonsProps {
  eventName: string;
  eventUrl?: string;
}

export default function ShareButtons({ eventName, eventUrl }: ShareButtonsProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(eventUrl || window.location.href);
  }, [eventUrl]);

  const shareUrl = currentUrl;
  const encodedText = encodeURIComponent(`${eventName} - Confira as fotos! ${shareUrl}`);
  const encodedEventName = encodeURIComponent(eventName);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowShareOptions(!showShareOptions)}
        className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/20"
      >
        <Share2 size={16} />
        <span>Compartilhar</span>
      </button>

      {showShareOptions && (
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-500 transition-colors hover:bg-green-500/30"
            title="WhatsApp"
          >
            <MessageCircle size={18} />
          </a>

          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-blue-500 transition-colors hover:bg-blue-600/30"
            title="Facebook"
          >
            <ExternalLink size={18} />
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodedEventName}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 text-sky-500 transition-colors hover:bg-sky-500/30"
            title="Twitter/X"
          >
            <AtSign size={18} />
          </a>

          <button
            onClick={handleCopy}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20"
            title="Copiar link"
          >
            {copied ? <Check size={18} className="text-green-400" /> : <Link size={18} />}
          </button>

          {copied && (
            <span className="text-sm text-green-400">Copiado!</span>
          )}
        </div>
      )}
    </div>
  );
}
