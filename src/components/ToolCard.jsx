import React, { useState } from 'react';
import { Star, StarHalf, ExternalLink, Copy, Check, Heart, Play, X, Globe, Maximize2 } from 'lucide-react';

export default function ToolCard({ card, index, isFavorite, onToggleFavorite }) {
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const displayDomain = getDisplayUrl(card.websiteUrl);

  return (
    <>
      {/* ── Card ── */}
      <div className="flex flex-col bg-white border border-slate-100 hover:border-brand-orange/30 rounded-3xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_12px_30px_-4px_rgba(249,115,22,0.08)] transition-all duration-300 hover:-translate-y-1.5 h-full relative group">

        {/* Favorite Heart Toggle */}
        <button
          onClick={() => onToggleFavorite(card._id)}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border border-slate-100/50"
          title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <Heart size={15} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-500'} />
        </button>

        {/* ── Static Preview Thumbnail (replaces always-on iframe) ── */}
        <div
          className="card-preview-thumb group/thumb cursor-pointer"
          onClick={() => setPreviewOpen(true)}
          title="Click to preview"
        >
          {/* Gradient background with domain initial */}
          <div className="card-preview-bg">
            <div className="card-preview-icon">
              <Globe size={32} className="text-white/60 mb-2" />
              <span className="text-white/80 font-bold text-xs tracking-wide truncate max-w-[140px] text-center">{displayDomain}</span>
            </div>
          </div>

          {/* Hover play overlay */}
          <div className="card-preview-hover-overlay">
            <div className="card-preview-play-btn">
              <Play size={18} className="fill-white text-white ml-0.5" />
            </div>
            <span className="text-white text-xs font-semibold mt-2 drop-shadow">Preview Site</span>
          </div>
        </div>

        {/* ── Card Details Body ── */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2.5">
            <h4 className="text-sm font-bold font-display text-slate-800 leading-snug pr-2">{card.title}</h4>
          </div>

          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed flex-1 line-clamp-2">{card.description}</p>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-4">
            <div className="flex gap-0.5">{renderStars(card.rating.average)}</div>
            <span className="font-medium text-slate-400">
              {card.rating.average.toFixed(1)} ({card.rating.count} {card.rating.count === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          {/* Call to Actions */}
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
                copied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-brand-violet hover:bg-brand-violet-hover'
              }`}
              onClick={handleCopy}
            >
              {copied ? <Check size={13} className="shrink-0" /> : <Copy size={13} className="shrink-0" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Preview Modal ── */}
      {previewOpen && (
        <div
          className="site-preview-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewOpen(false); }}
        >
          <div className="site-preview-modal">
            {/* Modal Header */}
            <div className="site-preview-modal-header">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Globe size={15} className="text-white/80" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm font-display truncate">{card.title}</p>
                  <p className="text-white/50 text-[10px] truncate">{displayDomain}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={card.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange hover:bg-brand-orange-hover text-white text-[11px] font-semibold rounded-lg transition-colors"
                >
                  <Maximize2 size={12} />
                  <span>Open</span>
                </a>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            </div>

            {/* Browser Chrome bar */}
            <div className="site-preview-browser-bar">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400/80"></span>
              </div>
              <div className="site-preview-address-bar">
                <Globe size={11} className="text-slate-400 shrink-0" />
                <span className="truncate text-slate-500">{card.websiteUrl}</span>
              </div>
            </div>

            {/* iframe */}
            <div className="site-preview-iframe-wrap">
              <iframe
                src={card.websiteIframe || card.websiteUrl}
                title={card.title}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                loading="lazy"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
