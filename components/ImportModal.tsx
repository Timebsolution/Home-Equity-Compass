
import React, { useState } from 'react';
import { X, Link2, Search, Loader2 } from 'lucide-react';
import { Theme } from '../App';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string) => Promise<void>;
  theme: Theme;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, theme }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError(null);
    try {
      await onImport(url);
      onClose();
      setUrl('');
    } catch (err) {
      setError("Failed to extract data. Please check the link or try manual entry.");
    } finally {
      setLoading(false);
    }
  };

  const bgClass = theme === 'light' ? 'bg-white' : 'bg-gray-800';
  const textClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const inputClass = theme === 'light' ? 'bg-gray-50 border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className={`${bgClass} rounded-xl shadow-2xl w-full max-w-md border ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-bold ${textClass}`}>Import from URL</h2>
            <button onClick={onClose} className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${textClass}`}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                Paste Zillow or Propwire Link
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link2 size={16} className="text-gray-400" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.zillow.com/homedetails/..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all ${inputClass}`}
                  autoFocus
                />
              </div>
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                ✨ AI will attempt to find price, taxes, and HOA fees.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${theme === 'light' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !url}
                className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? "Extracting..." : "Import Data"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
