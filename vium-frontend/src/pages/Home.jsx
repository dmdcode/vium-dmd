import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Viagens seguras e confiáveis ao seu alcance
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Conectamos passageiros e motoristas em tempo real para uma experiência de transporte simples e eficiente.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center bg-white text-primary hover:bg-white/90 font-semibold px-6 py-3 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Sou Passageiro
                </Link>
                <Link
                  to="/driver/register"
                  className="inline-flex items-center justify-center bg-secondary text-white hover:bg-secondary/90 font-semibold px-6 py-3 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                >
                  Sou Motorista
                </Link>
              </div>
            </div>
            <div className="hidden md:block md:w-1/2">
              <img
                src="/hero-car.svg"
                alt="Carro Vium"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Como Funciona */}
      <div className="py-16 bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark">Como Funciona</h2>
            <p className="mt-4 text-lg text-gray-600">
              Simples, rápido e seguro
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Cadastre-se</h3>
              <p className="text-gray-600">
                Crie sua conta como passageiro ou motorista em poucos segundos usando sua conta Google.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Solicite uma viagem</h3>
              <p className="text-gray-600">
                Informe seu destino e escolha entre os motoristas disponíveis próximos a você.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Viaje com segurança</h3>
              <p className="text-gray-600">
                Acompanhe sua viagem em tempo real e compartilhe sua localização com quem desejar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Pronto para começar?
            </h2>
            <Link
              to="/login"
              className="inline-block bg-primary text-white hover:bg-primary/90 font-semibold px-8 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cadastre-se Agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}