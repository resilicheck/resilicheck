'use client';

import { useState } from 'react';

// تعریف ساختار داده‌های ما (مطابق معماری)
interface KnowledgeItem {
  performance_value: string;
  product_name: string;
  manufacturer_name: string;
  hazard_name: string;
  hazard_type: string;
  be_name: string;
  be_type: string;
  cert_standard: string;
  cert_body: string;
  cert_status: string;
}

export default function SearchComponent({ initialData }: { initialData: KnowledgeItem[] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KnowledgeItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  // این تابع درخواست را به Agent می‌فرستد
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (data.error) {
        alert('Agent Error: ' + data.error);
      } else {
        setResults(data.data);
      }
    } catch (error) {
      alert('Connection to Agent failed.');
    } finally {
      setLoading(false);
    }
  };

  // اگر نتیجه جستجو وجود داشت، آن را نشان بده، иначе داده‌های اولیه را نشان بده
  const displayData = results !== null ? results : initialData;

  return (
    <div>
      {/* کادر جستجو و تعامل با Agent */}
      <div className="max-w-6xl mx-auto mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g., Products for roof against hail..."
            className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Agent Processing...' : 'Search Knowledge Base'}
          </button>
          
          {results !== null && (
            <button 
              onClick={() => setResults(null)} 
              className="text-sm text-blue-600 underline hover:text-blue-800 whitespace-nowrap"
            >
              Reset View
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          The AI agent extracts hazard and building element parameters from your text to query the verified database. It does not make recommendations.
        </p>
      </div>

      {/* نمایش نتایج */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">
          {results !== null ? `Agent Results for: "${query}"` : 'Verified Knowledge Base'}
        </h2>
        
        {displayData.length === 0 ? (
          <p className="text-gray-500 bg-white p-4 rounded border">No verified data found matching the criteria.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayData.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col">
                
                <div className="mb-4">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Product</span>
                  <h3 className="text-xl font-bold mt-1">{item.product_name}</h3>
                  <p className="text-sm text-gray-500">by {item.manufacturer_name}</p>
                </div>

                <div className="bg-green-50 p-3 rounded mb-4 border border-green-100">
                  <span className="text-xs font-semibold text-green-700">Performance Value</span>
                  <p className="text-2xl font-bold text-green-800 uppercase">{item.performance_value}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4 flex-grow">
                  <div>
                    <span className="text-gray-500 block">Hazard</span>
                    <span className="font-medium capitalize">{item.hazard_name} ({item.hazard_type})</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Building Element</span>
                    <span className="font-medium capitalize">{item.be_name} ({item.be_type})</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t text-xs text-gray-600">
                  <p><strong>Evidence:</strong> {item.cert_standard}</p>
                  <p><strong>Issued by:</strong> {item.cert_body}</p>
                  <p className={`mt-1 font-bold ${item.cert_status === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {item.cert_status?.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}