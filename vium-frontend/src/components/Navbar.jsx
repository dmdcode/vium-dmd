import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, signOut } from '../lib/supabase';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary">
                Vium
              </Link>
            </div>
          </div>
          
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary">
              Início
            </Link>
            
            {user ? (
              <>
                {user.user_metadata?.tipo === 'passageiro' && (
                  <Link to="/passenger" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary">
                    Dashboard
                  </Link>
                )}
                
                {user.user_metadata?.tipo === 'motorista' && (
                  <Link to="/driver" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary">
                    Dashboard
                  </Link>
                )}
                
                {user.user_metadata?.tipo === 'admin' && (
                  <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary">
                    Admin
                  </Link>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary">
                Entrar
              </Link>
            )}
          </div>
          
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Abrir menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu móvel */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </Link>
            
            {user ? (
              <>
                {user.user_metadata?.tipo === 'passageiro' && (
                  <Link 
                    to="/passenger" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                
                {user.user_metadata?.tipo === 'motorista' && (
                  <Link 
                    to="/driver" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                
                {user.user_metadata?.tipo === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}