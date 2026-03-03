'use strict';

// ════════════════════════════════════════════
// EXIBLOX v3 — Браузерная версия
// Облачное хранилище игр через window.storage
// ════════════════════════════════════════════

const EXB = {
  user: null,
  users: {},
  games: [],
  tab: 'home',
  studioObjects: [],
  studioTool: 'block',
  studioColor: '#4a9a30',
  studioSelObj: null,
  studioDragging: null,
  studioProjectName: 'Новый проект',
  studioScrollX: 0,
  studioScrollY: 0,
  studioPanning: false,
  studioPanStart: null,
  aiHistory: [],
  TILE: 40,
  CANVAS_W: 3200,
  CANVAS_H: 1200,
  _publishing: false,
  _studioEditing: false,
  _aiTyping: false,
  _cloudReady: false,
};

// ── Скины стикменов ──
const EXB_SKINS = [
  { id:'red',    name:'Красный',               bodyColor:'#e74c3c', headColor:'#e74c3c', capColor:null,     limbColor:'#c0392b' },
  { id:'white',  name:'Белый с красной кепкой', bodyColor:'#ecf0f1', headColor:'#ecf0f1', capColor:'#e74c3c', limbColor:'#bdc3c7' },
  { id:'blue',   name:'Голубой',               bodyColor:'#3498db', headColor:'#3498db', capColor:null,     limbColor:'#2980b9' },
  { id:'orange', name:'Оранжевый',             bodyColor:'#e67e22', headColor:'#e67e22', capColor:null,     limbColor:'#d35400' },
];

const EXB_BASEPLATE = [
  {type:'block',    x:0,    y:760, w:3200, h:40,  color:'#4a9a30'},
  {type:'block',    x:200,  y:620, w:160,  h:20,  color:'#2980b9'},
  {type:'block',    x:460,  y:520, w:160,  h:20,  color:'#8e44ad'},
  {type:'block',    x:700,  y:420, w:160,  h:20,  color:'#c0392b'},
  {type:'spawn',    x:80,   y:680, w:40,   h:40,  color:'#00b2ff'},
  {type:'coin',     x:260,  y:580, w:30,   h:30,  color:'#FFD700'},
  {type:'coin',     x:520,  y:480, w:30,   h:30,  color:'#FFD700'},
  {type:'coin',     x:760,  y:380, w:30,   h:30,  color:'#FFD700'},
];

const EXB_ICONS  = ['🎮','🎯','🏆','⚡','🌟','🔥','💎','🎲','🚀','🦊'];
const EXB_COLORS = ['#7c3aed','#1a6fa8','#b8860b','#ba5a00','#8b0000','#2d5a1b'];

const EXB_TOOLS = [
  {id:'select',   label:'🖱 Выбор'},
  {id:'block',    label:'🧱 Блок'},
  {id:'platform', label:'🟫 Платформа'},
  {id:'spawn',    label:'📍 Спавн'},
  {id:'coin',     label:'🪙 Монета'},
  {id:'enemy',    label:'💥 Враг'},
  {id:'spike',    label:'🔺 Шип'},
  {id:'spring',   label:'🟡 Пружина'},
  {id:'ice',      label:'🧊 Лёд'},
  {id:'lava',     label:'🌋 Лава'},
  {id:'deco',     label:'🌲 Декор'},
  {id:'eraser',   label:'🧹 Ластик'},
];

const EXB_BLOCK_COLORS = {
  block:'#4a9a30', platform:'#8B6914', spawn:'#00b2ff',
  coin:'#FFD700',  enemy:'#e74c3c',  spike:'#888',
  spring:'#f1c40f',ice:'#aee6f5',    lava:'#ff4500',
  deco:'#2ecc71',
};

// ── Временное хранилище иконки при публикации ──
let _exbPublishIconData = null;

// ════════════════════════════════════════════
// CLOUD STORAGE — общее облако для ВСЕХ
// ════════════════════════════════════════════

function exbHasCloud() {
  if (typeof window !== 'undefined' && typeof window.storage !== 'undefined') {
    return true;
  }
  return false;
}

async function exbCloudLoadGames() {
  // Claude.ai shared storage — видят ВСЕ пользователи!
  if (typeof window !== 'undefined' && typeof window.storage !== 'undefined') {
    try {
      const result = await window.storage.get('exiblox_games_v3', true); // shared=true!
      if (result && result.value) {
        const games = JSON.parse(result.value);
        console.log(`☁️ Загружено ${games.length} игр из общего облака`);
        return games;
      }
      return [];
    } catch (e) {
      console.error('window.storage load error:', e);
    }
  }
  // Fallback: localStorage
  return JSON.parse(localStorage.getItem('exiblox_games') || '[]');
}

async function exbCloudSaveGames() {
  let saved = false;

  // Claude.ai shared storage — сохраняем для ВСЕХ!
  if (typeof window !== 'undefined' && typeof window.storage !== 'undefined') {
    try {
      await window.storage.set('exiblox_games_v3', JSON.stringify(EXB.games), true); // shared=true!
      console.log(`✅ ${EXB.games.length} игр сохранено в общем облаке`);
      saved = true;
    } catch (e) {
      console.error('window.storage save error:', e);
    }
  }

  // Всегда сохраняем в localStorage как backup
  localStorage.setItem('exiblox_games', JSON.stringify(EXB.games));
}

