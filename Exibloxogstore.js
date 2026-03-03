'use strict';
// ╔════════════════════════════════════════════╗
// ║     ExibloxOGStore — Магазин игр           ║
// ║     Работает с localStorage Exiblox v4     ║
// ╚════════════════════════════════════════════╝

const STORE = {
  games: [],
  filter: 'all',
  search: '',
  sort: 'new',
};

const STORE_KEY = 'exiblox_v4_games';

// ── INIT ──────────────────────────────────────
function initExibloxOGStore() {
  const root = document.getElementById('exiblox-ogstore-root');
  if (!root) return;
  STORE.games = storeLoadGames();
  storeRender(root);
}
window.initExibloxOGStore = initExibloxOGStore;

function storeLoadGames() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
  catch(e) { return []; }
}

// ── RENDER ─────────────────────────────────────
function storeRender(root) {
  root.innerHTML = `
  <style>
    #exiblox-ogstore-root { font-family: 'Segoe UI', system-ui, sans-serif; color: #fff; height: 100%; overflow: hidden; display: flex; flex-direction: column; background: #08090f; }
    * { box-sizing: border-box; }
    .ogs-topbar { height: 54px; background: linear-gradient(90deg, #0a0c14, #0d1020); border-bottom: 1px solid rgba(255,255,255,.06); display: flex; align-items: center; padding: 0 18px; gap: 12px; flex-shrink: 0; }
    .ogs-logo { font-size: 16px; font-weight: 900; background: linear-gradient(135deg, #ff6b35, #f7c948, #ff6b35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; white-space: nowrap; letter-spacing: -.3px; }
    .ogs-badge { font-size: 10px; background: rgba(255,107,53,.2); border: 1px solid rgba(255,107,53,.4); color: #ff6b35; padding: 2px 7px; border-radius: 10px; font-weight: 700; letter-spacing: .5px; }
    .ogs-search { flex: 1; max-width: 320px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); border-radius: 20px; padding: 7px 14px; display: flex; align-items: center; gap: 7px; }
    .ogs-search input { background: none; border: none; outline: none; color: #fff; font-size: 12px; width: 100%; font-family: inherit; }
    .ogs-search input::placeholder { color: rgba(255,255,255,.28); }
    .ogs-stats { margin-left: auto; display: flex; gap: 14px; }
    .ogs-stat { text-align: center; }
    .ogs-stat-n { font-size: 16px; font-weight: 800; color: #f7c948; line-height: 1; }
    .ogs-stat-l { font-size: 9px; color: rgba(255,255,255,.35); text-transform: uppercase; letter-spacing: .5px; }
    .ogs-filters { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #0a0c15; border-bottom: 1px solid rgba(255,255,255,.04); flex-shrink: 0; flex-wrap: wrap; }
    .ogs-filter-btn { padding: 5px 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.05); color: rgba(255,255,255,.5); font-size: 11px; cursor: pointer; transition: .15s; font-family: inherit; }
    .ogs-filter-btn:hover { border-color: rgba(255,107,53,.5); color: #fff; }
    .ogs-filter-active { background: rgba(255,107,53,.18) !important; border-color: rgba(255,107,53,.5) !important; color: #ff6b35 !important; font-weight: 700; }
    .ogs-sort { margin-left: auto; display: flex; align-items: center; gap: 6px; }
    .ogs-sort-sel { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 5px 10px; color: #fff; font-size: 11px; font-family: inherit; outline: none; cursor: pointer; }
    .ogs-content { flex: 1; overflow-y: auto; padding: 18px 20px 20px; }
    .ogs-content::-webkit-scrollbar { width: 4px; }
    .ogs-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 3px; }
    .ogs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(185px, 1fr)); gap: 14px; }
    .ogs-card { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; overflow: hidden; cursor: pointer; transition: .18s; }
    .ogs-card:hover { transform: translateY(-4px); border-color: rgba(255,107,53,.5); box-shadow: 0 10px 30px rgba(255,107,53,.1); }
    .ogs-card-thumb { height: 120px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
    .ogs-card-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .ogs-card-body { padding: 10px 12px 12px; }
    .ogs-card-name { font-size: 13px; font-weight: 700; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ogs-card-meta { font-size: 10px; color: rgba(255,255,255,.35); display: flex; justify-content: space-between; align-items: center; }
    .ogs-card-author { display: flex; align-items: center; gap: 4px; }
    .ogs-card-play { margin-top: 9px; width: 100%; padding: 7px; background: linear-gradient(135deg, #ff6b35, #f7c948); border: none; border-radius: 8px; color: #000; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: .15s; }
    .ogs-card-play:hover { opacity: .9; transform: scale(1.02); }
    .ogs-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: rgba(255,255,255,.2); text-align: center; }
    .ogs-game-modal { position: fixed; inset: 0; background: rgba(0,0,0,.85); z-index: 99999; display: flex; align-items: center; justify-content: center; }
    .ogs-game-inner { background: #11141f; border: 1px solid rgba(255,255,255,.1); border-radius: 18px; padding: 0; overflow: hidden; max-width: 900px; width: 95%; max-height: 95vh; display: flex; flex-direction: column; }
    .ogs-game-header { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: #0a0c15; border-bottom: 1px solid rgba(255,255,255,.07); flex-shrink: 0; }
    .ogs-game-body { flex: 1; overflow: auto; }
    .ogs-sec { padding: 20px; }
    .ogs-sec-title { font-size: 15px; font-weight: 700; margin-bottom: 14px; color: rgba(255,255,255,.8); }
    .ogs-tag { display: inline-block; padding: 3px 9px; border-radius: 10px; background: rgba(255,107,53,.15); border: 1px solid rgba(255,107,53,.3); color: #ff6b35; font-size: 10px; margin-right: 5px; margin-bottom: 5px; }
    .ogs-play-big { width: 100%; padding: 14px; background: linear-gradient(135deg, #ff6b35, #f7c948); border: none; border-radius: 10px; color: #000; font-size: 15px; font-weight: 800; cursor: pointer; font-family: inherit; transition: .2s; letter-spacing: .3px; }
    .ogs-play-big:hover { opacity: .9; transform: translateY(-1px); }
    @keyframes ogs-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .ogs-card { animation: ogs-fade .25s ease both; }
    .ogs-featured-banner { background: linear-gradient(135deg, rgba(255,107,53,.12), rgba(247,201,72,.08)); border: 1px solid rgba(255,107,53,.2); border-radius: 14px; padding: 18px 22px; margin-bottom: 20px; display: flex; align-items: center; gap: 18px; }
    .ogs-refresh-btn { padding: 6px 14px; border-radius: 20px; background: rgba(255,107,53,.15); border: 1px solid rgba(255,107,53,.3); color: #ff6b35; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit; transition: .15s; }
    .ogs-refresh-btn:hover { background: rgba(255,107,53,.25); }
  </style>

  <!-- TOPBAR -->
  <div class="ogs-topbar">
    <div class="ogs-logo">🏪 ExibloxOGStore</div>
    <div class="ogs-badge">v4</div>
    <div class="ogs-search">
      <span style="font-size:11px;opacity:.35">🔍</span>
      <input id="ogs-search-inp" placeholder="Поиск игр..." oninput="ogsSearch(this.value)" onkeydown="if(event.key==='Escape')ogsSearch('')">
    </div>
    <div class="ogs-stats">
      <div class="ogs-stat">
        <div class="ogs-stat-n" id="ogs-game-count">${STORE.games.length}</div>
        <div class="ogs-stat-l">Игр</div>
      </div>
      <div class="ogs-stat">
        <div class="ogs-stat-n" id="ogs-player-count">${countPlayers()}</div>
        <div class="ogs-stat-l">Игроков</div>
      </div>
    </div>
    <button class="ogs-refresh-btn" onclick="ogsRefresh()">🔄 Обновить</button>
  </div>

  <!-- FILTERS -->
  <div class="ogs-filters">
    <button class="ogs-filter-btn ogs-filter-active" onclick="ogsFilter('all',this)">🎮 Все</button>
    <button class="ogs-filter-btn" onclick="ogsFilter('new',this)">🆕 Новые</button>
    <button class="ogs-filter-btn" onclick="ogsFilter('top',this)">⭐ Топ</button>
    <button class="ogs-filter-btn" onclick="ogsFilter('mine',this)">👤 Мои игры</button>
    <div class="ogs-sort">
      <span style="font-size:11px;color:rgba(255,255,255,.35);">Сортировка:</span>
      <select class="ogs-sort-sel" id="ogs-sort-sel" onchange="ogsSort(this.value)">
        <option value="new">По новизне</option>
        <option value="name">По названию</option>
        <option value="author">По автору</option>
      </select>
    </div>
  </div>

  <!-- CONTENT -->
  <div class="ogs-content" id="ogs-content"></div>
  `;

  ogsRenderGames();
}

