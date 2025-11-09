/**
 * Item Card Component
 * Displays a single item in a card format
 */

import React from 'react';
import { Link } from 'react-router-dom';

const ItemCard = ({ item }) => {
  return (
    <Link to={`/items/${item.id}`} className="block">
      <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
        {/* Item Image */}
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-48 object-cover rounded mb-4"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 rounded mb-4 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}

        {/* Item Info */}
        <h3 className="text-xl font-bold mb-2">{item.title}</h3>
        <p className="text-gray-600 mb-2 line-clamp-2">{item.description}</p>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            {item.category && (
              <span className="px-2 py-1 bg-umass-maroon text-umass-cream text-sm rounded font-medium">
                {item.category}
              </span>
            )}
            {item.condition && (
              <span className="px-2 py-1 bg-umass-lightGray text-umass-gray text-sm rounded">
                {item.condition}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {item.available ? (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded font-semibold">
                Available
              </span>
            ) : (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded font-semibold">
                Unavailable
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;

