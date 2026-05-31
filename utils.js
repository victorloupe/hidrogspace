/* utils.js - Hidro G - Utilitarios + Supabase
   Usa function/var no topo para criar globais acessiveis em todos os scripts. */

/* Supabase */
var SUPA_URL = 'https://opnrrrhdvoapxnythdqn.supabase.co';
var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wbnJycmhkdm9hcHhueXRoZHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjYwMjYsImV4cCI6MjA5NTcwMjAyNn0.D49L13vueHRSobL1SFrLrCTyWkk6-kzbdST9PgbtsZw';
var _supaClient = null;

function getSupa() {
  if (!_supaClient) {
    _supaClient = supabase.createClient(SUPA_URL, SUPA_KEY);
  }
  return _supaClient;
}

function budgetToRow(b) {
  return {
    id:           b.id,
    tipo:         b.tipo         || 'Orcamento',
    data:         b.data         || '',
    issue_iso:    b.issueISO     || '',
    due_iso:      b.dueISO       || '',
    client_name:  b.clientName   || '',
    total_number: b.totalNumber  || 0,
    client:       b.client       || {},
    valores:      b.valores      || {},
    extras:       b.extras       || {},
    items:        b.items        || []
  };
}

function rowToBudget(row) {
  if (!row) return null;
  return {
    id:          row.id,
    tipo:        row.tipo,
    data:        row.data,
    issueISO:    row.issue_iso,
    dueISO:      row.due_iso,
    clientName:  row.client_name,
    totalNumber: row.total_number,
    client:      row.client   || {},
    valores:     row.valores  || {},
    extras:      row.extras   || {},
    items:       row.items    || []
  };
}

var BudgetDB = {

  getAll: async function() {
    try {
      var res = await getSupa().from('budgets').select('*').order('created_at', {ascending:false});
      if (res.error) throw res.error;
      return (res.data || []).map(rowToBudget);
    } catch(e) { console.error('[BudgetDB] getAll:', e.message); return []; }
  },

  get: async function(id) {
    try {
      var res = await getSupa().from('budgets').select('*').eq('id', id).single();
      if (res.error) return null;
      return rowToBudget(res.data);
    } catch(e) { console.error('[BudgetDB] get:', e.message); return null; }
  },

  save: async function(b) {
    try {
      var res = await getSupa().from('budgets').upsert(budgetToRow(b), {onConflict:'id'});
      if (res.error) throw res.error;
    } catch(e) { console.error('[BudgetDB] save:', e.message); throw e; }
  },

  remove: async function(id) {
    try {
      var res = await getSupa().from('budgets').delete().eq('id', id);
      if (res.error) throw res.error;
    } catch(e) { console.error('[BudgetDB] remove:', e.message); throw e; }
  },

  migrateFromLocalStorage: async function() {
    try {
      var raw = localStorage.getItem('budgets');
      if (!raw) return;
      var items = JSON.parse(raw);
      if (!items || !items.length) return;
      var count = 0;
      for (var i = 0; i < items.length; i++) {
        var b = items[i];
        if (b && b.id && String(b.id).indexOf('SEED-') !== 0) {
          await BudgetDB.save(b); count++;
        }
      }
      localStorage.removeItem('budgets');
      if (count) console.log('[HidroG] ' + count + ' orcamento(s) migrados para Supabase.');
    } catch(e) { console.warn('[HidroG] Migracao:', e); }
  }
};

