// ==================== CLASSES ====================
class Disciplina {
    constructor(id, nome, cargaHoraria) {
        this.id = id;
        this.nome = nome;
        this.cargaHoraria = cargaHoraria;
    }
}

class Meta {
    constructor(id, disciplinaId, horasMeta) {
        this.id = id;
        this.disciplinaId = disciplinaId;
        this.horasMeta = horasMeta;
    }
}

class RegistroEstudo {
    constructor(id, disciplinaId, data, horas) {
        this.id = id;
        this.disciplinaId = disciplinaId;
        this.data = data;
        this.horas = horas;
    }
}

// ==================== DADOS GLOBAIS ====================
let disciplinas = [];
let metas = [];
let registros = [];

// ==================== FUNÇÕES AUXILIARES ====================
function gerarId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 6);
}

function salvarDados() {
    localStorage.setItem('disciplinas', JSON.stringify(disciplinas));
    localStorage.setItem('metas', JSON.stringify(metas));
    localStorage.setItem('registros', JSON.stringify(registros));
}

function carregarDados() {
    const disc = localStorage.getItem('disciplinas');
    if (disc) disciplinas = JSON.parse(disc).map(d => new Disciplina(d.id, d.nome, d.cargaHoraria));
    else disciplinas = [];

    const metasData = localStorage.getItem('metas');
    if (metasData) metas = JSON.parse(metasData).map(m => new Meta(m.id, m.disciplinaId, m.horasMeta));
    else metas = [];

    const regData = localStorage.getItem('registros');
    if (regData) registros = JSON.parse(regData).map(r => new RegistroEstudo(r.id, r.disciplinaId, r.data, r.horas));
    else registros = [];
}

// ==================== RENDERIZAÇÃO ====================
function atualizarSelects() {
    const selectMeta = document.getElementById('selectDisciplina');
    const selectRegistro = document.getElementById('selectDisciplinaRegistro');
    const options = disciplinas.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');
    selectMeta.innerHTML = '<option value="">Selecione uma disciplina...</option>' + options;
    selectRegistro.innerHTML = '<option value="">Selecione uma disciplina...</option>' + options;
}

function renderizarDisciplinas() {
    const container = document.getElementById('listaDisciplinas');
    if (!disciplinas.length) {
        container.innerHTML = '<p class="small-text">Nenhuma disciplina cadastrada.</p>';
        return;
    }
    container.innerHTML = disciplinas.map(d => `
        <div class="item-lista">
            <span><strong>${d.nome}</strong> (Carga: ${d.cargaHoraria}h)</span>
            <button class="remover-btn" data-id="${d.id}" data-tipo="disciplina">Remover</button>
        </div>
    `).join('');
}

function renderizarMetas() {
    const container = document.getElementById('listaMetas');
    if (!metas.length) {
        container.innerHTML = '<p class="small-text">Nenhuma meta definida.</p>';
        return;
    }
    container.innerHTML = metas.map(m => {
        const disc = disciplinas.find(d => d.id === m.disciplinaId);
        const nomeDisc = disc ? disc.nome : 'Desconhecida';
        return `
            <div class="item-lista">
                <span><strong>${nomeDisc}</strong>: ${m.horasMeta} h/semana</span>
                <button class="remover-btn" data-id="${m.id}" data-tipo="meta">Remover</button>
            </div>
        `;
    }).join('');
}

function renderizarRegistros() {
    const container = document.getElementById('listaRegistros');
    if (!registros.length) {
        container.innerHTML = '<p class="small-text">Nenhum registro de estudo.</p>';
        return;
    }
    const ordenados = [...registros].sort((a,b) => b.data.localeCompare(a.data)).slice(0,5);
    container.innerHTML = ordenados.map(r => {
        const disc = disciplinas.find(d => d.id === r.disciplinaId);
        const nomeDisc = disc ? disc.nome : 'Desconhecida';
        return `
            <div class="item-lista">
                <span><strong>${nomeDisc}</strong> - ${r.data}: ${r.horas} h</span>
                <button class="remover-btn" data-id="${r.id}" data-tipo="registro">Remover</button>
            </div>
        `;
    }).join('');
}