function countPlayers() {
  try { return Object.keys(JSON.parse(localStorage.getItem('exiblox_v4_users') || '{}')).length; }
  catch(e) { return 0; }
}

function ogsGetCurUser() {
  try { return JSON.parse(localStorage.getItem('exiblox_v4_curuser') || 'null'); }
  catch(e) { return null; }
}

function ogsFilter(f, btn) {
  STORE.filter = f;
  document.querySelectorAll('.ogs-filter-btn').forEach(b => b.classList.remove('ogs-filter-active'));
  if(btn) btn.classList.add('ogs-filter-active');
  ogsRenderGames();
}

function ogsSort(s) {
  STORE.sort = s;
  ogsRenderGames();
}

function ogsSearch(q) {
  STORE.search = q.toLowerCase().trim();
  ogsRenderGames();
}

function ogsRefresh() {
  STORE.games = storeLoadGames();
  const gc = document.getElementById('ogs-game-count');
  const pc = document.getElementById('ogs-player-count');
  if(gc) gc.textContent = STORE.games.length;
  if(pc) pc.textContent = countPlayers();
  ogsRenderGames();
  // pulse animation on refresh
  const btn = document.querySelector('.ogs-refresh-btn');
  if(btn) { btn.textContent = '✓ Обновлено!'; setTimeout(()=>btn.textContent='🔄 Обновить', 1500); }
}

