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

var ProductDB = {

  getAll: async function() {
    try {
      var res = await getSupa().from('products').select('*').order('name');
      if (res.error) throw res.error;
      return res.data || [];
    } catch(e) { console.error('[ProductDB] getAll:', e.message); return []; }
  },

  save: async function(p) {
    try {
      var res = await getSupa().from('products').upsert(
        { id: p.id, name: p.name, price: p.price },
        { onConflict: 'id' }
      );
      if (res.error) throw res.error;
    } catch(e) { console.error('[ProductDB] save:', e.message); throw e; }
  },

  remove: async function(id) {
    try {
      var res = await getSupa().from('products').delete().eq('id', id);
      if (res.error) throw res.error;
    } catch(e) { console.error('[ProductDB] remove:', e.message); throw e; }
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

/* ── Carregamento de Logo Customizada ────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  var logoImg = document.getElementById('logoImg');
  if (logoImg) {
    var customLogo = localStorage.getItem('customLogo');
    if (customLogo) {
      logoImg.src = customLogo;
    }
  }
});

/* ============================================================
   PDF - jsPDF + autoTable (Compatível com qualquer página)
   ============================================================ */
async function gerarPDF(b, download) {
  if (download === undefined) download = true;
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF('p', 'mm', 'a4');

  var PW = 210, PH = 297, ML = 12, MR = 198, CW = MR - ML;
  var BRAND = [14, 165, 233];

  /* Carrega logo local */
  var logoData = null;
  var logoWidth = 62;
  var logoHeight = 28;
  try {
    var src = localStorage.getItem('customLogo') || 'orcamento.png';
    if (src && src.startsWith('data:')) {
      logoData = src;
    } else {
      var r = await fetch(src);
      if (r.ok) {
        var blob = await r.blob();
        logoData = await new Promise(function(res) {
          var fr = new FileReader();
          fr.onload = function(e) { res(e.target.result); };
          fr.readAsDataURL(blob);
        });
      }
    }

    if (logoData) {
      await new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          var aspect = w / h;
          var maxW = 80;
          var maxH = 33;
          if (aspect > (maxW / maxH)) {
            logoWidth = maxW;
            logoHeight = maxW / aspect;
          } else {
            logoHeight = maxH;
            logoWidth = maxH * aspect;
          }
          resolve();
        };
        img.onerror = function() {
          resolve();
        };
        img.src = logoData;
      });
    }
  } catch(e) {}

  var y = ML;

  /* Cabecalho */
  if (logoData) {
    var format = 'PNG';
    if (logoData.startsWith('data:image/')) {
      var match = logoData.match(/^data:image\/([a-zA-Z+]+);base64/);
      if (match && match[1]) {
        var detectedFormat = match[1].toUpperCase();
        if (detectedFormat === 'JPEG' || detectedFormat === 'JPG') {
          format = 'JPEG';
        } else if (detectedFormat === 'PNG') {
          format = 'PNG';
        } else if (detectedFormat === 'WEBP') {
          format = 'WEBP';
        }
      }
    }
    doc.addImage(logoData, format, ML, y, logoWidth, logoHeight);
  }

  doc.setFontSize(12).setFont(undefined, 'bold').setTextColor(14, 165, 233);
  doc.text('HIDRO G BOMBAS SUBMERSAS LTDA.', MR, y + 4, { align: 'right' });
  doc.setFontSize(8.5).setFont(undefined, 'normal').setTextColor(80, 80, 80);
  doc.text('CNPJ: 12.835.772/0001-22',                 MR, y + 9.5, { align: 'right' });
  doc.text('Rua Feres Bucater 1461 - Jd. Sao Marco',   MR, y + 14.5, { align: 'right' });
  doc.text('Sao Jose do Rio Preto - SP',                MR, y + 19.5, { align: 'right' });
  doc.text('Tel: (17) 3216-5760  -  (17) 98132-4900',  MR, y + 24.5, { align: 'right' });
  
  // Calcula a posição da linha separadora dinamicamente com base nas alturas da logo e texto
  var textBottom = y + 24.5;
  var logoBottom = logoData ? (y + logoHeight) : y;
  y = Math.max(textBottom, logoBottom) + 4;

  doc.setDrawColor(14, 165, 233).setLineWidth(0.6).line(ML, y, MR, y);
  y += 6;

  var title = b.tipo || 'Orçamento';
  if (title.toLowerCase() === 'orcamento') title = 'Orçamento';

  doc.setFontSize(13).setFont(undefined, 'bold').setTextColor(14, 165, 233);
  doc.text(title + ' - ' + b.id, PW / 2, y, { align: 'center' });
  doc.setFontSize(9).setFont(undefined, 'normal').setTextColor(60, 60, 60);
  doc.text('Data: ' + (b.data || ''), MR, y, { align: 'right' });
  y += 4;
  doc.setDrawColor(210, 210, 210).setLineWidth(0.2).line(ML, y, MR, y);
  y += 6;

  /* Helper secao */
  function secHeader(txt, yy) {
    doc.setFillColor(240, 249, 255); doc.rect(ML, yy, CW, 7, 'F');
    doc.setFillColor(14, 165, 233); doc.rect(ML, yy, 3, 7, 'F');
    doc.setFontSize(8.5).setFont(undefined, 'bold').setTextColor(3, 105, 161);
    doc.text(txt, ML + 5, yy + 5);
    return yy + 9;
  }

  /* Helper celula label */
  function lbl(txt) {
    return { content: txt, styles: { fontStyle: 'bold', textColor: [3, 105, 161] } };
  }

  /* Helper tabela sem bordas */
  function plainTable(startY, body, colStyles) {
    doc.autoTable({
      startY: startY, margin: { left: ML, right: ML }, body: body,
      styles: { fontSize: 8.5, cellPadding: 2, overflow: 'ellipsis', textColor: [40, 40, 40] },
      columnStyles: colStyles,
      theme: 'plain', pageBreak: 'avoid'
    });
    return doc.lastAutoTable.finalY + 2;
  }

  /* Secao Cliente */
  y = secHeader('INFORMAÇÕES DO CLIENTE', y);
  var c = b.client || {};
  var phones = [c.phone1, c.phone2, c.phone3].filter(Boolean).join(' / ') || '-';
  var street = [c.address, c.neighborhood].filter(Boolean).join(', ') || '-';
  var cityUF = [c.city, c.state].filter(Boolean).join(' - ') || '';

  /* Linha 1+2: Nome/CPF e Telefone/IE — 4 colunas fixas */
  y = plainTable(y, [
    [lbl('Nome:'),     b.clientName || '-',  lbl('CPF/CNPJ:'), c.doc || '-'],
    [lbl('Telefone:'), phones,               lbl('IE:'),        c.ie  || '-']
  ], {
    0: { cellWidth: 26 }, 1: { cellWidth: 68 },
    2: { cellWidth: 26 }, 3: { cellWidth: 'auto' }
  });

  /* Linha 3: Endereco ocupa coluna larga com linebreak; CEP em coluna separada
     Col 0: label 26mm | Col 1: rua+bairro (auto, linebreak) | Col 2: label 16mm | Col 3: valor 38mm */
  y = plainTable(y, [
    [lbl('Endereço:'), street + (cityUF ? '\n' + cityUF : ''), lbl('CEP:'), c.cep || '-']
  ], {
    0: { cellWidth: 26 },
    1: { cellWidth: 'auto', overflow: 'linebreak' },
    2: { cellWidth: 16 },
    3: { cellWidth: 38 }
  });

  /* Secao Itens */
  y = secHeader('ITENS DO ORÇAMENTO', y);
  var items = b.items.filter(function(it) { return it.descricao || it.qtd > 0; });

  var reservedBelow = 55;
  var availH = PH - y - reservedBelow - ML;
  var N = Math.max(items.length, 1);
  var cellPad = 2;
  var fs = Math.max(6, Math.min(9, Math.floor((availH / (N + 1) - 2 * cellPad) / 0.3528)));

  doc.autoTable({
    startY: y, margin: { left: ML, right: ML },
    head: [[
      { content: '#', styles: { halign: 'center' } },
      'Descrição',
      { content: 'Qtd', styles: { halign: 'center' } },
      { content: 'Valor Unit.', styles: { halign: 'right' } },
      { content: 'Total', styles: { halign: 'right' } }
    ]],
    body: items.map(function(it, i) {
      return [
        { content: String(i + 1), styles: { halign: 'center' } },
        it.descricao || '-',
        { content: String(it.qtd || 0), styles: { halign: 'center' } },
        { content: currencyBR(it.unitario || 0), styles: { halign: 'right' } },
        { content: currencyBR(it.total || 0), styles: { halign: 'right' } }
      ];
    }),
    styles: { fontSize: fs, cellPadding: cellPad, textColor: [40, 40, 40] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 12 },
      3: { cellWidth: 28 },
      4: { cellWidth: 28 }
    },
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: 'bold' },
    theme: 'striped', pageBreak: 'avoid'
  });
  y = doc.lastAutoTable.finalY + 4;

  /* Resumo de valores */
  var vl = b.valores || {};
  var summaryRows = [
    [lbl('Sub Total:'), currencyBR(vl.subtotal || 0)]
  ];
  if (vl.frete > 0)    summaryRows.push([lbl('Frete (+):'),    currencyBR(vl.frete)]);
  if (vl.desconto > 0) summaryRows.push([lbl('Desconto (-):'), currencyBR(vl.desconto)]);

  y = plainTable(y, summaryRows, { 0: { cellWidth: 'auto', halign: 'right' }, 1: { cellWidth: 35, halign: 'right' } });

  /* Total destacado */
  var TX_LBL = MR - 75;
  doc.setFillColor(14, 165, 233);
  doc.rect(TX_LBL, y, MR - TX_LBL, 10, 'F');
  doc.setFontSize(10).setFont(undefined, 'bold').setTextColor(255, 255, 255);
  doc.text('TOTAL:', TX_LBL + 2.5, y + 7);
  doc.text(currencyBR(vl.total || 0), MR - 2.5, y + 7, { align: 'right' });
  y += 14;

  /* Condicoes - 4 colunas via autoTable
     Coluna label: 44mm (comporta "Prazo de Entrega:" sem sobreposicao) */
  var x = b.extras || {};
  var conds = [];
  if (x.garantia)  conds.push([lbl('Garantia:'),        x.garantia ]);
  if (x.prazo)     conds.push([lbl('Prazo de Entrega:'),x.prazo    ]);
  if (x.validade)  conds.push([lbl('Validade:'),        x.validade ]);
  if (x.pagamento) conds.push([lbl('Pagamento:'),       x.pagamento]);

  if (conds.length > 0 || x.obs) {
    y = secHeader('INFORMAÇÕES COMPLEMENTARES', y);

    if (conds.length > 0) {
      var condRows = [];
      for (var i = 0; i < conds.length; i += 2) {
        condRows.push([
          conds[i][0],   conds[i][1] || '-',
          conds[i+1] ? conds[i+1][0] : { content: '' },
          conds[i+1] ? conds[i+1][1] || '-' : ''
        ]);
      }
      y = plainTable(y, condRows, {
        0: { cellWidth: 44 }, 1: { cellWidth: 49 },
        2: { cellWidth: 44 }, 3: { cellWidth: 'auto' }
      });
    }

    if (x.obs) {
      y = plainTable(y,
        [[lbl('Observações:'), x.obs]],
        { 0: { cellWidth: 40 }, 1: { cellWidth: 'auto', overflow: 'linebreak' } }
      );
    }
  }

  /* Rodape */
  doc.setDrawColor(14, 165, 233).setLineWidth(0.5).line(ML, PH - 14, MR, PH - 14);
  doc.setFontSize(7).setFont(undefined, 'normal').setTextColor(120, 120, 120);
  doc.text(
    'HIDRO G BOMBAS SUBMERSAS LTDA.   -   CNPJ: 12.835.772/0001-22   -   Tel: (17) 3216-5760',
    PW / 2, PH - 9, { align: 'center' }
  );

  /* Salva */
  var fn = [
    (b.id || 'orcamento').replace(/[^\w\-]+/g, '_'),
    (b.data || '').replace(/[^\d]/g, ''),
    (b.clientName || 'cliente').replace(/[^\w\-]+/g, '_').slice(0, 20)
  ].filter(Boolean).join('_') + '.pdf';

  if (download) {
    doc.save(fn);
  } else {
    window.open(URL.createObjectURL(doc.output('blob')), '_blank');
  }
}

