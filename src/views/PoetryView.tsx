import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Sparkles, Loader2, Share2, MapPin, Save, PenTool, User } from 'lucide-react';

export default function PoetryView() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('香港維多利亞公園');
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mood, setMood] = useState('輕鬆愉快');
  const [userName, setUserName] = useState('');
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
    }
    
    // Get current GPS location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePoetry = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-poetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationName,
          mood
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate poetry');
      }

      const data = await response.json();
      setContent(data.text || '無法生成內容，請稍後再試。');
    } catch (error) {
      console.error(error);
      setContent(error instanceof Error ? error.message : '發生錯誤，請檢查網路連線。');
    } finally {
      setLoading(false);
    }
  };

  const saveToGoogleSheets = async () => {
    if (!content) {
      alert('請先創作內容！');
      return;
    }
    
    setSaving(true);
    try {
      const locString = gpsLocation 
        ? `${locationName} (${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)})`
        : locationName;

      const payload = {
        user: userName || '匿名用戶',
        content: content,
        photo: imagePreview ? 'Yes' : 'No',
        location: locString,
        timestamp: new Date().toISOString()
      };

      // In a real app, this would be an absolute URL or handled by a proxy
      const response = await fetch('/api/creations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        alert('成功記錄並分享至社群！');
      } else {
        alert('儲存失敗：' + result.error);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('儲存時發生錯誤，請稍後再試。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">創作與記錄</h2>
              <p className="text-sm text-gray-500">為你的散步旅程留下印記</p>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setMode('ai')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'ai' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            AI 輔助創作
          </button>
          <button 
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'manual' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            自行撰寫
          </button>
        </div>

        <div className="space-y-4">
          {/* Image Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera className="w-8 h-8 mb-2 text-gray-400" />
                <span className="text-sm font-medium">點擊上傳景點照片</span>
                <span className="text-xs text-gray-400 mt-1">分享你的所見所聞</span>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">你的名字</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    localStorage.setItem('userName', e.target.value);
                  }}
                  placeholder="輸入你的名字"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gray-50 text-sm"
                />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">當前地點</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gray-50 text-sm"
                />
              </div>
              {gpsLocation && (
                <p className="text-[10px] text-gray-400 mt-1">
                  GPS: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
                </p>
              )}
            </div>
            {mode === 'ai' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">當下心情</label>
                <input 
                  type="text" 
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gray-50 text-sm"
                />
              </div>
            )}
          </div>

          {mode === 'ai' ? (
            <button 
              onClick={generatePoetry}
              disabled={loading}
              className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg shadow-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? '靈感湧現中...' : 'AI 生成專屬內容'}
            </button>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">你的創作</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="寫下你今天的散步心得..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-gray-50 min-h-[120px] resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {content && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl shadow-lg border border-gray-200 bg-white"
        >
          {/* Background Image with Overlay */}
          {imagePreview && (
            <div className="relative h-48 w-full">
              <img 
                src={imagePreview} 
                alt="Background" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {locationName}
                </p>
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="p-6">
            {!imagePreview && (
              <p className="text-xs font-medium text-purple-600 flex items-center gap-1 mb-3">
                <MapPin className="w-3 h-3" />
                {locationName}
              </p>
            )}
            <div className="font-serif text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
              <div className="text-left">
                <p className="text-xs text-gray-500">輕行計劃 記錄</p>
                <p className="text-[10px] text-gray-400">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={saveToGoogleSheets}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1 disabled:opacity-70"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? '儲存中...' : '儲存並分享'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
