import React, { useState, useEffect } from 'react';
import { 
    PhoneCall, Thermometer, Sun, Cloud, CloudRain, 
    CloudLightning, Wind, CalendarDays, Languages, Volume2,
    FileText, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { UserLocation, WeatherData, Activity } from '../types';
import { PRONUNCIATIONS, DATE_OF_VISIT } from '../constants';

interface GuideProps {
    userLocation: UserLocation | null;
    itinerary: Activity[];
}

const Guide: React.FC<GuideProps> = ({ userLocation, itinerary }) => {
    const [playing, setPlaying] = useState<string | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loadingWeather, setLoadingWeather] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const response = await fetch(
                'https://api.open-meteo.com/v1/forecast?latitude=44.41&longitude=8.92&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FRome'
                );
                const data = await response.json();
                setWeather({
                    hourly: {
                        time: data.hourly.time,
                        temperature: data.hourly.temperature_2m,
                        code: data.hourly.weathercode
                    },
                    daily: {
                        time: data.daily.time,
                        weathercode: data.daily.weathercode,
                        temperature_2m_max: data.daily.temperature_2m_max,
                        temperature_2m_min: data.daily.temperature_2m_min
                    }
                });
            } catch (error) {
                console.error("Clima error:", error);
            } finally {
                setLoadingWeather(false);
            }
        };
        fetchWeather();
    }, []);

    const getWeatherIcon = (code: number, size = 20) => {
        if (code <= 1) return <Sun size={size} className="text-amber-500" />;
        if (code <= 3) return <Cloud size={size} className="text-slate-400" />;
        if (code <= 67) return <CloudRain size={size} className="text-blue-500" />;
        if (code <= 99) return <CloudLightning size={size} className="text-purple-500" />;
        return <Wind size={size} className="text-slate-400" />;
    };

    const play = (word: string) => {
        const ut = new SpeechSynthesisUtterance(word);
        ut.lang = 'it-IT';
        ut.onend = () => setPlaying(null);
        setPlaying(word);
        window.speechSynthesis.speak(ut);
    };

    const handleSOS = () => {
        const msg = `¡SOS! Necesito ayuda en Génova. Ubicación: ${userLocation ? `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}` : 'GPS no disponible'}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric' }).format(date);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        let yPos = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;
        const colTime = 15;
        const colContent = 45;
        const maxWidth = 150;

        // Header
        doc.setFillColor(30, 58, 138); // blue-900
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("GÉNOVA 2026", margin, 18);
        doc.setFontSize(10);
        doc.text("GUÍA DE ESCALA & ITINERARIO", margin, 24);
        doc.text(DATE_OF_VISIT, 160, 18);

        yPos = 40;
        doc.setTextColor(0, 0, 0);

        itinerary.forEach((item, index) => {
            // Page Break Check
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
            }

            // Time Column
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(30, 58, 138);
            doc.text(item.startTime, colTime, yPos);
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(item.endTime, colTime, yPos + 5);

            // Timeline Line
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(colTime + 15, yPos + 2, colTime + 15, yPos + 20);
            doc.circle(colTime + 15, yPos - 1, 1.5, 'F');

            // Content Column
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(item.title, colContent, yPos);
            yPos += 5;

            // Location
            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(item.locationName, colContent, yPos);
            yPos += 5;

            // Description
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            const descLines = doc.splitTextToSize(item.description, maxWidth);
            doc.text(descLines, colContent, yPos);
            yPos += (descLines.length * 4);

            // Key Details
            if (item.keyDetails) {
                yPos += 2;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(180, 83, 9); // Amber
                const detailLines = doc.splitTextToSize(`Tip: ${item.keyDetails}`, maxWidth);
                doc.text(detailLines, colContent, yPos);
                yPos += (detailLines.length * 4);
            }

            // Spacing for next item
            yPos += 8;
        });

        // Footer
        const totalPages = doc.getNumberOfPages();
        for(let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${totalPages}`, 100, pageHeight - 10, { align: 'center' });
        }

        doc.save("Genova_2026_Itinerario.pdf");
    };

    return (
        <div className="pb-32 px-4 pt-6 max-w-lg mx-auto h-full overflow-y-auto no-scrollbar">
            <h2 className="text-2xl font-bold text-blue-900 mb-6 uppercase tracking-tight">Guía Superba</h2>
            
            <div className="flex gap-4 mb-6">
                <button 
                    onClick={handleDownloadPDF}
                    className="flex-1 bg-blue-900 text-white rounded-2xl p-4 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <div className="bg-white/20 p-2 rounded-full"><FileText size={20} /></div>
                    <div className="text-left">
                        <span className="block text-[10px] uppercase opacity-70 font-bold tracking-widest">Descargar</span>
                        <span className="block text-sm font-black">ITINERARIO PDF</span>
                    </div>
                </button>
            </div>

            <div className="mb-8 bg-rose-700 rounded-[2rem] p-6 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center mb-3">
                        <PhoneCall size={24} className="mr-3 animate-pulse" />
                        <h3 className="font-black text-lg uppercase tracking-widest">ASISTENCIA SOS</h3>
                    </div>
                    <p className="text-xs text-rose-50 mb-6 leading-relaxed">Envía tu ubicación exacta por WhatsApp si te has desorientado en los caruggi.</p>
                    <button onClick={handleSOS} className="w-full py-4 bg-white text-rose-700 font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Enviar Localización</button>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <Thermometer size={20} className="text-blue-700"/>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">Clima Génova</h3>
                </div>

                {loadingWeather ? (
                        <div className="h-24 bg-white rounded-3xl animate-pulse border border-blue-50"></div>
                ) : weather ? (
                    <>
                    {/* Hourly Forecast */}
                    <div className="bg-white p-2 pb-5 rounded-[2.5rem] border border-blue-50 shadow-xl overflow-hidden mb-4">
                        <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-widest text-center mt-2 mb-2">Hoy</h4>
                        <div className="flex overflow-x-auto custom-h-scrollbar gap-3 px-6 py-2 items-stretch">
                            {weather.hourly.time.map((time, i) => {
                                const date = new Date(time);
                                const hour = date.getHours();
                                const now = new Date();
                                const diffMs = date.getTime() - now.getTime();
                                const diffHrs = diffMs / (1000 * 60 * 60);
                                
                                if (diffHrs >= -1 && diffHrs <= 12) {
                                    return (
                                        <div key={time} className="flex flex-col items-center justify-between min-w-[70px] p-3 bg-blue-50/50 rounded-3xl border border-blue-100">
                                            <span className="text-[10px] font-black text-blue-400 mb-2">{hour}:00</span>
                                            <div className="p-2 bg-white rounded-2xl mb-2 shadow-sm">{getWeatherIcon(weather.hourly.code[i], 24)}</div>
                                            <span className="text-base font-black text-blue-900 tracking-tighter">{Math.round(weather.hourly.temperature[i])}°</span>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>

                    {/* 5 Day Forecast */}
                    <div className="bg-white rounded-[2rem] border border-blue-50 shadow-lg p-5">
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <CalendarDays size={16} className="text-blue-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximos 5 días</span>
                        </div>
                        <div className="space-y-1">
                            {weather.daily.time.slice(0, 5).map((day, i) => (
                            <div key={day} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <span className="w-16 text-xs font-bold text-slate-600 capitalize">{formatDate(day)}</span>
                                <div className="flex items-center gap-3">
                                    {getWeatherIcon(weather.daily.weathercode[i], 18)}
                                </div>
                                <div className="flex items-center gap-3 w-20 justify-end">
                                    <span className="text-xs font-bold text-slate-800">{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                                    <span className="text-xs font-medium text-slate-400">{Math.round(weather.daily.temperature_2m_min[i])}°</span>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                    </>
                ) : null}
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center uppercase tracking-widest px-1">
                <Languages size={20} className="mr-2.5 text-blue-700"/> Italiano Básico
            </h3>
            <div className="bg-white rounded-3xl shadow-md border border-blue-50 overflow-hidden mb-12">
                {PRONUNCIATIONS.map((item, idx) => (
                    <div key={idx} className="p-5 flex justify-between items-center border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors group">
                        <div>
                            <div className="flex items-center gap-3">
                                <p className="font-black text-blue-950 text-lg tracking-tight">{item.word}</p>
                                <button onClick={() => play(item.word)} className={`p-2 rounded-full transition-all ${playing === item.word ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                                    <Volume2 size={16} className={playing === item.word ? 'animate-pulse' : ''} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 italic mt-1 font-medium tracking-tight">"{item.simplified}"</p>
                        </div>
                        <div className="text-right ml-4">
                            <p className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase border border-blue-100 tracking-tighter">{item.meaning}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Guide;