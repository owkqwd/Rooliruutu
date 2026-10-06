/**
 * ROOLIRUUTU - KEVYT JAVASCRIPT (3-SIVUINEN SOVELLUS)
 * Puhdas vanilla JS ilman riippuvuuksia tai kehyksiä.
 * Hoitaa sivujen vaihdon, työtilan hallinnan, säännöt, roolit ja tehtävätaulun.
 */

// Oletustiedot
const DEFAULT_WORKSPACE = {
  isJoined: true,
  name: "Digipalveluiden kehitysprojekti",
  code: "ROOLI-8492"
};

const DEFAULT_RULES = [
  {
    id: "r1",
    category: "Viestintä",
    title: "Vastausaika 24h & nopea kuittaus",
    description: "Vastaamme tiimin viesteihin arkisin 24 tunnin kuluessa. Lyhytkin kuittaus riittää tiedoksi siitä, että asia on huomioitu."
  },
  {
    id: "r2",
    category: "Aikataulut",
    title: "Deadlinet ja ennakkotiedotus",
    description: "Sitoudumme sovittuihin välitavoitteisiin. Jos eteen tulee viivästys, ilmoitamme siitä tiimille vähintään 24 tuntia ennen deadlinea."
  },
  {
    id: "r3",
    category: "Laatu",
    title: "Yhteinen laadunvalvonta",
    description: "Kaikki palautettavat tuotokset katselmoidaan vähintään yhden toisen tiimiläisen toimesta ennen lopullista palautusta opettajalle."
  },
  {
    id: "r4",
    category: "Ilmapiiri",
    title: "Kunnioitus ja rakentava palaute",
    description: "Annamme palautetta asioista, emme henkilöistä. Jokainen saa tuoda ideoita esille ja kysyä apua matalalla kynnyksellä."
  }
];

const DEFAULT_ROLES = [
  {
    id: "m1",
    name: "Sara Virtanen",
    roleTitle: "Projektipäällikkö",
    responsibilities: "Valvoo projektin kokonaiskuvaa, aikatauluja ja välitavoitteita. Kutsuu tiimin koolle viikkopalavereihin."
  },
  {
    id: "m2",
    name: "Matti Korhonen",
    roleTitle: "UI-suunnittelija",
    responsibilities: "Vastaa käyttöliittymäluonnoksista, visuaalisesta ilmeestä ja käyttökokemuksen sujuvuudesta."
  },
  {
    id: "m3",
    name: "Juho Nieminen",
    roleTitle: "Tekninen toteuttaja",
    responsibilities: "Vastaa teknisestä arkkitehtuurista, koodin laadusta ja toteutuksen toimivuudesta."
  },
  {
    id: "m4",
    name: "Sofia Mäkelä",
    roleTitle: "Viestintävastaava",
    responsibilities: "Hoitaa tiimin sisäisen viestinnän selkeyden ja huolehtii yhteydenpidosta kurssin opettajaan."
  },
  {
    id: "m5",
    name: "Alex Laine",
    roleTitle: "Laadunvarmistaja",
    responsibilities: "Tarkistaa raporttien kieliasun, lähdeviitteet ja varmistaa että arviointikriteerit täyttyvät."
  }
];

const DEFAULT_TASKS = [
  {
    id: "t1",
    title: "Projektisuunnitelman luonnos",
    assignee: "Sara Virtanen",
    deadline: "15.10.",
    status: "done"
  },
  {
    id: "t2",
    title: "Käyttäjätarpeet & haastattelut",
    assignee: "Sofia Mäkelä",
    deadline: "28.10.",
    status: "in-progress"
  },
  {
    id: "t3",
    title: "Käyttöliittymän prototyyppi",
    assignee: "Matti Korhonen",
    deadline: "10.11.",
    status: "in-progress"
  },
  {
    id: "t4",
    title: "Loppuraportti ja esitys",
    assignee: "Juho & Alex",
    deadline: "25.11.",
    status: "todo"
  }
];

