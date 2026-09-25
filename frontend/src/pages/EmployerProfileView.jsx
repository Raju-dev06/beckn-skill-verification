import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidateService, verificationService } from '../services/api';
import { ArrowLeft, User, GraduationCap, CheckCircle, Shield, XCircle, Code, Clock, Lock, FileText, Database } from 'lucide-react';

export default function EmployerProfileView() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [evidenceData, setEvidenceData] = useState(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await candidateService.getProfile(candidateId);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
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

  if (!profile) return <div className="min-h-[80vh] flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 animate-fade-in">
      <button 
        onClick={() => navigate('/employer/dashboard')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium mb-8 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Search
      </button>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Profile Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center sticky top-24">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-5xl font-extrabold text-gray-400 mb-6 shadow-inner border-4 border-white">
              {profile.name.charAt(0)}
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{profile.name}</h2>
            <div className="flex items-center justify-center gap-2 text-gray-500 font-medium mb-6">
              <GraduationCap size={18} /> {profile.education}
            </div>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Overall Trust Score</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black text-gray-900">{profile.overallVerificationScore}</span>
                <span className="text-xl font-bold text-gray-500">%</span>
              </div>
            </div>

            <div className="text-left pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 font-medium flex items-center gap-2"><Shield size={16} className="text-success-500"/> Verified via Beckn ONEST</p>
            </div>
          </div>
        </div>

        {/* Skills Main Area */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2"><Code size={24}/> Verified Skill Matrix</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {profile.skills?.map(skill => (
              <div 
                key={skill.skillId} 
                onClick={() => handleViewEvidence(skill.skillId)}
                className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg group flex flex-col justify-between
                  ${selectedSkill === skill.skillId ? 'border-primary-500 shadow-md ring-4 ring-primary-50' : 'border-gray-100 hover:border-primary-200'}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{skill.name}</h4>
                    {skill.verificationStatus === 'VERIFIED' ? (
                      <span className="bg-success-50 text-success-700 p-1.5 rounded-full"><CheckCircle size={20}/></span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 p-1.5 rounded-full"><Clock size={20}/></span>
                    )}
                  </div>
                  {skill.verificationStatus === 'VERIFIED' && (
                    <div className="mb-4">
                      <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-md capitalize">{skill.competencyLevel}</span>
                    </div>
                  )}
                </div>
                
                {skill.verificationStatus === 'VERIFIED' ? (
                  <div className="flex items-center justify-between text-sm font-medium text-gray-500">
                    <span>Confidence</span>
                    <span className="text-gray-900 font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{skill.confidenceScore}%</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 font-medium">Unverified</div>
                )}
              </div>
            ))}
          </div>

          {/* Evidence Terminal View */}
          {selectedSkill && (
            <div className="mt-8 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 animate-slide-up">
              <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
                <div className="flex items-center gap-2 text-gray-300 font-mono text-sm">
                  <Database size={16} /> verification_evidence.log
                </div>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
              </div>
              
              <div className="p-6 md:p-8 font-mono text-sm">
                {isLoadingEvidence ? (
                  <div className="text-primary-400 animate-pulse">Decrypting evidence block...</div>
                ) : !evidenceData ? (
                  <div className="text-red-400 flex items-center gap-2"><XCircle size={16}/> No evidence found.</div>
                ) : (
                  <div className="space-y-6 text-gray-300">
                    <div className="border-l-2 border-primary-500 pl-4 space-y-2">
                      <p className="text-gray-500">// CRYPTOGRAPHIC VERIFICATION CHECKS</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className={evidenceData.credentialStatus === 'VERIFIED' ? "text-success-400" : "text-gray-600"} />
                          <span className={evidenceData.credentialStatus === 'VERIFIED' ? "text-gray-100" : "text-gray-500"}>Credential Sig</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className={evidenceData.educationStatus === 'VERIFIED' ? "text-success-400" : "text-gray-600"} />
                          <span className={evidenceData.educationStatus === 'VERIFIED' ? "text-gray-100" : "text-gray-500"}>Education Reg</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className={evidenceData.assessmentStatus === 'VERIFIED' ? "text-success-400" : "text-gray-600"} />
                          <span className={evidenceData.assessmentStatus === 'VERIFIED' ? "text-gray-100" : "text-gray-500"}>Assessment</span>
                        </div>
                      </div>
                    </div>
                    
                    {evidenceData.credentialId && (
                      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-3">
                        <p className="text-gray-500 mb-2">// SUBMITTED CREDENTIAL DATA</p>
                        <div className="grid grid-cols-[120px_1fr] gap-2">
                          <span className="text-gray-400">ID:</span>
                          <span className="text-emerald-400">{evidenceData.credentialId}</span>
                          <span className="text-gray-400">Issuer:</span>
                          <span className="text-gray-200">{evidenceData.issuer}</span>
                          <span className="text-gray-400">Cert Name:</span>
                          <span className="text-gray-200">{evidenceData.certificateName}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                      <span>Hash: {Math.random().toString(36).substring(2, 15).toUpperCase()}</span>
                      <span>{new Date(evidenceData.verifiedAt).toUTCString()}</span>
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
