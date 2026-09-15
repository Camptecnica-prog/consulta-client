/* ============================================================
   DADOS DE EXEMPLO
   ------------------------------------------------------------
   Este arquivo simula as 4 APIs que serão integradas depois:
   suporte, implantação, financeiro e visitas técnicas.

   Quando formos integrar de verdade, cada bloco abaixo vira uma
   chamada fetch() separada para a API correspondente — o formato
   dos campos foi pensado para bater com o que cada card espera
   (ver js/cliente.js). Assim trocamos o mock pela API real sem
   mexer no HTML/CSS.
   ============================================================ */

const CLIENTES = [
  {
    id: "exemplo-001",
    nome_fantasia: "Comércio Exemplo",
    razao_social: "Comércio Exemplo Distribuidora Ltda",
    cnpj: "12345678000199", // salvo só com dígitos, formatação é feita na tela
    cpf: null,

    suporte: {
      tickets: [
        { id: "SUP-4821", assunto: "Erro ao emitir NF-e", status: "aberto", data_abertura: "2026-08-24T09:12:00" },
        { id: "SUP-4790", assunto: "Lentidão no módulo de estoque", status: "aberto", data_abertura: "2026-08-20T14:30:00" },
        { id: "SUP-4711", assunto: "Dúvida sobre permissão de usuário", status: "fechado", data_abertura: "2026-08-10T10:00:00", data_fechamento: "2026-08-11T16:45:00" },
        { id: "SUP-4602", assunto: "Integração com leitor de código de barras", status: "fechado", data_abertura: "2026-07-28T08:20:00", data_fechamento: "2026-08-02T11:00:00" },
        { id: "SUP-4530", assunto: "Relatório de vendas não abre", status: "fechado", data_abertura: "2026-07-15T13:00:00", data_fechamento: "2026-07-15T18:30:00" }
      ]
    },

    implantacao: {
      etapa_atual: "treinamento", // chave da etapa atual no board
      etapas: ["levantamento", "configuracao", "migracao_dados", "treinamento", "go_live"],
      tickets: [
        { id: "IMP-0231", assunto: "Configurar centro de custo", status: "aberto", data_abertura: "2026-08-22T09:00:00" },
        { id: "IMP-0219", assunto: "Cadastro inicial de produtos", status: "fechado", data_abertura: "2026-08-05T09:00:00", data_fechamento: "2026-08-09T17:00:00" },
        { id: "IMP-0201", assunto: "Levantamento de requisitos fiscais", status: "fechado", data_abertura: "2026-07-20T09:00:00", data_fechamento: "2026-07-24T12:00:00" }
      ]
    },

    financeiro: {
      boletos: [
        { id: "BOL-77120", valor: 480.00, vencimento: "2026-09-10", status: "aberto" },
        { id: "BOL-76980", valor: 480.00, vencimento: "2026-08-10", status: "pago", data_pagamento: "2026-08-09" },
        { id: "BOL-76840", valor: 480.00, vencimento: "2026-07-10", status: "pago", data_pagamento: "2026-07-10" },
        { id: "BOL-76700", valor: 480.00, vencimento: "2026-06-10", status: "pago", data_pagamento: "2026-06-12" }
      ]
    },

    visitas: {
      lista: [
        { id: "OS-3391", tecnico: "Rafael Souza", data: "2026-09-05T14:00:00", status: "agendada", link_os: "https://exemplo-os.com.br/os/3391" },
        { id: "OS-3350", tecnico: "Marina Lopes", data: "2026-08-18T10:00:00", status: "realizada", link_os: "https://exemplo-os.com.br/os/3350" },
        { id: "OS-3288", tecnico: "Rafael Souza", data: "2026-07-22T09:30:00", status: "realizada", link_os: "https://exemplo-os.com.br/os/3288" },
        { id: "OS-3199", tecnico: "Marina Lopes", data: "2026-06-30T13:00:00", status: "realizada", link_os: "https://exemplo-os.com.br/os/3199" }
      ]
    }
  }
];

const ETAPAS_LABEL = {
  levantamento: "Levantamento",
  configuracao: "Configuração",
  migracao_dados: "Migração de dados",
  treinamento: "Treinamento",
  go_live: "Go-live"
};
