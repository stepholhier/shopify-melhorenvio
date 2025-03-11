const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN; // Agora pegamos do Railway

// Testar se o token está válido
app.get("/me", async (req, res) => {
  try {
    const response = await fetch("https://api.melhorenvio.com.br/v2/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MELHOR_ENVIO_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar dados do Melhor Envio" });
  }
});

// Calcular frete
app.post("/calcular-frete", async (req, res) => {
  try {
    const { cepOrigem, cepDestino, peso, largura, altura, comprimento } = req.body;

    const response = await fetch("https://api.melhorenvio.com.br/v2/calculator", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MELHOR_ENVIO_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: { postal_code: cepOrigem },
        to: { postal_code: cepDestino },
        products: [
          { weight: peso, width: largura, height: altura, length: comprimento, quantity: 1 }
        ],
        services: [] // Pegará todas as transportadoras disponíveis
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular frete" });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
