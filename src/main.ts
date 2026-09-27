/**
 * ============================================================================
 * ROOLIRUUTU - CAMPUSCONNECT OPISKELIJAPALVELU
 * ============================================================================
 * Tämä tiedosto sisältää Rooliruutu-sovelluksen päälogiikan toteutettuna
 * puhtaalla, kevyellä ja selkeästi kommentoidulla TypeScriptillä/JavaScriptillä.
 * Ei raskaita sovelluskehyksiä – helppo lukea, ylläpitää ja laajentaa.
 *
 * Sisältää:
 * 1. Tietomallit ja oletusdata (työtila, säännöt, roolit, tehtävät, arviointi)
 * 2. Näyttöjen välinen esteetön navigaatio ja ruudunlukijailmoitukset (WCAG AA)
 * 3. Työtilan luonti, satunnaiskoodin generointi ja leikepöydälle kopiointi
 * 4. Liittymiskoodin tarkistus ja virheenkäsittely
 * 5. Pelisääntöjen lisääminen, muokkaaminen ja poistaminen
 * 6. Roolien jako ja roolien kierto projektin edetessä
 * 7. Tehtävätaulu, tilanvaihto klikkauksella (kesken / valmis / myöhässä)
 * 8. Projektin kokonaisedistymisen laskenta (%)
 * 9. Ongelmatilanteen tunnistus, vaiheistetut ohjeet ja opettajaeskalointi
 * 10. Loppuarvioinnin tähtiasteikko (1-5) ja palautteen tallennus
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. TYYPPIMÄÄRITTELYT
// ----------------------------------------------------------------------------

export type TaskStatus = 'in_progress' | 'done' | 'overdue';

export interface Rule {
  id: string;
  text: string;
}

export interface Member {
  id: string;
  name: string;
  role: 'Aikatauluttaja' | 'Kokoaja' | 'Viimeistelijä' | 'Yhteyshenkilö' | 'Seuraaja';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeName: string;
  status: TaskStatus;
  updatedAt: string;
}

export interface EvaluationData {
  rulesScore: number;
  rolesScore: number;
  contributionScore: number;
  feedbackText: string;
  isSubmitted: boolean;
  submittedAt?: string;
}

export interface AppState {
  workspaceName: string;
  joinCode: string;
  hasJoinedWorkspace: boolean; // Määrittää onko käyttäjä perustanut tai liittynyt työtilaan
  isEscalated: boolean;
  escalationReference: string;
  rules: Rule[];
  members: Member[];
  tasks: Task[];
  evaluation: EvaluationData;
  activeScreen: string;
  taskFilter: 'all' | 'in_progress' | 'done' | 'overdue';
}

// ----------------------------------------------------------------------------
// 2. OLETUSDATA (KÄYTETÄÄN ENSIMMÄISELLÄ AVAUSKERRALLA TAI NOLLAUKSESSA)
// ----------------------------------------------------------------------------

const DEFAULT_STATE: AppState = {
  workspaceName: 'Digipalveluiden kehitysprojekti',
  joinCode: 'ROOLI-8492',
  hasJoinedWorkspace: false, // Oletuksena ei ole liitytty -> muut sivut pysyvät piilossa kunnes liitytään
  isEscalated: false,
  escalationReference: '8492',
  activeScreen: 'view-workspace',
  taskFilter: 'all',
  rules: [
    {
      id: 'rule-1',
      text: 'Ilmoitetaan mahdollisista esteistä ryhmän viestintäkanavassa vähintään 4h ennen yhteistä tapaamista.',
    },
    {
      id: 'rule-2',
      text: 'Omat tehtäväosuudet valmistellaan vähintään 24h ennen virallista deadlinea yhteistä tarkistusta varten.',
    },
    {
      id: 'rule-3',
      text: 'Jos jumiudut tehtävään yli 2 tunniksi, pyydä heti apua muilta ryhmäläisiltä.',
    },
    {
      id: 'rule-4',
      text: 'Kunnioitetaan toistemme ideoita ja annetaan jokaiselle puheenvuoro viikkopalavereissa.',
    },
  ],
  members: [
    { id: 'mem-1', name: 'Sara Virtanen', role: 'Aikatauluttaja' },
    { id: 'mem-2', name: 'Matti Korhonen', role: 'Kokoaja' },
    { id: 'mem-3', name: 'Juho Nieminen', role: 'Viimeistelijä' },
    { id: 'mem-4', name: 'Sofia Mäkelä', role: 'Yhteyshenkilö' },
    { id: 'mem-5', name: 'Alex Laine', role: 'Seuraaja' },
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Käyttäjähaastatteluiden analyysi',
      description: 'Tiivistä 5 opiskelijahaastattelun tärkeimmät tarpeet raporttiin.',
      assigneeName: 'Sara Virtanen',
      status: 'done',
      updatedAt: 'Eilen',
    },
    {
      id: 'task-2',
      title: 'Käyttöliittymäluonnosten wireframe-mallit',
      description: 'Piirrä Rooliruudun pääikkunoiden rautalankamallit.',
      assigneeName: 'Matti Korhonen',
      status: 'done',
      updatedAt: '2 pv sitten',
    },
    {
      id: 'task-3',
      title: 'Väliraportin johdannon ja lähdeviitteiden kirjoitus',
      description: 'Tarkista APA-viittaukset ja täydennä tutkimustausta.',
      assigneeName: 'Juho Nieminen',
      status: 'in_progress',
      updatedAt: 'Tänään',
    },
    {
      id: 'task-4',
      title: 'Yhteydenotto kurssin vastuuopettajaan välikatselmoinnista',
      description: 'Varaa ohjausaika ensi viikon tiistaille ja jaa kysymyslista.',
      assigneeName: 'Sofia Mäkelä',
      status: 'in_progress',
      updatedAt: 'Tänään',
    },
    {
      id: 'task-5',
      title: 'Tietokantakaavion määrittely ja tietoturvakatsaus',
      description: 'Määrittele tietoturvallinen skeema opiskelijatiedoille.',
      assigneeName: 'Alex Laine',
      status: 'overdue', // Esimerkkitehtävä havainnollistamaan viivästystä
      updatedAt: 'Määräaika ylittynyt 1 pv',
    },
  ],
  evaluation: {
    rulesScore: 4,
    rolesScore: 5,
    contributionScore: 4,
    feedbackText: 'Roolien selkeys auttoi tiimiä pysymään aikataulussa. Aikatauluttajan rooli oli erityisen tärkeä.',
    isSubmitted: false,
  },
};

// Paikallisen tallennuksen avain
const STORAGE_KEY = 'campusconnect_rooliruutu_state_v2';

// Sovelluksen aktiivinen tila muistissa
let state: AppState = loadInitialState();

/**
 * Lataa tilan selaimen muistista tai palauttaa oletustilan
 */
function loadInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...DEFAULT_STATE, 
        ...parsed,
        hasJoinedWorkspace: typeof parsed.hasJoinedWorkspace === 'boolean' ? parsed.hasJoinedWorkspace : false
      };
    }
  } catch (e) {
    console.warn('Ei voitu ladata localStorage-tilaa:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

/**
 * Tallentaa nykyisen tilan selaimen muistiin
 */
function saveState(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Virhe tallennettaessa tilaa:', e);
  }
}

// ----------------------------------------------------------------------------
// 3. SAAVUTETTAVUUSAPURIT (WCAG 2.1 AA)
// ----------------------------------------------------------------------------

/**
 * Ilmoittaa tilamuutoksen ruudunlukijoille aria-live -alueen kautta
 */
function announceToScreenReader(message: string): void {
  const announcer = document.getElementById('live-announcer');
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }
}

