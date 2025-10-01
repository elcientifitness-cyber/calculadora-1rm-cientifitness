// Cambio de pestañas
document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc=>tc.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// -------------------- 1RM Tradicional --------------------
function calculateTraditional(){
    const weight = parseFloat(document.getElementById('trad-weight').value);
    const reps = parseInt(document.getElementById('trad-reps').value);
    if(!weight || !reps){ alert('Introduce peso y repeticiones'); return; }

    const brzycki = weight * (36 / (37 - reps));
    const epley = weight * (1 + reps/30);
    const lombardi = weight * Math.pow(reps,0.10);
    const avg = (brzycki + epley + lombardi)/3;

    document.getElementById('brzycki-result').textContent = brzycki.toFixed(1)+' kg';
    document.getElementById('epley-result').textContent = epley.toFixed(1)+' kg';
    document.getElementById('lombardi-result').textContent = lombardi.toFixed(1)+' kg';
    document.getElementById('average-result').textContent = avg.toFixed(1)+' kg';
    document.getElementById('trad-results').style.display='block';
}

// -------------------- 1RM RPE/RIR --------------------
function calculateRPE(){
    const weight = parseFloat(document.getElementById('rpe-weight').value);
    const reps = parseInt(document.getElementById('rpe-reps').value);
    const scale = document.querySelector('input[name="effort-scale"]:checked').value;
    const effort = parseFloat(document.getElementById('effort-value').value);
    if(!weight || !reps || !effort){ alert('Introduce todos los valores'); return; }

    // Fórmula simplificada: 1RM = peso / (1 - (reps + RIR)/30)
    let rir = (scale==='rir')? effort : 10 - effort;
    let adjusted1RM = weight / (1 - ((reps + rir)/30));
    document.getElementById('rpe-adjusted-result').textContent = adjusted1RM.toFixed(1)+' kg';
    document.getElementById('rpe-results').style.display='block';
}

// -------------------- Microciclos --------------------
let microcycles = [];

function addMicrocycle(){
    const name = document.getElementById('microcycle-name').value;
    const muscle = document.getElementById('muscle-group').value;
    const exercise = document.getElementById('exercise-name').value;
    const seriesStr = document.getElementById('series-info').value;

    if(!name || !muscle || !exercise || !seriesStr){ alert('Completa todos los campos'); return; }

    // Parseo de series: "5x100x8,4x105x7"
    const series = seriesStr.split(',').map(s=>{
        const [reps, weight, rpe] = s.split('x').map(Number);
        return {reps, weight, rpe};
    });

    microcycles.push({name, muscle, exercise, series});

    renderMicrocycles();
    updateTrendChart();
}

// Mostrar microciclos
function renderMicrocycles(){
    const container = document.getElementById('microcycle-summary');
    container.innerHTML='';
    microcycles.forEach((mc,i)=>{
        let totalTon = mc.series.reduce((a,s)=>a+s.reps*s.weight,0);
        let avgRPE = mc.series.reduce((a,s)=>a+s.rpe,0)/mc.series.length;
        let est1RM = mc.series.reduce((a,s)=>a + s.weight*(1+s.reps/30),0)/mc.series.length;

        const div = document.createElement('div');
        div.className='result-item';
        div.innerHTML = `
            <div>${mc.name} - ${mc.exercise} (${mc.muscle})</div>
            <div>1RM: ${est1RM.toFixed(1)} kg | RPE: ${avgRPE.toFixed(1)} | Ton: ${totalTon.toFixed(1)} kg</div>
        `;
        container.appendChild(div);
    });
}

// -------------------- Gráfico de Tendencia --------------------
let trendChart;
function updateTrendChart(){
    const labels = microcycles.map(mc=>mc.name);
    const avg1RM = microcycles.map(mc=>{
        return mc.series.reduce((a,s)=>a+s.weight*(1+s.reps/30),0)/mc.series.length;
    });
    const avgRPE = microcycles.map(mc=>{
        return mc.series.reduce((a,s)=>a+s.rpe,0)/mc.series.length;
    });
    const totalTon = microcycles.map(mc=>{
        return mc.series.reduce((a,s)=>a+s.reps*s.weight,0);
    });

    const ctx = document.getElementById('trend-chart').getContext('2d');
    if(trendChart) trendChart.destroy();
    trendChart = new Chart(ctx,{
        type:'line',
        data:{
            labels,
            datasets:[
                { label:'1RM Promedio', data:avg1RM, borderColor:'rgba(33,128,141,1)', fill:false, tension:0.3 },
                { label:'RPE Promedio', data:avgRPE, borderColor:'rgba(34,197,94,1)', fill:false, tension:0.3 },
                { label:'Tonelaje Total', data:totalTon, borderColor:'rgba(230,129,97,1)', fill:false, tension:0.3 }
            ]
        },
        options:{ responsive:true, plugins:{ legend:{ position:'top' } } }
    });
}

