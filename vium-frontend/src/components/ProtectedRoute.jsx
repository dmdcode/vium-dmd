import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

export default function ProtectedRoute({ user, userType, children }) {
  // Se não há usuário autenticado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se um tipo específico de usuário é requerido e o usuário não corresponde
  if (userType && user.user_metadata?.tipo !== userType) {
    // Se o usuário não tem tipo definido, redireciona para escolher tipo
    if (!user.user_metadata?.tipo) {
      return <Navigate to="/user-type" replace />;
    }
    
    // Se o usuário é motorista mas não está aprovado, redireciona para página de espera
    if (userType === 'motorista' && user.user_metadata?.tipo === 'motorista' && !user.user_metadata?.aprovado) {
      return <Navigate to="/driver/pending" replace />;
    }
    
    // Redireciona para o dashboard apropriado do tipo de usuário
    return <Navigate to={`/${user.user_metadata?.tipo}`} replace />;
  }

  // Se tudo estiver ok, renderiza o conteúdo protegido
  return children;
}

ProtectedRoute.propTypes = {
  user: PropTypes.object,
  userType: PropTypes.string,
  children: PropTypes.node.isRequired
};