'use strict';
// ╔══════════════════════════════════════════════╗
// ║         EXIBLOX v4  —  Full Platform         ║
// ║  localStorage cloud · Studiоo fixes · RedBall ║
// ╚══════════════════════════════════════════════╝

const EXB = {
  user: null, users: {}, games: [], tab: 'home',
  studioObjects: [], studioTool: 'block',
  studioColor: '#4a9a30', studioSelObj: null,
  studioDragging: null, studioProjectName: 'Новый проект',
  studioScrollX: 0, studioScrollY: 0,
  studioPanning: false, studioPanStart: null,
  aiHistory: [], skin: 'red',
  TILE: 40, CANVAS_W: 6400, CANVAS_H: 2400,
  _publishing: false, _studioEditing: false, _aiTyping: false,
  VERSION: 'v4',
};

const EXB_SKINS = [
  { id:'red',    name:'Красный',    bodyColor:'#e74c3c', headColor:'#e74c3c', capColor:null,      limbColor:'#c0392b' },
  { id:'white',  name:'Белый',      bodyColor:'#ecf0f1', headColor:'#ecf0f1', capColor:'#e74c3c', limbColor:'#bdc3c7' },
  { id:'blue',   name:'Голубой',    bodyColor:'#3498db', headColor:'#3498db', capColor:null,      limbColor:'#2980b9' },
  { id:'orange', name:'Оранжевый',  bodyColor:'#e67e22', headColor:'#e67e22', capColor:null,      limbColor:'#d35400' },
  { id:'green',  name:'Зелёный',    bodyColor:'#2ecc71', headColor:'#2ecc71', capColor:'#27ae60', limbColor:'#27ae60' },
  { id:'purple', name:'Фиолетовый', bodyColor:'#9b59b6', headColor:'#9b59b6', capColor:null,      limbColor:'#8e44ad' },
];

const EXB_BASEPLATE = [
  {type:'block',    x:0,    y:760, w:6400, h:40,  color:'#4a9a30'},
  {type:'block',    x:200,  y:620, w:200,  h:20,  color:'#2980b9'},
  {type:'block',    x:500,  y:520, w:200,  h:20,  color:'#8e44ad'},
  {type:'block',    x:800,  y:420, w:200,  h:20,  color:'#c0392b'},
  {type:'block',    x:1100, y:340, w:200,  h:20,  color:'#e67e22'},
  {type:'spawn',    x:80,   y:680, w:40,   h:40,  color:'#00b2ff'},
  {type:'coin',     x:280,  y:575, w:30,   h:30,  color:'#FFD700'},
  {type:'coin',     x:570,  y:475, w:30,   h:30,  color:'#FFD700'},
  {type:'coin',     x:870,  y:375, w:30,   h:30,  color:'#FFD700'},
  {type:'enemy',    x:400,  y:720, w:40,   h:40,  color:'#e74c3c'},
  {type:'spike',    x:680,  y:720, w:40,   h:40,  color:'#888'},
];

const EXB_TOOLS = [
  {id:'select',   label:'🖱 Выбор'},
  {id:'block',    label:'🧱 Блок'},
  {id:'platform', label:'🟫 Платформа'},
  {id:'spawn',    label:'📍 Спавн'},
  {id:'coin',     label:'🪙 Монета'},
  {id:'enemy',    label:'💀 Враг'},
  {id:'spike',    label:'🔺 Шип'},
  {id:'spring',   label:'🟡 Пружина'},
  {id:'ice',      label:'🧊 Лёд'},
  {id:'lava',     label:'🌋 Лава'},
  {id:'deco',     label:'🌲 Декор'},
  {id:'eraser',   label:'🧹 Ластик'},
];

const EXB_BLOCK_COLORS = {
  block:'#4a9a30', platform:'#8B6914', spawn:'#00b2ff',
  coin:'#FFD700',  enemy:'#e74c3c',    spike:'#888',
  spring:'#f1c40f',ice:'#aee6f5',      lava:'#ff4500',
  deco:'#2ecc71',
};

const EXB_ICONS  = ['🎮','🎯','🏆','⚡','🌟','🔥','💎','🎲','🚀','🦊','🐉','🌈'];
const EXB_COLORS = ['#7c3aed','#1a6fa8','#b8860b','#ba5a00','#8b0000','#2d5a1b','#1a4a3a'];

let _exbPublishIconData = null;

// ═══════════════════════════════════════
// STORAGE  (localStorage — работает везде)
// ═══════════════════════════════════════
const EXB_STORAGE_KEY = 'exiblox_v4_';

