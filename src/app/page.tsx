"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./page.module.css";

type Article = {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: { name: string; url: string };
  tags?: string[];
};

type Keyword = {
  word: string;
  priority: number;
  category: string;
};

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", content: "Hello! I'm your live news assistant. Ask me anything about today's headlines." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const [newsRes, bookmarksRes] = await Promise.all([
          fetch("/api/news"),
          fetch("/api/bookmarks")
        ]);
        
        const newsData = await newsRes.json();
        const bookmarksData = await bookmarksRes.json();
        
        if (newsData.articles) setArticles(newsData.articles);
        if (newsData.keywords) setKeywords(newsData.keywords);
        
        if (bookmarksData.bookmarks) {
          const savedUrls = new Set(bookmarksData.bookmarks.map((b: any) => b.url));
          setBookmarks(savedUrls as Set<string>);
        }
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();

    const updateTime = () => {
      setTime(
        new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) +
        " · " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const toggleBookmark = async (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          imageUrl: article.image,
          source: article.source.name,
          publishedAt: article.publishedAt,
        })
      });
      const data = await res.json();
      
      setBookmarks(prev => {
        const next = new Set(prev);
        if (data.bookmarked) next.add(article.url);
        else next.delete(article.url);
        return next;
      });
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg,
          context: articles.map(a => a.title).join(". ")
        })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: "ai", content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const tickerText = articles.length 
    ? articles.map(a => a.title).join(' <span class="sep">·</span> ') 
    : "Fetching live headlines...";

  // Filter articles based on active keyword
  const displayedArticles = activeKeyword 
    ? articles.filter(a => 
        a.title.toLowerCase().includes(activeKeyword.toLowerCase()) || 
        a.description.toLowerCase().includes(activeKeyword.toLowerCase()) ||
        (a.tags && a.tags.some(t => t.toLowerCase() === activeKeyword.toLowerCase()))
      )
    : articles;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.siteTitle}>N<span>E</span>WS</div>
          <div>
            <div className={styles.liveBadge}><span className={styles.liveDot}></span>Live Feed</div>
            <span className={styles.headerDate}>{time}</span>
          </div>
        </div>
        <div className={styles.tickerWrap}>
          <div 
            className={styles.tickerInner} 
            dangerouslySetInnerHTML={{ __html: (tickerText + '&nbsp;&nbsp;&nbsp;').repeat(3) }}
          />
        </div>
      </header>

      {/* KEYWORDS CLOUD SECTION */}
      <section className={styles.kwSection}>
        <div className={styles.kwLabel}>⬤ Trending Keywords — click to filter feed</div>
        <div className={styles.kwCloud}>
          {!loading && keywords.map((kw, i) => {
            const isActive = activeKeyword === kw.word;
            return (
              <span 
                key={i}
                className={`${styles.kwPill} ${styles[`kwP${kw.priority}`]} ${isActive ? styles.active : ''}`}
                onClick={() => setActiveKeyword(isActive ? null : kw.word)}
                title={kw.category}
              >
                {kw.word}
              </span>
            );
          })}
          {loading && <span className="info-msg" style={{padding:0}}>Analyzing trends...</span>}
        </div>
      </section>

      <div className={styles.pageGrid}>
        <main className={styles.mainFeed}>
          <div className={styles.feedHeading}>Top Stories · Live Coverage</div>
          
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.articleCard} style={{ cursor: 'default' }}>
                <div className={`${styles.skeleton} ${styles.artMeta}`} style={{ width: '40%', height: '14px', marginBottom: '12px' }} />
                <div className={`${styles.skeleton} ${styles.artHeadline}`} style={{ width: '90%', height: '24px', marginBottom: '8px' }} />
                <div className={`${styles.skeleton} ${styles.artHeadline}`} style={{ width: '60%', height: '24px', marginBottom: '12px' }} />
                <div className={`${styles.skeleton} ${styles.artSnippet}`} style={{ width: '100%', height: '16px', marginBottom: '6px' }} />
                <div className={`${styles.skeleton} ${styles.artSnippet}`} style={{ width: '80%', height: '16px' }} />
              </div>
            ))
          ) : displayedArticles.length === 0 ? (
            <div className="info-msg">No stories found matching "{activeKeyword}". Try selecting another keyword.</div>
          ) : (
            displayedArticles.map(article => (
              <div key={article.id} className={styles.articleCard} onClick={() => setSelectedArticle(article)}>
                <div className={styles.artMeta}>
                  <div>
                    <span className={styles.artSource}>{article.source.name}</span>
                    &nbsp;&nbsp;·&nbsp;&nbsp;
                    {new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <button 
                    className={`${styles.bookmarkBtn} ${bookmarks.has(article.url) ? styles.saved : ''}`}
                    onClick={(e) => toggleBookmark(e, article)}
                    title={bookmarks.has(article.url) ? "Remove bookmark" : "Save for later"}
                  >
                    {bookmarks.has(article.url) ? "★" : "☆"}
                  </button>
                </div>
                <div className={styles.artHeadline}>{article.title}</div>
                <div className={styles.artSnippet}>{article.description}</div>
              </div>
            ))
          )}
        </main>
        
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeading}>Saved Stories ({bookmarks.size})</div>
          {bookmarks.size === 0 ? (
            <div className="info-msg" style={{ padding: '0.5rem 0' }}>No stories saved yet.</div>
          ) : (
            articles.filter(a => bookmarks.has(a.url)).map(article => (
              <div key={`side-${article.id}`} className={styles.sidebarItem} onClick={() => setSelectedArticle(article)}>
                <div className={styles.sidebarItemTitle}>{article.title}</div>
                <div className={styles.sidebarItemMeta}>{article.source.name}</div>
              </div>
            ))
          )}
        </aside>
      </div>

      {selectedArticle && (
        <div className={styles.overlay} onClick={() => setSelectedArticle(null)}>
          <div className={styles.overlayInner} onClick={e => e.stopPropagation()}>
            <button className={styles.ovClose} onClick={() => setSelectedArticle(null)}>✕</button>
            <div className={styles.ovCat}>{selectedArticle.source.name} · {new Date(selectedArticle.publishedAt).toLocaleDateString()}</div>
            <div className={styles.ovHeadline}>{selectedArticle.title}</div>
            
            <div className={styles.ovImgBox}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedArticle.image} alt={selectedArticle.title} />
            </div>
            
            <div className={styles.ovBody}>
              <p>{selectedArticle.description}</p>
              <p>{selectedArticle.content}</p>
            </div>
            
            <div className={styles.ovFooter}>
              <div>Source: {selectedArticle.source.name}</div>
              <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className={styles.ovBtn}>
                Read Full Article →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CHATBOT */}
      <div className={`${styles.chatWrap} ${chatOpen ? styles.open : styles.collapsed}`}>
        <div className={styles.chatHeader} onClick={() => setChatOpen(!chatOpen)}>
          <div className={styles.chatHeaderTitle}>
            <div className={styles.chatStatus}></div>
            ASK NEWS
          </div>
          <span style={{ color: "var(--muted)", transform: chatOpen ? "rotate(180deg)" : "none", transition: "0.2s" }}>
            ▲
          </span>
        </div>
        
        <div className={styles.chatBody}>
          <div className={styles.chatMsgs}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.chatMsg} ${styles[m.role]}`}>
                {m.content}
              </div>
            ))}
            {isTyping && (
              <div className={`${styles.chatMsg} ${styles.ai}`} style={{ fontStyle: "italic", opacity: 0.7 }}>
                Typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className={styles.chatInputWrap}>
            <input 
              className={styles.chatInput}
              placeholder="Ask about today's news..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
              disabled={isTyping}
            />
            <button 
              className={styles.chatSend} 
              onClick={sendChatMessage}
              disabled={isTyping || !chatInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