// ==================== RELATÓRIOS ====================
function obterInicioSemana(data) {
    const d = new Date(data);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0,10);
}

function obterInicioMes(data) {
    const d = new Date(data);
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10);
}

function calcularHorasPorPeriodo(inicio, fim) {
    const resumo = {};
    registros.forEach(reg => {
        if (reg.data >= inicio && reg.data <= fim) {
            resumo[reg.disciplinaId] = (resumo[reg.disciplinaId] || 0) + reg.horas;
        }
    });
    return resumo;
}

function atualizarRelatorio(filtro) {
    const container = document.getElementById('relatorios');
    if (!disciplinas.length) {
        container.innerHTML = '<p class="small-text">Nenhuma disciplina cadastrada ainda.</p>';
        return;
    }
    const hoje = new Date().toISOString().slice(0,10);
    let inicio, nomePeriodo;
    if (filtro === 'semana') {
        inicio = obterInicioSemana(hoje);
        nomePeriodo = `Esta semana (${inicio} a ${hoje})`;
    } else if (filtro === 'mes') {
        inicio = obterInicioMes(hoje);
        nomePeriodo = `Este mês (${inicio.slice(0,7)})`;
    } else {
        inicio = '2000-01-01';
        nomePeriodo = 'Todas as datas';
    }
    const fim = hoje;
    const horasPorDisc = calcularHorasPorPeriodo(inicio, fim);
    let html = `<p><strong>Período: ${nomePeriodo}</strong></p>`;
    html += '<div style="display:flex; flex-direction:column; gap:16px;">';
    disciplinas.forEach(disc => {
        const meta = metas.find(m => m.disciplinaId === disc.id);
        const horasMeta = meta ? meta.horasMeta : 0;
        const horasEstudadas = horasPorDisc[disc.id] || 0;
        const progresso = horasMeta > 0 ? (horasEstudadas / horasMeta * 100).toFixed(1) : 0;
        const atingida = horasMeta > 0 && horasEstudadas >= horasMeta ? '✅ Sim' : '❌ Não';
        html += `
            <div class="relatorio-item">
                <div><strong>${disc.nome}</strong> (Carga: ${disc.cargaHoraria}h)</div>
                <div>Meta semanal: ${horasMeta} h | Estudadas: ${horasEstudadas} h</div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${Math.min(progresso, 100)}%;"></div></div>
                <div>Progresso: ${progresso}% | Meta atingida: ${atingida}</div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// ==================== EVENTOS DE REMOÇÃO ====================
function configurarRemocoes() {
    document.querySelectorAll('.remover-btn').forEach(btn => {
        btn.removeEventListener('click', handleRemover);
        btn.addEventListener('click', handleRemover);
    });
}

function handleRemover(e) {
    const id = e.currentTarget.getAttribute('data-id');
    const tipo = e.currentTarget.getAttribute('data-tipo');
    if (tipo === 'disciplina') {
        disciplinas = disciplinas.filter(d => d.id !== id);
        metas = metas.filter(m => m.disciplinaId !== id);
        registros = registros.filter(r => r.disciplinaId !== id);
    } else if (tipo === 'meta') {
        metas = metas.filter(m => m.id !== id);
    } else if (tipo === 'registro') {
        registros = registros.filter(r => r.id !== id);
    }
    salvarDados();
    atualizarSelects();
    renderizarDisciplinas();
    renderizarMetas();
    renderizarRegistros();
    const filtroAtivo = document.querySelector('.filtro-btn.active');
    if (filtroAtivo) atualizarRelatorio(filtroAtivo.getAttribute('data-filtro'));
    configurarRemocoes();
}

// ==================== CRIAÇÃO DE DADOS ====================
function adicionarDisciplina(e) {
    e.preventDefault();
    const nome = document.getElementById('nomeDisciplina').value.trim();
    const carga = parseFloat(document.getElementById('cargaHoraria').value);
    if (!nome || isNaN(carga) || carga <= 0) return;
    const nova = new Disciplina(gerarId(), nome, carga);
    disciplinas.push(nova);
    salvarDados();
    atualizarSelects();
    renderizarDisciplinas();
    renderizarMetas();
    renderizarRegistros();
    const filtroAtivo = document.querySelector('.filtro-btn.active');
    if (filtroAtivo) atualizarRelatorio(filtroAtivo.getAttribute('data-filtro'));
    configurarRemocoes();
    document.getElementById('disciplinaForm').reset();
}

function adicionarMeta(e) {
    e.preventDefault();
    const discId = document.getElementById('selectDisciplina').value;
    const horas = parseFloat(document.getElementById('horasMeta').value);
    if (!discId || isNaN(horas) || horas <= 0) return;
    const existente = metas.find(m => m.disciplinaId === discId);
    if (existente) {
        existente.horasMeta = horas;
    } else {
        metas.push(new Meta(gerarId(), discId, horas));
    }
    salvarDados();
    renderizarMetas();
    const filtroAtivo = document.querySelector('.filtro-btn.active');
    if (filtroAtivo) atualizarRelatorio(filtroAtivo.getAttribute('data-filtro'));
    configurarRemocoes();
    document.getElementById('metaForm').reset();
}

function adicionarRegistro(e) {
    e.preventDefault();
    const discId = document.getElementById('selectDisciplinaRegistro').value;
    const data = document.getElementById('dataEstudo').value;
    const horas = parseFloat(document.getElementById('horasEstudadas').value);
    if (!discId || !data || isNaN(horas) || horas <= 0) return;
    const novo = new RegistroEstudo(gerarId(), discId, data, horas);
    registros.push(novo);
    salvarDados();
    renderizarRegistros();
    const filtroAtivo = document.querySelector('.filtro-btn.active');
    if (filtroAtivo) atualizarRelatorio(filtroAtivo.getAttribute('data-filtro'));
    configurarRemocoes();
    document.getElementById('registroForm').reset();
    document.getElementById('dataEstudo').valueAsDate = new Date();
}

// ==================== FILTROS ====================
function configurarFiltros() {
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            atualizarRelatorio(btn.getAttribute('data-filtro'));
        });
    });
}

// ==================== INICIALIZAÇÃO DO APP ====================
function initApp() {
    carregarDados();
    atualizarSelects();
    renderizarDisciplinas();
    renderizarMetas();
    renderizarRegistros();
    const filtroAtivo = document.querySelector('.filtro-btn.active');
    if (filtroAtivo) atualizarRelatorio(filtroAtivo.getAttribute('data-filtro'));
    configurarRemocoes();
    configurarFiltros();
    document.getElementById('disciplinaForm').addEventListener('submit', adicionarDisciplina);
    document.getElementById('metaForm').addEventListener('submit', adicionarMeta);
    document.getElementById('registroForm').addEventListener('submit', adicionarRegistro);
    document.getElementById('dataEstudo').valueAsDate = new Date();
}

// ==================== LOGIN ====================
function validarLogin(email, senha) {
    return email.includes('@') && senha.trim().length > 0;
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    if (validarLogin(email, senha)) {
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('appPanel').style.display = 'block';
        initApp();
    } else {
        errorDiv.style.display = 'block';
    }
}

// Garantir que os elementos existam antes de associar eventos
document.addEventListener('DOMContentLoaded', function() {
    const btnLogin = document.getElementById('btnLogin');
    const logoutBtn = document.getElementById('logoutBtn');
    if (btnLogin) btnLogin.addEventListener('click', login);
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        document.getElementById('appPanel').style.display = 'none';
        document.getElementById('loginPanel').style.display = 'block';
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginError').style.display = 'none';
    });
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
});
