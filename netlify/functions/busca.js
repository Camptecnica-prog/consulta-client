const fetch = require('node-fetch');

function formatarCnpj(cnpj) {
  const limpo = String(cnpj || "").replace(/\D/g, "");
  if (limpo.length !== 14) return cnpj;
  return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const params = event.queryStringParameters || {};
    const termo = (params.q || params.termo || "").trim();

    if (!termo || termo.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ sucesso: false, erro: "Digite pelo menos 2 caracteres para a busca." })
      };
    }

    const FIELD_CONTROL_API_URL = process.env.FIELD_CONTROL_API_URL;
    const FIELD_CONTROL_TOKEN = process.env.FIELD_CONTROL_TOKEN;

    if (!FIELD_CONTROL_API_URL || !FIELD_CONTROL_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ sucesso: false, erro: "As credenciais da API do Field Control não foram configuradas nas variáveis de ambiente do Netlify." })
      };
    }

    async function fieldControlFetch(endpoint) {
      const url = `${FIELD_CONTROL_API_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${FIELD_CONTROL_TOKEN}`,
          "Accept": "application/json"
        }
      });
      const dados = await response.json().catch(() => null);
      return { status: response.status, dados };
    }

    const somenteNumeros = termo.replace(/\D/g, "");
    let clientesEncontrados = [];

    // 1. Se for número (CNPJ/CPF), busca direto pelo documento
    if (somenteNumeros.length >= 4) {
      const filtro = encodeURIComponent(`document_number:"${somenteNumeros}"`);
      const resultado = await fieldControlFetch(`/customers?q=${filtro}&limit=50&offset=0`);
      
      if (resultado.status >= 200 && resultado.status < 300) {
        clientesEncontrados = Array.isArray(resultado.dados?.items) ? resultado.dados.items : [];
      }
    } else {
      // 2. Se for texto, divide em palavras ("prefeitura", "valinhos") e busca por partes
      const palavrasBusca = termo
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/\s+/)
        .filter(p => p.length > 0);

      let offset = 0;
      let limit = 100;
      let temMais = true;

      while (temMais && offset < 500) {
        const resultado = await fieldControlFetch(`/customers?limit=${limit}&offset=${offset}`);
        
        if (resultado.status < 200 || resultado.status >= 300) {
          break;
        }

        const itens = Array.isArray(resultado.dados?.items) ? resultado.dados.items : [];
        if (itens.length === 0) {
          temMais = false;
          break;
        }

        const filtradosNestaPagina = itens.filter(c => {
          const nome = String(c.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const razao = String(c.legalName || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          
          return palavrasBusca.every(palavra => nome.includes(palavra) || razao.includes(palavra));
        });

        filtradosNestaPagina.forEach(c => {
          if (!clientesEncontrados.some(e => e.id === c.id)) {
            clientesEncontrados.push(c);
          }
        });

        if (itens.length < limit) {
          temMais = false;
        } else {
          offset += limit;
        }
      }
    }

    const clientesFormatados = clientesEncontrados.map(cliente => ({
      id: cliente.id || null,
      nome: cliente.name || "Nome não informado",
      nome_fantasia: cliente.name || "Nome não informado",
      razao_social: cliente.legalName || cliente.name || "Razão social não informada",
      cnpj: cliente.documentNumber ? formatarCnpj(cliente.documentNumber) : null,
      cnpj_limpo: cliente.documentNumber ? String(cliente.documentNumber).replace(/\D/g, "") : null,
      cpf: null
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sucesso: true,
        termo: termo,
        encontrado: clientesFormatados.length > 0,
        quantidade: clientesFormatados.length,
        clientes: clientesFormatados
      })
    };

  } catch (erro) {
    console.error("Erro na função de busca:", erro);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ sucesso: false, erro: erro.message })
    };
  }
};