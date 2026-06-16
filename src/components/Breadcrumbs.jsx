import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({
  categories,
  activeCatId,
  activeSubCatId,
  activeSubSubCatId,
  onBreadcrumbClick
}) {
  const getCategoryName = (id) => {
    const cat = categories.find(c => c._id === id);
    return cat ? cat.name : '';
  };

  const catName = activeCatId ? getCategoryName(activeCatId) : null;
  const subCatName = activeSubCatId ? getCategoryName(activeSubCatId) : null;
  const subSubCatName = activeSubSubCatId ? getCategoryName(activeSubSubCatId) : null;

  return (
    <div className="flex items-center gap-2 mb-6 text-xs text-slate-500 font-medium">
      <button 
        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
        onClick={() => onBreadcrumbClick('all')}
      >
        <Home size={14} />
        <span>Home</span>
      </button>

      {catName && (
        <>
          <ChevronRight size={12} className="text-slate-400" />
          <button 
            className={`hover:text-slate-900 transition-colors ${!subCatName ? 'text-slate-800 font-semibold cursor-default' : ''}`}
            onClick={() => onBreadcrumbClick('cat', activeCatId)}
            disabled={!subCatName}
          >
            {catName}
          </button>
        </>
      )}

      {subCatName && (
        <>
          <ChevronRight size={12} className="text-slate-400" />
          <button 
            className={`hover:text-slate-900 transition-colors ${!subSubCatName ? 'text-slate-800 font-semibold cursor-default' : ''}`}
            onClick={() => onBreadcrumbClick('subcat', activeSubCatId)}
            disabled={!subSubCatName}
          >
            {subCatName}
          </button>
        </>
      )}

      {subSubCatName && (
        <>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-slate-800 font-semibold">
            {subSubCatName}
          </span>
        </>
      )}
    </div>
  );
}
