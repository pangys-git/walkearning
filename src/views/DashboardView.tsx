import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Flame, MapPin, Trophy, Edit2, Check } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '一', steps: 4000 },
  { name: '二', steps: 5500 },
  { name: '三', steps: 7200 },
  { name: '四', steps: 6800 },
  { name: '五', steps: 8100 },
  { name: '六', steps: 9500 },
  { name: '日', steps: 6000 },
];

export default function DashboardView() {
  const currentSteps = 5240;
  const goalSteps = 7000;
  const progress = Math.min((currentSteps / goalSteps) * 100, 100);

  const [userName, setUserName] = useState('朋友');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('userName', tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-8"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">早安，</h2>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="text-2xl font-bold text-gray-900 border-b-2 border-emerald-500 focus:outline-none bg-transparent w-32"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button 
                onClick={handleSaveName}
                className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h2 className="text-2xl font-bold text-gray-900">早安，{userName}</h2>
              <button 
                onClick={() => {
                  setTempName(userName);
                  setIsEditingName(true);
                }}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <p className="text-gray-500 mt-1">今天天氣晴朗，適合出外走走！</p>
      </div>

      {/* Circular Progress */}
      <div className="flex justify-center items-center relative">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-gray-200 stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            <circle
              className="text-emerald-500 stroke-current"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * progress) / 100}
            ></circle>
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <Activity className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
            <span className="text-3xl font-bold text-gray-900">{currentSteps}</span>
            <p className="text-xs text-gray-500 mt-1">/ {goalSteps} 步</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={<Flame className="text-orange-500" />} label="消耗熱量" value="320 kcal" />
        <StatCard icon={<MapPin className="text-blue-500" />} label="行走距離" value="3.8 km" />
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">本週步數紀錄</h3>
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Area type="monotone" dataKey="steps" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSteps)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
      <div className="p-2 bg-gray-50 rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
