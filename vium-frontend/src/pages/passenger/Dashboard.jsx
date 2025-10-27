import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabase';
import L from 'leaflet';
import ShareRide from '../../components/ShareRide';
import AddressInput from '../../components/AddressInput';

// Corrigindo o problema dos ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function PassengerDashboard() {
  const mapRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState([51.505, -0.09]); // Posição padrão
  const [hasUserLocation, setHasUserLocation] = useState(false);
  const [geoPermission, setGeoPermission] = useState('prompt');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [rideStatus, setRideStatus] = useState('idle'); // idle, searching, confirmed, active, completed
  const [toast, setToast] = useState(null); // { message, type }

  useEffect(() => {
    // Carregar dados do usuário
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();

    // Verificar permissão de geolocalização (para ocultar botão quando já concedida)
    if (navigator.permissions && navigator.permissions.query) {
      try {
        navigator.permissions.query({ name: 'geolocation' }).then((status) => {
          setGeoPermission(status.state);
          status.onchange = () => setGeoPermission(status.state);
        }).catch(() => {});
      } catch (_) {}
    }
  }, []);

  // Solicitar geolocalização apenas em resposta a gesto do usuário
  function requestUserLocation() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setPosition(coords);
          setHasUserLocation(true);
          
          // Centralizar mapa na localização do usuário com flyTo
          if (mapRef.current) {
            mapRef.current.flyTo(coords, 15, {
              animate: true,
              duration: 1.5
            });
          }
          
          // Feedback visual
          showToast('Localização atual definida', 'success');

          resolve(coords);
        },
        (err) => {
          console.error('Erro ao obter localização:', err);
          showToast('Não foi possível obter sua localização', 'error');
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // Calcular distância entre dois pontos usando fórmula de Haversine
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }

  // Centralizar mapa para mostrar origem e destino
  function centerMapOnRoute(originCoords, destinationCoords) {
    if (mapRef.current && originCoords && destinationCoords) {
      const bounds = L.latLngBounds([originCoords, destinationCoords]);
      mapRef.current.fitBounds(bounds, {
        padding: [20, 20],
        animate: true,
        duration: 1.5
      });
    }
  }

  // Toast utilitário
  function showToast(message, type = 'info') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  // Simular busca de motoristas próximos
  const searchNearbyDrivers = () => {
    setRideStatus('searching');
    
    // Simulação de motoristas próximos
    setTimeout(() => {
      const mockDrivers = [
        {
          id: 1,
          name: 'Carlos Silva',
          vehicle: 'Honda Civic Preto',
          distance: '2.5 km',
          rating: 4.8,
          eta: '5 min',
          price: 'R$ 12,50'
        },
        {
          id: 2,
          name: 'Ana Oliveira',
          vehicle: 'Toyota Corolla Prata',
          distance: '3.2 km',
          rating: 4.9,
          eta: '7 min',
          price: 'R$ 15,00'
        },
        {
          id: 3,
          name: 'Roberto Santos',
          vehicle: 'Hyundai HB20 Branco',
          distance: '1.8 km',
          rating: 4.7,
          eta: '3 min',
          price: 'R$ 11,00'
        }
      ];
      
      setAvailableDrivers(mockDrivers);
      setRideStatus('idle');
      showToast('Motoristas próximos encontrados', 'success');
    }, 2000);
  };

  const confirmRide = (driver) => {
    setSelectedDriver(driver);
    setRideStatus('confirmed');
    showToast('Corrida confirmada!', 'success');
    
    // Simulação de início de corrida após confirmação
    setTimeout(() => {
      setRideStatus('active');
      showToast('Corrida iniciada', 'info');
    }, 3000);
  };

  const finishRide = () => {
    setRideStatus('completed');
    showToast('Corrida finalizada', 'success');
  };

  const startNewRide = () => {
    setRideStatus('idle');
    setSelectedDriver(null);
    setDestination('');
    setOrigin('');
    setOriginCoords(null);
    setDestinationCoords(null);
    setRouteCoords(null);
    setRouteError(null);
    setAvailableDrivers([]);
  };

  // Geocodificar endereço usando Nominatim (OpenStreetMap)
  async function geocodeAddress(query, opts = {}) {
    const q = (query || '').trim();
    const countrycodes = opts.countrycodes || 'br';
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=1&countrycodes=${countrycodes}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' } });
    if (!res.ok) throw new Error('Falha ao geocodificar');
    const data = await res.json();
    if (!data || data.length === 0) throw new Error('Endereço não encontrado');
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    return { lat, lon };
  }

  // Tenta interpretar entrada "lat, lon"
  function parseLatLon(input) {
    if (!input) return null;
    const m = input.trim().match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (!m) return null;
    const lat = parseFloat(m[1]);
    const lon = parseFloat(m[2]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { lat, lon };
  }

  // Traçar rota entre origem e destino usando OSRM
  async function drawRoute() {
    try {
      setRouteError(null);
      setLoadingRoute(true);
      setRouteDistance(null);
      const originTrim = (origin || '').trim();
      const destTrim = (destination || '').trim();

      if (!destTrim) {
        throw new Error('Informe o destino');
      }

      // Origem: usa localização atual se vazio
      let from;
      if (!originTrim) {
        // Se ainda não coletamos a localização via gesto, solicitar agora (clique do botão)
        if (!hasUserLocation) {
          const coords = await requestUserLocation();
          from = { lat: coords[0], lon: coords[1] };
        } else if (position && Array.isArray(position)) {
          from = { lat: position[0], lon: position[1] };
        } else {
          throw new Error('Origem não definida; clique em "Usar minha localização" ou informe um endereço');
        }
      } else {
        const parsed = parseLatLon(originTrim);
        from = parsed ? { lat: parsed.lat, lon: parsed.lon } : await geocodeAddress(originTrim);
      }

      // Destino: aceita "lat, lon" ou geocodifica
      const parsedDest = parseLatLon(destTrim);
      const to = parsedDest ? { lat: parsedDest.lat, lon: parsedDest.lon } : await geocodeAddress(destTrim);

      setOriginCoords([from.lat, from.lon]);
      setDestinationCoords([to.lat, to.lon]);

      // Calcular distância entre origem e destino
      const distance = calculateDistance(from.lat, from.lon, to.lat, to.lon);
      setRouteDistance(distance);

      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
      const res = await fetch(routeUrl);
      if (!res.ok) throw new Error('Falha ao calcular rota');
      const json = await res.json();
      if (!json.routes || json.routes.length === 0) throw new Error('Rota não encontrada');
      const coords = json.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      setRouteCoords(coords);
      showToast('Rota calculada', 'success');
      
      // Centralizar mapa para mostrar origem e destino
      centerMapOnRoute([from.lat, from.lon], [to.lat, to.lon]);
      
    } catch (e) {
      console.error('Erro ao traçar rota:', e);
      setRouteError(e.message || 'Erro ao traçar rota');
      showToast(e.message || 'Erro ao traçar rota', 'error');
    } finally {
      setLoadingRoute(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Cabeçalho minimalista oculto em mobile */}
      <div className="hidden md:flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Olá, {user?.user_metadata?.full_name || 'Passageiro'}</h1>
      </div>
      
      {/* Container do mapa com overlays (estilo Uber) */}
      <div className="relative rounded-xl overflow-hidden shadow-md">
        <div className="h-[76vh] w-full">
          <MapContainer 
            center={position} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={position}>
              <Popup>
                Sua localização atual
              </Popup>
            </Marker>

            {originCoords && (
              <Marker position={[originCoords[0], originCoords[1]]}>
                <Popup>Origem</Popup>
              </Marker>
            )}
            {destinationCoords && (
              <Marker position={[destinationCoords[0], destinationCoords[1]]}>
                <Popup>Destino</Popup>
              </Marker>
            )}
            {routeCoords && (
              <Polyline 
                positions={routeCoords} 
                pathOptions={{ color: '#3B82F6', weight: 5 }}
                className={rideStatus === 'active' ? 'route-animated' : ''}
              />
            )}
            
            {selectedDriver && rideStatus === 'active' && (
              <Marker position={[position[0] + 0.002, position[1] + 0.002]}>
                <Popup>
                  {selectedDriver.name} - {selectedDriver.vehicle}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Toasts */}
        {toast && (
          <div className="fade-in absolute top-20 right-5 z-[1000]">
            <div className={`${toast.type === 'error' ? 'bg-red-600' : toast.type === 'success' ? 'bg-green-600' : 'bg-gray-900'} text-white px-4 py-2 rounded-lg shadow`}>
              {toast.message}
            </div>
          </div>
        )}

        {/* Barra superior flutuante */}
        <div className="fade-in absolute top-4 left-4 right-4 flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h7l2 2h9M5 17h14a2 2 0 002-2V9a2 2 0 00-2-2H7l-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </div>
            <span className="font-semibold">Vium</span>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100" aria-label="Menu">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>

        {/* Painel inferior (bottom sheet) */}
        <div className="slide-up absolute bottom-4 left-4 right-4 z-[500]">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-5">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 20.5l-7.5-7.5-7.5 7.5"/></svg>
                <span className="text-sm text-gray-700 font-medium">Origem</span>
              </div>
              <AddressInput label="Origem" value={origin} onChange={setOrigin} />
              {!(geoPermission === 'granted' && hasUserLocation) && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await requestUserLocation();
                      setRouteError(null);
                    } catch (e) {
                      setRouteError('Não foi possível obter sua localização.');
                    }
                  }}
                  className="w-full py-2 px-4 rounded-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Usar minha localização
                </button>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7l-2 5h4l-2 5"/></svg>
                <span className="text-sm text-gray-700 font-medium">Destino</span>
              </div>
              <AddressInput label="Destino" value={destination} onChange={setDestination} />

              {routeError && (
                <div className="text-red-600 text-sm">{routeError}</div>
              )}
              {routeDistance && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                    <span className="text-blue-800 font-medium">
                      Distância: {routeDistance.toFixed(2)} km
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={async () => { if (rideStatus !== 'searching') { await drawRoute(); searchNearbyDrivers(); } }}
                disabled={!destination || loadingRoute || rideStatus === 'searching'}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition ${
                  destination && !loadingRoute && rideStatus !== 'searching' ? 'bg-secondary text-white hover:bg-secondary/90 shadow-sm' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {rideStatus === 'searching' ? 'Buscando motoristas...' : (loadingRoute ? 'Calculando trajeto...' : 'Buscar Corrida')}
              </button>
            </div>

            {rideStatus === 'idle' && availableDrivers.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Motoristas próximos</h2>
                <div className="space-y-3 max-h-[28vh] overflow-auto pr-1">
                  {availableDrivers.map(driver => (
                    <div key={driver.id} className="border border-gray-200 rounded-xl p-3 hover:border-primary hover:shadow-md active:shadow-sm active:scale-[0.99] transition transition-transform">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-100 mr-3 overflow-hidden"></div>
                          <div>
                            <h3 className="font-medium">{driver.name}</h3>
                            <p className="text-sm text-gray-600">{driver.vehicle}</p>
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                              <span className="ml-1">{driver.rating}</span>
                              <span className="ml-3">{driver.distance}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{driver.price}</p>
                          <p className="text-sm text-gray-600">{driver.eta}</p>
                          <button
                            onClick={() => confirmRide(driver)}
                            className="mt-2 bg-primary text-white text-sm py-1.5 px-3 rounded-full hover:bg-primary/90 shadow-sm"
                          >
                            Selecionar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rideStatus === 'confirmed' && selectedDriver && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Corrida confirmada!</h2>
                <div className="flex justify-center">
                <div className="spinner"></div>
                </div>
                <p className="text-center text-gray-600">
                  {selectedDriver.name} está a caminho!<br />
                  Tempo estimado: {selectedDriver.eta}
                </p>
              </div>
            )}
            
            {rideStatus === 'active' && selectedDriver && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Corrida em andamento</h2>
                <div className="border border-gray-200 rounded-md p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedDriver.name}</h3>
                    <p className="text-sm text-gray-600">{selectedDriver.vehicle}</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Preço estimado:</span>
                    <span className="font-medium">{selectedDriver.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tempo estimado:</span>
                    <span className="font-medium">15 min</span>
                  </div>
                </div>
                <button
                  onClick={finishRide}
                  className="w-full mt-4 bg-primary text-white py-2 px-4 rounded-md font-medium hover:bg-primary/90"
                >
                  Finalizar corrida
                </button>
              </div>
              <div>
                <ShareRide 
                  rideId={1} // Simulado - em produção seria o ID real da corrida
                  origin="Minha localização atual"
                  destination={destination}
                  driverName={selectedDriver.name}
                  vehicleInfo={selectedDriver.vehicle}
                  estimatedPrice={parseFloat(selectedDriver.price.replace('R$ ', '').replace(',', '.'))}
                />
              </div>
              </div>
            )}
            
            {rideStatus === 'completed' && selectedDriver && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Corrida finalizada</h2>
                <div className="border border-gray-200 rounded-md p-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-center font-medium mb-4">Obrigado por viajar conosco!</h3>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Motorista:</span>
                    <span className="font-medium">{selectedDriver.name}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Veículo:</span>
                    <span className="font-medium">{selectedDriver.vehicle}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Valor total:</span>
                    <span className="font-medium">{selectedDriver.price}</span>
                  </div>
                </div>
                <button
                  onClick={startNewRide}
                  className="w-full mt-4 bg-primary text-white py-2 px-4 rounded-md font-medium hover:bg-primary/90"
                >
                  Nova corrida
                </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}