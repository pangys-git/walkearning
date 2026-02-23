import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Map as MapIcon, Navigation, Sparkles, Loader2, Info } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '1.5rem'
};

const defaultCenter = {
  lat: 22.2819,
  lng: 114.1880 // Victoria Park
};

interface Waypoint {
  name: string;
  lat: number;
  lng: number;
  description: string;
}

interface RouteData {
  routeName: string;
  description: string;
  waypoints: Waypoint[];
}

export default function PlanView() {
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [preferences, setPreferences] = useState({
    age: 65,
    height: 165,
    desiredSteps: 7000,
    start: '香港維多利亞公園',
    theme: '歷史文化',
    mobility: '一般 (無限制)',
  });

  // Map state
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Calculate distance and duration
  const stepLength = preferences.height * 0.415; // cm
  const distanceKm = (stepLength * preferences.desiredSteps) / 100000; // km
  const walkingSpeedKmH = preferences.age > 60 ? 3.5 : 4.5; // km/h
  const durationMin = (distanceKm / walkingSpeedKmH) * 60; // minutes

  const generateRoute = async () => {
    setLoading(true);
    setRouteData(null);
    setDirections(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        你是一個專業的香港導遊與路線規劃專家。
        請根據以下條件，為我規劃一條散步路線：
        - 出發地：${preferences.start}
        - 主題：${preferences.theme}
        - 行動便利度：${preferences.mobility}
        - 預計行走距離：約 ${distanceKm.toFixed(2)} 公里
        - 預計時長：約 ${durationMin.toFixed(0)} 分鐘

        請提供一條包含 3-5 個景點的路線，並回傳 JSON 格式。
        必須包含精確的經緯度 (lat, lng)。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              routeName: { type: Type.STRING, description: "路線名稱" },
              description: { type: Type.STRING, description: "路線整體描述與注意事項" },
              waypoints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "景點名稱" },
                    lat: { type: Type.NUMBER, description: "緯度" },
                    lng: { type: Type.NUMBER, description: "經度" },
                    description: { type: Type.STRING, description: "景點特色介紹" }
                  },
                  required: ["name", "lat", "lng", "description"]
                }
              }
            },
            required: ["routeName", "description", "waypoints"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}') as RouteData;
      setRouteData(data);
    } catch (error) {
      console.error(error);
      alert('發生錯誤，請檢查網路連線或 API Key。');
    } finally {
      setLoading(false);
    }
  };

  const calculateDirections = useCallback(() => {
    if (!routeData || routeData.waypoints.length < 2 || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    const origin = { lat: routeData.waypoints[0].lat, lng: routeData.waypoints[0].lng };
    const destination = { 
      lat: routeData.waypoints[routeData.waypoints.length - 1].lat, 
      lng: routeData.waypoints[routeData.waypoints.length - 1].lng 
    };
    
    const waypoints = routeData.waypoints.slice(1, -1).map(wp => ({
      location: { lat: wp.lat, lng: wp.lng },
      stopover: true
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`error fetching directions ${result}`);
        }
      }
    );
  }, [routeData]);

  useEffect(() => {
    if (routeData && isLoaded) {
      calculateDirections();
    }
  }, [routeData, isLoaded, calculateDirections]);

  const toggleNavigation = () => {
    if (isNavigating) {
      // Stop navigation
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsNavigating(false);
      setUserLocation(null);
    } else {
      // Start navigation
      if ('geolocation' in navigator) {
        setIsNavigating(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            alert('無法獲取您的位置，請確認已開啟定位權限。');
            setIsNavigating(false);
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      } else {
        alert('您的瀏覽器不支援 GPS 定位功能。');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-emerald-900">AI 智能路線規劃</h2>
        </div>
        <p className="text-emerald-700 text-sm mb-6">
          告訴我你的身體狀況與目標，AI 將為你量身打造專屬的散步微旅行！
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">年齡</label>
              <input 
                type="number" 
                value={preferences.age}
                onChange={(e) => setPreferences({...preferences, age: Number(e.target.value)})}
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">身高 (cm)</label>
              <input 
                type="number" 
                value={preferences.height}
                onChange={(e) => setPreferences({...preferences, height: Number(e.target.value)})}
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">期望行走步數</label>
            <input 
              type="number" 
              value={preferences.desiredSteps}
              onChange={(e) => setPreferences({...preferences, desiredSteps: Number(e.target.value)})}
              className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            />
          </div>

          {/* Estimation Display */}
          <div className="bg-white/60 p-4 rounded-xl border border-emerald-200/50 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-800">
              <p>根據您的身高與年齡估算：</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-emerald-700">
                <li>預計行走距離：<strong>{distanceKm.toFixed(2)} 公里</strong></li>
                <li>預計所需時間：<strong>{durationMin.toFixed(0)} 分鐘</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">出發地</label>
            <input 
              type="text" 
              value={preferences.start}
              onChange={(e) => setPreferences({...preferences, start: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">主題偏好</label>
              <select 
                value={preferences.theme}
                onChange={(e) => setPreferences({...preferences, theme: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option>歷史文化</option>
                <option>自然生態</option>
                <option>建築古蹟</option>
                <option>打卡熱點</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">行動便利度</label>
              <select 
                value={preferences.mobility}
                onChange={(e) => setPreferences({...preferences, mobility: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option>一般 (無限制)</option>
                <option>需平緩路線 (長者友善)</option>
                <option>無障礙 (輪椅/推車)</option>
              </select>
            </div>
          </div>

          <button 
            onClick={generateRoute}
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapIcon className="w-5 h-5" />}
            {loading ? '規劃中...' : '生成專屬路線'}
          </button>
        </div>
      </div>

      {routeData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">{routeData.routeName}</h3>
            <button 
              onClick={toggleNavigation}
              className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                isNavigating 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              <Navigation className="w-4 h-4" />
              {isNavigating ? '停止導航' : '開始導航'}
            </button>
          </div>
          <p className="text-sm text-gray-600">{routeData.description}</p>

          {/* Google Map */}
          {isLoaded ? (
            <div className="mt-4 relative overflow-hidden rounded-2xl border border-gray-200 shadow-inner">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={routeData.waypoints[0] || defaultCenter}
                zoom={14}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                }}
              >
                {directions && (
                  <DirectionsRenderer 
                    directions={directions} 
                    options={{ suppressMarkers: true }}
                  />
                )}
                
                {routeData.waypoints.map((wp, index) => (
                  <Marker 
                    key={index} 
                    position={{ lat: wp.lat, lng: wp.lng }} 
                    label={{
                      text: (index + 1).toString(),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                    title={wp.name}
                  />
                ))}

                {userLocation && (
                  <Marker
                    position={userLocation}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: '#3b82f6',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                    }}
                    title="您的位置"
                  />
                )}
              </GoogleMap>
            </div>
          ) : (
            <div className="w-full h-[400px] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">
              載入地圖中...
            </div>
          )}

          {/* Waypoints List */}
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-gray-800">途經景點</h4>
            <div className="relative border-l-2 border-emerald-100 ml-3 space-y-6">
              {routeData.waypoints.map((wp, index) => (
                <div key={index} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-sm"></div>
                  <h5 className="font-bold text-gray-900">{wp.name}</h5>
                  <p className="text-sm text-gray-500 mt-1">{wp.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
