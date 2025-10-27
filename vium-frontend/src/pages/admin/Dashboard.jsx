export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Painel Administrativo</h1>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-3">Visão geral</h2>
          <p className="text-gray-600">Em breve: gerenciamento de motoristas, corridas e relatórios.</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-3">Status do sistema</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Frontend rodando com Vite</li>
            <li>Integração com Supabase configurada</li>
            <li>Tailwind CSS operacional</li>
          </ul>
        </div>
      </div>
    </div>
  );
}