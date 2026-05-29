/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Pedido, Profile } from './types';

// Read from environment variables
const initialUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const initialKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// We also allow the user to input keys in real-time in the UI if we want to,
// so let's check localStorage for dynamic testing values.
const getClientConfig = () => {
  const url = localStorage.getItem('TERRA_MEL_SUPABASE_URL') || initialUrl;
  const key = localStorage.getItem('TERRA_MEL_SUPABASE_ANON_KEY') || initialKey;
  return { url, key };
};

export const hasRealSupabase = (): boolean => {
  const { url, key } = getClientConfig();
  return typeof url === 'string' && url.trim().length > 0 && typeof key === 'string' && key.trim().length > 0;
};

// Create real client or elegant fallback null client
let realClient: any = null;
try {
  const { url, key } = getClientConfig();
  if (url && key) {
    realClient = createClient(url, key);
  }
} catch (e) {
  console.warn("Could not initialize real Supabase client:", e);
}

// Low-fidelity internal database simulation for a rich sandbox experience when keys are not active yet
const getMockPedidos = (): Pedido[] => {
  try {
    const list = localStorage.getItem('terra_mel_mock_pedidos');
    if (!list) {
      const defaultPedidos: Pedido[] = [
        {
          id: 'mock-1',
          nome_cliente: 'Mariana Silva',
          telefone: '(11) 98765-4321',
          email: 'mariana.silva@exemplo.com.br',
          produto_nome: 'Mel Orgânico Silvestre Premium',
          valor_total: 45.00,
          status: 'confirmado',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'mock-2',
          nome_cliente: 'Carlos Andrade',
          telefone: '(21) 99911-2233',
          email: 'carlos.and@exemplo.com',
          produto_nome: 'Própolis Verde Concentrado',
          valor_total: 49.90,
          status: 'pendente',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 'mock-3',
          nome_cliente: 'Ana Oliveira',
          telefone: '(31) 98877-6655',
          email: 'ana.flora@jardim.net',
          produto_nome: 'Muda de Lavanda Francesa',
          valor_total: 35.00,
          status: 'despachado',
          created_at: new Date(Date.now() - 3600000 * 48).toISOString()
        }
      ];
      localStorage.setItem('terra_mel_mock_pedidos', JSON.stringify(defaultPedidos));
      return defaultPedidos;
    }
    return JSON.parse(list);
  } catch {
    return [];
  }
};

