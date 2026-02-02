import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Activity, UserLocation, Coords } from '../types';
import { GPX_WAYPOINTS, GENOVA_TRACK } from '../constants';

interface MapComponentProps {
    activities: Activity[];
    userLocation: UserLocation | null;
    focusedLocation: Coords | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ activities, userLocation, focusedLocation }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const layersRef = useRef<L.Layer[]>([]);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const accuracyCircleRef = useRef<L.Circle | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([44.4107, 8.9328], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
        mapInstanceRef.current = map;
        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        
        // Clear existing markers
        layersRef.current.forEach(layer => layer.remove());
        layersRef.current = [];

        // Add Activity Markers
        activities.forEach(act => {
            // Fix icon if needed, but default markers usually work if CSS is loaded correctly. 
            // We use standard markers here.
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

        // Add Waypoints
        GPX_WAYPOINTS.forEach(wpt => {
            const circleMarker = L.circleMarker([wpt.lat, wpt.lng], {
                radius: 6, fillColor: "#BE123C", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8
            }).addTo(map);
            circleMarker.bindPopup(`<div style="font-family: 'Roboto Condensed', sans-serif; font-size: 12px; font-weight: bold; color: #BE123C;">${wpt.name}</div>`);
            layersRef.current.push(circleMarker);
        });

        // Add Track
        const polyline = L.polyline(GENOVA_TRACK, { color: '#1e3a8a', weight: 4, opacity: 0.7, dashArray: '8, 12' }).addTo(map);
        layersRef.current.push(polyline);
    }, [activities]);

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

    useEffect(() => {
        if (mapInstanceRef.current && focusedLocation) {
            mapInstanceRef.current.flyTo([focusedLocation.lat, focusedLocation.lng], 16);
        }
    }, [focusedLocation]);

    return <div ref={mapContainerRef} className="w-full h-full z-0" />;
};

export default MapComponent;