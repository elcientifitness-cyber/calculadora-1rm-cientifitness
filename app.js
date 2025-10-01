// Datos actualizados de RPE/RIR basados en evidencia científica
const RPE_RIR_TABLE = {
  1: { "10": 100, "9.5": 97.8, "9": 95.5, "8.5": 93.9, "8": 92.2, "7.5": 90.7, "7": 89.2, "6.5": 87.8, "6": 86.3 },
  2: { "10": 95.5, "9.5": 93.9, "9": 92.2, "8.5": 90.7, "8": 89.2, "7.5": 87.8, "7": 86.3, "6.5": 85.0, "6": 83.7 },
  3: { "10": 92.2, "9.5": 90.7, "9": 89.2, "8.5": 87.8, "8": 86.3, "7.5": 85.0, "7": 83.7, "6.5": 82.4, "6": 81.1 },
  4: { "10": 89.2, "9.5": 87.8, "9": 86.3, "8.5": 85.0, "8": 83.7, "7.5": 82.4, "7": 81.1, "6.5": 79.9, "6": 78.6 },
  5: { "10": 86.3, "9.5": 85.0, "9": 83.7, "8.5": 82.4, "8": 81.1, "7.5": 79.9, "7": 78.6, "6.5": 77.4, "6": 76.2 },
  6: { "10": 83.7, "9.5": 82.4, "9": 81.1, "8.5": 79.9, "8": 78.6, "7.5": 77.4, "7": 76.2, "6.5": 75.1, "6": 73.9 },
  7: { "10": 81.1, "9.5": 79.9, "9": 78.6, "8.5": 77.4, "8": 76.2, "7.5": 75.1, "7": 73.9, "6.5": 72.3, "6": 70.7 },
  8: { "10": 78.6, "9.5": 77.4, "9": 76.2, "8.5": 75.1, "8": 73.9, "7.5": 72.3, "7": 70.7, "6.5": 69.4, "6": 68.0 },
  9: { "10": 76.2, "9.5": 75.1, "9": 73.9, "8.5": 72.3, "8": 70.7, "7.5": 69.4, "7": 68.0, "6.5": 66.7, "6": 65.3 },
  10: { "10": 73.9, "9.5": 72.3, "9": 70.7, "8.5": 69.4, "8": 68.0, "7.5": 66.7, "7": 65.3, "6.5": 64.0, "6": 62.6 }
};

// Objetivos de entrenamiento para la tabla de porcentajes
const PERCENTAGE_OBJECTIVES = {
  "50%": "Calentamiento y técnica",
  "60%": "Resistencia muscular",
  "65%": "Resistencia muscular",
  "70%": "Hipertrofia muscular",
  "75%": "Hipertrofia muscular",
  "80%": "Hipertrofia muscular",
  "85%": "Fuerza máxima",
  "90%": "Fuerza máxima",
  "95%": "Fuerza absoluta/competición",
  "100%": "Fuerza absoluta/competición"
};

let currentTraditionalData = null;
let currentRPEData = null;

document.addEventListener('DOMContentLoaded', function() {
  initializeTabs();
  initializeFormListeners();
  initializeEffortScale();
});

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;

      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(targetTab).classList.add('active');
      
      if (targetTab === 'comparacion') {
        updateComparison();
      }
    });
  });
}

function initializeFormListeners() {
  ['trad-weight', 'trad-reps'].forEach(id => {
    document.getElementById(id).addEventListener('input', debounce(() => {
      const weight = parseFloat(document.getElementById('trad-weight').value);
      const reps = parseInt(document.getElementById('trad-reps').value);
      if (weight > 0 && reps > 0 && reps <= 20) {
        calculateTraditional();
      }
    }, 300));
  });

  ['rpe-weight', 'rpe-reps', 'effort-value'].forEach(id => {
    document.getElementById(id).addEventListener('input', debounce(() => {
      const weight = parseFloat(document.getElementById('rpe-weight').value);
      const reps = parseInt(document.getElementById('rpe-reps').value);
      const effort = parseFloat(document.getElementById('effort-value').value);
      if (weight > 0 && reps > 0 && reps <= 10 && effort >= 0) {
        calculateRPE();
      }
    }, 300));
  });
}

