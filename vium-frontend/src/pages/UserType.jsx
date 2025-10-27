import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function UserType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleUserTypeSelection = async (tipo) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Atualiza os metadados do usuário com o tipo selecionado
      const { error: updateError } = await supabase.auth.updateUser({
        data: { tipo }
      });
      
      if (updateError) throw updateError;
      
      // Cria ou atualiza o registro do usuário na tabela users
      const { error: insertError } = await supabase
        .from('users')
        .upsert({ 
          id: user.id, 
          nome: user.user_metadata?.full_name || user.email,
          email: user.email,
          tipo
        });
      
      if (insertError) throw insertError;
      
      // Redireciona com base no tipo selecionado
      if (tipo === 'passageiro') {
        navigate('/passenger');
      } else if (tipo === 'motorista') {
        navigate('/driver/register');
      }
      
    } catch (err) {
      console.error('Erro ao selecionar tipo de usuário:', err);
      setError('Falha ao configurar sua conta. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Como você deseja usar o Vium?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Escolha uma opção para continuar
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleUserTypeSelection('passageiro')}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {loading ? 'Processando...' : 'Sou Passageiro'}
          </button>
          
          <button
            onClick={() => handleUserTypeSelection('motorista')}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          >
            {loading ? 'Processando...' : 'Sou Motorista'}
          </button>
          
          <div className="text-sm text-center mt-6">
            <p className="text-gray-500">
              Você poderá alterar esta opção posteriormente nas configurações da sua conta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}