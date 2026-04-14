import React, { useState, useEffect } from 'react';
import { Globe2, MapPin, Clock, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import './index.css';

const LOCAL_SOURCES = [
  { name: 'Thairath', url: 'https://www.thairath.co.th/rss/news' },
  { name: 'Google News TH', url: 'https://news.google.com/rss?hl=th&gl=TH&ceid=TH:th' }
];

const GLOBAL_SOURCES = [
  { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss' },
  { name: 'NYT World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' }
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

function NewsCard({ item, type, index }) {
  const isGlobal = type === 'global';
  
  // Try to parse image from standard RSS fields or enlosure/thumbnail
  let imageUrl = item.thumbnail || (item.enclosure && item.enclosure.link);
  
  if (!imageUrl && item.description) {
    const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) imageUrl = imgMatch[1];
  }
  
  if (!imageUrl) {
    imageUrl = getRandomFallback(index);
  }

  // Clean description from HTML tags
  const cleanDesc = item.description ? item.description.replace(/<[^>]+>/g, '').trim() : '';
  
  const formattedDate = item.pubDate ? new Date(item.pubDate).toLocaleString('th-TH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }) : 'Just now';

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
          <span><Clock size={14} /> {formattedDate}</span>
        </div>
        <h3 className="card-title">{item.title}</h3>
        <p className="card-desc">{cleanDesc}</p>
        <div className="card-actions">
          <span className="source">{item.sourceName || (isGlobal ? 'World News' : 'ข่าวในประเทศไทย')}</span>
          <span className="read-more">
            อ่านต่อ <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </a>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('all'); // all, global, local
  const [globalNews, setGlobalNews] = useState([]);
  const [localNews, setLocalNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGroup = async (sources) => {
    try {
      const promises = sources.map(async (source) => {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}&api_key=`);
        const data = await res.json();
        if (data.status === 'ok') {
          return data.items.map(item => ({ ...item, sourceName: source.name }));
        }
        return [];
      });
      const results = await Promise.all(promises);
      const combined = results.flat();
      // Sort by pubDate descending
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
    } catch (err) {
      console.error("Failed to fetch news:", err);
      setError("ไม่สามารถโหลดข่าวสารได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getFilteredNews = () => {
    if (activeTab === 'global') return { global: globalNews, local: [] };
    if (activeTab === 'local') return { global: [], local: localNews };
    return { global: globalNews, local: localNews };
  };

  const { global: displayGlobal, local: displayLocal } = getFilteredNews();

  // Combine for 'all' view, prioritizing interleaved items
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
          <button 
            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            style={{background:'none', borderTop:'none', borderLeft:'none', borderRight:'none', fontSize:'1rem'}}
          >
            หน้าแรก
          </button>
          <button 
            className={`nav-link ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
            style={{background:'none', borderTop:'none', borderLeft:'none', borderRight:'none', fontSize:'1rem'}}
          >
            ระดับโลก
          </button>
          <button 
            className={`nav-link ${activeTab === 'local' ? 'active' : ''}`}
            onClick={() => setActiveTab('local')}
            style={{background:'none', borderTop:'none', borderLeft:'none', borderRight:'none', fontSize:'1rem'}}
          >
            ในประเทศไทย
          </button>
        </nav>
      </header>

      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="page-title">
            {activeTab === 'all' && <><Globe2 className="text-primary" /> ข่าวเด่นวันนี้</>}
            {activeTab === 'global' && <><Globe2 className="text-primary" /> ข่าวระดับโลก</>}
            {activeTab === 'local' && <><MapPin className="text-primary" /> ข่าวในประเทศไทย</>}
          </h1>
          <button 
            onClick={fetchNews} 
            disabled={loading}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              background: 'rgba(255,255,255,0.1)', color: 'white', 
              border: 'none', padding: '0.5rem 1rem', borderRadius: '8px',
              cursor: 'pointer', transition: 'background 0.2s',
              opacity: loading ? 0.5 : 1
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} style={loading ? {animation: 'spin 1s linear infinite'} : {}} /> 
            อัปเดตล่าสุด
          </button>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', borderLeft: '4px solid #ef4444', marginBottom: '2rem', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {loading && activeTab === 'all' && displayAll.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>กำลังโหลดข่าวสารล่าสุด...</p>
          </div>
        ) : (
          <div className="news-grid">
            {activeTab === 'all' && displayAll.map((item, idx) => (
              <NewsCard key={item.guid || idx} item={item} type={item.type} index={idx} />
            ))}
            
            {activeTab === 'global' && displayGlobal.map((item, idx) => (
              <NewsCard key={item.guid || idx} item={item} type="global" index={idx} />
            ))}
            
            {activeTab === 'local' && displayLocal.map((item, idx) => (
              <NewsCard key={item.guid || idx} item={item} type="local" index={idx} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
