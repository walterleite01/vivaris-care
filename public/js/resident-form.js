const API_BASE = 'http://localhost:3000/api';
const token = localStorage.getItem('token');
if (!token) window.location.href = '/';

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Form carregado');
  setupTabs();
  setupCPF();
  setupRG();
  setupAge();
  setupIMC();
  setupKatz();
  setupMorse();
  setupBraden();
  setupCost();
  setupSubmit();
  calcCost();
});

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var tabId = btn.getAttribute('data-tab');
      var tab = document.getElementById('tab-' + tabId);
      if (tab) {
        document.querySelectorAll('.form-tab').forEach(t => { t.classList.remove('active'); t.style.display = 'none'; });
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        tab.classList.add('active');
        tab.style.display = 'block';
        btn.classList.add('active');
        
        var tabs = ['01-identification','02-birth','03-contact','04-responsible','05-health-plan','06-medical-history','07-medications','08-allergies','09-physical','10-functional','11-mobility','12-cognitive','13-habits','14-nutrition','15-vaccination','16-observation','17-review'];
        var idx = tabs.indexOf(tabId);
        var pct = Math.round((idx + 1) / tabs.length * 100);
        var fill = document.getElementById('progressFill');
        if (fill) fill.style.width = pct + '%';
        var pct_el = document.getElementById('progressPercent');
        if (pct_el) pct_el.textContent = pct;
      }
    });
  });
}

function setupCPF() {
  var el = document.getElementById('cpf');
  if (!el) return;
  el.addEventListener('input', function() {
    var v = this.value.replace(/\D/g, '').substring(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{3})/, '$1.$2');
    this.value = v;
  });
}

function setupRG() {
  var el = document.getElementById('rg');
  if (!el) return;
  el.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '').substring(0, 9);
  });
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  var s = 0;
  for (var i = 0; i < 9; i++) s += parseInt(cpf[i]) * (10 - i);
  var d1 = s % 11 < 2 ? 0 : 11 - (s % 11);
  if (parseInt(cpf[9]) !== d1) return false;
  s = 0;
  for (var i = 0; i < 10; i++) s += parseInt(cpf[i]) * (11 - i);
  var d2 = s % 11 < 2 ? 0 : 11 - (s % 11);
  return parseInt(cpf[10]) === d2;
}

function setupAge() {
  var el = document.getElementById('birth_date');
  if (!el) return;
  el.addEventListener('change', function() {
    var d = new Date(this.value + 'T00:00:00');
    var t = new Date();
    var age = t.getFullYear() - d.getFullYear();
    var m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
    var a = document.getElementById('age');
    if (a) a.value = age;
  });
}

function setupIMC() {
  ['weight','height'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', calcIMC);
  });
}

function calcIMC() {
  var w = parseFloat(document.getElementById('weight')?.value) || 0;
  var h = parseFloat(document.getElementById('height')?.value) || 0;
  if (w > 0 && h > 0) {
    var imc = (w / Math.pow(h / 100, 2)).toFixed(2);
    var el = document.getElementById('imc');
    if (el) el.value = imc;
  }
}

function setupKatz() {
  var ids = ['katz_bath','katz_dress','katz_hygiene','katz_continence','katz_feeding','katz_transfer'];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', calcKatz);
  });
}

function calcKatz() {
  var total = 0;
  ['katz_bath','katz_dress','katz_hygiene','katz_continence','katz_feeding','katz_transfer'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el && el.value !== '') total += parseInt(el.value) || 0;
  });
  
  var score = document.getElementById('katzScore');
  if (score) score.textContent = total;
  
  var level = document.getElementById('katzLevel');
  if (level) {
    if (total >= 5) level.textContent = '🟢 Independente';
    else if (total >= 3) level.textContent = '🟡 Dependência Moderada';
    else level.textContent = '🔴 Dependente';
  }
  
  var review = document.getElementById('review_katz');
  if (review) review.textContent = total;
  console.log('Katz:', total);
}

function setupMorse() {
  var ids = ['morse_history','morse_diagnosis','morse_medications','morse_device','morse_gait','morse_mental'];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', calcMorse);
  });
}

function calcMorse() {
  var total = 0;
  ['morse_history','morse_diagnosis','morse_medications','morse_device','morse_gait','morse_mental'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el && el.value !== '') total += parseInt(el.value) || 0;
  });
  
  var score = document.getElementById('morseScore');
  if (score) score.textContent = total;
  
  var level = document.getElementById('morseLevel');
  if (level) {
    if (total >= 50) level.textContent = '🔴 Alto Risco';
    else if (total >= 25) level.textContent = '🟡 Médio Risco';
    else level.textContent = '🟢 Baixo Risco';
  }
  
  var review = document.getElementById('review_morse');
  if (review) review.textContent = total;
  console.log('Morse:', total);
}

function setupBraden() {
  var ids = ['braden_perception','braden_moisture','braden_activity','braden_mobility','braden_nutrition','braden_friction'];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', calcBraden);
  });
}

