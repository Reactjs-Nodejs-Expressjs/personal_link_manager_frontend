import React, { useRef } from 'react';

export default function CategoryNav({
  categories,
  activeCatId,
  activeSubCatId,
  activeSubSubCatId,
  onSelectCategory,
  onSelectSubCategory,
  onSelectSubSubCategory
}) {
  // Filter categories by type and active status
  const mainCategories = categories.filter(c => c.type === 'category' && c.isActive);
  const subCategories = activeCatId 
    ? categories.filter(c => c.type === 'subcategory' && c.parentId === activeCatId && c.isActive)
    : [];
  const subSubCategories = activeSubCatId
    ? categories.filter(c => c.type === 'subsubcategory' && c.parentId === activeSubCatId && c.isActive)
    : [];

  // Refs for scroll rows
  const row1Ref = useRef(null);
  const row2Ref = useRef(null);
  const row3Ref = useRef(null);

  // Mouse drag-to-scroll utility function
  const setupDragScrollEvents = (ref) => {
    let isDown = false;
    let startX;
    let scrollLeft;

    return {
      onMouseDown: (e) => {
        isDown = true;
        ref.current.classList.add('grabbing');
        startX = e.pageX - ref.current.offsetLeft;
        scrollLeft = ref.current.scrollLeft;
      },
      onMouseLeave: () => {
        isDown = false;
        if (ref.current) ref.current.classList.remove('grabbing');
      },
      onMouseUp: () => {
        isDown = false;
        if (ref.current) ref.current.classList.remove('grabbing');
      },
      onMouseMove: (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX) * 1.5; // multiplier for scrolling speed
        ref.current.scrollLeft = scrollLeft - walk;
      }
    };
  };

  const row1Events = setupDragScrollEvents(row1Ref);
  const row2Events = setupDragScrollEvents(row2Ref);
  const row3Events = setupDragScrollEvents(row3Ref);

  return (
    <div className="category-nav-section glass" style={{ borderRadius: 'var(--radius-lg)' }}>
      {/* Level 1: Categories */}
      <div 
        className="category-row" 
        ref={row1Ref} 
        {...row1Events}
      >
        <span className="row-label">Categories</span>
        <button 
          className={`tab-l1 ${activeCatId === null ? 'active' : ''}`}
          onClick={() => onSelectCategory(null)}
        >
          All Categories
        </button>
        {mainCategories.map(cat => (
          <button
            key={cat._id}
            className={`tab-l1 ${activeCatId === cat._id ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat._id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Level 2: Subcategories (only if L1 category is selected and children exist) */}
      {activeCatId && subCategories.length > 0 && (
        <div 
          className="category-row" 
          ref={row2Ref} 
          {...row2Events}
          style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}
        >
          <span className="row-label">Sub-Category</span>
          <button 
            className={`tab-l2 ${activeSubCatId === null ? 'active' : ''}`}
            onClick={() => onSelectSubCategory(null)}
          >
            All Sub-Categories
          </button>
          {subCategories.map(sub => (
            <button
              key={sub._id}
              className={`tab-l2 ${activeSubCatId === sub._id ? 'active' : ''}`}
              onClick={() => onSelectSubCategory(sub._id)}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Level 3: Sub-subcategories (only if L2 subcategory is selected and children exist) */}
      {activeSubCatId && subSubCategories.length > 0 && (
        <div 
          className="category-row" 
          ref={row3Ref} 
          {...row3Events}
          style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}
        >
          <span className="row-label">Sub-Sub</span>
          <button 
            className={`tab-l3 ${activeSubSubCatId === null ? 'active' : ''}`}
            onClick={() => onSelectSubSubCategory(null)}
          >
            All Items
          </button>
          {subSubCategories.map(subSub => (
            <button
              key={subSub._id}
              className={`tab-l3 ${activeSubSubCatId === subSub._id ? 'active' : ''}`}
              onClick={() => onSelectSubSubCategory(subSub._id)}
            >
              {subSub.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
