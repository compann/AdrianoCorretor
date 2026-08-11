# Site · Adriano Miranda Corretor de Imóveis

Site institucional + catálogo de imóveis, com painel de administração separado.
Feito em HTML/CSS/JS puro — roda em qualquer hospedagem estática (GitHub Pages,
Netlify, Vercel, Hostgator). Banco de dados no Supabase.

---

## Arquivos

```
adriano-miranda-site/
├── index.html          Site público (capa, catálogo, sobre, contato)
├── estilo.css          Estilo do site
├── app.js              Lógica do catálogo, filtros e ficha do imóvel
├── config.js           ⬅ ÚNICO arquivo que você edita no site público
├── painel-admin.html   Painel de administração (arquivo único e independente)
└── supabase/
    └── schema.sql      Banco de dados — rode uma vez no Supabase
```

---

## Passo a passo (uns 15 minutos)

### 1. Criar o projeto no Supabase

1. Entre em supabase.com e crie um projeto novo (região: **South America (São Paulo)**).
2. Guarde a senha do banco que ele pede — você não vai precisar dela no dia a dia,
   mas perder dá trabalho.

### 2. Criar as tabelas

1. No menu lateral: **SQL Editor → New query**.
2. Abra `supabase/schema.sql`, copie o arquivo inteiro, cole e clique em **Run**.
3. Isso cria as tabelas `imoveis`, `perfil` e `contatos`, as regras de segurança (RLS)
   e o bucket de fotos. Pode rodar de novo sem quebrar nada.

### 3. Criar o usuário do painel

1. **Authentication → Users → Add user**.
2. Coloque o e-mail e a senha do Adriano e marque **Auto Confirm User**.
3. Em **Authentication → Providers → Email**, deixe **"Enable Sign Up" desligado**.
   Assim ninguém consegue criar conta sozinho — só quem você cadastrar aqui entra.

### 4. Pegar as duas chaves

**Project Settings → Data API**. Copie:

- **Project URL** (algo como `https://xxxx.supabase.co`)
- **anon public key** (a chave longa)

> A chave `anon` pode ficar visível no código — é feita para isso. Quem protege o
> banco são as regras de RLS do schema: qualquer visitante só consegue **ler** imóveis
> publicados e **enviar** mensagem. Escrever, editar e apagar exige login.
> A chave que **nunca** pode aparecer no site é a `service_role`.

### 5. Colar as chaves em dois lugares

1. **`config.js`** — substitua `COLE_A_URL_AQUI` e `COLE_A_CHAVE_ANON_AQUI`.
2. **`painel-admin.html`** — as mesmas duas linhas, no topo do `<script type="module">`
   (por volta da linha 395). O painel é independente de propósito, por isso repete.

### 6. Publicar

**Site público** — suba `index.html`, `estilo.css`, `app.js` e `config.js` para a
hospedagem. No GitHub Pages, coloque na raiz do repositório.

**Painel** — suba `painel-admin.html` **em outro endereço**. Três opções:

| Opção | Como fica | Quando usar |
|---|---|---|
| Outro projeto na Netlify/Vercel | `painel-adriano.netlify.app` | Melhor separação — recomendo esta |
| Subdomínio | `painel.adrianomiranda.com.br` | Se já tiver domínio próprio |
| Pasta de nome difícil no mesmo site | `site.com.br/gestao-am-2026/index.html` | Mais simples, separação menor |

O painel **não tem nenhum link** partindo do site público e já vem com `noindex`,
então não aparece no Google. Para mudar o endereço, é só renomear o arquivo ou a
pasta — nada dentro dele depende do caminho.

> Vale dizer com todas as letras: esconder o endereço **não é** a segurança do sistema.
> Mesmo que alguém descubra a URL do painel, sem e-mail e senha não entra, e sem login
> o Supabase recusa qualquer escrita. O endereço separado é conveniência, não proteção.

---

## Enquanto o Supabase não está configurado

O site roda em **modo demonstração**: mostra 5 imóveis de exemplo para você poder
apresentar o layout ao Adriano antes de ligar o banco. Assim que `config.js` receber
as chaves válidas, ele passa a ler os dados reais automaticamente.

---

## Usando o painel

**Imóveis** — cadastrar, editar, publicar/ocultar e excluir. O campo *Endereço completo*
é interno: nunca aparece no site. *Destacar no topo* joga o imóvel para o começo do
catálogo. A situação (Vendido/Alugado) mantém o imóvel no ar com um selo, o que é útil
como prova de trabalho — ou você oculta de vez.

**Fotos** — arraste várias de uma vez. A primeira é a capa; use as setas para reordenar.
Limite de 8 MB por foto. Redimensione para no máximo 1600 px de largura antes de subir:
o site carrega mais rápido e o plano gratuito do Supabase dura muito mais.

**Mensagens** — tudo que chega pelo formulário do site, com botão para responder direto
no WhatsApp.

**Meus dados** — nome, CRECI, telefone, WhatsApp, Instagram, foto, a frase de abertura
da capa e o texto do "quem apresenta o imóvel". Muda no site inteiro na hora.

O WhatsApp precisa ser preenchido **só com números e com o 55 na frente**:
`5561999998888`. É o que monta todos os links de conversa do site.

---

## Antes de considerar pronto

- [ ] Preencher o CRECI real (obrigatório em publicidade imobiliária)
- [ ] Preencher WhatsApp, telefone e e-mail em **Meus dados**
- [ ] Subir a foto do Adriano
- [ ] Cadastrar os primeiros imóveis com fotos boas — o catálogo vazio derruba o site
- [ ] Apagar o imóvel de exemplo criado pelo `schema.sql`
- [ ] Testar o envio do formulário de contato e conferir se a mensagem chega no painel

## Depois, se valer a pena

- Domínio próprio (`adrianomiranda.com.br`) apontando para a hospedagem
- Google Search Console + `sitemap.xml` para o site aparecer nas buscas
- Página individual por imóvel (`/imovel/AM-0001`) — melhora muito o compartilhamento
  no WhatsApp e o ranqueamento no Google, mas exige gerar as páginas ou usar Next.js
- Marca d'água com o monograma nas fotos dos imóveis
