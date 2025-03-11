const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { parseString } = require("xml2js");

const app = express();
app.use(cors());
app.use(express.json());

const CEP_ORIGEM = "80250-070"; // Substitua pelo CEP da sua loja

// ✅ Rota para testar se o servidor está rodando
app.get("/", (req, res) => {
  res.send("🚀 API Shopify + Correios rodando com sucesso!");
});

// ✅ Rota para calcular o frete com os Correios
app.post("/calcular-frete", async (req, res) => {
  try {
    console.log("🔍 Recebendo requisição de frete:", req.body);

    const { cepDestino, peso, largura, altura, comprimento } = req.body;

    // ✅ Validação dos dados recebidos
    if (!cepDestino || !peso || !largura || !altura || !comprimento) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
    }

    // ✅ Codificação da URL com os parâmetros exigidos pelos Correios
    const urlCorreios = `https://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?` +
      `nCdEmpresa=&sDsSenha=&nCdServico=04014,04510` + // SEDEX e PAC
      `&sCepOrigem=${CEP_ORIGEM}` +
      `&sCepDestino=${cepDestino}` +
      `&nVlPeso=${peso}` +
      `&nCdFormato=1` + // 1 = Caixa/Pacote
      `&nVlComprimento=${comprimento}` +
      `&nVlAltura=${altura}` +
      `&nVlLargura=${largura}` +
      `&nVlDiametro=0` +
      `&sCdMaoPropria=N` +
      `&nVlValorDeclarado=0` +
      `&sCdAvisoRecebimento=N` +
      `&StrRetorno=xml`;

    console.log("🔗 Chamando a API dos Correios:", urlCorreios);

    // ✅ Fazendo a requisição para a API dos Correios
    const response = await fetch(urlCorreios);
    if (!response.ok) {
      throw new Error(`Correios retornou erro HTTP ${response.status}`);
    }

    const xml = await response.text();

    // ✅ Converter XML para JSON
    parseString(xml, (err, result) => {
      if (err) {
        console.error("❌ Erro ao processar XML:", err);
        return res.status(500).json({ error: "Erro ao processar XML dos Correios" });
      }

      console.log("📦 Resposta dos Correios:", JSON.stringify(result, null, 2));

      // ✅ Extraindo as informações de SEDEX e PAC
      const servicos = result.Servicos?.cServico;
      if (!servicos) {
        return res.status(500).json({ error: "Erro ao obter os serviços dos Correios" });
      }

      const frete = [];

      servicos.forEach(servico => {
        if (servico.Valor && servico.PrazoEntrega) {
          frete.push({
            servico: servico.Codigo[0] === "04014" ? "SEDEX" : "PAC",
            valor: `R$ ${servico.Valor[0]}`,
            prazo: `${servico.PrazoEntrega[0]} dias úteis`
          });
        }
      });

      res.json(frete);
    });

  } catch (error) {
    console.error("❌ Erro na requisição:", error);
    res.status(500).json({ error: "Erro ao calcular frete com os Correios", detalhes: error.message });
  }
});

// ✅ Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