function exbLoadGames() {
  try { return JSON.parse(localStorage.getItem(EXB_STORAGE_KEY+'games') || '[]'); }
  catch(e) { return []; }
}
function exbSaveGames() {
  localStorage.setItem(EXB_STORAGE_KEY+'games', JSON.stringify(EXB.games));
}
function exbSaveUsers() {
  localStorage.setItem(EXB_STORAGE_KEY+'users', JSON.stringify(EXB.users));
}
function exbSaveCurUser() {
  localStorage.setItem(EXB_STORAGE_KEY+'curuser', JSON.stringify(EXB.user));
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
function initExiblox() {
  EXB.users   = JSON.parse(localStorage.getItem(EXB_STORAGE_KEY+'users')   || '{}');
  EXB.user    = JSON.parse(localStorage.getItem(EXB_STORAGE_KEY+'curuser') || 'null');
  EXB.skin    = localStorage.getItem(EXB_STORAGE_KEY+'skin') || 'red';
  EXB.games   = exbLoadGames();
  const root  = document.getElementById('exiblox-root');
  if (!root) return;
  exbRender();
}
window.initExiblox = initExiblox;

// ═══════════════════════════════════════
// RENDER ROOT
// ═══════════════════════════════════════
function exbRender() {
  const root = document.getElementById('exiblox-root');
  if (!root) return;
  if (!EXB.user) { exbRenderAuth(root); } else { exbRenderMain(root); }
}

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
function exbRenderAuth(root) {
  root.innerHTML = `
  <div style="display:flex;align-items:center;justify-content:center;height:100%;background:linear-gradient(160deg,#060810,#0a1020);">
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:44px 52px;width:430px;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.7);">
      <div style="font-size:54px;font-weight:900;background:linear-gradient(135deg,#00d4ff,#7c3aed,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;">✦ Exiblox</div>
      <div style="color:rgba(255,255,255,.35);font-size:12px;margin-bottom:6px;letter-spacing:2px;text-transform:uppercase;">Version 4</div>
      <div style="color:rgba(255,255,255,.25);font-size:11px;margin-bottom:28px;">🎮 ${EXB.games.length} игр · 👥 ${Object.keys(EXB.users).length} игроков</div>
      <div id="exb-auth-tabs" style="display:flex;background:rgba(255,255,255,.05);border-radius:11px;padding:4px;margin-bottom:24px;gap:4px;">
        <div class="exb-auth-tab exb-auth-active" onclick="exbAuthTab('login')" style="flex:1;padding:9px;border-radius:8px;cursor:pointer;font-size:13px;transition:.2s;">Войти</div>
        <div class="exb-auth-tab" onclick="exbAuthTab('register')" style="flex:1;padding:9px;border-radius:8px;cursor:pointer;font-size:13px;color:rgba(255,255,255,.4);transition:.2s;">Регистрация</div>
      </div>
      <div id="exb-auth-form"></div>
      <div onclick="exbGuestLogin()" style="color:rgba(255,255,255,.35);font-size:12px;cursor:pointer;padding:9px;border-radius:9px;margin-top:12px;transition:.15s;" onmouseover="this.style.color='#fff';this.style.background='rgba(255,255,255,.06)'" onmouseout="this.style.color='rgba(255,255,255,.35)';this.style.background='none'">👤 Продолжить как гость</div>
      <div id="exb-auth-err" style="color:#ff6b6b;font-size:12px;margin-top:8px;min-height:18px;"></div>
    </div>
  </div>
  <style>
    #exiblox-root *{box-sizing:border-box;}
    .exb-auth-active{background:rgba(0,212,255,.2)!important;color:#fff!important;}
    .exb-inp{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px 15px;color:#fff;font-size:13px;font-family:inherit;outline:none;margin-bottom:10px;transition:border .2s;}
    .exb-inp:focus{border-color:#00d4ff;}
    .exb-inp::placeholder{color:rgba(255,255,255,.28);}
    .exb-btn-main{width:100%;padding:13px;border-radius:10px;border:none;font-size:13px;cursor:pointer;font-family:inherit;font-weight:700;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;margin-top:6px;transition:.2s;letter-spacing:.3px;}
    .exb-btn-main:hover{opacity:.85;transform:translateY(-1px);}
    .exb-btn2{padding:8px 18px;border-radius:9px;border:none;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;transition:.2s;}
    .exb2-blue{background:#00d4ff;color:#000;font-weight:700;}
    .exb2-blue:hover{background:#00b8e0;}
    .exb2-red{background:#e74c3c;color:#fff;}
    .exb2-red:hover{background:#c0392b;}
    .exb2-gray{background:rgba(255,255,255,.09);color:rgba(255,255,255,.7);}
    .exb2-gray:hover{background:rgba(255,255,255,.16);}
    .exb2-green{background:#2ecc71;color:#fff;}
    .exb2-green:hover{background:#27ae60;}
    .exb2-purple{background:#7c3aed;color:#fff;}
    .exb2-purple:hover{background:#6c2bd9;}
    .exb-inp2{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.11);border-radius:8px;padding:9px 12px;color:#fff;font-size:12px;font-family:inherit;outline:none;transition:border .2s;}
    .exb-inp2:focus{border-color:#00d4ff;}
    .exb-inp2::placeholder{color:rgba(255,255,255,.28);}
    .exb-card{width:190px;background:rgba(255,255,255,.05);border-radius:14px;overflow:hidden;cursor:pointer;transition:.18s;border:1px solid rgba(255,255,255,.07);flex-shrink:0;}
    .exb-card:hover{transform:translateY(-4px);border-color:rgba(0,212,255,.5);box-shadow:0 10px 30px rgba(0,212,255,.12);}
    .exb-card-thumb{height:118px;display:flex;align-items:center;justify-content:center;overflow:hidden;}
    .exb-card-thumb img{width:100%;height:100%;object-fit:cover;}
    .exb-card-body{padding:10px 12px 12px;}
    .exb-card-name{font-size:12px;font-weight:700;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .exb-card-meta{font-size:10px;color:rgba(255,255,255,.38);display:flex;justify-content:space-between;}
    .exb-tool-btn{padding:7px 5px;border-radius:8px;cursor:pointer;font-size:10.5px;text-align:center;transition:.15s;color:rgba(255,255,255,.55);border:1px solid transparent;}
    .exb-tool-btn:hover{background:rgba(255,255,255,.08);color:#fff;}
    .exb-tool-active{background:rgba(0,212,255,.18)!important;border-color:rgba(0,212,255,.4)!important;color:#00d4ff!important;}
    .exb-section{padding:22px 26px 30px;}
    .exb-sec-title{font-size:16px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
    .exb-cards-row{display:flex;gap:12px;flex-wrap:wrap;}
    .exb-nav-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:11px 6px;cursor:pointer;border-radius:10px;margin:2px 5px;transition:.15s;font-size:10px;color:rgba(255,255,255,.45);}
    .exb-nav-btn:hover{background:rgba(255,255,255,.06);color:#fff;}
    .exb-nav-active{background:rgba(0,212,255,.14)!important;color:#00d4ff!important;}
    .exb-nav-ico{font-size:20px;line-height:1;}
    .exb-profile-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
    @keyframes exb-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    @keyframes edot-bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
    .edot{width:7px;height:7px;background:rgba(255,255,255,.5);border-radius:50%;display:inline-block;animation:edot-bounce 1.2s ease-in-out infinite;}
    .edot:nth-child(2){animation-delay:.15s}.edot:nth-child(3){animation-delay:.3s}
  </style>`;
  exbAuthTab('login');
}

let _authTab = 'login';
function exbAuthTab(tab) {
  _authTab = tab;
  document.querySelectorAll('.exb-auth-tab').forEach((t,i)=>{
    const isActive = (i===0&&tab==='login')||(i===1&&tab==='register');
    t.classList.toggle('exb-auth-active', isActive);
    if(!isActive) t.style.color='rgba(255,255,255,.4)'; else t.style.color='';
  });
  const f = document.getElementById('exb-auth-form'); if(!f)return;
  if(tab==='login') {
    f.innerHTML=`<input class="exb-inp" id="exb-ln" placeholder="Никнейм"><input class="exb-inp" id="exb-lp" type="password" placeholder="Пароль" onkeydown="if(event.key==='Enter')exbLogin()"><button class="exb-btn-main" onclick="exbLogin()">Войти →</button>`;
  } else {
    f.innerHTML=`<input class="exb-inp" id="exb-rn" placeholder="Никнейм (мин. 3)"><input class="exb-inp" id="exb-re" placeholder="Email"><input class="exb-inp" id="exb-rp" type="password" placeholder="Пароль (мин. 6)"><input class="exb-inp" id="exb-rp2" type="password" placeholder="Повторите пароль" onkeydown="if(event.key==='Enter')exbRegister()"><button class="exb-btn-main" onclick="exbRegister()">Создать аккаунт →</button>`;
  }
}

function exbAuthErr(msg) {
  const e=document.getElementById('exb-auth-err'); if(e)e.textContent=msg;
  setTimeout(()=>{const ee=document.getElementById('exb-auth-err');if(ee)ee.textContent='';},3500);
}
function exbHash(pw) { let h=0; for(let c of pw) h=(Math.imul(31,h)+c.charCodeAt(0))|0; return h.toString(36); }
function exbMakeCode() { return Math.random().toString(36).slice(2,10).toUpperCase(); }

function exbLogin() {
  const name=(document.getElementById('exb-ln')?.value||'').trim();
  const pw=document.getElementById('exb-lp')?.value||'';
  if(!name||!pw){exbAuthErr('Заполните все поля');return;}
  if(!EXB.users[name]){exbAuthErr('Пользователь не найден');return;}
  if(EXB.users[name].pw!==exbHash(pw)){exbAuthErr('Неверный пароль');return;}
  EXB.user=name; exbSaveCurUser(); exbRender();
}
function exbRegister() {
  const name=(document.getElementById('exb-rn')?.value||'').trim();
  const email=(document.getElementById('exb-re')?.value||'').trim();
  const pw=document.getElementById('exb-rp')?.value||'';
  const pw2=document.getElementById('exb-rp2')?.value||'';
  if(!name||!email||!pw||!pw2){exbAuthErr('Заполните все поля');return;}
  if(name.length<3){exbAuthErr('Никнейм >= 3 символа');return;}
  if(pw.length<6){exbAuthErr('Пароль >= 6 символов');return;}
  if(pw!==pw2){exbAuthErr('Пароли не совпадают');return;}
  if(EXB.users[name]){exbAuthErr('Ник уже занят');return;}
  EXB.users[name]={pw:exbHash(pw),email,code:exbMakeCode(),ecoins:0,friends:[],requests:[],projects:[],pubGames:[],isGuest:false,joinDate:new Date().toLocaleDateString('ru')};
  exbSaveUsers(); EXB.user=name; exbSaveCurUser(); exbRender();
}
function exbGuestLogin() {
  if(!EXB.users['Гость']){EXB.users['Гость']={pw:'',email:'guest@exiblox.com',code:'GUEST000',ecoins:0,friends:[],requests:[],projects:[],pubGames:[],isGuest:true}; exbSaveUsers();}
  EXB.user='Гость'; exbSaveCurUser(); exbRender();
}
function exbLogout() {
  EXB.user=null; localStorage.removeItem(EXB_STORAGE_KEY+'curuser'); exbRender();
}

// ═══════════════════════════════════════
// MAIN LAYOUT
// ═══════════════════════════════════════
function exbInjectCSS() {
  if(document.getElementById('exb-global-css')) return;
  const s = document.createElement('style');
  s.id = 'exb-global-css';
  s.textContent = `
    #exiblox-root,#exiblox-root *{box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif;}
    #exb-wrap{display:flex;flex-direction:column;height:100%;overflow:hidden;background:#111318;color:#fff;}
    #exb-topbar{height:52px;background:#0c0d13;display:flex;align-items:center;padding:0 16px;gap:10px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;}
    #exb-logo{font-size:17px;font-weight:900;background:linear-gradient(135deg,#00b2ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap;letter-spacing:-.3px;}
    #exb-searchbox{flex:1;max-width:340px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:6px 13px;display:flex;align-items:center;gap:7px;}
    #exb-searchbox input{background:none;border:none;outline:none;color:#fff;font-size:12px;width:100%;font-family:inherit;}
    #exb-searchbox input::placeholder{color:rgba(255,255,255,.3);}
    #exb-body{display:flex;flex:1;overflow:hidden;}
    /* ── SIDEBAR ── */
    #exb-sidebar{width:88px;background:#09090f;border-right:1px solid rgba(255,255,255,.05);display:flex;flex-direction:column;padding:6px 0;flex-shrink:0;overflow:hidden;}
    .exb-nb{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 4px 8px;cursor:pointer;border-radius:10px;margin:1px 5px;transition:background .15s,color .15s;color:rgba(255,255,255,.45);text-decoration:none;}
    .exb-nb:hover{background:rgba(255,255,255,.07);color:#fff;}
    .exb-nb.xact{background:rgba(0,178,255,.15);color:#00b2ff;}
    .exb-nb-ico{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(255,255,255,.06);margin-bottom:1px;transition:background .15s;}
    .exb-nb:hover .exb-nb-ico{background:rgba(255,255,255,.12);}
    .exb-nb.xact .exb-nb-ico{background:rgba(0,178,255,.25);}
    .exb-nb-lbl{font-size:9.5px;font-weight:500;letter-spacing:.1px;}
    /* ── CONTENT ── */
    #exb-content{flex:1;overflow-y:auto;overflow-x:hidden;}
    #exb-content::-webkit-scrollbar{width:4px;}
    #exb-content::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:3px;}
    .exb-sec{padding:20px 24px 28px;}
    .exb-sec-h{font-size:16px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px;color:#fff;}
    /* ── CARDS ── */
    .exb-cards{display:flex;gap:13px;flex-wrap:wrap;}
    .exb-card{width:200px;background:#1a1d26;border-radius:14px;overflow:hidden;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s;border:1px solid rgba(255,255,255,.08);flex-shrink:0;}
    .exb-card:hover{transform:translateY(-4px);border-color:rgba(0,178,255,.5);box-shadow:0 8px 28px rgba(0,178,255,.18);}
    .exb-card-thumb{width:200px;height:140px;display:block;overflow:hidden;flex-shrink:0;position:relative;}
    .exb-card-thumb-inner{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
    .exb-card-thumb-inner img{width:100%;height:100%;object-fit:cover;display:block;}
    .exb-card-body{padding:9px 12px 11px;background:#1a1d26;}
    .exb-card-name{font-size:12px;font-weight:700;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff;}
    .exb-card-meta{font-size:10px;color:rgba(255,255,255,.38);display:flex;justify-content:space-between;align-items:center;}
    /* ── BUTTONS ── */
    .exb-btn{padding:8px 16px;border-radius:8px;border:none;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;transition:.18s;line-height:1;}
    .exb-btn:hover{opacity:.88;transform:translateY(-1px);}
    .btn-blue{background:#00b2ff;color:#fff;}
    .btn-red{background:#e74c3c;color:#fff;}
    .btn-gray{background:rgba(255,255,255,.1);color:rgba(255,255,255,.75);}
    .btn-gray:hover{background:rgba(255,255,255,.18)!important;transform:none!important;}
    .btn-green{background:#2ecc71;color:#fff;}
    .btn-purple{background:#7c3aed;color:#fff;}
    /* ── INPUTS ── */
    .exb-inp{width:100%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:11px 14px;color:#fff;font-size:13px;font-family:inherit;outline:none;margin-bottom:10px;transition:border .2s;}
    .exb-inp:focus{border-color:#00b2ff;}
    .exb-inp::placeholder{color:rgba(255,255,255,.28);}
    .exb-inp2{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:9px 12px;color:#fff;font-size:12px;font-family:inherit;outline:none;transition:border .2s;}
    .exb-inp2:focus{border-color:#00b2ff;}
    .exb-inp2::placeholder{color:rgba(255,255,255,.3);}
    /* ── MISC ── */
    .exb-pcard{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
    .exb-tool-btn{padding:7px 5px;border-radius:8px;cursor:pointer;font-size:10.5px;text-align:center;transition:.15s;color:rgba(255,255,255,.55);border:1px solid transparent;}
    .exb-tool-btn:hover{background:rgba(255,255,255,.08);color:#fff;}
    .exb-tool-active{background:rgba(0,178,255,.18)!important;border-color:rgba(0,178,255,.4)!important;color:#00b2ff!important;}
    .exb-btn-main{width:100%;padding:12px;border-radius:10px;border:none;font-size:13px;cursor:pointer;font-family:inherit;font-weight:700;background:linear-gradient(135deg,#00b2ff,#7c3aed);color:#fff;margin-top:6px;transition:.2s;}
    .exb-btn-main:hover{opacity:.87;transform:translateY(-1px);}
    .exb-auth-active{background:rgba(0,178,255,.22)!important;color:#fff!important;}
    .edot{width:7px;height:7px;background:rgba(255,255,255,.5);border-radius:50%;display:inline-block;animation:edotB 1.2s ease-in-out infinite;}
    .edot:nth-child(2){animation-delay:.15s}.edot:nth-child(3){animation-delay:.3s}
    @keyframes edotB{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
    /* compat aliases */
    .exb-btn2{padding:8px 16px;border-radius:8px;border:none;font-size:12px;cursor:pointer;font-family:inherit;font-weight:600;transition:.18s;}
    .exb-btn2:hover{opacity:.88;}
    .exb2-blue{background:#00b2ff;color:#fff;}
    .exb2-red{background:#e74c3c;color:#fff;}
    .exb2-gray{background:rgba(255,255,255,.1);color:rgba(255,255,255,.75);}
    .exb2-green{background:#2ecc71;color:#fff;}
    .exb2-purple{background:#7c3aed;color:#fff;}
    .exb-section{padding:20px 24px 28px;}
    .exb-sec-title{font-size:16px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px;color:#fff;}
    .exb-cards-row{display:flex;gap:13px;flex-wrap:wrap;}
    .exb-profile-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:13px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
  `;
  document.head.appendChild(s);
}

function exbRenderMain(root) {
  exbInjectCSS();
  const me = EXB.users[EXB.user]||{};

  const NAV = [
    ['home',   '🏠', 'Главная'],
    ['store',  '🛒', 'Магазин'],
    ['studio', '🛠', 'Studio'],
    ['friends','👥', 'Друзья'],
    ['publish','📤', 'Publish'],
    ['ai',     '🤖', 'AI'],
    ['avatar', '🎭', 'Аватар'],
    ['profile','👤', 'Профиль'],
  ];

  root.innerHTML = `
  <div id="exb-wrap">
    <div id="exb-topbar">
      <div id="exb-logo">✦ Exiblox v4</div>
      <div id="exb-searchbox">
        <span style="font-size:12px;opacity:.35;">🔍</span>
        <input id="exb-search" placeholder="Поиск игр..." onkeydown="if(event.key==='Enter')exbDoSearch(this.value)">
      </div>
      <div style="margin-left:auto;display:flex;align-items:center;gap:12px;">
        <span style="font-size:13px;font-weight:700;color:#FFD700;" id="exb-coins-disp">🪙 ${me.ecoins||0} E$</span>
        <span style="font-size:12px;color:rgba(255,255,255,.55);">${me.isGuest?'Гость':EXB.user}</span>
      </div>
    </div>
    <div id="exb-body">
      <div id="exb-sidebar">
        ${NAV.map(([t,ico,lbl])=>`
          <div class="exb-nb${EXB.tab===t?' xact':''}" onclick="exbTab('${t}')">
            <div class="exb-nb-ico">${ico}</div>
            <span class="exb-nb-lbl">${lbl}</span>
          </div>`).join('')}
      </div>
      <div id="exb-content"></div>
    </div>
  </div>`;
  exbTabContent(EXB.tab);
}

function exbTab(tab) {
  EXB.tab=tab;
  document.querySelectorAll('.exb-nb').forEach(b=>{
    const m=b.getAttribute('onclick')?.match(/'(\w+)'/);
    if(m) b.classList.toggle('xact', m[1]===tab);
  });
  exbTabContent(tab);
}
function exbTabContent(tab) {
  const c=document.getElementById('exb-content'); if(!c)return;
  ({home:exbHome,store:exbStore,studio:exbStudio,friends:exbFriends,publish:exbPublish,ai:exbAI,avatar:exbAvatar,profile:exbProfile})[tab]?.(c);
}

// ═══════════════════════════════════════
// HOME
// ═══════════════════════════════════════
function exbHome(c) {
  EXB.games=exbLoadGames();
  const me=EXB.users[EXB.user]||{}, frs=me.friends||[], all=EXB.games;
  c.innerHTML=`<div class="exb-section">
    <div class="exb-sec-title">✦ Exiblox v4 — Добро пожаловать, ${me.isGuest?'Гость':EXB.user}!</div>
    <div style="background:linear-gradient(135deg,rgba(0,212,255,.08),rgba(124,58,237,.08));border:1px solid rgba(0,212,255,.15);border-radius:14px;padding:18px 22px;margin-bottom:22px;display:flex;gap:24px;flex-wrap:wrap;">
      <div style="text-align:center;"><div style="font-size:24px;font-weight:800;color:#00d4ff;">${all.length}</div><div style="font-size:10px;color:rgba(255,255,255,.4);">Игр</div></div>
      <div style="text-align:center;"><div style="font-size:24px;font-weight:800;color:#7c3aed;">${Object.keys(EXB.users).length}</div><div style="font-size:10px;color:rgba(255,255,255,.4);">Игроков</div></div>
      <div style="text-align:center;"><div style="font-size:24px;font-weight:800;color:#FFD700;">${me.ecoins||0}</div><div style="font-size:10px;color:rgba(255,255,255,.4);">E$</div></div>
      <div style="text-align:center;"><div style="font-size:24px;font-weight:800;color:#2ecc71;">${frs.length}</div><div style="font-size:10px;color:rgba(255,255,255,.4);">Друзей</div></div>
    </div>
    ${all.length?`<div class="exb-sec-title">🎮 Играть сейчас</div><div class="exb-cards-row">${exbGameCards(all)}</div>`:
    `<div style="text-align:center;padding:50px 0;color:rgba(255,255,255,.2);">
      <div style="font-size:52px;margin-bottom:14px;">🎮</div>
      <div style="font-size:15px;margin-bottom:8px;">Игр ещё нет</div>
      <div style="font-size:12px;margin-bottom:18px;">Создай первую в Studio!</div>
      <button class="exb-btn2 exb2-blue" onclick="exbTab('studio')">🛠 Studio →</button>
    </div>`}
  </div>`;
}

// ═══════════════════════════════════════
// STORE
// ═══════════════════════════════════════
function exbStore(c) {
  EXB.games=exbLoadGames();
  c.innerHTML=`<div class="exb-section">
    <div class="exb-sec-title">🛒 Магазин игр <span style="font-weight:400;font-size:12px;color:rgba(255,255,255,.3);margin-left:6px;">${EXB.games.length} игр</span></div>
    ${EXB.games.length?`<div class="exb-cards-row">${exbGameCards(EXB.games)}</div>`:
    `<div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,.2);">
      <div style="font-size:48px;margin-bottom:14px;">🛒</div>
      <div style="font-size:15px;margin-bottom:18px;">Магазин пуст</div>
      <button class="exb-btn2 exb2-blue" onclick="exbTab('studio')">🛠 Создать игру →</button>
    </div>`}
  </div>`;
}

