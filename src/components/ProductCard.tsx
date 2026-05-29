/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingCart, Leaf, Star, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  onSelectProduct: (product: Product) => void;
}

export default function ProductCard({ product, onSelectProduct }: ProductCardProps): React.JSX.Element {
  // Translate category key for elegant tags
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'mel':
        return { label: 'Mel e Própolis', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'plantas':
        return { label: 'Plantas & Ervas', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'vegetais':
        return { label: 'Vegetais Orgânicos', color: 'bg-lime-100 text-lime-800 border-lime-200' };
      default:
        return { label: 'Natural', color: 'bg-stone-100 text-stone-800 border-stone-200' };
    }
  };

  const cat = getCategoryLabel(product.category);

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-150 shadow-sm hover:shadow-xl hover:border-emerald-600/30 transition-all duration-300 flex flex-col group h-full">
      {/* Product Image Panel */}
      <div className="relative aspect-video w-full overflow-hidden bg-stone-100">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border ${cat.color} backdrop-blur-xs flex items-center gap-1 shadow-xs`}>
            <Leaf className="w-2.5 h-2.5" />
            {cat.label}
          </span>
        </div>
        
        {/* Subtle decorative ratings badge */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-stone-800 text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs border border-stone-100">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>4.9</span>
        </div>
      </div>

      {/* Product Body details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-mono text-stone-400 block mb-1">
            {product.unit}
          </span>
          <h3 className="font-serif text-lg font-semibold text-stone-900 group-hover:text-emerald-800 transition-colors duration-200 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-stone-600 text-xs mt-2 leading-relaxed line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-400 uppercase tracking-widest">Preço unitário</span>
            <span className="text-xl font-bold text-stone-900 font-serif">
              {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <button
            onClick={() => onSelectProduct(product)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-medium text-xs py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer transform group-active:scale-95 text-center"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Comprar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
