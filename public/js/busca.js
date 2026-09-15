const campoBusca = document.getElementById("campo-busca");
const resultados = document.getElementById("resultados");

function somenteDigitos(texto) {
  return (texto || "").toString().replace(/\D/g, "");
}

function formatarCnpj(cnpj) {
  const digitos = somenteDigitos(cnpj);

  if (digitos.length === 14) {
    return digitos.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }

  return cnpj || "CNPJ não informado";
}

async function buscarClientes(termo) {
  if (!termo) return [];

  try {
    const resposta = await fetch(
      `/api/clientes/busca?termo=${encodeURIComponent(termo)}`
    );

    const dados = await resposta.json();

    if (!resposta.ok || !dados.sucesso) {
      console.error("Erro na busca:", dados);
      return [];
    }

    return dados.clientes || [];

  } catch (erro) {
    console.error("Erro ao consultar servidor:", erro);
    return [];
  }
}

function renderResultados(lista, termo) {
  resultados.innerHTML = "";

  if (!termo) return;

  if (!Array.isArray(lista) || lista.length === 0) {
    resultados.innerHTML = `
      <div class="empty-state">
        Nenhum cliente encontrado para "${termo}".
      </div>
    `;
    return;
  }

  // --- FILTRO DE DEDUPLICAÇÃO POR CNPJ/CPF OU ID ---
  const mapUnicos = new Map();

  lista.forEach((cliente) => {
    const documentoLimpo = somenteDigitos(cliente.cnpj || cliente.cpf || cliente.customer_cnpj);
    const chaveUnica = documentoLimpo || cliente.id;

    if (chaveUnica && !mapUnicos.has(chaveUnica)) {
      mapUnicos.set(chaveUnica, cliente);
    }
  });

  const listaUnica = Array.from(mapUnicos.values());
  // ------------------------------------------------

  listaUnica.forEach((cliente) => {
    const card = document.createElement("button");

    card.className = "client-card";

    card.innerHTML = `
      <div>
        <p class="client-card__name">
          ${cliente.nome_fantasia || "Nome não informado"}
        </p>

        <p class="client-card__razao">
          ${cliente.razao_social || "Razão social não informada"}
        </p>

        <p class="client-card__doc">
          CNPJ ${formatarCnpj(cliente.cnpj)}
        </p>
      </div>

      <div class="client-card__go">↗</div>
    `;

    card.addEventListener("click", () => {
      window.location.href =
        `cliente.html?id=${encodeURIComponent(cliente.id)}` +
        `&cnpj=${encodeURIComponent(cliente.cnpj || "")}` +
        `&razao=${encodeURIComponent(cliente.razao_social || cliente.nome_fantasia || "")}`;
    });

    resultados.appendChild(card);
  });
}

let debounce;

campoBusca.addEventListener("input", (e) => {
  clearTimeout(debounce);

  const termo = e.target.value.trim();

  debounce = setTimeout(async () => {
    resultados.innerHTML = `
      <div class="empty-state">
        Buscando cliente...
      </div>
    `;

    const clientes = await buscarClientes(termo);

    renderResultados(clientes, termo);
  }, 300);
});