function exbGameCards(games) {
  return games.map(g=>`
    <div class="exb-card" onclick="exbPlayGame('${g.id}')">
      <div class="exb-card-thumb" style="background:${g.color||'#1a2040'};">
        <div class="exb-card-thumb-inner">
          ${g.iconImage
            ? `<img src="${eHtml(g.iconImage)}" alt="">`
            : `<span style="font-size:54px;line-height:1;">${g.icon||'🎮'}</span>`}
        </div>
      </div>
      <div class="exb-card-body">
        <div class="exb-card-name">${eHtml(g.name)}</div>
        <div class="exb-card-meta">
          <span>by ${eHtml(g.author)}</span>
          <span>👍 ${g.rating||'100%'}</span>
        </div>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════
// STUDIO — fixed scrolling & arrows
// ═══════════════════════════════════════
function exbStudio(c) {
  const me=EXB.users[EXB.user]||{}, projs=me.projects||[];
  if(projs.length>0&&!EXB._studioEditing){exbStudioProjList(c,projs);return;}
  EXB._studioEditing=true;
  const isGuest=me.isGuest;

  c.innerHTML=`
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;" id="exb-studio-root">
    <!-- toolbar -->
    <div style="display:flex;align-items:center;gap:5px;padding:6px 10px;background:#080a10;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;flex-wrap:wrap;">
      <button class="exb-btn2 exb2-blue" onclick="exbStudioSave()" style="font-size:11px;">💾 Сохранить</button>
      <button class="exb-btn2 exb2-gray" onclick="EXB._studioEditing=false;exbTab('studio')" style="font-size:11px;">📋 Проекты</button>
      <button class="exb-btn2 exb2-gray" onclick="exbStudioBaseplate()" style="font-size:11px;">🏗 Baseplate</button>
      <button class="exb-btn2 exb2-green" onclick="exbStudioTest()" style="font-size:11px;">▶ Тест</button>
      ${isGuest?'':`<button class="exb-btn2 exb2-purple" onclick="exbPublishDialog()" style="font-size:11px;">📤 Publish</button>`}
      <button class="exb-btn2 exb2-red" onclick="exbStudioClear()" style="font-size:11px;">🗑 Очистить</button>
      <input id="exb-proj-name" class="exb-inp2" value="${eHtml(EXB.studioProjectName)}" style="width:150px;" oninput="EXB.studioProjectName=this.value">
      <span style="margin-left:auto;font-size:11px;color:rgba(255,255,255,.3);">Объектов: <span id="exb-obj-count">${EXB.studioObjects.length}</span></span>
    </div>
    <!-- main area -->
    <div style="display:flex;flex:1;overflow:hidden;">
      <!-- tools sidebar -->
      <div style="width:108px;background:#070910;border-right:1px solid rgba(255,255,255,.06);padding:7px;display:flex;flex-direction:column;gap:3px;flex-shrink:0;overflow-y:auto;">
        <div style="font-size:9px;color:rgba(255,255,255,.35);padding:3px 5px 5px;letter-spacing:.5px;text-transform:uppercase;">Инструменты</div>
        ${EXB_TOOLS.map(t=>`<div class="exb-tool-btn ${EXB.studioTool===t.id?'exb-tool-active':''}" onclick="exbSetTool('${t.id}',this)">${t.label}</div>`).join('')}
        <div style="height:1px;background:rgba(255,255,255,.06);margin:5px 0;"></div>
        <div style="font-size:9px;color:rgba(255,255,255,.35);padding:2px 5px 4px;text-transform:uppercase;">Цвет</div>
        <div id="exb-color-prev" onclick="exbPickColor()" style="width:34px;height:22px;border-radius:6px;background:${EXB.studioColor};border:2px solid rgba(255,255,255,.18);cursor:pointer;margin:0 auto 5px;"></div>
        <input type="color" id="exb-color-pick" value="${EXB.studioColor}" oninput="EXB.studioColor=this.value;document.getElementById('exb-color-prev').style.background=this.value" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;">
      </div>
      <!-- canvas -->
      <div style="flex:1;position:relative;overflow:hidden;background:#12162a;" id="exb-canvas-wrap">
        <canvas id="exb-studio-canvas" style="display:block;cursor:crosshair;touch-action:none;"></canvas>
        <!-- Navigation arrows -->
        <div style="position:absolute;bottom:14px;right:14px;display:grid;grid-template-columns:36px 36px 36px;grid-template-rows:36px 36px 36px;gap:3px;z-index:10;">
          <div></div>
          <button id="exb-nav-up" style="background:rgba(0,212,255,.18);border:1px solid rgba(0,212,255,.35);color:#00d4ff;border-radius:8px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;" onmousedown="exbNavStart('up')" ontouchstart="exbNavStart('up')" onmouseup="exbNavStop()" onmouseleave="exbNavStop()" ontouchend="exbNavStop()">▲</button>
          <div></div>
          <button id="exb-nav-left" style="background:rgba(0,212,255,.18);border:1px solid rgba(0,212,255,.35);color:#00d4ff;border-radius:8px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;" onmousedown="exbNavStart('left')" ontouchstart="exbNavStart('left')" onmouseup="exbNavStop()" onmouseleave="exbNavStop()" ontouchend="exbNavStop()">◀</button>
          <button onclick="EXB.studioScrollX=0;EXB.studioScrollY=0;exbStudioRedraw();" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.5);border-radius:8px;cursor:pointer;font-size:9px;display:flex;align-items:center;justify-content:center;">🏠</button>
          <button id="exb-nav-right" style="background:rgba(0,212,255,.18);border:1px solid rgba(0,212,255,.35);color:#00d4ff;border-radius:8px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;" onmousedown="exbNavStart('right')" ontouchstart="exbNavStart('right')" onmouseup="exbNavStop()" onmouseleave="exbNavStop()" ontouchend="exbNavStop()">▶</button>
          <div></div>
          <button id="exb-nav-down" style="background:rgba(0,212,255,.18);border:1px solid rgba(0,212,255,.35);color:#00d4ff;border-radius:8px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;" onmousedown="exbNavStart('down')" ontouchstart="exbNavStart('down')" onmouseup="exbNavStop()" onmouseleave="exbNavStop()" ontouchend="exbNavStop()">▼</button>
          <div></div>
        </div>
        <div style="position:absolute;bottom:14px;left:14px;font-size:10px;color:rgba(255,255,255,.22);pointer-events:none;" id="exb-scroll-info">0, 0</div>
      </div>
    </div>
  </div>`;
  requestAnimationFrame(exbStudioInitCanvas);
}

// Navigation arrows state
let _navInterval = null;
function exbNavStart(dir) {
  exbNavStop();
  const SPEED = 20;
  function step() {
    if(dir==='up')    EXB.studioScrollY=Math.max(0,EXB.studioScrollY-SPEED);
    if(dir==='down')  EXB.studioScrollY=Math.min(EXB.CANVAS_H,EXB.studioScrollY+SPEED);
    if(dir==='left')  EXB.studioScrollX=Math.max(0,EXB.studioScrollX-SPEED);
    if(dir==='right') EXB.studioScrollX=Math.min(EXB.CANVAS_W,EXB.studioScrollX+SPEED);
    const si=document.getElementById('exb-scroll-info');
    if(si)si.textContent=`${Math.round(EXB.studioScrollX)}, ${Math.round(EXB.studioScrollY)}`;
    exbStudioRedraw();
  }
  step(); _navInterval=setInterval(step,50);
}
function exbNavStop() { if(_navInterval){clearInterval(_navInterval);_navInterval=null;} }

function exbStudioProjList(c, projects) {
  c.innerHTML=`<div class="exb-section">
    <div style="display:flex;align-items:center;margin-bottom:18px;">
      <div class="exb-sec-title" style="margin-bottom:0;">🛠 Мои проекты</div>
      <button class="exb-btn2 exb2-blue" style="margin-left:auto;font-size:11px;" onclick="EXB.studioObjects=[];EXB.studioProjectName='Новый проект';EXB._studioEditing=true;exbTab('studio')">+ Новый проект</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
      ${projects.map((p,i)=>`
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;transition:.15s;cursor:pointer;"
             onmouseover="this.style.borderColor='rgba(0,212,255,.5)'" onmouseout="this.style.borderColor='rgba(255,255,255,.08)'">
          <div style="font-size:26px;margin-bottom:8px;">🛠</div>
          <div style="font-size:13px;font-weight:700;margin-bottom:4px;">${eHtml(p.name)}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.35);">Объектов: ${(p.objects||[]).length} · ${p.updated||'—'}</div>
          <div style="display:flex;gap:6px;margin-top:12px;">
            <button class="exb-btn2 exb2-blue" style="font-size:10px;padding:5px 10px;" onclick="exbStudioOpenProj(${i})">✏️ Открыть</button>
            <button class="exb-btn2 exb2-red" style="font-size:10px;padding:5px 10px;" onclick="exbStudioDelProj(${i})">🗑</button>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}
function exbStudioOpenProj(idx) {
  const me=EXB.users[EXB.user]||{}, p=(me.projects||[])[idx]; if(!p)return;
  EXB.studioObjects=p.objects?p.objects.map(o=>({...o})):[];
  EXB.studioProjectName=p.name; EXB.studioScrollX=0; EXB.studioScrollY=0; EXB._studioEditing=true;
  exbTab('studio');
}
function exbStudioDelProj(idx) {
  if(!confirm('Удалить проект?'))return;
  const me=EXB.users[EXB.user]||{}; me.projects=me.projects||[]; me.projects.splice(idx,1);
  exbSaveUsers(); exbTab('studio');
}

function exbStudioInitCanvas() {
  const wrap=document.getElementById('exb-canvas-wrap');
  const canvas=document.getElementById('exb-studio-canvas');
  if(!wrap||!canvas)return;
  // Match canvas to wrapper
  function resize() {
    canvas.width=wrap.clientWidth; canvas.height=wrap.clientHeight;
    exbStudioRedraw();
  }
  resize();
  EXB._studioResizeObserver = new ResizeObserver(resize);
  EXB._studioResizeObserver.observe(wrap);

  EXB.studioPaintCtx=canvas.getContext('2d');
  canvas.addEventListener('mousedown',exbStudioDown);
  canvas.addEventListener('mousemove',exbStudioMove);
  canvas.addEventListener('mouseup',  ()=>{EXB.studioDragging=null;EXB.studioPanning=false;});
  canvas.addEventListener('mouseleave',()=>{EXB.studioDragging=null;EXB.studioPanning=false;});
  canvas.addEventListener('contextmenu',exbStudioRClick);
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    EXB.studioScrollX=Math.max(0,Math.min(EXB.CANVAS_W,EXB.studioScrollX+e.deltaX));
    EXB.studioScrollY=Math.max(0,Math.min(EXB.CANVAS_H,EXB.studioScrollY+e.deltaY));
    const si=document.getElementById('exb-scroll-info');
    if(si)si.textContent=`${Math.round(EXB.studioScrollX)}, ${Math.round(EXB.studioScrollY)}`;
    exbStudioRedraw();
  },{passive:false});

  // Touch panning
  let touchStart=null;
  canvas.addEventListener('touchstart',e=>{e.preventDefault();const t=e.touches[0];touchStart={x:t.clientX+EXB.studioScrollX,y:t.clientY+EXB.studioScrollY};},{passive:false});
  canvas.addEventListener('touchmove',e=>{e.preventDefault();if(!touchStart)return;const t=e.touches[0];EXB.studioScrollX=Math.max(0,touchStart.x-t.clientX);EXB.studioScrollY=Math.max(0,touchStart.y-t.clientY);exbStudioRedraw();},{passive:false});
  canvas.addEventListener('touchend',()=>{touchStart=null;});
  exbStudioRedraw();
}

function exbStudioDown(e) {
  if(e.button===1){EXB.studioPanning=true;EXB.studioPanStart={x:e.clientX+EXB.studioScrollX,y:e.clientY+EXB.studioScrollY};return;}
  const {x,y}=exbStudioPos(e), tool=EXB.studioTool;
  if(tool==='eraser'){EXB.studioObjects=EXB.studioObjects.filter(o=>!(x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h));exbStudioRedraw();exbObjCount();return;}
  if(tool==='select'){
    EXB.studioSelObj=null;
    for(let i=EXB.studioObjects.length-1;i>=0;i--){const o=EXB.studioObjects[i];if(x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h){EXB.studioSelObj=o;EXB.studioDragging={ox:x-o.x,oy:y-o.y};break;}}
    exbStudioRedraw();return;
  }
  const T=EXB.TILE, sx=Math.floor(x/T)*T, sy=Math.floor(y/T)*T;
  const col=EXB.studioColor||EXB_BLOCK_COLORS[tool]||'#888';
  const sizes={block:[T*3,T],platform:[T*4,T/2],spike:[T,T],spring:[T,T*1.5|0],lava:[T*2,T/2],ice:[T*3,T],deco:[T*2,T*3]};
  const [bw,bh]=sizes[tool]||[T,T];
  EXB.studioObjects.push({type:tool,x:sx,y:sy,w:bw,h:bh,color:col});
  exbStudioRedraw();exbObjCount();
}
function exbStudioMove(e) {
  if(EXB.studioPanning&&EXB.studioPanStart){
    EXB.studioScrollX=Math.max(0,EXB.studioPanStart.x-e.clientX);
    EXB.studioScrollY=Math.max(0,EXB.studioPanStart.y-e.clientY);
    const si=document.getElementById('exb-scroll-info');
    if(si)si.textContent=`${Math.round(EXB.studioScrollX)}, ${Math.round(EXB.studioScrollY)}`;
    exbStudioRedraw();return;
  }
  if(EXB.studioTool==='select'&&EXB.studioSelObj&&EXB.studioDragging){
    const {x,y}=exbStudioPos(e), T=EXB.TILE;
    EXB.studioSelObj.x=Math.floor((x-EXB.studioDragging.ox)/T)*T;
    EXB.studioSelObj.y=Math.floor((y-EXB.studioDragging.oy)/T)*T;
    exbStudioRedraw();
  }
}
function exbStudioRClick(e){e.preventDefault();const{x,y}=exbStudioPos(e);const idx=EXB.studioObjects.findLastIndex(o=>x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h);if(idx>=0){EXB.studioObjects.splice(idx,1);exbStudioRedraw();exbObjCount();}}
function exbStudioPos(e){const r=document.getElementById('exb-studio-canvas').getBoundingClientRect();return{x:e.clientX-r.left+EXB.studioScrollX,y:e.clientY-r.top+EXB.studioScrollY};}
function exbObjCount(){const c=document.getElementById('exb-obj-count');if(c)c.textContent=EXB.studioObjects.length;}
function exbSetTool(t,btn){EXB.studioTool=t;document.querySelectorAll('.exb-tool-btn').forEach(b=>b.classList.remove('exb-tool-active'));if(btn)btn.classList.add('exb-tool-active');}
function exbPickColor(){const c=document.getElementById('exb-color-pick');if(c)c.click();}

function exbStudioRedraw() {
  const cv=EXB.studioPaintCtx; if(!cv)return;
  const canvas=document.getElementById('exb-studio-canvas'); if(!canvas)return;
  const W=canvas.width, H=canvas.height, T=EXB.TILE;
  const sx=EXB.studioScrollX, sy=EXB.studioScrollY;
  if(W===0||H===0)return;

  // Background gradient
  const grad=cv.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#12162a'); grad.addColorStop(1,'#0a0d1a');
  cv.fillStyle=grad; cv.fillRect(0,0,W,H);

  // Grid
  cv.strokeStyle='rgba(255,255,255,.035)'; cv.lineWidth=1;
  for(let x=(-(sx%T));x<W;x+=T){cv.beginPath();cv.moveTo(x,0);cv.lineTo(x,H);cv.stroke();}
  for(let y=(-(sy%T));y<H;y+=T){cv.beginPath();cv.moveTo(0,y);cv.lineTo(W,y);cv.stroke();}

  // Objects
  EXB.studioObjects.forEach(o=>{
    const ox=o.x-sx, oy=o.y-sy;
    if(ox+o.w<-10||ox>W+10||oy+o.h<-10||oy>H+10)return;
    const col=o.color||EXB_BLOCK_COLORS[o.type]||'#888';
    const sel=o===EXB.studioSelObj;
    cv.save();
    switch(o.type){
      case 'block': case 'ice':
        cv.fillStyle=col;cv.fillRect(ox,oy,o.w,o.h);
        cv.fillStyle='rgba(255,255,255,.15)';cv.fillRect(ox,oy,o.w,Math.min(7,o.h)); break;
      case 'platform':
        cv.fillStyle=col;cv.fillRect(ox,oy,o.w,o.h);
        cv.fillStyle='rgba(255,255,255,.3)';cv.fillRect(ox,oy,o.w,4); break;
      case 'lava':
        cv.fillStyle=col;cv.fillRect(ox,oy,o.w,o.h);
        cv.fillStyle='#ff6e00';
        for(let lx=0;lx<o.w;lx+=8){cv.fillRect(ox+lx,oy,6,4+3*Math.sin(lx/4));} break;
      case 'spike':
        cv.fillStyle=col;cv.beginPath();cv.moveTo(ox,oy+o.h);cv.lineTo(ox+o.w/2,oy);cv.lineTo(ox+o.w,oy+o.h);cv.closePath();cv.fill(); break;
      case 'spring':
        cv.fillStyle='#555';cv.fillRect(ox,oy+o.h-10,o.w,10);
        cv.strokeStyle=col;cv.lineWidth=2.5;
        for(let i=0;i<4;i++){cv.beginPath();cv.ellipse(ox+o.w/2,oy+o.h-10-i*((o.h-10)/4),o.w/2-3,4,0,0,Math.PI*2);cv.stroke();} break;
      case 'spawn':
        cv.fillStyle=col;cv.beginPath();cv.arc(ox+o.w/2,oy+o.h/2,o.w/2,0,Math.PI*2);cv.fill();
        cv.fillStyle='#fff';cv.font='bold 16px serif';cv.textAlign='center';cv.fillText('S',ox+o.w/2,oy+o.h/2+6); break;
      case 'coin':
        cv.fillStyle=col;cv.beginPath();cv.arc(ox+o.w/2,oy+o.h/2,o.w/2,0,Math.PI*2);cv.fill();
        cv.fillStyle='#8B6914';cv.font='bold 11px sans-serif';cv.textAlign='center';cv.fillText('E$',ox+o.w/2,oy+o.h/2+4); break;
      case 'enemy':
        cv.fillStyle=col;cv.beginPath();cv.arc(ox+o.w/2,oy+o.h/2,o.w/2,0,Math.PI*2);cv.fill();
        cv.font='20px serif';cv.textAlign='center';cv.fillText('💀',ox+o.w/2,oy+o.h/2+7); break;
      case 'deco':
        cv.fillStyle='rgba(0,80,20,.5)';cv.fillRect(ox+o.w/4,oy+o.h*.4,o.w/2,o.h*.6);
        cv.fillStyle=col;cv.beginPath();cv.ellipse(ox+o.w/2,oy+o.h*.4,o.w/2,o.h*.5,0,0,Math.PI*2);cv.fill(); break;
      default:
        cv.fillStyle=col;cv.fillRect(ox,oy,o.w,o.h);
    }
    if(sel){cv.strokeStyle='#fff';cv.lineWidth=2;cv.setLineDash([4,3]);cv.strokeRect(ox-1,oy-1,o.w+2,o.h+2);cv.setLineDash([]);}
    cv.restore();
  });
}

function exbStudioSave(){
  const name=EXB.studioProjectName.trim()||'Без названия';
  const me=EXB.users[EXB.user]; if(!me)return;
  const projs=me.projects=me.projects||[];
  const idx=projs.findIndex(p=>p.name===name);
  const data={name,objects:EXB.studioObjects.map(o=>({...o})),updated:new Date().toLocaleString('ru')};
  if(idx>=0)projs[idx]=data;else projs.unshift(data);
  exbSaveUsers();
  exbNotif('ExiStudio',`"${name}" сохранён ✓`,'💾');
}
function exbStudioBaseplate(){
  EXB.studioObjects=EXB_BASEPLATE.map(o=>({...o}));EXB.studioProjectName='Baseplate';
  EXB.studioScrollX=0;EXB.studioScrollY=0;EXB._studioEditing=true;
  const ni=document.getElementById('exb-proj-name');if(ni)ni.value='Baseplate';
  exbStudioRedraw();exbObjCount();exbNotif('ExiStudio','Baseplate загружен!','🏗');
}
function exbStudioClear(){if(!confirm('Очистить все объекты?'))return;EXB.studioObjects=[];exbStudioRedraw();exbObjCount();}
function exbStudioTest(){exbOpenGame({name:'Тест: '+EXB.studioProjectName,icon:'🛠',color:'#1a2040',iconImage:null,objects:EXB.studioObjects.map(o=>({...o})),author:EXB.user});}

// ═══════════════════════════════════════
// PUBLISH DIALOG
// ═══════════════════════════════════════
function exbPublishDialog(){
  const me=EXB.users[EXB.user]||{};
  if(me.isGuest){exbNotif('Exiblox','Гости не могут публиковать!','📤');return;}
  _exbPublishIconData=null;
  const ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:99999;display:flex;align-items:center;justify-content:center;';
  ov.innerHTML=`<div onclick="event.stopPropagation()" style="background:#1a1e2c;border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:30px 34px;width:430px;max-height:90vh;overflow-y:auto;">
    <div style="font-size:19px;font-weight:700;margin-bottom:20px;">📤 Опубликовать игру</div>
    <div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:5px;">Название</div>
    <input id="exb-pub-name" class="exb-inp2" value="${eHtml(EXB.studioProjectName)}" style="width:100%;margin-bottom:14px;">
    <div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:5px;">Описание</div>
    <textarea id="exb-pub-desc" class="exb-inp2" rows="3" style="width:100%;resize:none;margin-bottom:18px;" placeholder="Расскажи об игре..."></textarea>
    <div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:8px;">Иконка игры</div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
      <div id="exb-icon-drop" onclick="document.getElementById('exb-icon-file').click()"
           ondragover="event.preventDefault();this.style.borderColor='#00d4ff'"
           ondragleave="this.style.borderColor='rgba(255,255,255,.2)'"
           ondrop="exbIconDrop(event)"
           style="width:84px;height:84px;border-radius:14px;background:#12162a;border:2px dashed rgba(255,255,255,.2);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;flex-shrink:0;">
        <span id="exb-icon-ph" style="font-size:26px;opacity:.3;">🎮</span>
      </div>
      <div>
        <button class="exb-btn2 exb2-blue" onclick="document.getElementById('exb-icon-file').click()" style="display:block;margin-bottom:6px;font-size:11px;">📁 Загрузить</button>
        <button class="exb-btn2 exb2-gray" onclick="exbIconClear()" style="display:block;font-size:11px;">✕ Убрать</button>
      </div>
    </div>
    <input type="file" id="exb-icon-file" accept="image/*" style="display:none;" onchange="exbIconFileChg(this)">
    <div style="display:flex;gap:10px;margin-top:6px;">
      <button class="exb-btn2 exb2-blue" id="exb-pub-ok" style="flex:1;padding:11px;font-size:13px;" onclick="exbDoPublish()">🚀 Опубликовать</button>
      <button class="exb-btn2 exb2-gray" onclick="this.closest('[style*=fixed]').remove()">Отмена</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click',()=>ov.remove());
}
function exbIconFileChg(inp){const f=inp.files[0];if(!f)return;if(f.size>1024*1024){exbNotif('Exiblox','Макс 1МБ!','⚠️');return;}const r=new FileReader();r.onload=e=>{_exbPublishIconData=e.target.result;exbIconPrev(_exbPublishIconData);};r.readAsDataURL(f);}
function exbIconDrop(e){e.preventDefault();const f=e.dataTransfer?.files?.[0];if(!f||!f.type.startsWith('image/'))return;if(f.size>1024*1024)return;const r=new FileReader();r.onload=ev=>{_exbPublishIconData=ev.target.result;exbIconPrev(_exbPublishIconData);};r.readAsDataURL(f);}
function exbIconPrev(src){const d=document.getElementById('exb-icon-drop'),ph=document.getElementById('exb-icon-ph');if(!d)return;if(ph)ph.style.display='none';d.querySelector('img')?.remove();const img=document.createElement('img');img.src=src;img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:12px;';d.appendChild(img);}
function exbIconClear(){_exbPublishIconData=null;const d=document.getElementById('exb-icon-drop'),ph=document.getElementById('exb-icon-ph');if(!d)return;d.querySelector('img')?.remove();if(ph)ph.style.display='';}

function exbDoPublish(){
  if(EXB._publishing)return; EXB._publishing=true;
  const btn=document.getElementById('exb-pub-ok');if(btn){btn.disabled=true;btn.textContent='⏳...';}
  const name=(document.getElementById('exb-pub-name')?.value||'').trim()||'Untitled';
  const desc=(document.getElementById('exb-pub-desc')?.value||'').trim()||'';
  EXB.games=exbLoadGames();
  const dup=EXB.games.find(g=>g.author===EXB.user&&g.name===name);
  if(dup){dup.objects=EXB.studioObjects.map(o=>({...o}));dup.iconImage=_exbPublishIconData||dup.iconImage||null;dup.updated=new Date().toLocaleDateString('ru');exbSaveGames();document.querySelector('[style*=fixed]')?.remove();exbNotif('Exiblox',`"${name}" обновлена!`,'📤');EXB._publishing=false;return;}
  const id=Math.random().toString(36).slice(2,10).toUpperCase();
  const game={id,name,desc,author:EXB.user,objects:EXB.studioObjects.map(o=>({...o})),icon:EXB_ICONS[Math.floor(Math.random()*EXB_ICONS.length)],iconImage:_exbPublishIconData||null,color:EXB_COLORS[Math.floor(Math.random()*EXB_COLORS.length)],rating:'100%',players:'0',created:new Date().toLocaleDateString('ru')};
  EXB.games.unshift(game); exbSaveGames();
  const me=EXB.users[EXB.user];if(me){me.pubGames=me.pubGames||[];me.pubGames.push(id);me.ecoins=(me.ecoins||0)+5;exbSaveUsers();}
  document.querySelector('[style*=fixed]')?.remove();
  exbNotif('Exiblox',`"${name}" опубликована! +5E$ 🎉`,'🎮');
  EXB._publishing=false;
  // update coins display
  const rc=document.querySelector('[style*=FFD700]');if(rc&&me)rc.textContent=`🪙 ${me.ecoins} E$`;
}

// ═══════════════════════════════════════
// FRIENDS
// ═══════════════════════════════════════
function exbFriends(c){
  const me=EXB.users[EXB.user]||{},frs=me.friends||[],reqs=me.requests||[];
  c.innerHTML=`<div class="exb-section">
    <div style="display:flex;align-items:center;margin-bottom:18px;">
      <div class="exb-sec-title" style="margin-bottom:0;">👥 Друзья</div>
      ${me.isGuest?'':`<button class="exb-btn2 exb2-blue" style="margin-left:auto;" onclick="exbAddFriendDlg()">+ Добавить</button>`}
    </div>
    ${!me.isGuest&&me.code?`<div class="exb-profile-card"><span style="font-size:13px;">🎫 Ваш код: <strong style="color:#00d4ff;">${me.code}</strong></span><span style="font-size:11px;color:rgba(255,255,255,.3);">Поделитесь с другом</span></div>`:''}
    ${reqs.length?`<div class="exb-sec-title" style="font-size:14px;margin-top:16px;">📩 Запросы (${reqs.length})</div>${reqs.map(r=>`<div class="exb-profile-card"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">👤</span><strong>${eHtml(r)}</strong></div><button class="exb-btn2 exb2-blue" style="font-size:11px;" onclick="exbAcceptFriend('${r}')">✓ Принять</button></div>`).join('')}`:''}
    <div class="exb-sec-title" style="font-size:14px;margin-top:18px;">Мои друзья (${frs.length})</div>
    ${frs.length?frs.map(f=>`<div class="exb-profile-card"><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:50%;background:rgba(0,212,255,.15);display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div><div><div style="font-size:13px;font-weight:600;">${eHtml(f)}</div></div></div></div>`).join(''):'<div style="color:rgba(255,255,255,.25);font-size:13px;padding:20px 0;">Нет друзей</div>'}
  </div>`;
}
function exbAddFriendDlg(){
  const me=EXB.users[EXB.user]||{};if(me.isGuest){exbNotif('Exiblox','Гости не могут добавлять!','👥');return;}
  const nick=prompt('Никнейм или код друга:');if(!nick)return;
  const t=Object.keys(EXB.users).find(u=>u===nick||EXB.users[u].code===nick.toUpperCase());
  if(!t){exbNotif('Exiblox','Не найден!','❌');return;}
  if(t===EXB.user){exbNotif('Exiblox','Нельзя добавить себя!','❌');return;}
  if((me.friends||[]).includes(t)){exbNotif('Exiblox','Уже в друзьях!','✅');return;}
  const them=EXB.users[t];them.requests=them.requests||[];
  if(them.requests.includes(EXB.user)){exbNotif('Exiblox','Запрос уже отправлен','📩');return;}
  them.requests.push(EXB.user);exbSaveUsers();exbNotif('Exiblox',`Запрос → ${t}`,'📩');
}
function exbAcceptFriend(from){
  const me=EXB.users[EXB.user];if(!me)return;
  me.requests=(me.requests||[]).filter(r=>r!==from);
  me.friends=me.friends||[];if(!me.friends.includes(from))me.friends.push(from);
  const th=EXB.users[from];if(th){th.friends=th.friends||[];if(!th.friends.includes(EXB.user))th.friends.push(EXB.user);}
  exbSaveUsers();exbTab('friends');exbNotif('Exiblox',`${from} добавлен!`,'✅');
}

// ═══════════════════════════════════════
// PUBLISH TAB
// ═══════════════════════════════════════
function exbPublish(c){
  const me=EXB.users[EXB.user]||{};
  if(me.isGuest){c.innerHTML=`<div style="text-align:center;padding:80px;color:rgba(255,255,255,.25);">📤 Гости не могут публиковать.<br><br><button class="exb-btn2 exb2-blue" onclick="exbLogout()">Создать аккаунт</button></div>`;return;}
  const myGames=EXB.games.filter(g=>g.author===EXB.user);
  c.innerHTML=`<div class="exb-section">
    <div style="display:flex;align-items:center;margin-bottom:16px;">
      <div class="exb-sec-title" style="margin-bottom:0;">📤 Мои игры (${myGames.length})</div>
      <button class="exb-btn2 exb2-blue" style="margin-left:auto;" onclick="exbTab('studio')">🛠 Studio</button>
    </div>
    ${myGames.length?`<div class="exb-cards-row">${exbGameCards(myGames)}</div>`:'<div style="color:rgba(255,255,255,.25);font-size:13px;padding:30px 0;">Нет опубликованных игр</div>'}
  </div>`;
}

// ═══════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════
function exbAvatar(c){
  const sid=EXB.skin||'red';
  c.innerHTML=`<div class="exb-section">
    <div class="exb-sec-title">🎭 Скин персонажа</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      ${EXB_SKINS.map(sk=>`
        <div onclick="exbSelectSkin('${sk.id}')" style="width:150px;background:${sk.id===sid?'rgba(0,212,255,.15)':'rgba(255,255,255,.05)'};border:2px solid ${sk.id===sid?'#00d4ff':'rgba(255,255,255,.08)'};border-radius:16px;padding:16px 10px 12px;cursor:pointer;text-align:center;transition:.2s;">
          <canvas id="av-${sk.id}" width="70" height="90" style="display:block;margin:0 auto 8px;"></canvas>
          <div style="font-size:13px;font-weight:700;">${sk.name}</div>
          ${sk.id===sid?'<div style="font-size:11px;color:#00d4ff;margin-top:3px;">✓ Активен</div>':''}
        </div>`).join('')}
    </div>
  </div>`;
  EXB_SKINS.forEach(sk=>{const cv=document.getElementById(`av-${sk.id}`)?.getContext('2d');if(cv)exbDrawStickman(cv,35,80,sk,0.9,false,1,0);});
}
function exbSelectSkin(id){EXB.skin=id;localStorage.setItem(EXB_STORAGE_KEY+'skin',id);exbAvatar(document.getElementById('exb-content'));exbNotif('Exiblox','Скин изменён!','🎭');}

// ═══════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════
function exbProfile(c){
  const me=EXB.users[EXB.user]||{};
  const sk=EXB_SKINS.find(s=>s.id===(EXB.skin||'red'))||EXB_SKINS[0];
  c.innerHTML=`<div class="exb-section" style="max-width:520px;">
    <div class="exb-sec-title">👤 Профиль</div>

    <!-- PROFILE CARD -->
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:22px 24px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px;">
        <canvas id="profile-av" width="60" height="78" style="flex-shrink:0;"></canvas>
        <div style="flex:1;">
          <div style="font-size:20px;font-weight:800;margin-bottom:2px;">${me.isGuest?'Гость':EXB.user}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.35);margin-bottom:6px;">✦ Exiblox v4 · ${sk.name}</div>
          ${!me.isGuest?`<div style="font-size:11px;color:#00b2ff;">🎫 ${me.code||'—'}</div>`:''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:22px;font-weight:800;color:#FFD700;">${me.ecoins||0}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.35);">E$</div>
        </div>
      </div>

      <!-- STATS ROW -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px;">
        <div style="background:rgba(0,178,255,.1);border:1px solid rgba(0,178,255,.2);border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:18px;font-weight:800;color:#00b2ff;">${(me.friends||[]).length}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.5px;">Друзей</div>
        </div>
        <div style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.2);border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:18px;font-weight:800;color:#9b59b6;">${(me.projects||[]).length}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.5px;">Проектов</div>
        </div>
        <div style="background:rgba(46,204,113,.1);border:1px solid rgba(46,204,113,.2);border-radius:10px;padding:10px;text-align:center;">
          <div style="font-size:18px;font-weight:800;color:#2ecc71;">${(me.pubGames||[]).length}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.5px;">Игр</div>
        </div>
      </div>

      <!-- DESCRIPTION -->
      <div style="margin-bottom:14px;">
        <div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">📝 О себе</div>
        <textarea id="exb-prof-desc" class="exb-inp2" rows="3" style="width:100%;resize:vertical;min-height:60px;line-height:1.5;"
          placeholder="Расскажи о себе...">${eHtml(me.bio||'')}</textarea>
        <button class="exb-btn2 exb2-blue" style="margin-top:8px;font-size:11px;padding:6px 14px;" onclick="exbSaveBio()">💾 Сохранить описание</button>
      </div>

      ${!me.isGuest?`
      <!-- INFO -->
      <div style="border-top:1px solid rgba(255,255,255,.06);padding-top:14px;display:flex;flex-direction:column;gap:6px;">
        <div style="font-size:12px;color:rgba(255,255,255,.4);">📧 ${me.email||'—'}</div>
        ${me.joinDate?`<div style="font-size:11px;color:rgba(255,255,255,.25);">📅 Регистрация: ${me.joinDate}</div>`:''}
      </div>`:''}
    </div>

    <!-- ACTION BUTTONS -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="exb-btn2 exb2-blue" onclick="exbTab('avatar')" style="font-size:12px;">🎭 Сменить скин</button>
      <button class="exb-btn2 exb2-gray" onclick="exbTab('friends')" style="font-size:12px;">👥 Друзья</button>
      <button class="exb-btn2 exb2-gray" onclick="exbTab('studio')" style="font-size:12px;">🛠 Studio</button>
      <button class="exb-btn2 exb2-red" onclick="exbLogout()" style="margin-left:auto;font-size:12px;font-weight:700;">🚪 Выйти из аккаунта</button>
    </div>
  </div>`;
  const pc=document.getElementById('profile-av')?.getContext('2d');
  if(pc)exbDrawStickman(pc,30,72,sk,1.1,false,1,0);
}

function exbSaveBio(){
  const me=EXB.users[EXB.user];if(!me)return;
  const ta=document.getElementById('exb-prof-desc');if(!ta)return;
  me.bio=ta.value.slice(0,200);
  exbSaveUsers();
  exbNotif('Профиль','Описание сохранено!','💾');
}

// ═══════════════════════════════════════
// AI
// ═══════════════════════════════════════
function exbAI(c){
  c.innerHTML=`<div style="display:flex;flex-direction:column;height:100%;background:#0a0c14;overflow:hidden;">
    <div style="padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.06);font-size:15px;font-weight:700;background:#080a10;flex-shrink:0;">
      🤖 Exiblox AI <span style="font-size:11px;color:#2ecc71;margin-left:8px;">● Online</span>
    </div>
    <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;" id="exb-ai-msgs"></div>
    <div style="padding:7px 14px;border-top:1px solid rgba(255,255,255,.05);background:#080a10;flex-shrink:0;display:flex;gap:8px;flex-wrap:wrap;">
      ${['Как создать игру?','Что такое v4?','Как опубликовать?','Что нового?'].map(q=>`<div onclick="exbAIQ('${q}')" style="padding:5px 11px;border-radius:16px;background:rgba(255,255,255,.06);font-size:11px;color:rgba(255,255,255,.55);cursor:pointer;border:1px solid rgba(255,255,255,.07);">${q}</div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;padding:10px 14px;border-top:1px solid rgba(255,255,255,.06);background:#080a10;flex-shrink:0;">
      <input id="exb-ai-inp" style="flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:9px 13px;color:#fff;font-size:13px;font-family:inherit;outline:none;" placeholder="Задай вопрос..." onkeydown="if(event.key==='Enter'){event.preventDefault();exbAISend();}">
      <button class="exb-btn2 exb2-blue" onclick="exbAISend()" style="padding:9px 16px;">➤</button>
    </div>
  </div>`;
  exbAIMsg('bot','Привет! Я **Exiblox AI v4** 🤖\n\nМогу помочь с:\n• Созданием игр в Studio\n• Публикацией и магазином\n• Системой друзей\n\nSpeak up! 👇');
  EXB.aiHistory=[];
}
function exbAIMsg(who,text){
  const msgs=document.getElementById('exb-ai-msgs');if(!msgs)return;
  const div=document.createElement('div');
  div.style.cssText='display:flex;gap:8px;align-items:flex-start;'+(who==='user'?'flex-direction:row-reverse;':'');
  div.innerHTML=who==='bot'
    ?`<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#00d4ff,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🤖</div><div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:4px 14px 14px 14px;padding:10px 14px;font-size:13px;line-height:1.65;max-width:80%;">${eHtml(text).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}</div>`
    :`<div style="background:linear-gradient(135deg,#00d4ff,#0078d4);border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13px;line-height:1.6;max-width:72%;">${eHtml(text)}</div>`;
  msgs.appendChild(div);msgs.scrollTop=msgs.scrollHeight;
}
const EXB_AI_KB=[
  {k:['привет','hello','хай','прив'],a:'Привет, разработчик! 🎮 Exiblox v4 готов!\nСпрашивай!'},
  {k:['что нового','v4','версия 4','новое'],a:'✦ **Exiblox v4** — что нового:\n\n• Стрелки навигации в Studio\n• Фикс границ canvas\n• RedBall-управление в игре\n• Облачные аккаунты (localStorage)\n• ExibloxOGStore — новое приложение!\n• Больше скинов (6 штук)'},
  {k:['студия','studio','создать игру'],a:'🛠 **Создание игры:**\n\n1. Вкладка **Studio**\n2. Нажми **🏗 Baseplate** для старта\n3. Выбери инструмент, кликай по canvas\n4. Используй **стрелки** для навигации\n5. **▶ Тест** — протестировать\n6. **📤 Publish** — опубликовать!'},
  {k:['опубликовать','публикация','publish'],a:'📤 **Публикация:**\n\nStudio → кнопка **📤 Publish**\nВведи название + иконку\nНажми **🚀 Опубликовать**\n+5 E$ за каждую игру!'},
  {k:['стрелки','навигация','двигаться','прокрутка'],a:'🗺 **Навигация в Studio:**\n\n• ▲▼◀▶ — кнопки в углу canvas\n• Колёсико мыши — прокрутка\n• Средняя кнопка — перетаскивание\n• 🏠 — сброс к началу'},
  {k:['управление','играть','redball','красный шар'],a:'🎮 **Управление в игре:**\n\n📱 Мобиль: Джойстик + прыжок кнопкой\n⌨️ Клавиатура: ←→ движение, Пробел прыжок\n\nРеагирует как Red Ball 4!'},
  {k:['firebase','огонь','бд','база данных'],a:'🔥 **Firebase — проблема:**\n\nFirebase нужна конфигурация сервера.\nExiblox v4 использует **localStorage** — работает везде без сервера!\n\nВсе аккаунты, игры и прогресс сохраняются локально.'},
  {k:['друзья','добавить','код'],a:'👥 **Система друзей:**\n1. Вкладка **Friends**\n2. Нажми **+ Добавить**\n3. Введи ник или код (🎫 в профиле)'},
  {k:['спасибо','благодарю','thanks'],a:'Пожалуйста! 😊 Удачи в создании! 🎮\nMake it EXI! ✦'},
];
function exbAIResp(q){
  const lq=q.toLowerCase();let best=null,sc=0;
  for(const e of EXB_AI_KB){let s=0;for(const k of e.k)if(lq.includes(k))s+=k.length;if(s>sc){sc=s;best=e;}}
  return best&&sc>0?best.a:'Хм, не знаю ответа 😅\nНапиши **"что нового"** — расскажу о v4!';
}
function exbAISend(){const inp=document.getElementById('exb-ai-inp');if(!inp||EXB._aiTyping)return;const t=inp.value.trim();if(!t)return;inp.value='';exbAIMsg('user',t);EXB._aiTyping=true;const msgs=document.getElementById('exb-ai-msgs');const td=document.createElement('div');td.id='exb-ai-typing';td.style.cssText='display:flex;gap:8px;align-items:flex-start;';td.innerHTML=`<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#00d4ff,#7c3aed);display:flex;align-items:center;justify-content:center;font-size:14px;">🤖</div><div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:4px 14px 14px 14px;padding:12px 16px;display:flex;gap:4px;"><span class="edot"></span><span class="edot"></span><span class="edot"></span></div>`;msgs?.appendChild(td);msgs&&(msgs.scrollTop=msgs.scrollHeight);setTimeout(()=>{td.remove();EXB._aiTyping=false;exbAIMsg('bot',exbAIResp(t));},400+Math.random()*600);}
function exbAIQ(q){const i=document.getElementById('exb-ai-inp');if(i){i.value=q;exbAISend();}}

// ═══════════════════════════════════════
// DRAW STICKMAN
// ═══════════════════════════════════════
function exbDrawStickman(cv,cx,cy,sk,scale,jumping,facing,walkStep){
  const s=scale||1,HL=18*s,AL=15*s,HS=10*s,BL=20*s;
  cv.lineWidth=2.5*s;cv.lineCap='round';cv.strokeStyle=sk.limbColor;
  const lg=jumping?0:Math.sin(walkStep*.28)*22*s,lb=jumping?-20*s:0;
  cv.beginPath();cv.moveTo(cx,cy);cv.lineTo(cx-6*s+lg,cy+HL+lb);cv.stroke();
  cv.beginPath();cv.moveTo(cx,cy);cv.lineTo(cx+6*s-lg,cy+HL+lb);cv.stroke();
  cv.strokeStyle=sk.bodyColor;cv.lineWidth=3*s;
  cv.beginPath();cv.moveTo(cx,cy);cv.lineTo(cx,cy-BL);cv.stroke();
  cv.strokeStyle=sk.limbColor;cv.lineWidth=2.5*s;
  const ag=jumping?-30*s:Math.sin(walkStep*.28+Math.PI)*20*s,sy2=cy-BL+4*s;
  cv.beginPath();cv.moveTo(cx,sy2);cv.lineTo(cx-AL+ag,sy2+10*s+(jumping?-10*s:0));cv.stroke();
  cv.beginPath();cv.moveTo(cx,sy2);cv.lineTo(cx+AL-ag,sy2+10*s+(jumping?-10*s:0));cv.stroke();
  cv.fillStyle=sk.headColor;cv.strokeStyle=sk.limbColor;cv.lineWidth=2*s;
  cv.beginPath();cv.arc(cx,cy-BL-HS,HS,0,Math.PI*2);cv.fill();cv.stroke();
  if(sk.capColor){cv.fillStyle=sk.capColor;cv.beginPath();cv.ellipse(cx,cy-BL-HS*2+4*s,HS+5*s,4*s,0,0,Math.PI*2);cv.fill();cv.fillRect(cx-HS,cy-BL-HS*2-10*s,HS*2,14*s);}
  cv.fillStyle='#111';const ex=(facing<0?-3:3)*s;cv.beginPath();cv.arc(cx+ex,cy-BL-HS-2*s,2*s,0,Math.PI*2);cv.fill();
}

// ═══════════════════════════════════════
// GAME ENGINE — RedBall 4 style controls
// ═══════════════════════════════════════
function exbPlayGame(id){const g=EXB.games.find(g=>g.id===id);if(g)exbOpenGame(g);}

function exbOpenGame(game){
  const ov=document.createElement('div');
  ov.id='exb-game-ov';
  ov.style.cssText='position:fixed;inset:0;background:#0a0d18;z-index:99999;display:flex;flex-direction:column;overflow:hidden;';
  const W=Math.min(window.innerWidth,900), H=Math.min(window.innerHeight-110,520);
  ov.innerHTML=`
  <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:#060810;border-bottom:1px solid #1a1e30;flex-shrink:0;">
    ${game.iconImage?`<img src="${eHtml(game.iconImage)}" style="width:26px;height:26px;border-radius:6px;object-fit:cover;">`:`<span style="font-size:16px;">${game.icon||'🎮'}</span>`}
    <span style="font-size:14px;font-weight:700;">${eHtml(game.name)}</span>
    <span style="font-size:11px;color:rgba(255,255,255,.35);">by ${eHtml(game.author||'')}</span>
    <button onclick="document.getElementById('exb-game-ov').remove();document.removeEventListener('keydown',window._exbKeyD);document.removeEventListener('keyup',window._exbKeyU);" style="margin-left:auto;background:#e74c3c;border:none;color:#fff;padding:6px 14px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:700;">✕ Выйти</button>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a0d18;padding:10px;">
    <canvas id="exb-game-cv" width="${W}" height="${H}" style="border-radius:10px;box-shadow:0 0 50px rgba(0,0,0,.8);max-width:100%;"></canvas>
    <!-- RedBall-style mobile controls -->
    <div style="display:flex;align-items:center;justify-content:space-between;width:${W}px;max-width:100%;margin-top:8px;padding:0 10px;">
      <div style="display:flex;gap:6px;">
        <button id="exb-g-left" style="width:58px;height:58px;background:rgba(0,212,255,.12);border:2px solid rgba(0,212,255,.3);color:#00d4ff;border-radius:50%;font-size:22px;cursor:pointer;touch-action:manipulation;user-select:none;display:flex;align-items:center;justify-content:center;">◀</button>
        <button id="exb-g-right" style="width:58px;height:58px;background:rgba(0,212,255,.12);border:2px solid rgba(0,212,255,.3);color:#00d4ff;border-radius:50%;font-size:22px;cursor:pointer;touch-action:manipulation;user-select:none;display:flex;align-items:center;justify-content:center;">▶</button>
      </div>
      <div id="exb-g-score" style="font-size:15px;font-weight:700;color:#FFD700;">🪙 0</div>
      <button id="exb-g-jump" style="width:68px;height:68px;background:rgba(231,76,60,.2);border:2px solid rgba(231,76,60,.5);color:#e74c3c;border-radius:50%;font-size:28px;cursor:pointer;touch-action:manipulation;user-select:none;display:flex;align-items:center;justify-content:center;">▲</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  exbRunGame(game,W,H);
}

function exbRunGame(game,W,H){
  const canvas=document.getElementById('exb-game-cv');if(!canvas)return;
  const cv=canvas.getContext('2d');
  const GRAVITY=0.52,JUMP=-13,SPD=5;
  const skin=EXB_SKINS.find(s=>s.id===(EXB.skin||'red'))||EXB_SKINS[0];
  const objs=game.objects||[];
  const platforms=objs.filter(o=>['block','platform','ice'].includes(o.type));
  const coins=objs.filter(o=>o.type==='coin').map(o=>({x:o.x+o.w/2,y:o.y+o.h/2,r:14}));
  const spikes=objs.filter(o=>o.type==='spike');
  const springs=objs.filter(o=>o.type==='spring');
  const lava=objs.filter(o=>o.type==='lava');
  const enemies=objs.filter(o=>o.type==='enemy');

  if(!platforms.length){platforms.push({x:0,y:760,w:6400,h:40,color:'#4a9a30',type:'block'},{x:200,y:620,w:200,h:20,color:'#2980b9',type:'platform'},{x:500,y:520,w:200,h:20,color:'#8e44ad',type:'platform'});}
  if(!coins.length)[{x:260,y:590},{x:530,y:490},{x:800,y:390}].forEach(c=>coins.push({...c,r:14}));

  const spawn=objs.find(o=>o.type==='spawn');
  let px=spawn?spawn.x+20:(platforms[0]?.x||0)+80;
  let py=spawn?spawn.y-65:(platforms[0]?.y||760)-65;
  const sx0=px,sy0=py;
  let vx=0,vy=0,onGround=false,step=0,facing=1;
  let camX=px-W/2,camY=py-H*.4;
  const keys={left:false,right:false,jump:false};
  const col=new Set(); let scored=0; let _jumping=false;

  // Keyboard
  window._exbKeyD=e=>{if(e.key==='ArrowLeft'||e.key==='a')keys.left=true;if(e.key==='ArrowRight'||e.key==='d')keys.right=true;if((e.key===' '||e.key==='ArrowUp'||e.key==='w')&&!_jumping){e.preventDefault();keys.jump=true;}};
  window._exbKeyU=e=>{if(e.key==='ArrowLeft'||e.key==='a')keys.left=false;if(e.key==='ArrowRight'||e.key==='d')keys.right=false;if(e.key===' '||e.key==='ArrowUp'||e.key==='w')keys.jump=false;};
  document.addEventListener('keydown',window._exbKeyD);
  document.addEventListener('keyup',window._exbKeyU);

  // RedBall-style touch controls
  const btnL=document.getElementById('exb-g-left');
  const btnR=document.getElementById('exb-g-right');
  const btnJ=document.getElementById('exb-g-jump');
  const setPL=v=>keys.left=v, setPR=v=>keys.right=v;
  btnL?.addEventListener('touchstart',e=>{e.preventDefault();setPL(true);},{passive:false});
  btnL?.addEventListener('touchend',e=>{e.preventDefault();setPL(false);});
  btnR?.addEventListener('touchstart',e=>{e.preventDefault();setPR(true);},{passive:false});
  btnR?.addEventListener('touchend',e=>{e.preventDefault();setPR(false);});
  btnJ?.addEventListener('touchstart',e=>{e.preventDefault();if(onGround){vy=JUMP;onGround=false;}},{passive:false});
  btnJ?.addEventListener('click',()=>{if(onGround){vy=JUMP;onGround=false;}});
  btnL?.addEventListener('mousedown',()=>setPL(true));btnL?.addEventListener('mouseup',()=>setPL(false));btnL?.addEventListener('mouseleave',()=>setPL(false));
  btnR?.addEventListener('mousedown',()=>setPR(true));btnR?.addEventListener('mouseup',()=>setPR(false));btnR?.addEventListener('mouseleave',()=>setPR(false));

  // Joystick touch on canvas
  let touchId=null,touchJoy={x:0,startX:0};
  canvas.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];touchId=t.identifier;touchJoy={x:t.clientX,startX:t.clientX};},{passive:false});
  canvas.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches){if(t.identifier===touchId){const dx=t.clientX-touchJoy.startX;keys.left=dx<-10;keys.right=dx>10;}}},{passive:false});
  canvas.addEventListener('touchend',e=>{keys.left=false;keys.right=false;touchId=null;});

  function respawn(){px=sx0;py=sy0;vx=0;vy=0;}

  function update(){
    if(keys.left){vx=-SPD;facing=-1;}else if(keys.right){vx=SPD;facing=1;}else{vx*=0.7;}
    if(keys.jump&&onGround){vy=JUMP;onGround=false;keys.jump=false;}
    vy+=GRAVITY; px+=vx; py+=vy;
    if(px<0){px=0;vx=0;} if(py>3000)respawn();
    onGround=false;
    for(const p of platforms){
      if(px+22>p.x&&px<p.x+p.w&&py+60>p.y&&py+60<=p.y+p.h+Math.abs(vy)+2&&vy>=0){
        py=p.y-60;vy=0;onGround=true;
        if(p.type==='ice')vx*=0.98;
      }
    }
    for(const sp of springs){if(px+22>sp.x&&px<sp.x+sp.w&&py+60>sp.y&&py+60<=sp.y+sp.h&&vy>=0){vy=JUMP*1.7;onGround=false;}}
    for(const o of [...spikes,...lava,...enemies]){if(px+18>o.x&&px<o.x+o.w&&py+55>o.y&&py<o.y+o.h)respawn();}
    coins.forEach((c,i)=>{if(!col.has(i)&&Math.abs(px+12-c.x)<22&&Math.abs(py+30-c.y)<24){col.add(i);scored++;const sc=document.getElementById('exb-g-score');if(sc)sc.textContent=`🪙 ${scored} / ${coins.length}`;}});
    if(onGround&&Math.abs(vx)>.3)step++;else if(!onGround)step+=.5;
    const tcx=px+12-W*.45,tcy=py-H*.35;
    camX+=(tcx-camX)*.1;camY+=(tcy-camY)*.1;
    if(camX<0)camX=0;if(camY<-400)camY=-400;
    _jumping=!onGround;
  }

  function draw(){
    const g2=cv.createLinearGradient(0,0,0,H);g2.addColorStop(0,'#1a2040');g2.addColorStop(1,'#0d1230');
    cv.fillStyle=g2;cv.fillRect(0,0,W,H);
    cv.save();cv.translate(-Math.round(camX),-Math.round(camY));
    // Platforms
    for(const p of platforms){
      cv.fillStyle=p.color||'#4a9a30';cv.fillRect(p.x,p.y,p.w,p.h);
      cv.fillStyle='rgba(255,255,255,.15)';cv.fillRect(p.x,p.y,p.w,Math.min(8,p.h));
    }
    // Springs
    springs.forEach(sp=>{cv.fillStyle='#444';cv.fillRect(sp.x,sp.y+sp.h-8,sp.w,8);cv.strokeStyle='#f1c40f';cv.lineWidth=2;for(let i=0;i<3;i++){cv.beginPath();cv.ellipse(sp.x+sp.w/2,sp.y+sp.h-8-i*((sp.h-8)/3),sp.w/2-2,3,0,0,Math.PI*2);cv.stroke();}});
    // Spikes
    spikes.forEach(sk=>{cv.fillStyle='#aaa';cv.beginPath();cv.moveTo(sk.x,sk.y+sk.h);cv.lineTo(sk.x+sk.w/2,sk.y);cv.lineTo(sk.x+sk.w,sk.y+sk.h);cv.closePath();cv.fill();});
    // Lava
    lava.forEach(lv=>{cv.fillStyle='#ff4500';cv.fillRect(lv.x,lv.y,lv.w,lv.h);cv.fillStyle='#ff6e00';for(let lx=0;lx<lv.w;lx+=8){cv.fillRect(lv.x+lx,lv.y,6,3+2*Math.sin((lx+step*2)/5));}});
    // Enemies
    enemies.forEach(en=>{cv.fillStyle=en.color||'#e74c3c';cv.beginPath();cv.arc(en.x+en.w/2,en.y+en.h/2,en.w/2,0,Math.PI*2);cv.fill();cv.font='18px serif';cv.textAlign='center';cv.fillText('💀',en.x+en.w/2,en.y+en.h/2+6);});
    // Coins
    coins.forEach((c,i)=>{
      if(col.has(i))return;
      const pulse=1+.1*Math.sin(step*.2);
      cv.beginPath();cv.arc(c.x,c.y,c.r*pulse,0,Math.PI*2);
      cv.fillStyle='#FFD700';cv.fill();cv.strokeStyle='#FFA500';cv.lineWidth=2;cv.stroke();
      cv.fillStyle='#8B6914';cv.font='bold 8px monospace';cv.textAlign='center';cv.fillText('E$',c.x,c.y+3);
    });
    cv.textAlign='left';
    // Player
    exbDrawStickman(cv,Math.round(px+12),Math.round(py+60),skin,1.1,!onGround,facing,step);
    cv.restore();
    // HUD
    cv.fillStyle='rgba(0,0,0,.5)';cv.fillRect(0,0,W,26);
    cv.fillStyle='#fff';cv.font='bold 12px Segoe UI';cv.textAlign='left';cv.fillText(`🪙 ${scored}/${coins.length}`,12,18);
    cv.textAlign='center';cv.fillText(game.name||'',W/2,18);cv.textAlign='left';
  }

  let frameId;
  function loop(){
    if(!document.getElementById('exb-game-cv')){cancelAnimationFrame(frameId);document.removeEventListener('keydown',window._exbKeyD);document.removeEventListener('keyup',window._exbKeyU);return;}
    update();draw();frameId=requestAnimationFrame(loop);
  }
  loop();
}

// ═══════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════
function exbDoSearch(q){
  if(!q.trim())return;
  const res=EXB.games.filter(g=>g.name.toLowerCase().includes(q.toLowerCase()));
  const c=document.getElementById('exb-content');if(!c)return;
  EXB.tab='store';
  document.querySelectorAll('.exb-nav-btn').forEach(b=>{const m=b.getAttribute('onclick').match(/'(\w+)'/);if(m)b.classList.toggle('exb-nav-active',m[1]==='store');});
  c.innerHTML=`<div class="exb-section">
    <div class="exb-sec-title">🔍 Поиск: "${eHtml(q)}"</div>
    ${res.length?`<div class="exb-cards-row">${exbGameCards(res)}</div>`:
    '<div style="color:rgba(255,255,255,.25);font-size:13px;padding:30px 0;">Ничего не найдено 😕</div>'}
    <button class="exb-btn2 exb2-gray" style="margin-top:16px;" onclick="exbTab('store')">← Назад</button>
  </div>`;
}

// ═══════════════════════════════════════
// NOTIFY
// ═══════════════════════════════════════
function exbNotif(title,msg,icon){
  if(typeof showNotif==='function'){showNotif(title,msg,icon);return;}
  // fallback
  const d=document.createElement('div');
  d.style.cssText='position:fixed;bottom:20px;right:20px;background:#1a1e2c;border:1px solid rgba(0,212,255,.3);border-radius:12px;padding:12px 16px;font-size:13px;color:#fff;z-index:999999;max-width:280px;box-shadow:0 8px 24px rgba(0,0,0,.5);font-family:Segoe UI,sans-serif;';
  d.innerHTML=`<strong>${icon} ${title}</strong><br><span style="color:rgba(255,255,255,.7);font-size:12px;">${msg}</span>`;
  document.body.appendChild(d);setTimeout(()=>d.remove(),3000);
}

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════
function eHtml(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