// Sovelluksen tila
let appState = {
  workspace: { ...DEFAULT_WORKSPACE },
  rules: [...DEFAULT_RULES],
  roles: [...DEFAULT_ROLES],
  tasks: [...DEFAULT_TASKS]
};

// Paikallisen tallennuksen avaimet
const STORAGE_KEY = "campusconnect_state_v1";

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      appState = JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Tilan lataus epäonnistui, käytetään oletuksia", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn("Tilan tallennus epäonnistui", e);
  }
}

// 1. SIVUNVAIHTO (SCREEN SWITCHER)
function switchScreen(targetId) {
  // Piilotetaan kaikki sivut
  const screens = document.querySelectorAll(".screen-view");
  screens.forEach((screen) => screen.classList.remove("active"));

  // Näytetään kohdesivu
  const targetScreen = document.getElementById(targetId);
  if (targetScreen) {
    targetScreen.classList.add("active");
  }

  // Päivitetään navigaation aktiivinen välilehti
  const navTabs = document.querySelectorAll(".nav-tab");
  navTabs.forEach((tab) => {
    if (tab.getAttribute("data-target") === targetId) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Skrollaus pehmeästi sivun yläosaan
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 2. YLÄPALKIN JA TYÖTILAN NÄKYMYKSEN PÄIVITYS
function updateWorkspaceUI() {
  const headerName = document.getElementById("header-workspace-name");
  const headerCode = document.getElementById("header-workspace-code");
  const activeBox = document.getElementById("workspace-active-box");
  const setupCard = document.getElementById("workspace-setup-card");
  const activeTitle = document.getElementById("active-workspace-title");
  const activeCode = document.getElementById("active-workspace-code");

  if (appState.workspace.isJoined) {
    if (headerName) headerName.textContent = appState.workspace.name;
    if (headerCode) {
      headerCode.textContent = appState.workspace.code;
      headerCode.style.display = "inline";
    }
    if (activeBox) activeBox.style.display = "flex";
    if (setupCard) setupCard.style.display = "none";
    if (activeTitle) activeTitle.textContent = appState.workspace.name;
    if (activeCode) activeCode.textContent = appState.workspace.code;
  } else {
    if (headerName) headerName.textContent = "Ei valittua työtilaa";
    if (headerCode) headerCode.style.display = "none";
    if (activeBox) activeBox.style.display = "none";
    if (setupCard) setupCard.style.display = "block";
  }
}

// 3. SÄÄNTÖJEN RENDERÖINTI
function renderRules() {
  const container = document.getElementById("rules-container");
  if (!container) return;

  container.innerHTML = "";

  appState.rules.forEach((rule) => {
    const article = document.createElement("article");
    article.className = "rule-card";
    article.innerHTML = `
      <div>
        <span class="rule-badge">${escapeHTML(rule.category)}</span>
        <h3>${escapeHTML(rule.title)}</h3>
        <p>${escapeHTML(rule.description)}</p>
      </div>
      <div class="rule-card-footer">
        <button type="button" class="btn btn-sm btn-danger-outline btn-delete-rule" data-id="${rule.id}" title="Poista sääntö">
          Poista
        </button>
      </div>
    `;
    container.appendChild(article);
  });

  // Poistonapit
  container.querySelectorAll(".btn-delete-rule").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      appState.rules = appState.rules.filter((r) => r.id !== id);
      saveState();
      renderRules();
    });
  });
}

// 4. ROOLIEN RENDERÖINTI
function renderRoles() {
  const container = document.getElementById("roles-container");
  if (!container) return;

  container.innerHTML = "";

  appState.roles.forEach((role) => {
    const article = document.createElement("article");
    article.className = "role-card";
    const initial = role.name ? role.name.charAt(0).toUpperCase() : "?";

    article.innerHTML = `
      <div class="role-header">
        <div class="role-avatar" aria-hidden="true">${escapeHTML(initial)}</div>
        <div>
          <h3>${escapeHTML(role.name)}</h3>
          <span class="role-tag">${escapeHTML(role.roleTitle)}</span>
        </div>
      </div>
      <p>${escapeHTML(role.responsibilities)}</p>
      <div class="rule-card-footer">
        <button type="button" class="btn btn-sm btn-danger-outline btn-delete-role" data-id="${role.id}" title="Poista rooli">
          Poista
        </button>
      </div>
    `;
    container.appendChild(article);
  });

  container.querySelectorAll(".btn-delete-role").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      appState.roles = appState.roles.filter((r) => r.id !== id);
      saveState();
      renderRoles();
    });
  });
}

