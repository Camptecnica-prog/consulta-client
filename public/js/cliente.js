/* ============================================================
PÁGINA DE CLIENTE
============================================================ */

const params =
  new URLSearchParams(
    window.location.search
  );

const clienteId =
  params.get("id");

const clienteCnpj =
  params.get("cnpj");

const clienteRazao =
  params.get("razao");

const clientHeader =
  document.getElementById(
    "client-header"
  );

const panelVisitas =
  document.getElementById(
    "panel-visitas"
  );

const panelFinanceiro =
  document.getElementById(
    "panel-financeiro"
  );

const panelTickets =
  document.getElementById(
    "panel-tickets"
  );

const panelImplantacao =
  document.getElementById(
    "panel-implantacao"
  );

// ------------------------------------------------------------
// CONTROLE DO PERÍODO (VISITAS)
// ------------------------------------------------------------

const hoje = new Date();

let mesAtual =
  hoje.getMonth();

let anoAtual =
  hoje.getFullYear();

let periodoPersonalizado = null;

// ------------------------------------------------------------
// CONTROLE DO PERÍODO (TICKETS)
// ------------------------------------------------------------

let mesAtualTickets =
  hoje.getMonth();

let anoAtualTickets =
  hoje.getFullYear();

let periodoPersonalizadoTickets = null;

// Armazenará todos os IDs possíveis encontrados para este CNPJ (resolve cadastros duplicados)
let idsPossiveisCliente = [];

// ------------------------------------------------------------
// UTILIDADES
// ------------------------------------------------------------

