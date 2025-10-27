import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Componente para atualizar a visualização do mapa quando a posição muda
function SetViewOnChange({ coords }) {
  const map = useMap();
  map.setView(coords, map.getZoom());
  return null;
}

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState([51.505, -0.09]); // Posição padrão
  const [isOnline, setIsOnline] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [earnings, setEarnings] = useState({ today: 'R$ 0,00', week: 'R$ 0,00', total: 'R$ 0,00' });
  const [rideStatus, setRideStatus] = useState('idle'); // idle, requested, accepted, active, completed

  useEffect(() => {
    // Carregar dados do usuário e perfil do motorista
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Buscar perfil do motorista
          const { data: driverData, error } = await supabase
            .from('motoristas')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (error) throw error;
          setDriverProfile(driverData);
        }
        
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
    
    // Simular ganhos do motorista
    setEarnings({
      today: 'R$ 75,00',
      week: 'R$ 320,50',
      total: 'R$ 1.250,00'
    });
  }, []);

  // Atualizar status de disponibilidade do motorista
  const toggleAvailability = () => {
    setIsOnline(!isOnline);
    
    // Se ficar online, simular solicitações de corrida após alguns segundos
    if (!isOnline) {
      setTimeout(() => {
        if (isOnline) {
          simulateRideRequest();
        }
      }, 10000);
    } else {
      // Se ficar offline, limpar solicitações pendentes
      setRideRequests([]);
    }
  };

  // Simular solicitação de corrida
  const simulateRideRequest = () => {
    const newRequest = {
      id: Math.floor(Math.random() * 1000),
      passengerName: 'Maria Santos',
      origin: 'Av. Paulista, 1000',
      destination: 'Shopping Ibirapuera',
      distance: '5.2 km',
      estimatedPrice: 'R$ 18,50',
      estimatedTime: '15 min'
    };
    
    setRideRequests([newRequest]);
  };

  // Aceitar solicitação de corrida
  const acceptRideRequest = (request) => {
    setCurrentRide(request);
    setRideStatus('accepted');
    setRideRequests([]);
    
    // Simular chegada ao local de embarque
    setTimeout(() => {
      setRideStatus('active');
    }, 5000);
  };

  // Rejeitar solicitação de corrida
  const rejectRideRequest = (requestId) => {
    setRideRequests(rideRequests.filter(req => req.id !== requestId));
  };

  // Finalizar corrida
  const finishRide = () => {
    setRideStatus('completed');
    
    // Atualizar ganhos
    const rideValue = parseFloat(currentRide.estimatedPrice.replace('R$ ', '').replace(',', '.'));
    setEarnings(prev => ({
      today: `R$ ${(parseFloat(prev.today.replace('R$ ', '').replace(',', '.')) + rideValue).toFixed(2).replace('.', ',')}`,
      week: `R$ ${(parseFloat(prev.week.replace('R$ ', '').replace(',', '.')) + rideValue).toFixed(2).replace('.', ',')}`,
      total: `R$ ${(parseFloat(prev.total.replace('R$ ', '').replace('.', '').replace(',', '.')) + rideValue).toFixed(2).replace('.', ',')}`
    }));
    
    // Resetar após alguns segundos
    setTimeout(() => {
      setRideStatus('idle');
      setCurrentRide(null);
      setIsOnline(true);
      
      // Simular nova solicitação após um tempo
      setTimeout(() => {
        if (isOnline) {
          simulateRideRequest();
        }
      }, 15000);
    }, 5000);
  };

  // Atualizar posição periodicamente quando em corrida
  useEffect(() => {
    let interval;
    
    if (rideStatus === 'active') {
      interval = setInterval(() => {
        // Simular movimento do motorista
        setPosition(prev => [
          prev[0] + (Math.random() * 0.0005 - 0.00025),
          prev[1] + (Math.random() * 0.0005 - 0.00025)
        ]);
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rideStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Olá, {user?.user_metadata?.full_name || 'Motorista'}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden h-[60vh]">
          <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={position}>
              <Popup>
                Sua localização atual
              </Popup>
            </Marker>
            <SetViewOnChange coords={position} />
            
            {currentRide && rideStatus === 'active' && (
              <Marker position={[position[0] + 0.002, position[1] - 0.003]}>
                <Popup>
                  {currentRide.passengerName} - Destino: {currentRide.destination}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        
        {/* Painel lateral */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Status de disponibilidade */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Status</h2>
              <div className="relative inline-block w-12 align-middle select-none">
                <input
                  type="checkbox"
                  name="toggle"
                  id="toggle"
                  checked={isOnline}
                  onChange={toggleAvailability}
                  disabled={rideStatus !== 'idle' && rideStatus !== 'completed'}
                  className="sr-only"
                />
                <label
                  htmlFor="toggle"
                  className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                    isOnline ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                      isOnline ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            <p className={`mt-2 ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {isOnline ? 'Você está online e disponível para corridas' : 'Você está offline'}
            </p>
          </div>
          
          {/* Resumo de ganhos */}
          {rideStatus === 'idle' && (
            <div className="mb-6 border-t border-gray-200 pt-4">
              <h2 className="text-lg font-semibold mb-3">Seus ganhos</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">Hoje</p>
                  <p className="font-bold text-lg">{earnings.today}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">Semana</p>
                  <p className="font-bold text-lg">{earnings.week}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="font-bold text-lg">{earnings.total}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Solicitações de corrida */}
          {isOnline && rideRequests.length > 0 && rideStatus === 'idle' && (
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-lg font-semibold mb-3">Nova solicitação de corrida</h2>
              {rideRequests.map(request => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">{request.passengerName}</h3>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">{request.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex">
                      <div className="mr-2 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Origem</p>
                        <p className="text-sm">{request.origin}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="mr-2 mt-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Destino</p>
                        <p className="text-sm">{request.destination}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                    <div>
                      <p className="text-xs text-gray-500">Distância</p>
                      <p className="font-medium">{request.distance}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Valor estimado</p>
                      <p className="font-medium">{request.estimatedPrice}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => rejectRideRequest(request.id)}
                      className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                    >
                      Recusar
                    </button>
                    <button
                      onClick={() => acceptRideRequest(request)}
                      className="py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90"
                    >
                      Aceitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Corrida aceita */}
          {rideStatus === 'accepted' && currentRide && (
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-lg font-semibold mb-3">Corrida aceita</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">{currentRide.passengerName}</h3>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex">
                    <div className="mr-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Origem</p>
                      <p className="text-sm">{currentRide.origin}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center mt-4">
                  <div className="animate-pulse text-center mb-3">
                    <p className="text-primary font-medium">A caminho do passageiro...</p>
                    <p className="text-sm text-gray-600 mt-1">Chegada em aproximadamente 3 min</p>
                  </div>
                  <ShareRide 
                    rideId={currentRide.id}
                    origin={currentRide.origin}
                    destination={currentRide.destination}
                    driverName={user?.user_metadata?.name || 'Motorista Vium'}
                    vehicleInfo={driverProfile?.vehicle_model || 'Veículo Vium'}
                    estimatedPrice={parseFloat(currentRide.estimatedPrice.replace('R$ ', '').replace(',', '.'))}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Corrida em andamento */}
          {rideStatus === 'active' && currentRide && (
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-lg font-semibold mb-3">Corrida em andamento</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">{currentRide.passengerName}</h3>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex">
                    <div className="mr-2 mt-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Destino</p>
                      <p className="text-sm">{currentRide.destination}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-3 pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Distância</p>
                      <p className="font-medium">{currentRide.distance}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Valor estimado</p>
                      <p className="font-medium">{currentRide.estimatedPrice}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-4">
                  <div className="text-center">
                    <p className="text-primary font-medium">Viagem em andamento</p>
                    <p className="text-sm text-gray-600 mt-1">Tempo estimado: 15 min</p>
                  </div>
                  <ShareRide 
                    rideId={currentRide.id}
                    origin={currentRide.origin}
                    destination={currentRide.destination}
                    driverName={user?.user_metadata?.name || 'Motorista Vium'}
                    vehicleInfo={driverProfile?.vehicle_model || 'Veículo Vium'}
                    estimatedPrice={parseFloat(currentRide.estimatedPrice.replace('R$ ', '').replace(',', '.'))}
                  />
                  <button
                    onClick={finishRide}
                    className="w-full py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90"
                  >
                    Finalizar corrida
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Corrida finalizada */}
          {rideStatus === 'completed' && currentRide && (
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-lg font-semibold mb-3">Corrida finalizada</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-medium mt-2">Corrida finalizada com sucesso!</h3>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Valor da corrida:</span>
                    <span className="font-bold text-lg">{currentRide.estimatedPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}