const getMockProfiles = (): Profile[] => {
  try {
    const list = localStorage.getItem('terra_mel_mock_profiles');
    if (!list) {
      const defaultProfiles: Profile[] = [
        {
          id: 'mock-user-1',
          nome: 'Mariana Silva',
          telefone: '(11) 98765-4321',
          email: 'mariana@exemplo.com',
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem('terra_mel_mock_profiles', JSON.stringify(defaultProfiles));
      return defaultProfiles;
    }
    return JSON.parse(list);
  } catch {
    return [];
  }
};

// Unified database operations wrapper
export const db = {
  // Pedidos CRUD
  async insertPedido(pedido: Pedido): Promise<{ data: any; error: any }> {
    if (hasRealSupabase() && realClient) {
      try {
        const { data, error } = await realClient
          .from('pedidos')
          .insert([{ ...pedido, status: 'pendente' }])
          .select();
        return { data, error };
      } catch (err: any) {
        return { data: null, error: err.message || err };
      }
    } else {
      // Simulate insert
      const pedList = getMockPedidos();
      const newPed = {
        ...pedido,
        id: `ped-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pendente' as const,
        created_at: new Date().toISOString()
      };
      pedList.unshift(newPed);
      localStorage.setItem('terra_mel_mock_pedidos', JSON.stringify(pedList));
      return { data: [newPed], error: null };
    }
  },

  async getPedidos(): Promise<{ data: Pedido[] | null; error: any }> {
    if (hasRealSupabase() && realClient) {
      try {
        const { data, error } = await realClient
          .from('pedidos')
          .select('*')
          .order('created_at', { ascending: false });
        return { data, error };
      } catch (err: any) {
        return { data: null, error: err.message || err };
      }
    } else {
      return { data: getMockPedidos(), error: null };
    }
  },

  async updatePedidoStatus(id: string, status: any): Promise<{ data: any; error: any }> {
    if (hasRealSupabase() && realClient) {
      try {
        const { data, error } = await realClient
          .from('pedidos')
          .update({ status })
          .eq('id', id)
          .select();
        return { data, error };
      } catch (err: any) {
        return { data: null, error: err.message || err };
      }
    } else {
      const pedList = getMockPedidos();
      const item = pedList.find(p => p.id === id);
      if (item) {
        item.status = status;
        localStorage.setItem('terra_mel_mock_pedidos', JSON.stringify(pedList));
      }
      return { data: item, error: null };
    }
  },

  // Profiles and user registration
  async signUpUser(nome: string, telefone: string, email: string, senha_inserida: string): Promise<{ data: any; error: any }> {
    if (hasRealSupabase() && realClient) {
      try {
        // Enrole no Supabase Auth signup
        const { data, error } = await realClient.auth.signUp({
          email,
          password: senha_inserida,
          options: {
            data: {
              nome,
              telefone
            }
          }
        });

        if (error) throw error;

        // Note: Often a database trigger inserts the profile, but let's insert it manually to be safe if trigger is missing
        if (data.user) {
          const { error: profileError } = await realClient
            .from('profiles')
            .upsert({
              id: data.user.id,
              nome,
              telefone,
              email,
              created_at: new Date().toISOString()
            });
          if (profileError) console.warn("Supabase upsert profile failed, trigger might handle it:", profileError);
        }

        return { data, error: null };
      } catch (err: any) {
        let msg = err.message || String(err);
        if (msg.includes('Database error saving new user') || msg.includes('saving new user')) {
          msg = "Erro ao salvar perfil no Supabase: sua Trigger de automação ou as políticas de segurança RLS na tabela 'profiles' estão falhando ao sincronizar novos usuários. Para consertar imediatamente, abra o 'Guia de Configuração e SQL' no topo do site e execute o script SQL atualizado no SQL Editor do seu Supabase para liberar o RLS e recriar a Trigger de forma simplificada.";
        }
        return { data: null, error: msg };
      }
    } else {
      // Direct Local Signup simulation
      const users = getMockProfiles();
      if (users.find(u => u.email === email)) {
        return { data: null, error: 'Usuário já cadastrado com este e-mail no simulador.' };
      }
      
      const newProfile: Profile = {
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        nome,
        telefone,
        email,
        created_at: new Date().toISOString()
      };
      
      users.push(newProfile);
      localStorage.setItem('terra_mel_mock_profiles', JSON.stringify(users));
      
      // Save simulated session
      localStorage.setItem('terra_mel_current_user', JSON.stringify(newProfile));
      return { data: { user: { id: newProfile.id, email } }, error: null };
    }
  },

  async loginUser(email: string, senha_inserida: string): Promise<{ data: any; error: any }> {
    if (hasRealSupabase() && realClient) {
      try {
        const { data, error } = await realClient.auth.signInWithPassword({
          email,
          password: senha_inserida
        });
        return { data, error };
      } catch (err: any) {
        return { data: null, error: err.message || err };
      }
    } else {
      // Simulate client user login
      const users = getMockProfiles();
      const user = users.find(u => u.email === email);
      if (user) {
        localStorage.setItem('terra_mel_current_user', JSON.stringify(user));
        return { data: { user: { id: user.id, email } }, error: null };
      }
      return { data: null, error: 'E-mail não encontrado na simulação. Por favor, cadastre-se primeiro.' };
    }
  },

  logoutUser() {
    if (hasRealSupabase() && realClient) {
      realClient.auth.signOut();
    }
    localStorage.removeItem('terra_mel_current_user');
  },

  getCurrentUser(): Profile | null {
    try {
      const data = localStorage.getItem('terra_mel_current_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
};
