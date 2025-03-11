const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

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
    const { cepDestino, peso, largura, altura, comprimento } = req.body;

    // Codificação da URL com os parâmetros exigidos pelos Correios
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

    // Fazendo a requisição para a API dos Correios
    const response = await fetch(urlCorreios);
    const xml = await response.text();

    // Converter XML para JSON
    const parseString = require("xml2js").parseString;
    parseString(xml, (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao processar XML dos Correios" });
      }

      // Extraindo as informações de SEDEX e PAC
      const sedex = result.Servicos.cServico.find(s => s.Codigo[0] === "04014");
      const pac = result.Servicos.cServico.find(s => s.Codigo[0] === "04510");

      const frete = [];

      if (sedex) {
        frete.push({
          servico: "SEDEX",
          valor: sedex.Valor[0],
          prazo: `${sedex.PrazoEntrega[0]} dias úteis`
        });
      }

      if (pac) {
        frete.push({
          servico: "PAC",
          valor: pac.Valor[0],
          prazo: `${pac.PrazoEntrega[0]} dias úteis`
        });
      }

      res.json(frete);
    });

  } catch (error) {
    console.error("❌ Erro na requisição:", error);
    res.status(500).json({ error: "Erro ao calcular frete com os Correios" });
  }
});

// ✅ Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
