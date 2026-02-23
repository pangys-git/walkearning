import React from 'react';
import { motion } from 'motion/react';
import { User, Settings, Award, Calendar, ChevronRight, Heart, Bell } from 'lucide-react';

export default function ProfileView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6 bg-gray-50 min-h-full"
    >
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 border-4 border-white shadow-md">
          <User className="w-10 h-10" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">李阿姨</h2>
          <p className="text-sm text-gray-500 mb-2">樂活銀髮族會員</p>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-max">
            <Award className="w-4 h-4" />
            <span>Lv. 5 散步達人</span>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">12</p>
          <p className="text-xs text-gray-500 mt-1">參加活動</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-emerald-600">85</p>
          <p className="text-xs text-gray-500 mt-1">累積公里</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-orange-500">3</p>
          <p className="text-xs text-gray-500 mt-1">獲得勳章</p>
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <MenuItem icon={<Calendar className="w-5 h-5 text-blue-500" />} label="我的活動紀錄" />
        <MenuItem icon={<Heart className="w-5 h-5 text-red-500" />} label="收藏的路線" />
        <MenuItem icon={<Award className="w-5 h-5 text-yellow-500" />} label="成就與徽章" />
        <MenuItem icon={<Bell className="w-5 h-5 text-purple-500" />} label="通知設定" />
      </div>

      {/* Volunteer Portal Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-3xl shadow-md text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-2">成為義工領隊</h3>
          <p className="text-sm text-emerald-50 mb-4 opacity-90">
            分享你的私房路線，帶領社區朋友一起健康散步！
          </p>
          <button className="bg-white text-emerald-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-50 transition-colors">
            了解詳情
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MenuItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 rounded-xl">
          {icon}
        </div>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );
}
