/**
 * Recommendation Card Component
 * Displays AI-generated item recommendations (not actual database items)
 */
import React from 'react';

const RecommendationCard = ({ recommendation, index }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
      {/* Recommendation Number */}
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-1 bg-umass-maroon text-umass-cream text-xs rounded font-bold">
          #{index + 1}
        </span>
        <span className="text-xs text-gray-500">AI Suggestion</span>
      </div>

      {/* Item Info */}
      <h3 className="text-xl font-bold mb-2">{recommendation.title}</h3>
      <p className="text-gray-600 mb-3 line-clamp-2">{recommendation.description}</p>
      
      {/* Reason */}
      {recommendation.reason && (
        <div className="mb-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Why:</span> {recommendation.reason}
          </p>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          {recommendation.category && (
            <span className="px-2 py-1 bg-umass-maroon text-umass-cream text-sm rounded font-medium">
              {recommendation.category}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded font-semibold">
            Suggested
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;