function initializeEffortScale() {
  const radioButtons = document.querySelectorAll('input[name="effort-scale"]');
  radioButtons.forEach(radio => radio.addEventListener('change', updateEffortScale));
  document.getElementById('effort-value').addEventListener('input', updateEffortDescription);
  updateEffortScale();
}

function updateEffortScale() {
  const selectedScale = document.querySelector('input[name="effort-scale"]:checked').value;
  const effortInput = document.getElementById('effort-value');
  const effortLabel = document.getElementById('effort-label');

  if (selectedScale === 'rpe') {
    effortLabel.textContent = 'Valor RPE (6-10)';
    effortInput.min = '6';
    effortInput.max = '10';
    effortInput.placeholder = 'ej. 8';
  } else {
    effortLabel.textContent = 'Valor RIR (0-4)';
    effortInput.min = '0';
    effortInput.max = '4';
    effortInput.placeholder = 'ej. 2';
  }
  updateEffortDescription();
}

function updateEffortDescription() {
  const selectedScale = document.querySelector('input[name="effort-scale"]:checked').value;
  const effortValue = parseFloat(document.getElementById('effort-value').value);
  const reps = parseInt(document.getElementById('rpe-reps').value) || 1;
  const descriptionElement = document.getElementById('effort-description');

  if (!effortValue && effortValue !== 0) {
    descriptionElement.textContent = '';
    return;
  }

  let rpeValue = selectedScale === 'rpe' ? effortValue : (10 - effortValue);
  const percentage = getRealPercentage(rpeValue, reps);
  if (percentage) {
    const desc = getEffortDescription(rpeValue);
    descriptionElement.textContent = `${desc} (≈${percentage}% del 1RM con ${reps} reps)`;
  }
}

function getRealPercentage(rpe, reps) {
  const limitedReps = Math.min(Math.max(reps, 1), 10);
  if (RPE_RIR_TABLE[limitedReps]) {
    if (RPE_RIR_TABLE[limitedReps][rpe.toString()]) {
      return RPE_RIR_TABLE[limitedReps][rpe.toString()];
    }
    const keys = Object.keys(RPE_RIR_TABLE[limitedReps]).map(Number).sort((a,b) => a-b);
    for (let i=0; i<keys.length - 1; i++) {
      if (rpe >= keys[i] && rpe <= keys[i+1]) {
        const low = RPE_RIR_TABLE[limitedReps][keys[i]];
        const high = RPE_RIR_TABLE[limitedReps][keys[i+1]];
        const ratio = (rpe - keys[i]) / (keys[i+1] - keys[i]);
        const value = low + (high - low) * ratio;
        return Math.round(value * 10) / 10;
      }
    }
  }
  return null;
}

function getEffortDescription(rpe) {
  if (rpe >= 10) return 'Esfuerzo máximo/fallo';
  if (rpe >= 9.5) return 'Prácticamente máximo';
  if (rpe >= 9) return 'Esfuerzo casi máximo';
  if (rpe >= 8.5) return 'Muy alto-máximo';
  if (rpe >= 8) return 'Esfuerzo muy alto';
  if (rpe >= 7.5) return 'Alto-muy alto';
  if (rpe >= 7) return 'Esfuerzo alto';
  if (rpe >= 6.5) return 'Moderado-alto';
  return 'Esfuerzo moderado';
}

