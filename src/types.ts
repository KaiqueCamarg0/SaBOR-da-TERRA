/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'mel' | 'plantas' | 'vegetais';
  image: string;
  unit: string;
  stock: number;
}

export interface Pedido {
  id?: string;
  nome_cliente: string;
  telefone: string;
  email: string;
  produto_nome: string;
  valor_total: number;
  status?: 'pendente' | 'confirmado' | 'despachado';
  created_at?: string;
}

export interface Profile {
  id: string;
  nome: string;
  telefone?: string;
  email: string;
  created_at?: string;
}

export type ViewState = 'loja' | 'checkout' | 'admin-login' | 'admin-dashboard' | 'user-auth';
