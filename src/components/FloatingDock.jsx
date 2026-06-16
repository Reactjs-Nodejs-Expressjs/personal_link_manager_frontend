import React, { useState, useRef, useEffect } from 'react';
import { Search, FolderTree, ChevronRight, ArrowLeft, RotateCcw, X, Heart } from 'lucide-react';

export default function FloatingDock({
  categories,
  activeCatId,
  activeSubCatId,
  activeSubSubCatId,
  onSelectCategory,
  onSelectSubCategory,
  onSelectSubSubCategory,
  searchInput,
  setSearchInput,
  onSearchSubmit,
  onResetFilters,
  showFavoritesOnly,
  onToggleFavoritesFilter,
  favoritesCount
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState('categories'); // categories, subcategories, subsubcategories
  const [selectedParentCat, setSelectedParentCat] = useState(null);
  const [selectedParentSub, setSelectedParentSub] = useState(null);
  
  const dockRef = useRef(null);

  // Close dock menu if clicked outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Update navigation level when active filters are updated elsewhere (like breadcrumbs)
  useEffect(() => {
    if (!activeCatId) {
      setCurrentLevel('categories');
      setSelectedParentCat(null);
      setSelectedParentSub(null);
    } else if (activeCatId && !activeSubCatId) {
      setCurrentLevel('subcategories');
      const cat = categories.find(c => c._id === activeCatId);
      setSelectedParentCat(cat);
      setSelectedParentSub(null);
    } else if (activeSubCatId) {
      setCurrentLevel('subsubcategories');
      const sub = categories.find(c => c._id === activeSubCatId);
      setSelectedParentSub(sub);
    }
  }, [activeCatId, activeSubCatId, activeSubSubCatId, categories]);

  const handleSelectRoot = (cat) => {
    onSelectCategory(cat._id);
    setSelectedParentCat(cat);
    setCurrentLevel('subcategories');
  };

  const handleSelectSub = (sub) => {
    onSelectSubCategory(sub._id);
    setSelectedParentSub(sub);
    setCurrentLevel('subsubcategories');
  };

  const handleSelectSubSub = (subsub) => {
    onSelectSubSubCategory(subsub._id);
    setMenuOpen(false); // Close menu on final select
  };

  const handleBack = () => {
    if (currentLevel === 'subsubcategories') {
      onSelectSubCategory(null);
      setCurrentLevel('subcategories');
      setSelectedParentSub(null);
    } else if (currentLevel === 'subcategories') {
      onSelectCategory(null);
      setCurrentLevel('categories');
      setSelectedParentCat(null);
    }
  };

  const getActiveSelectionName = () => {
    if (activeSubSubCatId) {
      const cat = categories.find(c => c._id === activeSubSubCatId);
      return cat ? cat.name : 'Category';
    }
    if (activeSubCatId) {
      const cat = categories.find(c => c._id === activeSubCatId);
      return cat ? cat.name : 'Category';
    }
    if (activeCatId) {
      const cat = categories.find(c => c._id === activeCatId);
      return cat ? cat.name : 'Category';
    }
    return 'Browse Categories';
  };

  // Filter listings based on current browser level
  const rootCats = categories.filter(c => c.type === 'category' && c.isActive);
  const subCats = selectedParentCat
    ? categories.filter(c => c.type === 'subcategory' && c.parentId === selectedParentCat._id && c.isActive)
    : [];
  const subSubCats = selectedParentSub
    ? categories.filter(c => c.type === 'subsubcategory' && c.parentId === selectedParentSub._id && c.isActive)
    : [];

  const isFiltered = activeCatId || searchInput || showFavoritesOnly;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-[90%] flex flex-col items-center" ref={dockRef}>
      {/* Upward Category Browser Popover */}
      {menuOpen && (
        <div className="dock-popover absolute bottom-full left-0 w-[320px] mb-3 rounded-2xl shadow-2xl overflow-hidden z-[101] flex flex-col border border-slate-100 bg-white/95 backdrop-blur-xl transition-all duration-300">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50 gap-2">
            {currentLevel !== 'categories' && (
              <button 
                className="flex items-center gap-1 text-[11px] font-semibold text-[#f97316] px-2 py-1 rounded bg-[#f97316]/10 hover:bg-[#f97316]/20 transition-all cursor-pointer" 
                onClick={handleBack}
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            )}
            <span className="text-xs font-bold text-slate-800 text-center flex-1 truncate font-display">
              {currentLevel === 'categories' && 'Categories'}
              {currentLevel === 'subcategories' && selectedParentCat?.name}
              {currentLevel === 'subsubcategories' && selectedParentSub?.name}
            </span>
            <button 
              className="flex items-center justify-center p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" 
              onClick={() => setMenuOpen(false)}
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-[280px] overflow-y-auto p-2 flex flex-col gap-0.5">
            {/* LEVEL 1 list */}
            {currentLevel === 'categories' && (
              <>
                <button 
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                    activeCatId === null ? 'bg-[#f97316]/10 text-[#f97316] font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => { onSelectCategory(null); setMenuOpen(false); }}
                >
                  <span>All Categories</span>
                </button>
                {rootCats.map(cat => (
                  <button 
                    key={cat._id}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium text-left text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => handleSelectRoot(cat)}
                  >
                    <span>{cat.name}</span>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </>
            )}

            {/* LEVEL 2 list */}
            {currentLevel === 'subcategories' && (
              <>
                <button 
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                    activeSubCatId === null ? 'bg-[#f97316]/10 text-[#f97316] font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => { onSelectSubCategory(null); setMenuOpen(false); }}
                >
                  <span>All in {selectedParentCat?.name}</span>
                </button>
                {subCats.map(sub => (
                  <button 
                    key={sub._id}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium text-left text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => handleSelectSub(sub)}
                  >
                    <span>{sub.name}</span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                ))}
                {subCats.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">No subcategories configured.</div>
                )}
              </>
            )}

            {/* LEVEL 3 list */}
            {currentLevel === 'subsubcategories' && (
              <>
                <button 
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                    activeSubSubCatId === null ? 'bg-[#f97316]/10 text-[#f97316] font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  onClick={() => { onSelectSubSubCategory(null); setMenuOpen(false); }}
                >
                  <span>All in {selectedParentSub?.name}</span>
                </button>
                {subSubCats.map(subsub => (
                  <button 
                    key={subsub._id}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                      activeSubSubCatId === subsub._id 
                        ? 'bg-[#f97316]/10 text-[#f97316] font-semibold' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    onClick={() => handleSelectSubSub(subsub)}
                  >
                    <span>{subsub.name}</span>
                  </button>
                ))}
                {subSubCats.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">No items configured.</div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Dock Bar */}
      <div className="flex items-center gap-2 bg-white/85 border border-slate-100 rounded-full px-4 py-2 shadow-xl backdrop-blur-md transition-all duration-300">
        {/* Category Selector Tab */}
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-150 whitespace-nowrap text-sm font-medium cursor-pointer ${
            menuOpen || activeCatId 
              ? 'text-[#f97316] bg-[#f97316]/10 font-bold' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
          }`} 
          onClick={() => setMenuOpen(!menuOpen)}
          title="Browse Categories"
        >
          <FolderTree size={18} />
          <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap hidden sm:inline">{getActiveSelectionName()}</span>
        </button>

        <div className="w-px h-6 bg-slate-200/80 shrink-0"></div>

        {/* Favorites Switch Button */}
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-150 whitespace-nowrap text-sm font-medium cursor-pointer ${
            showFavoritesOnly 
              ? 'text-red-500 bg-red-50 font-bold' 
              : 'text-slate-500 hover:text-red-500 hover:bg-red-50/50'
          }`} 
          onClick={onToggleFavoritesFilter}
          title="Show Favorites Only"
        >
          <div className="relative">
            <Heart size={18} className={showFavoritesOnly ? "fill-red-500 text-red-500 animate-pulse" : ""} />
            {favoritesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[7px] font-bold text-white shadow-sm ring-1 ring-white animate-bounce">
                {favoritesCount}
              </span>
            )}
          </div>
          <span className="hidden sm:inline">Favorites</span>
        </button>

        <div className="w-px h-6 bg-slate-200/80 shrink-0"></div>

        {/* Search Field Pill */}
        <form onSubmit={onSearchSubmit} className="flex items-center gap-2 bg-slate-100/60 border border-slate-200/40 rounded-full px-3 py-1 transition-all duration-150 focus-within:bg-white focus-within:border-[#f97316] focus-within:ring-2 focus-within:ring-[#f97316]/20">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search tools..."
            className="border-none bg-transparent py-1 text-xs text-slate-800 outline-none w-[100px] sm:w-[160px] sm:focus:w-[200px] transition-all duration-300"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        {/* Reset Filter Button */}
        {isFiltered && (
          <>
            <div className="w-px h-6 bg-slate-200/80 shrink-0"></div>
            <button 
              className="flex items-center justify-center p-2 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-150 cursor-pointer" 
              onClick={onResetFilters} 
              title="Reset Search & Filters"
            >
              <RotateCcw size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
