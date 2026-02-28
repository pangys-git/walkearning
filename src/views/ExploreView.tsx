import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Star, Clock, MapPin, MessageSquare, User } from 'lucide-react';

const tours = [
  {
    id: 1,
    title: '中西區老店巡禮',
    theme: '歷史文化',
    duration: '2小時',
    difficulty: '輕鬆',
    rating: 4.8,
    image: 'https://picsum.photos/seed/tour1/600/400?blur=2',
    leader: '陳伯伯 (義工)',
    link: 'https://forms.gle/dujABYxF4Bh8YQWu9',
    status: 'active'
  },
  {
    id: 2,
    title: '維多利亞公園生態遊',
    theme: '自然生態',
    duration: '1.5小時',
    difficulty: '非常輕鬆',
    rating: 4.9,
    image: 'https://picsum.photos/seed/tour2/600/400?blur=2',
    leader: '林老師 (生態專家)',
    status: 'ended'
  },
  {
    id: 3,
    title: '九龍城寨遺跡探索',
    theme: '建築古蹟',
    duration: '3小時',
    difficulty: '中等',
    rating: 4.7,
    image: 'https://picsum.photos/seed/tour3/600/400?blur=2',
    leader: '張先生 (歷史系學生)',
    status: 'ended'
  }
];

interface Creation {
  Timestamp: string;
  User: string;
  Content: string;
  Photo: string;
  Location: string;
}

export default function ExploreView() {
  const [activeTab, setActiveTab] = useState<'tours' | 'community'>('tours');
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'community') {
      fetchCreations();
    }
  }, [activeTab]);

  const fetchCreations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/creations');
      const data = await res.json();
      if (data.success) {
        setCreations(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch creations', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="搜尋主題導賞或社群創作..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm"
          />
        </div>
        <button className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-gray-600 hover:bg-gray-50">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('tours')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'tours' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          主題導賞
        </button>
        <button 
          onClick={() => setActiveTab('community')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'community' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          社群創作
        </button>
      </div>

      {activeTab === 'tours' ? (
        <>
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['全部', '歷史文化', '自然生態', '建築古蹟', '親子友善'].map((cat, i) => (
              <button 
                key={cat}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${i === 0 ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tour List */}
          <div className="space-y-4">
            {tours.map((tour) => (
              <div key={tour.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <div className="relative h-40">
                  <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-medium">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {tour.rating}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-emerald-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                    {tour.theme}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{tour.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {tour.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {tour.difficulty}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-xs font-bold">
                        {tour.leader.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-600">{tour.leader}</span>
                    </div>
                    {tour.status === 'ended' ? (
                      <span className="text-gray-400 font-medium text-sm bg-gray-100 px-3 py-1 rounded-lg">
                        活動已完結
                      </span>
                    ) : tour.link ? (
                      <a 
                        href={tour.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 font-medium text-sm hover:text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg"
                      >
                        報名參加
                      </a>
                    ) : (
                      <button className="text-emerald-600 font-medium text-sm hover:text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                        查看詳情
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-500">載入中...</div>
          ) : creations.length > 0 ? (
            creations.map((creation, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{creation.User}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(creation.Timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs font-medium text-purple-600 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3" />
                    {creation.Location}
                  </p>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                    {creation.Content}
                  </p>
                </div>
                
                {creation.Photo === 'Yes' && (
                  <div className="h-40 rounded-xl bg-gray-100 mb-3 overflow-hidden">
                    <img 
                      src={`https://picsum.photos/seed/${idx}/600/400?blur=2`} 
                      alt="Creation" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-4 pt-3 border-t border-gray-50 text-gray-500">
                  <button className="flex items-center gap-1 text-xs hover:text-purple-600 transition-colors">
                    <Star className="w-4 h-4" /> 讚賞
                  </button>
                  <button className="flex items-center gap-1 text-xs hover:text-purple-600 transition-colors">
                    <MessageSquare className="w-4 h-4" /> 留言
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              目前還沒有社群創作，快去「創作/記錄」分享你的第一篇散步心得吧！
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