/**
 * Näyttää visuaalisen toast-ilmoituksen ruudun alareunassa
 */
let toastTimeout: number | undefined;
function showToast(message: string): void {
  const toast = document.getElementById('toast-message');
  const toastText = document.getElementById('toast-text');
  if (toast && toastText) {
    toastText.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
}

/**
 * Generoi satunnaisen liittymiskoodin työtilalle
 */
function generateRandomJoinCode(): string {
  const prefixes = ['ROOLI', 'TIIMI', 'CAMPUS', 'PROJ'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
}

// ----------------------------------------------------------------------------
// 4. NÄYTTÖJEN VÄLINEN NAVIGAATIO
// ----------------------------------------------------------------------------

/**
 * Vaihtaa näkymää käyttäjän valitsemaan näyttöön
 */
export function switchScreen(targetScreenId: string): void {
  // Tarkistetaan työtilalukitus: Pelisäännöt, tehtävätaulu, ongelmat ja arviointi
  // eivät ole käytettävissä ennen kuin työtila on perustettu tai liitytty koodilla
  if (!state.hasJoinedWorkspace && targetScreenId !== 'view-workspace') {
    showToast('Perusta ensin työtila tai liity koodilla avataksesi tämän sivun!');
    announceToScreenReader('Sivu on lukittu. Perusta ensin työtila tai liity ryhmän koodilla.');
    targetScreenId = 'view-workspace';
  }

  // Piilotetaan kaikki näytöt ja poistetaan aktiivisuus
  const screens = document.querySelectorAll('.screen-view');
  screens.forEach((screen) => {
    screen.classList.remove('active');
  });

  // Näytetään valittu näyttö
  const activeScreenEl = document.getElementById(targetScreenId);
  if (activeScreenEl) {
    activeScreenEl.classList.add('active');
  }

  // Päivitetään navigaatiopalkin painikkeiden tilat
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach((btn) => {
    const isTarget = btn.getAttribute('data-target') === targetScreenId;
    if (isTarget) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.classList.remove('active');
      btn.removeAttribute('aria-current');
    }
  });

  state.activeScreen = targetScreenId;
  saveState();

  // Vieritetään ylös ja ilmoitetaan ruudunlukijalle
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const screenTitles: Record<string, string> = {
    'view-workspace': 'Työtilan perustaminen tai liittyminen',
    'view-rules': 'Pelisäännöt ja ryhmän roolit',
    'view-tasks': 'Projektin tehtävätaulu',
    'view-issues': 'Ongelmatilanteet ja viivästyksen ratkaisu',
    'view-evaluation': 'Projektin loppuarviointi',
  };
  const title = screenTitles[targetScreenId] || 'Rooliruutu';
  announceToScreenReader(`Siirrytty näyttöön: ${title}`);

  // Päivitetään näytön erityissisältö
  if (targetScreenId === 'view-rules') {
    updateRulesHubPreviews();
  } else if (targetScreenId === 'view-tasks') {
    renderTaskBoard();
  } else if (targetScreenId === 'view-issues') {
    renderIssuesScreen();
  } else if (targetScreenId === 'view-evaluation') {
    renderEvaluationScreen();
  }
}

// ----------------------------------------------------------------------------
// 5. NÄYTTÖKOHTAINEN LOGIIKKA JA RENDERÖINTI
// ----------------------------------------------------------------------------

/**
 * Päivittää navigaation ja sivujen näkyvyyden lukituksen.
 * Pelisäännöt, tehtävätaulu, ongelmat ja arviointi ovat piilossa, kunnes
 * käyttäjä on joko perustanut työtilan tai liittynyt koodilla.
 */
export function updateNavigationLockState(): void {
  const restrictedNavBtns = document.querySelectorAll('.nav-restricted');
  const lockedNotice = document.getElementById('workspace-locked-notice');
  const activeInfo = document.getElementById('workspace-active-info');
  const activeTitle = document.getElementById('active-workspace-title');
  const activeCodeText = document.getElementById('active-workspace-code-text');

  if (state.hasJoinedWorkspace) {
    // Työtila on perustettu/liitytty -> näytetään kaikki sivut
    restrictedNavBtns.forEach((btn) => {
      btn.classList.remove('nav-locked');
    });
    if (lockedNotice) lockedNotice.style.display = 'none';
    if (activeInfo) activeInfo.style.display = 'block';
    if (activeTitle) activeTitle.textContent = state.workspaceName;
    if (activeCodeText) activeCodeText.textContent = state.joinCode;
  } else {
    // Ei vielä liitytty -> piilotetaan sivut navigaatiosta
    restrictedNavBtns.forEach((btn) => {
      btn.classList.add('nav-locked');
    });
    if (lockedNotice) lockedNotice.style.display = 'flex';
    if (activeInfo) activeInfo.style.display = 'none';
  }
}

/**
 * Päivittää yläpalkin työtilamerkinnän ja poistumispainikkeen
 */
function updateHeaderWorkspaceBadge(): void {
  const nameEl = document.getElementById('header-workspace-name');
  const codeEl = document.getElementById('header-workspace-code');
  const headerLeaveBtn = document.getElementById('btn-header-leave-workspace');

  if (nameEl) {
    nameEl.textContent = state.hasJoinedWorkspace ? state.workspaceName : 'Ei valittua työtilaa';
  }
  if (codeEl) {
    if (state.hasJoinedWorkspace) {
      codeEl.style.display = 'inline';
      codeEl.textContent = state.joinCode;
    } else {
      codeEl.style.display = 'none';
    }
  }
  if (headerLeaveBtn) {
    headerLeaveBtn.style.display = state.hasJoinedWorkspace ? 'inline-flex' : 'none';
  }
}

/**
 * Poistuu työtilasta ja lukitsee projektisivut
 */
export function leaveWorkspace(): void {
  state.hasJoinedWorkspace = false;
  saveState();
  updateHeaderWorkspaceBadge();
  updateNavigationLockState();
  switchScreen('view-workspace');
  showToast('Olet poistunut työtilasta. Sivut lukittu.');
  announceToScreenReader('Poistuttu työtilasta. Muut sivut suljettu.');
}

// --- NÄYTTÖ 1: TYÖTILA ---

function initWorkspaceScreen(): void {
  const tabCreate = document.getElementById('tab-create-workspace');
  const tabJoin = document.getElementById('tab-join-workspace');
  const panelCreate = document.getElementById('panel-create-workspace');
  const panelJoin = document.getElementById('panel-join-workspace');
  const codeDisplay = document.getElementById('generated-join-code-display');
  const copyBtn = document.getElementById('btn-copy-code');
  const copyBtnLabel = document.getElementById('copy-btn-label');
  const formCreate = document.getElementById('form-create-workspace');
  const formJoin = document.getElementById('form-join-workspace');
  const inputWorkspaceName = document.getElementById('input-workspace-name') as HTMLInputElement;
  const inputJoinCode = document.getElementById('input-join-code') as HTMLInputElement;
  const joinErrorBanner = document.getElementById('join-error-banner');
  const hintValidCode = document.getElementById('hint-valid-code');

  // Asetetaan nykyiset tiedot kenttiin
  if (codeDisplay) codeDisplay.textContent = state.joinCode;
  if (inputWorkspaceName) inputWorkspaceName.value = state.workspaceName;
  if (hintValidCode) hintValidCode.textContent = state.joinCode;

  // Segmentoitu välilehtivalitsin (Perusta / Liity)
  if (tabCreate && tabJoin && panelCreate && panelJoin) {
    tabCreate.addEventListener('click', () => {
      tabCreate.classList.add('active');
      tabCreate.setAttribute('aria-selected', 'true');
      tabJoin.classList.remove('active');
      tabJoin.setAttribute('aria-selected', 'false');
      panelCreate.style.display = 'block';
      panelJoin.style.display = 'none';
      if (joinErrorBanner) joinErrorBanner.style.display = 'none';
    });

    tabJoin.addEventListener('click', () => {
      tabJoin.classList.add('active');
      tabJoin.setAttribute('aria-selected', 'true');
      tabCreate.classList.remove('active');
      tabCreate.setAttribute('aria-selected', 'false');
      panelJoin.style.display = 'block';
      panelCreate.style.display = 'none';
      if (inputJoinCode) inputJoinCode.focus();
    });
  }

  // Kopioi liittymiskoodi leikepöydälle
  if (copyBtn && codeDisplay) {
    copyBtn.addEventListener('click', async () => {
      const codeToCopy = codeDisplay.textContent || state.joinCode;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(codeToCopy);
        } else {
          // Fallback vanhemmille selaimille
          const tempInput = document.createElement('input');
          tempInput.value = codeToCopy;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }

        // Visuaalinen vahvistus
        if (copyBtnLabel) copyBtnLabel.textContent = 'Kopioitu!';
        showToast(`Koodi ${codeToCopy} kopioitu leikepöydälle!`);
        announceToScreenReader(`Liittymiskoodi ${codeToCopy} kopioitu leikepöydälle.`);

        setTimeout(() => {
          if (copyBtnLabel) copyBtnLabel.textContent = 'Kopioi koodi';
        }, 2000);
      } catch (err) {
        showToast('Koodin kopiointi epäonnistui');
      }
    });
  }

  // Luo uusi työtila -lomakkeen lähetys
  if (formCreate) {
    formCreate.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = inputWorkspaceName?.value.trim() || 'Uusi opiskelijaryhmä';
      // Luodaan uusi koodi työtilalle
      const newCode = generateRandomJoinCode();
      state.workspaceName = newName;
      state.joinCode = newCode;
      state.hasJoinedWorkspace = true; // Avaa pelisäännöt, tehtävätaulun, ongelmat ja arvioinnin!
      if (codeDisplay) codeDisplay.textContent = newCode;
      if (hintValidCode) hintValidCode.textContent = newCode;

      saveState();
      updateHeaderWorkspaceBadge();
      updateNavigationLockState();
      showToast(`Työtila "${newName}" luotu! Kaikki sivut ovat nyt auki.`);
      announceToScreenReader('Työtila luotu. Kaikki sivut ovat nyt auki. Siirrytään pelisääntöihin.');
      // Vie pelisäännöt-näyttöön käyttäjän pyynnön mukaisesti
      switchScreen('view-rules');
    });
  }

  // Liity koodilla -lomakkeen lähetys
  if (formJoin) {
    formJoin.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredCode = inputJoinCode?.value.trim().toUpperCase() || '';
      const validCodes = [state.joinCode.toUpperCase(), 'ROOLI-8492', 'CAMPUS-2026', 'PROJEKTI2026'];

      if (validCodes.includes(enteredCode)) {
        state.hasJoinedWorkspace = true; // Avaa pelisäännöt, tehtävätaulun, ongelmat ja arvioinnin!
        saveState();
        updateHeaderWorkspaceBadge();
        updateNavigationLockState();
        if (joinErrorBanner) joinErrorBanner.style.display = 'none';
        showToast(`Liitytty työtilaan koodilla ${enteredCode}! Kaikki sivut ovat nyt auki.`);
        announceToScreenReader('Liittyminen onnistui. Kaikki sivut ovat nyt käytettävissä. Siirrytään pelisääntöihin.');
        // Oikea koodi vie pelisäännöt-näyttöön
        switchScreen('view-rules');
      } else {
        // Väärästä koodista näytetään selkeä virheilmoitus
        if (joinErrorBanner) {
          joinErrorBanner.style.display = 'flex';
          const errorText = document.getElementById('join-error-text');
          if (errorText) {
            errorText.textContent = `Koodia "${enteredCode}" ei löytynyt. Tarkista koodi (esim. ${state.joinCode}) ja yritä uudelleen.`;
          }
        }
        announceToScreenReader(`Virhe: Koodia ${enteredCode} ei löytynyt. Tarkista koodi.`);
        inputJoinCode?.focus();
      }
    });
  }

  // Aktiivisen työtilan toiminnot
  const btnGotoRules = document.getElementById('btn-goto-rules-direct');
  if (btnGotoRules) {
    btnGotoRules.addEventListener('click', () => {
      switchScreen('view-rules');
    });
  }

  const btnLeave = document.getElementById('btn-leave-workspace');
  if (btnLeave) {
    btnLeave.addEventListener('click', () => {
      leaveWorkspace();
    });
  }

  const btnHeaderLeave = document.getElementById('btn-header-leave-workspace');
  if (btnHeaderLeave) {
    btnHeaderLeave.addEventListener('click', () => {
      leaveWorkspace();
    });
  }
}

