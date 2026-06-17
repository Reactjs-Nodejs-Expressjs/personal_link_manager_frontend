import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  LayoutDashboard, Plus, Edit, Trash2, Search, FolderTree, Database, 
  Upload, Download, AlertTriangle, X, Check, Star, CheckCircle, 
  ExternalLink, Eye, EyeOff, BarChart2, Hash, AlertCircle, Loader2
} from 'lucide-react';

// ── Reusable Delete Confirmation Modal ──────────────────────────────────────
function DeleteConfirmModal({ open, title, description, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[2000] flex justify-center items-center p-4">
      <div className="max-w-[420px] w-full bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 flex flex-col gap-5 animate-[modalSlideUp_0.2s_ease]">
        {/* Icon + Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
            <Trash2 size={26} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 font-display">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-1.5 px-2">{description}</p>
          </div>
        </div>

        {/* Warning box */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-medium">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>This action <strong>cannot be undone</strong>. The data will be permanently removed.</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 justify-end pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 bg-white rounded-xl hover:bg-slate-50 transition-all font-semibold text-xs cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md transition-all font-semibold text-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [catModal, setCatModal] = useState({ open: false, mode: 'create', parentNode: null, data: null });

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: null,       // 'card' | 'category'
    id: null,
    title: '',
    description: '',
    loading: false
  });

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

  // Save card modal loading
  const [savingCard, setSavingCard] = useState(false);
  const [savingCat, setSavingCat] = useState(false);

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
    totalCategories: categories.filter(c => c.type === 'category').length,
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
      subCategoryId: subCategoryId || null,
      subSubCategoryId: subSubCategoryId || null,
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

    setSavingCard(true);
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
      triggerAlert('error', err.response?.data?.message || 'Error saving tool card. Check your login session.');
      console.error('[SaveCard]', err.response?.status, err.response?.data);
    } finally {
      setSavingCard(false);
    }
  };

  // ── Open Delete Modal (Card) ─────────────────────────────────────────────
  const confirmDeleteCard = (card) => {
    setDeleteModal({
      open: true,
      type: 'card',
      id: card._id,
      title: `Delete "${card.title}"?`,
      description: `This will permanently delete the tool card "${card.title}" from the database.`,
      loading: false
    });
  };

  // ── Open Delete Modal (Category) ─────────────────────────────────────────
  const confirmDeleteCategory = (cat) => {
    setDeleteModal({
      open: true,
      type: 'category',
      id: cat._id,
      title: `Delete "${cat.name}"?`,
      description: `This will permanently delete the ${cat.type} "${cat.name}" and ALL of its child categories. Cards in these categories will lose their category reference.`,
      loading: false
    });
  };

  // ── Execute Delete ────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      if (deleteModal.type === 'card') {
        await api.delete(`/cards/${deleteModal.id}`);
        triggerAlert('success', 'Card deleted successfully.');
      } else {
        await api.delete(`/categories/${deleteModal.id}`);
        triggerAlert('success', 'Category deleted successfully.');
      }
      setDeleteModal({ open: false, type: null, id: null, title: '', description: '', loading: false });
      loadData();
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || `Error deleting ${deleteModal.type}.`);
      console.error('[Delete]', err.response?.status, err.response?.data);
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const closeDeleteModal = () => {
    if (deleteModal.loading) return;
    setDeleteModal({ open: false, type: null, id: null, title: '', description: '', loading: false });
  };

  // Save Category Handler (Create or Edit)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name) return;
    setSavingCat(true);
    try {
      if (catModal.mode === 'create') {
        await api.post('/categories', {
          name: catForm.name,
          type: catForm.type,
          parentId: catForm.parentId || null
        });
        triggerAlert('success', `Created ${catForm.type} "${catForm.name}" successfully.`);
      } else {
        await api.put(`/categories/${catModal.data._id}`, {
          name: catForm.name,
          type: catForm.type,
          parentId: catForm.parentId || null
        });
        triggerAlert('success', `Updated category "${catForm.name}" successfully.`);
      }
      setCatModal({ open: false, mode: 'create', parentNode: null, data: null });
      setCatForm({ name: '', type: 'category', parentId: '' });
      loadData();
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Error saving category node.');
    } finally {
      setSavingCat(false);
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
      const res = await api.post('/cards/bulk', { action: 'import', cards: parsed });
      triggerAlert('success', `Import: ${res.data.importedCount} imported, ${res.data.errorsCount} errors.`);
      setImportJson('');
      loadData();
    } catch (err) {
      triggerAlert('error', 'JSON format invalid or import failed: ' + err.message);
    }
  };

  // Category Tree UI Renderer
  const renderCategoryTreeNode = (node, depth = 0) => {
    const children = categories.filter(c => c.parentId === node._id);
    
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
            <button 
              className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title={`Edit Category`}
              onClick={() => {
                setCatForm({ name: node.name, type: node.type, parentId: node.parentId || '' });
                setCatModal({ open: true, mode: 'edit', parentNode: null, data: node });
              }}
            >
              <Edit size={14} />
            </button>
            {node.type !== 'subsubcategory' && (
              <button 
                className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title={`Add Child to ${node.name}`}
                onClick={() => {
                  const childType = node.type === 'category' ? 'subcategory' : 'subsubcategory';
                  setCatForm({ name: '', type: childType, parentId: node._id });
                  setCatModal({ open: true, mode: 'create', parentNode: node, data: null });
                }}
              >
                <Plus size={14} />
              </button>
            )}
            <button 
              className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
              title="Delete node & children"
              onClick={() => confirmDeleteCategory(node)}
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
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else {
      return sortOrder === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
    }
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        title={deleteModal.title}
        description={deleteModal.description}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
        loading={deleteModal.loading}
      />

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
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Main Categories</h3>
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
              {[
                { id: 'overview', label: 'Welcome Summary', icon: <LayoutDashboard size={16} /> },
                { id: 'cards', label: 'Card Management', icon: <BarChart2 size={16} /> },
                { id: 'categories', label: 'Category Editor', icon: <FolderTree size={16} /> },
                { id: 'backup', label: 'Backup & Restore', icon: <Database size={16} /> },
              ].map(tab => (
                <li key={tab.id} className={`rounded-xl overflow-hidden ${activeTab === tab.id ? 'bg-[#f97316]/10 text-[#f97316] font-bold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                  <button className="flex items-center gap-2.5 w-full px-4 py-3 text-xs font-bold text-left cursor-pointer" onClick={() => setActiveTab(tab.id)}>
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                </li>
              ))}
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
                {[
                  { icon: '📂', title: 'Category Editor', desc: 'Configure root categories and parent nesting structures up to 3 levels deep.' },
                  { icon: '📋', title: 'Card Manager', desc: 'Create, edit, toggle active statuses, adjust pricing details, or write manual star ratings.' },
                  { icon: '📥', title: 'DB Backup', desc: 'Download full databases to single JSON formats, or upload them to overwrite tables.' },
                ].map(item => (
                  <div key={item.title} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 text-left">
                    <h4 className="text-xs font-bold text-slate-800 mb-2 font-display">{item.icon} {item.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
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
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-400 text-xs font-semibold">
                          <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                          Loading cards...
                        </td>
                      </tr>
                    ) : filteredCards.length > 0 ? (
                      filteredCards.map(card => (
                        <tr key={card._id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                          <td className="px-4 py-4 font-bold text-slate-800 max-w-[200px] truncate">{card.title}</td>
                          <td className="px-4 py-4 text-[11px] text-slate-400 leading-normal">
                            {[card.categoryName, card.subCategoryName, card.subSubCategoryName].filter(Boolean).join(' → ') || '—'}
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
                              <button 
                                onClick={() => openCardEditModal('edit', card)} 
                                className="text-blue-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors" 
                                title="Edit Card"
                              >
                                <Edit size={15} />
                              </button>
                              <button 
                                onClick={() => confirmDeleteCard(card)} 
                                className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition-colors" 
                                title="Delete Card"
                              >
                                <Trash2 size={15} />
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
                    setCatModal({ open: true, mode: 'create', parentNode: null, data: null });
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
                    Download all configured tool cards as a single formatted JSON file.
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
                    Paste a JSON array of tool cards. Missing parameters will be auto-generated. This adds new entries.
                  </p>
                  <form onSubmit={handleImportData} className="flex flex-col gap-4">
                    <textarea
                      placeholder={'[\n  {\n    "title": "New Tool Case",\n    "description": "Short description...",\n    "categoryId": "24_char_cat_hex_id",\n    "websiteUrl": "https://example.com"\n  }\n]'}
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
              <h3 className="text-base font-bold text-slate-800 font-display">{cardModal.mode === 'create' ? 'Create New Tool Case' : `Edit: ${cardModal.data?.title}`}</h3>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cardForm.price}
                    onChange={(e) => setCardForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Leave blank if no price"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm"
                  />
                </div>

                <div className="flex flex-col text-left gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency</label>
                  <select 
                    value={cardForm.currency} 
                    onChange={(e) => setCardForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-[#f97316] focus:ring-4 focus:ring-[#f97316]/10 outline-none transition-all text-sm cursor-pointer"
                  >
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
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
                  disabled={savingCard}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingCard}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl shadow-md hover:shadow-[#f97316]/20 transition-all font-semibold text-xs cursor-pointer disabled:opacity-60"
                >
                  {savingCard ? <Loader2 size={14} className="animate-spin" /> : null}
                  {savingCard ? 'Saving...' : cardModal.mode === 'create' ? 'Create Card' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Category Editor Modal */}
      {catModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4">
          <div className="max-w-[450px] w-full bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-base font-bold text-slate-800 font-display">
                {catModal.mode === 'create' ? `Create ${catForm.type}` : `Edit ${catForm.type}`}
              </h3>
              <button 
                onClick={() => setCatModal({ open: false, mode: 'create', parentNode: null, data: null })} 
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex flex-col text-left">
              {catModal.mode === 'create' && catModal.parentNode && (
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
                  onClick={() => setCatModal({ open: false, mode: 'create', parentNode: null, data: null })}
                  disabled={savingCat}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingCat}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-xl shadow-md hover:shadow-[#f97316]/20 transition-all font-semibold text-xs cursor-pointer disabled:opacity-60"
                >
                  {savingCat ? <Loader2 size={14} className="animate-spin" /> : null}
                  {savingCat ? 'Saving...' : catModal.mode === 'create' ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