function calculateTraditional() {
  const weight = parseFloat(document.getElementById('trad-weight').value);
  const reps = parseInt(document.getElementById('trad-reps').value);
  const exercise = document.getElementById('exercise-traditional').value;
  if (!weight || weight <= 0 || !reps || reps <= 0 || reps > 20) {
    return;
  }
  const brzycki = weight / (1.0278 - (0.0278 * reps));
  const epley = weight * (1 + (reps / 30));
  const lombardi = weight * Math.pow(reps, 0.10);
  const oconner = weight * (1 + 0.025 * reps);
  const average = (brzycki + epley + lombardi + oconner) / 4;
  const results = {
    brzycki: Math.round(brzycki * 10) / 10,
    epley: Math.round(epley * 10) / 10,
    lombardi: Math.round(lombardi * 10) / 10,
    oconner: Math.round(oconner * 10) / 10,
    average: Math.round(average * 10) / 10
  };
  currentTraditionalData = {weight, reps, exercise, results};
  displayTraditionalResults(results, exercise);
}

function displayTraditionalResults(results, exercise) {
  document.getElementById('brzycki-result').textContent = `${results.brzycki} kg`;
  document.getElementById('epley-result').textContent = `${results.epley} kg`;
  document.getElementById('lombardi-result').textContent = `${results.lombardi} kg`;
  document.getElementById('oconner-result').textContent = `${results.oconner} kg`;
  document.getElementById('average-result').textContent = `${results.average} kg`;
  if (exercise) {
    document.getElementById('trad-exercise-info').innerHTML = `🏋️ ${exercise}`;
  }
  generatePercentageTable('trad-percentage-table', results.average);
  document.getElementById('trad-results').style.display = 'block';
}

function calculateRPE() {
  const weight = parseFloat(document.getElementById('rpe-weight').value);
  const reps = parseInt(document.getElementById('rpe-reps').value);
  const exercise = document.getElementById('rpe-exercise').value;
  const selectedScale = document.querySelector('input[name="effort-scale"]:checked').value;
  const effortValue = parseFloat(document.getElementById('effort-value').value);
  if (!weight || weight <= 0 || !reps || reps <= 0 || reps > 10 || (!effortValue && effortValue !== 0)) {
    return;
  }
  const rpeValue = selectedScale === 'rpe' ? effortValue : (10 - effortValue);
  const baseRM = weight * (1 + reps / 30);
  const realPercentage = getRealPercentage(rpeValue, reps);
  if (!realPercentage) {
    console.error('No se pudo obtener el porcentaje para RPE', rpeValue, 'y reps', reps);
    return;
  }
  const adjustedRM = weight / (realPercentage / 100);
  const difference = adjustedRM - baseRM;
  const results = {
    baseRM: Math.round(baseRM * 10) / 10,
    adjustedRM: Math.round(adjustedRM * 10) / 10,
    realPercentage: realPercentage,
    difference: Math.round(difference * 10) / 10,
    rpeValue,
    selectedScale,
    effortValue
  };
  currentRPEData = {weight, reps, exercise, results};
  displayRPEResults(results, exercise);
}

function displayRPEResults(results, exercise) {
  document.getElementById('rpe-base-result').textContent = `${results.baseRM} kg`;
  document.getElementById('rpe-adjusted-result').textContent = `${results.adjustedRM} kg`;
  if (exercise) {
    document.getElementById('rpe-exercise-info').innerHTML = `🏋️ ${exercise}`;
  }
  const scaleText = results.selectedScale === 'rpe' ? 'RPE' : 'RIR';
  const effortText = results.selectedScale === 'rpe' ? results.effortValue : (10 - results.rpeValue);
  document.getElementById('rpe-effort-info').innerHTML = `🎯 ${scaleText}: ${effortText} (${getEffortDescription(results.rpeValue)})`;
  document.getElementById('rpe-adjustment-info').textContent = `Ajustado por ${results.realPercentage}% del 1RM`;
  const changeText = results.difference > 0 ? `+${results.difference}` : `${results.difference}`;
  const changeType = results.difference > 0 ? 'más conservador' : 'más agresivo';
  document.getElementById('adjustment-explanation').innerHTML = `<strong>Diferencia vs. método tradicional:</strong> ${changeText} kg (${changeType} que la estimación tradicional)`;
  generatePercentageTable('rpe-percentage-table', results.adjustedRM, results.baseRM);
  document.getElementById('rpe-results').style.display = 'block';
}

