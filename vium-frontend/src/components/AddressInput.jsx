import { useState, useRef } from 'react';

export default function AddressInput({ label, value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  const handleInput = async (e) => {
    const query = e.target.value;
    onChange(query);

    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=br&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' }, signal: controller.signal });
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Autocomplete falhou:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const pickSuggestion = (s) => {
    onChange(s.display_name);
    setSuggestions([]);
  };

  return (
    <div className="mb-4 relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
        value={value}
        onChange={handleInput}
        placeholder={`Digite ${label.toLowerCase()}...`}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-2 top-2 text-gray-400 text-xs">buscando...</div>
      )}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-200 rounded-md w-full mt-1 max-h-40 overflow-y-auto shadow">
          {suggestions.map((s, i) => (
            <li
              key={`${s.place_id}-${i}`}
              onClick={() => pickSuggestion(s)}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}