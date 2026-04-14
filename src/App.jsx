import React, { useState, useEffect, useMemo } from 'react';
import { Globe2, MapPin, Clock, ArrowRight, ExternalLink, RefreshCw, TrendingUp, Hash } from 'lucide-react';
import './index.css';

const LOCAL_SOURCES = [
  { name: 'ไทยรัฐ', url: 'https://www.thairath.co.th/rss/news' },
  { name: 'มติชน', url: 'https://www.matichon.co.th/feed' },
  { name: 'ข่าวสด', url: 'https://www.khaosod.co.th/feed' },
  { name: 'Google News TH', url: 'https://news.google.com/rss?hl=th&gl=TH&ceid=TH:th' }
];

const GLOBAL_SOURCES = [
  { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss' }
];



// Fallback images in case the news item doesn't have one
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
];

function getRandomFallback(index) {
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function formatRelativeTime(dateString) {
  if (!dateString) return 'เมื่อครู่';
  const now = new Date();
  
  // Clean date string and ensure it's treated as UTC if no offset exists
  // rss2json usually returns "YYYY-MM-DD HH:mm:ss"
  let cleanDateStr = dateString;
  if (!cleanDateStr.includes('Z') && !cleanDateStr.includes('+') && !cleanDateStr.includes('GMT')) {
    cleanDateStr += ' UTC';
  }
  
  const date = new Date(cleanDateStr);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 0) return 'เมื่อครู่'; // In case of clock drift
  if (diffInSeconds < 60) return 'เมื่อครู่';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
}


function NewsCard({ item, type, index }) {
  const isGlobal = type === 'global';
  let imageUrl = item.thumbnail || (item.enclosure && item.enclosure.link);
  
  if (!imageUrl && item.description) {
    const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) imageUrl = imgMatch[1];
  }
  
  if (!imageUrl) imageUrl = getRandomFallback(index);

  const cleanDesc = item.description ? item.description.replace(/<[^>]+>/g, '').trim() : '';
  const timeLabel = formatRelativeTime(item.pubDate);

  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className={`news-card animate-fade-in ${index === 0 ? 'featured-card' : ''}`} style={{animationDelay: `${index * 0.1}s`}}>
      <div className="card-image-wrap">
        <span className={`card-badge ${!isGlobal ? 'local' : ''}`}>
          {isGlobal ? 'World News' : 'ข่าวในประเทศ'}
        </span>
        <img src={imageUrl} alt={item.title} className="card-image" onError={(e) => { e.target.src = getRandomFallback(index) }} />
      </div>
      <div className="card-content">
        <div className="card-meta">
          <span><Clock size={14} /> {timeLabel}</span>
          <span className="source-tag">{item.sourceName}</span>
        </div>
        <h3 className="card-title">{item.title}</h3>
        <p className="card-desc">{cleanDesc}</p>
        <div className="card-actions">
          <span className="read-more">
            อ่านต่อ <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </a>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('all'); 
  const [globalNews, setGlobalNews] = useState([]);
  const [localNews, setLocalNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const [error, setError] = useState(null);

  const fetchGroup = async (sources) => {
    try {
      const promises = sources.map(async (source) => {
        const cacheBuster = `&_=${Date.now()}`;
        // Simple fetch to ensure compatibility with free tier
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}${cacheBuster}`);
        const data = await res.json();
        if (data.status === 'ok') {
          return data.items.map(item => ({ ...item, sourceName: source.name }));
        }
        return [];
      });


      const results = await Promise.all(promises);
      const combined = results.flat();
      combined.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      return combined;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gData, lData] = await Promise.all([
        fetchGroup(GLOBAL_SOURCES),
        fetchGroup(LOCAL_SOURCES)
      ]);
      
      setGlobalNews(gData);
      setLocalNews(lData);
      setLastSync(new Date());
    } catch (err) {
      console.error("Failed to fetch news:", err);
      setError("ไม่สามารถโหลดข่าวสารได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000); 
    return () => clearInterval(interval);
  }, []);

  const { global: displayGlobal, local: displayLocal } =  activeTab === 'global' ? { global: globalNews, local: [] } : 
                                                          activeTab === 'local' ? { global: [], local: localNews } : 
                                                          { global: globalNews, local: localNews };

  let displayAll = [];
  if (activeTab === 'all') {
    const maxLength = Math.max(displayGlobal.length, displayLocal.length);
    for (let i = 0; i < maxLength; i++) {
      if (displayLocal[i]) displayAll.push({ ...displayLocal[i], type: 'local' });
      if (displayGlobal[i]) displayAll.push({ ...displayGlobal[i], type: 'global' });
    }
  }

  return (
    <div className="app-container">
      <header className="header glass">
        <div className="header-brand">
          <Globe2 size={28} className="text-primary" />
          NewsSphere TH
        </div>
        <nav className="header-nav">
          <button className={`nav-link ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>หน้าแรก</button>
          <button className={`nav-link ${activeTab === 'global' ? 'active' : ''}`} onClick={() => setActiveTab('global')}>ระดับโลก</button>
          <button className={`nav-link ${activeTab === 'local' ? 'active' : ''}`} onClick={() => setActiveTab('local')}>ในประเทศไทย</button>
        </nav>
      </header>

      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title" style={{marginBottom: '0.5rem'}}>
              {activeTab === 'all' && <><Globe2 className="text-primary" /> ข่าวเด่นวันนี้</>}
              {activeTab === 'global' && <><Globe2 className="text-primary" /> ข่าวระดับโลก</>}
              {activeTab === 'local' && <><MapPin className="text-primary" /> ข่าวในประเทศไทย</>}
            </h1>
            <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Clock size={14} /> อัปเดตล่าสุดเมื่อ: {lastSync.toLocaleTimeString('th-TH')} น.
            </p>
          </div>
          <button 
            onClick={fetchNews} 
            disabled={loading}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              background: 'var(--primary)', color: 'white', 
              border: 'none', padding: '0.75rem 1.25rem', borderRadius: '12px',
              cursor: 'pointer', transition: 'all 0.2s',
              fontWeight: '600',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseOver={(e) => e.target.style.background = 'var(--primary-hover)'}
            onMouseOut={(e) => e.target.style.background = 'var(--primary)'}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} style={loading ? {animation: 'spin 1s linear infinite'} : {}} /> 
            {loading ? 'กำลังดึงข้อมูล...' : 'อัปเดตข่าว'}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading && displayAll.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>กำลังโหลดข่าวสารล่าสุดจากทั่วโลก...</p>
          </div>
        ) : (
          <div className="news-grid">
            {(activeTab === 'all' ? displayAll : activeTab === 'global' ? displayGlobal : displayLocal).map((item, idx) => (
              <NewsCard key={item.guid || idx} item={item} type={item.type || activeTab} index={idx} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