function generatePercentageTable(tableId, primaryRM, compareRM = null) {
  const percentages = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
  let tableHTML = `<table><thead><tr><th>%</th><th>Peso (kg)</th>${compareRM?'<th>Diferencia</th>':''}<th>Objetivo</th></tr></thead><tbody>`;
  percentages.forEach(p => {
    const weight = Math.round((primaryRM * p / 100)*10)/10;
    const compareWeight = compareRM?Math.round((compareRM * p / 100)*10)/10:null;
    const difference = compareWeight?Math.round((weight - compareWeight)*10)/10:null;
    let diffCell = '';
    if(compareRM) {
      const diffText = difference > 0 ? `+${difference}` : `${difference}`;
      const diffColor = difference > 0 ? 'green' : difference < 0 ? 'red' : 'gray';
      diffCell = `<td><span style="color:${diffColor}; font-weight:600;">${diffText} kg</span></td>`;
    }
    const objective = PERCENTAGE_OBJECTIVES[`${p}%`] || '';
    tableHTML += `<tr><td><strong>${p}%</strong></td><td><strong>${weight}</strong></td>${diffCell}<td style="font-size:0.8rem;">${objective}</td></tr>`;
  });
  tableHTML += '</tbody></table>';
  document.getElementById(tableId).innerHTML = tableHTML;
}