// 5. TEHTÄVIEN RENDERÖINTI (KANBAN)
function renderTasks() {
  const colTodo = document.getElementById("tasks-col-todo");
  const colInProgress = document.getElementById("tasks-col-in-progress");
  const colDone = document.getElementById("tasks-col-done");

  const countTotal = document.getElementById("stat-count-total");
  const countTodo = document.getElementById("stat-count-todo");
  const countInProgress = document.getElementById("stat-count-in-progress");
  const countDone = document.getElementById("stat-count-done");

  const badgeTodo = document.getElementById("badge-count-todo");
  const badgeInProgress = document.getElementById("badge-count-in-progress");
  const badgeDone = document.getElementById("badge-count-done");

  if (!colTodo || !colInProgress || !colDone) return;

  colTodo.innerHTML = "";
  colInProgress.innerHTML = "";
  colDone.innerHTML = "";

  let todoCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;

  appState.tasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = `task-item task-item-${task.status}`;

    let badgeClass = "status-todo";
    let badgeText = "Suunniteltu";
    let controlsHTML = "";

    if (task.status === "in-progress") {
      badgeClass = "status-in-progress";
      badgeText = "Työn alla";
      inProgressCount++;
      controlsHTML = `
        <div class="task-controls-actions">
          <button type="button" class="btn btn-sm btn-task-step btn-move-task" data-id="${task.id}" data-target="todo" title="Palauta suunniteltuihin">
            ← Suunniteltu
          </button>
          <button type="button" class="btn btn-sm btn-task-done btn-move-task" data-id="${task.id}" data-target="done" title="Merkitse valmiiksi">
            Valmis ✓
          </button>
        </div>
        <button type="button" class="btn btn-sm btn-task-delete btn-delete-task" data-id="${task.id}" title="Poista tehtävä" aria-label="Poista tehtävä">
          Poista
        </button>
      `;
    } else if (task.status === "done") {
      badgeClass = "status-done";
      badgeText = "Valmis";
      doneCount++;
      controlsHTML = `
        <div class="task-controls-actions">
          <button type="button" class="btn btn-sm btn-task-step btn-move-task" data-id="${task.id}" data-target="in-progress" title="Palauta työn alle">
            ← Työn alle
          </button>
        </div>
        <button type="button" class="btn btn-sm btn-task-delete btn-delete-task" data-id="${task.id}" title="Poista tehtävä" aria-label="Poista tehtävä">
          Poista
        </button>
      `;
    } else {
      todoCount++;
      controlsHTML = `
        <div class="task-controls-actions">
          <button type="button" class="btn btn-sm btn-task-next btn-move-task" data-id="${task.id}" data-target="in-progress" title="Aloita työ ja siirrä sarakkeeseen">
            Työn alle →
          </button>
        </div>
        <button type="button" class="btn btn-sm btn-task-delete btn-delete-task" data-id="${task.id}" title="Poista tehtävä" aria-label="Poista tehtävä">
          Poista
        </button>
      `;
    }

    card.innerHTML = `
      <div class="task-item-header">
        <h4 class="task-title">${escapeHTML(task.title)}</h4>
        <span class="status-badge ${badgeClass}">
          <span class="status-badge-dot" aria-hidden="true"></span>
          ${badgeText}
        </span>
      </div>
      <div class="task-meta">
        <div class="task-meta-item">
          <span class="task-meta-label">Vastuu:</span>
          <strong class="task-meta-value">${escapeHTML(task.assignee)}</strong>
        </div>
        <div class="task-meta-item">
          <span class="task-meta-label">Määräaika:</span>
          <strong class="task-meta-value">${escapeHTML(task.deadline)}</strong>
        </div>
      </div>
      <div class="task-controls">
        ${controlsHTML}
      </div>
    `;

    if (task.status === "in-progress") {
      colInProgress.appendChild(card);
    } else if (task.status === "done") {
      colDone.appendChild(card);
    } else {
      colTodo.appendChild(card);
    }
  });

  // Tyhjien sarakkeiden yhdenmukainen näkymä
  if (todoCount === 0) {
    colTodo.innerHTML = `
      <div class="kanban-empty-state">
        <p class="kanban-empty-text">Ei vielä suunniteltuja tehtäviä</p>
      </div>
    `;
  }
  if (inProgressCount === 0) {
    colInProgress.innerHTML = `
      <div class="kanban-empty-state">
        <p class="kanban-empty-text">Ei tehtäviä työn alla</p>
      </div>
    `;
  }
  if (doneCount === 0) {
    colDone.innerHTML = `
      <div class="kanban-empty-state">
        <p class="kanban-empty-text">Ei vielä valmistuneita tehtäviä</p>
      </div>
    `;
  }

  // Laskurit
  const total = appState.tasks.length;
  if (countTotal) countTotal.textContent = total;
  if (countTodo) countTodo.textContent = todoCount;
  if (countInProgress) countInProgress.textContent = inProgressCount;
  if (countDone) countDone.textContent = doneCount;

  if (badgeTodo) badgeTodo.textContent = todoCount;
  if (badgeInProgress) badgeInProgress.textContent = inProgressCount;
  if (badgeDone) badgeDone.textContent = doneCount;

  // Tehtävän tilasiirrot
  document.querySelectorAll(".btn-move-task").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const targetStatus = btn.getAttribute("data-target");
      const task = appState.tasks.find((t) => t.id === id);
      if (task) {
        task.status = targetStatus;
        saveState();
        renderTasks();
      }
    });
  });

  // Tehtävän poisto
  document.querySelectorAll(".btn-delete-task").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      appState.tasks = appState.tasks.filter((t) => t.id !== id);
      saveState();
      renderTasks();
    });
  });
}

// XSS-suojaus apufunktio
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 6. ALUSTUS JA TAPAHTUMANKUUNTELIJAT
document.addEventListener("DOMContentLoaded", () => {
  loadState();

  // Ylävalikon napit
  const navTabs = document.querySelectorAll(".nav-tab");
  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-target");
      if (target) switchScreen(target);
    });
  });

  // Kaikki sivun sisäiset siirtymänapit (data-screen-link)
  document.querySelectorAll("[data-screen-link]").forEach((linkBtn) => {
    linkBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = linkBtn.getAttribute("data-screen-link");
      if (target) switchScreen(target);
    });
  });

  // Brand-logo palaa aina aloitussivulle
  const brandLink = document.getElementById("brand-home-link");
  if (brandLink) {
    brandLink.addEventListener("click", (e) => {
      e.preventDefault();
      switchScreen("view-workspace");
    });
  }

  // Työtilan poistumispainike (etusivulla hyvin pienesti!)
  const btnLeave = document.getElementById("btn-leave-workspace");
  if (btnLeave) {
    btnLeave.addEventListener("click", () => {
      appState.workspace.isJoined = false;
      saveState();
      updateWorkspaceUI();
    });
  }

  // Työtilan perustamislomake
  const formCreate = document.getElementById("form-create-workspace");
  if (formCreate) {
    formCreate.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputName = document.getElementById("input-create-name");
      const name = inputName && inputName.value.trim() ? inputName.value.trim() : "Oma projektiryhmä";
      const code = "ROOLI-" + Math.floor(1000 + Math.random() * 9000);

      appState.workspace = {
        isJoined: true,
        name: name,
        code: code
      };
      saveState();
      updateWorkspaceUI();
      switchScreen("view-rules");
    });
  }

  // Työtilaan liittymislomake
  const formJoin = document.getElementById("form-join-workspace");
  if (formJoin) {
    formJoin.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputCode = document.getElementById("input-join-code");
      const code = inputCode && inputCode.value.trim() ? inputCode.value.trim().toUpperCase() : "ROOLI-8492";

      appState.workspace = {
        isJoined: true,
        name: "Digipalveluiden kehitysprojekti",
        code: code
      };
      saveState();
      updateWorkspaceUI();
      switchScreen("view-rules");
    });
  }

  // Segmented control (Perusta / Liity)
  const tabCreate = document.getElementById("tab-mode-create");
  const tabJoin = document.getElementById("tab-mode-join");
  const panelCreate = document.getElementById("panel-create-workspace");
  const panelJoin = document.getElementById("panel-join-workspace");

  if (tabCreate && tabJoin && panelCreate && panelJoin) {
    tabCreate.addEventListener("click", () => {
      tabCreate.classList.add("active");
      tabJoin.classList.remove("active");
      panelCreate.classList.remove("hidden");
      panelJoin.classList.add("hidden");
    });

    tabJoin.addEventListener("click", () => {
      tabJoin.classList.add("active");
      tabCreate.classList.remove("active");
      panelCreate.classList.add("hidden");
      panelJoin.classList.remove("hidden");
    });
  }

  // Säännön lisäyslomake
  const formAddRule = document.getElementById("form-add-rule");
  if (formAddRule) {
    formAddRule.addEventListener("submit", (e) => {
      e.preventDefault();
      const titleInput = document.getElementById("input-rule-title");
      const catInput = document.getElementById("select-rule-category");
      const descInput = document.getElementById("input-rule-desc");

      if (titleInput && descInput && titleInput.value.trim()) {
        const newRule = {
          id: "r_" + Date.now(),
          category: catInput ? catInput.value : "Viestintä",
          title: titleInput.value.trim(),
          description: descInput.value.trim()
        };
        appState.rules.push(newRule);
        saveState();
        renderRules();
        titleInput.value = "";
        descInput.value = "";
      }
    });
  }

  // Roolin lisäyslomake
  const formAddRole = document.getElementById("form-add-role");
  if (formAddRole) {
    formAddRole.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("input-role-name");
      const titleInput = document.getElementById("input-role-title");
      const respInput = document.getElementById("input-role-resp");

      if (nameInput && titleInput && nameInput.value.trim()) {
        const newRole = {
          id: "m_" + Date.now(),
          name: nameInput.value.trim(),
          roleTitle: titleInput.value.trim(),
          responsibilities: respInput ? respInput.value.trim() : ""
        };
        appState.roles.push(newRole);
        saveState();
        renderRoles();
        nameInput.value = "";
        titleInput.value = "";
        if (respInput) respInput.value = "";
      }
    });
  }

  // Tehtävän lisäyslomake
  const formAddTask = document.getElementById("form-add-task");
  if (formAddTask) {
    formAddTask.addEventListener("submit", (e) => {
      e.preventDefault();
      const titleInput = document.getElementById("input-task-title");
      const assigneeInput = document.getElementById("input-task-assignee");
      const deadlineInput = document.getElementById("input-task-deadline");
      const statusSelect = document.getElementById("select-task-status");

      if (titleInput && titleInput.value.trim()) {
        const newTask = {
          id: "t_" + Date.now(),
          title: titleInput.value.trim(),
          assignee: assigneeInput && assigneeInput.value.trim() ? assigneeInput.value.trim() : "Tiimi",
          deadline: deadlineInput && deadlineInput.value.trim() ? deadlineInput.value.trim() : "Avoin",
          status: statusSelect ? statusSelect.value : "todo"
        };
        appState.tasks.push(newTask);
        saveState();
        renderTasks();
        titleInput.value = "";
        if (deadlineInput) deadlineInput.value = "";
      }
    });
  }

  // Alustetaan UI
  updateWorkspaceUI();
  renderRules();
  renderRoles();
  renderTasks();
});
