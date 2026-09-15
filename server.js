const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURAÇÕES
// ============================================================

// ------------------------------------------------------------
// FIELD CONTROL
// ------------------------------------------------------------

const API_KEY = process.env.FIELDCONTROL_API_KEY;
const FIELD_CONTROL_API = "https://carchost.fieldcontrol.com.br";

// ------------------------------------------------------------
// ZONKI
// ------------------------------------------------------------

const ZONKI_API_KEY = process.env.ZONKI_API_KEY;
const ZONKI_API = "https://api.zonki.io";

// ------------------------------------------------------------
// OMIE
// ------------------------------------------------------------

const OMIE_APP_KEY = process.env.OMIE_APP_KEY;
const OMIE_APP_SECRET = process.env.OMIE_APP_SECRET;
const OMIE_API = "https://app.omie.com.br/api/v1";


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


// ============================================================
// LOG DE CONFIGURAÇÃO
// ============================================================

console.log("========================================");
console.log("CONFIGURAÇÃO DO SERVIDOR");
console.log("========================================");

console.log(
  "Field Control configurado:",
  !!API_KEY
);

console.log(
  "Zonki configurado:",
  !!ZONKI_API_KEY
);

console.log(
  "Omie configurado:",
  !!OMIE_APP_KEY && !!OMIE_APP_SECRET
);

console.log(
  "========================================");


// ============================================================
// FUNÇÃO - FIELD CONTROL
// ============================================================

async function fieldControlFetch(endpoint) {

  const url =
    `${FIELD_CONTROL_API}${endpoint}`;

  console.log("\n========================================");
  console.log("FIELD CONTROL");
  console.log("URL:", url);
  console.log("API KEY CARREGADA:", !!API_KEY);
  console.log("========================================");

  const resposta = await fetch(
    url,
    {
      method: "GET",

      headers: {
        "X-Api-Key": API_KEY,
        "Content-Type":
          "application/json;charset=UTF-8",
        "Accept": "application/json",
        "User-Agent":
          "Painel-Cliente/1.0"
      }
    }
  );

  const texto =
    await resposta.text();

  let dados;

  try {

    dados =
      JSON.parse(texto);

  } catch {

    dados = {
      resposta: texto
    };

  }

  console.log(
    "FIELD CONTROL STATUS:",
    resposta.status
  );

  return {
    status: resposta.status,
    dados
  };
}


// ============================================================
// FUNÇÃO - ZONKI
// ============================================================
//
// Aceita parâmetros:
//
// zonkiFetch("/v1/tickets", {
//   search: "123"
// });
//
// ============================================================

async function zonkiFetch(
  endpoint,
  params = {}
) {

  const url =
    new URL(
      `${ZONKI_API}${endpoint}`
    );

  Object.keys(params).forEach(
    (key) => {

      const valor =
        params[key];

      if (
        valor !== undefined &&
        valor !== null &&
        valor !== ""
      ) {

        url.searchParams.append(
          key,
          valor
        );

      }

    }
  );

  console.log("\n========================================");
  console.log("ZONKI");
  console.log("URL:", url.toString());
  console.log(
    "TOKEN CARREGADO:",
    !!ZONKI_API_KEY
  );
  console.log("========================================");

  const resposta =
    await fetch(
      url.toString(),
      {
        method: "GET",

        headers: {
          "Authorization":
            `Bearer ${ZONKI_API_KEY}`,

          "Accept":
            "application/json"
        }
      }
    );

  const texto =
    await resposta.text();

  console.log(
    "ZONKI STATUS:",
    resposta.status
  );

  console.log(
    "ZONKI RESPOSTA:",
    texto
  );

  let dados;

  try {

    dados =
      JSON.parse(texto);

  } catch {

    dados = {
      resposta: texto
    };

  }

  return {
    status: resposta.status,
    dados
  };
}


// ============================================================
// FUNÇÃO - OMIE
// ============================================================

