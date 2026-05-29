/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from './types';

export const products: Product[] = [
  {
    id: 'prod-mel-silvestre',
    name: 'Mel Orgânico Silvestre Canastra',
    description: 'Mel 100% puro e cru, extraído artesanalmente de flores silvestres na Serra da Canastra.',
    price: 45.00,
    category: 'mel',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600',
    unit: 'Pote de Vidro 500g',
    stock: 24
  },
  {
    id: 'prod-mel-laranjeira',
    name: 'Mel de Flor de Laranjeira Premium',
    description: 'Mel de textura suave, coloração clara e aroma cítrico inconfundível.',
    price: 52.00,
    category: 'mel',
    image: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&q=80&w=600',
    unit: 'Pote de Vidro 500g',
    stock: 12
  },
  {
    id: 'prod-propolis-verde',
    name: 'Extrato de Própolis Verde Líquido',
    description: 'Altíssima concentração de flavonoides e artepilina C. Fortalecimento da imunidade de forma 100% natural.',
    price: 49.90,
    category: 'plantas',
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=600',
    unit: 'Frasco Cuentagotas 30ml',
    stock: 35
  },
  {
    id: 'prod-cha-hortela',
    name: 'Chá de Hortelã com Capim-Santo',
    description: 'Platado e desidratado em estufa solar, preservando os óleos essenciais e o aroma mentolado super fresco.',
    price: 18.50,
    category: 'plantas',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600',
    unit: 'Pacote Ervas Secas 50g',
    stock: 40
  },
  {
    id: 'prod-muda-lavanda',
    name: 'Muda de Lavanda Francesa Aromática',
    description: 'Perfeita para vaso ou jardim. Traz beleza, perfume relaxante e repele insetos naturalmente.',
    price: 35.00,
    category: 'plantas',
    image: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&q=80&w=600',
    unit: 'Vaso Biodegradável R12',
    stock: 15
  },
  {
    id: 'prod-cesta-organicos',
    name: 'Cesta Hortifrúti Orgânica da Estação',
    description: 'Seleção do dia com vegetais frescos colhidos no amanhecer, livres de agrotóxicos. Inclui folhas, raízes e frutos.',
    price: 89.00,
    category: 'vegetais',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600',
    unit: 'Caixa de Madeira Média ~4kg',
    stock: 8
  },
  {
    id: 'prod-tomate-cereja',
    name: 'Tomate Cereja Orgânico Colheita Especial',
    description: 'Doce, suculento e crocante. O verdadeiro sabor do tomate cultivado em solo vivo enriquecido.',
    price: 14.90,
    category: 'vegetais',
    image: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&q=80&w=600',
    unit: 'Bandeja Sustentável 350g',
    stock: 30
  },
  {
    id: 'prod-alecrim-fresco',
    name: 'Alecrim Fresco Aromático Colhido',
    description: 'Ideal para fins culinários, infusões revigorantes ou aromatização de ambientes.',
    price: 8.00,
    category: 'plantas',
    image: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e2?auto=format&fit=crop&q=80&w=600',
    unit: 'Maço Colheita Recente',
    stock: 50
  }
];
