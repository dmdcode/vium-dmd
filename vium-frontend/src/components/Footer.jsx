import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white shadow-inner py-4 mt-8">
      <div className="container mx-auto px-4 text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} Vium. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}