/* Data */
function todayISO() {
  var n = new Date(); n.setHours(0,0,0,0);
  return new Date(n.getTime() - n.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
function _isISODate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }
function _localDate(s) {
  if (!_isISODate(s)) return new Date(s);
  var p = s.split('-').map(Number);
  return new Date(p[0], p[1]-1, p[2]);
}
function fmtBR(d) { return d ? _localDate(d).toLocaleDateString('pt-BR') : ''; }
function diffDays(dueISO, baseISO) {
  if (!dueISO) return NaN;
  var A = _localDate(dueISO), B = _localDate(baseISO || todayISO());
  A.setHours(0,0,0,0); B.setHours(0,0,0,0);
  return Math.round((A - B) / 86400000);
}
function parseBRDateToISO(br) {
  var m = String(br||'').match(/(\d{2})[\/](\d{2})[\/](\d{4})/);
  return m ? (m[3]+'-'+m[2]+'-'+m[1]) : '';
}
function parseValidityToISO(valStr, baseDateBR) {
  var baseISO = parseBRDateToISO(baseDateBR) || todayISO();
  var m = String(valStr||'').toLowerCase().match(/(\d{1,3})\s*dia/);
  if (!m) return '';
  var base = new Date(baseISO);
  base.setDate(base.getDate() + parseInt(m[1], 10));
  return new Date(base.getTime() - base.getTimezoneOffset()*60000).toISOString().slice(0,10);
}

/* Dinheiro */
function currencyBR(v) {
  try { return Number(v).toLocaleString('pt-BR', {style:'currency', currency:'BRL'}); }
  catch(e) { return String(v); }
}
function moneyMask(v) {
  v = String(v).replace(/[^\d]/g, '');
  if (!v) return 'R$ 0,00';
  return 'R$ ' + (parseInt(v,10)/100).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function moneyUnmask(v) {
  if (!v) return 0;
  return parseFloat(String(v).replace(/R\$\s*/g,'').replace(/\./g,'').replace(',','.')) || 0;
}

/* Status */
function statusInfoByDleft(dleft) {
  if (Number.isNaN(dleft))       return {label:'Sem validade',   cls:'text-secondary', key:'open'};
  if (dleft < 0)                 return {label:'Vencido',        cls:'status-expired', key:'expired'};
  if (dleft === 0)               return {label:'Vence hoje',     cls:'status-today',   key:'today'};
  if (dleft >= 1 && dleft <= 10) return {label:'Vence em breve', cls:'status-soon',    key:'soon'};
  return {label:'Aberto', cls:'status-ok', key:'open'};
}

/* Rede */
async function fetchJSON(url, ms) {
  ms = ms || 8000;
  var ctrl = new AbortController();
  var tid = setTimeout(function() { ctrl.abort(); }, ms);
  try {
    var r = await fetch(url, {signal: ctrl.signal});
    clearTimeout(tid);
    if (r.ok) return await r.json();
  } catch(e) {}
  clearTimeout(tid);
  try {
    var r2 = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url));
    if (r2.ok) return JSON.parse(await r2.text());
  } catch(e) {}
  return null;
}

/* Autenticação */
async function checkAuth() {
  try {
    var res = await getSupa().auth.getSession();
    var session = res.data && res.data.session;
    if (!session) {
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
      }
      return null;
    }
    return session.user;
  } catch(e) {
    console.error('[Auth] checkAuth:', e);
    return null;
  }
}

async function logout() {
  try {
    await getSupa().auth.signOut();
    window.location.href = 'login.html';
  } catch(e) {
    console.error('[Auth] logout:', e);
  }
}

