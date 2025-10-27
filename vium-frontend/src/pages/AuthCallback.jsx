import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Processa o callback de autenticação
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data?.session?.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('tipo')
            .eq('id', data.session.user.id)
            .single();

          if (userError && userError.code !== 'PGRST116') {
            // PGRST116 é o código para "não encontrado", que é esperado para novos usuários
            console.error('Erro ao buscar dados do usuário:', userError);
          }

          // Se o usuário já tem um tipo definido, redireciona para o dashboard apropriado
          if (userData?.tipo) {
            navigate(`/${userData.tipo}`);
          } else {
            // Se não tem tipo definido, redireciona para escolher o tipo
            navigate('/user-type');
          }
        } else {
          // Se não há sessão, redireciona para login
          navigate('/login');
        }
      } catch (err) {
        console.error('Erro no callback de autenticação:', err);
        setError('Falha na autenticação. Por favor, tente novamente.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center mb-2">Erro de Autenticação</h2>
          <p className="text-gray-600 text-center">{error}</p>
          <p className="text-gray-500 text-center mt-4">Redirecionando para a página de login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Autenticando...</h2>
        <p className="text-gray-600">Por favor, aguarde enquanto processamos seu login.</p>
      </div>
    </div>
  );
}