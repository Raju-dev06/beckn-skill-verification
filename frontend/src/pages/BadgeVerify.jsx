import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, Trash2, ShieldCheck, CheckCircle, AlertTriangle, Link } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { verificationService } from '../services/api';

const UUID_RE = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
const STORAGE_KEY = 'badge_lookup_history_v1';

const extractId = (raw) => {
  const match = raw.match(UUID_RE);
  return match ? match[0] : null;
};

const sha256 = async (text) => {
  const data = new TextEncoder().encode(text);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function BadgeVerify({ user }) {
  const { skillId } = useParams();
  const navigate = useNavigate();
  
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null); // { type: 'ok' | 'err', id?: string, url?: string, msg: string }
  const [history, setHistory] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const saveHistory = (list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
    setHistory(list);
  };

  const handleVerify = async () => {
    const raw = input.trim();
    if (!raw) {
      setResult({ type: 'err', msg: 'Enter a badge URL or ID first.' });
      return;
    }

    const id = extractId(raw);
    if (!id) {
      setResult({ type: 'err', msg: "That doesn't look like a valid Credly badge ID (expected a UUID format). Double-check the link." });
      return;
    }

    const url = `https://www.credly.com/badges/${id}`;
    setResult({ type: 'ok', id, url, msg: 'Badge ID found successfully!' });

    const hash = await sha256(id);
    const newList = [{ hash, url, time: Date.now() }, ...history].slice(0, 20);
    saveHistory(newList);
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  const handleSync = async (badgeId) => {
    if (!skillId || !user) return;
    setIsSyncing(true);
    try {
      // Simulate providing consent and verifying the specific badge on Beckn
      await verificationService.giveConsent(user.id, skillId);
      await verificationService.verifySkill(user.id, skillId);
      navigate('/candidate/dashboard');
    } catch (e) {
      console.error(e);
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-primary-100 p-3 rounded-2xl text-primary-600 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">External Badge Lookup</h1>
            <p className="text-gray-500 mt-1">Paste a Credly badge URL or ID to jump to its official public verification page.</p>
          </div>
        </div>

        <div className="mb-6 relative">
          <input
            type="text"
            className="w-full pl-4 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-800 text-lg shadow-inner"
            placeholder="https://www.credly.com/badges/... or the ID"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />
          <button 
            onClick={handleVerify}
            className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-colors shadow-md flex items-center gap-2"
          >
            <Search size={20} /> <span className="hidden sm:inline font-bold">Verify</span>
          </button>
        </div>

        {result && (
          <div className={`p-5 rounded-xl mb-8 flex items-start gap-4 border ${result.type === 'ok' ? 'bg-success-50 border-success-200 shadow-sm' : 'bg-red-50 border-red-200'}`}>
            {result.type === 'ok' ? <CheckCircle className="text-success-500 flex-shrink-0" size={24} /> : <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />}
            <div className="flex-1">
              <h3 className={`font-bold ${result.type === 'ok' ? 'text-success-800' : 'text-red-800'} mb-1`}>{result.msg}</h3>
              {result.type === 'ok' && (
                <>
                  <p className="text-success-700 text-sm mb-3 font-mono bg-success-100/50 p-1.5 rounded inline-block">{result.id}</p>
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-success-700 font-bold hover:underline mb-4">
                    Open official verification page <ExternalLink size={16} />
                  </a>
                  
                  {skillId && user?.role === 'CANDIDATE' && (
                    <div className="mt-4 pt-4 border-t border-success-200/50">
                      <p className="text-sm text-success-800 mb-3 font-medium">Link this verified badge to your Beckn profile skill?</p>
                      <button 
                        onClick={() => handleSync(result.id)}
                        disabled={isSyncing}
                        className="w-full bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                      >
                        {isSyncing ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <><Link size={18} /> Sync Badge to Profile</>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="pt-8 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Lookup History (Local Hashes)</h2>
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold transition-colors">
                <Trash2 size={14} /> Clear History
              </button>
            )}
          </div>
          
          {history.length === 0 ? (
            <p className="text-gray-400 italic text-sm">No lookups performed yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 p-2 rounded text-gray-500 group-hover:text-primary-600 group-hover:bg-primary-100 transition-colors">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="font-mono text-xs text-gray-600 font-bold">{item.hash.slice(0, 12)}&hellip;</p>
                      <p className="text-[10px] text-gray-400">{new Date(item.time).toLocaleString()}</p>
                    </div>
                  </div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-200 hover:border-primary-300 text-primary-600 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 shadow-sm">
                    Open <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