function calcBraden() {
  var total = 0;
  ['braden_perception','braden_moisture','braden_activity','braden_mobility','braden_nutrition','braden_friction'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el && el.value !== '') total += parseInt(el.value) || 0;
  });
  
  var score = document.getElementById('bradenScore');
  if (score) score.textContent = total;
  
  var level = document.getElementById('bradenLevel');
  if (level) {
    if (total <= 12) level.textContent = '🔴 Alto Risco';
    else if (total <= 14) level.textContent = '🟠 Moderado';
    else if (total <= 18) level.textContent = '🟡 Leve';
    else level.textContent = '🟢 Sem Risco';
  }
  
  var review = document.getElementById('review_braden');
  if (review) review.textContent = total;
  console.log('Braden:', total);
}

function setupCost() {
  ['base_cost','dependency_level'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', calcCost);
    if (el) el.addEventListener('change', calcCost);
  });
}

function calcCost() {
  var base = parseFloat(document.getElementById('base_cost')?.value) || 150;
  var dep = parseFloat(document.getElementById('dependency_level')?.value) || 0;
  var daily = base * (1 + dep);
  var monthly = daily * 30;
  var annual = daily * 365;
  
  var d = document.getElementById('daily_cost');
  var m = document.getElementById('monthly_cost');
  var y = document.getElementById('yearly_cost');
  
  if (d) d.textContent = 'R$ ' + daily.toLocaleString('pt-BR', {minimumFractionDigits: 2});
  if (m) m.textContent = 'R$ ' + monthly.toLocaleString('pt-BR', {minimumFractionDigits: 2});
  if (y) y.textContent = 'R$ ' + annual.toLocaleString('pt-BR', {minimumFractionDigits: 2});
}

function setupSubmit() {
  var form = document.getElementById('residentForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    submitForm();
  });
}

function submitForm() {
  var fullName = document.getElementById('full_name')?.value;
  var birthDate = document.getElementById('birth_date')?.value;
  var cpfRaw = (document.getElementById('cpf')?.value || '').replace(/\D/g, '');
  
  if (!fullName) { alert('Nome obrigatório!'); return; }
  if (!birthDate) { alert('Data obrigatória!'); return; }
  if (cpfRaw && !validarCPF(cpfRaw)) { alert('CPF inválido!'); return; }

  var data = {
    full_name: document.getElementById('full_name')?.value,
    birth_date: document.getElementById('birth_date')?.value,
    cpf: cpfRaw,
    gender: document.getElementById('gender')?.value,
    phone: document.getElementById('phone_main')?.value,
    email: document.getElementById('responsible_email')?.value,
    address: document.getElementById('address')?.value,
    city: document.getElementById('city')?.value,
    state: document.getElementById('state')?.value,
    responsible_name: document.getElementById('responsible_name')?.value,
    responsible_phone: document.getElementById('responsible_phone')?.value,
    health_plan: document.getElementById('health_plan_name')?.value,
    monthly_cost: parseFloat((document.getElementById('monthly_cost')?.textContent || '0').replace(/[^\d,]/g, '').replace(',', '.')) || 0,
    morse_score: parseInt(document.getElementById('morseScore')?.textContent) || 0,
    braden_score: parseInt(document.getElementById('bradenScore')?.textContent) || 0,
    katz_score: parseInt(document.getElementById('katzScore')?.textContent) || 0
  };
  
  console.log('📤 Enviando:', data);

  var btn = document.querySelector('.btn-success');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; }

  fetch(API_BASE + '/residents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(data)
  })
  .then(res => res.json().then(json => ({status: res.status, json})))
  .then(r => {
    console.log('📥 Resposta:', r);
    if (r.status === 201) {
      alert('✅ RESIDENTE SALVO!\n\nNome: ' + fullName + '\nID: ' + r.json.resident_id);
      window.location.href = '/html/comercial-dashboard.html';
    } else {
      alert('❌ ' + (r.json.error || 'Erro') + '\n' + (r.json.details || ''));
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Salvar Residente'; }
    }
  })
  .catch(e => {
    console.error(e);
    alert('❌ Erro de conexão: ' + e.message);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Salvar Residente'; }
  });
}

function goBack() { window.history.back(); }

function generateContract() {
  var fullName = document.getElementById('full_name')?.value || 'Nome';
  var cpf = document.getElementById('cpf')?.value || 'CPF';
  var birthDate = document.getElementById('birth_date')?.value || 'Data';
  var monthlyCost = document.getElementById('monthly_cost')?.textContent || 'R$ 0,00';
  
  var html = `<!DOCTYPE html><html><head><title>Contrato</title><style>body{font-family:Arial;max-width:800px;margin:40px auto;padding:20px}h1{text-align:center;color:#667eea}h2{color:#333;border-bottom:2px solid #667eea}</style></head><body><h1>CONTRATO - ILPI</h1><h2>DADOS DO RESIDENTE</h2><p>Nome: ${fullName}<br>CPF: ${cpf}<br>Data: ${birthDate}<br>Valor Mensal: ${monthlyCost}</p></body></html>`;
  
  var w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}
