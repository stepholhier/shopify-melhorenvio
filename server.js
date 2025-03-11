const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const CEP_ORIGEM = "80250-070"; // Substitua pelo CEP da sua loja
const ACCESS_TOKEN = process.env.MELHOR_ENVIO_TOKEN; // Pegando o token do Railway

// ✅ Rota padrão para indicar que a API está rodando
app.get("/", (req, res) => {
  res.send("🚀 API Melhor Envio rodando com sucesso!");
});

// ✅ Rota de status para monitoramento
app.get("/status", (req, res) => {
  res.json({
    status: "API rodando 🚀",
    melhorEnvioToken: ACCESS_TOKEN ? "✅ Token carregado" : "❌ Token não carregado!",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Função para calcular o frete via Melhor Envio
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
        width: 11,
        height: 17,
        length: 11,
        insurance_value: 100
      }
    ],
    services: ["1", "2"], // Ajustar os serviços conforme necessário
    options: { receipt: false, own_hand: false, collect: false }
  };

  console.log("📡 Enviando requisição para Melhor Envio...");
  console.log("🔹 Payload:", JSON.stringify(body, null, 2));

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
      const errorText = await response.text();
      console.error(`❌ Erro ao chamar Melhor Envio (${response.status}):`, errorText);
      throw new Error(`Erro Melhor Envio: ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Resposta do Melhor Envio:", JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error("❌ Erro ao chamar a API do Melhor Envio:", error);
    throw error;
  }
}

// ✅ Rota para calcular o frete
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

// ✅ Expor a porta corretamente para Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