// --- NÄYTTÖ 2: PELISÄÄNNÖT JA ROOLIT (EI-LINEAARINEN NÄKYMÄ) ---

/**
 * Päivittää pelisääntöjen ja roolien yleiskatsauksen (Hub) esikatselutiedot ja laskurit
 */
export function updateRulesHubPreviews(): void {
  // Pelisäännöt-kortin laskurit ja esikatselu
  const hubRulesBadge = document.getElementById('hub-rules-badge');
  const tabLabelRules = document.getElementById('tab-label-rules');
  const hubRulesPreview = document.getElementById('hub-rules-preview');

  if (hubRulesBadge) {
    hubRulesBadge.textContent = `${state.rules.length} sääntöä sovittu`;
  }
  if (tabLabelRules) {
    tabLabelRules.textContent = `Pelisäännöt (${state.rules.length})`;
  }
  if (hubRulesPreview) {
    if (state.rules.length === 0) {
      hubRulesPreview.innerHTML = `
        <div style="color:var(--color-text-muted); text-align:center; padding:0.5rem;">
          Ei vielä lisättyjä pelisääntöjä. Paina alta ja lisää ensimmäinen sääntö!
        </div>
      `;
    } else {
      const previewRules = state.rules.slice(0, 3);
      const remaining = state.rules.length - previewRules.length;
      let html = previewRules
        .map((r, i) => `
          <div class="hub-preview-item">
            <strong style="color:var(--color-primary); flex-shrink:0;">${i + 1}.</strong>
            <span style="overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${escapeHtml(r.text)}</span>
          </div>
        `)
        .join('');
      if (remaining > 0) {
        html += `<div style="font-weight:700; color:var(--color-primary); margin-top:0.25rem; font-size:0.75rem;">+ ${remaining} muuta sääntöä (avaa nähdäksesi kaikki)</div>`;
      }
      hubRulesPreview.innerHTML = html;
    }
  }

  // Roolit-kortin laskurit ja esikatselu
  const hubMembersBadge = document.getElementById('hub-members-badge');
  const tabLabelRoles = document.getElementById('tab-label-roles');
  const hubRolesPreview = document.getElementById('hub-roles-preview');

  if (hubMembersBadge) {
    hubMembersBadge.textContent = `${state.members.length} jäsentä roolitettu`;
  }
  if (tabLabelRoles) {
    tabLabelRoles.textContent = `Tiimin roolit (${state.members.length})`;
  }
  if (hubRolesPreview) {
    if (state.members.length === 0) {
      hubRolesPreview.innerHTML = `
        <div style="color:var(--color-text-muted); text-align:center; padding:0.5rem;">
          Ei vielä jäseniä. Lisää jäseniä tiimiin jakamaan vastuualueita!
        </div>
      `;
    } else {
      let html = '<div style="display:flex; flex-wrap:wrap; gap:0.45rem;">';
      state.members.forEach((m) => {
        html += `
          <span class="role-chip" style="font-size:0.75rem; padding:0.35rem 0.65rem;">
            <strong>${escapeHtml(m.name)}:</strong>
            <span class="role-chip-role">${escapeHtml(m.role)}</span>
          </span>
        `;
      });
      html += '</div>';
      hubRolesPreview.innerHTML = html;
    }
  }
}

