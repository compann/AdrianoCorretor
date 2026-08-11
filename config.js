/* =====================================================================
   CONFIGURAÇÃO DO SITE — o único arquivo que você precisa editar.
   Pegue os dois valores em: Supabase > Project Settings > Data API
   ===================================================================== */

window.CONFIG = {
  // Cole aqui a URL do projeto (termina em .supabase.co)
  SUPABASE_URL: 'https://mtiulsshojellujibpaf.supabase.co',

  // Cole aqui a chave pública "anon". Pode ficar visível: o RLS protege o banco.
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aXVsc3Nob2plbGx1amlicGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODMzOTEsImV4cCI6MjEwMTk1OTM5MX0.uDEkTL32AHcQ_5U7pd4K-w7aX1Z_wOeiA2Hw74ibXSk',

  // Usados só enquanto o Supabase não estiver configurado, ou se a tabela
  // "perfil" estiver vazia. O painel sobrescreve estes valores.
  FALLBACK: {
    nome: 'Adriano Miranda',
    creci: 'CRECI-GO 00000',
    telefone: '(61) 9 9408-4488',
    whatsapp: '5561994084488',
    email: 'contato@adrianomiranda.com.br',
    instagram: 'adrianomiranda.corretor',
    cidade_atuacao: 'Valparaíso e Região',
    chamada: 'O endereço certo não se anuncia. Se apresenta.',
    bio: 'Atuo na intermediação de imóveis residenciais e comerciais em Brasília e no Entorno. '
       + 'Trabalho com um portfólio enxuto e verificado: prefiro conhecer bem cada imóvel que '
       + 'apresento a listar tudo que aparece. Documentação conferida antes da visita, '
       + 'negociação conduzida do primeiro contato até a entrega das chaves.'
  }
};
