/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Leaf, Award, Compass, Sparkles, User, ShoppingCart, ShoppingBag, Heart, Smartphone, Instagram, MessageCircle } from 'lucide-react';
import { products } from './data';
import { Product, ViewState, Profile } from './types';
import { db } from './supabase';

// ============================================================================
// CONFIGURAÇÃO DAS REDES SOCIAIS (Altere aqui para trocar os links!)
// ============================================================================
export const REDES_SOCIAIS = {
  // Seu link do Instagram completo
  instagramUrl: "https://www.instagram.com/sabordaterra.hortifrutii?igsh=MW5vaHQ1azl3aTRnaQ==",
  
  // Seu telefone comercial do WhatsApp com código de área (Ex: "5511991823812")
  whatsappNumber: "5511978272501",
  
  // Mensagem padrão ao iniciar conversa pelo site
  whatsappMessage: "Olá! Vi os produtos orgânicos no site Sabor da Terra de Mel e Ervas e gostaria de esclarecer algumas dúvidas!"
};

export const getWhatsAppUrl = () => {
  return `https://wa.me/${REDES_SOCIAIS.whatsappNumber}?text=${encodeURIComponent(REDES_SOCIAIS.whatsappMessage)}`;
};

// Subcomponents imports
import SetupBanner from './components/SetupBanner';
import ProductCard from './components/ProductCard';
import CheckoutForm from './components/CheckoutForm';
import AuthSection from './components/AuthSection';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [view, setView] = useState<ViewState>('loja');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  
  // Client Authentication values
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  
  // Admin Login States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  // Monitor location hash for secret route-like navigations (/admin)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/admin' || hash === '#/admin/login' || hash === '#admin') {
        setView('admin-dashboard');
      } else if (hash === '#/conta' || hash === '#conta') {
        setView('user-auth');
      } else if (hash === '#/checkout' || hash === '#checkout') {
        setView('checkout');
      } else {
        setView('loja');
      }
    };

    // Run once on load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync user from local memory / Supabase session on first load
  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setView('checkout');
    // Scroll smoothly to checkout form section
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleCheckoutBack = () => {
    setView('loja');
    setSelectedProduct(null);
  };

  const handleUserChange = (newUser: Profile | null) => {
    setCurrentUser(newUser);
  };

  // Filter storefront items
  const filteredProducts = activeCategory === 'todos'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#FDFCF0] text-[#1B3022] flex flex-col font-sans selection:bg-[#E9C46A]/20 selection:text-[#1B3022]">
      {/* Dev Guidance Banner */}
      <SetupBanner />

      {/* Main Artisan Header Navbar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-stone-200 z-50 transition-all duration-300 shadow-3xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          
          {/* Logo Branding - Warm and Natural */}
          <div 
            onClick={() => {
              window.location.hash = '';
              setView('loja');
            }} 
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-amber-50 group-hover:scale-105 duration-300 transition flex items-center justify-center shadow-xs">
              <Leaf className="w-5.5 h-5.5 rotate-12 text-amber-200" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-stone-900 tracking-tight leading-none group-hover:text-emerald-800 transition">
                Sabor da Terra
              </h1>
              <span className="text-[10px] text-stone-400 font-mono tracking-widest uppercase block mt-1">
                Mel, Flores & Ervas Orgânicas
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-3">
            <button
              onClick={() => {
                window.location.hash = '';
                setView('loja');
              }}
              className={`text-xs font-semibold py-2 px-3 sm:px-4 rounded-xl cursor-pointer transition ${
                view === 'loja'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                  : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-50'
              }`}
            >
              Nossa Vitrine
            </button>

            {/* Shopping Cart button showing status of active order */}
            <button
              onClick={() => setView('checkout')}
              className={`text-xs font-semibold py-2 px-3 sm:px-4 rounded-xl cursor-pointer transition flex items-center gap-1.5 ${
                view === 'checkout'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-150'
                  : 'text-stone-600 hover:text-emerald-800 hover:bg-stone-50'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Finalizar</span>
              {selectedProduct && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </button>

            {/* Client Portal with initials or icon */}
            <button
              onClick={() => {
                setView('user-auth');
              }}
              className={`text-xs font-semibold py-2 px-3.5 rounded-xl cursor-pointer transition flex items-center gap-2 border ${
                view === 'user-auth'
                  ? 'bg-emerald-700 text-white border-emerald-750 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {currentUser ? (
                <>
                  <div className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-950 flex items-center justify-center text-[9px] font-bold">
                    {currentUser.nome ? currentUser.nome[0].toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[70px] truncate hidden sm:inline">{currentUser.nome}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Minha Conta</span>
                </>
              )}
            </button>

            {/* Redes Sociais Integradas */}
            <div className="flex items-center gap-1 border-l border-stone-200 pl-2 lg:pl-3 ml-1">
              <a
                href={REDES_SOCIAIS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-stone-500 hover:text-amber-500 rounded-xl transition hover:bg-stone-50 cursor-pointer"
                title="Siga-nos no Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-stone-500 hover:text-emerald-600 rounded-xl transition hover:bg-stone-50 cursor-pointer"
                title="Converse no WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Containers */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {view === 'loja' && (
          <div className="space-y-10">
            {/* Organic Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-emerald-900 text-amber-50 min-h-[320px] flex items-center p-6 sm:p-10 lg:p-14 shadow-md bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-800 via-emerald-950 to-stone-950">
              <div className="max-w-xl space-y-4 z-10 relative">
                <span className="text-[10px] tracking-widest text-amber-300 uppercase font-bold font-mono bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-800/40 w-fit block shadow-sm">
                  🌾 Agricultura familiar da serra
                </span>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif leading-tight">
                  Alimentos Puros e Ervas que Curam
                </h2>
                
                <p className="text-amber-100/80 text-sm leading-relaxed">
                  Cultivos orgânicos, mel de florada nativa e plantas fitoterápicas aromáticas colhidas artesanalmente para levar a energia da terra direto à sua mesa.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-200 font-semibold">
                    <Award className="w-4.5 h-4.5 text-amber-400" />
                    <span>Pureza Analisada</span>
                  </div>
                  <span className="opacity-30">|</span>
                  <div className="flex items-center gap-1.5 text-xs text-amber-200 font-semibold">
                    <Compass className="w-4.5 h-4.5 text-amber-400" />
                    <span>Atendimento via WhatsApp</span>
                  </div>
                </div>
              </div>

              {/* Aesthetic golden overlay background elements */}
              <div className="absolute top-0 right-0 w-80 h-full opacity-10 bg-repeat bg-center select-none pointer-events-none hidden lg:block" 
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/honeycomb.png")' }}>
              </div>
            </div>

            {/* Category selection filters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Nossos Produtos Originais
                  </h3>
                  <p className="text-xs text-stone-500">Selecione filtros rápidos para conferir nosso mel puro e folhagens</p>
                </div>
                
                <span className="text-[11px] font-mono font-medium text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full uppercase">
                  {filteredProducts.length} itens disponíveis
                </span>
              </div>

              {/* Responsive Category Badges */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: 'todos', name: '🌱 Ver Tudo' },
                  { id: 'mel', name: '🍯 Méis e Própolis' },
                  { id: 'plantas', name: '🌿 Plantas & Ervas' },
                  { id: 'vegetais', name: '🍅 Vegetais Frescos' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`text-xs font-semibold py-2 px-4 rounded-xl border transition cursor-pointer select-none ${
                      activeCategory === cat.id
                        ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products grid showglass */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelectProduct={handleSelectProduct}
                />
              ))}
            </div>
          </div>
        )}

        {view === 'checkout' && (
          <CheckoutForm
            selectedProduct={selectedProduct}
            onBack={handleCheckoutBack}
            currentUser={currentUser}
            onUserChange={handleUserChange}
          />
        )}

        {view === 'user-auth' && (
          <AuthSection
            currentUser={currentUser}
            onUserChange={handleUserChange}
            onNavigateHome={() => setView('loja')}
          />
        )}

        {view === 'admin-dashboard' && (
          <AdminPanel
            isAdminLoggedIn={isAdminLoggedIn}
            onAdminLoginStateChange={setIsAdminLoggedIn}
            onNavigateHome={() => setView('loja')}
          />
        )}
      </main>

      {/* Aesthetic Natural Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-850 mt-16 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-stone-150">
              <Leaf className="w-5 h-5 text-emerald-500 rotate-12" />
              <span className="font-serif font-black text-sm tracking-wide">SABOR DA TERRA</span>
            </div>
            <p className="leading-relaxed text-stone-500 max-w-xs">
              Valorizando o cultivo artesanal, unindo mel puro de floradas raras, mudas selecionadas e vegetais direto da horta orgânica para você.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-stone-300 font-semibold tracking-wider font-mono text-[11px] uppercase">Contatos & Redes Sociais</h4>
            <p className="text-stone-500 leading-relaxed font-sans">
              Telefone: (11) 99182-3812<br />
              Atendimento de Segunda à Sexta das 08h às 18h.<br />
              Email: contato@sabordaterra.delivery
            </p>
            
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-stone-150 rounded-xl transition font-semibold text-xs border border-emerald-750 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
              <a
                href={REDES_SOCIAIS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-150 rounded-xl transition font-semibold text-xs border border-stone-700 cursor-pointer"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Invisible Admin Trigger according to constraints: "NAO DEIXE NADA NO SITE ESCRITO ADMIN APENAS COMPRAS LA" */}
          <div className="space-y-4 flex flex-col justify-between items-start md:items-end">
            <div className="text-left md:text-right">
              <span className="text-stone-300 font-semibold tracking-wider font-mono text-[11px] uppercase block mb-1">
                Garantia de Qualidade
              </span>
              <p className="text-stone-500 leading-relaxed max-w-xs">
                Certificados pelo selo de agricultura familiar, livre de solventes químicos ou aditivos aglutinantes.
              </p>
            </div>
            
            {/* Extreme footer - subtle leaf dot for hidden administrator access click */}
            <div className="flex items-center justify-between w-full md:justify-end gap-4 border-t border-stone-800 pt-4 md:border-0 md:pt-0">
              <span className="text-stone-600 text-[10px] block">
                &copy; {new Date().getFullYear()} Sabor da Terra.
              </span>
              
              {/* This subtle leaf operates as a developer / administrator gateway to /admin/login */}
              <button
                onClick={() => {
                  window.location.hash = '#/admin/login';
                  setView('admin-dashboard');
                }}
                className="text-stone-700 hover:text-emerald-800 p-1.5 rounded transition cursor-pointer"
                title="Portal restrito"
              >
                <Leaf className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
