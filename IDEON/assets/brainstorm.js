(function(){
const EDITOR_KEY = 'ideon_brainstorm_notes_v1';
const MD_ENABLED_KEY = 'ideon_brainstorm_md_v1';
const THEME_KEY = 'ideon_theme_v1';

function qs(s){return document.querySelector(s);} 
function todayISO(d){ const dt = d? new Date(d): new Date(); return dt.toISOString().slice(0,10); }
function isoToDisplay(iso){ const d=new Date(iso); return d.toLocaleDateString(); }

function readCookieJSON(name){ const m = document.cookie.match('(?:^|; )'+name.replace(/([.*+?^${}()|[\\]\\])/g,'\\$1')+'=([^;]*)'); if(!m) return null; try{return JSON.parse(decodeURIComponent(m[1]));}catch(e){return null;} }
function writeCookieJSON(name,obj,days=365){ try{ const v = encodeURIComponent(JSON.stringify(obj)); const d=new Date(); d.setTime(d.getTime()+days*24*60*60*1000); document.cookie = name+'='+v+'; expires='+d.toUTCString()+'; path=/'; }catch(e){} }

function readCookie(name){ const m = document.cookie.match('(?:^|; )'+name.replace(/([.*+?^${}()|[\]\\])/g,'\\$1')+'=([^;]*)'); if(!m) return null; try{ return decodeURIComponent(m[1]); }catch(e){return null;} }
function writeCookie(name,val,days=365){ try{ const v = encodeURIComponent(val); const d=new Date(); d.setTime(d.getTime()+days*24*60*60*1000); document.cookie = name+'='+v+'; expires='+d.toUTCString()+'; path=/'; }catch(e){} }

// lightweight markdown -> html
function mdToHtml(text){ if(!text) return '';
  // escape html
  const esc = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let out = esc;
  out = out.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  out = out.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  out = out.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
  out = out.replace(/\n/g, '<br/>');
  return out;
}

function loadMap(){ return readCookieJSON(EDITOR_KEY) || {}; }
function saveMap(m){ writeCookieJSON(EDITOR_KEY,m,365); }

// helper to get sorted dates (ascending)
function getSortedDatesAsc(m){ return Object.keys(m).sort((a,b)=> a.localeCompare(b)); }

// currently selected date shown in the UI (ISO yyyy-mm-dd)
let CURRENT_DATE = null;

// debounce helper
function debounce(fn, wait){ let t; return function(...args){ clearTimeout(t); t = setTimeout(()=> fn.apply(this,args), wait); }; }

function renderEntries(newlyAddedDate){
  // Render the static entries-area structure; the interactive DOM lives in the HTML now.
  const map = loadMap();
  const sorted = getSortedDatesAsc(map);
  // ensure we have a current date
  if(typeof CURRENT_DATE === 'undefined' || !CURRENT_DATE) CURRENT_DATE = todayISO();

  // build horizontal day-list cards
  const listWrap = qs('.day-list');
  if(listWrap){
    // clear
    listWrap.innerHTML = '';
    sorted.forEach(d => {
      const card = document.createElement('div');
      card.className = 'day-card';
      card.setAttribute('data-date', d);
      if(d === CURRENT_DATE) card.classList.add('active');
      const label = document.createElement('div'); label.className = 'day-label'; label.textContent = isoToDisplay(d);
      const preview = document.createElement('div'); preview.className = 'day-preview';
      const txt = (map[d] || '').split('\n')[0] || ''; preview.textContent = txt;
      card.appendChild(label); card.appendChild(preview);
      card.addEventListener('click', ()=>{ CURRENT_DATE = d; renderEntries(); const ta = qs('.today-input'); if(ta) { ta.focus(); ta.selectionStart = ta.selectionEnd = (ta.value||'').length; } });
      listWrap.appendChild(card);
      // if this is the newly added card, mark it for animation
      if(newlyAddedDate && newlyAddedDate === d){ card.classList.add('new'); setTimeout(()=> card.classList.remove('new'), 900); }
    });
  }

  // populate the textarea for the selected date
  const ta = qs('.today-input');
  if(ta) {
    if(map[CURRENT_DATE]) ta.value = map[CURRENT_DATE]; else ta.value = '';
    // autosize to content
    try{ autosizeTextarea(ta); }catch(e){}
  }

  // set the header to display the selected date nicely
  const dateHd = qs('.today-date'); if(dateHd) dateHd.textContent = isoToDisplay(CURRENT_DATE);

  // show the latest previous entry below (the same as before)
  const prevSection = qs('.previous-entry');
  if(prevSection){
    const prevDates = sorted.filter(d => d < CURRENT_DATE);
    if(prevDates.length===0){ prevSection.style.display = 'none'; }
    else {
      prevSection.style.display = '';
      const last = prevDates[prevDates.length-1];
      const container = prevSection.querySelector('.previous-body');
      if(container) container.textContent = map[last] || '';
      const hd = prevSection.querySelector('h3'); if(hd) hd.textContent = isoToDisplay(last);
    }
  }
}

// save current date's input (debounced)
const saveTodayDebounced = debounce(function(){
  const ta = qs('.today-input'); if(!ta) return;
  const map = loadMap(); const key = CURRENT_DATE || todayISO(); if(ta.value && ta.value.trim().length>0) map[key] = ta.value; else delete map[key]; saveMap(map); renderEntries();
  // show saved indicator briefly
  showSaveIndicator();
}, 400);

// (no markdown preview) - keep a small idle handler to hide editing helpers after typing
const renderPreviewDebounced = debounce(function(){ const ta = qs('.today-input'); if(!ta) return; ta.classList.remove('editing'); const cl = qs('.current-line'); if(cl) cl.classList.add('hidden'); }, 400);

function wireInteractions(){
  const ta = qs('.today-input'); if(ta) ta.addEventListener('input', function(ev){ saveTodayDebounced(); renderPreviewDebounced(); ta.classList.add('editing'); const cl = qs('.current-line'); if(cl) cl.classList.remove('hidden'); });

  // header chroma effect while typing (keeps the playful effect)
  const titleEl = qs('.title');
  const removeChromaDebounced = debounce(() => { if(titleEl) titleEl.classList.remove('chroma'); }, 800);
  if(ta){ ta.addEventListener('input', function(){ if(titleEl) titleEl.classList.add('chroma'); removeChromaDebounced(); }); }

  // autosize on input
  if(ta) ta.addEventListener('input', function(){ try{ autosizeTextarea(ta); }catch(e){} });

  // when textarea loses focus, run idle handler
  if(ta) ta.addEventListener('blur', function(){ renderTodayPreviewImmediate(); });

  function renderTodayPreviewImmediate(){ if(!ta) return; ta.classList.remove('editing'); const cl = qs('.current-line'); if(cl) cl.classList.add('hidden'); }

  // update current-line on interactions
  const wrapper = qs('.today-input-wrapper');
  const currentLineEl = qs('.current-line');
  function updateCurrentLine(){ try{ positionCurrentLine(ta, currentLineEl); }catch(e){} }
  if(ta){ ta.addEventListener('keyup', updateCurrentLine); ta.addEventListener('click', updateCurrentLine); ta.addEventListener('input', updateCurrentLine); ta.addEventListener('scroll', updateCurrentLine); }

  const addBtn = qs('.add-next-fullwidth'); if(addBtn){ addBtn.addEventListener('click', ()=>{
    const map = loadMap(); const keys = getSortedDatesAsc(map);
    // decide base date: prefer the latest existing date, otherwise CURRENT_DATE or today
    let base = null;
    if(keys.length) base = keys[keys.length-1];
    else base = CURRENT_DATE || todayISO();
    const dt = new Date(base); dt.setDate(dt.getDate()+1);
    const nextDate = todayISO(dt);
    if(!map[nextDate]) map[nextDate] = '';
    saveMap(map);
  // show the newly created date
  CURRENT_DATE = nextDate;
  renderEntries(nextDate); // focus today's textarea and animate the new card
    const ta2 = qs('.today-input'); if(ta2) { ta2.focus(); ta2.selectionStart = ta2.selectionEnd = (ta2.value||'').length; }
  }); }

  const delBtn = qs('.delete-today'); if(delBtn){ delBtn.addEventListener('click', ()=>{
    if(!confirm('Delete this entry?')) return;
    const map = loadMap(); const toDelete = CURRENT_DATE || todayISO(); delete map[toDelete]; saveMap(map);
    // after deleting, pick the previous date if any, otherwise today
    const keys = getSortedDatesAsc(map);
    if(keys.length) CURRENT_DATE = keys[keys.length-1]; else CURRENT_DATE = todayISO();
    renderEntries();
  }); }

  // keyboard navigation between day cards: Alt + ArrowLeft / ArrowRight
  document.addEventListener('keydown', function(e){
    if(!e.altKey) return;
    if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
      const map = loadMap(); const keys = getSortedDatesAsc(map); if(keys.length===0) return;
      const idx = keys.indexOf(CURRENT_DATE);
      if(idx === -1) { CURRENT_DATE = keys[keys.length-1]; renderEntries(); return; }
      if(e.key === 'ArrowLeft'){ const nextIdx = Math.max(0, idx-1); CURRENT_DATE = keys[nextIdx]; renderEntries(); }
      else if(e.key === 'ArrowRight'){ const nextIdx = Math.min(keys.length-1, idx+1); CURRENT_DATE = keys[nextIdx]; renderEntries(); }
      e.preventDefault();
    }
  });
}

// show a small saved indicator in the header
function showSaveIndicator(){ const el = qs('#save-indicator'); if(!el) return; el.classList.add('visible'); el.setAttribute('aria-hidden','false'); clearTimeout(showSaveIndicator._t); showSaveIndicator._t = setTimeout(()=>{ el.classList.remove('visible'); el.setAttribute('aria-hidden','true'); }, 1200); }

// position .current-line under the caret's current text line inside a textarea
function positionCurrentLine(ta, el){ if(!ta || !el) return;
  // create a mirror div to measure caret position
  const style = window.getComputedStyle(ta);
  const div = document.createElement('div');
  const properties = ['boxSizing','width','fontSize','fontFamily','fontWeight','lineHeight','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderLeftWidth','borderRightWidth','borderBottomWidth','whiteSpace','wordWrap'];
  properties.forEach(p=>{ try{ div.style[p] = style[p]; }catch(e){} });
  div.style.position='absolute'; div.style.visibility='hidden'; div.style.top='0'; div.style.left='-9999px'; div.style.whiteSpace='pre-wrap'; div.style.wordWrap='break-word'; div.style.width = ta.clientWidth + 'px';
  // set content up to caret
  const val = ta.value.substring(0, ta.selectionStart);
  // replace spaces with nbsp to keep measurement
  div.textContent = val.replace(/\n$/,'\n.');
  document.body.appendChild(div);
  const height = div.offsetHeight;
  document.body.removeChild(div);
  // compute top offset relative to textarea
  const taScroll = ta.scrollTop;
  const top = height - taScroll - parseFloat(style.paddingTop || 0);
  // position element
  el.style.transform = 'translateY(' + top + 'px)';
}

// autosize textarea height to fit content, with a small padding
function autosizeTextarea(ta){ if(!ta) return; ta.style.height='auto'; const pad = 6; const h = ta.scrollHeight + pad; ta.style.height = h + 'px'; }

// Theme handling
function applyTheme(theme){ // 'dark' or 'light'
  const body = document.body; if(!body) return;
  if(theme==='dark'){ body.classList.add('theme-dark'); document.getElementById('theme-toggle')?.setAttribute('aria-pressed','true'); }
  else { body.classList.remove('theme-dark'); document.getElementById('theme-toggle')?.setAttribute('aria-pressed','false'); }
}

function initTheme(){
  // prefer saved cookie, then system
  const saved = readCookie(THEME_KEY);
  if(saved){ try{ const t = JSON.parse(saved); applyTheme(t); return; }catch(e){} }
  // system preference
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

function toggleTheme(){
  const isDark = document.body.classList.contains('theme-dark');
  const next = isDark ? 'light' : 'dark';
  applyTheme(next); writeCookie(THEME_KEY, JSON.stringify(next), 365);
}

// settings gear injection (markdown toggle modal)
// Settings gear and markdown toggle removed per request.

function init(){ if(!CURRENT_DATE) CURRENT_DATE = todayISO(); renderEntries(); wireInteractions(); initTheme(); const themeBtn = qs('#theme-toggle'); if(themeBtn) themeBtn.addEventListener('click', toggleTheme); }

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
