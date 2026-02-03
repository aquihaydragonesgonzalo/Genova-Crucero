import React from 'react';
import { 
    CheckCircle2, Circle, MapPin, AlertTriangle, Clock, 
    Navigation, Headphones, Maximize2 
} from 'lucide-react';
import { Activity, Coords, UserLocation } from '../types';

interface TimelineProps {
    itinerary: Activity[];
    userLocation: UserLocation | null;
    onToggleComplete: (id: string) => void;
    onLocate: (coords: Coords) => void;
    onOpenAudioGuide: (activity: Activity) => void;
    onImageClick: (url: string) => void;
}

const calculateDuration = (startStr: string, endStr: string) => {
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    let diffMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMins < 0) diffMins += 24 * 60; 
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes} min`;
};

const formatGap = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
};

const calculateGap = (endStrPrev: string, startStrNext: string) => {
    const [endH, endM] = endStrPrev.split(':').map(Number);
    const [startH, startM] = startStrNext.split(':').map(Number);
    let diffMins = (startH * 60 + startM) - (endH * 60 + endM);
    if (diffMins < 0) diffMins += 24 * 60; 
    return diffMins;
};

const calculateTimeProgress = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const [endH, endM] = endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    if (currentMinutes < startMinutes) return 0;
    if (currentMinutes >= endMinutes) return 100;
    return Math.min(100, Math.max(0, ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100));
};

// Haversine formula for distance in meters
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
};

// Bearing calculation for direction arrow
const getBearing = (startLat: number, startLng: number, destLat: number, destLng: number) => {
  const startLatRad = startLat * (Math.PI / 180);
  const startLngRad = startLng * (Math.PI / 180);
  const destLatRad = destLat * (Math.PI / 180);
  const destLngRad = destLng * (Math.PI / 180);

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  const brngRad = Math.atan2(y, x);
  const brngDeg = (brngRad * 180) / Math.PI;

  return (brngDeg + 360) % 360; // Normalize to 0-360
};

const Timeline: React.FC<TimelineProps> = ({ itinerary, userLocation, onToggleComplete, onLocate, onOpenAudioGuide, onImageClick }) => {
    return (
        <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
            <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-blue-900 uppercase tracking-tight">Ruta Génova</h2>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md border border-blue-100">En Vivo</span>
            </div>
            <div className="relative border-l-2 border-blue-100 ml-3 space-y-8">
                {itinerary.map((act, idx) => {
                    const prevAct = idx > 0 ? itinerary[idx - 1] : null;
                    const gap = prevAct ? calculateGap(prevAct.endTime, act.startTime) : 0;
                    
                    const distance = userLocation ? getDistance(userLocation.lat, userLocation.lng, act.coords.lat, act.coords.lng) : null;
                    const bearing = userLocation ? getBearing(userLocation.lat, userLocation.lng, act.coords.lat, act.coords.lng) : 0;

                    return (
                        <React.Fragment key={act.id}>
                            {gap > 0 && (
                                <div className="mb-4 ml-6 flex items-center">
                                    <div className="bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-2 shadow-sm">
                                        <Clock size={10} className="text-blue-400" />
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">{formatGap(gap)} traslado / espera</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mb-8 ml-6 relative">
                                <div onClick={() => onToggleComplete(act.id)} className={`absolute -left-[31px] top-0 rounded-full bg-white border-2 cursor-pointer z-10 transition-transform active:scale-90 ${act.completed ? 'border-emerald-500 text-emerald-500 shadow-sm' : 'border-blue-700 text-blue-700 shadow-sm'}`}>
                                    {act.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </div>
                                <div className={`rounded-2xl border shadow-sm transition-all overflow-hidden bg-white ${act.notes === 'CRITICAL' ? 'border-rose-500 bg-rose-50' : act.completed ? 'opacity-70 border-emerald-500' : 'border-blue-50'}`}>
                                    <div className="w-full h-1.5 bg-blue-50 overflow-hidden"><div className={`h-full transition-all duration-1000 ${calculateTimeProgress(act.startTime, act.endTime) === 100 ? 'bg-slate-300' : 'bg-blue-800'}`} style={{ width: `${calculateTimeProgress(act.startTime, act.endTime)}%` }}></div></div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-tighter">{act.startTime} - {act.endTime}</span>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">{calculateDuration(act.startTime, act.endTime)}</span>
                                                </div>
                                                <h3 className="font-bold text-lg text-slate-800 leading-tight">{act.title}</h3>
                                            </div>
                                            {act.notes === 'CRITICAL' && <AlertTriangle className="text-rose-600 animate-pulse" size={20} />}
                                        </div>
                                        
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="text-sm text-slate-600 flex items-center flex-wrap gap-1 max-w-[70%]">
                                                <MapPin size={14} className="mr-0.5 text-blue-700"/> {act.locationName}
                                            </div>
                                            
                                            {distance !== null && !act.completed && (
                                                <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 text-blue-900 shadow-sm animate-in fade-in duration-500">
                                                    <Navigation 
                                                        size={12} 
                                                        className="text-blue-600 transition-all duration-700" 
                                                        style={{ transform: `rotate(${bearing}deg)` }} 
                                                    />
                                                    <span className="text-[10px] font-black tracking-tight">
                                                        {distance > 1000 
                                                            ? `${(distance / 1000).toFixed(1)} km` 
                                                            : `${Math.round(distance)} m`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {act.image && (
                                            <div className="relative mb-4 group cursor-pointer" onClick={() => act.image && onImageClick(act.image)}>
                                                <img 
                                                    src={act.image} 
                                                    alt={act.title} 
                                                    className="w-full aspect-video object-cover rounded-xl shadow-sm border border-slate-100 transition-transform group-hover:scale-[1.02]"
                                                    loading="lazy"
                                                />
                                                <div className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-lg shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Maximize2 size={14} className="text-blue-900" />
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-sm text-slate-600 mb-4 whitespace-pre-line leading-relaxed">{act.description}</p>
                                        <div className="bg-blue-50/50 p-3 rounded-xl text-sm italic border-l-4 border-amber-600 mb-4 text-blue-900 font-medium">"{act.keyDetails}"</div>
                                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-4 border-t border-slate-50">
                                            <button onClick={() => onLocate(act.coords)} className="flex items-center text-[10px] font-bold text-blue-900 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 shadow-sm active:bg-blue-100"><Navigation size={12} className="mr-1.5" /> UBICACIÓN</button>
                                            
                                            {act.audioGuideText && (
                                                <button onClick={() => onOpenAudioGuide(act)} className="flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 shadow-sm active:bg-amber-100"><Headphones size={12} className="mr-1.5" /> AUDIOGUÍA</button>
                                            )}

                                            <button onClick={() => onToggleComplete(act.id)} className={`ml-auto px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${act.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-900 text-white shadow-md active:scale-95'}`}>{act.completed ? 'Hecho' : 'Completar'}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default Timeline;