/* ============================================
   RESIDENT FORM - JAVASCRIPT
   Cálculos em Tempo Real
   ============================================ */

const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api'
  : 'https://vivaris-care-production.up.railway.app/api';

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  setupTabNavigation();
  setupFormListeners();
  setupAutoCalculations();
  calculateTotalCost();
  updateProgress();
});

// ============================================
// TAB NAVIGATION
// ============================================

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = btn.dataset.tab;
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  // Remover ativo de todos
  document.querySelectorAll('.form-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Ativar selecionado
  const tab = document.getElementById(`tab-${tabId}`);
  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  
  if (tab && btn) {
    tab.classList.add('active');
    btn.classList.add('active');
    
    // Scroll suave
    tab.scrollIntoView({ behavior: 'smooth' });
  }

  updateProgress();
}

// ============================================
// FORM LISTENERS
// ============================================

function setupFormListeners() {
  const form = document.getElementById('residentForm');
  
  form.addEventListener('change', () => {
    updateProgress();
    calculateTotalCost();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm();
  });
}

// ============================================
// AUTO CALCULATIONS
// ============================================

function setupAutoCalculations() {
  // Age
  document.getElementById('birth_date').addEventListener('change', calculateAge);
  
  // IMC
  document.getElementById('weight').addEventListener('change', calculateBMI);
  document.getElementById('height').addEventListener('change', calculateBMI);
  
  // Escalas
  document.querySelectorAll('[id^="katz_"]').forEach(el => {
    el.addEventListener('change', calculateKatz);
  });
  
  document.querySelectorAll('[id^="morse_"]').forEach(el => {
    el.addEventListener('change', calculateMorse);
  });
  
  document.querySelectorAll('[id^="braden_"]').forEach(el => {
    el.addEventListener('change', calculateBraden);
  });

  // Custo
  document.getElementById('base_cost').addEventListener('change', calculateTotalCost);
  document.getElementById('dependency_level').addEventListener('change', calculateTotalCost);
}

// ============================================
// CALCULATE AGE
// ============================================

function calculateAge() {
  const birthDateInput = document.getElementById('birth_date').value;
  const ageInput = document.getElementById('age');

  if (!birthDateInput) {
    ageInput.value = '';
    return;
  }

  const birthDate = new Date(birthDateInput);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  ageInput.value = age > 0 ? age : '';
}

// ============================================
// CALCULATE BMI
// ============================================

function calculateBMI() {
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);
  const imcInput = document.getElementById('imc');

  if (weight && height && height > 0) {
    const heightInMeters = height / 100;
    const imc = weight / (heightInMeters * heightInMeters);
    imcInput.value = imc.toFixed(1);
  } else {
    imcInput.value = '';
  }
}

// ============================================
// CALCULATE KATZ (Independence)
// ============================================

function calculateKatz() {
  const fields = ['bath', 'dress', 'hygiene', 'continence', 'feeding', 'transfer'];
  let score = 0;

  fields.forEach(field => {
    const value = parseInt(document.getElementById(`katz_${field}`).value) || 0;
    score += value;
  });

  document.getElementById('katzScore').textContent = score;

  // Level
  let level = '';
  if (score === 6) {
    level = '🟢 INDEPENDENTE - Sem necessidade de assistência';
  } else if (score >= 4) {
    level = '🟡 SEMI-DEPENDENTE - Necessita assistência parcial';
  } else {
    level = '🔴 DEPENDENTE - Necessita assistência total';
  }

  document.getElementById('katzLevel').textContent = level;
  updateReviewTab();
}

// ============================================
// CALCULATE MORSE (Fall Risk)
// ============================================

function calculateMorse() {
  let score = 0;

  score += parseInt(document.getElementById('morse_history').value) || 0;
  score += parseInt(document.getElementById('morse_diagnosis').value) || 0;
  score += parseInt(document.getElementById('morse_medications').value) || 0;
  score += parseInt(document.getElementById('morse_device').value) || 0;
  score += parseInt(document.getElementById('morse_gait').value) || 0;
  score += parseInt(document.getElementById('morse_mental').value) || 0;

  document.getElementById('morseScore').textContent = score;

  // Level
  let level = '';
  if (score < 25) {
    level = '🟢 RISCO BAIXO - Implementar precauções básicas';
  } else if (score < 50) {
    level = '🟡 RISCO MÉDIO - Implementar precauções moderadas';
  } else {
    level = '🔴 RISCO ALTO - Implementar precauções máximas';
  }

  document.getElementById('morseLevel').textContent = level;
  updateReviewTab();
}