/**
 * Vaihtaa pelisääntösivun alinäyttöä (Yleiskatsaus, Pelisäännöt, Roolit)
 */
export function switchRulesSubView(subViewId: 'hub' | 'rules' | 'roles'): void {
  const panelHub = document.getElementById('rules-panel-hub');
  const panelRules = document.getElementById('rules-panel-rules');
  const panelRoles = document.getElementById('rules-panel-roles');

  const tabHub = document.getElementById('subtab-rules-hub');
  const tabRules = document.getElementById('subtab-rules-list');
  const tabRoles = document.getElementById('subtab-roles-mgmt');

  // Piilotetaan kaikki alipaneelit
  if (panelHub) panelHub.style.display = 'none';
  if (panelRules) panelRules.style.display = 'none';
  if (panelRoles) panelRoles.style.display = 'none';

  // Poistetaan aktiivisuus välilehdiltä
  [tabHub, tabRules, tabRoles].forEach((t) => {
    t?.classList.remove('active');
    t?.setAttribute('aria-selected', 'false');
  });

  if (subViewId === 'hub') {
    if (panelHub) panelHub.style.display = 'block';
    if (tabHub) {
      tabHub.classList.add('active');
      tabHub.setAttribute('aria-selected', 'true');
    }
    updateRulesHubPreviews();
    announceToScreenReader('Pelisääntöjen ja roolien yleiskatsaus.');
  } else if (subViewId === 'rules') {
    if (panelRules) panelRules.style.display = 'block';
    if (tabRules) {
      tabRules.classList.add('active');
      tabRules.setAttribute('aria-selected', 'true');
    }
    renderRulesList();
    announceToScreenReader('Pelisääntöjen katselu ja muokkaus.');
  } else if (subViewId === 'roles') {
    if (panelRoles) panelRoles.style.display = 'block';
    if (tabRoles) {
      tabRoles.classList.add('active');
      tabRoles.setAttribute('aria-selected', 'true');
    }
    renderMembersRolesAssignmentList();
    announceToScreenReader('Tiimin roolit ja vastuut.');
  }
}

/**
 * Kierrättää roolit syklisesti seuraavalle tiimin jäsenelle
 */
export function rotateRoles(): void {
  if (state.members.length < 2) {
    showToast('Lisää vähintään kaksi jäsentä roolien kiertoa varten');
    return;
  }
  // Siirretään roolit syklisesti eteenpäin
  const roles = state.members.map((m) => m.role);
  const lastRole = roles.pop()!;
  roles.unshift(lastRole);

  state.members.forEach((member, i) => {
    member.role = roles[i];
  });

  saveState();
  renderRotatingRolesBanner();
  renderMembersRolesAssignmentList();
  updateRulesHubPreviews();
  renderTaskBoard();
  showToast('Roolit kierrätetty tiimin jäsenille!');
  announceToScreenReader('Roolit kierrätetty. Jokaisella jäsenellä on nyt uusi vastuurooli.');
}

function renderRulesList(): void {
  const container = document.getElementById('rules-list-container');
  if (!container) return;
  container.innerHTML = '';

  state.rules.forEach((rule, index) => {
    const li = document.createElement('li');
    li.className = 'rule-item';
    li.id = `rule-row-${rule.id}`;

    // Säännön teksti
    const textSpan = document.createElement('span');
    textSpan.style.flex = '1';
    textSpan.innerHTML = `<strong>${index + 1}.</strong> ${escapeHtml(rule.text)}`;

    // Toiminnot: Muokkaa ja Poista
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'rule-item-actions';

    // Muokkauspainike (inline-muokkaus ilman estoalttiita prompt-ikkunoita)
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.setAttribute('aria-label', `Muokkaa sääntöä ${index + 1}`);
    editBtn.innerHTML = `
      <svg class="nav-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
      </svg>
      <span>Muokkaa</span>
    `;
    editBtn.addEventListener('click', () => {
      li.innerHTML = `
        <div style="display:flex; gap:0.5rem; width:100%; align-items:center; flex-wrap:wrap;">
          <input type="text" class="form-input inline-rule-edit" value="${escapeHtml(rule.text)}" style="flex:1; min-height:38px;" />
          <button type="button" class="btn btn-primary btn-sm btn-save-inline">Tallenna</button>
          <button type="button" class="btn btn-secondary btn-sm btn-cancel-inline">Peruuta</button>
        </div>
      `;
      const input = li.querySelector('.inline-rule-edit') as HTMLInputElement;
      input?.focus();
      li.querySelector('.btn-save-inline')?.addEventListener('click', () => {
        const val = input.value.trim();
        if (val) {
          rule.text = val;
          saveState();
          renderRulesList();
          showToast('Sääntö tallennettu!');
          announceToScreenReader('Sääntö päivitetty.');
        }
      });
      li.querySelector('.btn-cancel-inline')?.addEventListener('click', () => {
        renderRulesList();
      });
    });

    // Poistopainike
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-secondary btn-sm';
    deleteBtn.style.color = 'var(--color-danger)';
    deleteBtn.setAttribute('aria-label', `Poista sääntö ${index + 1}`);
    deleteBtn.innerHTML = `
      <svg class="nav-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
      </svg>
      <span>Poista</span>
    `;
    deleteBtn.addEventListener('click', () => {
      state.rules = state.rules.filter((r) => r.id !== rule.id);
      saveState();
      renderRulesList();
      announceToScreenReader(`Sääntö poistettu. Sääntöjä on nyt ${state.rules.length}.`);
      showToast('Sääntö poistettu');
    });

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(textSpan);
    li.appendChild(actionsDiv);
    container.appendChild(li);
  });

  updateRulesHubPreviews();
}

