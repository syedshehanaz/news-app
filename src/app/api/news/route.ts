import { NextResponse } from 'next/server';

export const revalidate = 60;

// Diverse keywords covering Politicians, Countries, States, Persons, Events, Growth, etc.
const MOCK_KEYWORDS = [
  { word: "US Elections", priority: 1, category: "Event" },
  { word: "AI Growth", priority: 1, category: "Growth" },
  { word: "Elon Musk", priority: 2, category: "Person" },
  { word: "China", priority: 2, category: "Country" },
  { word: "Interest Rates", priority: 3, category: "Economy" },
  { word: "California", priority: 3, category: "State" },
  { word: "Climate Summit", priority: 4, category: "Event" },
  { word: "Stock Market", priority: 4, category: "Economy" },
  { word: "Healthcare", priority: 5, category: "Policy" },
  { word: "Olympics", priority: 5, category: "Sports" }
];

const MOCK_NEWS = {
  keywords: MOCK_KEYWORDS,
  articles: [
    {
      id: "mock1",
      title: "Global Markets Rally as Tech Sector Surges",
      description: "Major indices hit record highs today driven by strong earnings in the AI and semiconductor industries.",
      content: "Full content of the article would go here. The tech sector has seen unprecedented growth recently...",
      url: "https://example.com/news/1",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1200",
      publishedAt: new Date().toISOString(),
      source: { name: "Financial Times", url: "https://ft.com" },
      tags: ["Stock Market", "AI Growth"]
    },
    {
      id: "mock2",
      title: "Breakthrough in Renewable Energy Storage",
      description: "Scientists announce a new solid-state battery that can store 10x more energy and charge in minutes.",
      content: "Researchers at MIT have developed a revolutionary battery technology...",
      url: "https://example.com/news/2",
      image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1200",
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      source: { name: "Science Daily", url: "https://sciencedaily.com" },
      tags: ["Climate Summit", "Growth"]
    },
    {
      id: "mock3",
      title: "Diplomatic Summit Reaches Historic Agreement in China",
      description: "World leaders have signed a sweeping new treaty aimed at addressing global climate challenges.",
      content: "In a surprising turn of events, the summit concluded with a unanimous agreement...",
      url: "https://example.com/news/3",
      image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=1200",
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      source: { name: "Reuters", url: "https://reuters.com" },
      tags: ["China", "Event"]
    },
    {
      id: "mock4",
      title: "President Addresses the Nation on Healthcare Reform",
      description: "The highly anticipated speech brings a slew of new policies focusing on states like California.",
      content: "The President outlined a new strategy for improving healthcare access...",
      url: "https://example.com/news/4",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      source: { name: "The Verge", url: "https://theverge.com" },
      tags: ["California", "Healthcare", "Politician"]
    }
  ]
};

// A dynamic keyword extractor based on word frequency
function extractKeywords(articles: any[]) {
  const wordsCounter: Record<string, number> = {};
  const stopWords = new Set(["the", "and", "to", "of", "a", "in", "for", "is", "on", "that", "by", "this", "with", "i", "you", "it", "not", "or", "be", "are", "from", "at", "as", "your", "all", "have", "new", "more", "an", "was", "we", "will", "home", "can", "us", "about", "if", "page", "my", "has", "search", "free", "but", "our", "one", "other", "do", "no", "information", "time", "they", "site", "up", "out", "how", "what", "which", "their", "when", "there", "who", "so", "some", "would", "into", "could", "than", "over", "also", "after", "first", "years", "most", "just"]);

  articles.forEach(a => {
    const text = `${a.title || ""} ${a.description || ""}`.toLowerCase();
    const words = text.match(/\b[a-z]{5,}\b/g) || []; // Consider words with 5+ letters
    words.forEach(w => {
      if (!stopWords.has(w)) {
        wordsCounter[w] = (wordsCounter[w] || 0) + 1;
      }
    });
  });

  const sortedWords = Object.entries(wordsCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (sortedWords.length === 0) {
    return MOCK_KEYWORDS;
  }

  return sortedWords.map((entry, index) => ({
    word: entry[0].charAt(0).toUpperCase() + entry[0].slice(1),
    priority: Math.ceil((index + 1) / 2) > 5 ? 5 : Math.ceil((index + 1) / 2),
    category: "Trending"
  }));
}

export async function GET() {
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    console.warn("No GNEWS_API_KEY found, returning mock data.");
    return NextResponse.json(MOCK_NEWS);
  }

  try {
    const res = await fetch(`https://gnews.io/api/v4/top-headlines?category=general&lang=en&max=10&apikey=${apiKey}`, {
      next: { revalidate: 300 } 
    });

    if (!res.ok) {
      throw new Error(`GNews API returned ${res.status}`);
    }

    const data = await res.json();
    
    const articles = (data.articles || []).map((art: any, i: number) => ({
      id: `gnews-${Date.now()}-${i}`,
      title: art.title,
      description: art.description,
      content: art.content,
      url: art.url,
      image: art.image || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200",
      publishedAt: art.publishedAt,
      source: art.source,
      tags: [] // We'll let the frontend filter by keyword match in title/description
    }));

    const keywords = extractKeywords(articles);

    return NextResponse.json({ articles, keywords });
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json(MOCK_NEWS);
  }
}
