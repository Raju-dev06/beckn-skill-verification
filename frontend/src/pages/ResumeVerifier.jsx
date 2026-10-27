import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateService } from '../services/api';
import { 
  UploadCloud, FileText, CheckCircle, XCircle, AlertTriangle, 
  ExternalLink, ShieldCheck, Sparkles, Filter, RefreshCw, 
  ArrowRight, ShieldAlert, Check, HelpCircle
} from 'lucide-react';

const SAMPLE_RESUME_TEXT = `John Doe - Senior Software Engineer
Email: john.doe@example.com | Phone: +1 555-0199
GitHub: https://github.com/johndoe/microservices-demo
LinkedIn: https://linkedin.com/in/johndoe-tech
Portfolio: https://johndoe-portfolio.dev

PROFESSIONAL SUMMARY:
Experienced Cloud Architect with strong background in distributed systems and cloud security.

CERTIFICATIONS & BADGES:
1. AWS Certified Solutions Architect - Associate
   Verify Badge: https://www.credly.com/org/amazon-web-services/badge/aws-certified-solutions-architect-associate

2. Fake / Tampered Credly Certification (Testing Network Defense):
   Verify Badge: https://www.credly.com/badges/00000000-0000-0000-0000-000000000000-fake

3. Coursera Deep Learning Specialization:
   Verify: https://coursera.org/verify/SAMPLE123FAKE999

PROJECTS:
- Scalable E-Commerce Backend: Built with Spring Boot and Beckn Protocol.
  Demo URL: https://myecommerce-live-demo.vercel.app`;

