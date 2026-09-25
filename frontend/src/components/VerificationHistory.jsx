import React, { useEffect, useState } from 'react';
import { verificationService } from '../services/api';

export default function VerificationHistory({ candidateId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // We didn't build a backend endpoint for this specifically in the previous steps!
    // But we can add one if needed, or this is just a placeholder UI for now.
    // For now, let's just render a placeholder.
  }, [candidateId]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
      <h3 className="text-lg font-bold mb-4 text-gray-900">Verification Audit Log</h3>
      <div className="text-gray-500 text-sm italic">
        (Transaction history and Beckn correlation IDs would appear here in production)
      </div>
    </div>
  );
}
