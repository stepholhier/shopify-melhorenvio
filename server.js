const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config(); // Permite usar variáveis de ambiente

const app = express();
app.use(cors());
app.use(express.json());

const CEP_ORIGEM = "80250-070"; // Substitua pelo CEP da sua loja
const ACCESS_TOKEN = process.env.MELHOR_ENVIO_TOKEN; // Pegando o token do Railway

// Função para calcular o frete via Melhor Envio
async function calcularFreteMelhorEnvio(cepDestino, peso) {
  if (!ACCESS_TOKEN) {
    throw new Error("❌ Token do Melhor Envio não está definido nas variáveis de ambiente!");
  }

  const url = "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate";

  const body = {
    from: { postal_code: CEP_ORIGEM },
    to: { postal_code: cepDestino },
    products: [
      {
        weight: peso, 
        width: 11, // Ajuste conforme necessário
        height: 17, 
        length: 11, 
        insurance_value: 100
      }
    ],
    services: ["1", "2"], // Serviços de entrega (ajustar conforme necessidade)
    options: { receipt: false, own_hand: false, collect: false }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "User-Agent": "MinhaAplicacao (email@dominio.com)"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Erro ao calcular frete: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Erro ao chamar a API do Melhor Envio:", error);
    throw error;
  }
}

// Rota para calcular o frete
app.post("/calcular-frete", async (req, res) => {
  try {
    console.log("🔍 Recebendo requisição de frete:", req.body);

    const { cepDestino, peso } = req.body;

    if (!cepDestino || !peso) {
      return res.status(400).json({ error: "CEP de destino e peso são obrigatórios!" });
    }

    const frete = await calcularFreteMelhorEnvio(cepDestino, peso);
    res.json(frete);
  } catch (error) {
    console.error("❌ Erro na requisição:", error);
    res.status(500).json({ error: "Erro ao calcular frete" });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