export default function ResumeVerifier({ user }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'sample'
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [syncingBadgeId, setSyncingBadgeId] = useState(null);
  const [syncedBadges, setSyncedBadges] = useState({});
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleVerifyFile = async () => {
    if (!file) {
      setError('Please select a PDF or resume document first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await candidateService.verifyResumeFile(formData);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to parse and verify the resume.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyText = async (textToUse) => {
    const text = textToUse || textInput;
    if (!text.trim()) {
      setError('Please paste resume text or click "Load Sample Resume".');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await candidateService.verifyResumeText(text);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to verify resume text.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = () => {
    setTextInput(SAMPLE_RESUME_TEXT);
    handleVerifyText(SAMPLE_RESUME_TEXT);
  };

  const handleSyncToProfile = async (cert) => {
    if (!user || user.role !== 'CANDIDATE') {
      alert('Please log in as a candidate to sync certificates to your profile.');
      return;
    }

    setSyncingBadgeId(cert.url);
    try {
      // Find or assign skill ID
      const formData = new FormData();
      formData.append('skillId', '1'); // Default AWS or Cloud skill
      formData.append('certificateName', cert.title || 'Verified Certificate');
      formData.append('credentialId', cert.badgeId || cert.url);
      formData.append('issuer', cert.issuer || 'Credly');

      await candidateService.addCredential(user.id, formData);
      setSyncedBadges(prev => ({ ...prev, [cert.url]: true }));
    } catch (err) {
      console.error(err);
      alert('Failed to sync badge to profile: ' + (err.message || 'Unknown error'));
    } finally {
      setSyncingBadgeId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-gray-900 text-white rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck size={220} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 glass rounded-full text-xs font-bold tracking-wider uppercase mb-4 text-primary-300 border border-white/20">
            <Sparkles size={14} /> Automated Verification Pipeline
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Resume Certificate Link Extractor & Verifier
          </h1>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6">
            Upload any candidate resume to automatically extract credential links, isolate authentic certificate badges from personal profiles/repositories, and verify them against the issuing platform in real time.
          </p>

          <div className="flex flex-wrap gap-3 text-xs font-semibold">
            <span className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
              <Filter size={14} className="text-primary-400" /> Multi-Layer Link Filter
            </span>
            <span className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" /> Real-Time Credly Validation
            </span>
            <span className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-red-400" /> Tamper & Revocation Detection
            </span>
          </div>
        </div>
      </div>

      {/* Input Options (Tabs) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex border-b border-gray-200 mb-6 gap-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <UploadCloud size={18} /> Upload Resume Document (.pdf, .txt)
          </button>
          <button
            onClick={() => setActiveTab('sample')}
            className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'sample'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText size={18} /> Quick Test with Sample Resume
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div>
            <div className="border-2 border-dashed border-gray-300 hover:border-primary-500 rounded-2xl p-8 text-center transition-all bg-gray-50/50 hover:bg-primary-50/20">
              <input
                type="file"
                id="resumeFileInput"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="resumeFileInput" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {file ? file.name : 'Choose a Resume File or Drag & Drop'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {file ? `${(file.size / 1024).toFixed(1)} KB selected` : 'Supports PDF files containing hyperlinks or plain text certificate URLs'}
                </p>
                <span className="bg-white border border-gray-300 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                  Browse File
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleVerifyFile}
                disabled={!file || isLoading}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Extracting & Verifying Links...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Extract & Verify Certificates <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Sample / Paste Text */}
        {activeTab === 'sample' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-gray-600 font-medium">
                Paste resume content or test instantly with our pre-loaded sample containing mixed links (Credly, fake badge, GitHub repo, LinkedIn profile):
              </p>
              <button
                onClick={loadSample}
                className="bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-primary-200 transition-colors flex items-center gap-1"
              >
                <Sparkles size={14} /> Load & Test Sample
              </button>
            </div>

            <textarea
              rows={8}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste resume text containing certificate links, GitHub, LinkedIn etc..."
              className="w-full p-4 border border-gray-300 rounded-xl font-mono text-xs text-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleVerifyText()}
                disabled={!textInput.trim() || isLoading}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Verifying Links...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Run Verification
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
            <AlertTriangle size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {results && (
        <div className="space-y-8 animate-slide-up">
          
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Total Links Found</p>
              <p className="text-3xl font-extrabold text-gray-900">{results.totalLinksFound}</p>
              <p className="text-xs text-gray-400 mt-1">Across entire resume</p>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-emerald-800 font-bold mb-1">Valid Certificates</p>
              <p className="text-3xl font-extrabold text-emerald-600">{results.validCertificatesCount}</p>
              <p className="text-xs text-emerald-700 mt-1">Live verified on network</p>
            </div>

            <div className="bg-red-50/60 p-5 rounded-2xl border border-red-200 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-red-800 font-bold mb-1">Invalid / Fake Badges</p>
              <p className="text-3xl font-extrabold text-red-600">{results.invalidCertificatesCount}</p>
              <p className="text-xs text-red-700 mt-1">Revoked or 404 blocked</p>
            </div>

            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Filtered Out Links</p>
              <p className="text-3xl font-extrabold text-gray-700">{results.ignoredLinks?.length || 0}</p>
              <p className="text-xs text-gray-400 mt-1">GitHub, LinkedIn profile, etc.</p>
            </div>
          </div>

          {/* Section: Extracted Certificates */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="text-primary-600" size={24} />
                  Extracted Certificate Links ({results.extractedCertificates?.length || 0})
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Extracted specifically using domain & path whitelisting from the resume.
                </p>
              </div>
            </div>

            {results.extractedCertificates?.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                <AlertTriangle size={36} className="mx-auto text-yellow-500 mb-2" />
                <p className="font-semibold">No certificate links found in the uploaded document.</p>
                <p className="text-xs mt-1 text-gray-400">Ensure the resume contains Credly, Coursera, or accredited certificate URLs.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {results.extractedCertificates.map((cert, index) => {
                  const certValid = cert.isValid ?? cert.valid;
                  return (
                    <div key={index} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                            {cert.issuer}
                          </span>
                          
                          {certValid ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                              <CheckCircle size={14} className="text-emerald-500" /> {cert.status}
                            </span>
                          ) : (
                            <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                              <XCircle size={14} className="text-red-500" /> {cert.status}
                            </span>
                          )}

                          {cert.matchedSkill && (
                            <span className="text-xs font-medium text-gray-500">
                              Mapped Skill: <strong className="text-gray-800">{cert.matchedSkill}</strong>
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          {cert.title}
                        </h3>

                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1 font-mono break-all mb-2"
                        >
                          {cert.url} <ExternalLink size={12} />
                        </a>

                        <p className={`text-xs font-medium flex items-center gap-1.5 ${certValid ? 'text-emerald-700' : 'text-red-600'}`}>
                          {certValid ? <Check size={14} /> : <AlertTriangle size={14} />}
                          {cert.details}
                        </p>
                      </div>

                      {/* Action Button: Sync to Profile */}
                      <div className="flex items-center gap-3">
                        {certValid ? (
                          <button
                            onClick={() => handleSyncToProfile(cert)}
                            disabled={syncingBadgeId === cert.url || syncedBadges[cert.url]}
                            className={`font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all ${
                              syncedBadges[cert.url]
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
                            }`}
                          >
                            {syncedBadges[cert.url] ? (
                              <>
                                <CheckCircle size={14} /> Linked to Profile
                              </>
                            ) : syncingBadgeId === cert.url ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" /> Linking...
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} /> Link to Profile
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 flex items-center gap-1">
                            <XCircle size={14} /> Blocked from Profile
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Filter Transparency (Filtered Non-Certificate Links) */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              Smart Filter Transparency (Non-Certificate Links Ignored by Engine)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              The engine automatically identified and excluded these links because they are personal repositories, profiles, or demo sites rather than credential verify endpoints:
            </p>

            <div className="flex flex-wrap gap-2">
              {results.ignoredLinks?.map((item, idx) => (
                <span
                  key={idx}
                  className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-mono shadow-sm flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                  {item}
                </span>
              ))}
              {results.ignoredLinks?.length === 0 && (
                <span className="text-xs text-gray-400">No other links detected.</span>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