async function omieFetch(
  endpoint,
  call,
  param
) {

  const payload = {

    call:
      call,

    app_key:
      OMIE_APP_KEY,

    app_secret:
      OMIE_APP_SECRET,

    param: [
      param
    ]

  };

  console.log("\n========================================");
  console.log("ENVIO PARA OMIE");
  console.log("========================================");

  console.log(
    JSON.stringify(
      {
        ...payload,
        app_secret:
          "***OCULTO***"
      },
      null,
      2
    )
  );

  console.log(
    "Endpoint:",
    `${OMIE_API}${endpoint}`
  );

  const resposta =
    await fetch(
      `${OMIE_API}${endpoint}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Accept":
            "application/json"
        },

        body:
          JSON.stringify(payload)
      }
    );

  const texto =
    await resposta.text();

  console.log("\n========================================");
  console.log("RESPOSTA OMIE");
  console.log("========================================");

  console.log(
    "Status HTTP:",
    resposta.status
  );

  console.log(
    "Resposta:",
    texto
  );

  let dados;

  try {

    dados =
      JSON.parse(texto);

  } catch {

    dados = {
      resposta: texto
    };

  }

  return {
    status: resposta.status,
    dados
  };
}


// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

// ------------------------------------------------------------
// FORMATAR CNPJ
// ------------------------------------------------------------

function formatarCnpj(
  cnpjLimpo
) {

  if (
    cnpjLimpo.length !== 14
  ) {

    return cnpjLimpo;

  }

  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}


// ------------------------------------------------------------
// CONVERTER DATA OMIE
// ------------------------------------------------------------

function converterDataOmie(
  data
) {

  if (!data) {
    return null;
  }

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      data
    )
  ) {

    return data;

  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      data
    )
  ) {

    const [
      ano,
      mes,
      dia
    ] =
      data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  return data;
}


// ------------------------------------------------------------
// DATA PARA ORDENAÇÃO
// ------------------------------------------------------------

function dataParaOrdenacao(
  data
) {

  if (!data) {
    return 0;
  }

  const partes =
    String(data).split("/");

  if (
    partes.length !== 3
  ) {

    return 0;

  }

  const [
    dia,
    mes,
    ano
  ] = partes;

  return new Date(
    `${ano}-${mes}-${dia}T00:00:00`
  ).getTime();
}


// ------------------------------------------------------------
// DATA OMIE PARA ISO
// ------------------------------------------------------------

function converterDataOmieParaISO(
  data
) {

  if (!data) {
    return null;
  }

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      data
    )
  ) {

    const [
      dia,
      mes,
      ano
    ] =
      data.split("/");

    return `${ano}-${mes}-${dia}`;

  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      data
    )
  ) {

    return data;

  }

  return null;
}


// ============================================================
// API - BUSCAR CLIENTES
// ============================================================
//
// Aceita:
//
// /api/clientes/busca?q=45781176000166
//
// ou:
//
// /api/clientes/busca?termo=45781176000166
//
// ============================================================

// ============================================================
// API - BUSCAR CLIENTES (POR NOME, RAZÃO SOCIAL OU CNPJ)
// ============================================================
// ============================================================
// API - BUSCAR CLIENTES (POR NOME PARCIAL, RAZÃO SOCIAL OU CNPJ)
// ============================================================
// ============================================================
// API - BUSCAR CLIENTES (POR NOME PARCIAL, RAZÃO SOCIAL OU CNPJ)
// ============================================================

// ============================================================
// API - BUSCAR CLIENTES (POR PARTES DO NOME, RAZÃO SOCIAL OU CNPJ)
// ============================================================

app.get(
  "/api/clientes/busca",
  async (req, res) => {

    try {

      const termo =
        (
          req.query.q ||
          req.query.termo ||
          ""
        ).trim();

      if (!termo) {
        return res.status(400).json({
          sucesso: false,
          erro: "Informe o termo de busca (nome, razão social ou CNPJ/CPF)."
        });
      }

      if (termo.length < 2) {
        return res.status(400).json({
          sucesso: false,
          erro: "Digite pelo menos 2 caracteres para a busca."
        });
      }

      const somenteNumeros = termo.replace(/\D/g, "");
      let clientesEncontrados = [];

      // 1. Se for número (CNPJ/CPF), busca direto pelo documento na API
      if (somenteNumeros.length >= 4) {

        const filtro = encodeURIComponent(`document_number:"${somenteNumeros}"`);
        const resultado = await fieldControlFetch(
          `/customers?q=${filtro}&limit=50&offset=0`
        );

        if (resultado.status >= 200 && resultado.status < 300) {
          clientesEncontrados = Array.isArray(resultado.dados?.items) 
            ? resultado.dados.items 
            : [];
        }

      } else {

        // 2. Se for texto, divide em palavras ("prefeitura", "valinhos") e busca se todas aparecem
        const palavrasBusca = termo
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove acentos para facilitar a busca (ex: "cassia" acha "cássia")
          .split(/\s+/)
          .filter(p => p.length > 0);

        let offset = 0;
        let limit = 100;
        let temMais = true;

        console.log(`\n========================================`);
        console.log(`BUSCA TEXTUAL PICADA - Palavras:`, palavrasBusca);
        console.log(`========================================`);

        while (temMais && offset < 500) { // Limite de segurança de paginação
          const resultado = await fieldControlFetch(
            `/customers?limit=${limit}&offset=${offset}`
          );

          if (resultado.status < 200 || resultado.status >= 300) {
            break;
          }

          const itens = Array.isArray(resultado.dados?.items) 
            ? resultado.dados.items 
            : [];

          if (itens.length === 0) {
            temMais = false;
            break;
          }

          // Filtra se TODAS as palavras digitadas aparecem no nome ou na razão social
          const filtradosNestaPagina = itens.filter(c => {
            const nome = String(c.name || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");

            const razao = String(c.legalName || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");

            // Verifica se cada palavra da busca está presente no nome OU na razão social
            return palavrasBusca.every(palavra => 
              nome.includes(palavra) || razao.includes(palavra)
            );
          });

          // Adiciona sem duplicar
          filtradosNestaPagina.forEach(c => {
            if (!clientesEncontrados.some(existente => existente.id === c.id)) {
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

      return res.json({
        sucesso: true,
        termo: termo,
        encontrado: clientesFormatados.length > 0,
        quantidade: clientesFormatados.length,
        clientes: clientesFormatados
      });

    } catch (erro) {
      console.error("Erro ao buscar clientes:", erro);
      return res.status(500).json({
        sucesso: false,
        erro: erro.message
      });
    }

  }
);


// ============================================================
// TESTE - BUSCAR CLIENTE
// ============================================================

app.get(
  "/teste-cliente",
  async (req, res) => {

    try {

      const cnpj =
        "45781176000166";

      const filtro =
        encodeURIComponent(
          `document_number:"${cnpj}"`
        );

      const resultado =
        await fieldControlFetch(
          `/customers?q=${filtro}&limit=100&offset=0`
        );

      if (
        resultado.status < 200 ||
        resultado.status >= 300
      ) {

        return res.status(
          resultado.status
        ).json({

          sucesso: false,

          status:
            resultado.status,

          resposta:
            resultado.dados

        });

      }

      const clientes =
        resultado.dados.items ||
        [];

      const clientesFiltrados =
        clientes.map(
          (cliente) => ({

            nome:
              cliente.name ||
              "Nome não informado",

            cnpj:
              cliente.documentNumber ||
              "CNPJ não informado",

            id:
              cliente.id ||
              "ID não informado"

          })
        );

      return res.json({

        encontrado:
          clientesFiltrados.length > 0,

        quantidade:
          clientesFiltrados.length,

        clientes:
          clientesFiltrados

      });

    } catch (erro) {

      console.error(
        "Erro:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// TESTE - BUSCAR O.S.
// ============================================================

app.get(
  "/teste-os",
  async (req, res) => {

    try {

      const customerId =
        "MTc3MzM2OTo0MjA5Mw==";

      const filtro =
        encodeURIComponent(
          `customer_id:"${customerId}"`
        );

      const resultado =
        await fieldControlFetch(
          `/orders?q=${filtro}&limit=100&offset=0&sort=-created_at`
        );

      if (
        resultado.status < 200 ||
        resultado.status >= 300
      ) {

        return res.status(
          resultado.status
        ).json({

          sucesso: false,

          status:
            resultado.status,

          resposta:
            resultado.dados

        });

      }

      return res.json(
        resultado.dados
      );

    } catch (erro) {

      console.error(
        "Erro:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// DETALHE DE UMA O.S.
// ============================================================

app.get(
  "/teste-os-detalhe",
  async (req, res) => {

    try {

      const osId =
        "MjBjNmUzYzktMGZiNS00OWQ4LTljNDMtZjA0NTVlMTcyODU3OjQyMDkz";

      const resultado =
        await fieldControlFetch(
          `/orders/${encodeURIComponent(osId)}`
        );

      return res.status(
        resultado.status
      ).json(
        resultado.dados
      );

    } catch (erro) {

      console.error(
        "Erro:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// TESTE - STATUS DA O.S.
// ============================================================

app.get(
  "/teste-status-os",
  async (req, res) => {

    try {

      const customerId =
        "MTc3MzM2OTo0MjA5Mw==";

      const filtro =
        encodeURIComponent(
          `customer_id:"${customerId}"`
        );

      const resultado =
        await fieldControlFetch(
          `/orders?q=${filtro}&limit=1&offset=0`
        );

      if (
        resultado.status < 200 ||
        resultado.status >= 300
      ) {

        return res.status(
          resultado.status
        ).json({

          sucesso: false,

          status:
            resultado.status,

          resposta:
            resultado.dados

        });

      }

      const ordens =
        resultado.dados.items ||
        [];

      if (
        ordens.length === 0
      ) {

        return res.json({

          sucesso: false,

          mensagem:
            "Nenhuma O.S. encontrada."

        });

      }

      return res.json({

        sucesso: true,

        mensagem:
          "Dados completos da primeira O.S.",

        os:
          ordens[0]

      });

    } catch (erro) {

      console.error(
        "Erro:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// TESTE - ATIVIDADES DA O.S.
// ============================================================

app.get(
  "/teste-atividade-os",
  async (req, res) => {

    try {

      const orderId =
        "MjBjNmUzYzktMGZiNS00OWQ4LTljNDMtZjA0NTVlMTcyODU3OjQyMDkz";

      const resultado =
        await fieldControlFetch(
          `/orders/${encodeURIComponent(orderId)}/tasks`
        );

      return res.status(
        resultado.status
      ).json({

        sucesso:
          resultado.status >= 200 &&
          resultado.status < 300,

        status_http:
          resultado.status,

        dados:
          resultado.dados

      });

    } catch (erro) {

      console.error(
        "Erro:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// TESTE - TICKET FIELD CONTROL
// ============================================================

app.get(
  "/teste-ticket",
  async (req, res) => {

    try {

      const ticketId =
        "ZmMyMWY5YmItMWUzMy00YzJkLTg0NDctYzg1N2Y2NWU5NzVkOjQyMDkz";

      const resultado =
        await fieldControlFetch(
          `/tickets/${encodeURIComponent(ticketId)}`
        );

      if (
        resultado.status < 200 ||
        resultado.status >= 300
      ) {

        return res.status(
          resultado.status
        ).json({

          sucesso: false,

          status:
            resultado.status,

          resposta:
            resultado.dados

        });

      }

      return res.json({

        sucesso: true,

        ticket:
          resultado.dados

      });

    } catch (erro) {

      console.error(
        "Erro:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// API PRINCIPAL - VISITAS TÉCNICAS
// ============================================================

app.get(
  "/api/visitas-tecnicas/:clienteId",
  async (req, res) => {

    try {

      const clienteId =
        req.params.clienteId;

      const dataInicio =
        req.query.data_inicio;

      const dataFim =
        req.query.data_fim;

      // ------------------------------------------------------
      // VALIDAÇÃO DAS DATAS
      // ------------------------------------------------------

      if (
        !dataInicio ||
        !dataFim
      ) {

        return res.status(400).json({

          sucesso: false,

          erro:
            "Informe data_inicio e data_fim.",

          exemplo:
            `/api/visitas-tecnicas/${clienteId}?data_inicio=2026-01-01&data_fim=2026-08-31`

        });

      }

      const formatoData =
        /^\d{4}-\d{2}-\d{2}$/;

      if (
        !formatoData.test(dataInicio) ||
        !formatoData.test(dataFim)
      ) {

        return res.status(400).json({

          sucesso: false,

          erro:
            "As datas devem estar no formato YYYY-MM-DD."

        });

      }

      if (
        dataInicio > dataFim
      ) {

        return res.status(400).json({

          sucesso: false,

          erro:
            "A data_inicio não pode ser maior que a data_fim."

        });

      }

      // ------------------------------------------------------
      // PERÍODO
      // ------------------------------------------------------

      const inicioPeriodo =
        new Date(
          `${dataInicio}T00:00:00.000Z`
        );

      const fimPeriodo =
        new Date(
          `${dataFim}T23:59:59.999Z`
        );

      // ------------------------------------------------------
      // BUSCAR O.S.
      // ------------------------------------------------------

      const LIMITE_POR_PAGINA =
        100;

      let offset = 0;

      let todasOrdens = [];

      let terminouBusca = false;

      const filtroCliente =
        encodeURIComponent(
          `customer_id:"${clienteId}"`
        );

      while (
        !terminouBusca
      ) {

        const resultado =
          await fieldControlFetch(
            `/orders?q=${filtroCliente}&limit=${LIMITE_POR_PAGINA}&offset=${offset}&sort=-created_at`
          );

        if (
          resultado.status < 200 ||
          resultado.status >= 300
        ) {

          return res.status(
            resultado.status
          ).json({

            sucesso: false,

            erro:
              "Erro ao buscar O.S.",

            resposta:
              resultado.dados

          });

        }

        const ordens =
          resultado.dados.items ||
          [];

        console.log(
          `Página carregada: offset=${offset}, encontrados=${ordens.length}`
        );

        for (
          const os of ordens
        ) {

          const dataCriacao =
            os.createdAt ||
            os.created_at ||
            null;

          if (!dataCriacao) {
            continue;
          }

          const dataOS =
            new Date(
              dataCriacao
            );

          if (
            dataOS < inicioPeriodo
          ) {

            terminouBusca =
              true;

            break;

          }

          if (
            dataOS >= inicioPeriodo &&
            dataOS <= fimPeriodo
          ) {

            todasOrdens.push(os);

          }

        }

        if (
          ordens.length <
          LIMITE_POR_PAGINA
        ) {

          terminouBusca =
            true;

        }

        if (
          !terminouBusca
        ) {

          offset +=
            LIMITE_POR_PAGINA;

        }

      }

      console.log(
        `Total de O.S. dentro do período: ${todasOrdens.length}`
      );

      // ------------------------------------------------------
      // BUSCAR ATIVIDADES
      // ------------------------------------------------------

      const visitas = [];

      for (
        const os of todasOrdens
      ) {

        // ----------------------------------------------------
        // VERIFICAR TICKET ARQUIVADO
        // ----------------------------------------------------

        let ticketArquivado =
          false;

        if (
          os.ticket &&
          os.ticket.id
        ) {

          try {

            const ticketResultado =
              await fieldControlFetch(
                `/tickets/${encodeURIComponent(os.ticket.id)}`
              );

            if (
              ticketResultado.status >= 200 &&
              ticketResultado.status < 300
            ) {

              ticketArquivado =
                ticketResultado.dados.archived === true;

            }

          } catch (
            erroTicket
          ) {

            console.error(
              `Erro ao verificar ticket da O.S. ${os.identifier}:`,
              erroTicket.message
            );

          }

        }

        if (
          ticketArquivado
        ) {

          continue;

        }

        // ----------------------------------------------------
        // ATIVIDADES
        // ----------------------------------------------------

        let atividades = [];

        try {

          const atividadesResultado =
            await fieldControlFetch(
              `/orders/${encodeURIComponent(os.id)}/tasks`
            );

          if (
            atividadesResultado.status >= 200 &&
            atividadesResultado.status < 300
          ) {

            atividades =
              atividadesResultado.dados.items ||
              [];

          }

        } catch (
          erroAtividade
        ) {

          console.error(
            `Erro na atividade da O.S. ${os.identifier}:`,
            erroAtividade.message
          );

        }

        // ----------------------------------------------------
        // ATIVIDADE MAIS RELEVANTE
        // ----------------------------------------------------

        let atividade =
          null;

        if (
          atividades.length > 0
        ) {

          atividade =
            atividades.find(
              (item) =>
                item.status === "done"
            ) ||

            atividades.find(
              (item) =>
                item.status === "canceled"
            ) ||

            atividades.find(
              (item) =>
                item.status === "reported" &&
                item.completedAt
            ) ||

            atividades[0];

        }

        // ----------------------------------------------------
        // ADICIONAR VISITA
        // ----------------------------------------------------

        visitas.push({

          id:
            os.id,

          numero:
            os.identifier ||
            os.number ||
            "—",

          situacao_original:
            os.status ||
            null,

          criado_em:
            os.createdAt ||
            os.created_at ||
            null,

          atualizado_em:
            os.updatedAt ||
            os.updated_at ||
            null,

          problema:
            os.description ||
            os.title ||
            "Sem descrição",

          link_os:
            os.link ||
            null,

          atividade:
            atividade
              ? {

                  id:
                    atividade.id ||
                    null,

                  status:
                    atividade.status ||
                    null,

                  descricao:
                    atividade.statusDescription ||
                    null,

                  inicio:
                    atividade.startedAt ||
                    null,

                  conclusao:
                    atividade.completedAt ||
                    null,

                  data_agendada:
                    atividade.scheduling?.date ||
                    null,

                  horario_agendado:
                    atividade.scheduling?.time ||
                    null,

                  funcionario_id:
                    atividade.employee?.id ||
                    null

                }
              : null

        });

      }

      // ------------------------------------------------------
      // CLASSIFICAÇÃO
      // ------------------------------------------------------

      const abertas = [];

      const fechadas = [];

      visitas.forEach(
        (os) => {

          const atividade =
            os.atividade;

          let estaFechada =
            false;

          if (
            atividade
          ) {

            if (
              atividade.status ===
              "done"
            ) {

              estaFechada =
                true;

            } else if (
              atividade.status ===
              "canceled"
            ) {

              estaFechada =
                true;

            } else if (
              atividade.status ===
                "reported" &&
              atividade.conclusao
            ) {

              estaFechada =
                true;

            } else if (
              atividade.descricao &&
              /resolvid|finalizad|conclu[ií]d|equipamento.*funcionando|funcionando.*normal/i.test(
                atividade.descricao
              )
            ) {

              estaFechada =
                true;

            }

          }

          if (
            estaFechada
          ) {

            os.situacao =
              "FECHADA";

            fechadas.push(os);

          } else {

            os.situacao =
              "ABERTA";

            abertas.push(os);

          }

        }
      );

      // ------------------------------------------------------
      // ORDENAÇÃO
      // ------------------------------------------------------

      const ordenarPorData =
        (a, b) => {

          const dataA =
            new Date(
              a.criado_em || 0
            ).getTime();

          const dataB =
            new Date(
              b.criado_em || 0
            ).getTime();

          return (
            dataB - dataA
          );

        };

      abertas.sort(
        ordenarPorData
      );

      fechadas.sort(
        ordenarPorData
      );

      // ------------------------------------------------------
      // RESPOSTA
      // ------------------------------------------------------

      return res.json({

        sucesso: true,

        periodo: {

          data_inicio:
            dataInicio,

          data_fim:
            dataFim

        },

        cliente: {

          id:
            clienteId

        },

        total:
          visitas.length,

        abertas: {

          quantidade:
            abertas.length,

          items:
            abertas

        },

        fechadas: {

          quantidade:
            fechadas.length,

          items:
            fechadas

        }

      });

    } catch (erro) {

      console.error(
        "Erro geral:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// API - FINANCEIRO
// CONTAS A RECEBER / BOLETOS EM ABERTO
// ============================================================

app.get(
  "/api/financeiro/:cnpj",
  async (req, res) => {

    try {

      const cnpj =
        (
          req.params.cnpj ||
          ""
        ).replace(
          /\D/g,
          ""
        );

      // ------------------------------------------------------
      // VALIDAÇÃO
      // ------------------------------------------------------

      if (!cnpj) {

        return res.status(400).json({

          sucesso: false,

          erro:
            "Informe o CNPJ na URL."

        });

      }

      // ------------------------------------------------------
      // DESCOBRIR CLIENTE OMIE
      // ------------------------------------------------------

      const consultaResposta =
        await fetch(
          `https://consul-camp.netlify.app/.netlify/functions/consulta?q=${encodeURIComponent(cnpj)}`
        );

      if (
        !consultaResposta.ok
      ) {

        return res.status(502).json({

          sucesso: false,

          erro:
            "Não foi possível consultar o cadastro do cliente.",

          status:
            consultaResposta.status

        });

      }

      const consultaDados =
        await consultaResposta.json();

      const clientesEncontrados =
        consultaDados.clientes ||
        [];

      if (
        clientesEncontrados.length === 0
      ) {

        return res.status(404).json({

          sucesso: false,

          erro:
            "Cliente não encontrado para esse CNPJ.",

          cnpj_testado:
            cnpj

        });

      }

      const nCodigoCliente =
        Number(
          clientesEncontrados[0]
            .codigo_cliente_omie
        );

      if (
        !Number.isFinite(
          nCodigoCliente
        ) ||
        nCodigoCliente <= 0
      ) {

        return res.status(500).json({

          sucesso: false,

          erro:
            "Código do cliente Omie inválido."

        });

      }

      console.log(
        `FINANCEIRO - CNPJ ${cnpj} -> cliente Omie ${nCodigoCliente}`
      );

      // ------------------------------------------------------
      // BUSCAR CONTAS A RECEBER
      // ------------------------------------------------------

      const LIMITE_POR_PAGINA =
        100;

      let pagina = 1;

      let totalPaginas = 1;

      let todosTitulos = [];

      do {

        const parametros = {

          pagina:
            pagina,

          registros_por_pagina:
            LIMITE_POR_PAGINA,

          filtrar_apenas_titulos_em_aberto:
            "S"

        };

        console.log(
          `FINANCEIRO - consultando página ${pagina}`
        );

        const resultado =
          await omieFetch(
            "/financas/contareceber/",
            "ListarContasReceber",
            parametros
          );

        if (
          resultado.status < 200 ||
          resultado.status >= 300
        ) {

          return res.status(
            resultado.status
          ).json({

            sucesso: false,

            erro:
              "Erro ao consultar contas a receber na Omie.",

            resposta:
              resultado.dados

          });

        }

        const registros =
          resultado.dados?.conta_receber_cadastro ||
          [];

        todosTitulos =
          todosTitulos.concat(
            registros
          );

        totalPaginas =
          Number(
            resultado.dados?.total_de_paginas ||
            resultado.dados?.nTotPaginas ||
            1
          );

        console.log(
          `FINANCEIRO - página ${pagina}/${totalPaginas}: ${registros.length} registros`
        );

        pagina++;

      } while (
        pagina <= totalPaginas
      );

      console.log(
        `FINANCEIRO - total de títulos encontrados: ${todosTitulos.length}`
      );

      // ------------------------------------------------------
      // FILTRAR CLIENTE
      // ------------------------------------------------------

      const titulosCliente =
        todosTitulos.filter(
          (titulo) => {

            const codigoCliente =
              Number(
                titulo.codigo_cliente_fornecedor
              );

            return (
              codigoCliente ===
              nCodigoCliente
            );

          }
        );

      console.log(
        `FINANCEIRO - títulos do cliente ${nCodigoCliente}: ${titulosCliente.length}`
      );

      // ------------------------------------------------------
      // FILTRAR NÃO PAGOS
      // ------------------------------------------------------

      const titulosAbertos =
        titulosCliente.filter(
          (titulo) => {

            const status =
              String(
                titulo.status_titulo ||
                ""
              )
              .trim()
              .toUpperCase();

            if (
              status.includes("PAGO") ||
              status.includes("LIQUID") ||
              status.includes("CANCEL")
            ) {

              return false;

            }

            return true;

          }
        );

      console.log(
        "TÍTULOS CONSIDERADOS EM ABERTO:",
        titulosAbertos.length
      );

      // ------------------------------------------------------
      // FORMATAR
      // ------------------------------------------------------

      const boletos =
        titulosAbertos.map(
          (titulo) => {

            const boleto =
              titulo.boleto ||
              {};

            return {

              codigo_lancamento:
                titulo.codigo_lancamento_omie ||
                null,

              numero_documento:
                titulo.numero_documento_fiscal ||
                null,

              numero_boleto:
                boleto.cNumBoleto ||
                boleto.cNumBancario ||
                null,

              parcela:
                titulo.numero_parcela ||
                null,

              data_emissao:
                converterDataOmie(
                  titulo.data_emissao
                ),

              data_vencimento:
                converterDataOmie(
                  titulo.data_vencimento
                ),

              status:
                titulo.status_titulo ||
                "EM ABERTO"

            };

          }
        );

      // ------------------------------------------------------
      // ORDENAR
      // ------------------------------------------------------

      boletos.sort(
        (a, b) =>
          dataParaOrdenacao(
            a.data_vencimento
          ) -
          dataParaOrdenacao(
            b.data_vencimento
          )
      );

      // ------------------------------------------------------
      // RESPOSTA
      // ------------------------------------------------------

      return res.json({

        sucesso: true,

        cliente: {

          cnpj:
            cnpj,

          nCodigoCliente:
            nCodigoCliente

        },

        total:
          boletos.length,

        boletos:
          boletos

      });

    } catch (erro) {

      console.error(
        "Erro no financeiro:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// API - FINANCEIRO ABERTO
// ============================================================

app.get(
  "/api/financeiro-aberto/:cnpj",
  async (req, res) => {

    try {

      const cnpj =
        (
          req.params.cnpj ||
          ""
        ).replace(
          /\D/g,
          ""
        );

      if (!cnpj) {

        return res.status(400).json({

          sucesso: false,

          erro:
            "Informe o CNPJ na URL."

        });

      }

      // ------------------------------------------------------
      // CONSULTAR CLIENTE
      // ------------------------------------------------------

      const consultaResposta =
        await fetch(
          `https://consul-camp.netlify.app/.netlify/functions/consulta?q=${encodeURIComponent(cnpj)}`
        );

      if (
        !consultaResposta.ok
      ) {

        return res.status(502).json({

          sucesso: false,

          erro:
            "Não foi possível consultar o cadastro do cliente.",

          status:
            consultaResposta.status

        });

      }

      const consultaDados =
        await consultaResposta.json();

      const clientesEncontrados =
        consultaDados.clientes ||
        [];

      if (
        clientesEncontrados.length === 0
      ) {

        return res.status(404).json({

          sucesso: false,

          erro:
            "Cliente não encontrado para esse CNPJ.",

          cnpj_testado:
            cnpj

        });

      }

      const nCodigoCliente =
        Number(
          clientesEncontrados[0]
            .codigo_cliente_omie
        );

      if (
        !Number.isFinite(
          nCodigoCliente
        ) ||
        nCodigoCliente <= 0
      ) {

        return res.status(500).json({

          sucesso: false,

          erro:
            "Código do cliente Omie inválido."

        });

      }

      console.log(
        `FINANCEIRO ABERTO - CNPJ ${cnpj} -> cliente Omie ${nCodigoCliente}`
      );

      // ------------------------------------------------------
      // CONSULTAR CONTAS
      // ------------------------------------------------------

      const LIMITE_POR_PAGINA =
        50;

      let pagina = 1;

      let todosTitulos = [];

      let totalPaginas = 1;

      do {

        const parametros = {

          pagina:
            pagina,

          registros_por_pagina:
            LIMITE_POR_PAGINA,

          clientes_paginas: [

            {
              codigo_cliente:
                nCodigoCliente
            }

          ]

        };

        const resultado =
          await omieFetch(
            "/financas/contareceber/",
            "ListarContasReceber",
            parametros
          );

        if (
          resultado.status < 200 ||
          resultado.status >= 300
        ) {

          return res.status(
            resultado.status
          ).json({

            sucesso: false,

            erro:
              "Erro ao consultar contas a receber na Omie.",

            resposta:
              resultado.dados

          });

        }

        const titulosPagina =
          resultado.dados?.conta_receber_cadastro ||
          resultado.dados?.contas_receber ||
          [];

        todosTitulos =
          todosTitulos.concat(
            titulosPagina
          );

        totalPaginas =
          Number(
            resultado.dados?.total_de_paginas ||
            resultado.dados?.nTotPaginas ||
            1
          );

        console.log(
          `Contas a receber - página ${pagina}/${totalPaginas}: ${titulosPagina.length}`
        );

        pagina++;

      } while (
        pagina <= totalPaginas
      );

      // ------------------------------------------------------
      // FILTRAR SOMENTE ABERTOS
      // ------------------------------------------------------

      const titulosAbertos =
        todosTitulos.filter(
          (titulo) => {

            const status =
              String(
                titulo.status_titulo ||
                titulo.c_status_titulo ||
                titulo.status ||
                ""
              ).toUpperCase();

            const situacao =
              String(
                titulo.situacao ||
                titulo.c_situacao ||
                ""
              ).toUpperCase();

            const encerrado =
              status.includes("PAGO") ||
              status.includes("LIQUID") ||
              status.includes("QUIT") ||
              status.includes("CANCEL") ||
              situacao.includes("PAGO") ||
              situacao.includes("LIQUID") ||
              situacao.includes("QUIT") ||
              situacao.includes("CANCEL");

            if (
              encerrado
            ) {

              return false;

            }

            if (
              status.includes("ABERTO") ||
              status.includes("PENDENTE") ||
              situacao.includes("ABERTO") ||
              situacao.includes("PENDENTE")
            ) {

              return true;

            }

            return false;

          }
        );

      // ------------------------------------------------------
      // VENCIMENTO
      // ------------------------------------------------------

      function obterVencimento(
        titulo
      ) {

        return (
          titulo.data_vencimento ||
          titulo.d_vencimento ||
          titulo.dataVencimento ||
          titulo.vencimento ||
          null
        );

      }

      // ------------------------------------------------------
      // ORDENAR
      // ------------------------------------------------------

      titulosAbertos.sort(
        (a, b) => {

          const dataA =
            converterDataOmieParaISO(
              obterVencimento(a)
            ) ||
            "9999-99-99";

          const dataB =
            converterDataOmieParaISO(
              obterVencimento(b)
            ) ||
            "9999-99-99";

          return dataA.localeCompare(
            dataB
          );

        }
      );

      // ------------------------------------------------------
      // NÃO ENVIAR VALORES
      // ------------------------------------------------------

      const boletos =
        titulosAbertos.map(
          (titulo) => {

            return {

              vencimento:
                obterVencimento(
                  titulo
                ),

              status:
                "ABERTO"

            };

          }
        );

      // ------------------------------------------------------
      // RESPOSTA
      // ------------------------------------------------------

      return res.json({

        sucesso: true,

        cliente: {

          cnpj:
            cnpj,

          nCodigoCliente:
            nCodigoCliente

        },

        tem_boleto_aberto:
          boletos.length > 0,

        total:
          boletos.length,

        boletos:
          boletos

      });

    } catch (erro) {

      console.error(
        "Erro no financeiro aberto:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// TESTE DIRETO OMIE - NFSE
// ============================================================

app.get(
  "/teste-omie-nfse",
  async (req, res) => {

    try {

      const resultado =
        await omieFetch(
          "/servicos/nfse/",
          "ListarNFSEs",
          {

            nPagina:
              1,

            nRegPorPagina:
              50,

            nCodigoCliente:
              1686126632

          }
        );

      console.log(
        "TESTE DIRETO OMIE:",
        JSON.stringify(
          resultado,
          null,
          2
        )
      );

      return res.status(
        resultado.status
      ).json(
        resultado
      );

    } catch (erro) {

      console.error(
        "Erro no teste direto Omie:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// TESTE - ZONKI TICKETS
// ============================================================

app.get(
  "/teste-zonki-tickets",
  async (req, res) => {

    try {

      const resultado =
        await zonkiFetch(
          "/v1/tickets"
        );

      console.log(
        "STATUS ZONKI:",
        resultado.status
      );

      console.log(
        "RESPOSTA ZONKI:",
        JSON.stringify(
          resultado.dados,
          null,
          2
        )
      );

      return res.status(
        resultado.status
      ).json({

        sucesso:
          resultado.status >= 200 &&
          resultado.status < 300,

        status_http:
          resultado.status,

        dados:
          resultado.dados

      });

    } catch (erro) {

      console.error(
        "Erro ao consultar Zonki:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// TESTE - ZONKI CLIENTES
// ============================================================

app.get(
  "/teste-zonki-clientes",
  async (req, res) => {

    try {

      const resultado =
        await zonkiFetch(
          "/v1/customers"
        );

      console.log(
        "STATUS ZONKI CLIENTES:",
        resultado.status
      );

      console.log(
        "RESPOSTA ZONKI CLIENTES:",
        JSON.stringify(
          resultado.dados,
          null,
          2
        )
      );

      return res.status(
        resultado.status
      ).json({

        sucesso:
          resultado.status >= 200 &&
          resultado.status < 300,

        status_http:
          resultado.status,

        dados:
          resultado.dados

      });

    } catch (erro) {

      console.error(
        "Erro ao consultar clientes Zonki:",
        erro
      );

      return res.status(500).json({

        sucesso: false,

        erro:
          erro.message

      });

    }

  }
);


// ============================================================
// API PRINCIPAL - TICKETS ZONKI POR TERMO (CNPJ, CPF, NOME OU RAZÃO SOCIAL)
// ============================================================
app.get(
  "/api/tickets/:termo",
  async (req, res) => {
    try {
      const termoBruto = req.params.termo || "";
      const termoLimpo = termoBruto.trim();
      const apenasNumeros = termoLimpo.replace(/\D/g, "");

      const dataInicioFiltro = req.query.startDate || req.query.data_inicial || null;
      const dataFimFiltro = req.query.endDate || req.query.data_final || null;

      console.log(`\n========================================`);
      console.log(`ZONKI - Buscando tickets para o termo: "${termoLimpo}"`);

      if (!termoLimpo) {
        return res.status(400).json({ sucesso: false, erro: "Informe um termo de busca válido (CNPJ, CPF, Nome ou Razão Social)." });
      }

      // 1. Busca a lista completa de clientes no Zonki
      const respostaClientes = await zonkiFetch("/v1/customers");
      let listaClientes = [];

      if (respostaClientes.status >= 200 && respostaClientes.status < 300) {
        listaClientes = respostaClientes.dados?.data || respostaClientes.dados?.items || respostaClientes.dados || [];
      }

      // 2. Identifica todos os clientes que batem com o critério (por documento limpo ou por nome/razão social/fantasia)
      let idsClientes = [];
      let cnpjsRelacionados = new Set();
      let nomesRelacionados = new Set();

      if (Array.isArray(listaClientes)) {
        listaClientes.forEach(c => {
          const docCnpj = String(c.cnpj || "").replace(/\D/g, "");
          const docNum = String(c.documentNumber || c.document_number || "").replace(/\D/g, "");
          const nomeCliente = String(c.name || "").trim().toLowerCase();
          const nomeFantasia = String(c.tradeName || c.trade_name || c.fantasia || "").trim().toLowerCase();

          const bateDocumento = apenasNumeros.length >= 5 && (docCnpj.includes(apenasNumeros) || docNum.includes(apenasNumeros));
          const bateTexto = termoLimpo.length >= 2 && (nomeCliente.includes(termoLimpo.toLowerCase()) || nomeFantasia.includes(termoLimpo.toLowerCase()));

          if (bateDocumento || bateTexto) {
            if (c.id && !idsClientes.includes(c.id)) {
              idsClientes.push(c.id);
            }
            if (docCnpj) cnpjsRelacionados.add(docCnpj);
            if (docNum) cnpjsRelacionados.add(docNum);
            if (c.name) nomesRelacionados.add(String(c.name).trim());
          }
        });
      }

      console.log(`ZONKI - IDs encontrados para o termo:`, idsClientes);

      // Expande para capturar eventuais duplicados que compartilhem do mesmo documento ou nome
      if (Array.isArray(listaClientes) && (cnpjsRelacionados.size > 0 || nomesRelacionados.size > 0)) {
        listaClientes.forEach(c => {
          const docCnpj = String(c.cnpj || "").replace(/\D/g, "");
          const docNum = String(c.documentNumber || c.document_number || "").replace(/\D/g, "");
          const nomeCliente = String(c.name || "").trim();

          const mesmoCnpj = (docCnpj && cnpjsRelacionados.has(docCnpj)) || (docNum && cnpjsRelacionados.has(docNum));
          const mesmoNome = nomeCliente && Array.from(nomesRelacionados).some(n => n.toLowerCase() === nomeCliente.toLowerCase());

          if ((mesmoCnpj || mesmoNome) && c.id && !idsClientes.includes(c.id)) {
            idsClientes.push(c.id);
          }
        });
      }

      let todosOsTickets = [];

      // 3. Puxa os tickets de todos os IDs consolidados de forma paginada (até 35 páginas)
      for (const clienteId of idsClientes) {
        let pagina = 1;
        let temMaisPaginas = true;

        while (temMaisPaginas && pagina <= 35) {
          const respostaTickets = await zonkiFetch("/v1/tickets", {
            customer_id: clienteId,
            page: pagina,
            limit: 100
          });

          if (respostaTickets.status >= 200 && respostaTickets.status < 300) {
            const dadosRetorno = respostaTickets.dados;
            const items = dadosRetorno?.items || dadosRetorno?.data || dadosRetorno;

            if (Array.isArray(items) && items.length > 0) {
              todosOsTickets = todosOsTickets.concat(items);
              
              const totalPaginasAPI = dadosRetorno?.totalPages || dadosRetorno?.last_page;
              if (totalPaginasAPI && pagina >= totalPaginasAPI) {
                temMaisPaginas = false;
              } else if (items.length < 100) {
                temMaisPaginas = false;
              } else {
                pagina++;
              }
            } else {
              temMaisPaginas = false;
            }
          } else {
            temMaisPaginas = false;
          }
        }
      }

      // 4. Varredura ampla de segurança caso o mapeamento direto venha vazio
      if (todosOsTickets.length === 0) {
        console.log("ZONKI - Varredura ampla ativada por correspondência de texto/documento nos tickets...");
        let pagina = 1;
        let temMaisPaginas = true;

        while (temMaisPaginas && pagina <= 35) {
          const respostaGeral = await zonkiFetch("/v1/tickets", { page: pagina, limit: 100 });
          if (respostaGeral.status >= 200 && respostaGeral.status < 300) {
            const dadosRetorno = respostaGeral.dados;
            const items = dadosRetorno?.items || dadosRetorno?.data || dadosRetorno;

            if (Array.isArray(items) && items.length > 0) {
              const filtrados = items.filter(t => {
                const cust = t.customer || {};
                const custCnpj = String(cust.cnpj || cust.documentNumber || cust.document_number || "").replace(/\D/g, "");
                const custName = String(cust.name || "").toLowerCase();
                
                const bateNum = apenasNumeros.length >= 5 && custCnpj.includes(apenasNumeros);
                const bateTxt = termoLimpo.length >= 2 && custName.includes(termoLimpo.toLowerCase());

                return bateNum || bateTxt;
              });

              todosOsTickets = todosOsTickets.concat(filtrados);

              const totalPaginasAPI = dadosRetorno?.totalPages || dadosRetorno?.last_page;
              if (totalPaginasAPI && pagina >= totalPaginasAPI) {
                temMaisPaginas = false;
              } else if (items.length < 100) {
                temMaisPaginas = false;
              } else {
                pagina++;
              }
            } else {
              temMaisPaginas = false;
            }
          } else {
            temMaisPaginas = false;
          }
        }
      }

      // Remove duplicatas exatas de tickets com base no ID do ticket
      const ticketsUnicos = Array.from(new Map(todosOsTickets.map(t => [t.id, t])).values());

      // 5. Aplicação rigorosa do filtro por período de datas
      let ticketsFiltradosPorData = ticketsUnicos;

      if (dataInicioFiltro || dataFimFiltro) {
        const inicio = dataInicioFiltro ? new Date(dataInicioFiltro + "T00:00:00") : null;
        const fim = dataFimFiltro ? new Date(dataFimFiltro + "T23:59:59") : null;

        ticketsFiltradosPorData = ticketsUnicos.filter(t => {
          const dataCriacaoStr = t.createdAt || t.created_at;
          if (!dataCriacaoStr) return false;
          const dataTicket = new Date(dataCriacaoStr);

          if (inicio && dataTicket < inicio) return false;
          if (fim && dataTicket > fim) return false;
          return true;
        });
      }

      console.log(`ZONKI TICKETS - Total bruto antes dos detalhes: ${ticketsFiltradosPorData.length}`);

      // ----------------------------------------------------
      // BUSCAR DETALHES COMPLETOS DE CADA TICKET PARA GARANTIR O TÉCNICO
      // ----------------------------------------------------
      const ticketsComDetalhes = [];

      for (const t of ticketsFiltradosPorData) {
        let ticketCompleto = t;
        
        if (t.id) {
          try {
            const resDetalhe = await zonkiFetch(`/v1/tickets/${encodeURIComponent(t.id)}`);
            if (resDetalhe.status >= 200 && resDetalhe.status < 300 && resDetalhe.dados) {
              ticketCompleto = resDetalhe.dados.data || resDetalhe.dados.ticket || resDetalhe.dados;
            }
          } catch (errDetalhe) {
            console.error(`Erro ao buscar detalhe do ticket ${t.id}:`, errDetalhe.message);
          }
        }

        ticketsComDetalhes.push(ticketCompleto);
      }

      console.log(`ZONKI TICKETS - Total final consolidado com detalhes: ${ticketsComDetalhes.length}`);
      console.log("========================================\n");

      const ticketsFormatados = ticketsComDetalhes.map(t => {
        const statusOriginal = t.status;
        let statusNome = "Pendente";
        let statusCode = "open";

        if (statusOriginal && typeof statusOriginal === "object") {
          statusNome = statusOriginal.name || statusOriginal.label || "Pendente";
          statusCode = statusOriginal.code || statusOriginal.id || "open";
        } else if (statusOriginal) {
          statusNome = String(statusOriginal);
          statusCode = t.statusCode || t.status_code || String(statusOriginal);
        }

        // Extração robusta do nome do técnico nas várias propriedades possíveis do Zonki
        const tecnicoObj = t.technician || t.assignedTo || t.user || t.employee || t.assignee || {};
        const nomeTecnico = 
          typeof tecnicoObj === "string" ? tecnicoObj :
          (tecnicoObj.name || tecnicoObj.fullName || tecnicoObj.nome || t.technicianName || t.assigned_to_name || "Não atribuído");

        return {
          number: t.number || t.code || t.protocol || t.id || "—",
          subject: t.subject || t.title || t.description || "Sem assunto",
          status: { name: statusNome },
          statusCode: t.statusCode || t.status_code || statusCode,
          customStatusId: t.customStatusId || t.custom_status_id || null,
          customerId: t.customerId || t.customer_id || t.customer?.id || idsClientes[0] || null,
          customer: {
            cnpj: t.customer?.cnpj || (cnpjsRelacionados.size > 0 ? Array.from(cnpjsRelacionados)[0] : "")
          },
          technicianName: nomeTecnico, 
          tags: Array.isArray(t.tags) ? t.tags : [],
          created_at: t.createdAt || t.created_at || null,
          resolved_at: t.resolvedAt || t.resolved_at || null,
          closed_at: t.closedAt || t.closed_at || null
        };
      });

      ticketsFormatados.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      return res.json({
        sucesso: true,
        termo_buscado: termoLimpo,
        total: ticketsFormatados.length,
        tickets: ticketsFormatados
      });

    } catch (erro) {
      console.error("Erro ao buscar tickets no Zonki por termo:", erro);
      return res.status(500).json({ sucesso: false, erro: erro.message });
    }
  }
);


// ============================================================
// ROTA 404 PARA APIs
// ============================================================

app.use(
  "/api",
  (req, res) => {

    res.status(404).json({

      sucesso: false,

      erro:
        "Rota da API não encontrada.",

      rota:
        req.originalUrl

    });

  }
);


// ============================================================
// SERVIDOR
// ============================================================

app.listen(
  PORT,
  () => {

    console.log(
      `Servidor rodando em http://localhost:${PORT}`
    );

  }
);