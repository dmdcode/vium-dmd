import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import L from 'leaflet';

// Corrigir o problema dos ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function ShareView() {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [rideStatus, setRideStatus] = useState('ativa');
  const [driverLocation, setDriverLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([-23.5505, -46.6333]); // São Paulo como padrão

  useEffect(() => {
    // Carregar dados do compartilhamento
    async function loadShareData() {
      try {
        const { data, error } = await supabase
          .from('compartilhamentos')
          .select('*')
          .eq('id', shareId)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          setError('Link de compartilhamento inválido ou expirado.');
          setLoading(false);
          return;
        }
        
        // Verificar se o link expirou
        if (new Date(data.expira_em) < new Date()) {
          setError('Este link de compartilhamento expirou.');
          setLoading(false);
          return;
        }
        
        setShareData(data);
        
        // Carregar dados da corrida
        const { data: rideData, error: rideError } = await supabase
          .from('corridas')
          .select('*')
          .eq('id', data.corrida_id)
          .single();
          
        if (rideError && rideError.code !== 'PGRST116') {
          console.error('Erro ao carregar dados da corrida:', rideError);
        }
        
        if (rideData) {
          setRideStatus(rideData.status);
          
          // Definir localização inicial do motorista (simulado)
          if (rideData.origem_coords) {
            try {
              const originCoords = JSON.parse(rideData.origem_coords);
              setDriverLocation([originCoords.lat, originCoords.lng]);
              setMapCenter([originCoords.lat, originCoords.lng]);
            } catch (e) {
              console.error('Erro ao processar coordenadas:', e);
            }
          }
        }
        
        // Configurar atualização em tempo real da posição do motorista
        setupRealtimeUpdates(data.corrida_id);
      } catch (err) {
        console.error('Erro ao carregar dados do compartilhamento:', err);
        setError('Não foi possível carregar os dados da viagem compartilhada.');
      } finally {
        setLoading(false);
      }
    }
    
    loadShareData();
    
    // Limpar inscrição ao desmontar
    return () => {
      supabase.removeAllChannels();
    };
  }, [shareId]);
  
  // Configurar atualizações em tempo real
  const setupRealtimeUpdates = (rideId) => {
    const channel = supabase
      .channel(`ride-updates-${rideId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'corridas',
        filter: `id=eq.${rideId}`
      }, (payload) => {
        // Atualizar status da corrida
        if (payload.new.status) {
          setRideStatus(payload.new.status);
        }
        
        // Atualizar localização do motorista (simulado)
        if (payload.new.motorista_coords) {
          try {
            const coords = JSON.parse(payload.new.motorista_coords);
            setDriverLocation([coords.lat, coords.lng]);
          } catch (e) {
            console.error('Erro ao processar coordenadas do motorista:', e);
          }
        }
      })
      .subscribe();
      
    return channel;
  };
  
  // Simular movimento do motorista para demonstração
  useEffect(() => {
    if (!driverLocation || rideStatus !== 'ativa') return;
    
    const interval = setInterval(() => {
      // Simular movimento aleatório
      setDriverLocation(prev => {
        if (!prev) return prev;
        
        return [
          prev[0] + (Math.random() * 0.001 - 0.0005),
          prev[1] + (Math.random() * 0.001 - 0.0005)
        ];
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [driverLocation, rideStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md w-full">
          <h2 className="text-lg font-medium mb-2">Erro</h2>
          <p>{error}</p>
        </div>
        <a href="/" className="mt-4 text-primary hover:underline">
          Voltar para a página inicial
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-primary text-white px-6 py-4">
          <h1 className="text-xl font-bold">Acompanhamento de viagem</h1>
          <p className="text-sm opacity-90">Vium - Compartilhamento de corrida</p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className={`h-3 w-3 rounded-full mr-2 ${
              rideStatus === 'ativa' ? 'bg-green-500 animate-pulse' : 
              rideStatus === 'concluida' ? 'bg-blue-500' : 
              'bg-gray-500'
            }`}></div>
            <span className="font-medium">
              {rideStatus === 'ativa' ? 'Viagem em andamento' : 
               rideStatus === 'concluida' ? 'Viagem concluída' : 
               'Viagem cancelada'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Detalhes da viagem</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Origem</p>
                  <p className="font-medium">{shareData.origem}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Destino</p>
                  <p className="font-medium">{shareData.destino}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Motorista</p>
                  <p className="font-medium">{shareData.motorista}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Veículo</p>
                  <p className="font-medium">{shareData.veiculo}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Valor estimado</p>
                  <p className="font-medium">R$ {shareData.valor_estimado.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium mb-4">Localização atual</h2>
              
              {driverLocation ? (
                <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                  <MapContainer 
                    center={driverLocation} 
                    zoom={15} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {driverLocation && (
                      <Marker position={driverLocation}>
                        <Popup>
                          {shareData.motorista} está aqui
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              ) : (
                <div className="h-64 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50">
                  <p className="text-gray-500">Localização não disponível</p>
                </div>
              )}
            </div>
          </div>
          
          {rideStatus === 'ativa' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
              <p className="text-sm">
                Esta página será atualizada automaticamente com a localização do motorista durante a viagem.
              </p>
            </div>
          )}
          
          {rideStatus === 'concluida' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <p className="text-sm">
                Esta viagem foi concluída com sucesso!
              </p>
            </div>
          )}
          
          {rideStatus === 'cancelada' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">
                Esta viagem foi cancelada.
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <a href="/" className="text-primary hover:underline text-sm">
              Conheça o Vium
            </a>
            <p className="text-xs text-gray-500">
              Link válido até {new Date(shareData.expira_em).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}