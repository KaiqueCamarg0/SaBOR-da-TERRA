/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Mail, Lock, Phone, UserPlus, LogOut, FileText, CheckCircle2, Clock } from 'lucide-react';
import { db } from '../supabase';
import { Profile, Pedido } from '../types';

interface AuthSectionProps {
  currentUser: Profile | null;
  onUserChange: (user: Profile | null) => void;
  onNavigateHome: () => void;
}

export default function AuthSection({ currentUser, onUserChange, onNavigateHome }: AuthSectionProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [userOrders, setUserOrders] = useState<Pedido[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch client personal orders from Supabase (filtered client side or via API)
  useEffect(() => {
    if (currentUser) {
      fetchUserHistory();
    }
  }, [currentUser]);

  const fetchUserHistory = async () => {
    if (!currentUser) return;
    setLoadingOrders(true);
    try {
      const { data, error: err } = await db.getPedidos();
      if (!err && data) {
        // Filter by current logged-in user email
        const filtered = data.filter(p => p.email.toLowerCase() === currentUser.email.toLowerCase());
        setUserOrders(filtered);
      }
    } catch (e) {
      console.warn("Could not load user order history:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (!nome || !telefone || !email || !senha) {
          throw new Error('Todos os campos são obrigatórios para cadastro.');
        }
        if (senha.length < 6) {
          throw new Error('A senha deve ter no mínimo 6 caracteres.');
        }
        const { data, error: signUpErr } = await db.signUpUser(nome, telefone, email, senha);
        if (signUpErr) throw new Error(signUpErr);
        
        // Log in simulation
        const profile = db.getCurrentUser();
        onUserChange(profile);
      } else {
        if (!email || !senha) {
          throw new Error('E-mail e senha são requeridos para login.');
        }
        const { data, error: logErr } = await db.loginUser(email, senha);
        if (logErr) throw new Error(logErr);
        
        const profile = db.getCurrentUser();
        onUserChange(profile);
      }
    } catch (err: any) {
      setError(err.message || 'Erro de autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    db.logoutUser();
    onUserChange(null);
    setUserOrders([]);
  };

  // Mask Phone number: (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 10) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setTelefone(value);
  };

  // Logged-In User Dashboard Panel
  if (currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-stone-150 p-6 md:p-8 max-w-4xl mx-auto shadow-md animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-lg border border-emerald-150">
              {currentUser.nome ? currentUser.nome[0].toUpperCase() : 'U'}
            </div>
            <div>
              <span className="text-xs text-stone-400 font-medium">Conta Cliente Autenticada</span>
              <h2 className="text-xl font-bold font-serif text-stone-900">{currentUser.nome}</h2>
              <span className="text-xs text-stone-500">{currentUser.email}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onNavigateHome}
              className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Comprar Produtos
            </button>
            <button
              onClick={handleLogout}
              className="text-xs border border-stone-200 hover:bg-stone-50 text-stone-600 font-medium py-2 px-4 rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* History of customer pedidos */}
        <div className="mt-8">
          <h3 className="font-serif text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-800" />
            Minhas Encomendas Recentes
          </h3>

          {loadingOrders ? (
            <div className="py-12 text-center text-stone-500 text-xs">
              Carregando histórico do Supabase...
            </div>
          ) : userOrders.length === 0 ? (
            <div className="bg-stone-50 rounded-xl py-12 px-4 text-center text-stone-500 border border-dashed border-stone-200 text-xs">
              Você ainda não efetuou compras ou seus pedidos foram registrados de forma anônima.
              <button
                onClick={onNavigateHome}
                className="mt-3 block mx-auto text-emerald-700 hover:underline font-bold"
              >
                Faça seu primeiro pedido agora
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {userOrders.map((ped, index) => (
                <div key={ped.id || index} className="border border-stone-150 rounded-xl p-4 hover:border-stone-300 transition bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider font-mono bg-stone-200/60 text-stone-700 px-2 py-0.5 rounded">
                        ID: {ped.id?.slice(0, 8) || 'Simulado'}
                      </span>
                      <span className="text-xs text-stone-400">
                        {ped.created_at ? new Date(ped.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-stone-900 text-sm">
                      {ped.produto_nome}
                    </h4>
                    <p className="text-xs text-stone-500">
                      Contato: {ped.telefone}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-0 pt-2 sm:pt-0 border-stone-100">
                    <span className="text-sm font-bold text-stone-900 font-serif">
                      {ped.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    
                    <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      ped.status === 'confirmado' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : ped.status === 'despachado'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {ped.status === 'confirmado' && <CheckCircle2 className="w-3 h-3" />}
                      {ped.status === 'pendente' && <Clock className="w-3 h-3" />}
                      {ped.status === 'despachado' && <CheckCircle2 className="w-3 h-3" />}
                      {ped.status || 'pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Auth Forms Selection
  return (
    <div className="bg-white rounded-2xl border border-stone-150 p-6 md:p-8 max-w-md mx-auto shadow-md animate-fadeIn my-12">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-150">
          <User className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl font-bold text-stone-900">
          {isSignUp ? 'Criar Conta Cliente' : 'Acesse seu painel'}
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          {isSignUp 
            ? 'Registe seus dados para salvar todo seu histórico de compra.' 
            : 'Consulte o andamento das suas encomendas de mel e ervas.'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200 text-xs flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nome Completo
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ex e-mail: Joana Dark"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-stone-50 border border-stone-250 rounded-xl py-2 px-3 text-xs text-stone-950 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none"
              />
            </div>
          </div>
        )}

        {isSignUp && (
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Telefone (WhatsApp)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                required
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={handlePhoneChange}
                className="w-full bg-stone-50 border border-stone-250 rounded-xl py-2 pl-9 pr-3 text-xs text-stone-950 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none font-mono"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
            <input
              type="email"
              required
              placeholder="seu@endereço.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-250 rounded-xl py-2 pl-9 pr-3 text-xs text-stone-950 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Senha Secreta
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
            <input
              type="password"
              required
              placeholder="Senha (mínimo 6 dígitos)"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-stone-50 border border-stone-250 rounded-xl py-2 pl-9 pr-3 text-xs text-stone-950 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {loading ? (
            'Registrando no Supabase...'
          ) : isSignUp ? (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Concluir Cadastro</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5" />
              <span>Acessar Portal</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-stone-150 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError('');
          }}
          className="text-xs text-emerald-800 hover:underline font-medium cursor-pointer"
        >
          {isSignUp ? 'Já possui conta? Acesse por aqui' : 'Ainda não habilitou cadastro? clique aqui'}
        </button>
      </div>
    </div>
  );
}
