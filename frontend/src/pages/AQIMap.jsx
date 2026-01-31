import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AQIMap = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('28.4,76.8,28.9,77.4|New Delhi');

  const cityBounds = [
    { value: '28.4,76.8,28.9,77.4|New Delhi', label: 'New Delhi' },
    { value: '18.8,72.7,19.3,73.0|Mumbai', label: 'Mumbai' },
    { value: '22.4,88.2,22.7,88.5|Kolkata', label: 'Kolkata' },
    { value: '12.8,77.4,13.2,77.8|Bangalore', label: 'Bangalore' },
    { value: '12.9,80.1,13.2,80.4|Chennai', label: 'Chennai' },
    { value: '17.2,78.3,17.6,78.6|Hyderabad', label: 'Hyderabad' }
  ];

  useEffect(() => {
    // Load Leaflet CSS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    // Load Leaflet JS
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.async = true;

    leafletScript.onload = () => {
      // Load Leaflet Heat plugin
      const heatScript = document.createElement('script');
      heatScript.src = 'https://leaflet.github.io/Leaflet.heat/dist/leaflet-heat.js';
      heatScript.async = true;

      heatScript.onload = () => {
        initializeMap();
      };

      document.body.appendChild(heatScript);
    };

    document.body.appendChild(leafletScript);

    return () => {
      // Cleanup
      if (leafletCSS.parentNode) leafletCSS.parentNode.removeChild(leafletCSS);
      if (leafletScript.parentNode) leafletScript.parentNode.removeChild(leafletScript);
    };
  }, []);

  const initializeMap = () => {
    if (!window.L || !mapRef.current) return;

    const map = window.L.map(mapRef.current, { zoomControl: true }).setView([28.61, 77.20], 11);
    
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

    window.mapInstance = map;
    window.allStationData = [];
    window.heatLayer = null;
    window.markersGroup = window.L.layerGroup().addTo(map);

    setLoading(false);
    handleCityChange(selectedCity);
  };

  const getStatusColor = (aqi) => {
    if (aqi <= 50) return "#00ff00";
    if (aqi <= 100) return "#ffff00";
    if (aqi <= 200) return "#ff7e00";
    if (aqi <= 300) return "#ff0000";
    return "#8f3f97";
  };

  const handleCityChange = async (cityValue) => {
    setSelectedCity(cityValue);
    if (!window.mapInstance || !window.L) return;

    const [boundsStr, cityName] = cityValue.split('|');
    const bounds = boundsStr.split(',').map(Number);
    const center = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
    
    window.mapInstance.flyTo(center, 12, { animate: true, duration: 1.5 });

    try {
      const TOKEN = '0a7700e810b5e17011b2773dcb559a6cbec692a0';
      const url = `https://api.waqi.info/map/bounds/?latlng=${bounds.join(',')}&token=${TOKEN}`;
      const res = await fetch(url);
      const result = await res.json();

      if (result.status === "ok") {
        window.allStationData = result.data;
        setTimeout(() => renderData(window.allStationData, null), 1000);
      }
    } catch (err) {
      console.error('Failed to fetch AQI data:', err);
    }
  };

  const renderData = (dataList, filterColor) => {
    if (!window.L || !window.mapInstance) return;

    if (window.heatLayer) window.mapInstance.removeLayer(window.heatLayer);
    window.markersGroup.clearLayers();

    let heatPoints = [];
    let currentGradient = filterColor ? 
      { 0.1: filterColor, 0.5: filterColor, 1.0: filterColor } : 
      { 0.2: '#00ff00', 0.4: '#ffff00', 0.6: '#ff7e00', 1.0: '#ff0000' };

    dataList.forEach(s => {
      const aqi = parseInt(s.aqi);
      if (!isNaN(aqi)) {
        const color = getStatusColor(aqi);
        heatPoints.push([s.lat, s.lon, 1.0]);

        const m = window.L.circleMarker([s.lat, s.lon], {
          radius: 8, color: color, fillColor: color, fillOpacity: 0.8, weight: 2
        });

        m.bindTooltip(
          `<b>${s.station.name}</b><br><span style="color:${color}; font-weight:bold;">AQI: ${aqi}</span>`,
          { sticky: true, className: 'leaflet-tooltip-district' }
        );
        window.markersGroup.addLayer(m);
      }
    });

    window.heatLayer = window.L.heatLayer(heatPoints, {
      radius: 45, blur: 25, max: 1.0, gradient: currentGradient
    }).addTo(window.mapInstance);
  };

  const filterMap = (min, max, color) => {
    if (!window.allStationData) return;

    const filtered = window.allStationData.filter(s => {
      const val = parseInt(s.aqi);
      return val >= min && val <= max;
    });
    renderData(filtered, color);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        .leaflet-tooltip-district {
          background: rgba(0,0,0,0.9) !important;
          color: white !important;
          border: 1px solid #444 !important;
          border-radius: 8px !important;
        }
        .filter-seg {
          flex: 1;
          height: 100%;
          transition: 0.3s;
          opacity: 1;
          cursor: pointer;
        }
        .filter-seg:hover {
          opacity: 1;
          transform: scaleY(1.2);
        }
      `}</style>

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/citizen-dashboard')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Air Quality Index Map</h1>
                <p className="text-blue-100 text-sm">Real-time AQI data across major cities</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-50">
            <div className="text-center text-white">
              <Loader className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p className="text-lg">Loading AQI Map...</p>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="absolute top-5 right-5 z-[1000] bg-gray-900/95 text-white p-5 rounded-xl w-72 border border-gray-700 shadow-2xl backdrop-blur-sm">
          <h2 className="text-xl font-bold text-cyan-400 mb-3">FixMyCity AI</h2>
          
          <p className="text-xs text-gray-400 mb-2">Select Region:</p>
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 text-cyan-400 border border-gray-600 rounded-lg font-semibold cursor-pointer outline-none hover:border-cyan-400 transition-colors"
          >
            {cityBounds.map((city) => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </select>

          <p className="text-xs text-gray-400 mt-4 mb-2">Filter by AQI Level:</p>
          <div className="flex h-6 rounded-lg overflow-hidden border border-gray-800">
            <div
              className="filter-seg"
              style={{ background: '#00ff00' }}
              onClick={() => filterMap(0, 50, '#00ff00')}
              title="Good (0-50)"
            />
            <div
              className="filter-seg"
              style={{ background: '#ffff00' }}
              onClick={() => filterMap(51, 100, '#ffff00')}
              title="Moderate (51-100)"
            />
            <div
              className="filter-seg"
              style={{ background: '#ff7e00' }}
              onClick={() => filterMap(101, 200, '#ff7e00')}
              title="Unhealthy (101-200)"
            />
            <div
              className="filter-seg"
              style={{ background: '#ff0000' }}
              onClick={() => filterMap(201, 300, '#ff0000')}
              title="Hazardous (201-300)"
            />
            <div
              className="filter-seg"
              style={{ background: '#8f3f97' }}
              onClick={() => filterMap(301, 999, '#8f3f97')}
              title="Toxic (300+)"
            />
          </div>

          <button
            onClick={() => filterMap(0, 999, null)}
            className="w-full mt-4 px-4 py-2 bg-transparent text-cyan-400 border border-cyan-400 rounded-lg font-semibold hover:bg-cyan-400 hover:text-black transition-all"
          >
            VIEW ALL REGIONS
          </button>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-2">AQI Scale:</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: '#00ff00' }}></div>
                <span>Good (0-50)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: '#ffff00' }}></div>
                <span>Moderate (51-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: '#ff7e00' }}></div>
                <span>Unhealthy (101-200)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: '#ff0000' }}></div>
                <span>Hazardous (201-300)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: '#8f3f97' }}></div>
                <span>Toxic (300+)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div
          ref={mapRef}
          className="w-full h-full bg-gray-900"
          style={{ zIndex: 1 }}
        />
      </div>
    </div>
  );
};

export default AQIMap;
