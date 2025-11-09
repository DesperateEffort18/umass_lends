/**
 * Report Modal Component
 * Allows users to report items for violations
 */
import React, { useState } from 'react';

const REPORT_REASONS = [
  { value: 'scam', label: 'Scam', description: 'Fraudulent or deceptive content' },
  { value: 'violence_or_hate', label: 'Violence or Hate', description: 'Violent or hateful content' },
  { value: 'false_information', label: 'False Information', description: 'Misleading or inaccurate information' },
  { value: 'lending_restricted_items', label: 'Lending Restricted Items', description: 'Items that cannot be legally lent' },
  { value: 'nudity_or_sexual_activity', label: 'Nudity or Sexual Activity', description: 'Inappropriate sexual content' },
];

const ReportModal = ({ isOpen, onClose, itemId, itemTitle, onReport }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await onReport(itemId, selectedReason);
      
      if (response.success) {
        setSuccess(true);
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setSelectedReason('');
        }, 2000);
      } else {
        setError(response.error || 'Failed to submit report');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
      setSelectedReason('');
      setError(null);
      setSuccess(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-umass-maroon">
              🚨 Report Item
            </h2>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold disabled:opacity-50"
            >
              ×
            </button>
          </div>

          {/* Item Info */}
          {itemTitle && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Reporting:</p>
              <p className="font-semibold text-gray-900">{itemTitle}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
              <p className="text-green-600 font-semibold">
                ✓ Report submitted successfully! Thank you for helping keep our community safe.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Report Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-3 font-semibold text-gray-900">
                  Please select a reason for reporting:
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason.value}
                      className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedReason === reason.value
                          ? 'border-umass-maroon bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="mt-1"
                        disabled={submitting}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {reason.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {reason.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedReason}
                    className="flex-1 bg-umass-maroon text-umass-cream px-4 py-2 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;

