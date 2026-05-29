/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, Send, CheckCircle2, Loader2, Sparkles, AlertCircle, ShoppingCart } from 'lucide-react';
import { Product, Pedido, Profile } from '../types';
import { db, hasRealSupabase } from '../supabase';
import { REDES_SOCIAIS } from '../App';

interface CheckoutFormProps {
  selectedProduct: Product | null;
  onBack: () => void;
  currentUser: Profile | null;
  onUserChange: (user: Profile | null) => void;
}

export default function CheckoutForm({ selectedProduct, onBack, currentUser, onUserChange }: CheckoutFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [criarConta, setCriarConta] = useState(false);
  const [senha, setSenha] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ultimoPedidoId, setUltimoPedidoId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Webhook details to show outgoing json to developer
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [webhookLogs, setWebhookLogs] = useState<string>('');

  // Autofill if logged in
  useEffect(() => {
    if (currentUser) {
      setNome(currentUser.nome || '');
      setTelefone(currentUser.telefone || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  if (!selectedProduct) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-stone-150 text-center max-w-md mx-auto my-12 shadow-xs">
        <div className="bg-stone-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-700">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="font-serif text-xl font-semibold mb-2">Nenhum item selecionado</h3>
        <p className="text-stone-500 text-sm mb-6">Explore o nosso catálogo acima e escolha um ingrediente natural de sua preferência para iniciar.</p>
        <button
          onClick={onBack}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs py-2.5 px-6 rounded-lg transition-colors cursor-pointer"
        >
          Ver Catálogo
        </button>
      </div>
    );
  }

  const valorTotal = selectedProduct.price * quantity;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setWebhookStatus('idle');

    if (!nome.trim() || !telefone.trim() || !email.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      // 1. If signup checkbox checked and not logged-in, sign them up
      if (criarConta && !currentUser) {
        if (senha.length < 6) {
          throw new Error('A senha para cadastro no site deve ter no mínimo 6 caracteres.');
        }
        const signUpRes = await db.signUpUser(nome, telefone, email, senha);
        if (signUpRes.error) {
          throw new Error(`Erro ao registrar conta: ${signUpRes.error}`);
        }
        // Log them in
        const usr = db.getCurrentUser();
        onUserChange(usr);
      }

      // 2. Insert Pedido to Supabase
      const novoPedido: Pedido = {
        nome_cliente: nome,
        telefone,
        email,
        produto_nome: `${selectedProduct.name} (${quantity}x ${selectedProduct.unit})`,
        valor_total: valorTotal
      };

      const { data, error } = await db.insertPedido(novoPedido);
      if (error) {
        throw new Error(`Erro ao salvar pedido no Supabase: ${error}`);
      }

      const savedPedido = data && data[0] ? data[0] : novoPedido;
      const pedidoId = savedPedido.id || 'simulado-' + Math.random().toString(36).substr(2, 9);
      setUltimoPedidoId(pedidoId);

      // 3. Dispatch to N8N Webhook with required Groq simulation format
      triggerN8NWebhook({
        id: pedidoId,
        nome: nome,
        telefone: telefone,
        email: email,
        produto: selectedProduct.name,
        quantidade: quantity,
        unidade: selectedProduct.unit,
        valor_total: valorTotal,
        webhookUrlCustom: (import.meta as any).env.VITE_N8N_WEBHOOK_URL || ''
      });

      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const triggerN8NWebhook = async (payload: any) => {
    setWebhookStatus('sending');
    const webhookUrl = (import.meta as any).env.VITE_N8N_WEBHOOK_URL || 'https://fake-n8n.com/mock-webhook';
    
    const formattedLog = `POST REQUEST to: ${webhookUrl}\nContent-Type: application/json\n\nPayload: ${JSON.stringify(payload, null, 2)}`;
    setWebhookLogs(formattedLog);

    try {
      // If user supplied a real webhook URL in environments
      if ((import.meta as any).env.VITE_N8N_WEBHOOK_URL) {
        const response = await fetch((import.meta as any).env.VITE_N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (response.ok) {
          setWebhookStatus('success');
        } else {
          setWebhookStatus('failed');
          console.warn('Webhook N8N returned code:', response.status);
        }
      } else {
        // High fidelity sandbox delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setWebhookStatus('success'); // simulated success
      }
    } catch (error) {
      console.error('Webhook fetch failed:', error);
      setWebhookStatus('failed');
    }
  };

  if (success) {
    const isSandboxing = !hasRealSupabase();
    return (
      <div className="bg-white rounded-2xl max-w-xl mx-auto border border-stone-150 p-8 shadow-md text-stone-850 text-center animate-fadeIn my-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-700 shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Pedido Recebido com Sucesso!</h2>
        <p className="text-stone-600 text-sm mb-4">
          Olá, <strong className="text-emerald-800">{nome}</strong>! Sua solicitação de compra para{' '}
          <strong>{selectedProduct.name}</strong> foi gravada no sistema.
        </p>

        {isSandboxing && (
          <div className="bg-amber-50 rounded-xl p-4 text-xs text-amber-900 mb-6 border border-amber-200 text-left space-y-2">
            <span className="font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> AMBIENTE SIMULADO SANDBOX</span>
            <p>O pedido foi armazenado com sucesso no <strong>LocalStorage</strong> para simulação e estará visível na seção oculta do painel administrativo.</p>
          </div>
        )}

        <div className="bg-stone-50 rounded-xl p-4 text-left border border-stone-200 mb-6">
          <h4 className="text-xs font-mono font-medium text-stone-400 uppercase tracking-wider mb-2">Resumo do Pedido</h4>
          <div className="grid grid-cols-2 gap-y-2 text-xs text-stone-700">
            <span>ID do Pedido:</span>
            <span className="font-mono text-stone-900 font-medium truncate">{ultimoPedidoId}</span>
            <span>Item Adquirido:</span>
            <span className="font-semibold text-stone-900">{selectedProduct.name}</span>
            <span>Quantidade / Medida:</span>
            <span>{quantity}x ({selectedProduct.unit})</span>
            <span>Preço dos Itens:</span>
            <span>{(selectedProduct.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            <span className="font-semibold text-emerald-800 border-t border-dashed border-stone-200 pt-2">Valor Total Gravado:</span>
            <span className="font-bold text-stone-900 border-t border-dashed border-stone-200 pt-2 text-sm">
              {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        {/* N8N Log details for integration inspection */}
        <div className="bg-stone-900 rounded-xl p-4 text-left font-mono text-xs text-stone-300 mb-6 shadow-inner overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2 text-[10px]">
            <span className="text-stone-400 uppercase font-semibold">Logs de Automação (N8N API Gateway)</span>
            {webhookStatus === 'success' && <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-900">● Enviado</span>}
            {webhookStatus === 'sending' && <span className="bg-amber-950 text-amber-400 px-2 py-0.5 rounded-full border border-amber-900">Enviando...</span>}
            {webhookStatus === 'failed' && <span className="bg-red-950 text-red-400 px-2 py-0.5 rounded-full border border-red-900">● Não enviado</span>}
          </div>
          <pre className="max-h-[140px] overflow-y-auto whitespace-pre-wrap text-stone-400 text-[11px] leading-tight select-all">
            {webhookLogs || 'Preparando payload do webhook...'}
          </pre>
          <div className="mt-2 text-[10px] text-stone-500">
            O webhook envia este JSON para o N8N. O N8N repassa para o Groq analisar e gerar a confirmação de correio automático: <strong className="text-stone-400">"A compra do item [{selectedProduct.name}] no valor de {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foi feita com sucesso"</strong>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onBack}
            className="border border-stone-200 hover:bg-stone-50 text-stone-700 py-2.5 px-6 rounded-lg transition-colors text-xs font-semibold cursor-pointer"
          >
            Voltar para a Vitrine
          </button>
          
          <a
            href={`https://wa.me/${REDES_SOCIAIS.whatsappNumber}?text=Olá!%20Acabei%20de%20solicitar%20um%20pedido%20pelo%20site%20Sabor%20da%20Terra!%0A%0A*Cliente:*%20${encodeURIComponent(nome)}%0A*Produto:*%20${quantity}x%20${encodeURIComponent(selectedProduct.name)}%20(${selectedProduct.unit})%0A*Valor%20Total:*%20R$%20${valorTotal.toFixed(2).replace('.', ',')}%0A*ID%20do%20Pedido:*%20${ultimoPedidoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            WhatsApp do Vendedor
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-150 p-6 md:p-8 max-w-3xl mx-auto shadow-md text-stone-850 my-6 animate-fadeIn">
      {/* Back button link */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-emerald-700 transition-colors mb-6 cursor-pointer font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Voltar para a vitrine principal</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Product recap / Multiplier */}
        <div className="md:col-span-5 space-y-5">
          <div className="bg-stone-50 border border-stone-150 rounded-2xl p-5">
            <h4 className="text-[10px] tracking-wider uppercase font-mono font-medium text-stone-400 mb-3 block">Item Selecionado</h4>
            
            <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-stone-100">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight">
              {selectedProduct.name}
            </h3>
            <span className="text-xs text-stone-500 font-mono mt-1 block">{selectedProduct.unit}</span>

            <div className="mt-5 pt-4 border-t border-stone-200">
              {/* Responsive Counter quantity wrapper */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-stone-500 font-medium font-sans">Quantidade</span>
                <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className="text-stone-400 hover:text-emerald-700 font-bold px-1.5 py-0.5 cursor-pointer select-none"
                  >
                    -
                  </button>
                  <span className="font-semibold text-stone-900 font-mono text-sm w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-stone-400 hover:text-emerald-700 font-bold px-1.5 py-0.5 cursor-pointer select-none"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider">Valor total</span>
                  <span className="text-xs text-stone-400">c/ {quantity} unidade(s)</span>
                </div>
                <span className="text-2xl font-serif font-bold text-stone-900">
                  {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-stone-50 border border-stone-150 rounded-xl text-xs space-y-1 text-stone-600 leading-relaxed">
            <span className="font-semibold text-stone-800 block">Informação de Frete</span>
            <p>Nossos méis e ervas são enviados diretamente do produtor com embalagem reciclável e isolamento térmico.</p>
          </div>
        </div>

        {/* Right Side: Buyer details Form */}
        <form onSubmit={handleSubmit} className="md:col-span-7 space-y-5">
          <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-700" />
            Dados da sua encomenda
          </h3>
          <p className="text-xs text-stone-500 -mt-3">
            O pedido será processado de forma 100% segura. Insira os dados abaixo para efetuarmos a confirmação.
          </p>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 text-red-900 rounded-xl border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="checkout-nome" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Seu Nome Completo *
              </label>
              <input
                id="checkout-nome"
                type="text"
                required
                placeholder="Ex: Clara dos Anjos Guimarães"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={loading || !!currentUser}
                className="w-full bg-stone-50 border border-stone-250 rounded-xl py-2.5 px-3.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all disabled:opacity-75 disabled:bg-stone-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-telefone" className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Telefone (WhatsApp) *
                </label>
                <input
                  id="checkout-telefone"
                  type="text"
                  required
                  placeholder="Ex: (11) 99999-9999"
                  value={telefone}
                  onChange={handlePhoneChange}
                  disabled={loading || !!currentUser}
                  className="w-full bg-stone-50 border border-stone-250 rounded-xl py-2.5 px-3.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all font-mono disabled:opacity-75 disabled:bg-stone-100"
                />
              </div>

              <div>
                <label htmlFor="checkout-email" className="block text-xs font-semibold text-stone-700 mb-1.5">
                  E-mail de Contato *
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  placeholder="Ex: clara@suaempresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || !!currentUser}
                  className="w-full bg-stone-50 border border-stone-250 rounded-xl py-2.5 px-3.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all disabled:opacity-75 disabled:bg-stone-100"
                />
              </div>
            </div>

            {/* Optional profile integration to saving to auth table/profiles */}
            {!currentUser && (
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-150/40 mt-2 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={criarConta}
                    onChange={(e) => setCriarConta(e.target.checked)}
                    className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-emerald-900">
                    Cadastrar conta no site para colecionar meus pedidos
                  </span>
                </label>

                {criarConta && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label htmlFor="checkout-senha" className="block text-xs font-semibold text-emerald-950">
                      Crie uma Senha Segura (Supabase Auth)
                    </label>
                    <input
                      id="checkout-senha"
                      type="password"
                      required={criarConta}
                      placeholder="Mínimo 6 dígitos"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full bg-white border border-stone-250 rounded-xl py-2 px-3 text-xs text-stone-950 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition"
                    />
                    <p className="text-[10px] text-emerald-800 leading-tight">
                      Isso persistirá sua conta na tabela de <strong>autenticação interna</strong> e criará automaticamente seu registro na tabela <strong>profiles</strong> do Supabase do produtor florestal.
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentUser && (
              <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-900 border border-emerald-200">
                Identificado como <strong className="text-emerald-900">{currentUser.nome}</strong> ({currentUser.email}). Seus dados cadastrados serão preenchidos automaticamente.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-emerald-700/50 text-white font-medium text-sm py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-700 flex items-center justify-center gap-2 cursor-pointer transform duration-150"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando pedido com Supabase...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirmar Encomenda R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