function ogsRenderGames() {
  const c = document.getElementById('ogs-content'); if(!c) return;
  let games = [...STORE.games];
  const curUser = ogsGetCurUser();

  // Filter
  if(STORE.filter === 'mine') {
    games = games.filter(g => g.author === curUser);
  } else if(STORE.filter === 'new') {
    games = games.slice(0,12);
  } else if(STORE.filter === 'top') {
    games = games.slice().sort(()=>Math.random()-.5);
  }

  // Search
  if(STORE.search) {
    games = games.filter(g =>
      g.name?.toLowerCase().includes(STORE.search) ||
      g.author?.toLowerCase().includes(STORE.search) ||
      g.desc?.toLowerCase().includes(STORE.search)
    );
  }

  // Sort
  if(STORE.sort === 'name') games.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  else if(STORE.sort === 'author') games.sort((a,b)=>(a.author||'').localeCompare(b.author||''));

  if(games.length === 0) {
    c.innerHTML = `<div class="ogs-empty">
      <div style="font-size:58px;margin-bottom:16px;">${STORE.search ? '🔍' : STORE.filter==='mine' ? '📤' : '🎮'}</div>
      <div style="font-size:16px;margin-bottom:8px;">${STORE.search ? `Нет игр по "${STORE.search}"` : STORE.filter==='mine' ? 'Нет ваших игр' : 'Магазин пуст'}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.2);">Создайте игру в Exiblox Studio!</div>
    </div>`; return;
  }

  // Featured banner (first game)
  const featured = games[0];
  const rest = games.slice(1);

  c.innerHTML = `
  ${featured ? `
  <div class="ogs-featured-banner" onclick="ogsOpenGame('${featured.id}')">
    <div style="width:80px;height:80px;border-radius:14px;background:${featured.color||'#1a2040'};display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
      ${featured.iconImage ? `<img src="${eHtml(featured.iconImage)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">` : `<span style="font-size:40px;">${featured.icon||'🎮'}</span>`}
    </div>
    <div style="flex:1;">
      <div style="font-size:11px;color:#ff6b35;font-weight:700;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">✦ Рекомендуем</div>
      <div style="font-size:18px;font-weight:800;margin-bottom:4px;">${eHtml(featured.name)}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.45);">by ${eHtml(featured.author)} · ${featured.desc||'Нет описания'}</div>
    </div>
    <button onclick="event.stopPropagation();ogsPlayGame('${featured.id}')" class="ogs-play-big" style="width:120px;padding:10px;">▶ Играть</button>
  </div>
  ` : ''}
  ${rest.length ? `<div style="font-size:13px;font-weight:700;color:rgba(255,255,255,.5);margin-bottom:12px;">Все игры (${games.length})</div><div class="ogs-grid">${rest.map((g,idx)=>ogsCard(g,idx)).join('')}</div>` : ''}
  `;
}