/* ── Avisos e Confirmações do Sistema (Customizados) ────────────────── */
function sysAlert(message, callback) {
  var overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.4)';
  overlay.style.backdropFilter = 'blur(4px)';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';

  var box = document.createElement('div');
  box.style.background = '#ffffff';
  box.style.borderRadius = '16px';
  box.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
  box.style.border = '1px solid #e2e8f0';
  box.style.padding = '24px';
  box.style.width = '100%';
  box.style.maxWidth = '380px';
  box.style.textAlign = 'center';

  box.innerHTML = `
    <div style="width: 48px; height: 48px; background: #f0f9ff; color: #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 1.25rem;">
      <i class="fa-solid fa-circle-info"></i>
    </div>
    <h6 style="font-weight: 700; margin-bottom: 8px; color: #0f172a;">Aviso</h6>
    <p style="font-size: 0.88rem; color: #475569; margin-bottom: 20px; line-height: 1.5;">${message}</p>
    <button class="btn btn-brand w-100 py-2" id="sysAlertOkBtn" style="border-radius: 8px;">OK</button>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  var okBtn = document.getElementById('sysAlertOkBtn');
  okBtn.focus();
  okBtn.addEventListener('click', function() {
    overlay.remove();
    if (callback) callback();
  });
}

function sysConfirm(message, onConfirm, onCancel) {
  var overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.4)';
  overlay.style.backdropFilter = 'blur(4px)';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';

  var box = document.createElement('div');
  box.style.background = '#ffffff';
  box.style.borderRadius = '16px';
  box.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
  box.style.border = '1px solid #e2e8f0';
  box.style.padding = '24px';
  box.style.width = '100%';
  box.style.maxWidth = '380px';
  box.style.textAlign = 'center';

  box.innerHTML = `
    <div style="width: 48px; height: 48px; background: #fffbeb; color: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 1.25rem;">
      <i class="fa-solid fa-triangle-exclamation"></i>
    </div>
    <h6 style="font-weight: 700; margin-bottom: 8px; color: #0f172a;">Confirmação</h6>
    <p style="font-size: 0.88rem; color: #475569; margin-bottom: 20px; line-height: 1.5;">${message}</p>
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-outline-secondary flex-fill py-2" id="sysConfirmCancelBtn" style="border-radius: 8px;">Cancelar</button>
      <button class="btn btn-brand flex-fill py-2" id="sysConfirmOkBtn" style="border-radius: 8px;">Confirmar</button>
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  document.getElementById('sysConfirmOkBtn').addEventListener('click', function() {
    overlay.remove();
    if (onConfirm) onConfirm();
  });

  document.getElementById('sysConfirmCancelBtn').addEventListener('click', function() {
    overlay.remove();
    if (onCancel) onCancel();
  });
}

