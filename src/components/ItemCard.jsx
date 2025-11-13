/**
 * Item Card Component
 * Displays a single item in a card format
 */

import React from 'react';
import { Link } from 'react-router-dom';

const ItemCard = ({ item, compact = false, noBorder = false }) => {
  // Use taller aspect ratio for portrait orientation (3:4 ratio)
  const imageHeight = compact ? 'h-56' : 'h-72';
  const padding = noBorder ? '' : (compact ? 'p-3' : 'p-4');
  const titleSize = compact ? 'text-lg' : 'text-xl';
  const borderClass = noBorder ? '' : 'border rounded-lg';
  const hoverEffect = noBorder ? '' : 'hover:shadow-lg transition-shadow';
  
  return (
    <Link to={`/items/${item.id}`} className="block group">
      <div className={`
        ${borderClass} 
        ${padding} 
        ${hoverEffect} 
        cursor-pointer
        bg-white/80 backdrop-blur-sm
        ${noBorder ? '' : 'border-2 border-umass-maroon/20 hover:border-umass-maroon/40'}
        rounded-lg
        transition-all duration-300
        hover:shadow-xl
        hover:-translate-y-1
        relative overflow-hidden
        animate-fade-in-up
      `}>
        {/* Decorative accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-umass-maroon/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Item Image */}
        {item.image_url ? (
          <div className="relative overflow-hidden rounded-md mb-4">
            <img
              src={item.image_url}
              alt={item.title}
              className={`w-full ${imageHeight} object-cover transition-transform duration-500 group-hover:scale-105`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ) : (
          <div className={`w-full ${imageHeight} bg-gradient-to-br from-umass-paperDark to-umass-paper rounded-md mb-4 flex items-center justify-center border-2 border-umass-maroon/10`}>
            <span className="text-umass-stone/40 text-sm font-accent uppercase tracking-wider">No image</span>
          </div>
        )}

        {/* Item Info */}
        <h3 className={`${titleSize} font-display font-bold mb-2 text-umass-maroonDark group-hover:text-umass-maroon transition-colors duration-300`}>
          {item.title}
        </h3>
        <p className="text-umass-stone/80 mb-3 line-clamp-2 text-sm leading-relaxed font-body">
          {item.description}
        </p>
        
        {/* Location */}
        {item.location && (
          <div className="mb-3 flex items-center gap-1">
            <span className="text-xs text-umass-stone/60 font-accent uppercase tracking-wide">📍 {item.location}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4 flex-wrap gap-2 pt-3 border-t border-umass-maroon/10">
          <div className="flex gap-2 flex-wrap">
            {item.category && (
              <span className="px-3 py-1 bg-gradient-maroon text-umass-cream text-xs rounded-md font-accent font-semibold uppercase tracking-wide shadow-sm">
                {item.category}
              </span>
            )}
            {item.condition && (
              <span className="px-3 py-1 bg-umass-paperDark text-umass-stone text-xs rounded-md font-accent uppercase tracking-wide border border-umass-maroon/10">
                {item.condition}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {item.available ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md font-accent font-bold uppercase tracking-wide border border-emerald-200 shadow-sm">
                Available
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-50 text-red-700 text-xs rounded-md font-accent font-bold uppercase tracking-wide border border-red-200 shadow-sm">
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

