import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabase';
import L from 'leaflet';
import ShareRide from '../../components/ShareRide';

// Corrigindo o problema dos ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function PassengerDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState([51.505, -0.09]); // Posição padrão
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [rideStatus, setRideStatus] = useState('idle'); // idle, searching, confirmed, active, completed

  useEffect(() => {
    // Carregar dados do usuário
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Obter localização atual
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setPosition([position.coords.latitude, position.coords.longitude]);
          },
          (error) => {
            console.error("Erro ao obter localização:", error);
          }
        );
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

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
    }, 2000);
  };

  const confirmRide = (driver) => {
    setSelectedDriver(driver);
    setRideStatus('confirmed');
    
    // Simulação de início de corrida após confirmação
    setTimeout(() => {
      setRideStatus('active');
    }, 3000);
  };

  const finishRide = () => {
    setRideStatus('completed');
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
      const originTrim = (origin || '').trim();
      const destTrim = (destination || '').trim();

      if (!destTrim) {
        throw new Error('Informe o destino');
      }

      // Origem: usa localização atual se vazio
      let from;
      if (!originTrim) {
        if (position && Array.isArray(position)) {
          from = { lat: position[0], lon: position[1] };
        } else {
          throw new Error('Origem não definida; ative a localização ou informe um endereço');
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

      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
      const res = await fetch(routeUrl);
      if (!res.ok) throw new Error('Falha ao calcular rota');
      const json = await res.json();
      if (!json.routes || json.routes.length === 0) throw new Error('Rota não encontrada');
      const coords = json.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      setRouteCoords(coords);
      // Centraliza no ponto de origem
      setPosition([from.lat, from.lon]);
    } catch (e) {
      console.error('Erro ao traçar rota:', e);
      setRouteError(e.message || 'Erro ao traçar rota');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Olá, {user?.user_metadata?.full_name || 'Passageiro'}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden h-[60vh]">
          <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
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
              <Polyline positions={routeCoords} pathOptions={{ color: '#3B82F6', weight: 5 }} />
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
        
        {/* Painel lateral */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {rideStatus === 'idle' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Para onde vamos?</h2>
              <div>
                <label htmlFor="origin" className="block text-sm font-medium text-gray-700">Origem</label>
                <input
                  type="text"
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Digite o endereço de origem"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destino</label>
                <input
                  type="text"
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Digite o endereço de destino"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              {routeError && (
                <div className="text-red-600 text-sm">{routeError}</div>
              )}
              <button
                onClick={drawRoute}
                disabled={!destination || loadingRoute}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  destination && !loadingRoute ? 'bg-secondary text-white hover:bg-secondary/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loadingRoute ? 'Calculando trajeto...' : 'Mostrar trajeto'}
              </button>
              <button
                onClick={searchNearbyDrivers}
                disabled={!destination}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  destination ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Buscar motoristas
              </button>
            </div>
          )}
          
          {rideStatus === 'searching' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Buscando motoristas...</h2>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
              <p className="text-center text-gray-600">Procurando motoristas próximos a você</p>
            </div>
          )}
          
          {rideStatus === 'idle' && availableDrivers.length > 0 && (
            <div className="space-y-4 mt-6">
              <h2 className="text-xl font-semibold">Motoristas disponíveis</h2>
              <div className="space-y-3">
                {availableDrivers.map(driver => (
                  <div key={driver.id} className="border border-gray-200 rounded-md p-3 hover:border-primary">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{driver.name}</h3>
                        <p className="text-sm text-gray-600">{driver.vehicle}</p>
                        <div className="flex items-center mt-1">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm ml-1">{driver.rating}</span>
                          <span className="text-sm text-gray-500 ml-3">{driver.distance}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{driver.price}</p>
                        <p className="text-sm text-gray-600">{driver.eta}</p>
                        <button
                          onClick={() => confirmRide(driver)}
                          className="mt-2 bg-primary text-white text-sm py-1 px-3 rounded-md hover:bg-primary/90"
                        >
                          Escolher
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
  );
}