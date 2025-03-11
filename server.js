const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const CEP_ORIGEM = "80250-070"; // Substitua pelo CEP da sua loja

// 🔹 Função para calcular o frete manualmente
function calcularFreteManual(cepDestino, peso) {
  const precos = [
    { maxPeso: 1, pac: 20.00, sedex: 30.00, prazoPac: 5, prazoSedex: 2 },
    { maxPeso: 5, pac: 30.00, sedex: 40.00, prazoPac: 7, prazoSedex: 3 },
    { maxPeso: 10, pac: 50.00, sedex: 70.00, prazoPac: 10, prazoSedex: 5 },
    { maxPeso: 20, pac: 80.00, sedex: 120.00, prazoPac: 12, prazoSedex: 6 },
    { maxPeso: 30, pac: 120.00, sedex: 180.00, prazoPac: 15, prazoSedex: 7 }
  ];

  // Encontra a faixa de preço correspondente ao peso
  const faixa = precos.find(p => peso <= p.maxPeso);

  if (!faixa) {
    return [{ servico: "Transportadora", valor: "R$ 250,00", prazo: "15 dias úteis" }];
  }

  return [
    { servico: "PAC", valor: `R$ ${faixa.pac.toFixed(2)}`, prazo: `${faixa.prazoPac} dias úteis` },
    { servico: "SEDEX", valor: `R$ ${faixa.sedex.toFixed(2)}`, prazo: `${faixa.prazoSedex} dias úteis` }
  ];
}

// ✅ Rota para testar se o servidor está rodando
app.get("/", (req, res) => {
  res.send("🚀 API Shopify + Frete Manual rodando com sucesso!");
});

// ✅ Rota para calcular o frete manualmente
app.post("/calcular-frete", (req, res) => {
  try {
    console.log("🔍 Recebendo requisição de frete:", req.body);

    const { cepDestino, peso } = req.body;

    if (!cepDestino || !peso) {
      return res.status(400).json({ error: "CEP de destino e peso são obrigatórios!" });
    }

    const frete = calcularFreteManual(cepDestino, peso);
    res.json(frete);

  } catch (error) {
    console.error("❌ Erro na requisição:", error);
    res.status(500).json({ error: "Erro ao calcular frete manual" });
  }
});

// ✅ Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
