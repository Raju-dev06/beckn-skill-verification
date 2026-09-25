import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidateService } from '../services/api';
import { UploadCloud, FileText, Building, Key, ArrowLeft, Check } from 'lucide-react';

export default function AddCredential({ user }) {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    certificateName: '',
    credentialId: '',
    issuer: ''
  });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = new FormData();
    data.append('skillId', skillId);
    data.append('certificateName', formData.certificateName);
    data.append('credentialId', formData.credentialId);
    data.append('issuer', formData.issuer);
    if (file) {
      data.append('file', file);
    }

    try {
      await candidateService.addCredential(user.id, data);
      navigate('/candidate/dashboard');
    } catch (err) {
      alert('Failed to save credential');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
      <button 
        onClick={() => navigate('/candidate/dashboard')}
        className="flex items-center gap-2 text-gray-500 hover:text-primary-600 font-medium mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 rounded-full mix-blend-screen filter blur-3xl opacity-30"></div>
          <h2 className="text-3xl font-extrabold tracking-tight relative z-10">Upload Credential</h2>
          <p className="text-gray-300 mt-2 relative z-10">Provide your certificate details to begin the verification process.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Certificate Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FileText size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all outline-none" 
                  value={formData.certificateName}
                  onChange={e => setFormData({...formData, certificateName: e.target.value})}
                  placeholder="e.g. Oracle Certified Professional"
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Credential ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Key size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all outline-none font-mono" 
                    value={formData.credentialId}
                    onChange={e => setFormData({...formData, credentialId: e.target.value})}
                    placeholder="JAVA-12345"
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Issuer Organization</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all outline-none" 
                    value={formData.issuer}
                    onChange={e => setFormData({...formData, issuer: e.target.value})}
                    placeholder="e.g. Oracle"
                    required 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Evidence File (PDF)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-colors bg-gray-50 relative group">
                <div className="space-y-2 text-center relative z-10">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-bold text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 px-2 py-1 shadow-sm border border-gray-200">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
                    </label>
                    <p className="pl-1 pt-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    {file ? <span className="text-success-600 flex items-center justify-center gap-1"><Check size={14}/> {file.name} selected</span> : 'PDF up to 10MB'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate('/candidate/dashboard')} 
              className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</>
              ) : 'Save Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