function ogsCard(g, idx) {
  return `<div class="ogs-card" style="animation-delay:${idx*0.04}s" onclick="ogsOpenGame('${g.id}')">
    <div class="ogs-card-thumb" style="background:${g.color||'#1a2040'};">
      ${g.iconImage ? `<img src="${eHtml(g.iconImage)}" alt="">` : `<span style="font-size:50px;">${g.icon||'🎮'}</span>`}
      <div style="position:absolute;top:7px;right:7px;background:rgba(0,0,0,.5);border-radius:6px;padding:2px 7px;font-size:10px;font-weight:700;">👍 ${g.rating||'100%'}</div>
    </div>
    <div class="ogs-card-body">
      <div class="ogs-card-name">${eHtml(g.name)}</div>
      <div class="ogs-card-meta">
        <span class="ogs-card-author">👤 ${eHtml(g.author||'—')}</span>
        <span>${g.created||''}</span>
      </div>
      <button class="ogs-card-play" onclick="event.stopPropagation();ogsPlayGame('${g.id}')">▶ Играть</button>
    </div>
  </div>`;
}

function ogsOpenGame(id) {
  const g = STORE.games.find(g=>g.id===id); if(!g)return;
  const ov = document.createElement('div');
  ov.className='ogs-game-modal';
  ov.innerHTML=`<div class="ogs-game-inner" onclick="event.stopPropagation()">
    <div class="ogs-game-header">
      <div style="width:44px;height:44px;border-radius:10px;background:${g.color||'#1a2040'};display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
        ${g.iconImage?`<img src="${eHtml(g.iconImage)}" style="width:100%;height:100%;object-fit:cover;">`:
        `<span style="font-size:24px;">${g.icon||'🎮'}</span>`}
      </div>
      <div style="flex:1;">
        <div style="font-size:16px;font-weight:800;">${eHtml(g.name)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.4);">by ${eHtml(g.author)} · Создана: ${g.created||'—'}</div>
      </div>
      <button onclick="this.closest('.ogs-game-modal').remove()" style="background:#e74c3c;border:none;color:#fff;padding:7px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;">✕</button>
    </div>
    <div class="ogs-game-body">
      <div class="ogs-sec">
        <div class="ogs-sec-title">Об игре</div>
        <p style="font-size:13px;color:rgba(255,255,255,.6);line-height:1.65;margin:0 0 16px;">${eHtml(g.desc||'Нет описания')}</p>
        <div style="margin-bottom:18px;">
          <span class="ogs-tag">🎮 Платформер</span>
          <span class="ogs-tag">👤 ${eHtml(g.author)}</span>
          <span class="ogs-tag">🧱 ${(g.objects||[]).length} объектов</span>
          <span class="ogs-tag">👍 ${g.rating||'100%'}</span>
        </div>
        <button class="ogs-play-big" onclick="this.closest('.ogs-game-modal').remove();ogsPlayGame('${g.id}')">▶ Играть сейчас</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click',()=>ov.remove());
}

function ogsPlayGame(id) {
  const g = STORE.games.find(g=>g.id===id); if(!g)return;
  if(typeof exbOpenGame==='function'){exbOpenGame(g);return;}
  // standalone player fallback
  ogsStandalonePlayer(g);
}

// ── Standalone game player (if Exiblox not loaded) ──
function ogsStandalonePlayer(game) {
  const ov=document.createElement('div');
  ov.id='ogs-player-ov';
  ov.style.cssText='position:fixed;inset:0;background:#0a0d18;z-index:999999;display:flex;flex-direction:column;overflow:hidden;';
  const W=Math.min(window.innerWidth,900), H=Math.min(window.innerHeight-110,520);
  ov.innerHTML=`
  <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:#060810;border-bottom:1px solid #1a1e30;flex-shrink:0;font-family:Segoe UI,sans-serif;">
    <span style="font-size:18px;">${game.icon||'🎮'}</span>
    <span style="font-size:14px;font-weight:700;color:#fff;">${eHtml(game.name)}</span>
    <span style="font-size:11px;color:rgba(255,255,255,.35);">by ${eHtml(game.author||'')}</span>
    <button onclick="document.getElementById('ogs-player-ov').remove();document.removeEventListener('keydown',window._ogsKD);document.removeEventListener('keyup',window._ogsKU);" style="margin-left:auto;background:#e74c3c;border:none;color:#fff;padding:6px 14px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:700;">✕ Выйти</button>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a0d18;padding:10px;">
    <canvas id="ogs-game-cv" width="${W}" height="${H}" style="border-radius:10px;box-shadow:0 0 50px rgba(0,0,0,.8);max-width:100%;"></canvas>
    <div style="display:flex;align-items:center;justify-content:space-between;width:${W}px;max-width:100%;margin-top:8px;padding:0 10px;font-family:Segoe UI,sans-serif;">
      <div style="display:flex;gap:6px;">
        <button id="ogs-g-l" style="width:58px;height:58px;background:rgba(255,107,53,.12);border:2px solid rgba(255,107,53,.3);color:#ff6b35;border-radius:50%;font-size:22px;cursor:pointer;touch-action:manipulation;">◀</button>
        <button id="ogs-g-r" style="width:58px;height:58px;background:rgba(255,107,53,.12);border:2px solid rgba(255,107,53,.3);color:#ff6b35;border-radius:50%;font-size:22px;cursor:pointer;touch-action:manipulation;">▶</button>
      </div>
      <div id="ogs-g-score" style="font-size:15px;font-weight:700;color:#FFD700;font-family:Segoe UI,sans-serif;">🪙 0</div>
      <button id="ogs-g-j" style="width:68px;height:68px;background:rgba(247,201,72,.15);border:2px solid rgba(247,201,72,.4);color:#f7c948;border-radius:50%;font-size:28px;cursor:pointer;touch-action:manipulation;">▲</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  ogsRunGame(game,W,H);
}

