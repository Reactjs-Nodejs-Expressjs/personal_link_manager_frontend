import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  LayoutDashboard, Plus, Edit, Trash2, Search, FolderTree, Database, 
  Upload, Download, AlertTriangle, X, Check, Star, CheckCircle, 
  ExternalLink, Eye, EyeOff, BarChart2, Hash
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, cards, categories, backup
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({ success: '', error: '' });

  // Filters for Admin Table
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterSub, setFilterSub] = useState('');
  const [filterSubSub, setFilterSubSub] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [sortField, setSortField] = useState('title'); // title, price, rating
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Modals & Forms States
  const [cardModal, setCardModal] = useState({ open: false, mode: 'create', data: null });
  const [catModal, setCatModal] = useState({ open: false, parentNode: null });
  
  // Card Form State
  const [cardForm, setCardForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    subCategoryId: '',
    subSubCategoryId: '',
    websiteUrl: '',
    websiteIframe: '',
    price: '',
    currency: 'USD',
    ratingAvg: '0',
    ratingCount: '0',
    isActive: true
  });

  // Category Form State
  const [catForm, setCatForm] = useState({
    name: '',
    type: 'category', // category, subcategory, subsubcategory
    parentId: ''
  });

  // Backup JSON Input State
  const [importJson, setImportJson] = useState('');

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const catRes = await api.get('/categories');
      setCategories(catRes.data.categories || []);

      const cardRes = await api.get('/cards?limit=100000&showInactive=true');
      setCards(cardRes.data.cards || []);
    } catch (err) {
      triggerAlert('error', 'Error loading database files.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerAlert = (type, message) => {
    setAlerts(prev => ({ ...prev, [type]: message }));
    setTimeout(() => {
      setAlerts(prev => ({ ...prev, [type]: '' }));
    }, 4000);
  };

  // Metrics calculation
  const metrics = {
    totalCards: cards.length,
    activeCards: cards.filter(c => c.isActive).length,
    totalCategories: categories.length,
    avgRating: cards.length > 0 
      ? (cards.reduce((sum, c) => sum + (c.rating?.average || 0), 0) / cards.length).toFixed(1) 
      : '0.0'
  };

  // Card Form Category Cascading logic
  const handleCardFormCatChange = (e) => {
    const catId = e.target.value;
    setCardForm(prev => ({
      ...prev,
      categoryId: catId,
      subCategoryId: '',
      subSubCategoryId: ''
    }));
  };

  const handleCardFormSubChange = (e) => {
    const subId = e.target.value;
    setCardForm(prev => ({
      ...prev,
      subCategoryId: subId,
      subSubCategoryId: ''
    }));
  };

  // Open Card Modal
  const openCardEditModal = (mode, card = null) => {
    if (mode === 'create') {
      setCardForm({
        title: '',
        description: '',
        categoryId: '',
        subCategoryId: '',
        subSubCategoryId: '',
        websiteUrl: '',
        websiteIframe: '',
        price: '',
        currency: 'USD',
        ratingAvg: '4.5',
        ratingCount: '1',
        isActive: true
      });
    } else {
      setCardForm({
        title: card.title,
        description: card.description,
        categoryId: card.categoryId,
        subCategoryId: card.subCategoryId,
        subSubCategoryId: card.subSubCategoryId,
        websiteUrl: card.websiteUrl,
        websiteIframe: card.websiteIframe || card.websiteUrl,
        price: card.price !== null && card.price !== undefined ? card.price : '',
        currency: card.currency || 'USD',
        ratingAvg: card.rating?.average?.toString() || '0',
        ratingCount: card.rating?.count?.toString() || '0',
        isActive: card.isActive
      });
    }
    setCardModal({ open: true, mode, data: card });
  };

  // Save Card Handler
  const handleSaveCard = async (e) => {
    e.preventDefault();
    const { 
      title, description, categoryId, subCategoryId, subSubCategoryId, 
      websiteUrl, websiteIframe, price, currency, ratingAvg, ratingCount, isActive 
    } = cardForm;

    if (!title || !description || !categoryId || !websiteUrl) {
      triggerAlert('error', 'Please complete all required fields.');
      return;
    }

    const payload = {
      title,
      description,
      categoryId,
      subCategoryId,
      subSubCategoryId,
      websiteUrl,
      websiteIframe: websiteIframe || websiteUrl,
      price: price === '' ? null : Number(price),
      currency,
      rating: {
        average: Number(ratingAvg) || 0,
        count: Number(ratingCount) || 0
      },
      isActive
    };

    try {
      if (cardModal.mode === 'create') {
        await api.post('/cards', payload);
        triggerAlert('success', 'New card created successfully.');
      } else {
        await api.put(`/cards/${cardModal.data._id}`, payload);
        triggerAlert('success', 'Card details updated successfully.');
      }
      setCardModal({ open: false, mode: 'create', data: null });
      loadData();
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Error saving tool card.');
    }
  };

  // Delete Card Handler
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this tool card?')) return;
    try {
      await api.delete(`/cards/${cardId}`);
      triggerAlert('success', 'Card deleted successfully.');
      loadData();
    } catch (err) {
      triggerAlert('error', 'Error deleting card.');
    }
  };

  // Add Category Handler
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name) return;

    try {
      await api.post('/categories', {
        name: catForm.name,
        type: catForm.type,
        parentId: catForm.parentId || null
      });
      triggerAlert('success', `Created ${catForm.type} "${catForm.name}" successfully.`);
      setCatModal({ open: false, parentNode: null });
      setCatForm({ name: '', type: 'category', parentId: '' });
      loadData();
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Error creating category node.');
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (catId) => {
    const warningText = 'WARNING: Deleting a category will recursively delete ALL of its child subcategories and sub-subcategories! Cards belonging to these categories will remain but their category reference will need updating.\n\nAre you sure you want to proceed?';
    if (!window.confirm(warningText)) return;

    try {
      await api.delete(`/categories/${catId}`);
      triggerAlert('success', 'Category tree node deleted successfully.');
      loadData();
    } catch (err) {
      triggerAlert('error', 'Error deleting category node.');
    }
  };

  // Bulk Operations
  const handleExportData = async () => {
    try {
      const res = await api.post('/cards/bulk', { action: 'export' });
      const cardsData = res.data.cards || [];
      
      const blob = new Blob([JSON.stringify(cardsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `toolcase_cards_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerAlert('success', 'Card database backup downloaded.');
    } catch (err) {
      triggerAlert('error', 'Export operation failed.');
    }
  };

  const handleImportData = async (e) => {
    e.preventDefault();
    if (!importJson.trim()) return;

    try {
      const parsed = JSON.parse(importJson);
      const res = await api.post('/cards/bulk', {
        action: 'import',
        cards: parsed
      });
      triggerAlert('success', `Import report: ${res.data.importedCount} successfully imported. ${res.data.errorsCount} errors.`);
      setImportJson('');
      loadData();
    } catch (err) {
      triggerAlert('error', 'JSON format invalid or import failed: ' + err.message);
    }
  };

  // Category Tree UI Renderer (Tailwind CSS recursive builder)
  const renderCategoryTreeNode = (node, depth = 0) => {
    const children = categories.filter(c => c.parentId === node._id);
    
    // Type visual badge styles mapping
    const badgeColors = node.type === 'category' 
      ? 'bg-blue-50 text-blue-600 border border-blue-100'
      : node.type === 'subcategory'
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        : 'bg-purple-50 text-purple-600 border border-purple-100';

    return (
      <div key={node._id} className="ml-4 border-l border-slate-200/60 pl-4 mt-2 flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${badgeColors}`}>{node.type}</span>
            <span className="font-semibold text-slate-700">{node.name}</span>
          </div>
          <div className="flex gap-1.5">
            {node.type !== 'subsubcategory' && (
              <button 
                className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title={`Add Child to ${node.name}`}
                onClick={() => {
                  const childType = node.type === 'category' ? 'subcategory' : 'subsubcategory';
                  setCatForm({
                    name: '',
                    type: childType,
                    parentId: node._id
                  });
                  setCatModal({ open: true, parentNode: node });
                }}
              >
                <Plus size={14} />
              </button>
            )}
            <button 
              className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
              title="Delete node & children"
              onClick={() => handleDeleteCategory(node._id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {children.map(child => renderCategoryTreeNode(child, depth + 1))}
      </div>
    );
  };

  // Filter Cards list for Admin View
  const filteredCards = cards.filter(card => {
    if (searchQuery && !new RegExp(searchQuery, 'i').test(card.title) && !new RegExp(searchQuery, 'i').test(card.description)) return false;
    if (filterCat && card.categoryId !== filterCat) return false;
    if (filterSub && card.subCategoryId !== filterSub) return false;
    if (filterSubSub && card.subSubCategoryId !== filterSubSub) return false;
    if (filterStatus === 'active' && !card.isActive) return false;
    if (filterStatus === 'inactive' && card.isActive) return false;
    return true;
  }).sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'rating') {
      aVal = a.rating?.average || 0;
      bVal = b.rating?.average || 0;
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    } else {
      return sortOrder === 'asc' 
        ? (aVal || 0) - (bVal || 0)
        : (bVal || 0) - (aVal || 0);
    }
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="pb-5 border-b border-slate-100 flex flex-col gap-1 text-left">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight font-display">🔧 System Admin Panel</h2>
        <p className="text-xs text-slate-400 leading-relaxed">Configure hierarchical layouts, tool websites, ratings, and system backups.</p>
      </div>

      {/* Overview Metric Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <Hash size={20} />
          </div>
          <div className="text-left">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Tool Cases</h3>
            <div className="text-xl font-extrabold text-slate-800 tracking-tight font-display">{metrics.totalCards}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div className="text-left">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Active Cases</h3>
            <div className="text-xl font-extrabold text-slate-800 tracking-tight font-display">{metrics.activeCards}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <FolderTree size={20} />
          </div>
          <div className="text-left">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Categories Total</h3>
            <div className="text-xl font-extrabold text-slate-800 tracking-tight font-display">{metrics.totalCategories}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50/70 text-amber-500 flex items-center justify-center shrink-0">
            <Star size={20} fill="currentColor" />
          </div>
          <div className="text-left">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Average Rating</h3>
            <div className="text-xl font-extrabold text-slate-800 tracking-tight font-display">{metrics.avgRating}⭐</div>
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      {alerts.success && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-600">
          <Check size={16} />
          <span>{alerts.success}</span>
        </div>
      )}
      {alerts.error && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">
          <AlertTriangle size={16} />
          <span>{alerts.error}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-[240px] shrink-0 text-left">
          <div className="bg-white border border-slate-100 rounded-3xl p-3 shadow-sm flex flex-col gap-1">
            <ul className="flex flex-col gap-1">
              <li className={`rounded-xl overflow-hidden ${activeTab === 'overview' ? 'bg-[#f97316]/10 text-[#f97316] font-bold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                <button className="flex items-center gap-2.5 w-full px-4 py-3 text-xs font-bold text-left cursor-pointer" onClick={() => setActiveTab('overview')}>
                  <LayoutDashboard size={16} />
                  <span>Welcome Summary</span>
                </button>
              </li>
              <li className={`rounded-xl overflow-hidden ${activeTab === 'cards' ? 'bg-[#f97316]/10 text-[#f97316] font-bold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                <button className="flex items-center gap-2.5 w-full px-4 py-3 text-xs font-bold text-left cursor-pointer" onClick={() => setActiveTab('cards')}>
                  <BarChart2 size={16} />
                  <span>Card Management</span>
                </button>
              </li>
              <li className={`rounded-xl overflow-hidden ${activeTab === 'categories' ? 'bg-[#f97316]/10 text-[#f97316] font-bold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                <button className="flex items-center gap-2.5 w-full px-4 py-3 text-xs font-bold text-left cursor-pointer" onClick={() => setActiveTab('categories')}>
                  <FolderTree size={16} />
                  <span>Category Editor</span>
                </button>
              </li>
              <li className={`rounded-xl overflow-hidden ${activeTab === 'backup' ? 'bg-[#f97316]/10 text-[#f97316] font-bold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                <button className="flex items-center gap-2.5 w-full px-4 py-3 text-xs font-bold text-left cursor-pointer" onClick={() => setActiveTab('backup')}>
                  <Database size={16} />
                  <span>Backup & Restore</span>
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Dashboard Work Content Panels */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: Welcome Overview */}
          {activeTab === 'overview' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col min-h-[350px] text-left">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-800 font-display">Welcome back, Administrator</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                This workspace allows you to configure hierarchical tool directories and cards loaded with iframe references. Use the left menu to start:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 text-left">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 font-display">📂 Category Editor</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">Configure root categories and parent nesting structures up to 3 levels deep.</p>
                </div>
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 text-left">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 font-display">📋 Card Manager</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">Create, edit, toggle active statuses, adjust pricing details, or write manual star ratings.</p>
                </div>
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 text-left">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 font-display">📥 DB Backup</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">Download full databases to single JSON formats, or upload them to overwrite tables.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Card Management */}
          {activeTab === 'cards' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col text-left">
              <div className="flex justify-between items-center mb-6 gap-3">
                <h3 className="text-base font-bold text-slate-800 font-display">📋 Tool Card Management</h3>
                <button 
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg shadow-sm hover:shadow-[#f97316]/20 transition-all font-semibold text-xs cursor-pointer" 
                  onClick={() => openCardEditModal('create')}
                >
                  <Plus size={16} />
                  <span>Add New Card</span>
                </button>
              </div>

              {/* Table search filter sorting */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  <select 
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none text-xs focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 transition-all cursor-pointer"
                    value={filterCat} 
                    onChange={(e) => { setFilterCat(e.target.value); setFilterSub(''); setFilterSubSub(''); }}
                  >
                    <option value="">All Categories</option>
                    {categories.filter(c => c.type === 'category').map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>

                  <select 
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none text-xs focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    value={filterSub} 
                    onChange={(e) => { setFilterSub(e.target.value); setFilterSubSub(''); }} 
                    disabled={!filterCat}
                  >
                    <option value="">All Subcategories</option>
                    {categories.filter(c => c.type === 'subcategory' && c.parentId === filterCat).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>

                  <select 
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none text-xs focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    value={filterSubSub} 
                    onChange={(e) => setFilterSubSub(e.target.value)} 
                    disabled={!filterSub}
                  >
                    <option value="">All Sub-subs</option>
                    {categories.filter(c => c.type === 'subsubcategory' && c.parentId === filterSub).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>

                  <select 
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none text-xs focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 transition-all cursor-pointer"
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>

                <div className="relative w-full md:max-w-[240px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search cards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] outline-none text-xs transition-all"
                  />
                </div>
              </div>

              {/* Cards Table List */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider cursor-pointer" onClick={() => { setSortField('title'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }}>Card Title</th>
                      <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Category Structure</th>
                      <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider cursor-pointer" onClick={() => { setSortField('rating'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }}>Rating</th>
                      <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCards.length > 0 ? (
                      filteredCards.map(card => (
                        <tr key={card._id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                          <td className="px-4 py-4 font-bold text-slate-800">{card.title}</td>
                          <td className="px-4 py-4 text-[11px] text-slate-400 leading-normal">
                            {card.categoryName} → {card.subCategoryName} → {card.subSubCategoryName}
                          </td>
                          <td className="px-4 py-4 text-slate-700">
                            <div className="flex items-center gap-1">
                              <Star size={12} className="text-amber-500 fill-amber-500" />
                              <span>{card.rating?.average?.toFixed(1) || '0.0'} ({card.rating?.count || 0})</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              card.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {card.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => openCardEditModal('edit', card)} className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-slate-100 cursor-pointer" title="Edit Card">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDeleteCard(card._id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 cursor-pointer" title="Delete Card">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-400 text-xs font-semibold">
                          No tool cards found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Category Tree Editor */}
          {activeTab === 'categories' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col text-left">
              <div className="flex justify-between items-center mb-6 gap-3">
                <h3 className="text-base font-bold text-slate-800 font-display">📂 Hierarchical Category Tree</h3>
                <button 
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg shadow-sm hover:shadow-[#f97316]/20 transition-all font-semibold text-xs cursor-pointer" 
                  onClick={() => {
                    setCatForm({ name: '', type: 'category', parentId: '' });
                    setCatModal({ open: true, parentNode: null });
                  }}
                >
                  <Plus size={16} />
                  <span>Add Root Category</span>
                </button>
              </div>

              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                {categories.filter(c => c.type === 'category').length > 0 ? (
                  categories.filter(c => c.type === 'category').map(rootNode => renderCategoryTreeNode(rootNode))
                ) : (
                  <p className="text-center py-4 text-slate-400 font-semibold text-xs">No categories configured yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Backup Operations */}
          {activeTab === 'backup' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col text-left">
              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-800 font-display">💾 Database Backup & JSON Operations</h3>
              </div>

              <div className="flex flex-col gap-6">
                <div className="border-b border-slate-100 pb-6 text-left">
                  <h4 className="text-sm font-bold text-slate-800 mb-1.5 font-display">Export Case Cards Database</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Download all configured tool cards as a single formatted JSON file. Keep this as a local backup copy or share it with other systems.
                  </p>
                  <button 
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-lg shadow-sm hover:shadow-[#f97316]/20 transition-all font-semibold text-xs cursor-pointer" 
                    onClick={handleExportData}
                  >
                    <Download size={16} />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-800 mb-1.5 font-display">Import Case Cards JSON</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Paste a JSON array of tool cards. Missing parameters will be auto-generated. This action will add new card entries.
                  </p>
                  <form onSubmit={handleImportData} className="flex flex-col gap-4">
                    <textarea
                      placeholder='[\n  {\n    "title": "New Tool Case",\n    "description": "Short description...",\n    "categoryId": "24_char_cat_hex_id",\n    "subCategoryId": "24_char_subcat_hex_id",\n    "subSubCategoryId": "24_char_subsubcat_hex_id",\n    "websiteUrl": "https://example.com"\n  }\n]'
                      rows="8"
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:border-[#f97316] outline-none font-mono text-[11px] leading-relaxed transition-all"
                    ></textarea>
                    <button 
                      type="submit" 
                      className="flex items-center justify-center gap-2 px-5 py-3.5 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl shadow-md hover:shadow-[#f97316]/20 transition-all font-semibold text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start" 
                      disabled={!importJson.trim()}
                    >
                      <Upload size={16} />
                      <span>Upload JSON Import</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Card Editor Form Modal */}
      {cardModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
          <div className="max-w-2xl w-full bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-base font-bold text-slate-800 font-display">{cardModal.mode === 'create' ? 'Create New Tool Case' : 'Edit Tool Case'}</h3>
              <button 
                onClick={() => setCardModal({ open: false, mode: 'create', data: null })} 
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="flex flex-col text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col text-left gap-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title *</label>
                  <input
                    type="text"
                    value={cardForm.title}
                    onChange={(e) => setCardForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Tool name title"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col text-left gap-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description *</label>
                  <textarea
                    rows="3"
                    value={cardForm.description}
                    onChange={(e) => setCardForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description about capabilities..."
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm leading-relaxed"
                    required
                  ></textarea>
                </div>

                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category *</label>
                  <select 
                    value={cardForm.categoryId} 
                    onChange={handleCardFormCatChange} 
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm cursor-pointer"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.filter(c => c.type === 'category').map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub-category</label>
                  <select 
                    value={cardForm.subCategoryId} 
                    onChange={handleCardFormSubChange}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!cardForm.categoryId}
                  >
                    <option value="">Select subcategory</option>
                    {categories.filter(c => c.type === 'subcategory' && c.parentId === cardForm.categoryId).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col text-left gap-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub-sub-category</label>
                  <select 
                    value={cardForm.subSubCategoryId} 
                    onChange={(e) => setCardForm(prev => ({ ...prev, subSubCategoryId: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!cardForm.subCategoryId}
                  >
                    <option value="">Select sub-sub</option>
                    {categories.filter(c => c.type === 'subsubcategory' && c.parentId === cardForm.subCategoryId).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website URL (Action Link) *</label>
                  <input
                    type="url"
                    value={cardForm.websiteUrl}
                    onChange={(e) => setCardForm(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    placeholder="https://example.com/item"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Iframe URL (Embedding Source)</label>
                  <input
                    type="url"
                    value={cardForm.websiteIframe}
                    onChange={(e) => setCardForm(prev => ({ ...prev, websiteIframe: e.target.value }))}
                    placeholder="Auto-generated if left blank"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm"
                  />
                </div>

                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Star Rating (0.0 to 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={cardForm.ratingAvg}
                    onChange={(e) => setCardForm(prev => ({ ...prev, ratingAvg: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm"
                  />
                </div>

                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reviews Count</label>
                  <input
                    type="number"
                    min="0"
                    value={cardForm.ratingCount}
                    onChange={(e) => setCardForm(prev => ({ ...prev, ratingCount: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm"
                  />
                </div>

                <div className="flex sm:col-span-2 items-center gap-2 py-2">
                  <input
                    id="card-active-check"
                    type="checkbox"
                    checked={cardForm.isActive}
                    onChange={(e) => setCardForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-[#f97316] border-slate-300 rounded focus:ring-[#f97316]/20 cursor-pointer"
                  />
                  <label htmlFor="card-active-check" className="text-xs text-slate-600 font-semibold cursor-pointer select-none">Active and Displayable on Site</label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-8 border-t border-slate-100 pt-5">
                <button 
                  type="button" 
                  className="flex items-center justify-center gap-1.5 px-5 py-3 border border-slate-200 text-slate-700 bg-white rounded-xl hover:bg-slate-50 transition-all font-semibold text-xs cursor-pointer" 
                  onClick={() => setCardModal({ open: false, mode: 'create', data: null })}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex items-center justify-center gap-1.5 px-5 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl shadow-md hover:shadow-[#f97316]/20 transition-all font-semibold text-xs cursor-pointer"
                >
                  {cardModal.mode === 'create' ? 'Create Card' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Category Editor Child Adder Modal */}
      {catModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
          <div className="max-w-[450px] w-full bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-base font-bold text-slate-800 font-display">Create {catForm.type}</h3>
              <button 
                onClick={() => setCatModal({ open: false, parentNode: null })} 
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="flex flex-col text-left">
              {catModal.parentNode && (
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-500 mb-5 leading-normal">
                  Adding nested item inside: <strong className="text-slate-800">{catModal.parentNode.name}</strong> ({catModal.parentNode.type})
                </div>
              )}

              <div className="flex flex-col text-left gap-1.5 mb-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Node Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Wire Cutters"
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm"
                  value={catForm.name}
                  onChange={(e) => setCatForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-2 border-t border-slate-100 pt-5">
                <button 
                  type="button" 
                  className="flex items-center justify-center gap-1.5 px-5 py-3 border border-slate-200 text-slate-700 bg-white rounded-xl hover:bg-slate-50 transition-all font-semibold text-xs cursor-pointer" 
                  onClick={() => setCatModal({ open: false, parentNode: null })}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex items-center justify-center gap-1.5 px-5 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl shadow-md hover:shadow-[#f97316]/20 transition-all font-semibold text-xs cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
