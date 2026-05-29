/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogOut, CheckCircle2, Clock, Trash2, HelpCircle, Terminal, RefreshCw, Layers, Phone, Mail, Search } from 'lucide-react';
import { db } from '../supabase';
import { Pedido } from '../types';

interface AdminPanelProps {
  isAdminLoggedIn: boolean;
  onAdminLoginStateChange: (loggedIn: boolean) => void;
  onNavigateHome: () => void;
}

export default function AdminPanel({ isAdminLoggedIn, onAdminLoginStateChange, onNavigateHome }: AdminPanelProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchPedidos();
    }
  }, [isAdminLoggedIn]);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.getPedidos();
      if (!error && data) {
        setPedidos(data);
      } else if (error) {
        console.error("Error fetching pedidos:", error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Strict requirements from prompt: "Validar estritamente o usuário 'admin' com a senha 'cpd123'."
    if (username.trim() === 'admin' && password === 'cpd123') {
      onAdminLoginStateChange(true);
    } else {
      setErrorMsg('Credenciais administrativas inválidas. Verifique o usuário e a senha.');
    }
  };

  const handleUpdateStatus = async (pedidoId: string, newStatus: 'pendente' | 'confirmado' | 'despachado') => {
    try {
      const { error } = await db.updatePedidoStatus(pedidoId, newStatus);
      if (!error) {
        // Update local state instantly
        setPedidos(prev => 
          prev.map(p => p.id === pedidoId ? { ...p, status: newStatus } : p)
        );
      } else {
        alert('Erro ao atualizar status no Supabase: ' + error);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    onAdminLoginStateChange(false);
    setUsername('');
    setPassword('');
  };

  // Filter list
  const filteredPedidos = pedidos.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      p.nome_cliente.toLowerCase().includes(query) ||
      p.produto_nome.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query);
    
    const matchesStatus = filterStatus === 'todos' || p.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalSales = pedidos.reduce((acc, current) => acc + current.valor_total, 0);
  const totalOrdersCount = pedidos.length;
  const pendingOrdersCount = pedidos.filter(p => p.status === 'pendente' || !p.status).length;
  const confirmedOrdersCount = pedidos.filter(p => p.status === 'confirmado').length;

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-stone-200 rounded-3xl shadow-lg animate-fadeIn text-stone-850">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-150 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">Acesso Restrito</h2>
          <p className="text-xs text-stone-500 mt-1">Insira suas credenciais da fazenda de mel e ervas.</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200 text-xs mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Usuário Administrativo
            </label>
            <input
              type="text"
              required
              placeholder="Digite o identificador"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-stone-50 border border-stone-250 rounded-xl py-2.5 px-3.5 text-xs text-stone-900 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Senha de Acesso (CPD)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-250 rounded-xl py-2.5 px-3.5 text-xs text-stone-900 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-stone-900 hover:bg-stone-850 active:bg-stone-950 text-white font-medium text-xs py-3 rounded-xl transition shadow-xs cursor-pointer select-none"
          >
            Autenticar no Sistema
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-150 text-center">
          <button
            onClick={onNavigateHome}
            className="text-stone-400 hover:text-stone-600 text-xs transition cursor-pointer font-medium"
          >
            Acessar com perfil cliente normal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50/50 rounded-2xl border border-stone-200 p-6 md:p-8 max-w-6xl mx-auto shadow-md animate-fadeIn my-4 text-stone-850">
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded">
            Painel Geral do Produtor
          </span>
          <h2 className="text-2xl font-serif font-black text-stone-900 mt-1.5 flex items-center gap-2">
            Controle de Pedidos Supabase
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPedidos}
            disabled={loading}
            className="p-2 border border-stone-200 hover:border-emerald-700 hover:bg-white rounded-lg text-stone-600 transition cursor-pointer disabled:opacity-50"
            title="Recarregar do Banco"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="text-xs bg-stone-900 hover:bg-stone-850 text-white py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer font-medium shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Admin</span>
          </button>
        </div>
      </div>

      {/* Metrics bento-style highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Faturamento Total</span>
          <p className="text-xl font-bold font-serif text-stone-900 mt-1">
            {totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Total de Pedidos</span>
          <p className="text-xl font-bold font-serif text-stone-950 mt-1">{totalOrdersCount}</p>
        </div>

        <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl">
          <span className="text-[10px] text-amber-800 font-semibold uppercase tracking-wider">Aguardando Envio</span>
          <p className="text-xl font-bold font-serif text-amber-900 mt-1">{pendingOrdersCount}</p>
        </div>

        <div className="bg-emerald-50/40 border border-emerald-250/50 p-4 rounded-xl">
          <span className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">Despachados / Confirmados</span>
          <p className="text-xl font-bold font-serif text-emerald-900 mt-1">{confirmedOrdersCount + (totalOrdersCount - pendingOrdersCount - confirmedOrdersCount)}</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Pesquisar por cliente, e-mail ou produto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 pl-9 pr-4 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-700/20 focus:border-emerald-750 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-medium">Status:</span>
          {['todos', 'pendente', 'confirmado', 'despachado'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs px-3 py-1 rounded-lg border transition capitalize cursor-pointer font-medium ${
                filterStatus === status
                  ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs'
                  : 'bg-stone-50 border-stone-220 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Live Table database display */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden mt-6 shadow-2xs">
        {loading ? (
          <div className="p-16 text-center text-xs text-stone-500">
            Acessando banco de dados no Supabase...
          </div>
        ) : filteredPedidos.length === 0 ? (
          <div className="p-16 text-center text-stone-500 text-xs">
            Nenhum pedido condizente com os filtros encontrados no Supabase.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px] uppercase tracking-wider select-none">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Produto Requirido</th>
                  <th className="py-3 px-4">Faturamento</th>
                  <th className="py-3 px-4">Canais de Contato</th>
                  <th className="py-3 px-4">Situação</th>
                  <th className="py-3 px-4 text-right">Ação Operacional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPedidos.map((ped) => (
                  <tr key={ped.id} className="hover:bg-stone-50/50 transition">
                    {/* Buyer column */}
                    <td className="py-4 px-4 font-medium text-stone-900">
                      <div>{ped.nome_cliente}</div>
                      <span className="text-[10px] text-stone-400 font-mono italic block">
                        {ped.created_at ? new Date(ped.created_at).toLocaleString('pt-BR') : 'Sem data'}
                      </span>
                    </td>
                    
                    {/* Product cell */}
                    <td className="py-4 px-4 font-serif font-semibold text-stone-850">
                      {ped.produto_nome}
                    </td>

                    {/* Total billing */}
                    <td className="py-4 px-4 font-mono font-bold text-stone-900 text-sm">
                      {ped.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>

                    {/* Contact columns */}
                    <td className="py-4 px-4 space-y-1">
                      <a
                        href={`https://wa.me/55${ped.telefone.replace(/\D/g, '')}?text=Olá,%20acabo%20de%20organizar%20seu%20recibo%20no%20sistema.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-800 hover:underline font-semibold"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{ped.telefone}</span>
                      </a>
                      <div className="text-stone-500 text-[10px] flex items-center gap-1 font-mono">
                        <Mail className="w-2.5 h-2.5" />
                        <span>{ped.email}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                        ped.status === 'confirmado' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : ped.status === 'despachado'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200/60'
                      }`}>
                        {ped.status === 'confirmado' && <CheckCircle2 className="w-3 h-3" />}
                        {ped.status === 'pendente' && <Clock className="w-3 h-3" />}
                        {ped.status === 'despachado' && <CheckCircle2 className="w-3 h-3" />}
                        {ped.status || 'pendente'}
                      </span>
                    </td>

                    {/* Status Toggle trigger actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(ped.id!, 'confirmado')}
                          disabled={ped.status === 'confirmado'}
                          className="bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 py-1 px-2 rounded-lg text-[10px] font-semibold cursor-pointer select-none disabled:opacity-30 disabled:pointer-events-none"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(ped.id!, 'despachado')}
                          disabled={ped.status === 'despachado'}
                          className="bg-stone-50 hover:bg-blue-50 text-stone-600 hover:text-blue-800 border border-stone-200 hover:border-blue-300 py-1 px-2 rounded-lg text-[10px] font-semibold cursor-pointer select-none disabled:opacity-30 disabled:pointer-events-none"
                        >
                          Despachar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-stone-900 rounded-xl text-stone-300 space-y-3 shadow-inner">
        <h4 className="font-semibold text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-stone-850 pb-2">
          <Terminal className="w-4 h-4" />
          Depuração de Automação de E-mail (Groq API Integrador)
        </h4>
        <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
          Quando o cliente finaliza o formulário, fazemos o disparo assíncrono para o Webhook do N8N. O N8N recebe esse evento, monta o prompt adequado com as informações, consulta o seu modelo LLM preferencial da Groq (como o Llama-3) para gerar um estilo calmo e disparar o e-mail de confirmação.
        </p>
      </div>
    </div>
  );
}
