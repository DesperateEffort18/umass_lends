/**
 * Collateral Recommendation Modal
 * Shows AI-powered collateral recommendations for item borrowing
 */
import React from 'react';
import { Link } from 'react-router-dom';

const CollateralModal = ({ isOpen, onClose, recommendations, loading, item }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-umass-maroon">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-umass-maroon">
              💰 Collateral Recommendations
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Explanation */}
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-sm text-gray-700">
              <strong>For liability protection:</strong> Consider asking the borrower to provide collateral of equivalent value. 
              This helps ensure the item is returned safely.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-600">🤖 AI is analyzing items...</p>
              <p className="text-sm text-gray-500 mt-2">Finding appropriate collateral options...</p>
            </div>
          )}

          {/* Recommendations */}
          {!loading && recommendations && (
            <>
              {recommendations.explanation && (
                <p className="text-sm text-gray-600 mb-4 italic">
                  {recommendations.explanation}
                </p>
              )}

              {recommendations.items && recommendations.items.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">
                    Suggested Collateral Items:
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {recommendations.items.map((item) => (
                      <Link
                        key={item.id}
                        to={`/items/${item.id}`}
                        onClick={onClose}
                        className="block border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                            {item.category && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-umass-maroon text-umass-cream text-xs rounded">
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No collateral recommendations available.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Consider using Venmo, Zelle, or CashApp for a security deposit instead.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-gray-600 text-center">
              💡 <strong>Tip:</strong> You can also use Venmo, Zelle, or CashApp for a security deposit if you're comfortable with that option.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-umass-maroon text-umass-cream px-6 py-2 rounded-lg hover:bg-umass-maroonDark font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollateralModal;