// ============================================
// CALCULATE BRADEN (Pressure Ulcer Risk)
// ============================================

function calculateBraden() {
  let score = 0;

  score += parseInt(document.getElementById('braden_perception').value) || 0;
  score += parseInt(document.getElementById('braden_moisture').value) || 0;
  score += parseInt(document.getElementById('braden_activity').value) || 0;
  score += parseInt(document.getElementById('braden_mobility').value) || 0;
  score += parseInt(document.getElementById('braden_nutrition').value) || 0;
  score += parseInt(document.getElementById('braden_friction').value) || 0;

  document.getElementById('bradenScore').textContent = score;

  // Level
  let level = '';
  if (score >= 23) {
    level = '🟢 RISCO MÍNIMO - Cuidados de rotina';
  } else if (score >= 19) {
    level = '🟡 RISCO LEVE - Implementar medidas preventivas';
  } else if (score >= 15) {
    level = '🟠 RISCO MODERADO - Aplicar protocolo de prevenção';
  } else {
    level = '🔴 RISCO ALTO - Cuidados intensivos de prevenção';
  }

  document.getElementById('bradenLevel').textContent = level;
  updateReviewTab();
}

// ============================================
// CALCULATE COSTS
// ============================================

function calculateTotalCost() {
  const baseCost = parseFloat(document.getElementById('base_cost').value) || 150;
  const dependencyLevel = parseFloat(document.getElementById('dependency_level').value) || 0;

  // Custo ajustado por dependência
  const dailyCost = baseCost * (1 + dependencyLevel);
  const monthlyCost = dailyCost * 30;
  const yearlyCost = dailyCost * 365;

  // Formatar valores em BRL
  document.getElementById('daily_cost').textContent = formatCurrency(dailyCost);
  document.getElementById('monthly_cost').textContent = formatCurrency(monthlyCost);
  document.getElementById('yearly_cost').textContent = formatCurrency(yearlyCost);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// ============================================
// UPDATE PROGRESS
// ============================================

function updateProgress() {
  const form = document.getElementById('residentForm');
  const inputs = form.querySelectorAll('input, select, textarea');
  let filled = 0;

  inputs.forEach(input => {
    if (input.type === 'checkbox') {
      if (input.checked) filled++;
    } else if (input.value !== '' && input.value !== '0') {
      filled++;
    }
  });

  const percent = Math.round((filled / inputs.length) * 100);
  document.getElementById('progressPercent').textContent = percent;
  document.getElementById('progressFill').style.width = percent + '%';
}

// ============================================
// UPDATE REVIEW TAB
// ============================================

function updateReviewTab() {
  // Morse
  document.getElementById('review_morse').textContent = 
    document.getElementById('morseScore').textContent;
  document.getElementById('review_morse_level').textContent = 
    document.getElementById('morseLevel').textContent;

  // Braden
  document.getElementById('review_braden').textContent = 
    document.getElementById('bradenScore').textContent;
  document.getElementById('review_braden_level').textContent = 
    document.getElementById('bradenLevel').textContent;

  // Katz
  document.getElementById('review_katz').textContent = 
    document.getElementById('katzScore').textContent;
  document.getElementById('review_katz_level').textContent = 
    document.getElementById('katzLevel').textContent;
}

// ============================================
// GENERATE CONTRACT
// ============================================

function generateContract() {
  const fullName = document.getElementById('full_name').value;
  
  if (!fullName) {
    alert('Por favor, preencha o nome completo primeiro!');
    return;
  }

  alert('Função de gerar contrato será implementada em breve!');
  // TODO: Integrar com API para gerar PDF
}

// ============================================
// SUBMIT FORM
// ============================================

function submitForm() {
  const form = document.getElementById('residentForm');
  
  // Coletar dados
  const formData = {
    full_name: document.getElementById('full_name').value,
    cpf: document.getElementById('cpf').value,
    rg: document.getElementById('rg').value,
    gender: document.getElementById('gender').value,
    naturalidade: document.getElementById('naturalidade').value,
    birth_date: document.getElementById('birth_date').value,
    age: document.getElementById('age').value,
    phone_main: document.getElementById('phone_main').value,
    phone_secondary: document.getElementById('phone_secondary').value,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    cep: document.getElementById('cep').value,
    responsible_name: document.getElementById('responsible_name').value,
    responsible_relationship: document.getElementById('responsible_relationship').value,
    responsible_phone: document.getElementById('responsible_phone').value,
    responsible_email: document.getElementById('responsible_email').value,
    coverage_type: document.getElementById('coverage_type').value,
    health_plan_name: document.getElementById('health_plan_name').value,
    health_plan_number: document.getElementById('health_plan_number').value,
    diagnoses: document.getElementById('diagnoses').value,
    surgeries: document.getElementById('surgeries').value,
    chronic_diseases: document.getElementById('chronic_diseases').value,
    medications: document.getElementById('medications').value,
    allergies_medications: document.getElementById('allergies_medications').value,
    allergies_food: document.getElementById('allergies_food').value,
    allergies_other: document.getElementById('allergies_other').value,
    weight: document.getElementById('weight').value,
    height: document.getElementById('height').value,
    imc: document.getElementById('imc').value,
    hair_type: document.getElementById('hair_type').value,
    eye_color: document.getElementById('eye_color').value,
    distinctive_marks: document.getElementById('distinctive_marks').value,
    katz_bath: document.getElementById('katz_bath').value,
    katz_dress: document.getElementById('katz_dress').value,
    katz_hygiene: document.getElementById('katz_hygiene').value,
    katz_continence: document.getElementById('katz_continence').value,
    katz_feeding: document.getElementById('katz_feeding').value,
    katz_transfer: document.getElementById('katz_transfer').value,
    katz_score: document.getElementById('katzScore').textContent,
    morse_history: document.getElementById('morse_history').value,
    morse_diagnosis: document.getElementById('morse_diagnosis').value,
    morse_medications: document.getElementById('morse_medications').value,
    morse_device: document.getElementById('morse_device').value,
    morse_gait: document.getElementById('morse_gait').value,
    morse_mental: document.getElementById('morse_mental').value,
    morse_score: document.getElementById('morseScore').textContent,
    braden_perception: document.getElementById('braden_perception').value,
    braden_moisture: document.getElementById('braden_moisture').value,
    braden_activity: document.getElementById('braden_activity').value,
    braden_mobility: document.getElementById('braden_mobility').value,
    braden_nutrition: document.getElementById('braden_nutrition').value,
    braden_friction: document.getElementById('braden_friction').value,
    braden_score: document.getElementById('bradenScore').textContent,
    smoking: document.getElementById('smoking').value,
    alcohol: document.getElementById('alcohol').value,
    recreational: document.getElementById('recreational').value,
    diet_restrictions: document.getElementById('diet_restrictions').value,
    food_preferences: document.getElementById('food_preferences').value,
    swallowing_difficulty: document.getElementById('swallowing_difficulty').value,
    vaccine_flu: document.getElementById('vaccine_flu').value,
    vaccine_pneumo: document.getElementById('vaccine_pneumo').value,
    vaccine_tetanus: document.getElementById('vaccine_tetanus').value,
    vaccine_covid: document.getElementById('vaccine_covid').value,
    other_vaccines: document.getElementById('other_vaccines').value,
    clinical_notes: document.getElementById('clinical_notes').value,
    care_preferences: document.getElementById('care_preferences').value,
    special_recommendations: document.getElementById('special_recommendations').value,
    base_cost: document.getElementById('base_cost').value,
    dependency_level: document.getElementById('dependency_level').value,
    monthly_cost: document.getElementById('monthly_cost').textContent
  };

  console.log('Form Data:', formData);
  
  // TODO: Enviar para API
  alert('Residente salvo com sucesso!');
  
  // Voltar para dashboard
  setTimeout(() => {
    window.location.href = '/html/dashboard.html';
  }, 1500);
}

// ============================================
// GO BACK
// ============================================

function goBack() {
  window.location.href = '/html/dashboard.html';
}
