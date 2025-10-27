import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { BASE_URL } from '../lib/env';

export default function ShareRide({ rideId, origin, destination, driverName, vehicleInfo, estimatedPrice }) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Gerar link de compartilhamento
  const generateShareLink = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Criar um registro de compartilhamento no banco de dados
      const { data, error } = await supabase
        .from('compartilhamentos')
        .insert({
          corrida_id: rideId,
          origem: origin,
          destino: destination,
          motorista: driverName,
          veiculo: vehicleInfo,
          valor_estimado: estimatedPrice,
          expira_em: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expira em 24 horas
        })
        .select('id')
        .single();
        
      if (error) throw error;
      
      // Criar o link de compartilhamento com o ID gerado
      const shareUrl = `${BASE_URL}/share/${data.id}`;
      setShareLink(shareUrl);
      setIsOpen(true);
    } catch (err) {
      console.error('Erro ao gerar link de compartilhamento:', err);
      setError('Não foi possível gerar o link de compartilhamento. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar link para a área de transferência
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Erro ao copiar para a área de transferência:', err);
        setError('Não foi possível copiar o link. Tente copiar manualmente.');
      });
  };

  // Compartilhar via WhatsApp
  const shareViaWhatsApp = () => {
    const message = `Acompanhe minha viagem no Vium! Origem: ${origin}, Destino: ${destination}. ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div>
      {/* Botão de compartilhamento */}
      <button
        onClick={generateShareLink}
        disabled={isGenerating}
        className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
      >
        {isGenerating ? (
          <div className="flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            <span>Gerando...</span>
          </div>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            <span>Compartilhar corrida</span>
          </>
        )}
      </button>

      {/* Modal de compartilhamento */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Compartilhar corrida</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Compartilhe este link para que outras pessoas possam acompanhar sua viagem em tempo real. O link expira em 24 horas.
                </p>
                
                <div className="flex items-center mb-4">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                  >
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    </svg>
                    WhatsApp
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.share({
                        title: 'Acompanhe minha viagem no Vium',
                        text: `Origem: ${origin}, Destino: ${destination}`,
                        url: shareLink
                      }).catch(err => console.error('Erro ao compartilhar:', err));
                    }}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    Compartilhar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}