function renderMembersRolesAssignmentList(): void {
  const container = document.getElementById('members-roles-assignment-list');
  if (!container) return;
  container.innerHTML = '';

  const availableRoles = ['Aikatauluttaja', 'Kokoaja', 'Viimeistelijä', 'Yhteyshenkilö', 'Seuraaja'] as const;

  state.members.forEach((member, index) => {
    const row = document.createElement('div');
    row.className = 'rule-item member-assignment-row';

    const nameCol = document.createElement('div');
    nameCol.style.display = 'flex';
    nameCol.style.alignItems = 'center';
    nameCol.style.gap = '0.5rem';
    nameCol.innerHTML = `
      <span style="font-weight:700; color:var(--color-primary);">${index + 1}.</span>
      <span style="font-weight:700; font-size:var(--font-size-content-name);">${escapeHtml(member.name)}</span>
    `;

    const selectCol = document.createElement('div');
    selectCol.className = 'member-select-wrapper';
    selectCol.style.display = 'flex';
    selectCol.style.alignItems = 'center';
    selectCol.style.gap = '0.5rem';

    const label = document.createElement('label');
    label.htmlFor = `role-select-${member.id}`;
    label.className = 'sr-only';
    label.textContent = `Valitse rooli jäsenelle ${member.name}`;

    const select = document.createElement('select');
    select.id = `role-select-${member.id}`;
    select.className = 'form-select member-role-select';
    select.style.minHeight = '44px';

    availableRoles.forEach((roleName) => {
      const opt = document.createElement('option');
      opt.value = roleName;
      opt.textContent = roleName;
      if (member.role === roleName) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      const newRole = (e.target as HTMLSelectElement).value as Member['role'];
      member.role = newRole;
      saveState();
      renderRotatingRolesBanner();
      updateRulesHubPreviews();
      announceToScreenReader(`${member.name} valittu rooliin ${newRole}.`);
      showToast(`${member.name}: rooliksi asetettu ${newRole}`);
    });

    selectCol.appendChild(label);
    selectCol.appendChild(select);

    row.appendChild(nameCol);
    row.appendChild(selectCol);
    container.appendChild(row);
  });

  updateRulesHubPreviews();
}

function initRulesScreen(): void {
  const formAddRule = document.getElementById('form-add-rule');
  const inputNewRule = document.getElementById('input-new-rule') as HTMLInputElement;
  const btnPresetRules = document.getElementById('btn-preset-rules');
  const btnConfirm = document.getElementById('btn-confirm-rules-and-roles');
  const btnAddMemberTrigger = document.getElementById('btn-add-member-modal-trigger');
  const modalAddMember = document.getElementById('modal-add-member');
  const btnCancelAddMember = document.getElementById('btn-cancel-add-member');
  const formCreateMember = document.getElementById('form-create-member');
  const inputMemberName = document.getElementById('member-input-name') as HTMLInputElement;
  const selectMemberRole = document.getElementById('member-input-role') as HTMLSelectElement;

  // Ei-lineaarisen näkymän välilehdet ja navigointipainikkeet
  const subtabHub = document.getElementById('subtab-rules-hub');
  const subtabRules = document.getElementById('subtab-rules-list');
  const subtabRoles = document.getElementById('subtab-roles-mgmt');

  const btnHubViewRules = document.getElementById('btn-hub-view-rules');
  const btnHubQuickAddRule = document.getElementById('btn-hub-quick-add-rule');
  const btnHubViewRoles = document.getElementById('btn-hub-view-roles');
  const btnHubRotateRoles = document.getElementById('btn-hub-rotate-roles');

  // Alustetaan tiedot
  renderRulesList();
  renderMembersRolesAssignmentList();
  updateRulesHubPreviews();

  // Välilehtien klikkaukset
  subtabHub?.addEventListener('click', () => switchRulesSubView('hub'));
  subtabRules?.addEventListener('click', () => switchRulesSubView('rules'));
  subtabRoles?.addEventListener('click', () => switchRulesSubView('roles'));

  // Hub-korttien toiminnot
  btnHubViewRules?.addEventListener('click', () => switchRulesSubView('rules'));
  btnHubQuickAddRule?.addEventListener('click', () => {
    switchRulesSubView('rules');
    inputNewRule?.focus();
  });
  btnHubViewRoles?.addEventListener('click', () => switchRulesSubView('roles'));
  btnHubRotateRoles?.addEventListener('click', () => rotateRoles());

  // Takaisin yleiskatsaukseen -painikkeet
  document.querySelectorAll('.btn-back-to-hub').forEach((btn) => {
    btn.addEventListener('click', () => switchRulesSubView('hub'));
  });

  // Vaihda toiseen näkymään (säännöt <-> roolit)
  document.querySelectorAll('.btn-switch-to-roles').forEach((btn) => {
    btn.addEventListener('click', () => switchRulesSubView('roles'));
  });
  document.querySelectorAll('.btn-switch-to-rules').forEach((btn) => {
    btn.addEventListener('click', () => switchRulesSubView('rules'));
  });

  // Uuden säännön lisäys
  if (formAddRule) {
    formAddRule.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = inputNewRule?.value.trim();
      if (!text) {
        showToast('Kirjoita säännön sisältö ensin');
        return;
      }
      const newRule: Rule = {
        id: `rule-${Date.now()}`,
        text: text,
      };
      state.rules.push(newRule);
      saveState();
      renderRulesList();
      inputNewRule.value = '';
      showToast('Uusi pelisääntö lisätty!');
      announceToScreenReader(`Uusi sääntö lisätty: ${text}`);
    });
  }

  // Lataa suositellut säännöt
  if (btnPresetRules) {
    btnPresetRules.addEventListener('click', () => {
      state.rules = [
        { id: `rule-1-${Date.now()}`, text: 'Ilmoitetaan esteistä ja poissaoloista vähintään 4h ennen yhteistä palaveria.' },
        { id: `rule-2-${Date.now()}`, text: 'Kaikki vastaavat viesteihin 24 tunnin kuluessa arkisin.' },
        { id: `rule-3-${Date.now()}`, text: 'Omat osiot valmistellaan valmiiksi 24h ennen virallista palautusta.' },
        { id: `rule-4-${Date.now()}`, text: 'Kysytään heti apua muilta, jos tehtävässä ilmenee odottamattomia ongelmia.' },
        { id: `rule-5-${Date.now()}`, text: 'Kunnioitetaan sovittuja vastuualueita ja kiertäviä rooleja.' },
      ];
      saveState();
      renderRulesList();
      showToast('Suositellut pelisäännöt ladattu!');
      announceToScreenReader('Suositellut pelisäännöt palautettu.');
    });
  }

  // Jäsenen lisäysmodaalit
  if (btnAddMemberTrigger && modalAddMember) {
    btnAddMemberTrigger.addEventListener('click', () => {
      modalAddMember.classList.add('active');
      if (inputMemberName) {
        inputMemberName.value = '';
        inputMemberName.focus();
      }
    });
  }

  if (btnCancelAddMember && modalAddMember) {
    btnCancelAddMember.addEventListener('click', () => {
      modalAddMember.classList.remove('active');
    });
  }

  if (formCreateMember && modalAddMember) {
    formCreateMember.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = inputMemberName?.value.trim();
      const role = (selectMemberRole?.value || 'Seuraaja') as Member['role'];
      if (!name) return;

      const newMember: Member = {
        id: `mem-${Date.now()}`,
        name: name,
        role: role,
      };
      state.members.push(newMember);
      saveState();
      modalAddMember.classList.remove('active');
      renderMembersRolesAssignmentList();
      renderRotatingRolesBanner();
      showToast(`Jäsen ${name} lisätty tiimiin!`);
      announceToScreenReader(`Jäsen ${name} lisätty roolilla ${role}.`);
    });
  }

  // Vahvista-painike vie tehtävätauluun
  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      saveState();
      showToast('Pelisäännöt ja roolit vahvistettu!');
      announceToScreenReader('Tiedot tallennettu. Siirrytään tehtävätauluun.');
      switchScreen('view-tasks');
    });
  }
}