function updateComparison() {
  const content = document.getElementById('comparison-content');
  if (!currentTraditionalData && !currentRPEData) {
    content.innerHTML = `<div class="comparison-placeholder"><p>💡 Realiza cálculos en ambos métodos para ver la comparación detallada</p><div class="method-comparison"><div class="method-card"><h4>📊 Método Tradicional</h4><ul><li>✅ Objetivo y reproducible</li><li>✅ No requiere experiencia previa</li><li>✅ Fácil de aplicar</li><li>❌ No considera el esfuerzo real del atleta</li><li>❌ Menos preciso para atletas experimentados</li></ul></div><div class="method-card"><h4>🎯 Método RPE/RIR</h4><ul><li>✅ Autorregulación del entrenamiento</li><li>✅ Más preciso para atletas experimentados</li><li>✅ Considera variaciones diarias</li><li>❌ Requiere experiencia y honestidad</li><li>❌ Subjetivo</li></ul></div></div></div>`;
    return;
  }
  const tradRM = currentTraditionalData.results.average;
  const rpeRM = currentRPEData.results.adjustedRM;
  const diff = Math.round((rpeRM - tradRM)*10)/10;
  const diffPercent = Math.round(((rpeRM - tradRM)/tradRM)*1000)/10;
  content.innerHTML = `<div class="comparison-results"><h3>📊 Comparación Directa</h3><div class="comparison-summary"><div class="result-comparison-item"><div class="result-info"><span class="result-name">Método Tradicional</span><span class="result-desc">Promedio de 4 fórmulas</span></div><div class="result-value">${tradRM} kg</div></div><div class="result-comparison-item highlight"><div class="result-info"><span class="result-name">Método RPE/RIR (Ajustado)</span><span class="result-desc">Con datos de investigación</span></div><div class="result-value">${rpeRM} kg</div></div><div class="result-comparison-item"><div class="result-info"><span class="result-name">Diferencia</span><span class="result-desc">${diff > 0 ? 'Más conservador' : 'Más agresivo'}</span></div><div class="result-value" style="color: ${diff > 0 ? 'green' : 'red'}">${diff > 0 ? '+' : ''}${diff} kg (${diffPercent > 0 ? '+' : ''}${diffPercent}%)</div></div></div><div class="adjustment-explanation"><h4>💡 Interpretación</h4><p>${diff === 0 ? 'Los métodos muestran resultados muy similares. Ambos son fiables para este cálculo.' : diff > 0 ? `El método RPE/RIR sugiere un 1RM ${Math.abs(diffPercent)}% más alto. Esto indica que el esfuerzo percibido fue más conservador.` : `El método RPE/RIR sugiere un 1RM ${Math.abs(diffPercent)}% más bajo. Esto indica que el esfuerzo fue más intenso de lo esperado.`}</p></div></div>`;
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function syncData() {
  if(currentTraditionalData && !document.getElementById('rpe-weight').value) {
    document.getElementById('rpe-weight').value = currentTraditionalData.weight;
    document.getElementById('rpe-reps').value = currentTraditionalData.reps;
    document.getElementById('rpe-exercise').value = currentTraditionalData.exercise;
  } else if(currentRPEData && !document.getElementById('trad-weight').value) {
    document.getElementById('trad-weight').value = currentRPEData.weight;
    document.getElementById('trad-reps').value = currentRPEData.reps;
    document.getElementById('exercise-traditional').value = currentRPEData.exercise;
  }
  alert('Datos sincronizados entre métodos');
}

function clearAll() {
  document.querySelectorAll('input, select').forEach(el => {
    if(el.type === 'radio') {
      el.checked = el.value === 'rpe';
    } else {
      el.value = '';
    }
  });
  document.getElementById('trad-results').style.display = 'none';
  document.getElementById('rpe-results').style.display = 'none';
  currentTraditionalData = null;
  currentRPEData = null;
  document.getElementById('effort-description').textContent = '';
  updateEffortScale();
  alert('Todos los datos han sido limpiados');
}
// Datos globales
let microcycles = [];

// Función para añadir microciclo
function addMicrocycle() {
    const name = document.getElementById('microcycle-name').value.trim();
    const muscle = document.getElementById('muscle-group').value;
    const exercise = document.getElementById('exercise-name').value.trim();
    const seriesRaw = document.getElementById('series-info').value.trim();

    if (!name || !exercise || !seriesRaw) {
        alert("Completa todos los campos.");
        return;
    }

    const seriesArray = seriesRaw.split(',').map(s => {
        const [reps, weight, rpe] = s.split('x').map(Number);
        return { reps, weight, rpe };
    });

    microcycles.push({ name, muscle, exercise, series: seriesArray });
    renderMicrocycles();
    renderTrendChart();
}

// Mostrar resumen
function renderMicrocycles() {
    const container = document.getElementById('microcycle-summary');
    container.innerHTML = '';
    microcycles.forEach(m => {
        let totalTon = m.series.reduce((acc, s) => acc + s.reps * s.weight, 0);
        let avgRIR = m.series.reduce((acc, s) => acc + (10 - s.rpe), 0) / m.series.length;
        let max1RM = Math.max(...m.series.map(s => s.weight / (1 - s.reps * 0.033))); // Epley
        const div = document.createElement('div');
        div.classList.add('result-item');
        div.innerHTML = `
            <strong>${m.name} - ${m.exercise} (${m.muscle})</strong><br>
            Máx 1RM: ${max1RM.toFixed(1)} kg | Tonelaje: ${totalTon} kg | RIR medio: ${avgRIR.toFixed(1)}
        `;
        container.appendChild(div);
    });
}

// Gráfico de tendencia usando Chart.js
function renderTrendChart() {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    const labels = microcycles.map(m => m.name + ' - ' + m.exercise);
    const max1RM = microcycles.map(m => Math.max(...m.series.map(s => s.weight / (1 - s.reps * 0.033))));
    const avgRIR = microcycles.map(m => m.series.reduce((acc, s) => acc + (10 - s.rpe), 0) / m.series.length);
    const tonnage = microcycles.map(m => m.series.reduce((acc, s) => acc + s.reps * s.weight, 0));

    if (window.trendChart) window.trendChart.destroy(); // Reset si existe

    window.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Máx 1RM', data: max1RM, borderColor: 'rgba(33,128,141,1)', fill: false },
                { label: 'RIR medio', data: avgRIR, borderColor: 'rgba(230,129,97,1)', fill: false },
                { label: 'Tonelaje total', data: tonnage, borderColor: 'rgba(192,21,47,1)', fill: false }
            ]
        },
        options: {
            responsive: true,
            scales: { y:

