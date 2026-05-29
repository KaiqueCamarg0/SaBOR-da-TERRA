/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, HelpCircle, Key, ChevronDown, ChevronUp, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { hasRealSupabase } from '../supabase';

export default function SetupBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const isSupabaseActive = hasRealSupabase();

  const handleCopySql = () => {
    const sql = `-- SCRIPT SQL PARA O SUPABASE EDITOR
-- 1. Criação da tabela de Perfis (Profiles) de Clientes
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criação da tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_cliente TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL,
    produto_nome TEXT NOT NULL,
    valor_total NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'despachado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitação do Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (Row Level Security Policies)
-- Permite que qualquer um (anon e logados) insira pedidos e leia
CREATE POLICY "Permitir inserções públicas de pedidos" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir leitura pública de pedidos" ON public.pedidos FOR SELECT USING (true);

-- Permite que qualquer um cadastre e gerencie perfis sem erros de autenticação
CREATE POLICY "Permitir inserção pública de perfis" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir leitura de perfis pública" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir atualização do próprio perfil" ON public.profiles FOR UPDATE USING (true);

-- 5. FUNCTION & TRIGGER SUGERIDA (Opcional)
-- Se você receber o erro "Database error saving new user", pode ser um problema com triggers antigos quebrados.
-- Rode as linhas abaixo para recriar o sincronizador limpo do auth:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, telefone)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Novo Usuário'),
    new.email,
    coalesce(new.raw_user_meta_data->>'telefone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-stone-600">
          <Database className={`w-4 h-4 ${isSupabaseActive ? 'text-emerald-600' : 'text-amber-500 animate-pulse'}`} />
          <span>
            Banco de Dados:{' '}
            <strong className={isSupabaseActive ? 'text-emerald-700' : 'text-amber-700'}>
              {isSupabaseActive ? 'Supabase Conectado' : 'Simulador Sandbox (Ativo)'}
            </strong>
          </span>
          <span className="opacity-40">|</span>
          <span className="hidden md:inline">
            {isSupabaseActive 
              ? 'Salvando dados reais na nuvem.' 
              : 'As ações salvam localmente com persistência até configurar as variáveis.'}
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium py-1 px-2 rounded hover:bg-emerald-50 transition cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{isOpen ? 'Ocultar Instruções' : 'Ver Guia de Configuração e SQL'}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {isOpen && (
        <div className="max-w-7xl mx-auto px-4 pb-6 pt-3 border-t border-stone-100 text-sm grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <div>
            <h4 className="font-semibold text-emerald-800 flex items-center gap-2 mb-2">
              <Key className="w-4 h-4" />
              1. Conexão com o Supabase e N8N
            </h4>
            <p className="text-stone-600 mb-3 leading-relaxed">
              Para sincronizar com sua conta ativa do Supabase e enviar requisições automáticas ao seu Webhook do N8N acionando IA, basta cadastrar as seguintes chaves no arquivo <strong>.env.local</strong> da sua hospedagem ou no painel de Secrets do AI Studio:
            </p>
            <div className="bg-stone-900 text-stone-300 font-mono text-xs p-3 rounded-lg space-y-1 overflow-x-auto shadow-inner">
              <p className="text-stone-500"># Credenciais do Supabase</p>
              <p><span className="text-emerald-400">VITE_SUPABASE_URL</span>=https://seu-projeto.supabase.co</p>
              <p><span className="text-emerald-400">VITE_SUPABASE_ANON_KEY</span>=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
              <p className="text-stone-500 mt-2"># Webhook do N8N para groq + e-mail</p>
              <p><span className="text-emerald-400">VITE_N8N_WEBHOOK_URL</span>=https://n8n.seu-dominio.com/webhook/pedido</p>
            </div>
            
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs leading-relaxed text-amber-850">
              <span className="font-semibold block mb-1 text-amber-900">Como funciona a Automação N8N + Groq?</span>
              Ao confirmar o pedido no site, mandamos um POST JSON ao Webhook cadastrado. No N8N, crie um fluxo contendo: <br />
              <strong className="text-stone-800">1. Webhook (Trigger)</strong> → 
              <strong className="text-stone-800"> 2. Groq AI Node</strong> 
              <span> (Instrução: "Crie um email simpático confirmando o produto {`{{ $json.produto }}`} no valor de {`{{ $json.valor }}`} para {`{{ $json.nome }}`}")</span> → 
              <strong className="text-stone-800"> 3. Gmail/SMTP Node</strong> (Disparo automático).
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                2. Script SQL para o Editor Supabase
              </h4>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-emerald-700 bg-white border border-stone-200 py-1 px-2.5 rounded hover:border-emerald-600 transition cursor-pointer font-medium"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 animate-scaleIn" />
                    <span className="text-emerald-600 font-semibold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Script</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-stone-600 text-xs mb-3">
              Abra o painel do seu Supabase, clique em <strong className="text-stone-700">SQL Editor</strong>, cole o código abaixo e clique em <strong className="text-emerald-700">Run</strong>:
            </p>
            <div className="bg-stone-900 text-stone-300 font-mono text-xs p-3 rounded-lg overflow-y-auto max-h-[220px] shadow-inner text-left whitespace-pre-wrap leading-tight text-stone-400">
              {`-- SCRIPT SQL DE CRIAÇÃO CORRIGIDO
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE public.pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  produto_nome TEXT NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pedidos público anon" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Leitura pedidos pública" ON public.pedidos FOR SELECT USING (true);
CREATE POLICY "Inserir perfis pública" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Leitura perfis pública" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Atualizar perfis próprios" ON public.profiles FOR UPDATE USING (true);`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