// --- NÄYTTÖ 3: TEHTÄVÄTAULU ---

/**
 * Renderöi kiertävien roolien yläpalkin
 */
function renderRotatingRolesBanner(): void {
  const container = document.getElementById('rotating-roles-chips');
  if (!container) return;
  container.innerHTML = '';

  state.members.forEach((member) => {
    const chip = document.createElement('div');
    chip.className = 'role-chip';
    chip.innerHTML = `
      <span class="role-chip-role">${escapeHtml(member.role)}:</span>
      <span>${escapeHtml(member.name)}</span>
    `;
    container.appendChild(chip);
  });
}

/**
 * Laskee ja päivittää projektin yleisen edistymispalkin
 */
function updateProgressBar(): void {
  const total = state.tasks.length;
  const doneCount = state.tasks.filter((t) => t.status === 'done').length;
  const percentage = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const fillEl = document.getElementById('progress-bar-fill');
  const labelEl = document.getElementById('progress-percentage-label');
  const countEl = document.getElementById('progress-tasks-count');
  const trackEl = document.getElementById('main-progress-bar');

  if (fillEl) fillEl.style.width = `${percentage}%`;
  if (labelEl) labelEl.textContent = `${percentage} %`;
  if (countEl) countEl.textContent = `${doneCount} / ${total} tehtävää valmiina`;
  if (trackEl) trackEl.setAttribute('aria-valuenow', percentage.toString());

  // Tarkistetaan onko jokin tehtävä myöhässä
  const overdueTasks = state.tasks.filter((t) => t.status === 'overdue');
  const banner = document.getElementById('overdue-alert-banner');
  const navDot = document.getElementById('nav-overdue-dot');
  const bannerText = document.getElementById('overdue-banner-text');

  if (overdueTasks.length > 0) {
    if (banner) banner.style.display = 'flex';
    if (navDot) navDot.style.display = 'block';
    if (bannerText) {
      bannerText.textContent = `Huomio: ${overdueTasks.length} tehtävä${overdueTasks.length > 1 ? 'ä' : ''} on myöhässä!`;
    }
  } else {
    if (banner) banner.style.display = 'none';
    if (navDot) navDot.style.display = 'none';
  }
}

/**
 * Renderöi tehtäväkortit
 */
function renderTaskBoard(): void {
  renderRotatingRolesBanner();
  updateProgressBar();

  const container = document.getElementById('tasks-container');
  if (!container) return;
  container.innerHTML = '';

  // Suodatetaan valitun filtterin mukaisesti
  let visibleTasks = state.tasks;
  if (state.taskFilter !== 'all') {
    visibleTasks = state.tasks.filter((t) => t.status === state.taskFilter);
  }

  if (visibleTasks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; background: var(--color-surface); border: 1px dashed var(--color-border); border-radius: var(--radius-md);">
        <p style="color: var(--color-text-muted); font-size: var(--font-size-content-name);">Ei tehtäviä tässä tilassa.</p>
      </div>
    `;
    return;
  }

  visibleTasks.forEach((task) => {
    // Etsitään tekijän nykyinen rooli
    const assigneeMember = state.members.find((m) => m.name === task.assigneeName);
    const roleTag = assigneeMember ? assigneeMember.role : 'Ryhmäläinen';

    const card = document.createElement('div');
    card.className = 'task-card';
    card.tabIndex = 0; // Näppäimistöllä fokusoitava
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Tehtävä: ${task.title}. Tekijä: ${task.assigneeName}. Tila: ${getStatusLabel(task.status)}. Klikkaa vaihtaaksesi tilaa.`);

    // Tilan tiedot: Väri + Teksti + Ikoni (WCAG AA -vaatimus)
    const { badgeClass, statusLabel, iconSvg } = getStatusDisplayData(task.status);

    card.innerHTML = `
      <div class="task-card-header">
        <div>
          <span class="task-assignee">${escapeHtml(task.assigneeName)}</span>
          <span style="font-size: var(--font-size-support-text); color: var(--color-primary); font-weight:600;"> · ${escapeHtml(roleTag)}</span>
        </div>
        <div class="status-badge ${badgeClass}">
          ${iconSvg}
          <span>${statusLabel}</span>
        </div>
      </div>
      <h3 class="task-title">${escapeHtml(task.title)}</h3>
      <p class="task-desc">${escapeHtml(task.description)}</p>
      <div style="margin-top:auto; pt-2; display:flex; justify-content:space-between; align-items:center; font-size:var(--font-size-small); color:var(--color-text-muted); border-top:1px solid var(--color-border-subtle); padding-top:0.5rem;">
        <span>${escapeHtml(task.updatedAt)}</span>
        <span style="font-weight:600; color:var(--color-primary);">Klikkaa vaihtaaksesi tilaa &rarr;</span>
      </div>
    `;

    // Klikkaus tai Enter vaihtaa tilan (in_progress -> done -> overdue -> in_progress)
    const toggleTaskStatus = () => {
      const nextStatusMap: Record<TaskStatus, TaskStatus> = {
        in_progress: 'done',
        done: 'overdue',
        overdue: 'in_progress',
      };
      task.status = nextStatusMap[task.status];
      task.updatedAt = 'Juuri nyt';
      saveState();
      renderTaskBoard();
      const newLabel = getStatusLabel(task.status);
      showToast(`Tehtävän "${task.title}" tilaksi vaihdettu: ${newLabel}`);
      announceToScreenReader(`Tehtävän ${task.title} tila vaihdettu: ${newLabel}.`);
    };

    card.addEventListener('click', toggleTaskStatus);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTaskStatus();
      }
    });

    container.appendChild(card);
  });
}

function getStatusLabel(status: TaskStatus): string {
  if (status === 'done') return 'Valmis';
  if (status === 'overdue') return 'Myöhässä';
  return 'Kesken';
}

function getStatusDisplayData(status: TaskStatus): { badgeClass: string; statusLabel: string; iconSvg: string } {
  if (status === 'done') {
    return {
      badgeClass: 'status-done',
      statusLabel: 'Valmis',
      iconSvg: `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `,
    };
  } else if (status === 'overdue') {
    return {
      badgeClass: 'status-overdue',
      statusLabel: 'Myöhässä',
      iconSvg: `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `,
    };
  } else {
    return {
      badgeClass: 'status-in-progress',
      statusLabel: 'Kesken',
      iconSvg: `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      `,
    };
  }
}