// ── INIT ─────────────────────────────────────
async function initExiblox() {
  EXB.users = JSON.parse(localStorage.getItem('exiblox_users') || '{}');
  EXB.user  = JSON.parse(localStorage.getItem('exiblox_curuser') || 'null');
  EXB.skin  = localStorage.getItem('exiblox_skin') || 'red';

  const root = el('exiblox-root');
  if (root) {
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:#0a0c14;gap:16px;">
        <div style="font-size:42px;font-weight:900;background:linear-gradient(135deg,#00b2ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">✦ Exiblox v3</div>
        <div style="color:rgba(255,255,255,.4);font-size:12px;">☁️ Загрузка игр из общего облака...</div>
        <div style="width:180px;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;">
          <div style="height:100%;background:linear-gradient(90deg,#00b2ff,#7c3aed);border-radius:2px;animation:exbLoad .8s ease infinite alternate;width:60%;"></div>
        </div>
        <div style="color:rgba(255,255,255,.25);font-size:11px;">Игры видны всем пользователям 🌍</div>
      </div>
      <style>@keyframes exbLoad{from{transform:translateX(-20%)}to{transform:translateX(120%)}}</style>`;
  }

  // Загружаем игры из ОБЩЕГО облака (shared=true)
  EXB.games = await exbCloudLoadGames();
  EXB._cloudReady = true;

  exbRender();
}

function exbSaveUsers()   { localStorage.setItem('exiblox_users', JSON.stringify(EXB.users)); }
function exbSaveCurUser() { localStorage.setItem('exiblox_curuser', JSON.stringify(EXB.user)); }
async function exbSaveGames() { await exbCloudSaveGames(); }

// ── ROOT RENDER ──────────────────────────────
function exbRender() {
  const root = el('exiblox-root');
  if (!root) return;
  if (!EXB.user) {
    exbRenderAuth(root);
  } else {
    exbRenderMain(root);
  }
}

// ════════════════════════════════════════════
// AUTH SCREEN
// ════════════════════════════════════════════
function exbRenderAuth(root) {
  root.innerHTML = `
  <div style="display:flex;align-items:center;justify-content:center;height:100%;background:linear-gradient(160deg,#0a0c14,#0f1824);">
    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:40px 50px;width:420px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.6);">
      <div style="font-size:52px;font-weight:900;background:linear-gradient(135deg,#00b2ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px;">✦ Exiblox</div>
      <div style="color:rgba(255,255,255,.4);font-size:13px;margin-bottom:28px;">v3 — Game Platform · ${EXB.games.length} игр в ОБЩЕМ облаке 🌍</div>
      <div id="exb-auth-tabs" style="display:flex;background:rgba(255,255,255,.06);border-radius:10px;padding:4px;margin-bottom:24px;">
        <div class="exb-auth-tab active" onclick="exbAuthTab('login')" style="flex:1;padding:8px;border-radius:8px;cursor:pointer;font-size:13px;transition:.2s;">Войти</div>
        <div class="exb-auth-tab" onclick="exbAuthTab('register')" style="flex:1;padding:8px;border-radius:8px;cursor:pointer;font-size:13px;color:rgba(255,255,255,.5);transition:.2s;">Регистрация</div>
      </div>
      <div id="exb-auth-form"></div>
      <div style="margin-top:14px;">
        <div onclick="exbGuestLogin()" style="color:rgba(255,255,255,.4);font-size:12px;cursor:pointer;padding:8px;border-radius:8px;transition:.15s;" onmouseover="this.style.color='rgba(255,255,255,.7)'" onmouseout="this.style.color='rgba(255,255,255,.4)'">👤 Продолжить как гость</div>
      </div>
      <div id="exb-auth-err" style="color:#ff6b6b;font-size:12px;margin-top:8px;min-height:18px;"></div>
    </div>
  </div>
  <style>
    .exb-auth-tab.active{background:rgba(0,178,255,.25);color:#fff;}
    .exb-auth-tab:not(.active):hover{background:rgba(255,255,255,.08);}
    .exb-inp{width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:11px 14px;color:#fff;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;margin-bottom:10px;transition:border .2s;}
    .exb-inp:focus{border-color:#00b2ff;}
    .exb-inp::placeholder{color:rgba(255,255,255,.3);}
    .exb-btn{width:100%;padding:12px;border-radius:9px;border:none;font-size:13px;cursor:pointer;font-family:inherit;font-weight:600;transition:.2s;margin-top:4px;}
    .exb-btn-primary{background:linear-gradient(135deg,#00b2ff,#7c3aed);color:#fff;}
    .exb-btn-primary:hover{opacity:.85;}
    .exb-btn-secondary{background:rgba(255,255,255,.07);color:rgba(255,255,255,.6);}
    .exb-btn-secondary:hover{background:rgba(255,255,255,.12);}
  </style>`;
  exbAuthTab('login');
}

let exbCurrentAuthTab = 'login';
function exbAuthTab(tab) {
  exbCurrentAuthTab = tab;
  document.querySelectorAll('.exb-auth-tab').forEach((t,i) => {
    t.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='register'));
    t.style.color = t.classList.contains('active') ? '#fff' : 'rgba(255,255,255,.5)';
  });
  const form = el('exb-auth-form');
  if (!form) return;
  if (tab === 'login') {
    form.innerHTML = `
      <input class="exb-inp" id="exb-ln" placeholder="Никнейм">
      <input class="exb-inp" id="exb-lp" type="password" placeholder="Пароль" onkeydown="if(event.key==='Enter')exbLogin()">
      <button class="exb-btn exb-btn-primary" onclick="exbLogin()">Войти →</button>`;
  } else {
    form.innerHTML = `
      <input class="exb-inp" id="exb-rn" placeholder="Никнейм (мин. 3 символа)">
      <input class="exb-inp" id="exb-re" placeholder="Email">
      <input class="exb-inp" id="exb-rp" type="password" placeholder="Пароль (мин. 6 символов)">
      <input class="exb-inp" id="exb-rp2" type="password" placeholder="Повторите пароль" onkeydown="if(event.key==='Enter')exbRegister()">
      <button class="exb-btn exb-btn-primary" onclick="exbRegister()">Создать аккаунт →</button>`;
  }
}

function exbAuthErr(msg) {
  const e = el('exb-auth-err');
  if (e) e.textContent = msg;
  setTimeout(() => { if(el('exb-auth-err')) el('exb-auth-err').textContent=''; }, 3000);
}

function exbHashPw(pw) {
  let h = 0;
  for (let c of pw) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return h.toString(36);
}

function exbLogin() {
  const name = (el('exb-ln')?.value || '').trim();
  const pw   = el('exb-lp')?.value || '';
  if (!name || !pw) { exbAuthErr('Заполните все поля!'); return; }
  if (!EXB.users[name]) { exbAuthErr('Пользователь не найден!'); return; }
  if (EXB.users[name].pw !== exbHashPw(pw)) { exbAuthErr('Неверный пароль!'); return; }
  EXB.user = name;
  exbSaveCurUser();
  exbRender();
}

function exbRegister() {
  const name = (el('exb-rn')?.value || '').trim();
  const email= (el('exb-re')?.value || '').trim();
  const pw   = el('exb-rp')?.value || '';
  const pw2  = el('exb-rp2')?.value || '';
  if (!name || !email || !pw || !pw2) { exbAuthErr('Заполните все поля!'); return; }
  if (name.length < 3) { exbAuthErr('Никнейм >= 3 символа!'); return; }
  if (pw.length < 6)   { exbAuthErr('Пароль >= 6 символов!'); return; }
  if (pw !== pw2)      { exbAuthErr('Пароли не совпадают!'); return; }
  if (EXB.users[name]) { exbAuthErr('Ник уже занят!'); return; }
  const code = Math.random().toString(36).slice(2,10).toUpperCase();
  EXB.users[name] = { pw: exbHashPw(pw), email, code, ecoins:0, friends:[], requests:[], projects:[], pubGames:[], isGuest:false };
  exbSaveUsers();
  EXB.user = name;
  exbSaveCurUser();
  exbRender();
}

function exbGuestLogin() {
  if (!EXB.users['Guest']) {
    EXB.users['Guest'] = { pw:'', email:'guest@exiblox.com', code:'GUEST000', ecoins:0, friends:[], requests:[], projects:[], pubGames:[], isGuest:true };
    exbSaveUsers();
  }
  EXB.user = 'Guest';
  exbSaveCurUser();
  exbRender();
}

function exbLogout() {
  EXB.user = null;
  localStorage.removeItem('exiblox_curuser');
  exbRender();
}

// ════════════════════════════════════════════
// MAIN WINDOW
// ════════════════════════════════════════════
function exbRenderMain(root) {
  const me = EXB.users[EXB.user] || {};

  root.innerHTML = `
  <style>
    #exiblox-root{font-family:'Segoe UI',system-ui,sans-serif;color:#fff;}
    .exb-main{display:flex;height:100%;overflow:hidden;background:#111318;}
    .exb-topbar{height:56px;background:#0c0e14;display:flex;align-items:center;padding:0 20px;gap:12px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;}
    .exb-logo{font-size:18px;font-weight:900;background:linear-gradient(135deg,#00b2ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap;}
    .exb-search{flex:1;max-width:360px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:7px 14px;display:flex;align-items:center;gap:8px;}
    .exb-search input{background:none;border:none;outline:none;color:#fff;font-size:12px;width:100%;font-family:inherit;}
    .exb-search input::placeholder{color:rgba(255,255,255,.3);}
    .exb-user-info{margin-left:auto;display:flex;align-items:center;gap:10px;}
    .exb-robux{font-size:13px;font-weight:700;color:#FFD700;}
    .exb-sidebar{width:100px;background:#0a0c11;border-right:1px solid rgba(255,255,255,.05);display:flex;flex-direction:column;padding-top:8px;flex-shrink:0;}
    .exb-nav-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;cursor:pointer;border-radius:8px;margin:2px 6px;transition:.15s;font-size:10px;color:rgba(255,255,255,.5);}
    .exb-nav-btn:hover{background:rgba(255,255,255,.06);color:#fff;}
    .exb-nav-btn.exb-active{background:rgba(0,178,255,.15);color:#00b2ff;}
    .exb-nav-ico{font-size:20px;line-height:1;}
    .exb-content{flex:1;overflow-y:auto;padding:0;}
    .exb-content::-webkit-scrollbar{width:4px;}
    .exb-content::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px;}
    .exb-section{padding:22px 28px 28px;}
    .exb-sec-title{font-size:17px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
    .exb-cards-row{display:flex;gap:12px;flex-wrap:wrap;}
    .exb-game-card{width:192px;background:rgba(255,255,255,.05);border-radius:14px;overflow:hidden;cursor:pointer;transition:.15s;border:1px solid rgba(255,255,255,.07);flex-shrink:0;}
    .exb-game-card:hover{transform:translateY(-3px);border-color:rgba(0,178,255,.4);box-shadow:0 8px 24px rgba(0,178,255,.15);}
    .exb-card-thumb{height:120px;display:flex;align-items:center;justify-content:center;font-size:52px;overflow:hidden;}
    .exb-card-thumb img{width:100%;height:100%;object-fit:cover;}
    .exb-card-body{padding:10px 12px 12px;}
    .exb-card-name{font-size:12px;font-weight:700;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .exb-card-meta{font-size:10px;color:rgba(255,255,255,.4);display:flex;justify-content:space-between;}
    .exb-btn2{padding:8px 18px;border-radius:8px;border:none;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;transition:.15s;}
    .exb-btn2-blue{background:#00b2ff;color:#fff;}
    .exb-btn2-blue:hover{background:#0099e0;}
    .exb-btn2-red{background:#e74c3c;color:#fff;}
    .exb-btn2-red:hover{background:#c0392b;}
    .exb-btn2-gray{background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);}
    .exb-btn2-gray:hover{background:rgba(255,255,255,.17);}
    .exb-inp2{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:9px 12px;color:#fff;font-size:12px;font-family:inherit;outline:none;transition:border .2s;}
    .exb-inp2:focus{border-color:#00b2ff;}
    .exb-inp2::placeholder{color:rgba(255,255,255,.3);}
    .exb-studio-wrap{display:flex;height:100%;overflow:hidden;}
    .exb-studio-side{width:120px;background:#0a0c11;border-right:1px solid rgba(255,255,255,.07);padding:8px;display:flex;flex-direction:column;gap:4px;flex-shrink:0;}
    .exb-tool-btn{padding:8px 6px;border-radius:8px;cursor:pointer;font-size:11px;text-align:center;transition:.15s;color:rgba(255,255,255,.6);border:1px solid transparent;}
    .exb-tool-btn:hover{background:rgba(255,255,255,.08);color:#fff;}
    .exb-tool-btn.exb-tool-active{background:rgba(0,178,255,.2);border-color:rgba(0,178,255,.4);color:#00b2ff;}
    .exb-canvas-wrap{flex:1;position:relative;overflow:hidden;background:#1a2040;cursor:crosshair;}
    .exb-ai-wrap{display:flex;flex-direction:column;height:100%;background:#0d0f18;}
    .exb-ai-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}
    .exb-ai-bubble-bot{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:4px 14px 14px 14px;padding:10px 14px;font-size:13px;line-height:1.6;max-width:80%;word-break:break-word;}
    .exb-ai-bubble-user{background:linear-gradient(135deg,#00b2ff,#0078d4);border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13px;line-height:1.6;max-width:70%;align-self:flex-end;}
    .exb-ai-input-row{display:flex;gap:8px;padding:12px 16px;border-top:1px solid rgba(255,255,255,.07);background:rgba(0,0,0,.2);}
    .exb-ai-input{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 14px;color:#fff;font-size:13px;font-family:inherit;outline:none;}
    .exb-ai-input:focus{border-color:#00b2ff;}
    .exb-ai-input::placeholder{color:rgba(255,255,255,.3);}
    .exb-profile-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
    .exb-icon-drop{width:90px;height:90px;border-radius:16px;background:#1a2040;border:2px dashed rgba(255,255,255,.2);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:.2s;overflow:hidden;flex-shrink:0;}
    .exb-icon-drop:hover{border-color:#00b2ff;background:rgba(0,178,255,.08);}
    .exb-icon-drop img{width:100%;height:100%;object-fit:cover;}
    .exb-pub-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:flex;align-items:center;justify-content:center;}
    .exb-pub-modal{background:#1a1e2a;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:32px 36px;width:440px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.7);}
    .exb-pub-modal::-webkit-scrollbar{width:4px;}
    .exb-pub-modal::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px;}
    .exb-pub-label{font-size:12px;color:rgba(255,255,255,.5);margin-bottom:6px;display:block;}
  </style>
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <div class="exb-topbar">
      <div class="exb-logo">✦ Exiblox v3</div>
      <span style="background:rgba(0,178,255,.2);border:1px solid rgba(0,178,255,.3);border-radius:20px;padding:2px 8px;font-size:10px;color:#00b2ff;">☁️ Облако</span>
      <div class="exb-search">
        <span style="font-size:12px;opacity:.4">🔍</span>
        <input id="exb-search" placeholder="Поиск игр..." onkeydown="if(event.key==='Enter')exbDoSearch(this.value)">
      </div>
      <div class="exb-user-info">
        <span class="exb-robux">🪙 ${me.ecoins||0} E$</span>
        <span style="font-size:12px;color:rgba(255,255,255,.6);">${me.isGuest?'👤 Гость':'👤 '+EXB.user}</span>
        <button class="exb-btn2 exb-btn2-gray" onclick="exbRefreshGames()" style="padding:5px 12px;font-size:11px;" title="Обновить игры из облака">🔄</button>
        <button class="exb-btn2 exb-btn2-gray" onclick="exbLogout()" style="padding:5px 12px;font-size:11px;">Выйти</button>
      </div>
    </div>
    <div class="exb-main" style="flex:1;overflow:hidden;">
      <div class="exb-sidebar">
        ${[
          ['home','🏠','Главная'],
          ['store','🛒','Магазин'],
          ['studio','🛠','Studio'],
          ['friends','👥','Друзья'],
          ['publish','📤','Publish'],
          ['ai','🤖','AI'],
          ['avatar','🎭','Аватар'],
          ['profile','👤','Профиль'],
        ].map(([tab,ico,lbl])=>`
          <div class="exb-nav-btn ${EXB.tab===tab?'exb-active':''}" onclick="exbTab('${tab}')">
            <span class="exb-nav-ico">${ico}</span>
            <span>${lbl}</span>
          </div>`).join('')}
      </div>
      <div class="exb-content" id="exb-content"></div>
    </div>
  </div>`;
  exbTabContent(EXB.tab);
}

async function exbRefreshGames() {
  showNotif('Exiblox', '☁️ Синхронизация с облаком...', '🔄');
  EXB.games = await exbCloudLoadGames();
  showNotif('Exiblox', `✅ Загружено ${EXB.games.length} игр из облака!`, '☁️');
  exbTabContent(EXB.tab);
}

function exbTab(tab) {
  EXB.tab = tab;
  document.querySelectorAll('.exb-nav-btn').forEach(b => {
    const m = b.getAttribute('onclick').match(/'(\w+)'/);
    if (m) b.classList.toggle('exb-active', m[1] === tab);
  });
  exbTabContent(tab);
}

function exbTabContent(tab) {
  const c = el('exb-content');
  if (!c) return;
  const fns = {home:exbHome, store:exbStore, studio:exbStudio, friends:exbFriends, publish:exbPublish, ai:exbAI, avatar:exbAvatar, profile:exbProfile};
  const fn = fns[tab];
  if (fn) {
    const result = fn(c);
    if (result instanceof Promise) result.catch(err => console.error('Tab error:', err));
  }
}

// ════════════════════════════════════════════
// HOME — БЕЗ ПРЕДУПРЕЖДЕНИЙ
// ════════════════════════════════════════════
async function exbHome(c) {
  c.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><div style="color:rgba(255,255,255,.3);font-size:13px;">☁️ Загрузка игр...</div></div>`;
  EXB.games = await exbCloudLoadGames();

  const me = EXB.users[EXB.user] || {};
  const frs = me.friends || [];
  const allGames = EXB.games;
  const authors = [...new Set(allGames.map(g => g.author))].length;

  c.innerHTML = `
  <div class="exb-section">
    <div style="background:rgba(0,178,255,.08);border:1px solid rgba(0,178,255,.2);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">☁️</span>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:#00b2ff;">✅ Облачная платформа активна — игры видят ВСЕ!</div>
        <div style="font-size:11px;color:rgba(255,255,255,.5);">
          ${allGames.length} игр от ${authors} разработчиков · Доступно с любого устройства 🌍
        </div>
      </div>
      <button class="exb-btn2 exb-btn2-blue" onclick="exbRefreshGames()" style="font-size:10px;padding:5px 10px;">🔄 Обновить</button>
    </div>

    <div class="exb-sec-title">👥 Соединения (${frs.length})
      <button class="exb-btn2 exb-btn2-blue" onclick="exbTab('friends')" style="margin-left:auto;font-size:11px;">+ Добавить</button>
    </div>
    <div class="exb-cards-row" style="margin-bottom:28px;">
      ${frs.length ? frs.slice(0,8).map(f=>`
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:80px;">
          <div style="width:54px;height:54px;border-radius:50%;background:rgba(0,178,255,.2);display:flex;align-items:center;justify-content:center;font-size:24px;">👤</div>
          <span style="font-size:10px;color:rgba(255,255,255,.7);text-align:center;">${f.slice(0,10)}</span>
          <span style="font-size:9px;color:#2ecc71;">● Online</span>
        </div>`).join('') : '<span style="color:rgba(255,255,255,.3);font-size:13px;padding:16px 0;">Нет друзей. Добавьте по никнейму!</span>'}
    </div>

    ${allGames.length ? `
    <div class="exb-sec-title">🌍 Играть сейчас
      <span style="font-size:11px;color:rgba(255,255,255,.3);font-weight:400;">☁️ Облако · Все пользователи</span>
    </div>
    <div class="exb-cards-row" style="margin-bottom:28px;">${exbGameCards(allGames.slice(0,4))}</div>
    ${allGames.length>4?`
    <div class="exb-sec-title">⭐ Ещё игры</div>
    <div class="exb-cards-row" style="margin-bottom:28px;">${exbGameCards(allGames.slice(4))}</div>`:''}
    ` : `
    <div style="text-align:center;padding:50px 0;color:rgba(255,255,255,.25);font-size:14px;">
      🌍 Пока нет игр в облаке<br><br>
      <div style="font-size:12px;margin-bottom:16px;">Стань первым создателем!</div>
      <button class="exb-btn2 exb-btn2-blue" onclick="exbTab('studio')">🛠 Создать игру в Studio →</button>
    </div>`}
  </div>`;
}

// ── Карточки игр ──
function exbGameCards(games) {
  return games.map(g=>`
    <div class="exb-game-card" onclick="exbPlayGame('${g.id}')">
      <div class="exb-card-thumb" style="background:${g.color||'#1a2040'}">
        ${g.iconImage
          ? `<img src="${escHtmlExb(g.iconImage)}" alt="icon">`
          : `<span style="font-size:52px;">${g.icon||'🎮'}</span>`}
      </div>
      <div class="exb-card-body">
        <div class="exb-card-name">${escHtmlExb(g.name)}</div>
        <div class="exb-card-meta"><span>by ${escHtmlExb(g.author)}</span><span>👍 ${g.rating||'100%'}</span></div>
      </div>
    </div>`).join('');
}

// ════════════════════════════════════════════
// STORE — БЕЗ ПРЕДУПРЕЖДЕНИЙ
// ════════════════════════════════════════════
async function exbStore(c) {
  c.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><div style="color:rgba(255,255,255,.3);font-size:13px;">☁️ Синхронизация с облаком...</div></div>`;
  EXB.games = await exbCloudLoadGames();

  const authors = [...new Set(EXB.games.map(g => g.author))].length;

  c.innerHTML = `
  <div class="exb-section">
    <div style="display:flex;align-items:center;margin-bottom:18px;">
      <div class="exb-sec-title" style="margin-bottom:0;">🛒 Магазин Exiblox</div>
      <span style="margin-left:10px;font-size:11px;color:rgba(255,255,255,.4);">${EXB.games.length} игр · ${authors} разработчиков · ☁️ облако</span>
      <button class="exb-btn2 exb-btn2-gray" onclick="exbRefreshGames()" style="margin-left:auto;font-size:11px;padding:5px 12px;">🔄 Обновить</button>
    </div>

    <div style="background:rgba(0,178,255,.06);border:1px solid rgba(0,178,255,.15);border-radius:10px;padding:12px 16px;margin-bottom:18px;font-size:12px;color:rgba(255,255,255,.6);">
      <strong style="color:#00b2ff;">🌍 Глобальный магазин</strong> — все игры доступны с любого устройства.<br>
      Создай свою игру и она появится здесь для всех пользователей!
    </div>

    ${EXB.games.length ? `<div class="exb-cards-row">${exbGameCards(EXB.games)}</div>` : `
    <div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,.25);">
      <div style="font-size:48px;margin-bottom:16px;">🌍</div>
      <div style="font-size:15px;margin-bottom:8px;">Магазин пуст</div>
      <div style="font-size:12px;margin-bottom:20px;">Стань первым создателем игр в облаке!</div>
      <button class="exb-btn2 exb-btn2-blue" onclick="exbTab('studio')">🛠 Создать игру →</button>
    </div>`}
  </div>`;
}

// ════════════════════════════════════════════
// STUDIO
// ════════════════════════════════════════════
function exbStudio(c) {
  const me = EXB.users[EXB.user] || {};
  const projects = me.projects || [];

  if (projects.length > 0 && !EXB._studioEditing) {
    exbStudioProjectList(c, projects);
    return;
  }
  EXB._studioEditing = true;

  c.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:#0c0e14;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;flex-wrap:wrap;">
      <button class="exb-btn2 exb-btn2-blue" onclick="exbStudioSave()" style="font-size:11px;">💾 Сохранить</button>
      <button class="exb-btn2 exb-btn2-gray" onclick="EXB._studioEditing=false;exbTab('studio')" style="font-size:11px;">📋 Проекты</button>
      <button class="exb-btn2 exb-btn2-gray" onclick="exbStudioBaseplate()" style="font-size:11px;">🏗 Baseplate</button>
      <button class="exb-btn2" style="background:#2ecc71;color:#fff;font-size:11px;" onclick="exbStudioTest()">▶ Тест</button>
      ${me.isGuest ? '' : `<button class="exb-btn2" style="background:#7c3aed;color:#fff;font-size:11px;" onclick="exbPublishDialog()">📤 Publish</button>`}
      <button class="exb-btn2 exb-btn2-red" onclick="exbStudioClear()" style="font-size:11px;">🗑 Очистить</button>
      <input id="exb-proj-name" class="exb-inp2" value="${escHtmlExb(EXB.studioProjectName)}" style="width:160px;font-size:12px;" oninput="EXB.studioProjectName=this.value">
      <span style="margin-left:auto;font-size:11px;color:rgba(255,255,255,.3);">Объектов: <span id="exb-obj-count">${EXB.studioObjects.length}</span></span>
    </div>
    <div class="exb-studio-wrap" style="flex:1;overflow:hidden;">
      <div class="exb-studio-side" style="width:105px;overflow-y:auto;">
        <div style="font-size:9px;color:rgba(255,255,255,.4);padding:4px 5px 6px;letter-spacing:.5px;text-transform:uppercase;">Инструменты</div>
        ${EXB_TOOLS.map(t=>`<div class="exb-tool-btn ${EXB.studioTool===t.id?'exb-tool-active':''}" onclick="exbSetTool('${t.id}',this)" style="font-size:10px;padding:6px 4px;">${t.label}</div>`).join('')}
        <div style="height:1px;background:rgba(255,255,255,.07);margin:6px 0;"></div>
        <div style="font-size:9px;color:rgba(255,255,255,.4);padding:2px 5px 4px;letter-spacing:.5px;text-transform:uppercase;">Цвет</div>
        <div id="exb-color-prev" style="width:32px;height:22px;border-radius:6px;background:${EXB.studioColor};border:2px solid rgba(255,255,255,.2);cursor:pointer;margin:0 auto 6px;" onclick="exbPickColor()"></div>
        <input type="color" id="exb-color-pick" value="${EXB.studioColor}" oninput="EXB.studioColor=this.value;el('exb-color-prev').style.background=this.value" style="position:absolute;opacity:0;pointer-events:none;">
        <div style="height:1px;background:rgba(255,255,255,.07);margin:4px 0;"></div>
        <div style="font-size:9px;color:rgba(255,255,255,.4);padding:2px 5px 4px;text-transform:uppercase;">Камера</div>
        <div onclick="EXB.studioScrollX=0;EXB.studioScrollY=0;exbStudioRedraw()" style="font-size:9px;color:rgba(255,255,255,.5);text-align:center;cursor:pointer;padding:4px;border-radius:5px;background:rgba(255,255,255,.05);">🏠 Сброс</div>
      </div>
      <div class="exb-canvas-wrap" id="exb-studio-wrap" style="overflow:hidden;position:relative;">
        <canvas id="exb-studio-canvas" style="display:block;cursor:crosshair;"></canvas>
        <div style="position:absolute;bottom:6px;right:6px;font-size:10px;color:rgba(255,255,255,.25);pointer-events:none;" id="exb-scroll-info">0, 0</div>
      </div>
    </div>
  </div>`;
  requestAnimationFrame(exbStudioInitCanvas);
}

function exbStudioProjectList(c, projects) {
  c.innerHTML = `
  <div class="exb-section">
    <div style="display:flex;align-items:center;margin-bottom:20px;">
      <div class="exb-sec-title" style="margin-bottom:0;">🛠 Мои проекты</div>
      <button class="exb-btn2 exb-btn2-blue" style="margin-left:auto;font-size:11px;" onclick="EXB.studioObjects=[];EXB.studioProjectName='Новый проект';EXB._studioEditing=true;exbTab('studio')">+ Новый проект</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
      ${projects.map((p,i)=>`
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;transition:.15s;"
             onmouseover="this.style.borderColor='rgba(0,178,255,.5)';this.style.background='rgba(0,178,255,.08)'"
             onmouseout="this.style.borderColor='rgba(255,255,255,.08)';this.style.background='rgba(255,255,255,.05)'">
          <div style="font-size:28px;margin-bottom:8px;">🛠</div>
          <div style="font-size:13px;font-weight:700;margin-bottom:4px;">${escHtmlExb(p.name)}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.4);">Объектов: ${(p.objects||[]).length} · ${p.updated||'—'}</div>
          <div style="display:flex;gap:6px;margin-top:12px;">
            <button class="exb-btn2 exb-btn2-blue" style="font-size:10px;padding:5px 10px;" onclick="exbStudioOpenProject(${i})">✏️ Открыть</button>
            <button class="exb-btn2 exb-btn2-red" style="font-size:10px;padding:5px 10px;" onclick="exbStudioDeleteProject(${i})">🗑</button>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}

function exbStudioOpenProject(idx) {
  const me = EXB.users[EXB.user] || {};
  const p = (me.projects||[])[idx];
  if (!p) return;
  EXB.studioObjects = p.objects ? p.objects.map(o=>({...o})) : [];
  EXB.studioProjectName = p.name;
  EXB.studioScrollX = 0;
  EXB.studioScrollY = 0;
  EXB._studioEditing = true;
  exbTab('studio');
}

function exbStudioDeleteProject(idx) {
  if (!confirm('Удалить проект?')) return;
  const me = EXB.users[EXB.user] || {};
  me.projects = me.projects || [];
  me.projects.splice(idx, 1);
  exbSaveUsers();
  exbTab('studio');
}

function exbStudioInitCanvas() {
  const wrap = el('exb-studio-wrap');
  const canvas = el('exb-studio-canvas');
  if (!wrap || !canvas) return;
  canvas.width  = wrap.clientWidth  || 900;
  canvas.height = wrap.clientHeight || 480;
  EXB.studioPaintCtx = canvas.getContext('2d');
  EXB.studioScrollX = EXB.studioScrollX || 0;
  EXB.studioScrollY = EXB.studioScrollY || 0;
  exbStudioRedraw();

  canvas.addEventListener('mousedown',  exbStudioMouseDown);
  canvas.addEventListener('mousemove',  exbStudioMouseMove);
  canvas.addEventListener('mouseup',    exbStudioMouseUp);
  canvas.addEventListener('contextmenu',exbStudioRightClick);
  canvas.addEventListener('mouseleave', ()=>{ EXB.studioDragging=null; EXB.studioPanning=false; });
  canvas.addEventListener('wheel', e=>{
    e.preventDefault();
    EXB.studioScrollX = Math.max(0, EXB.studioScrollX + e.deltaX);
    EXB.studioScrollY = Math.max(0, EXB.studioScrollY + e.deltaY);
    const si = el('exb-scroll-info');
    if(si) si.textContent = `${Math.round(EXB.studioScrollX)}, ${Math.round(EXB.studioScrollY)}`;
    exbStudioRedraw();
  }, {passive:false});
}

function exbStudioMouseUp() {
  EXB.studioDragging = null;
  EXB.studioPanning  = false;
}

function exbStudioMouseDown(e) {
  e.preventDefault();
  if (e.button === 1 || (e.button === 2 && EXB.studioTool === 'select')) {
    EXB.studioPanning = true;
    EXB.studioPanStart = {x: e.clientX + EXB.studioScrollX, y: e.clientY + EXB.studioScrollY};
    return;
  }
  const {x, y} = exbStudioPos(e);
  const tool = EXB.studioTool;

  if (tool === 'eraser') {
    EXB.studioObjects = EXB.studioObjects.filter(o => !(x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h));
    exbStudioRedraw(); exbUpdateObjCount(); return;
  }
  if (tool === 'select') {
    EXB.studioSelObj = null;
    for (let i = EXB.studioObjects.length-1; i>=0; i--) {
      const o = EXB.studioObjects[i];
      if (x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h) {
        EXB.studioSelObj = o;
        EXB.studioDragging = {ox: x-o.x, oy: y-o.y};
        break;
      }
    }
    exbStudioRedraw(); return;
  }
  const TILE = EXB.TILE;
  const sx = Math.floor(x/TILE)*TILE;
  const sy = Math.floor(y/TILE)*TILE;
  const defColor = EXB_BLOCK_COLORS[tool] || '#888';
  const useColor = EXB.studioColor || defColor;

  let bw = TILE, bh = TILE;
  if (tool === 'block')    { bw = TILE*3; bh = TILE; }
  if (tool === 'platform') { bw = TILE*4; bh = TILE/2; }
  if (tool === 'spike')    { bw = TILE;   bh = TILE; }
  if (tool === 'spring')   { bw = TILE;   bh = TILE*1.5|0; }
  if (tool === 'lava')     { bw = TILE*2; bh = TILE/2; }
  if (tool === 'ice')      { bw = TILE*3; bh = TILE; }
  if (tool === 'deco')     { bw = TILE*2; bh = TILE*3; }

  EXB.studioObjects.push({type:tool, x:sx, y:sy, w:bw, h:bh, color:useColor});
  exbStudioRedraw(); exbUpdateObjCount();
}

function exbStudioMouseMove(e) {
  if (EXB.studioPanning && EXB.studioPanStart) {
    EXB.studioScrollX = Math.max(0, EXB.studioPanStart.x - e.clientX);
    EXB.studioScrollY = Math.max(0, EXB.studioPanStart.y - e.clientY);
    const si = el('exb-scroll-info');
    if(si) si.textContent = `${Math.round(EXB.studioScrollX)}, ${Math.round(EXB.studioScrollY)}`;
    exbStudioRedraw(); return;
  }
  if (EXB.studioTool === 'select' && EXB.studioSelObj && EXB.studioDragging) {
    const {x,y} = exbStudioPos(e);
    const TILE = EXB.TILE;
    EXB.studioSelObj.x = Math.floor((x - EXB.studioDragging.ox)/TILE)*TILE;
    EXB.studioSelObj.y = Math.floor((y - EXB.studioDragging.oy)/TILE)*TILE;
    exbStudioRedraw();
  }
}

function exbStudioRightClick(e) {
  e.preventDefault();
  const {x,y} = exbStudioPos(e);
  const idx = EXB.studioObjects.findLastIndex(o=>x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h);
  if (idx>=0) { EXB.studioObjects.splice(idx,1); exbStudioRedraw(); exbUpdateObjCount(); }
}

function exbStudioPos(e) {
  const r = el('exb-studio-canvas').getBoundingClientRect();
  return {
    x: e.clientX - r.left  + EXB.studioScrollX,
    y: e.clientY - r.top   + EXB.studioScrollY,
  };
}

function exbStudioRedraw() {
  const cv = EXB.studioPaintCtx;
  if (!cv) return;
  const canvas = el('exb-studio-canvas');
  const W = canvas.width, H = canvas.height;
  const TILE = EXB.TILE;
  const sx = EXB.studioScrollX, sy = EXB.studioScrollY;

  for (let i=0; i<H; i++) {
    const s = Math.floor(20 + i*0.03);
    cv.fillStyle = `rgb(${s},${s+8},58)`;
    cv.fillRect(0, i, W, 1);
  }

  cv.strokeStyle = 'rgba(255,255,255,.04)';
  cv.lineWidth = 1;
  const gox = sx % TILE, goy = sy % TILE;
  for (let x = -gox; x < W; x += TILE) { cv.beginPath(); cv.moveTo(x,0); cv.lineTo(x,H); cv.stroke(); }
  for (let y = -goy; y < H; y += TILE) { cv.beginPath(); cv.moveTo(0,y); cv.lineTo(W,y); cv.stroke(); }

  cv.fillStyle = 'rgba(255,255,255,.15)';
  cv.font = '9px monospace';
  for (let x=0; x<3200; x+=200) {
    const rx = x - sx;
    if (rx >= 0 && rx <= W) { cv.fillText(x, rx+2, 10); }
  }

  EXB.studioObjects.forEach(o => {
    const ox = o.x - sx, oy = o.y - sy;
    if (ox + o.w < 0 || ox > W || oy + o.h < 0 || oy > H) return;
    const sel = o === EXB.studioSelObj;
    const col = o.color || EXB_BLOCK_COLORS[o.type] || '#888';

    switch(o.type) {
      case 'block':
      case 'ice':
        cv.fillStyle = col; cv.fillRect(ox, oy, o.w, o.h);
        cv.fillStyle = 'rgba(255,255,255,.18)'; cv.fillRect(ox, oy, o.w, 8);
        break;
      case 'platform':
        cv.fillStyle = col; cv.fillRect(ox, oy, o.w, o.h);
        cv.fillStyle = 'rgba(255,255,255,.3)'; cv.fillRect(ox, oy, o.w, 4);
        break;
      case 'lava':
        cv.fillStyle = col; cv.fillRect(ox, oy, o.w, o.h);
        cv.fillStyle = '#ff6e00';
        for(let lx=0;lx<o.w;lx+=8){ const lh=4+3*Math.sin((lx+Date.now()/80)/6); cv.fillRect(ox+lx,oy,6,lh); }
        break;
      case 'spike':
        cv.fillStyle = col; cv.beginPath(); cv.moveTo(ox,oy+o.h); cv.lineTo(ox+o.w/2,oy); cv.lineTo(ox+o.w,oy+o.h); cv.closePath(); cv.fill();
        break;
      case 'spring':
        cv.fillStyle = '#555'; cv.fillRect(ox,oy+o.h-10,o.w,10);
        cv.strokeStyle = col; cv.lineWidth = 3;
        for(let si=0;si<4;si++){ const sy2=oy+o.h-10-si*((o.h-10)/4); cv.beginPath(); cv.ellipse(ox+o.w/2,sy2,o.w/2-3,4,0,0,Math.PI*2); cv.stroke(); }
        break;
      case 'spawn':
        cv.fillStyle = col; cv.beginPath(); cv.arc(ox+o.w/2,oy+o.h/2,o.w/2,0,Math.PI*2); cv.fill();
        cv.fillStyle='#fff'; cv.font='bold 16px serif'; cv.textAlign='center'; cv.fillText('S',ox+o.w/2,oy+o.h/2+6); cv.textAlign='left';
        break;
      case 'coin':
        cv.fillStyle=col; cv.beginPath(); cv.arc(ox+o.w/2,oy+o.h/2,o.w/2,0,Math.PI*2); cv.fill();
        cv.fillStyle='#c8860a'; cv.font='bold 13px serif'; cv.textAlign='center'; cv.fillText('E$',ox+o.w/2,oy+o.h/2+5); cv.textAlign='left';
        break;
      case 'enemy':
        cv.fillStyle=col; cv.fillRect(ox,oy,o.w,o.h);
        cv.fillStyle='#fff'; cv.font='16px serif'; cv.textAlign='center'; cv.fillText('💀',ox+o.w/2,oy+o.h/2+6); cv.textAlign='left';
        break;
      case 'deco':
        cv.fillStyle='rgba(0,100,30,.5)'; cv.fillRect(ox+o.w/4,oy+o.h*0.4,o.w/2,o.h*0.6);
        cv.fillStyle=col; cv.beginPath(); cv.ellipse(ox+o.w/2,oy+o.h*0.4,o.w/2,o.h*0.5,0,0,Math.PI*2); cv.fill();
        break;
      default:
        cv.fillStyle=col; cv.fillRect(ox,oy,o.w,o.h);
    }

    if (sel) {
      cv.strokeStyle='#fff'; cv.lineWidth=2; cv.setLineDash([4,4]);
      cv.strokeRect(ox-1,oy-1,o.w+2,o.h+2); cv.setLineDash([]);
    }
  });

  if (sx > 10) {
    const g = cv.createLinearGradient(0,0,20,0);
    g.addColorStop(0,'rgba(0,0,0,.4)'); g.addColorStop(1,'transparent');
    cv.fillStyle=g; cv.fillRect(0,0,20,H);
  }
}

function exbUpdateObjCount() { const c=el('exb-obj-count'); if(c)c.textContent=EXB.studioObjects.length; }
function exbSetTool(tool,btn) { EXB.studioTool=tool; document.querySelectorAll('.exb-tool-btn').forEach(b=>b.classList.remove('exb-tool-active')); if(btn)btn.classList.add('exb-tool-active'); }
function exbPickColor() { const cp=el('exb-color-pick'); if(cp)cp.click(); }

function exbStudioSave() {
  const name=EXB.studioProjectName.trim()||'Без названия';
  const me=EXB.users[EXB.user]; if(!me)return;
  const proj=me.projects=me.projects||[];
  const idx=proj.findIndex(p=>p.name===name);
  const data={name,objects:EXB.studioObjects.map(o=>({...o})),updated:new Date().toLocaleString('ru')};
  if(idx>=0)proj[idx]=data;else proj.unshift(data);
  exbSaveUsers();
  showNotif('ExiStudio',`Проект "${name}" сохранён`,'💾');
}

function exbStudioBaseplate() {
  EXB.studioObjects=EXB_BASEPLATE.map(o=>({...o}));
  EXB.studioProjectName='Baseplate';
  EXB.studioScrollX=0; EXB.studioScrollY=0; EXB._studioEditing=true;
  const ni=el('exb-proj-name'); if(ni)ni.value='Baseplate';
  exbStudioRedraw(); exbUpdateObjCount();
  showNotif('ExiStudio','Baseplate загружен!','🏗');
}

function exbStudioClear() { if(!confirm('Очистить все объекты?'))return; EXB.studioObjects=[]; exbStudioRedraw(); exbUpdateObjCount(); }

function exbStudioTest() {
  const game={name:'Тест: '+EXB.studioProjectName,icon:'🛠',color:'#1a2040',iconImage:null,objects:EXB.studioObjects.map(o=>({...o}))};
  exbOpenGame(game);
}

// ════════════════════════════════════════════
// PUBLISH DIALOG
// ════════════════════════════════════════════
function exbPublishDialog() {
  const me=EXB.users[EXB.user]||{};
  if(me.isGuest){showNotif('Exiblox','Гости не могут публиковать!','📤');return;}
  _exbPublishIconData=null;

  const overlay=document.createElement('div');
  overlay.className='exb-pub-overlay';
  overlay.innerHTML=`
    <div class="exb-pub-modal" onclick="event.stopPropagation()">
      <div style="font-size:20px;font-weight:700;margin-bottom:22px;display:flex;align-items:center;gap:10px;">📤 Опубликовать игру</div>
      <label class="exb-pub-label">Название игры</label>
      <input id="exb-pub-name" class="exb-inp2" value="${escHtmlExb(EXB.studioProjectName)||'Untitled Game'}" style="width:100%;box-sizing:border-box;margin-bottom:14px;">
      <label class="exb-pub-label">Описание</label>
      <textarea id="exb-pub-desc" class="exb-inp2" rows="3" style="width:100%;resize:none;box-sizing:border-box;margin-bottom:18px;" placeholder="Расскажи о своей игре..."></textarea>
      <label class="exb-pub-label">Иконка игры</label>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
        <div class="exb-icon-drop" id="exb-icon-drop" onclick="el('exb-icon-file').click()"
             ondragover="event.preventDefault();this.style.borderColor='#00b2ff'"
             ondragleave="this.style.borderColor='rgba(255,255,255,.2)'"
             ondrop="exbIconDropHandler(event)">
          <span id="exb-icon-placeholder" style="font-size:28px;opacity:.35">🎮</span>
        </div>
        <div>
          <button class="exb-btn2 exb-btn2-blue" onclick="el('exb-icon-file').click()" style="font-size:11px;display:block;margin-bottom:6px;">📁 Загрузить картинку</button>
          <button class="exb-btn2 exb-btn2-gray" onclick="exbIconClear()" style="font-size:11px;display:block;margin-bottom:8px;">✕ Убрать иконку</button>
          <div style="font-size:10px;color:rgba(255,255,255,.3);line-height:1.5;">PNG, JPG, GIF, WebP<br>Рекомендуется 256×256 px</div>
        </div>
      </div>
      <input type="file" id="exb-icon-file" accept="image/*" style="display:none;" onchange="exbIconFileChange(this)">
      <div style="display:flex;gap:10px;margin-top:6px;">
        <button class="exb-btn2 exb-btn2-blue" id="exb-pub-submit" style="flex:1;font-size:13px;padding:11px;" onclick="exbDoPublish()">🚀 Опубликовать</button>
        <button class="exb-btn2 exb-btn2-gray" onclick="this.closest('.exb-pub-overlay').remove()">Отмена</button>
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,.25);text-align:center;margin-top:10px;">🌍 Игра будет видна ВСЕМ пользователям в облаке!</div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click',()=>overlay.remove());
}

function exbIconFileChange(input) {
  const file=input.files[0]; if(!file)return;
  if(file.size>1024*1024){showNotif('Exiblox','Картинка слишком большая (макс. 1 МБ)!','⚠️');return;}
  const reader=new FileReader();
  reader.onload=(e)=>{_exbPublishIconData=e.target.result;exbIconUpdatePreview(_exbPublishIconData);};
  reader.readAsDataURL(file);
}

function exbIconDropHandler(e) {
  e.preventDefault();
  const file=e.dataTransfer?.files?.[0]; if(!file||!file.type.startsWith('image/'))return;
  if(file.size>1024*1024){showNotif('Exiblox','Слишком большой файл (макс 1МБ)','⚠️');return;}
  const reader=new FileReader();
  reader.onload=(ev)=>{_exbPublishIconData=ev.target.result;exbIconUpdatePreview(_exbPublishIconData);};
  reader.readAsDataURL(file);
  const drop=el('exb-icon-drop'); if(drop)drop.style.borderColor='rgba(255,255,255,.2)';
}

function exbIconUpdatePreview(src) {
  const drop=el('exb-icon-drop'),ph=el('exb-icon-placeholder'); if(!drop)return;
  if(ph)ph.style.display='none';
  const old=drop.querySelector('img'); if(old)old.remove();
  const img=document.createElement('img');
  img.src=src; img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:14px;';
  drop.appendChild(img);
}

function exbIconClear() {
  _exbPublishIconData=null;
  const drop=el('exb-icon-drop'),ph=el('exb-icon-placeholder'); if(!drop)return;
  const img=drop.querySelector('img'); if(img)img.remove();
  if(ph)ph.style.display='';
}

async function exbDoPublish() {
  if(EXB._publishing)return;
  EXB._publishing=true;
  const btn=el('exb-pub-submit');
  if(btn){btn.disabled=true;btn.textContent='⏳ Публикуем в облаке...';}

  const name=(el('exb-pub-name')?.value||'').trim()||'Untitled Game';
  const desc=(el('exb-pub-desc')?.value||'').trim()||'Без описания';

  const duplicate=EXB.games.find(g=>g.author===EXB.user&&g.name===name);
  if(duplicate){
    duplicate.objects=EXB.studioObjects.map(o=>({...o}));
    duplicate.iconImage=_exbPublishIconData||duplicate.iconImage||null;
    duplicate.updated=new Date().toLocaleDateString('ru');
    await exbSaveGames();
    document.querySelector('.exb-pub-overlay')?.remove();
    showNotif('Exiblox',`Игра "${name}" обновлена! ✏️`,'📤');
    EXB._publishing=false;
    return;
  }

  const id=Math.random().toString(36).slice(2,10).toUpperCase();
  const game={
    id,name,desc,author:EXB.user,
    objects:EXB.studioObjects.map(o=>({...o})),
    icon:EXB_ICONS[Math.floor(Math.random()*EXB_ICONS.length)],
    iconImage:_exbPublishIconData||null,
    color:EXB_COLORS[Math.floor(Math.random()*EXB_COLORS.length)],
    rating:'100%',players:'0',
    created:new Date().toLocaleDateString('ru'),
  };

  EXB.games.unshift(game);
  await exbSaveGames(); // сохраняем с shared=true — видят ВСЕ!

  const me=EXB.users[EXB.user];
  if(me){
    me.pubGames=me.pubGames||[]; me.pubGames.push(id);
    me.ecoins=(me.ecoins||0)+5; exbSaveUsers();
    const robuxEl=document.querySelector('.exb-robux');
    if(robuxEl)robuxEl.textContent=`🪙 ${me.ecoins} E$`;
  }

  document.querySelector('.exb-pub-overlay')?.remove();
  showNotif('Exiblox',`🌍 "${name}" опубликована — видна ВСЕМ пользователям! +5 E$ 🎉`,'☁️');
  EXB._publishing=false;
}

// ════════════════════════════════════════════
// FRIENDS
// ════════════════════════════════════════════
function exbFriends(c) {
  const me=EXB.users[EXB.user]||{},frs=me.friends||[],reqs=me.requests||[];
  c.innerHTML=`
  <div class="exb-section">
    <div style="display:flex;align-items:center;margin-bottom:20px;">
      <div class="exb-sec-title" style="margin-bottom:0;">👥 Друзья</div>
      ${me.isGuest?'':` <button class="exb-btn2 exb-btn2-blue" style="margin-left:auto;font-size:11px;" onclick="exbAddFriendDlg()">+ Добавить</button>`}
    </div>
    ${!me.isGuest&&me.code?`<div class="exb-profile-card"><span style="font-size:13px;">🎫 Ваш код: <strong style="color:#00b2ff;">${me.code}</strong></span><span style="font-size:11px;color:rgba(255,255,255,.4);">Поделитесь с друзьями</span></div>`:''}
    ${reqs.length?`<div class="exb-sec-title" style="font-size:14px;margin-top:18px;">📩 Запросы (${reqs.length})</div>
    ${reqs.map(r=>`<div class="exb-profile-card"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">👤</span><span style="font-size:13px;font-weight:600;">${r}</span></div><button class="exb-btn2 exb-btn2-blue" style="font-size:11px;" onclick="exbAcceptFriend('${r}')">Принять ✓</button></div>`).join('')}`:''}
    <div class="exb-sec-title" style="font-size:14px;margin-top:18px;">Мои друзья (${frs.length})</div>
    ${frs.length?frs.map(f=>`<div class="exb-profile-card"><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:50%;background:rgba(0,178,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div><div><div style="font-size:13px;font-weight:600;">${f}</div><div style="font-size:11px;color:#2ecc71;">● Online</div></div></div></div>`).join(''):'<div style="color:rgba(255,255,255,.3);font-size:13px;padding:20px 0;">Нет друзей</div>'}
  </div>`;
}

function exbAddFriendDlg() {
  const me=EXB.users[EXB.user]||{};
  if(me.isGuest){showNotif('Exiblox','Гости не могут добавлять друзей!','👥');return;}
  const nick=prompt('Введите никнейм или код друга:'); if(!nick)return;
  const target=Object.keys(EXB.users).find(u=>u===nick||EXB.users[u].code===nick.toUpperCase());
  if(!target){showNotif('Exiblox','Пользователь не найден!','❌');return;}
  if(target===EXB.user){showNotif('Exiblox','Нельзя добавить себя!','❌');return;}
  if(me.friends&&me.friends.includes(target)){showNotif('Exiblox','Уже в друзьях!','✅');return;}
  const them=EXB.users[target]; them.requests=them.requests||[];
  if(them.requests.includes(EXB.user)){showNotif('Exiblox','Запрос уже отправлен!','📩');return;}
  them.requests.push(EXB.user); exbSaveUsers();
  showNotif('Exiblox',`Запрос отправлен: ${target}`,'📩');
}

function exbAcceptFriend(from) {
  const me=EXB.users[EXB.user]; if(!me)return;
  me.requests=(me.requests||[]).filter(r=>r!==from);
  me.friends=me.friends||[]; if(!me.friends.includes(from))me.friends.push(from);
  const them=EXB.users[from];
  if(them){them.friends=them.friends||[];if(!them.friends.includes(EXB.user))them.friends.push(EXB.user);}
  exbSaveUsers(); exbTab('friends');
  showNotif('Exiblox',from+' добавлен в друзья!','✅');
}

// ════════════════════════════════════════════
// PUBLISH TAB
// ════════════════════════════════════════════
function exbPublish(c) {
  const me=EXB.users[EXB.user]||{};
  if(me.isGuest){c.innerHTML=`<div style="text-align:center;padding:80px;color:rgba(255,255,255,.3);">📤 Гости не могут публиковать игры.<br><br><button class="exb-btn2 exb-btn2-blue" onclick="exbLogout()">Создать аккаунт</button></div>`;return;}
  const myGames=EXB.games.filter(g=>g.author===EXB.user);
  c.innerHTML=`
  <div class="exb-section">
    <div style="display:flex;align-items:center;margin-bottom:18px;">
      <div class="exb-sec-title" style="margin-bottom:0;">📤 Мои игры (${myGames.length})</div>
      <button class="exb-btn2 exb-btn2-blue" style="margin-left:auto;font-size:11px;" onclick="exbTab('studio')">🛠 Открыть Studio</button>
    </div>
    ${myGames.length?`<div class="exb-cards-row">${exbGameCards(myGames)}</div>`:'<div style="color:rgba(255,255,255,.3);font-size:13px;padding:30px 0;">У вас ещё нет опубликованных игр</div>'}
    <div style="margin-top:24px;padding:14px 18px;background:rgba(0,178,255,.07);border:1px solid rgba(0,178,255,.2);border-radius:12px;font-size:12px;color:rgba(255,255,255,.5);">
      ☁️ Игры хранятся в общем облаке — видны ВСЕМ пользователям на любом устройстве!
    </div>
  </div>`;
}

// ════════════════════════════════════════════
// AVATAR
// ════════════════════════════════════════════
function exbAvatar(c) {
  const skinId=EXB.skin||'red';
  c.innerHTML=`
  <div class="exb-section">
    <div class="exb-sec-title">🎭 Выбери скин персонажа</div>
    <div style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:20px;">Стикмен применится в игре автоматически</div>
    <div style="display:flex;gap:18px;flex-wrap:wrap;">
      ${EXB_SKINS.map(sk=>`
        <div onclick="exbSelectSkin('${sk.id}')" style="
            width:160px;background:${sk.id===skinId?'rgba(0,178,255,.2)':'rgba(255,255,255,.05)'};
            border:2px solid ${sk.id===skinId?'#00b2ff':'rgba(255,255,255,.08)'};
            border-radius:16px;padding:18px 12px 14px;cursor:pointer;text-align:center;transition:.2s;"
          onmouseover="this.style.borderColor='rgba(0,178,255,.6)'"
          onmouseout="this.style.borderColor='${sk.id===skinId?'#00b2ff':'rgba(255,255,255,.08)'}'">
          <canvas id="av-preview-${sk.id}" width="80" height="100" style="display:block;margin:0 auto 10px;"></canvas>
          <div style="font-size:13px;font-weight:700;">${sk.name}</div>
          ${sk.id===skinId?'<div style="font-size:11px;color:#00b2ff;margin-top:4px;">✓ Активен</div>':''}
        </div>`).join('')}
    </div>
  </div>`;
  EXB_SKINS.forEach(sk=>{
    const cv=document.getElementById(`av-preview-${sk.id}`)?.getContext('2d');
    if(!cv)return;
    exbDrawStickman(cv,40,85,sk,10,false,false,0);
  });
}

function exbSelectSkin(id) {
  EXB.skin=id; localStorage.setItem('exiblox_skin',id);
  exbAvatar(el('exb-content')); showNotif('Exiblox','Скин изменён!','🎭');
}

function exbDrawStickman(cv,cx,cy,sk,scale,jumping,facing,walkStep) {
  const s=scale||1,HL=18*s,AL=15*s,HS=10*s,BL=20*s;
  cv.lineWidth=2.5*s; cv.lineCap='round'; cv.strokeStyle=sk.limbColor;
  const legSwing=jumping?0:Math.sin(walkStep*.28)*22*s,legBend=jumping?-20*s:0;
  cv.beginPath(); cv.moveTo(cx,cy); cv.lineTo(cx-6*s+legSwing,cy+HL+legBend); cv.stroke();
  cv.beginPath(); cv.moveTo(cx,cy); cv.lineTo(cx+6*s-legSwing,cy+HL+legBend); cv.stroke();
  cv.strokeStyle=sk.bodyColor; cv.lineWidth=3*s;
  cv.beginPath(); cv.moveTo(cx,cy); cv.lineTo(cx,cy-BL); cv.stroke();
  cv.strokeStyle=sk.limbColor; cv.lineWidth=2.5*s;
  const armSwing=jumping?-30*s:Math.sin(walkStep*.28+Math.PI)*20*s,shoulderY=cy-BL+4*s;
  cv.beginPath(); cv.moveTo(cx,shoulderY); cv.lineTo(cx-AL+armSwing,shoulderY+10*s+(jumping?-10*s:0)); cv.stroke();
  cv.beginPath(); cv.moveTo(cx,shoulderY); cv.lineTo(cx+AL-armSwing,shoulderY+10*s+(jumping?-10*s:0)); cv.stroke();
  cv.fillStyle=sk.headColor; cv.strokeStyle=sk.limbColor; cv.lineWidth=2*s;
  cv.beginPath(); cv.arc(cx,cy-BL-HS,HS,0,Math.PI*2); cv.fill(); cv.stroke();
  if(sk.capColor){
    cv.fillStyle=sk.capColor;
    cv.beginPath(); cv.ellipse(cx,cy-BL-HS*2+4*s,HS+5*s,4*s,0,0,Math.PI*2); cv.fill();
    cv.fillRect(cx-HS,cy-BL-HS*2-10*s,HS*2,14*s);
  }
  cv.fillStyle='#1a1a1a';
  const ex=(facing<0?-4:3)*s;
  cv.beginPath(); cv.arc(cx+ex,cy-BL-HS-2*s,2*s,0,Math.PI*2); cv.fill();
}

// ════════════════════════════════════════════
// PROFILE
// ════════════════════════════════════════════
function exbProfile(c) {
  const me=EXB.users[EXB.user]||{};
  const curSkin=EXB_SKINS.find(s=>s.id===(EXB.skin||'red'))||EXB_SKINS[0];
  c.innerHTML=`
  <div class="exb-section" style="max-width:520px;">
    <div class="exb-sec-title">👤 Профиль</div>
    <div class="exb-profile-card" style="flex-direction:column;align-items:flex-start;gap:10px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <canvas id="profile-skin-prev" width="50" height="70"></canvas>
        <div>
          <div style="font-size:18px;font-weight:700;">${me.isGuest?'👤 Гость':'👤 '+EXB.user}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.4);">Скин: ${curSkin.name}</div>
        </div>
      </div>
      ${!me.isGuest?`<div style="font-size:12px;color:rgba(255,255,255,.4);">📧 ${me.email||'—'}</div>`:''}
      ${!me.isGuest?`<div style="font-size:12px;color:#00b2ff;">🎫 Код: ${me.code||'—'}</div>`:''}
      <div style="font-size:13px;font-weight:700;color:#FFD700;">🪙 ${me.ecoins||0} E$</div>
      <div style="font-size:12px;color:rgba(255,255,255,.4);">👥 Друзей: ${(me.friends||[]).length}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.4);">🛠 Проектов: ${(me.projects||[]).length}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.4);">📤 Опубликовано: ${(me.pubGames||[]).length}</div>
      <div style="font-size:12px;color:#2ecc71;">☁️ Облако активно — игры видны всем!</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="exb-btn2 exb-btn2-blue" onclick="exbTab('avatar')" style="font-size:11px;">🎭 Сменить скин</button>
      <button class="exb-btn2 exb-btn2-red" onclick="exbLogout()">🚪 Выйти</button>
      ${me.isGuest?`<button class="exb-btn2 exb-btn2-blue" onclick="exbLogout()">Создать аккаунт</button>`:''}
    </div>
  </div>`;
  const pc=document.getElementById('profile-skin-prev')?.getContext('2d');
  if(pc)exbDrawStickman(pc,25,60,curSkin,1,false,1,0);
}

// ════════════════════════════════════════════
// AI CHAT
// ════════════════════════════════════════════
function exbAI(c) {
  c.innerHTML=`
  <div class="exb-ai-wrap" style="height:calc(100vh - 160px);">
    <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.07);font-size:16px;font-weight:700;background:#0c0e14;flex-shrink:0;">
      🤖 Exiblox AI — Умный помощник
      <span style="font-size:11px;color:#2ecc71;margin-left:10px;">● Online</span>
    </div>
    <div class="exb-ai-msgs" id="exb-ai-msgs"></div>
    <div style="padding:8px 16px;border-top:1px solid rgba(255,255,255,.06);background:#0c0e14;flex-shrink:0;display:flex;gap:8px;flex-wrap:wrap;">
      ${['Как создать игру?','Что такое Baseplate?','Как опубликовать?','Как добавить друга?','Советы по Studio','Что ты умеешь?'].map(q=>`
        <div onclick="exbAIQuick('${q}')" style="padding:5px 12px;border-radius:16px;background:rgba(255,255,255,.07);font-size:11px;color:rgba(255,255,255,.6);cursor:pointer;border:1px solid rgba(255,255,255,.08);transition:.15s;" onmouseover="this.style.background='rgba(0,178,255,.25)';this.style.color='#fff'" onmouseout="this.style.background='rgba(255,255,255,.07)';this.style.color='rgba(255,255,255,.6)'">${q}</div>`).join('')}
    </div>
    <div class="exb-ai-input-row" style="flex-shrink:0;">
      <input class="exb-ai-input" id="exb-ai-inp" placeholder="Задай вопрос Exiblox AI..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();exbAISend();}">
      <button class="exb-btn2 exb-btn2-blue" onclick="exbAISend()" style="padding:10px 18px;">➤ Отправить</button>
    </div>
  </div>`;
  exbAIMsg('bot','Привет! Я **Exiblox AI** 🤖\n\n🌍 **ГЛОБАЛЬНАЯ ПЛАТФОРМА** — все игры общие!\n• Опубликовал → весь мир видит немедленно\n• Shared облако через window.storage\n• Все пользователи в одном пространстве\n\nСпроси что-нибудь! 👇');
  EXB.aiHistory=[];
}

function exbAIMsg(who,text) {
  const msgs=el('exb-ai-msgs'); if(!msgs)return;
  const div=document.createElement('div');
  div.style.cssText='display:flex;gap:10px;align-items:flex-start;'+(who==='user'?'flex-direction:row-reverse;':'');
  if(who==='bot'){
    div.innerHTML=`<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#00b2ff,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🤖</div>
    <div class="exb-ai-bubble-bot">${escHtmlExb(text).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}</div>`;
  }else{
    div.innerHTML=`<div class="exb-ai-bubble-user">${escHtmlExb(text)}</div>`;
  }
  msgs.appendChild(div);
  msgs.scrollTop=msgs.scrollHeight;
}

const EXB_AI_KB=[
  {k:['привет','здравствуй','хай','hi','hello','прив','салют','ку'],a:'Привет! 👋 Я **Exiblox AI** — твой умный помощник.\n\n🌍 Платформа работает ГЛОБАЛЬНО — все игры в общем облаке!\nСпрашивай!'},
  {k:['студия','studio','как создать игру','создание игры'],a:'🛠 **Как создать игру в ExiStudio:**\n\n1. Вкладка **Studio** 🛠\n2. **🏗 Baseplate** — стартовый шаблон\n3. Выбери инструмент и кликай по canvas\n4. **▶ Тест** — проверить\n5. **📤 Publish** → игра видна ВСЕМ! 🌍'},
  {k:['облако','cloud','другие устройства','все видят','общие игры'],a:'☁️ **Общее облако:**\n\nИспользуем **window.storage** с параметром **shared=true**\n\n• Все игры сохраняются в ОБЩЕМ хранилище\n• Любой пользователь видит твою игру\n• Работает на всех устройствах в claude.ai 🌍'},
  {k:['опубликовать','публикация','publish','выложить'],a:'📤 **Публикация:**\n\n1. Studio → **📤 Publish**\n2. Название + описание + иконка\n3. **🚀 Опубликовать**\n\nИгра сохраняется с **shared=true** — видна ВСЕМ! 🌍'},
  {k:['иконка','картинка'],a:'🖼 **Иконка:** PNG/JPG/GIF до 1МБ.\nПеретащи в квадрат или кнопка "Загрузить картинку" при публикации.'},
  {k:['baseplate','базплейт','шаблон'],a:'🏗 **Baseplate** — стартовый шаблон с полом и спавном.\nКнопка **🏗 Baseplate** в Studio.'},
  {k:['добавить друга','друг','друзья','код'],a:'👥 **Друзья:**\n1. Вкладка **Friends** 👥\n2. **+ Добавить**\n3. Никнейм или код\n\nТвой код виден в разделе Friends.'},
  {k:['кто ты','что ты','что умеешь'],a:'🤖 Я — **Exiblox AI**!\n\nЗнаю: 🎮 игры · 🛠 Studio · 📤 Публикация · ☁️ Облако · 👥 Друзья · 🎭 Скины\n\nСпрашивай!'},
  {k:['спасибо','благодарю','thanks'],a:'Пожалуйста! 😊 Удачи в создании игр! 🎮🚀'},
  {k:['анекдот','шутка'],a:'😄 Программист заходит в магазин. Жена: "Купи хлеб, и если будут яйца — возьми десяток." Вернулся с 10 буханками. "Яйца были!" 🥚😂'},
  {k:['версия','обновление'],a:'📦 **Exiblox v3.0**\n✅ Общее облако (shared storage)\n✅ Кастомные иконки\n✅ AI помощник\n✅ Studio с canvas\n✅ Система друзей\n✅ Без предупреждений!'},
];

function exbAIGetResponse(input) {
  const q=input.toLowerCase().trim();
  let bestMatch=null,bestScore=0;
  for(const entry of EXB_AI_KB){
    let score=0;
    for(const kw of entry.k){if(q.includes(kw))score+=kw.length;}
    if(score>bestScore){bestScore=score;bestMatch=entry;}
  }
  if(bestMatch&&bestScore>0)return bestMatch.a;
  if(/\?|как|что|где|зачем|почему/.test(q))return '🤔 Уточни вопрос! Попробуй: "Как создать игру?" или "Как опубликовать в облако?"';
  return 'Хм, не знаю ответа 😅\nНапиши **"что умеешь"** — покажу все темы!';
}

function exbAISend() {
  const inp=el('exb-ai-inp'); if(!inp||EXB._aiTyping)return;
  const text=inp.value.trim(); if(!text)return;
  inp.value=''; exbAIMsg('user',text); EXB._aiTyping=true;
  const msgs=el('exb-ai-msgs');
  const typing=document.createElement('div'); typing.id='exb-typing';
  typing.style.cssText='display:flex;gap:10px;align-items:flex-start;';
  typing.innerHTML=`<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#00b2ff,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🤖</div>
    <div class="exb-ai-bubble-bot" style="display:flex;gap:5px;align-items:center;padding:14px;">
      <span class="edot"></span><span class="edot"></span><span class="edot"></span>
    </div>`;
  if(msgs){msgs.appendChild(typing);msgs.scrollTop=msgs.scrollHeight;}
  setTimeout(()=>{typing.remove();EXB._aiTyping=false;exbAIMsg('bot',exbAIGetResponse(text));},500+Math.random()*700);
}

function exbAIQuick(q){const inp=el('exb-ai-inp');if(inp){inp.value=q;exbAISend();}}

// ════════════════════════════════════════════
// GAME PLAYER
// ════════════════════════════════════════════
function exbPlayGame(id) {
  const game=EXB.games.find(g=>g.id===id); if(!game)return;
  exbOpenGame(game);
}

function exbOpenGame(game) {
  const overlay=document.createElement('div');
  overlay.id='exb-game-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:99999;display:flex;flex-direction:column;';
  const W=Math.min(window.innerWidth-20,900),H=Math.min(window.innerHeight-120,520);
  overlay.innerHTML=`
  <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:#111;border-bottom:1px solid #222;">
    ${game.iconImage?`<img src="${escHtmlExb(game.iconImage)}" style="width:28px;height:28px;border-radius:6px;object-fit:cover;">`:`<span style="font-size:18px;">${game.icon||'🎮'}</span>`}
    <span style="font-size:14px;font-weight:700;">${escHtmlExb(game.name)}</span>
    <span style="font-size:11px;color:rgba(255,255,255,.4);">by ${escHtmlExb(game.author||'Unknown')}</span>
    <span style="font-size:11px;color:rgba(255,255,255,.4);margin-left:8px;">← → движение · Пробел прыжок</span>
    <button onclick="document.getElementById('exb-game-overlay').remove()" style="margin-left:auto;background:#e74c3c;border:none;color:#fff;padding:6px 14px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">✕ Выйти</button>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a2040;">
    <canvas id="exb-game-canvas" width="${W}" height="${H}" style="border-radius:8px;box-shadow:0 0 40px rgba(0,0,0,.8);"></canvas>
    <div style="display:flex;gap:16px;margin-top:12px;align-items:center;">
      <button id="exb-g-left" style="background:#252850;border:none;color:#fff;padding:10px 22px;border-radius:8px;cursor:pointer;font-size:20px;font-weight:700;user-select:none;">◀</button>
      <span id="exb-g-score" style="color:#FFD700;font-size:16px;font-weight:700;min-width:140px;text-align:center;">🪙 0</span>
      <button id="exb-g-jump" style="background:#c0392b;border:none;color:#fff;padding:10px 22px;border-radius:8px;cursor:pointer;font-size:20px;font-weight:700;user-select:none;">▲</button>
      <button id="exb-g-right" style="background:#252850;border:none;color:#fff;padding:10px 22px;border-radius:8px;cursor:pointer;font-size:20px;font-weight:700;user-select:none;">▶</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  exbRunGame(game,W,H);
}

function exbRunGame(game,W,H) {
  const canvas=el('exb-game-canvas'); if(!canvas)return;
  const cv=canvas.getContext('2d');
  const GRAVITY=0.55,JUMP_FORCE=-13,SPEED=5;
  const skinId=EXB.skin||'red';
  const skin=EXB_SKINS.find(s=>s.id===skinId)||EXB_SKINS[0];
  const objs=game.objects||[];
  const platforms=objs.filter(o=>['block','platform','ice'].includes(o.type)).map(o=>({...o}));
  const coins=objs.filter(o=>o.type==='coin').map(o=>({x:o.x+o.w/2,y:o.y+o.h/2}));
  const spikes=objs.filter(o=>o.type==='spike');
  const springs=objs.filter(o=>o.type==='spring');
  const lava=objs.filter(o=>o.type==='lava');

  if(!platforms.length){platforms.push(
    {x:0,y:760,w:3200,h:40,color:'#4a9a30',type:'block'},
    {x:200,y:620,w:160,h:20,color:'#2980b9',type:'platform'},
    {x:430,y:520,w:160,h:20,color:'#8e44ad',type:'platform'},
    {x:660,y:420,w:160,h:20,color:'#c0392b',type:'platform'},
  );}
  if(!coins.length)[{x:250,y:590},{x:470,y:490},{x:700,y:390}].forEach(c=>coins.push(c));

  const spawnObj=objs.find(o=>o.type==='spawn');
  let px=spawnObj?spawnObj.x+20:(platforms[0]?.x+80||100);
  let py=spawnObj?spawnObj.y-65:(platforms[0]?.y-65||500);
  const startX=px,startY=py;
  let vx=0,vy=0,onGround=false,step=0,facing=1;
  let camX=px+12-W/2,camY=py-60-H*.38;
  if(camX<0)camX=0; if(camY<-200)camY=-200;

  const keys={left:false,right:false};
  const collected=new Set(); let scored=0;

  const setKey=(k,v)=>keys[k]=v;
  el('exb-g-left')?.addEventListener('mousedown',()=>setKey('left',true));
  el('exb-g-left')?.addEventListener('mouseup',()=>setKey('left',false));
  el('exb-g-left')?.addEventListener('mouseleave',()=>setKey('left',false));
  el('exb-g-right')?.addEventListener('mousedown',()=>setKey('right',true));
  el('exb-g-right')?.addEventListener('mouseup',()=>setKey('right',false));
  el('exb-g-right')?.addEventListener('mouseleave',()=>setKey('right',false));
  el('exb-g-jump')?.addEventListener('click',doJump);

  document.addEventListener('keydown',onKey);
  document.addEventListener('keyup',onKeyUp);

  function onKey(e){if(e.key==='ArrowLeft')setKey('left',true);if(e.key==='ArrowRight')setKey('right',true);if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();doJump();}}
  function onKeyUp(e){if(e.key==='ArrowLeft')setKey('left',false);if(e.key==='ArrowRight')setKey('right',false);}
  function doJump(){if(onGround){vy=JUMP_FORCE;onGround=false;}}
  function respawn(){px=startX;py=startY;vx=0;vy=0;showNotif('Exiblox','Начни сначала 😵','💥');}

  function update(){
    if(keys.left){vx=-SPEED;facing=-1;}else if(keys.right){vx=SPEED;facing=1;}else vx*=.72;
    vy+=GRAVITY; px+=vx; py+=vy;
    if(px<0){px=0;vx=0;} if(py>2400)respawn();
    onGround=false;
    for(const p of platforms){if(px+22>p.x&&px<p.x+p.w&&py+60>p.y&&py+60<p.y+p.h+Math.abs(vy)+2&&vy>=0){py=p.y-60;vy=0;onGround=true;if(p.type==='ice')vx*=.98;}}
    for(const sp of springs){if(px+22>sp.x&&px<sp.x+sp.w&&py+60>sp.y&&py+60<=sp.y+sp.h&&vy>=0){vy=JUMP_FORCE*1.8;onGround=false;}}
    for(const sk of [...spikes,...lava]){if(px+20>sk.x&&px<sk.x+sk.w&&py+55>sk.y&&py<sk.y+sk.h)respawn();}
    coins.forEach((co,i)=>{if(!collected.has(i)&&Math.abs(px+12-co.x)<22&&Math.abs(py+30-co.y)<22){collected.add(i);scored++;const sc=el('exb-g-score');if(sc)sc.textContent=`🪙 ${scored} / ${coins.length}`;}});
    if(onGround&&Math.abs(vx)>.3)step++;else if(!onGround)step+=.5;
    const tcx=px+12-W*.5,tcy=py-60-H*.40;
    camX+=(tcx-camX)*.12; camY+=(tcy-camY)*.10;
    if(camX<0)camX=0; if(camY<-300)camY=-300;
  }

  function draw(){
    const grad=cv.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#1a2040');grad.addColorStop(1,'#0d1230');
    cv.fillStyle=grad;cv.fillRect(0,0,W,H);
    cv.save();cv.translate(-Math.round(camX),-Math.round(camY));
    for(const p of platforms){cv.fillStyle=p.color||'#4a9a30';cv.fillRect(p.x,p.y,p.w,p.h);cv.fillStyle='rgba(255,255,255,.15)';cv.fillRect(p.x,p.y,p.w,Math.min(7,p.h));}
    springs.forEach(sp=>{cv.fillStyle='#555';cv.fillRect(sp.x,sp.y+sp.h-8,sp.w,8);cv.strokeStyle='#f1c40f';cv.lineWidth=2;for(let i=0;i<3;i++){cv.beginPath();cv.ellipse(sp.x+sp.w/2,sp.y+sp.h-8-(i*(sp.h-8)/3),sp.w/2-2,3,0,0,Math.PI*2);cv.stroke();}});
    spikes.forEach(sk=>{cv.fillStyle='#aaa';cv.beginPath();cv.moveTo(sk.x,sk.y+sk.h);cv.lineTo(sk.x+sk.w/2,sk.y);cv.lineTo(sk.x+sk.w,sk.y+sk.h);cv.closePath();cv.fill();});
    lava.forEach(lv=>{cv.fillStyle='#ff4500';cv.fillRect(lv.x,lv.y,lv.w,lv.h);cv.fillStyle='#ff6e00';for(let lx=0;lx<lv.w;lx+=8){const lh=3+2*Math.sin((lx+step*2)/5);cv.fillRect(lv.x+lx,lv.y,6,lh);}});
    coins.forEach((co,i)=>{if(!collected.has(i)){const pulse=1+.08*Math.sin(step/6);cv.beginPath();cv.arc(co.x,co.y,10*pulse,0,Math.PI*2);cv.fillStyle='#FFD700';cv.fill();cv.strokeStyle='#FFA500';cv.lineWidth=2;cv.stroke();cv.fillStyle='#8B6914';cv.font='bold 8px monospace';cv.textAlign='center';cv.fillText('E$',co.x,co.y+3);cv.textAlign='left';}});
    exbDrawStickman(cv,Math.round(px+12),Math.round(py+60),skin,1.15,!onGround,facing,step);
    cv.restore();
    cv.fillStyle='rgba(0,0,0,.5)';cv.fillRect(0,0,W,28);
    cv.fillStyle='#fff';cv.font='bold 13px Segoe UI';cv.textAlign='left';cv.fillText(`🪙 ${scored}/${coins.length}`,12,19);
    cv.textAlign='center';cv.fillText(game.name||'Игра',W/2,19);cv.textAlign='left';
  }

  function loop(){
    if(!el('exb-game-canvas')){document.removeEventListener('keydown',onKey);document.removeEventListener('keyup',onKeyUp);return;}
    update();draw();requestAnimationFrame(loop);
  }
  loop();
}

// ════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════
function exbDoSearch(query) {
  if(!query.trim())return;
  const results=EXB.games.filter(g=>g.name.toLowerCase().includes(query.toLowerCase()));
  const c=el('exb-content'); if(!c)return;
  EXB.tab='store';
  document.querySelectorAll('.exb-nav-btn').forEach(b=>{const m=b.getAttribute('onclick').match(/'(\w+)'/);if(m)b.classList.toggle('exb-active',m[1]==='store');});
  c.innerHTML=`
  <div class="exb-section">
    <div class="exb-sec-title">🔍 Поиск: "${escHtmlExb(query)}"</div>
    ${results.length?`<div class="exb-cards-row">${exbGameCards(results)}</div>`:'<div style="color:rgba(255,255,255,.3);font-size:13px;padding:30px 0;">Ничего не найдено 😕</div>'}
    <button class="exb-btn2 exb-btn2-gray" style="margin-top:16px;" onclick="exbTab('store')">← Назад</button>
  </div>`;
}

// ════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════
function escHtmlExb(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function el(id){return document.getElementById(id);}
