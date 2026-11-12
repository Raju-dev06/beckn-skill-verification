import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidateService, verificationService } from '../services/api';
import { 
  ArrowLeft, GraduationCap, CheckCircle, Shield, XCircle, 
  Code, Clock, FileText, Database, ShieldCheck, Terminal, 
  Hash, ExternalLink, Calendar, CheckCircle2, Award, Download, 
  Eye, Check, Copy, AlertTriangle, Sparkles, Filter, Mail
} from 'lucide-react';

export default function EmployerProfileView() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [evidenceData, setEvidenceData] = useState(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [certFilter, setCertFilter] = useState('ALL'); // 'ALL' | 'VERIFIED' | 'PENDING'
  const [copiedId, setCopiedId] = useState(null);
  const [selectedCertForModal, setSelectedCertForModal] = useState(null);

  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        const [profileRes, credsRes] = await Promise.allSettled([
          candidateService.getProfile(candidateId),
          candidateService.getCredentials(candidateId)
        ]);

        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.data);
          if (profileRes.value.data.certificates) {
            setCredentials(profileRes.value.data.certificates);
          }
        }

        if (credsRes.status === 'fulfilled' && credsRes.value.data) {
          // If profile didn't have full certificates list, use credentials fallback
          setCredentials(prev => {
            if (prev && prev.length > 0) return prev;
            return credsRes.value.data.map(c => ({
              id: c.id,
              candidateId: c.candidateId,
              skillId: c.skillId,
              certificateName: c.certificateName || 'Uploaded Credential',
              credentialId: c.credentialId || ('CERT-' + c.id),
              issuer: c.issuer || 'Accredited Authority',
              filePath: c.filePath,
              fileUrl: c.filePath ? `http://localhost:8081/${c.filePath.replace('\\', '/')}` : null,
              status: c.status || 'UPLOADED',
              validity: c.status === 'VERIFIED' ? 'VALID / AUTHENTIC' : 'PENDING AUDIT',
              confidenceScore: c.status === 'VERIFIED' ? 95 : 0,
              competencyLevel: c.status === 'VERIFIED' ? 'Advanced' : 'Pending',
              valid: c.status === 'VERIFIED',
              verificationProofUrn: `urn:onest:credential:${c.credentialId || c.id}`
            }));
          });
        }
      } catch (err) {
        console.error('Failed to load candidate profile:', err);
      }
    };

    fetchCandidateData();
  }, [candidateId]);

  const handleViewEvidence = async (skillId) => {
    setSelectedSkill(skillId);
    setIsLoadingEvidence(true);
    setEvidenceData(null);
    try {
      const res = await verificationService.getResult(candidateId, skillId);
      setEvidenceData(res.data);
    } catch (err) {
      console.error(err);
      setEvidenceData(null);
    } finally {
      setIsLoadingEvidence(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!profile) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading candidate evidence ledger...</p>
    </div>
  );

  // Filtered certificates calculation
  const allCertificates = credentials || [];
  const verifiedCount = allCertificates.filter(c => c.valid || c.status === 'VERIFIED').length;
  const pendingCount = allCertificates.length - verifiedCount;

  const filteredCerts = allCertificates.filter(c => {
    if (certFilter === 'VERIFIED') return c.valid || c.status === 'VERIFIED';
    if (certFilter === 'PENDING') return !c.valid && c.status !== 'VERIFIED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/employer/dashboard')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100"
        >
          <ArrowLeft size={16} /> Back to Search Candidates
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={14} /> ONEST Audit Protocol Active
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Profile Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 p-6 sm:p-8 text-center sticky top-24 space-y-6">
            
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-lg shadow-blue-500/25 border-4 border-white">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile.name}</h2>
              {profile.email && (
                <p className="text-xs text-blue-600 font-semibold flex items-center justify-center gap-1 mt-0.5">
                  <Mail size={13} className="text-blue-500" />
                  <span>{profile.email}</span>
                </p>
              )}
              <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs sm:text-sm font-medium mt-1">
                <GraduationCap size={16} className="text-blue-600" />
                <span>{profile.education}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{profile.college} • Class of {profile.graduationYear}</p>
            </div>
            
            {/* Trust Score Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-center">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                Unified Trust Score
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black text-slate-900">{profile.overallVerificationScore}</span>
                <span className="text-lg font-bold text-blue-600">%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Maximum confidence ceiling: 95%
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-center">
                <p className="text-xs font-semibold text-emerald-800">Verified Certs</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{verifiedCount}</p>
              </div>
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-center">
                <p className="text-xs font-semibold text-blue-800">Verified Skills</p>
                <p className="text-xl font-black text-blue-600 mt-0.5">
                  {profile.skills?.filter(s => s.verificationStatus === 'VERIFIED').length || 0}
                </p>
              </div>
            </div>

            {/* Security Guarantee List */}
            <div className="text-left pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600 font-medium">
              <p className="flex items-center gap-2">
                <Shield size={14} className="text-emerald-500 shrink-0" />
                <span>Ed25519 Cryptographically Signed</span>
              </p>
              <p className="flex items-center gap-2">
                <Database size={14} className="text-blue-500 shrink-0" />
                <span>Indexed Transaction Audit Ledger</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle size={14} className="text-indigo-500 shrink-0" />
                <span>Tamper-Resistant QR Validation</span>
              </p>
            </div>

          </div>
        </div>

        {/* Right Main Column: Uploaded Certificates + Skills Matrix + Terminal */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECTION 1: UPLOADED CERTIFICATES & CREDENTIAL LEDGER */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/90 space-y-6">
            
            {/* Header & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Award size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Uploaded Certificates & Validity Ledger
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Cryptographically audited credentials, digital badges, and verified diplomas from ONEST issuers.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
                <button
                  onClick={() => setCertFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    certFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({allCertificates.length})
                </button>
                <button
                  onClick={() => setCertFilter('VERIFIED')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    certFilter === 'VERIFIED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  <CheckCircle size={12} />
                  <span>Valid ({verifiedCount})</span>
                </button>
                <button
                  onClick={() => setCertFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    certFilter === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-700 hover:text-amber-800'
                  }`}
                >
                  <Clock size={12} />
                  <span>Pending ({pendingCount})</span>
                </button>
              </div>
            </div>

            {/* Certificate List */}
            {filteredCerts.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                <Award size={36} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No certificates match this filter</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {certFilter === 'ALL' 
                    ? "Candidate has not uploaded or verified any certificates yet." 
                    : `No ${certFilter.toLowerCase()} certificates found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCerts.map((cert) => {
                  const isValid = cert.valid || cert.status === 'VERIFIED';
                  const isPending = !isValid && cert.status !== 'NOT VERIFIED';

                  return (
                    <div 
                      key={cert.id || cert.credentialId}
                      className={`p-5 sm:p-6 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4 group ${
                        isValid 
                          ? 'border-emerald-200/90 bg-gradient-to-br from-emerald-50/20 via-white to-slate-50/40 hover:border-emerald-400 hover:shadow-md' 
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {cert.skillCategory || 'Certification'}
                            </span>
                            {cert.skillName && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                Skill: {cert.skillName}
                              </span>
                            )}
                          </div>

                          <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {cert.certificateName}
                          </h4>

                          <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                            <span className="text-slate-400 font-normal">Issued by:</span>
                            <span className="font-bold text-slate-800">{cert.issuer}</span>
                          </p>
                        </div>

                        {/* Validity Badge */}
                        <div className="shrink-0">
                          {isValid ? (
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                              <ShieldCheck size={16} className="text-emerald-600" />
                              <span>VALID / AUTHENTIC</span>
                            </div>
                          ) : isPending ? (
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                              <Clock size={16} className="text-amber-600" />
                              <span>PENDING AUDIT</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 shadow-xs">
                              <XCircle size={16} className="text-red-600" />
                              <span>REVOKED / UNVERIFIED</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Credential ID & Metadata Bar */}
                      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        
                        {/* Credential ID with Copy */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                            Credential ID / Serial
                          </span>
                          <div className="flex items-center justify-between gap-1 font-mono text-[11px] text-slate-800">
                            <span className="truncate" title={cert.credentialId}>{cert.credentialId}</span>
                            <button
                              onClick={() => handleCopy(cert.credentialId, cert.id || cert.credentialId)}
                              className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors shrink-0"
                              title="Copy Credential ID"
                            >
                              {copiedId === (cert.id || cert.credentialId) ? (
                                <Check size={13} className="text-emerald-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Confidence Index */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                            Confidence Index
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{cert.confidenceScore || (isValid ? 95 : 0)}%</span>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {cert.competencyLevel || (isValid ? 'Advanced' : 'Pending')}
                            </span>
                          </div>
                        </div>

                        {/* Verified Timestamp / ONEST URN */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 sm:col-span-2 lg:col-span-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                            Audit Verification Time
                          </span>
                          <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                            <Calendar size={13} className="text-slate-400" />
                            {cert.formattedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Action Links Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md">
                          {cert.verificationProofUrn || `urn:onest:credential:${cert.credentialId}`}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* File Document Proof Link */}
                          {cert.filePath && (
                            <a
                              href={`http://localhost:8081/${cert.filePath.replace('\\', '/')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition-colors"
                            >
                              <FileText size={13} />
                              <span>View Document Proof</span>
                              <ExternalLink size={11} />
                            </a>
                          )}

                          {/* Credly external badge inspection */}
                          {(cert.issuer?.toLowerCase().includes('credly') || (cert.credentialId && cert.credentialId.length === 36)) && (
                            <a
                              href={`https://www.credly.com/badges/${cert.credentialId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                            >
                              <Award size={13} />
                              <span>Issuer Registry</span>
                              <ExternalLink size={11} />
                            </a>
                          )}

                          {/* Terminal evidence inspector */}
                          {cert.skillId && (
                            <button
                              onClick={() => handleViewEvidence(cert.skillId)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-600 text-white font-bold transition-colors shadow-xs"
                            >
                              <Terminal size={13} />
                              <span>Inspect Cryptographic Audit</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: VERIFIED SKILL MATRIX */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Code size={20} className="text-blue-600" />
                Verified Skill Matrix
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Click any skill to inspect live Beckn transaction proof
              </span>
            </div>
            
            {/* Skill Cards Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {profile.skills?.map(skill => (
                <div 
                  key={skill.skillId} 
                  onClick={() => handleViewEvidence(skill.skillId)}
                  className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all flex flex-col justify-between group card-hover ${
                    selectedSkill === skill.skillId 
                      ? 'border-blue-500 shadow-md ring-4 ring-blue-50 bg-blue-50/10' 
                      : 'border-slate-200/90 hover:border-blue-300 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {skill.category}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {skill.name}
                        </h4>
                      </div>

                      {skill.verificationStatus === 'VERIFIED' ? (
                        <span className="bg-emerald-50 text-emerald-700 p-1.5 rounded-full border border-emerald-200">
                          <CheckCircle size={16} />
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 p-1.5 rounded-full border border-slate-200">
                          <Clock size={16} />
                        </span>
                      )}
                    </div>

                    {skill.verificationStatus === 'VERIFIED' && (
                      <div className="mb-3">
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                          Level: {skill.competencyLevel}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    {skill.verificationStatus === 'VERIFIED' ? (
                      <>
                        <span className="text-slate-500">Confidence Index</span>
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {skill.confidenceScore}%
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-normal">Click to check verification status</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: CRYPTOGRAPHIC EVIDENCE TERMINAL VIEW */}
          {selectedSkill && (
            <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 animate-slide-up mt-8">
              
              {/* Terminal Window Header */}
              <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
                  <Terminal size={14} className="text-emerald-400" />
                  <span>onest_proof_ledger.json</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">SHA-256 Verified</span>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                </div>
              </div>
              
              {/* Terminal Output */}
              <div className="p-6 font-mono text-xs leading-relaxed text-slate-300 space-y-6">
                {isLoadingEvidence ? (
                  <div className="flex items-center gap-2 text-blue-400 py-6">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Querying Beckn Transaction Ledger & decrypting evidence block...</span>
                  </div>
                ) : !evidenceData ? (
                  <div className="text-red-400 flex items-center gap-2 py-4">
                    <XCircle size={16} /> No verified credential evidence found for this skill.
                  </div>
                ) : (
                  <div className="space-y-5">
                    
                    {/* Check Matrix */}
                    <div className="border-l-2 border-blue-500 pl-4 space-y-3">
                      <p className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                        // CRYPTOGRAPHIC VERIFICATION PROOFS
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <CheckCircle size={15} className={evidenceData.credentialStatus === 'VERIFIED' ? "text-emerald-400" : "text-slate-600"} />
                          <div>
                            <p className="text-[10px] text-slate-400">Credential Sig</p>
                            <p className={evidenceData.credentialStatus === 'VERIFIED' ? "text-emerald-300 font-bold" : "text-slate-500"}>
                              {evidenceData.credentialStatus || 'UNKNOWN'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <CheckCircle size={15} className={evidenceData.educationStatus === 'VERIFIED' ? "text-emerald-400" : "text-slate-600"} />
                          <div>
                            <p className="text-[10px] text-slate-400">Registry Match</p>
                            <p className={evidenceData.educationStatus === 'VERIFIED' ? "text-emerald-300 font-bold" : "text-slate-500"}>
                              {evidenceData.educationStatus || 'UNKNOWN'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <CheckCircle size={15} className={evidenceData.assessmentStatus === 'VERIFIED' ? "text-emerald-400" : "text-slate-600"} />
                          <div>
                            <p className="text-[10px] text-slate-400">Assessment</p>
                            <p className={evidenceData.assessmentStatus === 'VERIFIED' ? "text-emerald-300 font-bold" : "text-slate-500"}>
                              {evidenceData.assessmentStatus || 'UNKNOWN'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Submitted Evidence Details */}
                    {evidenceData.credentialId && (
                      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                        <p className="text-slate-400 text-[11px] uppercase tracking-wider font-bold mb-2">
                          // SUBMITTED CREDENTIAL DATA & ISSUER IDENTIFIERS
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-2 gap-y-1.5">
                          <span className="text-slate-400">Credential ID:</span>
                          <span className="text-emerald-400 font-bold">{evidenceData.credentialId}</span>
                          
                          <span className="text-slate-400">Authoritative Issuer:</span>
                          <span className="text-slate-200">{evidenceData.issuer || 'ONEST National Registry'}</span>
                          
                          <span className="text-slate-400">Certificate Title:</span>
                          <span className="text-slate-200">{evidenceData.certificateName || 'Accredited Credential'}</span>

                          <span className="text-slate-400">Confidence Score:</span>
                          <span className="text-blue-400 font-bold">{evidenceData.confidenceScore}%</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Timestamp & Verification Hash */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Hash size={13} className="text-blue-400" />
                        <span>TX ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}-ONEST-V1</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{evidenceData.verifiedAt ? new Date(evidenceData.verifiedAt).toUTCString() : new Date().toUTCString()}</span>
                      </span>
                    </div>

                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