function initTaskScreen(): void {
  const btnRotate = document.getElementById('btn-rotate-roles');
  const btnGotoIssues = document.getElementById('btn-goto-issues');
  const btnOpenNewTask = document.getElementById('btn-open-new-task-modal');
  const modalNewTask = document.getElementById('modal-new-task');
  const btnCancelNewTask = document.getElementById('btn-cancel-new-task');
  const formCreateTask = document.getElementById('form-create-task');
  const taskInputTitle = document.getElementById('task-input-title') as HTMLInputElement;
  const taskInputDesc = document.getElementById('task-input-desc') as HTMLTextAreaElement;
  const taskInputAssignee = document.getElementById('task-input-assignee') as HTMLSelectElement;
  const taskInputStatus = document.getElementById('task-input-status') as HTMLSelectElement;

  // Kiertävät roolit -toiminto
  if (btnRotate) {
    btnRotate.addEventListener('click', () => {
      rotateRoles();
    });
  }

  // Linkki ongelmatilanne-näyttöön myöhästymisbannerista
  if (btnGotoIssues) {
    btnGotoIssues.addEventListener('click', () => {
      switchScreen('view-issues');
    });
  }

  // Suodatinpainikkeet
  const filterButtons = document.querySelectorAll('.task-filter-btn');
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.taskFilter = btn.getAttribute('data-filter') as AppState['taskFilter'];
      renderTaskBoard();
    });
  });

  // Uuden tehtävän lisäys
  if (btnOpenNewTask && modalNewTask) {
    btnOpenNewTask.addEventListener('click', () => {
      // Päivitetään jäsenvalikko
      if (taskInputAssignee) {
        taskInputAssignee.innerHTML = '';
        state.members.forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m.name;
          opt.textContent = `${m.name} (${m.role})`;
          taskInputAssignee.appendChild(opt);
        });
      }
      if (taskInputTitle) taskInputTitle.value = '';
      if (taskInputDesc) taskInputDesc.value = '';
      modalNewTask.classList.add('active');
      taskInputTitle?.focus();
    });
  }

  if (btnCancelNewTask && modalNewTask) {
    btnCancelNewTask.addEventListener('click', () => {
      modalNewTask.classList.remove('active');
    });
  }

  if (formCreateTask && modalNewTask) {
    formCreateTask.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = taskInputTitle?.value.trim();
      const desc = taskInputDesc?.value.trim() || 'Ei lisäkuvausta.';
      const assignee = taskInputAssignee?.value || (state.members[0] ? state.members[0].name : 'Ryhmäläinen');
      const status = (taskInputStatus?.value || 'in_progress') as TaskStatus;

      if (!title) return;

      const newTask: Task = {
        id: `task-${Date.now()}`,
        title,
        description: desc,
        assigneeName: assignee,
        status,
        updatedAt: 'Juuri lisätty',
      };

      state.tasks.push(newTask);
      saveState();
      modalNewTask.classList.remove('active');
      renderTaskBoard();
      showToast(`Uusi tehtävä "${title}" lisätty!`);
      announceToScreenReader(`Uusi tehtävä lisätty jäsenelle ${assignee}.`);
    });
  }
}

// --- NÄYTTÖ 4: ONGELMATILANNE JA ESKALOINTI ---

function renderIssuesScreen(): void {
  const container = document.getElementById('issues-detected-container');
  const promptState = document.getElementById('escalation-prompt-state');
  const confirmedState = document.getElementById('escalation-confirmed-state');
  const refCodeSpan = document.getElementById('escalation-reference-code');

  if (refCodeSpan) refCodeSpan.textContent = state.escalationReference;

  // Tarkistetaan onko eskalointi päällä
  if (state.isEscalated) {
    if (promptState) promptState.style.display = 'none';
    if (confirmedState) confirmedState.style.display = 'block';
  } else {
    if (promptState) promptState.style.display = 'block';
    if (confirmedState) confirmedState.style.display = 'none';
  }

  if (!container) return;
  container.innerHTML = '';

  const overdueTasks = state.tasks.filter((t) => t.status === 'overdue');

  if (overdueTasks.length === 0) {
    container.innerHTML = `
      <div style="padding: 1rem; background-color: var(--color-success-bg); border-radius: var(--radius-sm); border: 1px solid var(--color-success-border); color: var(--color-success-text);">
        <p style="font-weight:600; margin-bottom: 0.25rem;">Hienoa! Ryhmälläsi ei ole tällä hetkellä yhtään myöhässä olevaa tehtävää.</p>
        <p style="font-size: var(--font-size-support-text); margin-bottom: 0.5rem;">Kaikki tehtävät ovat aikataulussa tai valmiita.</p>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-simulate-delay">
          Simuloi tehtävän viivästystä kokeillaksesi toimintapolkua
        </button>
      </div>
    `;

    const simBtn = document.getElementById('btn-simulate-delay');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        // Asetetaan yksi tehtävä myöhässä-tilaan simulointia varten
        if (state.tasks.length > 0) {
          state.tasks[state.tasks.length - 1].status = 'overdue';
          state.tasks[state.tasks.length - 1].updatedAt = 'Määräaika ylittynyt 2 pv';
          saveState();
          renderIssuesScreen();
          updateProgressBar();
          showToast('Yksi tehtävä merkitty myöhästyneeksi kokeilua varten');
          announceToScreenReader('Tehtävä merkitty myöhästyneeksi.');
        }
      });
    }
  } else {
    overdueTasks.forEach((task) => {
      const item = document.createElement('div');
      item.className = 'rule-item';
      item.style.backgroundColor = 'var(--color-danger-bg)';
      item.style.borderColor = 'var(--color-danger-border)';
      item.style.marginBottom = '0.75rem';

      item.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.25rem; flex:1;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <strong style="color:var(--color-danger-text); font-size:var(--font-size-content-name);">${escapeHtml(task.title)}</strong>
            <span class="status-badge status-overdue" style="font-size:0.7rem; padding:0.15rem 0.4rem;">Myöhässä</span>
          </div>
          <p style="font-size:var(--font-size-support-text); color:var(--color-text-main); margin:0;">${escapeHtml(task.description)}</p>
          <div style="font-size:var(--font-size-small); color:var(--color-danger-text); font-weight:600;">
            Vastuuhenkilö: ${escapeHtml(task.assigneeName)} · ${escapeHtml(task.updatedAt)}
          </div>
        </div>
        <div>
          <button type="button" class="btn btn-secondary btn-sm btn-resolve-task" data-id="${task.id}" style="color:var(--color-success-text); border-color:var(--color-success-border);">
            Merkitse selvitetyksi
          </button>
        </div>
      `;
      container.appendChild(item);
    });

    // Kuuntelijat selvitetyksi merkitsemiselle
    container.querySelectorAll('.btn-resolve-task').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const taskId = (e.currentTarget as HTMLElement).getAttribute('data-id');
        const targetTask = state.tasks.find((t) => t.id === taskId);
        if (targetTask) {
          targetTask.status = 'in_progress';
          targetTask.updatedAt = 'Jatkettu sovittelun jälkeen';
          saveState();
          renderIssuesScreen();
          updateProgressBar();
          showToast(`Tehtävä "${targetTask.title}" palautettu työn alle!`);
          announceToScreenReader('Tehtävän tila palautettu.');
        }
      });
    });
  }
}

function initIssuesScreen(): void {
  const btnTriggerEscalate = document.getElementById('btn-trigger-escalate');
  const btnCancelEscalate = document.getElementById('btn-cancel-escalate');
  const btnBackToTasks = document.getElementById('btn-back-to-tasks');

  // Eskaloi opettajalle -painike
  if (btnTriggerEscalate) {
    btnTriggerEscalate.addEventListener('click', () => {
      state.isEscalated = true;
      state.escalationReference = Math.floor(1000 + Math.random() * 9000).toString();
      saveState();
      renderIssuesScreen();
      showToast('Eskalointipyyntö lähetetty vastuuopettajalle!');
      announceToScreenReader('Eskalointipyyntö lähetetty opettajalle. Asiaviite tallennettu.');
    });
  }

  // Peruuta eskalointi -painike
  if (btnCancelEscalate) {
    btnCancelEscalate.addEventListener('click', () => {
      state.isEscalated = false;
      saveState();
      renderIssuesScreen();
      showToast('Eskalointipyyntö peruutettu. Asia sovittu tiimin kesken!');
      announceToScreenReader('Eskalointipyyntö peruutettu.');
    });
  }

  // Palaa tehtävätauluun
  if (btnBackToTasks) {
    btnBackToTasks.addEventListener('click', () => {
      switchScreen('view-tasks');
    });
  }
}

// --- NÄYTTÖ 5: LOPPUARVIOINTI ---

function renderEvaluationScreen(): void {
  // Renderöidään tiimin jäsenlista ja kunkin tilanne
  const container = document.getElementById('evaluation-members-list');
  if (container) {
    container.innerHTML = '';
    state.members.forEach((member) => {
      const memberTasks = state.tasks.filter((t) => t.assigneeName === member.name);
      const doneCount = memberTasks.filter((t) => t.status === 'done').length;

      const row = document.createElement('div');
      row.className = 'member-evaluation-row';
      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <div style="width:32px; height:32px; border-radius:50%; background:var(--color-primary-light); color:var(--color-primary); font-weight:700; display:flex; align-items:center; justify-content:center; font-size:0.875rem;">
            ${escapeHtml(member.name.charAt(0))}
          </div>
          <div>
            <strong>${escapeHtml(member.name)}</strong>
            <span style="color:var(--color-text-muted); font-size:var(--font-size-support-text);"> · ${escapeHtml(member.role)}</span>
          </div>
        </div>
        <div style="font-size:var(--font-size-support-text); font-weight:600; color:var(--color-text-main);">
          ${doneCount} / ${memberTasks.length} tehtävää valmiina
        </div>
      `;
      container.appendChild(row);
    });
  }

  // Asetetaan tekstikenttään nykyinen arvo
  const freeText = document.getElementById('evaluation-free-text') as HTMLTextAreaElement;
  if (freeText && state.evaluation.feedbackText) {
    freeText.value = state.evaluation.feedbackText;
  }

  // Päivitetään tähtien visuaalinen tila
  updateStarsVisual('stars-rules', state.evaluation.rulesScore, 'score-text-rules');
  updateStarsVisual('stars-roles', state.evaluation.rolesScore, 'score-text-roles');
  updateStarsVisual('stars-contribution', state.evaluation.contributionScore, 'score-text-contribution');

  // Jos arviointi on jo lähetetty, näytetään kiitosbanneri
  const successBanner = document.getElementById('evaluation-success-container');
  const summaryDetails = document.getElementById('evaluation-summary-details');
  if (state.evaluation.isSubmitted && successBanner && summaryDetails) {
    const avg = ((state.evaluation.rulesScore + state.evaluation.rolesScore + state.evaluation.contributionScore) / 3).toFixed(1);
    successBanner.style.display = 'flex';
    summaryDetails.textContent = `Kokonaisarvosana: ${avg} / 5.0 tähteä · Lähetetty: ${state.evaluation.submittedAt || 'Äskettäin'}`;
  }
}