function escapeHtml(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatarData(iso) {

  if (!iso) {
    return "—";
  }

  const d =
    new Date(iso);

  if (
    isNaN(
      d.getTime()
    )
  ) {
    return "—";
  }

  return d.toLocaleDateString(
    "pt-BR"
  );

}

function formatarDataHora(iso) {

  if (!iso) {
    return "—";
  }

  const d =
    new Date(iso);

  if (
    isNaN(
      d.getTime()
    )
  ) {
    return "—";
  }

  return `${d.toLocaleDateString(
    "pt-BR"
  )} às ${d.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  )}`;

}

function formatarIntervalo(
  inicioIso,
  fimIso
) {

  if (!inicioIso) {
    return "—";
  }

  const inicio =
    new Date(inicioIso);

  const fim =
    fimIso
      ? new Date(fimIso)
      : new Date();

  if (
    isNaN(inicio.getTime()) ||
    isNaN(fim.getTime())
  ) {
    return "—";
  }

  const ms =
    Math.max(
      0,
      fim - inicio
    );

  const minutos =
    Math.floor(
      ms / 60000
    );

  const horas =
    Math.floor(
      minutos / 60
    );

  const dias =
    Math.floor(
      horas / 24
    );

  if (dias > 0) {

    const horasRestantes =
      horas % 24;

    return horasRestantes > 0
      ? `${dias}d ${horasRestantes}h`
      : `${dias}d`;

  }

  if (horas > 0) {

    return `${horas}h ${minutos % 60}min`;

  }

  return `${minutos}min`;

}

function formatarISO(data) {

  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      data.getDate()
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;

}

function obterPeriodoMes(
  ano,
  mes
) {

  const inicio =
    new Date(
      ano,
      mes,
      1
    );

  const fim =
    new Date(
      ano,
      mes + 1,
      0
    );

  return {

    inicio:
      formatarISO(inicio),

    fim:
      formatarISO(fim)

  };

}

function nomeMes(
  ano,
  mes
) {

  const data =
    new Date(
      ano,
      mes,
      1
    );

  return data.toLocaleDateString(
    "pt-BR",
    {
      month: "long",
      year: "numeric"
    }
  );

}

function mesAnterior() {

  periodoPersonalizado = null;

  mesAtual--;

  if (mesAtual < 0) {

    mesAtual = 11;

    anoAtual--;

  }

  carregarVisitas();

}

function mesAnteriorTickets() {

  periodoPersonalizadoTickets = null;

  mesAtualTickets--;

  if (mesAtualTickets < 0) {

    mesAtualTickets = 11;

    anoAtualTickets--;

  }

  carregarTickets();

}

// ============================================================
// INICIALIZAÇÃO E DESCOBERTA DE IDs DUPLICADOS
// ============================================================

if (!clienteId && !clienteCnpj) {

  clientHeader.innerHTML = `

    <div class="empty-panel">

      Cliente não informado.

      <br><br>

      <a href="index.html">
        Voltar à busca
      </a>

    </div>

  `;

} else {

  renderCabecalho();
  ativarAbas(); 

  // Passo inicial: descobre se há outros cadastros com o mesmo CNPJ para unificar os tickets
  descobrirIdsRelacionados().then(() => {
    carregarVisitas();
    carregarFinanceiro();
    carregarTickets();
    carregarImplantacao();
  });

}

async function descobrirIdsRelacionados() {
  if (clienteId) {
    idsPossiveisCliente.push(String(clienteId).trim());
  }

  // Se houver dados na URL, extrai o CNPJ limpo
  if (!clienteCnpj) return;

  const cnpjLimpo = String(clienteCnpj).replace(/\D/g, "");
  if (!cnpjLimpo) return;

  try {
    // Busca na API de clientes para varrer todos os registros com esse CNPJ
    const resposta = await fetch(`/api/clientes/busca?termo=${encodeURIComponent(clienteCnpj)}`);
    const dados = await resposta.json();

    const lista = Array.isArray(dados) ? dados : (dados.clientes || dados.items || []);
    
    lista.forEach(cli => {
      const cliCnpj = String(cli.cnpj || cli.customer_cnpj || "").replace(/\D/g, "");
      const cliId = String(cli.id || cli.cliente_id || "").trim();
      const cliCodigoExterno = String(cli.codigo_externo || cli.external_id || "").trim();

      // Se o CNPJ bater, adiciona o ID e qualquer ID alternativo/externo à lista
      if (cliCnpj === cnpjLimpo) {
        if (cliId && !idsPossiveisCliente.includes(cliId)) {
          idsPossiveisCliente.push(cliId);
        }
        if (cliCodigoExterno && !idsPossiveisCliente.includes(cliCodigoExterno)) {
          idsPossiveisCliente.push(cliCodigoExterno);
        }
      }
    });

    // Forçamos também a busca direta pelo CNPJ no endpoint de tickets, caso o Zonki aceite busca textual
    idsPossiveisCliente.push(cnpjLimpo);

  } catch (e) {
    console.warn("Aviso ao buscar IDs relacionados:", e);
  }
}
// ------------------------------------------------------------
// CABEÇALHO
// ------------------------------------------------------------

function renderCabecalho() {

  clientHeader.innerHTML = `

    <a
      href="index.html"
      class="client-header__back"
    >
      ← Voltar à busca
    </a>

    <div class="client-header__top">

      <div>

        <h1>
          ${escapeHtml(
            clienteRazao ||
            "Cliente"
          )}
        </h1>

      </div>

    </div>

  `;

}

// ============================================================
// CARREGAR FINANCEIRO
// ============================================================

async function carregarFinanceiro() {

  if (!panelFinanceiro) {
    return;
  }

  if (!clienteCnpj) {

    panelFinanceiro.innerHTML = `

      <div class="empty-panel">

        CNPJ do cliente não informado.

      </div>

    `;

    return;

  }

  panelFinanceiro.innerHTML = `

    <div class="empty-panel">

      Carregando financeiro...

    </div>

  `;

  try {

    const resposta =
      await fetch(
        `/api/financeiro/${encodeURIComponent(clienteCnpj)}`
      );

    const dados =
      await resposta.json();

    if (
      !resposta.ok ||
      !dados.sucesso
    ) {

      throw new Error(
        dados.erro ||
        "Erro ao carregar financeiro."
      );

    }

    renderFinanceiro(dados);

  } catch (erro) {

    console.error(
      "Erro ao carregar financeiro:",
      erro
    );

    panelFinanceiro.innerHTML = `

      <div class="empty-panel">

        Não foi possível carregar
        as informações financeiras.

        <br><br>

        ${escapeHtml(
          erro.message
        )}

        <br><br>

        <button
          type="button"
          onclick="carregarFinanceiro()"
        >
          Tentar novamente
        </button>

      </div>

    `;

  }

}

function renderFinanceiro(dados) {

  const boletos =
    Array.isArray(
      dados.boletos
    )
      ? dados.boletos
      : [];

  let html = `

    <div style="
      margin-bottom:24px;
    ">

      <p
        class="area-panel__section-title"
        style="margin-bottom:4px;"
      >
        Financeiro
      </p>

      <span style="
        color:#666;
      ">
        Boletos em aberto
      </span>

    </div>

  `;

  if (boletos.length === 0) {

    html += `

      <div class="empty-panel">

        Nenhum boleto em aberto.

      </div>

    `;

    panelFinanceiro.innerHTML =
      html;

    return;

  }

  html += `

    <div class="record-list">

      ${boletos
        .map(cardFinanceiro)
        .join("")}

    </div>

  `;

  panelFinanceiro.innerHTML =
    html;

}

function cardFinanceiro(boleto) {

  const numero =
    boleto.numero_boleto ||
    boleto.numero_documento ||
    boleto.codigo_lancamento ||
    boleto.numero ||
    "—";

  const vencimento =
    boleto.data_vencimento ||
    boleto.vencimento ||
    "—";

  const parcela =
    boleto.parcela
      ? `Parcela ${boleto.parcela}`
      : "";

  const valor =
    boleto.valor_documento ??
    boleto.valor_titulo ??
    boleto.valor ??
    boleto.valor_aberto;

  return `

    <div class="record-card">

      <div class="record-card__main">

        <p class="record-card__title">

          Boleto ${escapeHtml(numero)}

        </p>

        <div class="record-card__meta">

          <span>

            Vencimento:

            <strong>
              ${escapeHtml(
                formatarDataFinanceiro(
                  vencimento
                )
              )}
            </strong>

          </span>

          ${
            parcela
              ? `
                <span>
                  ${escapeHtml(parcela)}
                </span>
              `
              : ""
          }

          ${
            valor !== undefined &&
            valor !== null &&
            valor !== ""
              ? `
                <span>

                  Valor:

                  <strong>
                    ${formatarValorFinanceiro(valor)}
                  </strong>

                </span>
              `
              : ""
          }

        </div>

      </div>

      <div class="record-card__side">

        <span
          class="status-pill status-pill--aberto"
        >
          Em aberto
        </span>

      </div>

    </div>

  `;

}

function formatarDataFinanceiro(data) {

  if (!data) {
    return "—";
  }

  if (typeof data === "string" && data.includes("-")) {
    const partes = data.split("T")[0].split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
  }

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(data)
  ) {

    return data;

  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {

    const [
      ano,
      mes,
      dia
  ] = data.split("-");

    return `${dia}/${mes}/${ano}`;

  }

  return data;

}

function formatarValorFinanceiro(valor) {

  const numero =
    Number(
      String(valor)
        .replace(",", ".")
    );

  if (
    !Number.isFinite(numero)
  ) {

    return escapeHtml(valor);

  }

  return numero.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}

// ============================================================
// CARREGAR TICKETS ZONKI (VALIDANDO TODOS OS IDs E CNPJ)
// ============================================================

async function carregarTickets() {

  if (!panelTickets) {
    return;
  }

  if (!clienteCnpj && !clienteId) {

    panelTickets.innerHTML = `

      <div class="empty-panel">

        Identificação do cliente não informada.

      </div>

    `;

    return;

  }

  let periodo;
  let tituloPeriodo;

  if (periodoPersonalizadoTickets) {
    periodo = periodoPersonalizadoTickets;
    tituloPeriodo = `${formatarData(periodo.inicio + "T00:00:00")} até ${formatarData(periodo.fim + "T00:00:00")}`;
  } else {
    periodo = obterPeriodoMes(anoAtualTickets, mesAtualTickets);
    tituloPeriodo = nomeMes(anoAtualTickets, mesAtualTickets);
  }

  panelTickets.innerHTML = `

    <div class="empty-panel">

      Carregando tickets de <strong>${escapeHtml(tituloPeriodo)}</strong>...

    </div>

  `;

  try {
    // Tenta buscar por CNPJ primariamente para capturar dados importados de outros sistemas
    let url = `/api/tickets/${encodeURIComponent(clienteCnpj || clienteId)}` +
      `?startDate=${encodeURIComponent(periodo.inicio)}` +
      `&endDate=${encodeURIComponent(periodo.fim)}`;

    let resposta = await fetch(url);
    let dados = await resposta.json();

    // Se falhar com CNPJ, tenta com o ID
    if ((!resposta.ok || !dados.sucesso || !dados.tickets) && clienteId && clienteId !== clienteCnpj) {
      url = `/api/tickets/${encodeURIComponent(clienteId)}` +
        `?startDate=${encodeURIComponent(periodo.inicio)}` +
        `&endDate=${encodeURIComponent(periodo.fim)}`;
      resposta = await fetch(url);
      dados = await resposta.json();
    }

    if (
      !resposta.ok ||
      !dados.sucesso
    ) {

      throw new Error(
        dados.erro ||
        "Erro ao carregar tickets."
      );

    }

    renderTickets(dados);

  } catch (erro) {

    console.error(
      "Erro ao carregar tickets:",
      erro
    );

    panelTickets.innerHTML = `

      <div class="empty-panel">

        Não foi possível carregar
        os tickets.

        <br><br>

        ${escapeHtml(
          erro.message
        )}

        <br><br>

        <button
          type="button"
          onclick="carregarTickets()"
        >
          Tentar novamente
        </button>

      </div>

    `;

  }

}

function filtrarTicketsPorCliente(todosTickets) {
  const cnpjBuscaLimpo = String(clienteCnpj || "").replace(/\D/g, "");

  return todosTickets.filter(ticket => {
    const numeroTicket = String(ticket.number || "").trim();

    if (numeroTicket === "TK2026003644") {
      return false;
    }

    const ticketCustomerId = String(ticket.customerId || ticket.customer_id || ticket.cliente_id || "").trim();
    const cnpjDoTicket = String(ticket.customer?.cnpj || ticket.cnpj || ticket.customer_cnpj || ticket.customerCnpj || "").replace(/\D/g, "");

    // Verifica se bate com QUALQUER um dos IDs duplicados encontrados ou com o CNPJ
    if (ticketCustomerId && idsPossiveisCliente.includes(ticketCustomerId)) {
      return true;
    }

    if (cnpjBuscaLimpo && cnpjDoTicket && cnpjDoTicket === cnpjBuscaLimpo) {
      return true;
    }

    if (!ticketCustomerId && !cnpjDoTicket) {
      return true;
    }

    return false;
  });
}

// ============================================================
// RENDER TICKETS (SUPORTE TÉCNICO)
// ============================================================

function renderTickets(dados) {

  if (!panelTickets) {
    return;
  }

  const todosTickets = Array.isArray(dados.tickets) ? dados.tickets : [];

  const ticketsDoCliente = filtrarTicketsPorCliente(todosTickets).filter(ticket => {
    const tags = Array.isArray(ticket.tags) ? ticket.tags : [];
    const temTagImplantacao = tags.some(tag => {
      const t = String(tag).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return t.includes("implantacao");
    });
    return !temTagImplantacao;
  });

  const abertas = ticketsDoCliente.filter(ticket => {
    const statusBruto = String(
      ticket.status?.slug || 
      ticket.status?.name || 
      ticket.statusCode || 
      ticket.status || 
      ""
    ).trim().toLowerCase();
    
    const fechado = statusBruto === "closed" || statusBruto === "close" || statusBruto === "resolved" || statusBruto === "resolvido" || statusBruto === "fechado";
    return !fechado;
  });

  const fechadas = ticketsDoCliente.filter(ticket => {
    const statusBruto = String(
      ticket.status?.slug || 
      ticket.status?.name || 
      ticket.statusCode || 
      ticket.status || 
      ""
    ).trim().toLowerCase();
    
    const fechado = statusBruto === "closed" || statusBruto === "close" || statusBruto === "resolved" || statusBruto === "resolvido" || statusBruto === "fechado";
    return fechado;
  });

  let tituloPeriodo;
  if (periodoPersonalizadoTickets) {
    tituloPeriodo = `${formatarData(periodoPersonalizadoTickets.inicio + "T00:00:00")} até ${formatarData(periodoPersonalizadoTickets.fim + "T00:00:00")}`;
  } else {
    tituloPeriodo = nomeMes(anoAtualTickets, mesAtualTickets);
  }

  let html = `

    <div
      style="
        display:flex;
        align-items:flex-end;
        justify-content:space-between;
        gap:16px;
        margin-bottom:24px;
        flex-wrap:wrap;
      "
    >

      <div>

        <p
          class="area-panel__section-title"
          style="margin-bottom:4px;"
        >
          Suporte técnico
        </p>

        <span
          style="
            color:#666;
            text-transform:capitalize;
          "
        >
          ${escapeHtml(tituloPeriodo)}
        </span>

      </div>

      <div
        style="
          display:flex;
          align-items:flex-end;
          gap:8px;
          flex-wrap:wrap;
        "
      >

        <div
          style="
            display:flex;
            flex-direction:column;
            gap:5px;
          "
        >

          <label
            for="filtro-data-inicio-tickets"
            style="
              font-size:12px;
              color:#666;
            "
          >
            Data inicial
          </label>

          <input
            type="date"
            id="filtro-data-inicio-tickets"
            value="${periodoPersonalizadoTickets?.inicio || ""}"
            style="
              padding:9px 10px;
              border:1px solid #ddd;
              border-radius:8px;
              background:#fff;
            "
          >

        </div>

        <div
          style="
            display:flex;
            flex-direction:column;
            gap:5px;
          "
        >

          <label
            for="filtro-data-fim-tickets"
            style="
              font-size:12px;
              color:#666;
            "
          >
            Data final
          </label>

          <input
            type="date"
            id="filtro-data-fim-tickets"
            value="${periodoPersonalizadoTickets?.fim || ""}"
            style="
              padding:9px 10px;
              border:1px solid #ddd;
              border-radius:8px;
              background:#fff;
            "
          >

        </div>

        <button
          type="button"
          onclick="filtrarPorDataTickets()"
          style="
            padding:10px 16px;
            border:1px solid #222;
            border-radius:8px;
            background:#222;
            color:#fff;
            cursor:pointer;
          "
        >
          Filtrar
        </button>

        <button
          type="button"
          onclick="voltarMesAtualTickets()"
          style="
            padding:10px 16px;
            border:1px solid #ddd;
            border-radius:8px;
            background:#fff;
            cursor:pointer;
          "
        >
          Mês atual
        </button>

      </div>

    </div>

  `;

  // ABERTOS
  html += `

    <p class="area-panel__section-title">

      Em aberto (${abertas.length})

    </p>

  `;

  if (abertas.length > 0) {

    html += `

      <div class="record-list">

        ${abertas
          .map(cardTicket)
          .join("")}

      </div>

    `;

  } else {

    html += `

      <div class="empty-panel">

        Nenhum ticket em aberto para este período.

      </div>

    `;

  }

  // FECHADOS
  html += `

    <p
      class="area-panel__section-title"
      style="margin-top:32px;"
    >

      Fechados (${fechadas.length})

    </p>

  `;

  if (fechadas.length > 0) {

    html += `

      <div class="record-list">

        ${fechadas
          .map(cardTicket)
          .join("")}

      </div>

    `;

  } else {

    html += `

      <div class="empty-panel">

        Nenhum ticket fechado para este período.

      </div>

    `;

  }

  // BOTÃO CARREGAR MAIS
  html += `

    <div
      style="
        display:flex;
        justify-content:center;
        margin:32px 0 10px;
      "
    >

      <button
        type="button"
        onclick="mesAnteriorTickets()"
        style="
          padding:12px 24px;
          border:1px solid #ddd;
          border-radius:8px;
          background:#fff;
          cursor:pointer;
          font-size:14px;
        "
      >
        Carregar mais
      </button>

    </div>

  `;

  panelTickets.innerHTML = html;

}

// ============================================================
// CARREGAR E RENDERIZAR IMPLANTAÇÃO (INDEPENDENTE DE DATA)
// ============================================================

async function carregarImplantacao() {
  if (!panelImplantacao) return;

  if (!clienteCnpj && !clienteId) {
    panelImplantacao.innerHTML = `<div class="empty-panel">Identificação do cliente não informada.</div>`;
    return;
  }

  panelImplantacao.innerHTML = `<div class="empty-panel">Carregando dados de implantação...</div>`;

  try {
    let url = `/api/tickets/${encodeURIComponent(clienteCnpj || clienteId)}`;
    let resposta = await fetch(url);
    let dados = await resposta.json();

    if ((!resposta.ok || !dados.sucesso || !dados.tickets) && clienteId && clienteId !== clienteCnpj) {
      url = `/api/tickets/${encodeURIComponent(clienteId)}`;
      resposta = await fetch(url);
      dados = await resposta.json();
    }

    if (!resposta.ok || !dados.sucesso) {
      throw new Error(dados.erro || "Erro ao carregar implantação.");
    }

    renderImplantacao(dados);
  } catch (erro) {
    console.error("Erro ao carregar implantação:", erro);
    panelImplantacao.innerHTML = `
      <div class="empty-panel">
        Não foi possível carregar os dados de implantação.<br><br>
        ${escapeHtml(erro.message)}
      </div>
    `;
  }
}

function renderImplantacao(dados) {
  if (!panelImplantacao) return;

  const todosTickets = Array.isArray(dados.tickets) ? dados.tickets : [];

  const ticketsImplantacao = filtrarTicketsPorCliente(todosTickets).filter(ticket => {
    const tags = Array.isArray(ticket.tags) ? ticket.tags : [];
    return tags.some(tag => {
      const t = String(tag).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return t.includes("implantacao");
    });
  });

  const abertas = ticketsImplantacao.filter(ticket => {
    const statusBruto = String(
      ticket.status?.slug || 
      ticket.status?.name || 
      ticket.statusCode || 
      ticket.status || 
      ""
    ).trim().toLowerCase();
    
    const fechado = statusBruto === "closed" || statusBruto === "close" || statusBruto === "resolved" || statusBruto === "resolvido" || statusBruto === "fechado";
    return !fechado;
  });

  const fechadas = ticketsImplantacao.filter(ticket => {
    const statusBruto = String(
      ticket.status?.slug || 
      ticket.status?.name || 
      ticket.statusCode || 
      ticket.status || 
      ""
    ).trim().toLowerCase();
    
    const fechado = statusBruto === "closed" || statusBruto === "close" || statusBruto === "resolved" || statusBruto === "resolvido" || statusBruto === "fechado";
    return fechado;
  });

  let html = `
    <div style="margin-bottom:24px;">
      <p class="area-panel__section-title" style="margin-bottom:4px;">Implantação</p>
      <span style="color:#666;">Histórico completo</span>
    </div>
  `;

  html += `<p class="area-panel__section-title">Em aberto (${abertas.length})</p>`;
  if (abertas.length > 0) {
    html += `<div class="record-list">${abertas.map(cardTicket).join("")}</div>`;
  } else {
    html += `<div class="empty-panel">Nenhum ticket de implantação em aberto.</div>`;
  }

  html += `<p class="area-panel__section-title" style="margin-top:32px;">Fechados (${fechadas.length})</p>`;
  if (fechadas.length > 0) {
    html += `<div class="record-list">${fechadas.map(cardTicket).join("")}</div>`;
  } else {
    html += `<div class="empty-panel">Nenhum ticket de implantação fechado.</div>`;
  }

  panelImplantacao.innerHTML = html;
}

// ============================================================
// CARD DO TICKET
// ============================================================
// ============================================================
// CARD DO TICKET
// ============================================================
// ============================================================
// CARD DO TICKET
// ============================================================
function cardTicket(ticket) {

  // LOG DE DIAGNÓSTICO: Abra o F12 do navegador e veja o JSON deste ticket no console
  console.log("Dados do Ticket no Card:", ticket);

  const statusBruto = String(
    ticket.status?.slug || 
    ticket.status?.name || 
    ticket.statusCode || 
    ticket.status || 
    ""
  ).trim().toLowerCase();

  const fechado =
    statusBruto === "closed" ||
    statusBruto === "close" ||
    statusBruto === "resolved" ||
    statusBruto === "resolvido" ||
    statusBruto === "fechado";

  const statusClasse =
    fechado
      ? "status-pill--fechado"
      : "status-pill--aberto";

  const mapaStatus = {
    resolved: "Resolvido",
    closed: "Fechado",
    close: "Fechado",
    in_progress: "Em andamento",
    open: "Aberto",
    pending: "Pendente",
    waiting_customer: "Aguardando cliente",
    waiting_third_party: "Aguardando terceiros",
    canceled: "Cancelado",
    cancelled: "Cancelado"
  };

  const statusTextoAmigavel = mapaStatus[statusBruto] || ticket.status?.name || (fechado ? "Fechado" : "Em atendimento");

  const numero =
    ticket.number ||
    "Ticket sem número";

  const assunto =
    ticket.subject ||
    "Sem assunto";

  const tags =
    Array.isArray(ticket.tags)
      ? ticket.tags
      : [];

  const dataCriacao = ticket.created_at || ticket.createdAt || ticket.data_criacao;
  
  const dataFechamento = 
    ticket.closed_at || 
    ticket.closedAt || 
    ticket.finished_at || 
    ticket.finishedAt || 
    ticket.done_at || 
    ticket.doneAt || 
    ticket.resolved_at || 
    ticket.resolvedAt || 
    ticket.ended_at || 
    ticket.endedAt || 
    ticket.completion_date || 
    ticket.data_fechamento || 
    ticket.updated_at || 
    ticket.updatedAt;

  // ------------------------------------------------------------
  // EXTRAÇÃO AMPLIADA DO RESPONSÁVEL / TÉCNICO
  // ------------------------------------------------------------
  let nomeResponsavel = "";

  // 1. Tenta pegar de objetos diretos de responsável/atendente
  if (ticket.assignee) {
    if (typeof ticket.assignee === "object") nomeResponsavel = ticket.assignee.name || ticket.assignee.nome || "";
    else if (typeof ticket.assignee === "string") nomeResponsavel = ticket.assignee;
  }

  if (!nomeResponsavel && ticket.agent) {
    if (typeof ticket.agent === "object") nomeResponsavel = ticket.agent.name || ticket.agent.nome || "";
    else if (typeof ticket.agent === "string") nomeResponsavel = ticket.agent;
  }

  if (!nomeResponsavel && ticket.user) {
    if (typeof ticket.user === "object") nomeResponsavel = ticket.user.name || ticket.user.nome || "";
    else if (typeof ticket.user === "string") nomeResponsavel = ticket.user;
  }

  if (!nomeResponsavel && ticket.owner) {
    if (typeof ticket.owner === "object") nomeResponsavel = ticket.owner.name || ticket.owner.nome || "";
    else if (typeof ticket.owner === "string") nomeResponsavel = ticket.owner;
  }

  // 2. Tenta propriedades em formato string de técnico/agente
  if (!nomeResponsavel) {
    nomeResponsavel = ticket.technicianName || ticket.agentName || ticket.userName || ticket.ownerName || "";
  }

  // 3. Tenta última mensagem / interações
  if (!nomeResponsavel) {
    const ultimaMensagem = ticket.last_message || ticket.lastMessage;
    if (ultimaMensagem && typeof ultimaMensagem === "object") {
      nomeResponsavel = ultimaMensagem.user?.name || ultimaMensagem.author?.name || ultimaMensagem.sender?.name || "";
    }
  }

  if (!nomeResponsavel) {
    const listaMensagens = ticket.messages || ticket.mensagens || ticket.interactions || ticket.comments;
    if (Array.isArray(listaMensagens) && listaMensagens.length > 0) {
      const ultima = listaMensagens[listaMensagens.length - 1];
      if (ultima && typeof ultima === "object") {
        nomeResponsavel = ultima.user?.name || ultima.author?.name || ultima.sender?.name || "";
      }
    }
  }

  let infoResolucaoHtml = "";

  if (fechado && dataFechamento) {
    infoResolucaoHtml += `
      <span>
        Encerrado em:
        <strong>${formatarDataHora(dataFechamento)}</strong>
      </span>
    `;

    if (dataCriacao) {
      const tempoTotal = formatarIntervalo(dataCriacao, dataFechamento);
      if (tempoTotal && tempoTotal !== "—") {
        infoResolucaoHtml += `
          <span>
            Tempo de resolução:
            <strong>${escapeHtml(tempoTotal)}</strong>
          </span>
        `;
      }
    }
  }

  return `

    <div
      class="record-card"
      style="
        align-items:flex-start;
      "
    >

      <div class="record-card__main">

        <p
          class="record-card__title"
          style="margin-bottom:6px;"
        >

          ${escapeHtml(numero)}

        </p>

        <p
          style="
            margin:0 0 14px;
            font-size:15px;
            font-weight:500;
            line-height:1.5;
          "
        >

          ${escapeHtml(assunto)}

        </p>

        <div
          class="record-card__meta"
          style="
            display:flex;
            flex-direction:column;
            gap:7px;
          "
        >

          ${
            dataCriacao
              ? `
                <span>

                  Criado em:

                  <strong>
                    ${formatarDataHora(dataCriacao)}
                  </strong>

                </span>
              `
              : ""
          }

          ${infoResolucaoHtml}

          ${
            nomeResponsavel && nomeResponsavel !== "Não atribuído"
              ? `
                <span>
                  Responsável:
                  <strong>
                    ${escapeHtml(nomeResponsavel)}
                  </strong>
                </span>
              `
              : ""
          }

        </div>

        ${
          tags.length > 0
            ? `

              <div
                style="
                  display:flex;
                  flex-wrap:wrap;
                  gap:6px;
                  margin-top:16px;
                "
              >

                ${tags
                  .map(
                    (tag) => `

                      <span
                        style="
                          display:inline-flex;
                          align-items:center;
                          padding:5px 9px;
                          border-radius:999px;
                          background:#f1f3f5;
                          color:#495057;
                          font-size:12px;
                          border:1px solid #e5e7eb;
                        "
                      >

                        ${escapeHtml(tag)}

                      </span>

                  `
                )
                .join("")}

            </div>

          `
          : ""
        }

      </div>

      <div
        class="record-card__side"
        style="min-width:140px; text-align:right;"
      >

        <span
          class="status-pill ${statusClasse}"
        >

          ${escapeHtml(statusTextoAmigavel)}

        </span>

      </div>

    </div>

  `;

}

function filtrarPorDataTickets() {

  const dataInicio =
    document.getElementById(
      "filtro-data-inicio-tickets"
    )?.value;

  const dataFim =
    document.getElementById(
      "filtro-data-fim-tickets"
    )?.value;

  if (
    !dataInicio ||
    !dataFim
  ) {

    alert(
      "Informe a data inicial e a data final."
    );

    return;

  }

  if (
    dataInicio > dataFim
  ) {

    alert(
      "A data inicial não pode ser maior que a data final."
    );

    return;

  }

  periodoPersonalizadoTickets = {

    inicio:
      dataInicio,

    fim:
      dataFim

  };

  carregarTickets();

}

function voltarMesAtualTickets() {

  const agora =
    new Date();

  mesAtualTickets =
    agora.getMonth();

  anoAtualTickets =
    agora.getFullYear();

  periodoPersonalizadoTickets =
    null;

  carregarTickets();

}

function voltarMesAtual() {

  const agora =
    new Date();

  mesAtual =
    agora.getMonth();

  anoAtual =
    agora.getFullYear();

  periodoPersonalizado =
    null;

  carregarVisitas();

}

function filtrarPorData() {

  const dataInicio =
    document.getElementById(
      "filtro-data-inicio"
    )?.value;

  const dataFim =
    document.getElementById(
      "filtro-data-fim"
    )?.value;

  if (
    !dataInicio ||
    !dataFim
  ) {

    alert(
      "Informe a data inicial e a data final."
    );

    return;

  }

  if (
    dataInicio > dataFim
  ) {

    alert(
      "A data inicial não pode ser maior que a data final."
    );

    return;

  }

  periodoPersonalizado = {

    inicio:
      dataInicio,

    fim:
      dataFim

  };

  carregarVisitas();

}

async function carregarVisitas() {

  if (!panelVisitas) {
    return;
  }

  let periodo;

  let tituloPeriodo;

  if (periodoPersonalizado) {

    periodo =
      periodoPersonalizado;

    tituloPeriodo =
      `${formatarData(
        periodo.inicio +
        "T00:00:00"
      )} até ${formatarData(
        periodo.fim +
        "T00:00:00"
      )}`;

  } else {

    periodo =
      obterPeriodoMes(
        anoAtual,
        mesAtual
      );

    tituloPeriodo =
      nomeMes(
        anoAtual,
        mesAtual
      );

  }

  panelVisitas.innerHTML = `

    <div class="empty-panel">

      Carregando O.S. de

      <strong>
        ${escapeHtml(tituloPeriodo)}
      </strong>...

    </div>

  `;

  try {

    const url =
      `/api/visitas-tecnicas/${encodeURIComponent(clienteId)}` +
      `?data_inicio=${encodeURIComponent(periodo.inicio)}` +
      `&data_fim=${encodeURIComponent(periodo.fim)}`;

    const resposta =
      await fetch(url);

    const dados =
      await resposta.json();

    if (
      !resposta.ok ||
      !dados.sucesso
    ) {

      throw new Error(
        dados.erro ||
        "Erro ao carregar visitas."
      );

    }

    renderVisitas(dados);

  } catch (erro) {

    console.error(
      "Erro:",
      erro
    );

    panelVisitas.innerHTML = `

      <div class="empty-panel">

        Não foi possível carregar
        as O.S.

        <br><br>

        ${escapeHtml(
          erro.message
        )}

        <br><br>

        <button
          type="button"
          onclick="carregarVisitas()"
        >
          Tentar novamente
        </button>

      </div>

    `;

  }

}

function cardVisita(os) {

  const atividade =
    os.atividade || null;

  const fechada =
    os.situacao === "FECHADA";

  const statusTexto =
    fechada
      ? "Encerrada"
      : "Em aberto";

  const statusClasse =
    fechada
      ? "status-pill--fechado"
      : "status-pill--aberto";

  let tempo = "";

  if (atividade) {

    if (
      atividade.inicio &&
      atividade.conclusao
    ) {

      tempo =
        `levou ${formatarIntervalo(
          atividade.inicio,
          atividade.conclusao
        )}`;

    } else if (
      atividade.inicio
    ) {

      tempo =
        `em atendimento há ${formatarIntervalo(
          atividade.inicio
        )}`;

    } else {

      tempo =
        "Aguardando atendimento";

    }

  }

  return `

    <div class="record-card">

      <div class="record-card__main">

        <p class="record-card__title">

          ${escapeHtml(
            os.numero ||
            "O.S. sem número"
          )}

        </p>

        <div class="record-card__meta">

          <span class="mono">
            ${escapeHtml(
              os.id || "—"
            )}
          </span>

          <span>

            Aberta em

            ${formatarDataHora(
              os.criado_em
            )}

          </span>

          ${
            os.atualizado_em
              ? `
                <span>

                  Atualizada em

                  ${formatarDataHora(
                    os.atualizado_em
                  )}

                </span>
              `
              : ""
          }

        </div>

        <p style="
          margin-top:10px;
          line-height:1.5;
          white-space:pre-line;
        ">

          ${escapeHtml(
            os.problema ||
            "Sem descrição"
          )}

        </p>

      </div>

      <div class="record-card__side">

        <span
          class="status-pill ${statusClasse}"
        >

          ${escapeHtml(statusTexto)}

        </span>

        ${
          tempo
            ? `
              <span class="duration-note">
                ${escapeHtml(tempo)}
              </span>
            `
            : ""
        }

        ${
          os.link_os
            ? `
              <a
                class="os-link"
                href="${escapeHtml(os.link_os)}"
                target="_blank"
                rel="noopener"
              >
                Ver O.S ↗
              </a>
            `
            : ""
        }

      </div>

    </div>

  `;

}

function renderVisitas(dados) {

  const abertas =
    Array.isArray(
      dados.abertas?.items
    )
      ? dados.abertas.items
      : [];

  const fechadas =
    Array.isArray(
      dados.fechadas?.items
    )
      ? dados.fechadas.items
      : [];

  let html = "";

  let tituloPeriodo;

  if (periodoPersonalizado) {

    tituloPeriodo =
      `${formatarData(
        periodoPersonalizado.inicio +
        "T00:00:00"
      )} até ${formatarData(
        periodoPersonalizado.fim +
        "T00:00:00"
      )}`;

  } else {

    tituloPeriodo =
      nomeMes(
        anoAtual,
        mesAtual
      );

  }

  html += `

    <div
      style="
        display:flex;
        align-items:flex-end;
        justify-content:space-between;
        gap:16px;
        margin-bottom:24px;
        flex-wrap:wrap;
      "
    >

      <div>

        <p
          class="area-panel__section-title"
          style="margin-bottom:4px;"
        >
          Visitas técnicas
        </p>

        <span
          style="
            color:#666;
            text-transform:capitalize;
          "
        >

          ${escapeHtml(
            tituloPeriodo
          )}

        </span>

      </div>

      <div
        style="
          display:flex;
          align-items:flex-end;
          gap:8px;
          flex-wrap:wrap;
        "
      >

        <div
          style="
            display:flex;
            flex-direction:column;
            gap:5px;
          "
        >

          <label
            for="filtro-data-inicio"
            style="
              font-size:12px;
              color:#666;
            "
          >
            Data inicial
          </label>

          <input
            type="date"
            id="filtro-data-inicio"
            value="${periodoPersonalizado?.inicio || ""}"
            style="
              padding:9px 10px;
              border:1px solid #ddd;
              border-radius:8px;
              background:#fff;
            "
          >

        </div>

        <div
          style="
            display:flex;
            flex-direction:column;
            gap:5px;
          "
        >

          <label
            for="filtro-data-fim"
            style="
              font-size:12px;
              color:#666;
            "
          >
            Data final
          </label>

          <input
            type="date"
            id="filtro-data-fim"
            value="${periodoPersonalizado?.fim || ""}"
            style="
              padding:9px 10px;
              border:1px solid #ddd;
              border-radius:8px;
              background:#fff;
            "
          >

        </div>

        <button
          type="button"
          onclick="filtrarPorData()"
          style="
            padding:10px 16px;
            border:1px solid #222;
            border-radius:8px;
            background:#222;
            color:#fff;
            cursor:pointer;
          "
        >
          Filtrar
        </button>

        <button
          type="button"
          onclick="voltarMesAtual()"
          style="
            padding:10px 16px;
            border:1px solid #ddd;
            border-radius:8px;
            background:#fff;
            cursor:pointer;
          "
        >
          Mês atual
        </button>

      </div>

    </div>

  `;

  html += `

    <p class="area-panel__section-title">

      Em aberto (${abertas.length})

    </p>

  `;

  if (abertas.length) {

    html += `

      <div class="record-list">

        ${abertas
          .map(cardVisita)
          .join("")}

      </div>

    `;

  } else {

    html += `

      <div class="empty-panel">

        Nenhuma O.S. em aberto
        neste período.

      </div>

    `;

  }

  html += `

    <p class="area-panel__section-title">

      Encerradas (${fechadas.length})

    </p>

  `;

  if (fechadas.length) {

    html += `

      <div class="record-list">

        ${fechadas
          .map(cardVisita)
          .join("")}

      </div>

    `;

  } else {

    html += `

      <div class="empty-panel">

        Nenhuma O.S. encerrada
        neste período.

      </div>

    `;

  }

  html += `

    <div
      style="
        display:flex;
        justify-content:center;
        margin:32px 0 10px;
      "
    >

      <button
        type="button"
        onclick="mesAnterior()"
        style="
          padding:12px 24px;
          border:1px solid #ddd;
          border-radius:8px;
          background:#fff;
          cursor:pointer;
          font-size:14px;
        "
      >
        Carregar mais
      </button>

    </div>

  `;

  panelVisitas.innerHTML =
    html;

}

function ativarAbas() {

  const tabs =
    document.querySelectorAll(
      ".area-tab"
    );

  tabs.forEach((tab) => {

    tab.addEventListener(
      "click",
      () => {

        tabs.forEach((t) =>
          t.classList.remove(
            "is-active"
          )
        );

        document
          .querySelectorAll(
            ".area-panel"
          )
          .forEach((p) =>
            p.classList.remove(
              "is-active"
            )
          );

        tab.classList.add(
          "is-active"
        );

        const area =
          tab.dataset.area;

        const panel =
          document.getElementById(
            `panel-${area}`
          );

        if (panel) {

          panel.classList.add(
            "is-active"
          );

        }

      }
    );

  });

}