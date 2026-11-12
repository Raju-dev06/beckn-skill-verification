import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, Trash2, ShieldCheck, CheckCircle, AlertTriangle, Link as LinkIcon, ArrowLeft, History, Check } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { verificationService, candidateService } from '../services/api';

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
  const { skillId: routeSkillId } = useParams();
  const navigate = useNavigate();
  
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState(routeSkillId || '');
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {}

    // Load candidate's skills for easy mapping if candidate is logged in
    if (user && user.role === 'CANDIDATE') {
      candidateService.getProfile(user.id)
        .then(res => {
          const skills = res.data?.skills || [];
          setUserSkills(skills);
          if (!routeSkillId && skills.length > 0) {
            setSelectedSkillId(skills[0].skillId);
          }
        })
        .catch(err => console.error('Failed to load user skills:', err));
    }
  }, [user, routeSkillId]);

  const saveHistory = (list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
    setHistory(list);
  };

  const handleVerify = async () => {
    const raw = input.trim();
    if (!raw) {
      setResult({ type: 'err', msg: 'Please enter a badge URL or UUID identifier first.' });
      return;
    }

    const id = extractId(raw);
    if (!id) {
      setResult({ type: 'err', msg: "Input is not a recognized UUID format. Please provide a full Credly URL or valid badge UUID." });
      return;
    }

    const url = `https://www.credly.com/badges/${id}`;
    
    setIsSearching(true);
    setResult(null);
    setIsSynced(false);
    try {
      const response = await candidateService.verifyExternalBadge(id);
      setIsSearching(false);
      
      if (response.data && response.data.valid) {
        setResult({ type: 'ok', id, url, msg: 'Badge successfully verified over the network!' });
        
        const hash = await sha256(id);
        const newList = [{ hash, url, time: Date.now() }, ...history].slice(0, 20);
        saveHistory(newList);
      } else {
        setResult({ type: 'err', msg: 'Badge format was valid, but record was not found or has been revoked by the issuer.' });
      }
    } catch (e) {
      setIsSearching(false);
      setResult({ type: 'err', msg: 'Failed to connect to verification server. Please check network connectivity.' });
    }
  };

  const clearHistory = () => {
    saveHistory([]);
  };

  const handleSync = async (badgeId) => {
    if (!user || user.role !== 'CANDIDATE') {
      alert('Please log in as a candidate to link this credential.');
      return;
    }

    const targetSkill = selectedSkillId || routeSkillId || (userSkills[0]?.skillId) || 1;
    setIsSyncing(true);
    try {
      const formData = new FormData();
      formData.append('skillId', targetSkill.toString());
      formData.append('certificateName', 'AWS Solutions Architect Digital Badge');
      formData.append('credentialId', badgeId);
      formData.append('issuer', 'Credly Acclaim (Amazon Web Services)');
      formData.append('status', 'VERIFIED');

      await candidateService.addCredential(user.id, formData);

      try {
        await verificationService.giveConsent(user.id, targetSkill);
        await verificationService.verifySkill(user.id, targetSkill);
      } catch (err) {
        console.log('Consent/verification note:', err.message);
      }

      setIsSynced(true);
      setTimeout(() => {
        navigate('/candidate/dashboard');
      }, 1200);
    } catch (e) {
      console.error(e);
      alert('Failed to sync badge to profile: ' + (e.response?.data?.message || e.message));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      
      {/* Back button if user is authenticated */}
      {user && (
        <button 
          onClick={() => navigate(user.role === 'CANDIDATE' ? '/candidate/dashboard' : '/employer/dashboard')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      )}

      <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-200/90 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
              External Issuer Bridge
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              External Credly Badge Lookup
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Paste any Credly badge URL or UUID to verify authenticity against public issuer records.
            </p>
          </div>
        </div>

        {/* Input Bar */}
        <div className="relative">
          <input
            type="text"
            className="w-full pl-4 pr-32 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder-slate-400"
            placeholder="https://www.credly.com/badges/798b8316-2680-4d47-9e95-90bd2c424455 or UUID..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />
          <button 
            onClick={handleVerify}
            disabled={isSearching}
            className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-60"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Search size={16} />
                <span>Verify</span>
              </>
            )}
          </button>
        </div>

        {/* Verification Verdict Box */}
        {result && (
          <div className={`p-5 rounded-2xl flex items-start gap-3.5 border animate-fade-in ${
            result.type === 'ok' 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
              : 'bg-red-50/80 border-red-200 text-red-900'
          }`}>
            {result.type === 'ok' ? (
              <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
            ) : (
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            )}
            
            <div className="flex-1 space-y-2">
              <h3 className="font-bold text-sm">{result.msg}</h3>
              
              {result.type === 'ok' && (
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-emerald-200 inline-block text-emerald-800 font-bold">
                    UUID: {result.id}
                  </p>
                  
                  <div>
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                    >
                      View public Credly issuer record <ExternalLink size={13} />
                    </a>
                  </div>
                  
                  {/* Link Badge CTA if candidate context */}
                  {user?.role === 'CANDIDATE' && (
                    <div className="pt-3 border-t border-emerald-200/80 space-y-3">
                      <p className="text-xs text-emerald-800 font-semibold">
                        Link this verified credential to your unified Beckn profile:
                      </p>

                      {userSkills.length > 0 && !routeSkillId && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-600 font-medium">Link to Skill:</label>
                          <select
                            value={selectedSkillId}
                            onChange={(e) => setSelectedSkillId(e.target.value)}
                            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {userSkills.map(s => (
                              <option key={s.skillId} value={s.skillId}>
                                {s.name} ({s.category})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button 
                        onClick={() => handleSync(result.id)}
                        disabled={isSyncing || isSynced}
                        className={`w-full sm:w-auto font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${
                          isSynced
                            ? 'bg-emerald-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                        }`}
                      >
                        {isSynced ? (
                          <><Check size={14} /> Synchronized to Profile!</>
                        ) : isSyncing ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <><LinkIcon size={14} /> Sync Credential to Beckn Profile</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Local Verification Hash History */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History size={14} /> Lookup History (SHA-256 Hashes)
            </h2>
            {history.length > 0 && (
              <button 
                onClick={clearHistory} 
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold transition-colors"
              >
                <Trash2 size={13} /> Clear
              </button>
            )}
          </div>
          
          {history.length === 0 ? (
            <p className="text-slate-400 text-xs italic">No previous lookups stored on this device.</p>
          ) : (
            <div className="grid gap-2">
              {history.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/80 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                      #
                    </div>
                    <div>
                      <p className="font-mono text-xs text-slate-700 font-bold">{item.hash.slice(0, 16)}&hellip;</p>
                      <p className="text-[10px] text-slate-400">{new Date(item.time).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-700 bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
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
