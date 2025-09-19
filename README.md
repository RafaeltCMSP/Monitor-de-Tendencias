# 🔍 Monitor de Tendências em Tempo Real

Este projeto é uma aplicação em **Node.js + Express** que coleta, organiza e analisa dados de **notícias, Google Trends e tópicos do Twitter** em tempo real, utilizando **IA (DeepSeek via OpenRouter)** para gerar **insights estratégicos** e sugerir **termos relacionados**.

A aplicação fornece:

* 📈 Análise de tendências em tempo real
* 📰 Coleta de notícias de múltiplas fontes (NewsAPI + GNews)
* 🔝 Tópicos em alta no Twitter (via Trends24 scraping)
* 📊 Popularidade do termo no Google Trends
* 🤖 Resumo inteligente com insights de marketing e lista de termos relacionados

---

## 🚀 Tecnologias Utilizadas

* **Node.js** + **Express** → Servidor backend
* **Google Trends API (`google-trends-api`)** → Tendências de busca
* **NewsAPI + GNews** → Notícias recentes
* **Trends24 Scraping** → Tópicos em alta no Twitter
* **OpenRouter + DeepSeek** → Análise com IA
* **SQLite** (via `db.js`) → Persistência dos dados de pesquisa
* **Chart.js** → Visualização dos dados de tendências

---

## ⚙️ Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/monitor-tendencias.git
cd monitor-tendencias
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as chaves de API

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
OPENROUTER_API_KEY=coloque_sua_chave_aqui
NEWSAPI_KEY=coloque_sua_chave_aqui
GNEWS_API_KEY=coloque_sua_chave_aqui
```

> 🔑 **Como conseguir as chaves:**
>
> * **OpenRouter (DeepSeek)**: [https://openrouter.ai](https://openrouter.ai)
> * **NewsAPI**: [https://newsapi.org](https://newsapi.org)
> * **GNews**: [https://gnews.io](https://gnews.io)

### 4. Inicie o servidor

```bash
npm start
```

O servidor ficará disponível em:
👉 [http://localhost:3000](http://localhost:3000)

---

## 🖼️ Funcionalidades Principais

### 🔍 Tela Inicial

* Campo de pesquisa para qualquer tema
* UI moderna com animações
* Integração com loader ao pesquisar

### 📊 Tela de Resultados

* **Resumo IA (DeepSeek)** → insights, tópicos principais, termos relacionados
* **Fontes/Autores** que estão publicando sobre o tema
* **Tendências Google Trends** → gráfico dinâmico (últimos dias)
* **Notícias Recentes** → cards com título, resumo, link e data
* **Termos Relacionados** → botões clicáveis que permitem nova busca automática

---

## 📌 Estrutura de Pastas

```
📂 monitor-tendencias
 ┣ 📜 app.js          # Servidor principal
 ┣ 📜 db.js           # Configuração do banco SQLite
 ┣ 📜 package.json    # Dependências do projeto
 ┣ 📜 README.md       # Documentação
 ┗ 📜 .env            # Variáveis de ambiente (API Keys)
```

---

## 📚 Próximos Passos / Melhorias Futuras

* [ ] Criar autenticação para usuários
* [ ] Dashboard comparativo de múltiplos termos
* [ ] Exportar relatórios em PDF/CSV
* [ ] Integração com redes sociais (Instagram, YouTube, TikTok)
* [ ] Sistema de alertas automáticos de tendências emergentes

---

## 🧑‍💻 Autor

Feito com por \[Rafael Paragon]

