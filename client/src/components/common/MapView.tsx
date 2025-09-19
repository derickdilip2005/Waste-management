import React, { useState, useEffect, useRef } from 'react';
import { Report } from '../../types';

interface MapViewProps {
  reports?: Report[];
  showHeatmap?: boolean;
  showUserLocation?: boolean;
  onReportClick?: (report: Report) => void;
  height?: string;
  className?: string;
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'report' | 'hotspot' | 'user';
  data?: any;
}

const MapView: React.FC<MapViewProps> = ({
  reports = [],
  showHeatmap = false,
  showUserLocation = true,
  onReportClick,
  height = '400px',
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default to NYC

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (reports.length > 0) {
      updateMarkersFromReports();
    }
  }, [reports]);

  const initializeMap = async () => {
    try {
      setLoading(true);
      
      // Get user location if enabled
      if (showUserLocation) {
        await getCurrentLocation();
      }
      
      // For now, we'll create a simple map visualization
      // In a real implementation, you would integrate with Google Maps, Mapbox, or Leaflet
      setLoading(false);
    } catch (err) {
      setError('Failed to initialize map');
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
          resolve();
        },
        (error) => {
          console.warn('Failed to get user location:', error);
          resolve(); // Don't reject, just continue without user location
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  const updateMarkersFromReports = () => {
    const reportMarkers: MapMarker[] = reports
      .filter(report => report.location?.coordinates)
      .map(report => ({
        id: report._id,
        lat: report.location.coordinates[1],
        lng: report.location.coordinates[0],
        type: 'report' as const,
        data: report
      }));

    let allMarkers = [...reportMarkers];

    if (userLocation) {
      allMarkers.push({
        id: 'user-location',
        lat: userLocation.lat,
        lng: userLocation.lng,
        type: 'user' as const
      });
    }

    setMarkers(allMarkers);
  };

  const getMarkerColor = (marker: MapMarker) => {
    switch (marker.type) {
      case 'user':
        return 'bg-blue-500';
      case 'hotspot':
        return 'bg-red-500';
      case 'report':
        const report = marker.data as Report;
        switch (report.status) {
          case 'submitted':
            return 'bg-yellow-500';
          case 'verified':
            return 'bg-blue-500';
          case 'assigned':
            return 'bg-purple-500';
          case 'in_progress':
            return 'bg-orange-500';
          case 'completed':
            return 'bg-green-500';
          case 'rejected':
            return 'bg-red-500';
          default:
            return 'bg-gray-500';
        }
      default:
        return 'bg-gray-500';
    }
  };

  const getMarkerIcon = (marker: MapMarker) => {
    switch (marker.type) {
      case 'user':
        return '📍';
      case 'hotspot':
        return '🔥';
      case 'report':
        return '🗑️';
      default:
        return '📌';
    }
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    if (marker.type === 'report' && onReportClick && marker.data) {
      onReportClick(marker.data);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col justify-center items-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <div className="text-4xl mb-4">🗺️</div>
        <p className="text-gray-600 text-center">{error}</p>
        <button
          onClick={initializeMap}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {/* Simple Map Visualization */}
      <div ref={mapRef} className="w-full h-full relative">
        {/* Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
          {/* Grid pattern to simulate map */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ccc" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Markers */}
        <div className="absolute inset-0">
          {markers.map((marker, index) => {
            // Simple positioning based on lat/lng (not accurate projection)
            const x = ((marker.lng - mapCenter.lng + 0.1) / 0.2) * 100;
            const y = ((mapCenter.lat - marker.lat + 0.1) / 0.2) * 100;
            
            // Keep markers within bounds
            const clampedX = Math.max(5, Math.min(95, x));
            const clampedY = Math.max(5, Math.min(95, y));

            return (
              <div
                key={marker.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `${clampedX}%`,
                  top: `${clampedY}%`
                }}
                onClick={() => handleMarkerClick(marker)}
              >
                <div className={`w-8 h-8 rounded-full ${getMarkerColor(marker)} flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform`}>
                  <span className="text-sm">{getMarkerIcon(marker)}</span>
                </div>
                {selectedMarker?.id === marker.id && (
                  <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 min-w-48 z-10">
                    <div className="text-sm">
                      {marker.type === 'user' && (
                        <div>
                          <div className="font-semibold text-blue-600">Your Location</div>
                          <div className="text-gray-600">Current position</div>
                        </div>
                      )}
                      {marker.type === 'report' && marker.data && (
                        <div>
                          <div className="font-semibold text-gray-900">{marker.data.wasteType}</div>
                          <div className="text-gray-600 mb-2">{marker.data.description}</div>
                          <div className="flex justify-between items-center text-xs">
                            <span className={`px-2 py-1 rounded-full ${
                              marker.data.status === 'completed' ? 'bg-green-100 text-green-800' :
                              marker.data.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                              marker.data.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {marker.data.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {userLocation && (
                              <span className="text-gray-500">
                                {calculateDistance(
                                  userLocation.lat,
                                  userLocation.lng,
                                  marker.lat,
                                  marker.lng
                                ).toFixed(1)}km away
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          {showUserLocation && (
            <button
              onClick={getCurrentLocation}
              className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              title="Center on my location"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3">
          <div className="text-sm font-semibold text-gray-900 mb-2">Legend</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>Pending Reports</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Completed</span>
            </div>
            {userLocation && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>Your Location</span>
              </div>
            )}
          </div>
        </div>

        {/* Click outside to close marker popup */}
        {selectedMarker && (
          <div
            className="absolute inset-0 z-0"
            onClick={() => setSelectedMarker(null)}
          />
        )}
      </div>

      {/* Map Stats */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3">
        <div className="text-sm">
          <div className="font-semibold text-gray-900">Map Overview</div>
          <div className="text-gray-600 mt-1">
            {markers.filter(m => m.type === 'report').length} reports shown
          </div>
          {userLocation && (
            <div className="text-gray-600">
              Centered on your location
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;