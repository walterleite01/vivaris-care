const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : `${window.location.protocol}//${window.location.hostname}/api`;

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

// CHECK AUTH
if (!token || !user) {
  window.location.href = '/';
}

let currentTab = 1;

// TAB NAVIGATION
function showTab(n) {
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));
  document.querySelector(`[data-tab="${n}"]`).classList.add('active');
  
  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${n}"].tab-btn`).classList.add('active');
  
  updateProgressBar();
}

function nextTab() {
  if (currentTab < 17) {
    currentTab++;
    showTab(currentTab);
    window.scrollTo(0, 0);
  }
}

function previousTab() {
  if (currentTab > 1) {
    currentTab--;
    showTab(currentTab);
    window.scrollTo(0, 0);
  }
}

function goBack() {
  window.history.back();
}

// TAB BUTTONS
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    currentTab = parseInt(btn.dataset.tab);
    showTab(currentTab);
  });
});

// PROGRESS BAR
function updateProgressBar() {
  const progress = (currentTab / 17) * 100;
  const bar = document.getElementById('progressBar');
  if (bar) {
    bar.style.width = progress + '%';
  }
}

// CALCULATE AGE
document.querySelector('[name="birth_date"]')?.addEventListener('change', (e) => {
  const birthDate = new Date(e.target.value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  document.getElementById('age').value = age;
});

// CALCULATE IMC
function calculateBMI() {
  const weight = parseFloat(document.querySelector('[name="weight"]')?.value) || 0;
  const height = parseFloat(document.querySelector('[name="height"]')?.value) || 0;
  
  if (weight > 0 && height > 0) {
    const heightM = height / 100;
    const imc = (weight / (heightM * heightM)).toFixed(2);
    document.getElementById('imc').value = imc;
  }
}

// CALCULATE KATZ
function calculateKatz() {
  const bath = parseInt(document.querySelector('[name="katz_bath"]')?.value) || 0;
  const dress = parseInt(document.querySelector('[name="katz_dress"]')?.value) || 0;
  const hygiene = parseInt(document.querySelector('[name="katz_hygiene"]')?.value) || 0;
  const continence = parseInt(document.querySelector('[name="katz_continence"]')?.value) || 0;
  const feeding = parseInt(document.querySelector('[name="katz_feeding"]')?.value) || 0;
  const transfer = parseInt(document.querySelector('[name="katz_transfer"]')?.value) || 0;
  
  const total = bath + dress + hygiene + continence + feeding + transfer;
  document.getElementById('katzScore').value = total;
}

// CALCULATE MORSE
function calculateMorse() {
  const history = parseInt(document.querySelector('[name="morse_history"]')?.value) || 0;
  const diagnosis = parseInt(document.querySelector('[name="morse_diagnosis"]')?.value) || 0;
  const medications = parseInt(document.querySelector('[name="morse_medications"]')?.value) || 0;
  const device = parseInt(document.querySelector('[name="morse_device"]')?.value) || 0;
  const gait = parseInt(document.querySelector('[name="morse_gait"]')?.value) || 0;
  const mental = parseInt(document.querySelector('[name="morse_mental"]')?.value) || 0;
  
  const total = history + diagnosis + medications + device + gait + mental;
  document.getElementById('morseScore').value = total;
}

// CALCULATE BRADEN
function calculateBraden() {
  const perception = parseInt(document.querySelector('[name="braden_perception"]')?.value) || 0;
  const moisture = parseInt(document.querySelector('[name="braden_moisture"]')?.value) || 0;
  const activity = parseInt(document.querySelector('[name="braden_activity"]')?.value) || 0;
  const mobility = parseInt(document.querySelector('[name="braden_mobility"]')?.value) || 0;
  const nutrition = parseInt(document.querySelector('[name="braden_nutrition"]')?.value) || 0;
  const friction = parseInt(document.querySelector('[name="braden_friction"]')?.value) || 0;
  
  const total = perception + moisture + activity + mobility + nutrition + friction;
  document.getElementById('bradenScore').value = total;
}

// CALCULATE COST
function calculateCost() {
  const baseCost = parseFloat(document.querySelector('[name="base_cost"]')?.value) || 150;
  const dependencyLevel = parseFloat(document.querySelector('[name="dependency_level"]')?.value) || 0;
  
  const dailyCost = baseCost * (1 + dependencyLevel);
  const monthlyCost = dailyCost * 30;
  
  document.getElementById('monthly_cost').value = `R$ ${monthlyCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.querySelector('[name="monthly_cost"]').value = monthlyCost;
}

// ADD LISTENERS
document.querySelectorAll('[name="katz_bath"], [name="katz_dress"], [name="katz_hygiene"], [name="katz_continence"], [name="katz_feeding"], [name="katz_transfer"]').forEach(el => {
  el?.addEventListener('change', calculateKatz);
});

document.querySelectorAll('[name="morse_history"], [name="morse_diagnosis"], [name="morse_medications"], [name="morse_device"], [name="morse_gait"], [name="morse_mental"]').forEach(el => {
  el?.addEventListener('change', calculateMorse);
});

document.querySelectorAll('[name="braden_perception"], [name="braden_moisture"], [name="braden_activity"], [name="braden_mobility"], [name="braden_nutrition"], [name="braden_friction"]').forEach(el => {
  el?.addEventListener('change', calculateBraden);
});

document.querySelector('[name="base_cost"]')?.addEventListener('change', calculateCost);
document.querySelector('[name="dependency_level"]')?.addEventListener('change', calculateCost);

// INIT
calculateCost();
showTab(1);

// SUBMIT FORM
async function submitForm() {
  const form = document.getElementById('residentForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validar CPF (básico)
  if (!validateCPF(data.cpf)) {
    alert('❌ CPF inválido!');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/residents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      alert(`❌ Erro: ${result.error}\n\n${result.details || ''}`);
      console.error('Error:', result);
      return;
    }

    alert(`✅ RESIDENTE SALVO COM SUCESSO!\n\nID: ${result.resident_id}\nNome: ${data.full_name}`);
    goBack();
  } catch (error) {
    alert(`❌ Erro: ${error.message}`);
    console.error('Error:', error);
  }
}

// VALIDATE CPF
function validateCPF(cpf) {
  if (!cpf) return false;
  
  // Remove pontuação
  cpf = cpf.replace(/\D/g, '');
  
  // Verificar se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cpf[9]) !== digit1) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cpf[10]) !== digit2) return false;
  
  return true;
}
