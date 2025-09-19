import express from "express";
import fetch from "node-fetch";
import googleTrends from "google-trends-api";
import db from "./db.js";

const app = express();
const PORT = 3000;

// 🔑 API Key da OpenRouter
const OPENROUTER_API_KEY = "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";

// 🔹 Função que consulta o DeepSeek via OpenRouter
async function deepResearch(query, contextData) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3.1:free",
      messages: [
        { role: "system", content: "Você é um analista de dados especializado em identificar tendências em tempo real. Organize as informações e destaque padrões relevantes." },
        { role: "user", content: `Tema pesquisado: ${query}\n\nDados coletados:\n${JSON.stringify(contextData, null, 2)}\n\nResuma os principais tópicos, tendências emergentes e potenciais insights de marketing e conteúdo.` }
      ]
    })
  });

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "Sem resposta do modelo.";
}

// 🔹 Página de teste rápida (preview na lousa)
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Monitor de Tendências</title>
        <style>
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(120deg,#f6f8fa 60%,#e3f2fd 100%); margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 60px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 32px #0002; padding: 48px 38px; transition: box-shadow 0.3s; animation: fadeIn 1.2s; }
          .container:hover { box-shadow: 0 8px 40px #1a73e820; }
          h1 { text-align: center; color: #1a73e8; margin-bottom: 32px; font-size:2.1em; letter-spacing: 1px; }
          form { display: flex; gap: 10px; justify-content: center; margin-bottom: 12px; }
          input[type=text] { flex: 1; padding: 16px; border-radius: 10px; border: 1.5px solid #bdbdbd; font-size: 1.15em; transition: border 0.2s; }
          input[type=text]:focus { border: 1.5px solid #1a73e8; outline: none; }
          button { background: #1a73e8; color: #fff; border: none; border-radius: 10px; padding: 16px 32px; font-size: 1.15em; cursor: pointer; transition: background 0.2s, transform 0.2s; font-weight: 500; }
          button:hover { background: #155ab6; transform: scale(1.04); }
          .footer { text-align: center; margin-top: 40px; color: #888; font-size: 1em; }
          .loader {
            display: none; justify-content: center; align-items: center; height: 80px; margin-top: 30px;
          }
          .spinner {
            border: 7px solid #e3f2fd; border-top: 7px solid #1a73e8; border-radius: 50%; width: 54px; height: 54px; animation: spin 1s linear infinite;
          }
        </style>
      </head>
      <body>
        <div class="container" id="mainBox">
          <h1>🔍 Monitor de Tendências</h1>
          <form id="searchForm" action="/monitor" method="get">
            <input type="text" name="q" placeholder="Digite um tema para pesquisar..." required />
            <button type="submit">Pesquisar</button>
          </form>
          <div class="loader" id="loader">
            <div class="spinner"></div>
          </div>
        </div>
        <div class="footer">Powered by DeepSeek & NewsAPI</div>
        <script>
          document.getElementById('searchForm').addEventListener('submit', function(e) {
            document.getElementById('mainBox').style.opacity = '0.5';
            document.getElementById('loader').style.display = 'flex';
          });
        </script>
      </body>
    </html>
  `);
});


// 🔹 Endpoint de monitoramento com NewsAPI
app.get("/monitor", async (req, res) => {
  // Trends24 - Trending Topics do Twitter (scraping robusto)
  const fetch = (await import('node-fetch')).default;
  let trends24 = [];
  try {
    const trendsRes = await fetch(`https://trends24.in/brazil/`);
    const html = await trendsRes.text();
    // Busca todos os tópicos do bloco principal
    const blockRegex = /<ol class="trend-card__list">([\s\S]*?)<\/ol>/;
    const blockMatch = blockRegex.exec(html);
    if (blockMatch) {
      const blockHtml = blockMatch[1];
      const topicRegex = /<a[^>]*>(.*?)<\/a>/g;
      let match;
      while ((match = topicRegex.exec(blockHtml)) !== null) {
        const topic = match[1].replace(/<.*?>/g, '').trim();
        if (topic) trends24.push(topic);
      }
    }
    // Se não encontrar, busca todos os links
    if (trends24.length === 0) {
      const topicRegex = /<a href="\/topic\/(.*?)".*?>(.*?)<\/a>/g;
      let match;
      while ((match = topicRegex.exec(html)) !== null) {
        const topic = match[2];
        if (topic) trends24.push(topic);
      }
    }
    // Limita a 10 tópicos
    trends24 = trends24.slice(0, 10);
    // Se ainda não encontrar, mostra mensagem padrão
    if (trends24.length === 0) {
      trends24 = ["Não foi possível obter tópicos em alta no Twitter."];
    }
  } catch (err) {
    trends24 = ["Erro ao buscar tópicos do Twitter."];
  }
  const termo = req.query.q || "Eleições 2025";

  // Busca notícias reais usando NewsAPI
  const NEWSAPI_KEY = "fa7e2b5f39134708bed1fd9dcfa894be"; // Cadastre-se em https://newsapi.org/ para obter uma chave gratuita
  let noticias = [];
  try {
    const newsRes = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(termo)}&language=pt&sortBy=publishedAt&pageSize=5&apiKey=${NEWSAPI_KEY}`);
    const newsJson = await newsRes.json();
    if (newsJson.articles) {
      noticias = newsJson.articles.map(a => ({
        fonte: a.source.name,
        titulo: a.title,
        descricao: a.description,
        link: a.url,
        publicado: a.publishedAt
      }));
    }
  } catch (err) {
    noticias = [{ fonte: "Erro", titulo: "Não foi possível buscar notícias.", descricao: "", link: "", publicado: "" }];
  }

  // GNews
  let noticiasGNews = [];
  try {
    const gnewsRes = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(termo)}&lang=pt&max=5&token=19931758d011a8500c0df90c65b727b3`);
    const gnewsJson = await gnewsRes.json();
    if (gnewsJson.articles) {
      noticiasGNews = gnewsJson.articles.map(a => ({
        fonte: a.source.name,
        titulo: a.title,
        descricao: a.description,
        link: a.url,
        publicado: a.publishedAt
      }));
    }
  } catch (err) {
    // Silencia erro, pois é fonte extra
  }

  // Junta todas as notícias
  const todasNoticias = [...noticias, ...noticiasGNews];

  // Envia para IA apenas dados reais
  const dadosPesquisa = {
    noticias: todasNoticias
  };

  const resumoIA = await deepResearch(termo, dadosPesquisa);

  // Identifica autores/fonte
  const autores = Array.from(new Set(todasNoticias.map(n => n.fonte).filter(Boolean)));

  // Salva pesquisa e resultado no banco
  db.run(
    `INSERT INTO pesquisas (termo, resultado) VALUES (?, ?)`,
    [termo, resumoIA],
    err => {
      if (err) console.error("Erro ao salvar pesquisa:", err.message);
    }
  );

  // Google Trends - busca tendências do termo
  let tendencias = [];
  try {
    const trendsRes = await googleTrends.interestOverTime({ keyword: termo, geo: 'BR', language: 'pt' });
    const trendsJson = JSON.parse(trendsRes);
    if (trendsJson.default && trendsJson.default.timelineData) {
      tendencias = trendsJson.default.timelineData.slice(-10).map(t => ({
        data: t.formattedTime,
        valor: t.value[0],
        termo: termo
      }));
    }
  } catch (err) {
    // Silencia erro
  }

  res.send(`
    <html>
      <head>
        <title>Resultado - ${termo}</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body { font-family: Arial, sans-serif; background: #f6f8fa; margin: 0; padding: 0; }
          .container { max-width: 900px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 16px #0001; padding: 32px; }
          h1 { color: #1a73e8; margin-bottom: 16px; }
          .resumo { background: #e3f2fd; border-radius: 8px; padding: 18px; margin-bottom: 24px; font-size: 1.15em; }
          .cards { display: flex; flex-wrap: wrap; gap: 18px; margin-bottom: 24px; }
          .card { background: #f9fafb; border-radius: 8px; box-shadow: 0 1px 6px #0001; padding: 16px; flex: 1 1 240px; min-width: 220px; }
          .card h3 { margin: 0 0 8px 0; font-size: 1.08em; color: #333; }
          .card a { color: #1a73e8; text-decoration: none; }
          .card a:hover { text-decoration: underline; }
          .section-title { margin-top: 24px; color: #155ab6; font-size: 1.1em; }
          .back { display: inline-block; margin-top: 24px; color: #1a73e8; text-decoration: none; font-weight: bold; }
          .back:hover { text-decoration: underline; }
          .autores { margin-bottom: 24px; background: #f1f8e9; border-radius: 8px; padding: 12px; }
          .trends { margin-bottom: 24px; background: #fffde7; border-radius: 8px; padding: 12px; }
        </style>
      </head>
      <body>
        <div class="loader" id="loader">
          <div class="spinner"></div>
        </div>
        <div class="container" style="display:none;animation:fadeIn 1.2s;" id="mainContent">
          <h1>📌 Resultados para: ${termo}</h1>
          <div class="resumo">
            <b>Resumo IA:</b><br>
            <div style="white-space: pre-line; font-size:1.12em; line-height:1.6; color:#222;">
              ${resumoIA
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\- (.*?)(?=<br>|$)/g, '<li>$1</li>')
                .replace(/(Tópicos principais:|Tendências emergentes:|Insights:)/g, '<b>$1</b>')
              }
            </div>
          </div>
          <div class="autores">
            <b>Fontes/Autores que estão falando sobre:</b><br>
            ${autores.length ? autores.join(', ') : 'Nenhum autor encontrado.'}
          </div>
          <div class="trends">
            <b>🔝 Tendências Google (últimos dias):</b><br>
            <canvas id="trendsChart" width="700" height="220"></canvas>
            <div id="trendInfo" style="margin-top:12px;font-size:1.05em;color:#155ab6;"></div>
            <div style="margin-top:8px;font-size:0.98em;color:#444;">
              <span style="background:#e3f2fd;padding:4px 8px;border-radius:6px;">Quanto maior o valor, maior o interesse pelo termo pesquisado.</span>
            </div>
          </div>
          <div class="section-title">�📰 Notícias Recentes</div>
          <div class="cards" style="animation: fadeIn 1.2s;">
            ${todasNoticias.length ? todasNoticias.map(n => `
              <div class="card">
                <h3>${n.titulo}</h3>
                <div>${n.descricao ? n.descricao : ''}</div>
                <div><b>Fonte:</b> ${n.fonte}</div>
                <div><b>Publicado:</b> ${n.publicado ? new Date(n.publicado).toLocaleString('pt-BR') : ''}</div>
                <a href="${n.link}" target="_blank">Ver notícia</a>
              </div>
            `).join('') : '<div>Nenhuma notícia encontrada.</div>'}
          </div>
          <a class="back" href="/">⬅ Voltar</a>
        </div>
        <style>
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(120deg,#f6f8fa 60%,#e3f2fd 100%); margin: 0; padding: 0; }
          .container { max-width: 1000px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 32px #0002; padding: 44px 38px; transition: box-shadow 0.3s; }
          .container:hover { box-shadow: 0 8px 40px #1a73e820; }
          h1 { color: #1a73e8; margin-bottom: 20px; letter-spacing: 1px; font-size:2em; }
          .resumo { background: #e3f2fd; border-radius: 12px; padding: 26px; margin-bottom: 32px; font-size: 1.22em; box-shadow: 0 1px 10px #1a73e810; transition: background 0.3s; }
          .resumo:hover { background: #bbdefb; }
          .cards { display: flex; flex-wrap: wrap; gap: 26px; margin-bottom: 32px; }
          .card { background: #f9fafb; border-radius: 12px; box-shadow: 0 1px 10px #0001; padding: 22px; flex: 1 1 270px; min-width: 220px; transition: box-shadow 0.3s, transform 0.3s; }
          .card:hover { box-shadow: 0 4px 18px #1a73e820; transform: scale(1.04); }
          .card h3 { margin: 0 0 12px 0; font-size: 1.15em; color: #333; }
          .card a { color: #1a73e8; text-decoration: none; }
          .card a:hover { text-decoration: underline; }
          .section-title { margin-top: 32px; color: #155ab6; font-size: 1.16em; letter-spacing: 0.5px; }
          .back { display: inline-block; margin-top: 32px; color: #1a73e8; text-decoration: none; font-weight: bold; transition: color 0.2s; }
          .back:hover { text-decoration: underline; color: #e53935; }
          .autores { margin-bottom: 32px; background: #f1f8e9; border-radius: 12px; padding: 16px; font-size: 1.08em; }
          .trends { margin-bottom: 32px; background: #fffde7; border-radius: 12px; padding: 16px; }
          .loader {
            display: flex; justify-content: center; align-items: center; height: 80px;
          }
          .spinner {
            border: 6px solid #e3f2fd; border-top: 6px solid #1a73e8; border-radius: 50%; width: 48px; height: 48px; animation: spin 1s linear infinite;
          }
        </style>
        <script>
          // Animação de carregamento
          window.onload = function() {
            setTimeout(function() {
              document.getElementById('loader').style.display = 'none';
              document.getElementById('mainContent').style.display = 'block';
            }, 900);
          }
          const tendencias = ${JSON.stringify(tendencias)};
          if (tendencias.length) {
            const ctx = document.getElementById('trendsChart').getContext('2d');
            // Detecta pico
            const maxVal = Math.max(...tendencias.map(t => t.valor));
            const maxIdx = tendencias.findIndex(t => t.valor === maxVal);
            // Variação percentual
            const first = tendencias[0].valor;
            const last = tendencias[tendencias.length-1].valor;
            const perc = first ? (((last-first)/first)*100).toFixed(1) : 0;
            // Info extra
            document.getElementById('trendInfo').innerHTML =
              'Variação: <b>' + perc + '%</b> &nbsp;|&nbsp; Pico: <b>' + tendencias[maxIdx].data + '</b> (<b>' + maxVal + '</b>)';
            // Gráfico animado com legenda, tooltips e termo pesquisado
            new Chart(ctx, {
              type: 'line',
              data: {
                labels: tendencias.map(t => t.data + ' (' + t.termo + ')'),
                datasets: [{
                  label: 'Popularidade do termo: ' + tendencias[0].termo,
                  data: tendencias.map(t => t.valor),
                  borderColor: '#1a73e8',
                  backgroundColor: 'rgba(26,115,232,0.1)',
                  fill: true,
                  tension: 0.3,
                  pointBackgroundColor: tendencias.map(function(t,i){return i===maxIdx ? '#e53935' : '#1a73e8'}),
                  pointRadius: tendencias.map(function(t,i){return i===maxIdx ? 7 : 4}),
                  pointHoverRadius: 9,
                  borderWidth: 3
                }]
              },
              options: {
                scales: {
                  y: { beginAtZero: true }
                },
                plugins: {
                  legend: { display: true, labels: { color: '#1a73e8', font: { size: 14 } } },
                  tooltip: {
                    callbacks: {
                      title: function(context) {
                        return 'Data: ' + context[0].label;
                      },
                      label: function(context) {
                        return 'Popularidade: ' + context.parsed.y + ' (quanto maior, mais buscado)';
                      }
                    }
                  }
                },
                animation: {
                  duration: 1200,
                  easing: 'easeOutBounce'
                }
              }
            });
          }
        </script>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