function ogsRunGame(game,W,H){
  const canvas=document.getElementById('ogs-game-cv');if(!canvas)return;
  const cv=canvas.getContext('2d');
  const GRAVITY=0.52,JUMP=-13,SPD=5;
  const SKINS=[{bodyColor:'#ff6b35',headColor:'#ff6b35',limbColor:'#d44a1a',capColor:null}];
  const skin=SKINS[0];
  const objs=game.objects||[];
  const plats=objs.filter(o=>['block','platform','ice'].includes(o.type));
  const coins=objs.filter(o=>o.type==='coin').map(o=>({x:o.x+o.w/2,y:o.y+o.h/2}));
  const spikes=objs.filter(o=>o.type==='spike');
  const lava=objs.filter(o=>o.type==='lava');
  const springs=objs.filter(o=>o.type==='spring');
  const enemies=objs.filter(o=>o.type==='enemy');
  if(!plats.length)plats.push({x:0,y:760,w:6400,h:40,color:'#4a9a30',type:'block'},{x:200,y:620,w:200,h:20,color:'#2980b9',type:'platform'});
  if(!coins.length)[{x:250,y:590},{x:500,y:490}].forEach(c=>coins.push(c));
  const spawn=objs.find(o=>o.type==='spawn');
  let px=spawn?spawn.x+20:(plats[0]?.x||0)+80,py=spawn?spawn.y-65:(plats[0]?.y||760)-65;
  const sx0=px,sy0=py;
  let vx=0,vy=0,onG=false,step=0,facing=1,camX=px-W/2,camY=py-H*.4;
  const colSet=new Set();let scored=0;
  const keys={l:false,r:false};

  window._ogsKD=e=>{if(e.key==='ArrowLeft'||e.key==='a')keys.l=true;if(e.key==='ArrowRight'||e.key==='d')keys.r=true;if((e.key===' '||e.key==='ArrowUp')&&onG){e.preventDefault();vy=JUMP;onG=false;}};
  window._ogsKU=e=>{if(e.key==='ArrowLeft'||e.key==='a')keys.l=false;if(e.key==='ArrowRight'||e.key==='d')keys.r=false;};
  document.addEventListener('keydown',window._ogsKD);
  document.addEventListener('keyup',window._ogsKU);

  const bL=document.getElementById('ogs-g-l'),bR=document.getElementById('ogs-g-r'),bJ=document.getElementById('ogs-g-j');
  bL?.addEventListener('touchstart',e=>{e.preventDefault();keys.l=true;},{passive:false});bL?.addEventListener('touchend',()=>keys.l=false);
  bR?.addEventListener('touchstart',e=>{e.preventDefault();keys.r=true;},{passive:false});bR?.addEventListener('touchend',()=>keys.r=false);
  bJ?.addEventListener('touchstart',e=>{e.preventDefault();if(onG){vy=JUMP;onG=false;}},{passive:false});
  bJ?.addEventListener('click',()=>{if(onG){vy=JUMP;onG=false;}});
  bL?.addEventListener('mousedown',()=>keys.l=true);bL?.addEventListener('mouseup',()=>keys.l=false);bL?.addEventListener('mouseleave',()=>keys.l=false);
  bR?.addEventListener('mousedown',()=>keys.r=true);bR?.addEventListener('mouseup',()=>keys.r=false);bR?.addEventListener('mouseleave',()=>keys.r=false);

  function update(){
    if(keys.l){vx=-SPD;facing=-1;}else if(keys.r){vx=SPD;facing=1;}else vx*=.7;
    vy+=GRAVITY;px+=vx;py+=vy;
    if(px<0){px=0;vx=0;}if(py>3000){px=sx0;py=sy0;vx=0;vy=0;}
    onG=false;
    for(const p of plats){if(px+22>p.x&&px<p.x+p.w&&py+60>p.y&&py+60<=p.y+p.h+Math.abs(vy)+2&&vy>=0){py=p.y-60;vy=0;onG=true;}}
    for(const sp of springs){if(px+22>sp.x&&px<sp.x+sp.w&&py+60>sp.y&&py+60<=sp.y+sp.h&&vy>=0){vy=JUMP*1.7;onG=false;}}
    for(const o of [...spikes,...lava,...enemies]){if(px+18>o.x&&px<o.x+o.w&&py+55>o.y&&py<o.y+o.h){px=sx0;py=sy0;vx=0;vy=0;}}
    coins.forEach((c,i)=>{if(!colSet.has(i)&&Math.abs(px+12-c.x)<22&&Math.abs(py+30-c.y)<24){colSet.add(i);scored++;const sc=document.getElementById('ogs-g-score');if(sc)sc.textContent=`🪙 ${scored}/${coins.length}`;}});
    if(onG&&Math.abs(vx)>.3)step++;else if(!onG)step+=.5;
    camX+=(px+12-W*.45-camX)*.1;camY+=(py-H*.35-camY)*.1;
    if(camX<0)camX=0;if(camY<-400)camY=-400;
  }

  function drawMan(){
    const s=1.1,cx=Math.round(px+12),cy=Math.round(py+60),BL=22*s,HS=11*s;
    cv.lineWidth=2.5*s;cv.lineCap='round';cv.strokeStyle=skin.limbColor;
    const lg=!onG?0:Math.sin(step*.28)*22*s;
    cv.beginPath();cv.moveTo(cx,cy);cv.lineTo(cx-6*s+lg,cy+18*s);cv.stroke();
    cv.beginPath();cv.moveTo(cx,cy);cv.lineTo(cx+6*s-lg,cy+18*s);cv.stroke();
    cv.strokeStyle=skin.bodyColor;cv.lineWidth=3*s;
    cv.beginPath();cv.moveTo(cx,cy);cv.lineTo(cx,cy-BL);cv.stroke();
    cv.strokeStyle=skin.limbColor;cv.lineWidth=2.5*s;
    const ag=!onG?0:Math.sin(step*.28+Math.PI)*20*s,sy2=cy-BL+4*s;
    cv.beginPath();cv.moveTo(cx,sy2);cv.lineTo(cx-14*s+ag,sy2+10*s);cv.stroke();
    cv.beginPath();cv.moveTo(cx,sy2);cv.lineTo(cx+14*s-ag,sy2+10*s);cv.stroke();
    cv.fillStyle=skin.headColor;cv.strokeStyle=skin.limbColor;cv.lineWidth=2*s;
    cv.beginPath();cv.arc(cx,cy-BL-HS,HS,0,Math.PI*2);cv.fill();cv.stroke();
    cv.fillStyle='#111';cv.beginPath();cv.arc(cx+(facing<0?-3:3)*s,cy-BL-HS-2*s,2*s,0,Math.PI*2);cv.fill();
  }

  function draw(){
    const g2=cv.createLinearGradient(0,0,0,H);g2.addColorStop(0,'#1a2040');g2.addColorStop(1,'#0d1230');
    cv.fillStyle=g2;cv.fillRect(0,0,W,H);
    cv.save();cv.translate(-Math.round(camX),-Math.round(camY));
    for(const p of plats){cv.fillStyle=p.color||'#4a9a30';cv.fillRect(p.x,p.y,p.w,p.h);cv.fillStyle='rgba(255,255,255,.15)';cv.fillRect(p.x,p.y,p.w,Math.min(8,p.h));}
    springs.forEach(sp=>{cv.fillStyle='#444';cv.fillRect(sp.x,sp.y+sp.h-8,sp.w,8);cv.strokeStyle='#f1c40f';cv.lineWidth=2;for(let i=0;i<3;i++){cv.beginPath();cv.ellipse(sp.x+sp.w/2,sp.y+sp.h-8-i*((sp.h-8)/3),sp.w/2-2,3,0,0,Math.PI*2);cv.stroke();}});
    spikes.forEach(s=>{cv.fillStyle='#aaa';cv.beginPath();cv.moveTo(s.x,s.y+s.h);cv.lineTo(s.x+s.w/2,s.y);cv.lineTo(s.x+s.w,s.y+s.h);cv.closePath();cv.fill();});
    lava.forEach(l=>{cv.fillStyle='#ff4500';cv.fillRect(l.x,l.y,l.w,l.h);});
    enemies.forEach(en=>{cv.fillStyle=en.color||'#e74c3c';cv.beginPath();cv.arc(en.x+en.w/2,en.y+en.h/2,en.w/2,0,Math.PI*2);cv.fill();cv.font='18px serif';cv.textAlign='center';cv.fillText('💀',en.x+en.w/2,en.y+en.h/2+6);});
    coins.forEach((c,i)=>{if(colSet.has(i))return;cv.beginPath();cv.arc(c.x,c.y,13,0,Math.PI*2);cv.fillStyle='#FFD700';cv.fill();cv.strokeStyle='#FFA500';cv.lineWidth=2;cv.stroke();cv.fillStyle='#8B6914';cv.font='bold 8px monospace';cv.textAlign='center';cv.fillText('E$',c.x,c.y+3);});
    cv.textAlign='left';
    drawMan();
    cv.restore();
    cv.fillStyle='rgba(0,0,0,.5)';cv.fillRect(0,0,W,26);
    cv.fillStyle='#fff';cv.font='bold 12px Segoe UI';cv.textAlign='left';cv.fillText(`🪙 ${scored}/${coins.length}`,12,18);
    cv.textAlign='center';cv.fillText(game.name||'',W/2,18);cv.textAlign='left';
  }

  let rafId;
  function loop(){
    if(!document.getElementById('ogs-game-cv')){cancelAnimationFrame(rafId);document.removeEventListener('keydown',window._ogsKD);document.removeEventListener('keyup',window._ogsKU);return;}
    update();draw();rafId=requestAnimationFrame(loop);
  }
  loop();
}

function eHtml(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
