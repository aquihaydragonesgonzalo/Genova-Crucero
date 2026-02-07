import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, X, Save } from 'lucide-react';
import { Activity, UserLocation, Coords, Waypoint } from '../types';
import { GPX_WAYPOINTS, GENOVA_TRACK } from '../constants';

interface MapComponentProps {
    activities: Activity[];
    userLocation: UserLocation | null;
    focusedLocation: Coords | null;
    customWaypoints: Waypoint[];
    onAddWaypoint: (name: string, description: string, lat: number, lng: number) => void;
    onDeleteWaypoint: (lat: number, lng: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
    activities, 
    userLocation, 
    focusedLocation,
    customWaypoints,
    onAddWaypoint,
    onDeleteWaypoint
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const layersRef = useRef<L.Layer[]>([]);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const accuracyCircleRef = useRef<L.Circle | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempCoords, setTempCoords] = useState<Coords | null>(null);
    const [pointName, setPointName] = useState('');
    const [pointDesc, setPointDesc] = useState('');

    // Initial Map Setup
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;
        
        // Define Base Layers
        const standardLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 20
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
        });

        // Initialize map with default layer
        const map = L.map(mapContainerRef.current, { 
            zoomControl: false,
            layers: [standardLayer] 
        }).setView([44.4107, 8.9328], 14);

        // Add Layer Control
        const baseMaps = {
            "Callejero": standardLayer,
            "Satélite": satelliteLayer
        };
        
        L.control.layers(baseMaps, undefined, { 
            position: 'topright',
            collapsed: true 
        }).addTo(map);

        mapInstanceRef.current = map;
        
        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Handle Map Interactions (Clicks)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const handleMapClick = (e: L.LeafletMouseEvent) => {
            setTempCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
            setPointName('');
            setPointDesc('');
            setIsModalOpen(true);
        };

        map.on('click', handleMapClick);

        return () => {
            map.off('click', handleMapClick);
        };
    }, []);

    const handleSavePoint = () => {
        if (pointName.trim() && tempCoords) {
            onAddWaypoint(pointName.trim(), pointDesc.trim(), tempCoords.lat, tempCoords.lng);
            setIsModalOpen(false);
            setTempCoords(null);
        }
    };

    // Render Markers (Activities + Custom + Tracks)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        
        // Clear existing markers
        layersRef.current.forEach(layer => layer.remove());
        layersRef.current = [];

        // 1. Add Activity Markers (Official Itinerary)
        activities.forEach(act => {
            const marker = L.marker([act.coords.lat, act.coords.lng]).addTo(map);
            marker.bindPopup(`
                <div style="padding: 10px; font-family: 'Roboto Condensed', sans-serif; max-width: 200px;">
                    <h3 style="margin: 0 0 4px 0; font-weight: bold; color: #1e3a8a; font-size: 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">${act.title}</h3>
                    <p style="margin: 6px 0; font-size: 11px; color: #1e3a8a; font-weight: bold;">${act.locationName}</p>
                    <p style="margin: 0 0 10px 0; font-size: 11px; color: #64748b; line-height: 1.4;">${act.description}</p>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${act.coords.lat},${act.coords.lng}" 
                        target="_blank" 
                        style="display: block; background: #1e3a8a; color: white; text-align: center; padding: 8px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 10px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        INDICACIONES (Google Maps)
                    </a>
                </div>
            `);
            layersRef.current.push(marker);
        });

        // 2. Add Custom User Waypoints
        const customIcon = L.divIcon({
            className: 'custom-waypoint-icon',
            html: `<div style="width: 20px; height: 20px; background: #8b5cf6; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        customWaypoints.forEach(wp => {
            const marker = L.marker([wp.lat, wp.lng], { icon: customIcon }).addTo(map);
            
            // Create DOM element for popup to handle click events
            const popupDiv = document.createElement('div');
            popupDiv.style.fontFamily = "'Roboto Condensed', sans-serif";
            popupDiv.style.textAlign = "center";
            popupDiv.style.minWidth = "150px";
            
            popupDiv.innerHTML = `
                <div style="font-weight: bold; color: #6d28d9; margin-bottom: 4px; font-size: 14px;">${wp.name}</div>
                ${wp.description ? `<div style="font-size: 11px; color: #475569; margin-bottom: 8px; line-height: 1.4; white-space: pre-wrap;">${wp.description}</div>` : ''}
                <div style="font-size: 9px; color: #94a3b8; font-style: italic; margin-bottom: 8px;">Tu marcador personal</div>
            `;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerText = "Eliminar Punto";
            deleteBtn.style.width = "100%";
            deleteBtn.style.background = "#fee2e2";
            deleteBtn.style.color = "#991b1b";
            deleteBtn.style.border = "none";
            deleteBtn.style.borderRadius = "6px";
            deleteBtn.style.padding = "6px 0";
            deleteBtn.style.fontSize = "10px";
            deleteBtn.style.fontWeight = "bold";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.textTransform = "uppercase";
            
            deleteBtn.onclick = () => {
                onDeleteWaypoint(wp.lat, wp.lng);
            };

            popupDiv.appendChild(deleteBtn);
            marker.bindPopup(popupDiv);
            layersRef.current.push(marker);
        });

        // 3. Add Predefined GPX Waypoints
        GPX_WAYPOINTS.forEach(wpt => {
            const circleMarker = L.circleMarker([wpt.lat, wpt.lng], {
                radius: 6, fillColor: "#BE123C", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8
            }).addTo(map);
            circleMarker.bindPopup(`<div style="font-family: 'Roboto Condensed', sans-serif; font-size: 12px; font-weight: bold; color: #BE123C;">${wpt.name}</div>`);
            layersRef.current.push(circleMarker);
        });

        // 4. Add Track Polyline
        const polyline = L.polyline(GENOVA_TRACK, { color: '#1e3a8a', weight: 4, opacity: 0.7, dashArray: '8, 12' }).addTo(map);
        layersRef.current.push(polyline);

    }, [activities, customWaypoints, onDeleteWaypoint]); // Re-run when activities or custom waypoints change

    // Update User Location
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !userLocation) return;
        
        const latLng = new L.LatLng(userLocation.lat, userLocation.lng);

        if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setLatLng(latLng);
            accuracyCircleRef.current.setRadius(userLocation.accuracy || 0);
        } else {
            accuracyCircleRef.current = L.circle(latLng, {
            radius: userLocation.accuracy || 0,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 1,
            dashArray: '5, 5'
            }).addTo(map);
        }

        if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(latLng);
        } else {
            const userIcon = L.divIcon({
            className: 'user-marker-container',
            html: `
                <div style="position: relative; width: 24px; height: 24px;">
                <div style="position: absolute; width: 100%; height: 100%; background: #3b82f6; border-radius: 50%; opacity: 0.4; animation: pulse-gps 2s infinite;"></div>
                <div style="position: absolute; width: 14px; height: 14px; background: #3b82f6; border-radius: 50%; border: 2px solid white; top: 5px; left: 5px; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>
                </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
            });
            userMarkerRef.current = L.marker(latLng, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        }
    }, [userLocation]);

    // Handle Focusing on specific location
    useEffect(() => {
        if (mapInstanceRef.current && focusedLocation) {
            mapInstanceRef.current.flyTo([focusedLocation.lat, focusedLocation.lng], 16);
        }
    }, [focusedLocation]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg z-[400] text-[10px] font-bold text-slate-500 border border-white/20 pointer-events-none">
                Toca el mapa para añadir un punto
            </div>

            {/* Modal for Adding Waypoint */}
            {isModalOpen && (
                <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center text-blue-900 gap-2">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <MapPin size={20} className="text-blue-600" />
                                </div>
                                <h3 className="font-bold text-lg">Nuevo Marcador</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre</label>
                                <input 
                                    type="text" 
                                    value={pointName}
                                    onChange={(e) => setPointName(e.target.value)}
                                    placeholder="Ej: Restaurante favorito"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
                                    autoFocus
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descripción (Opcional)</label>
                                <textarea 
                                    value={pointDesc}
                                    onChange={(e) => setPointDesc(e.target.value)}
                                    placeholder="Añade notas, detalles o recordatorios..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400 resize-none"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-slate-500 font-bold text-sm bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSavePoint}
                                    disabled={!pointName.trim()}
                                    className="flex-[2] py-3 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={16} />
                                    Guardar Punto
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapComponent;