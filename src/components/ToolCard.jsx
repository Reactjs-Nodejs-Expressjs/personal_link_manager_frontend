import React, { useState } from 'react';
import { Star, StarHalf, ExternalLink, Copy, Check, Heart } from 'lucide-react';

export default function ToolCard({ card, index, isFavorite, onToggleFavorite }) {
  const [copied, setCopied] = useState(false);

  const getDisplayUrl = (url) => {
    if (!url) return '';
    return url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
  };

  const renderStars = (avg) => {
    const stars = [];
    const fullStars = Math.floor(avg);
    const hasHalf = avg % 1 >= 0.3 && avg % 1 <= 0.8;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={13} className="fill-amber-400 text-amber-400" />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<StarHalf key={i} size={13} className="fill-amber-400 text-amber-400" />);
      } else {
        stars.push(<Star key={i} size={13} className="text-slate-200" />);
      }
    }
    return stars;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(card.websiteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col bg-white border border-slate-100 hover:border-brand-orange/30 rounded-3xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_12px_30px_-4px_rgba(249,115,22,0.08)] transition-all duration-300 hover:-translate-y-1.5 h-full relative group">
      {/* Favorite Heart Toggle - Floating Top Right */}
      <button 
        onClick={() => onToggleFavorite(card._id)}
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border border-slate-100/50"
        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      >
        <Heart size={15} className={isFavorite ? "fill-red-500 text-red-500" : "text-slate-400 hover:text-red-500"} />
      </button>

      {/* Scrollable sandboxed iframe preview container */}
      <div className="card-iframe-container">
        <div className="iframe-scroll-overlay"></div>
        <iframe
          src={card.websiteIframe || card.websiteUrl}
          title={card.title}
          sandbox="allow-scripts allow-same-origin allow-popups"
          loading="lazy"
        ></iframe>
        <span className="iframe-scroll-hint">Scroll inside to view site</span>
      </div>

      {/* Card Details Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2.5">
          <h4 className="text-sm font-bold font-display text-slate-800 leading-snug">{card.title}</h4>
        </div>

        <p className="text-[11px] text-slate-500 mb-3 leading-relaxed flex-1 line-clamp-2">{card.description}</p>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-4">
          <div className="flex gap-0.5">
            {renderStars(card.rating.average)}
          </div>
          <span className="font-medium text-slate-400">
            {card.rating.average.toFixed(1)} ({card.rating.count} {card.rating.count === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {/* Card Call to Actions */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <a
            href={card.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold text-[11px] rounded-xl shadow-sm hover:shadow-md transition-all duration-150 w-full whitespace-nowrap"
          >
            <ExternalLink size={13} className="shrink-0" />
            <span>Open Website</span>
          </a>
          <button
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 font-semibold text-[11px] rounded-xl shadow-sm hover:shadow-md transition-all duration-150 w-full text-white whitespace-nowrap ${
              copied 
                ? 'bg-emerald-500 hover:bg-emerald-600' 
                : 'bg-brand-violet hover:bg-brand-violet-hover'
            }`}
            onClick={handleCopy}
          >
            {copied ? <Check size={13} className="shrink-0" /> : <Copy size={13} className="shrink-0" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
