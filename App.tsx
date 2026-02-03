import React, { useState, useEffect } from 'react';
import { 
    CalendarClock, Map as MapIcon, Wallet, BookOpen, Anchor, 
    X, Play, Square, Headphones 
} from 'lucide-react';
import { Activity, UserLocation, Coords } from './types';
import { INITIAL_ITINERARY, SHIP_ONBOARD_TIME } from './constants';
import Timeline from './components/Timeline';
import MapComponent from './components/MapComponent';
import Guide from './components/Guide';

const App: React.FC = () => {
    const [itinerary, setItinerary] = useState<Activity[]>(INITIAL_ITINERARY);
    const [activeTab, setActiveTab] = useState<'timeline' | 'map' | 'budget' | 'guide'>('timeline');
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [mapFocus, setMapFocus] = useState<Coords | null>(null);
    const [countdown, setCountdown] = useState('--h --m --s');
    const [audioGuideActivity, setAudioGuideActivity] = useState<Activity | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const [h, m] = SHIP_ONBOARD_TIME.split(':').map(Number);
            const target = new Date();
            target.setHours(h, m, 0, 0);
            const diff = target.getTime() - now.getTime();
            if (diff <= 0) setCountdown("¡A BORDO!");
            else {
                const hr = Math.floor(diff / 3600000);
                const mn = Math.floor((diff % 3600000) / 60000);
                const sc = Math.floor((diff % 60000) / 1000);
                setCountdown(`${hr.toString().padStart(2,'0')}h ${mn.toString().padStart(2,'0')}m ${sc.toString().padStart(2,'0')}s`);
            }
        }, 1000);
        
        if ('geolocation' in navigator) {
            navigator.geolocation.watchPosition(pos => {
            setUserLocation({ 
                lat: pos.coords.latitude, 
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy 
            });
            }, null, { enableHighAccuracy: true });
        }

        return () => clearInterval(timer);
    }, []);

    const handlePlayAudio = () => {
        if (!audioGuideActivity?.audioGuideText) return;
        
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else {
            const utterance = new SpeechSynthesisUtterance(audioGuideActivity.audioGuideText);
            utterance.lang = 'es-ES';
            utterance.rate = 0.95;
            utterance.onend = () => setIsPlaying(false);
            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900 font-['Roboto_Condensed']">
            <header className="bg-blue-950 text-white p-4 shadow-xl z-20 flex justify-between items-center shrink-0 border-b border-white/5">
                <div className="flex items-center"><Anchor className="mr-3 text-amber-500" size={24} /><div><h1 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-300">Escala Génova</h1><p className="text-[12px] font-bold text-white/90 leading-tight">14 Abril 2026</p></div></div>
                <div className="text-right shrink-0">
                    <span className="text-[8px] font-black uppercase text-amber-400 tracking-widest block mb-0.5">Límite Embarque</span>
                    <div className="text-lg font-black font-mono text-white leading-none tracking-tighter">{countdown}</div>
                </div>
            </header>
            <main className="flex-1 relative overflow-hidden">
                {activeTab === 'timeline' && <div className="h-full overflow-y-auto no-scrollbar"><Timeline itinerary={itinerary} userLocation={userLocation} onToggleComplete={(id) => setItinerary(itinerary.map(a => a.id === id ? {...a, completed: !a.completed} : a))} onLocate={c => {setMapFocus(c); setActiveTab('map');}} onOpenAudioGuide={(act) => setAudioGuideActivity(act)} onImageClick={(url) => setFullScreenImage(url)} /></div>}
                {activeTab === 'map' && <MapComponent activities={itinerary} userLocation={userLocation} focusedLocation={mapFocus} />}
                {activeTab === 'budget' && (
                    <div className="p-8 text-center text-slate-400 h-full flex flex-col items-center justify-center">
                        <Wallet size={48} className="mb-4 text-blue-100" />
                        <p className="font-bold uppercase tracking-widest text-xs">Escala Gratuita</p>
                        <p className="text-[10px] uppercase mt-1 opacity-60">Génova es accesible a pie</p>
                    </div>
                )}
                {activeTab === 'guide' && <Guide userLocation={userLocation} />}

                {audioGuideActivity && (
                    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                            <div className="bg-blue-100 p-3 rounded-2xl border border-blue-200">
                                <Headphones size={24} className="text-blue-700" />
                            </div>
                            <button onClick={() => { window.speechSynthesis.cancel(); setIsPlaying(false); setAudioGuideActivity(null); }} className="text-slate-300 hover:text-slate-600 transition-colors">
                                <X size={28} />
                            </button>
                            </div>
                            
                            <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Audioguía</h3>
                            <h4 className="text-xl font-black text-slate-800 mb-6 leading-tight">{audioGuideActivity.title}</h4>
                            
                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-h-scrollbar mb-8">
                            <p className="text-slate-600 leading-relaxed font-medium italic">
                                {audioGuideActivity.audioGuideText}
                            </p>
                            </div>
            
                            <div className="flex gap-4">
                            <button 
                                onClick={handlePlayAudio}
                                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 ${
                                isPlaying ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-blue-900 text-white shadow-blue-200'
                                }`}
                            >
                                {isPlaying ? <Square size={18} fill="white" /> : <Play size={18} fill="white" />}
                                {isPlaying ? 'Detener' : 'Escuchar'}
                            </button>
                            </div>
                        </div>
                        </div>
                    </div>
                    )}

                {fullScreenImage && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setFullScreenImage(null)}>
                    <button className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors p-2 bg-white/10 rounded-full">
                        <X size={32} />
                    </button>
                    <img 
                        src={fullScreenImage} 
                        alt="Full screen" 
                        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
                    />
                    </div>
                )}
            </main>
            <nav className="bg-white border-t h-20 flex justify-around items-center px-2 pb-safe shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-30">
                {[
                    { id: 'timeline', icon: CalendarClock, label: 'Itinerario' },
                    { id: 'map', icon: MapIcon, label: 'Mapa' },
                    { id: 'budget', icon: Wallet, label: 'Gastos' },
                    { id: 'guide', icon: BookOpen, label: 'Guía' }
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex flex-col items-center w-full transition-all ${activeTab === t.id ? 'text-blue-900' : 'text-slate-300'}`}>
                    <div className={`p-2 rounded-xl mb-1 ${activeTab === t.id ? 'bg-blue-50 shadow-sm' : ''}`}><t.icon size={22} /></div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${activeTab === t.id ? 'opacity-100' : 'opacity-60'}`}>{t.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default App;