import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import FloatingDock from '../components/FloatingDock';
import Breadcrumbs from '../components/Breadcrumbs';
import ToolCard from '../components/ToolCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { RotateCcw, Frown } from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination States
  const [activeCatId, setActiveCatId] = useState(null);
  const [activeSubCatId, setActiveSubCatId] = useState(null);
  const [activeSubSubCatId, setActiveSubSubCatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const [limit, setLimit] = useState(window.innerWidth < 640 ? 8 : 12);

  useEffect(() => {
    const handleResize = () => {
      setLimit(window.innerWidth < 640 ? 8 : 12);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Favorites State
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('toolcase_favorites') || '[]'));
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch all categories once
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch cards based on filters, search query, page
  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      let url = showFavoritesOnly 
        ? `/cards?limit=1000&showInactive=false` 
        : `/cards?page=${page}&limit=${limit}`;
      
      if (!showFavoritesOnly) {
        if (activeCatId) url += `&category=${activeCatId}`;
        if (activeSubCatId) url += `&subCategory=${activeSubCatId}`;
        if (activeSubSubCatId) url += `&subSubCategory=${activeSubSubCatId}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const res = await api.get(url);
      let cardsList = res.data.cards || [];
      if (showFavoritesOnly) {
        cardsList = cardsList.filter(c => favorites.includes(c._id));
      }
      setCards(cardsList);
      setTotalPages(showFavoritesOnly ? 1 : (res.data.totalPages || 1));
      setTotalCards(showFavoritesOnly ? cardsList.length : (res.data.total || 0));
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCatId, activeSubCatId, activeSubSubCatId, searchQuery, page, showFavoritesOnly, favorites, limit]);

  // On mount: fetch categories AND cards in parallel for fastest first load
  useEffect(() => {
    fetchCategories();

    const handleReset = () => {
      handleResetFilters();
    };
    window.addEventListener('resetHomeFilters', handleReset);
    return () => window.removeEventListener('resetHomeFilters', handleReset);
  }, [fetchCategories]);

  // Keep Render backend warm — ping every 13 minutes to prevent cold starts
  useEffect(() => {
    const keepAlive = setInterval(() => {
      api.get('/ping').catch(() => {}); // silent lightweight ping
    }, 13 * 60 * 1000); // 13 minutes
    return () => clearInterval(keepAlive);
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);


  // Category selection handlers
  const handleSelectCategory = (catId) => {
    setActiveCatId(catId);
    setActiveSubCatId(null);
    setActiveSubSubCatId(null);
    setShowFavoritesOnly(false);
    setPage(1);
  };

  const handleSelectSubCategory = (subCatId) => {
    setActiveSubCatId(subCatId);
    setActiveSubSubCatId(null);
    setShowFavoritesOnly(false);
    setPage(1);
  };

  const handleSelectSubSubCategory = (subSubCatId) => {
    setActiveSubSubCatId(subSubCatId);
    setShowFavoritesOnly(false);
    setPage(1);
  };

  // Breadcrumbs actions
  const handleBreadcrumbClick = (level, id) => {
    setShowFavoritesOnly(false);
    if (level === 'all') {
      setActiveCatId(null);
      setActiveSubCatId(null);
      setActiveSubSubCatId(null);
    } else if (level === 'cat') {
      setActiveCatId(id);
      setActiveSubCatId(null);
      setActiveSubSubCatId(null);
    } else if (level === 'subcat') {
      setActiveSubCatId(id);
      setActiveSubSubCatId(null);
    }
    setPage(1);
  };

  // Search input submissions
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setShowFavoritesOnly(false);
    setPage(1);
  };

  const handleResetFilters = () => {
    setActiveCatId(null);
    setActiveSubCatId(null);
    setActiveSubSubCatId(null);
    setSearchInput('');
    setSearchQuery('');
    setShowFavoritesOnly(false);
    setPage(1);
  };

  const handleToggleFavorite = (cardId) => {
    setFavorites(prev => {
      const updated = prev.includes(cardId) 
        ? prev.filter(id => id !== cardId) 
        : [...prev, cardId];
      localStorage.setItem('toolcase_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleFavoritesFilter = () => {
    setShowFavoritesOnly(prev => {
      const next = !prev;
      if (next) {
        setActiveCatId(null);
        setActiveSubCatId(null);
        setActiveSubSubCatId(null);
        setSearchInput('');
        setSearchQuery('');
      }
      return next;
    });
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 pb-32 max-w-7xl mx-auto w-full">
      {/* Control bar: breadcrumbs */}
      <div className="flex justify-between items-center gap-4 mb-2">
        <Breadcrumbs
          categories={categories}
          activeCatId={activeCatId}
          activeSubCatId={activeSubCatId}
          activeSubSubCatId={activeSubSubCatId}
          onBreadcrumbClick={handleBreadcrumbClick}
        />
      </div>

      {/* Cards list grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <SkeletonLoader count={limit} />
        </div>
      ) : cards.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cards.map((card, idx) => (
              <ToolCard 
                key={card._id} 
                card={card} 
                index={idx} 
                isFavorite={favorites.includes(card._id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-10">
              <button
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-xs font-medium text-slate-400">
                Page {page} of {totalPages} ({totalCards} tools)
              </span>
              <button
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-500 bg-white shadow-sm w-full">
          <Frown size={48} strokeWidth={1.5} className="text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2 font-display">
            {showFavoritesOnly ? 'No Favorite Tools Yet' : 'No Tools Found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
            {showFavoritesOnly 
              ? 'Click the heart icon on any tool card across categories to save them to your favorites list.'
              : 'No tools match your active category search and filters.'
            }
          </p>
          <button 
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-900 text-white rounded-lg hover:bg-white hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm font-medium text-xs cursor-pointer" 
            onClick={handleResetFilters}
          >
            <RotateCcw size={16} />
            <span>Reset Search & Filters</span>
          </button>
        </div>
      )}

      {/* Bottom Fixed Center Floating Dock */}
      <FloatingDock
        categories={categories}
        activeCatId={activeCatId}
        activeSubCatId={activeSubCatId}
        activeSubSubCatId={activeSubSubCatId}
        onSelectCategory={handleSelectCategory}
        onSelectSubCategory={handleSelectSubCategory}
        onSelectSubSubCategory={handleSelectSubSubCategory}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        onResetFilters={handleResetFilters}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesFilter={handleToggleFavoritesFilter}
        favoritesCount={favorites.length}
      />
    </div>
  );
}