/**
 * Päivittää tähtirivin aktiiviset tähdet ja tekstin
 */
function updateStarsVisual(rowId: string, score: number, scoreTextId: string): void {
  const row = document.getElementById(rowId);
  const scoreText = document.getElementById(scoreTextId);
  if (!row) return;

  row.setAttribute('data-rating', score.toString());
  if (scoreText) scoreText.textContent = `${score} / 5`;

  const starBtns = row.querySelectorAll('.star-btn');
  starBtns.forEach((btn) => {
    const val = parseInt(btn.getAttribute('data-val') || '0', 10);
    if (val <= score) {
      btn.classList.add('active');
      btn.setAttribute('aria-checked', val === score ? 'true' : 'false');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-checked', 'false');
    }
  });
}

function initEvaluationScreen(): void {
  // Tähtiarviointien interaktiivisuus (WCAG näppäimistö ja klikkaus)
  const starRows = [
    { rowId: 'stars-rules', scoreKey: 'rulesScore', textId: 'score-text-rules' },
    { rowId: 'stars-roles', scoreKey: 'rolesScore', textId: 'score-text-roles' },
    { rowId: 'stars-contribution', scoreKey: 'contributionScore', textId: 'score-text-contribution' },
  ] as const;

  starRows.forEach(({ rowId, scoreKey, textId }) => {
    const row = document.getElementById(rowId);
    if (!row) return;

    const btns = row.querySelectorAll('.star-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-val') || '1', 10);
        state.evaluation[scoreKey] = val;
        saveState();
        updateStarsVisual(rowId, val, textId);
        announceToScreenReader(`Arvosanaksi valittu ${val} / 5.`);
      });
    });
  });

  // Tallenna ja lähetä arviointi -painike
  const submitBtn = document.getElementById('btn-submit-evaluation');
  const freeText = document.getElementById('evaluation-free-text') as HTMLTextAreaElement;
  const successBanner = document.getElementById('evaluation-success-container');
  const summaryDetails = document.getElementById('evaluation-summary-details');

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      state.evaluation.feedbackText = freeText?.value.trim() || '';
      state.evaluation.isSubmitted = true;
      const now = new Date();
      state.evaluation.submittedAt = `${now.toLocaleDateString('fi-FI')} klo ${now.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}`;
      saveState();

      const avg = ((state.evaluation.rulesScore + state.evaluation.rolesScore + state.evaluation.contributionScore) / 3).toFixed(1);

      if (successBanner && summaryDetails) {
        successBanner.style.display = 'flex';
        summaryDetails.textContent = `Kokonaisarvosana: ${avg} / 5.0 tähteä · Lähetetty: ${state.evaluation.submittedAt}`;
      }

      showToast('Arviointi tallennettu ja lähetetty onnistuneesti!');
      announceToScreenReader(`Arviointi lähetetty! Keskiarvo: ${avg} viidestä. Kiitos palautteesta!`);

      // Vieritetään viesti näkyviin
      successBanner?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}

// ----------------------------------------------------------------------------
// 6. YLEISET TAPAHTUMANKUUNTELIJAT JA ALUSTUS
// ----------------------------------------------------------------------------

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Alustaa navigaatiopalkin klikkaukset
 */
function initNavigation(): void {
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target) {
        switchScreen(target);
      }
    });
  });

  const brandLink = document.getElementById('brand-link');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchScreen('view-workspace');
    });
  }

  // Datan nollaus- / palautuspainike kokeilua varten
  const resetBtn = document.getElementById('btn-reset-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      state.hasJoinedWorkspace = false;
      saveState();
      updateHeaderWorkspaceBadge();
      updateNavigationLockState();
      initWorkspaceScreen();
      initRulesScreen();
      renderTaskBoard();
      renderIssuesScreen();
      renderEvaluationScreen();
      switchScreen('view-workspace');
      showToast('Oletustiedot palautettu! Työtila nollattu.');
      announceToScreenReader('Oletustiedot palautettu. Työtila vaaditaan.');
    });
  }
}

// Käynnistetään sovellus luotettavasti
function startApp(): void {
  updateHeaderWorkspaceBadge();
  updateNavigationLockState();
  initNavigation();
  initWorkspaceScreen();
  initRulesScreen();
  initTaskScreen();
  initIssuesScreen();
  initEvaluationScreen();

  // Jos käyttäjä ei ole vielä perustanut tai liittynyt työtilaan,
  // pidetään näyttönä ehdottomasti työtilanäkymä
  if (!state.hasJoinedWorkspace) {
    switchScreen('view-workspace');
  } else {
    switchScreen(state.activeScreen || 'view-rules');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