// Inserir 10 orçamentos de teste (Semear banco)
async function insertSeeds() {
  var budgets = [
    {
      id: "SEED-001",
      tipo: "Orcamento",
      data: "20/05/2026",
      issue_iso: "2026-05-20",
      due_iso: "2026-06-20",
      client_name: "João Silva",
      total_number: 1500,
      client: { name: "João Silva", cnpj: "11.222.333/0001-44", ie: "Isento", address: "Av. Brasil 100", phone1: "(17) 99999-1111" },
      valores: { subtotal: 1500, total: 1500, frete: 0, desconto: 0 },
      extras: { validade: "30 dias", prazo_entrega: "Imediato", garantia: "1 ano", condicoes_pagto: "A vista" },
      items: [{ id: 1, qtd: 1, descricao: "Bomba Submersa 1HP HidroG", unitario: 1500, total: 1500 }]
    },
    {
      id: "SEED-002",
      tipo: "Orcamento",
      data: "25/05/2026",
      issue_iso: "2026-05-25",
      due_iso: "2026-06-25",
      client_name: "Maria Santos",
      total_number: 2300,
      client: { name: "Maria Santos", cnpj: "22.333.444/0001-55", ie: "", address: "Rua das Flores 250", phone1: "(17) 98888-2222" },
      valores: { subtotal: 2300, total: 2300, frete: 0, desconto: 0 },
      extras: { validade: "30 dias", prazo_entrega: "3 dias", garantia: "1 ano", condicoes_pagto: "Boleto 30 dias" },
      items: [{ id: 1, qtd: 1, descricao: "Quadro de Comando Monofásico", unitario: 800, total: 800 }, { id: 2, qtd: 1, descricao: "Bomba Submersa 0.5HP", unitario: 1500, total: 1500 }]
    },
    {
      id: "SEED-003",
      tipo: "Orcamento",
      data: "30/05/2026",
      issue_iso: "2026-05-30",
      due_iso: "2026-05-30",
      client_name: "Pedro Oliveira (Vence Hoje)",
      total_number: 980,
      client: { name: "Pedro Oliveira", cnpj: "", ie: "", address: "Rua Principal 45", phone1: "(17) 97777-3333" },
      valores: { subtotal: 980, total: 980, frete: 0, desconto: 0 },
      extras: { validade: "0 dias", prazo_entrega: "Imediato", garantia: "90 dias", condicoes_pagto: "PIX" },
      items: [{ id: 1, qtd: 2, descricao: "Cabo Elétrico Subterrâneo PP 4mm (m)", unitario: 490, total: 980 }]
    },
    {
      id: "SEED-004",
      tipo: "Orcamento",
      data: "15/05/2026",
      issue_iso: "2026-05-15",
      due_iso: "2026-05-25",
      client_name: "Ana Souza (Vencido)",
      total_number: 3400,
      client: { name: "Ana Souza", cnpj: "33.444.555/0001-66", ie: "", address: "Av. Saudade 1200", phone1: "(17) 96666-4444" },
      valores: { subtotal: 3400, total: 3400, frete: 0, desconto: 0 },
      extras: { validade: "10 dias", prazo_entrega: "5 dias", garantia: "1 ano", condicoes_pagto: "3x Cartão" },
      items: [{ id: 1, qtd: 1, descricao: "Bomba Submersa 2HP Trifásica", unitario: 3400, total: 3400 }]
    },
    {
      id: "SEED-005",
      tipo: "Orcamento",
      data: "28/05/2026",
      issue_iso: "2026-05-28",
      due_iso: "2026-06-05",
      client_name: "Lucas Pereira (Vence em breve)",
      total_number: 4120,
      client: { name: "Lucas Pereira", cnpj: "", ie: "", address: "Sítio Primavera", phone1: "(17) 95555-5555" },
      valores: { subtotal: 4120, total: 4120, frete: 0, desconto: 0 },
      extras: { validade: "8 dias", prazo_entrega: "Imediato", garantia: "1 ano", condicoes_pagto: "A vista" },
      items: [{ id: 1, qtd: 1, descricao: "Kit Solar de Bombeamento 500W", unitario: 4120, total: 4120 }]
    },
    {
      id: "SEED-006",
      tipo: "Orcamento",
      data: "29/05/2026",
      issue_iso: "2026-05-29",
      due_iso: "2026-06-08",
      client_name: "Hidrominas Poços (Vence em breve)",
      total_number: 8500,
      client: { name: "Hidrominas Poços", cnpj: "44.555.666/0001-77", ie: "123.456.789", address: "Distrito Industrial", phone1: "(17) 3216-1234" },
      valores: { subtotal: 8500, total: 8500, frete: 0, desconto: 0 },
      extras: { validade: "10 dias", prazo_entrega: "7 dias", garantia: "2 anos", condicoes_pagto: "Faturado 30/60 dias" },
      items: [{ id: 1, qtd: 1, descricao: "Tubulação de Aço Galvanizado 3 pol (barra)", unitario: 8500, total: 8500 }]
    },
    {
      id: "SEED-007",
      tipo: "Orcamento",
      data: "10/05/2026",
      issue_iso: "2026-05-10",
      due_iso: "2026-05-20",
      client_name: "Construtora Alfa (Vencido)",
      total_number: 12500,
      client: { name: "Construtora Alfa", cnpj: "55.666.777/0001-88", ie: "987.654.321", address: "Av. Juscelino Kubitschek", phone1: "(17) 3222-9988" },
      valores: { subtotal: 12500, total: 12500, frete: 0, desconto: 0 },
      extras: { validade: "10 dias", prazo_entrega: "10 dias", garantia: "1 ano", condicoes_pagto: "Faturado 4x" },
      items: [{ id: 1, qtd: 5, descricao: "Bomba Pressurizadora Rowa", unitario: 2500, total: 12500 }]
    },
    {
      id: "SEED-008",
      tipo: "Orcamento",
      data: "22/05/2026",
      issue_iso: "2026-05-22",
      due_iso: "2026-06-22",
      client_name: "Fazenda Sol Nascente",
      total_number: 5900,
      client: { name: "Fazenda Sol Nascente", cnpj: "", ie: "", address: "Rodovia BR-153 Km 45", phone1: "(17) 94444-6666" },
      valores: { subtotal: 5900, total: 5900, frete: 0, desconto: 0 },
      extras: { validade: "30 dias", prazo_entrega: "Imediato", garantia: "1 ano", condicoes_pagto: "Dinheiro" },
      items: [{ id: 1, qtd: 1, descricao: "Bomba Submersa 3HP Leão", unitario: 5900, total: 5900 }]
    },
    {
      id: "SEED-009",
      tipo: "Orcamento",
      data: "24/05/2026",
      issue_iso: "2026-05-24",
      due_iso: "2026-06-24",
      client_name: "Condomínio Flores",
      total_number: 3100,
      client: { name: "Condomínio Flores", cnpj: "66.777.888/0001-99", ie: "", address: "Rua Alameda das Palmeiras", phone1: "(17) 3216-9900" },
      valores: { subtotal: 3100, total: 3100, frete: 0, desconto: 0 },
      extras: { validade: "30 dias", prazo_entrega: "2 dias", garantia: "1 ano", condicoes_pagto: "Boleto" },
      items: [{ id: 1, qtd: 1, descricao: "Manutenção Preventiva de Conjunto Motobomba", unitario: 3100, total: 3100 }]
    },
    {
      id: "SEED-010",
      tipo: "Orcamento",
      data: "30/05/2026",
      issue_iso: "2026-05-30",
      due_iso: "2026-05-30",
      client_name: "Marcos Lima (Vence Hoje)",
      total_number: 1750,
      client: { name: "Marcos Lima", cnpj: "", ie: "", address: "Rua do Comércio 550", phone1: "(17) 93333-7777" },
      valores: { subtotal: 1750, total: 1750, frete: 0, desconto: 0 },
      extras: { validade: "0 dias", prazo_entrega: "Imediato", garantia: "1 ano", condicoes_pagto: "PIX" },
      items: [{ id: 1, qtd: 1, descricao: "Inversor de Frequência CFW300", unitario: 1750, total: 1750 }]
    }
  ];

  console.log("Iniciando inserção...");
  try {
    for (var i = 0; i < budgets.length; i++) {
      var b = budgets[i];
      // Converte as propriedades para o formato que a tabela do banco espera
      var row = {
        id: b.id,
        tipo: b.tipo,
        data: b.data,
        issue_iso: b.issue_iso,
        due_iso: b.due_iso,
        client_name: b.client_name,
        total_number: b.total_number,
        client: b.client,
        valores: b.valores,
        extras: b.extras,
        items: b.items
      };
      await getSupa().from('budgets').upsert(row, {onConflict:'id'});
      console.log("Inserido/atualizado: " + b.id);
    }
    sysAlert("10 orçamentos de teste foram inseridos com sucesso! Atualize a página.");
  } catch (err) {
    console.error(err);
    sysAlert("Erro ao inserir dados de teste: " + err.message);
  }
}

// Exibir Notificação Flutuante (Toast)
function showToast(msg, type) {
  type = type || 'info'; // 'info' ou 'success'
  var existing = document.querySelector('.sys-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'sys-toast';
  
  var iconHtml = type === 'success' 
    ? '<i class="fa-solid fa-circle-check sys-toast-success-icon"></i>' 
    : '<i class="fa-solid fa-circle-info sys-toast-info-icon"></i>';

  toast.innerHTML = iconHtml + '<span>' + msg + '</span>';
  document.body.appendChild(toast);

  // Trigger layout reflow
  toast.offsetHeight;
  toast.classList.add('show');

  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() {
      toast.remove();
    }, 300);
  }, 3000);
}
