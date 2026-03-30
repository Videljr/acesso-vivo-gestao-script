// ==UserScript==
// @name         Acessos VG
// @namespace    http://tampermonkey.net/
// @version      1.4.3
// @description  Modal de Acessos + Status da planilha
// @author       Videljr
// @match        https://vivogestao.vivoempresas.com.br/Portal/*
// @updateURL    https://raw.githubusercontent.com/Videljr/acesso-vivo-gestao-script/main/Acessos-Vivo-Gestao.user.js
// @downloadURL  https://raw.githubusercontent.com/Videljr/acesso-vivo-gestao-script/main/Acessos-Vivo-Gestao.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const contasPorCNPJ = {
        "NALDO SAT": [
            { nome: "0455828133" },
            { nome: "0459325639" },
            { nome: "0453979554" },
            { nome: "0444346918" },
            { nome: "0450619128" }
        ],
        "STUDIO MATHEUS": [
            { nome: "0452109744" },
            { nome: "0454860388" },
            { nome: "0444225746" },
            { nome: "0457460616" },
            { nome: "0462105797" },
            { nome: "0466121938" }
        ],
        "F DE ASSIS": [
            { nome: "0463297834" },
            { nome: "0451176465" },
            { nome: "0443889484" },
            { nome: "0461401781" }
        ],
        "CONNECTA": [
            { nome: "0469102728" },
            { nome: "0469103350" }
        ],
        "CN ENGENHARIA": [
            { nome: "0468571160" },
            { nome: "0469296149" },
            { nome: "0469301552" }
        ]
    };

    const PLANILHA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBP7xcGcd3_-ZRJTMzL8nV4ZNRat4idK_lDMFoDi-5aZwXXD_5LhW4xzqhpwCaM0YsJn_VdnO4uDNe/pub?gid=930179876&single=true&output=csv';

    let statusDasContas = {};
    let observacoesDasContas = {};
    let credenciaisDasContas = {}; // conta -> { usuario, senha }

    async function buscarStatusContas() {
        try {
            const response = await fetch(PLANILHA_URL);
            const csvText = await response.text();
            const linhas = csvText.split('\n');

            statusDasContas = {};
            observacoesDasContas = {};
            credenciaisDasContas = {};

            for (let i = 0; i < linhas.length; i++) {
                const linha = linhas[i];
                if (!linha.trim()) continue;

                const colunas = [];
                let valorAtual = '';
                let dentroDeAspas = false;

                for (let j = 0; j < linha.length; j++) {
                    const char = linha[j];
                    if (char === '"') {
                        dentroDeAspas = !dentroDeAspas;
                    } else if (char === ',' && !dentroDeAspas) {
                        colunas.push(valorAtual.trim());
                        valorAtual = '';
                    } else {
                        valorAtual += char;
                    }
                }
                colunas.push(valorAtual.trim());

                const conta = colunas[2]?.replace(/"/g, '').trim();
                const usuarioPlanilha = colunas[3]?.replace(/"/g, '').trim() || '';
                const senhaPlanilha = colunas[4]?.replace(/"/g, '').trim() || '';
                const observacao = colunas[6]?.replace(/"/g, '').trim() || '';
                const status = colunas[7]?.replace(/"/g, '').trim() || '';

                if (conta && /^\d{10}$/.test(conta)) {
                    let cor = '#A9A9A9';
                    const statusNormalizado = status ? status.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';

                    if (statusNormalizado === 'OK') {
                        cor = '#33CC00';
                    } else if (statusNormalizado === 'RENOVANDO') {
                        cor = '#ECD172';
                    } else if (statusNormalizado !== '' && statusNormalizado.length > 0) {
                        cor = '#CC0000';
                    }

                    statusDasContas[conta] = cor;
                    observacoesDasContas[conta] = observacao;

                    if (usuarioPlanilha && senhaPlanilha) {
                        credenciaisDasContas[conta] = {
                            usuario: usuarioPlanilha,
                            senha: senhaPlanilha
                        };
                    }
                }
            }
            console.log('✅ Status/credenciais carregados:', Object.keys(statusDasContas).length, 'contas');
        } catch (e) {
            console.error('❌ Erro ao buscar status/credenciais:', e);
        }
    }

    const estilos = `<style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        #vivoLoginModal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999999;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

        #vivoLoginModal .modal-content {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(30px) saturate(180%);
            -webkit-backdrop-filter: blur(30px) saturate(180%);
            border-radius: 24px;
            padding: 50px;
            max-width: 1400px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.8);
            animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #vivoLoginModal h2 {
            margin: 0 0 12px 0;
            color: #1d1d1f;
            font-size: 36px;
            font-weight: 700;
            text-align: center;
            letter-spacing: -0.5px;
        }

        #vivoLoginModal .subtitle {
            text-align: center;
            color: #86868b;
            margin-bottom: 40px;
            font-size: 16px;
            font-weight: 500;
        }

        #vivoLoginModal .colunas-container {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }

        #vivoLoginModal .coluna {
            background: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 18px;
            padding: 24px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.6);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 1;
        }

        #vivoLoginModal .coluna:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(102, 0, 153, 0.3);
            background: rgba(255, 255, 255, 0.7);
            border-color: rgba(102, 0, 153, 0.2);
        }

        #vivoLoginModal .coluna-titulo {
            font-weight: 700;
            font-size: 13px;
            color: #660099;
            margin-bottom: 18px;
            padding-bottom: 14px;
            border-bottom: 2px solid rgba(102, 0, 153, 0.2);
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        #vivoLoginModal .conta-item {
            background: transparent;
            border: none;
            padding: 0;
            margin-bottom: 12px;
            position: relative;
            display: flex;
            align-items: stretch;
            height: 52px;
            gap: 8px;
            z-index: 2;
        }

        #vivoLoginModal .conta-nome {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #1d1d1f;
            font-weight: 500;
            letter-spacing: 0.2px;
            padding: 0 16px;
            cursor: pointer;
            position: relative;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.7), inset 0 -2px 6px rgba(0, 0, 0, 0.03), inset 0 2px 6px rgba(255, 255, 255, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.4);
        }

        #vivoLoginModal .conta-nome:hover {
            background: rgba(255, 255, 255, 0.8);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(102, 0, 153, 0.3), inset 0 -2px 8px rgba(0, 0, 0, 0.05), inset 0 2px 8px rgba(255, 255, 255, 0.6);
            border-color: rgba(102, 0, 153, 0.3);
        }

        #vivoLoginModal .conta-nome:active {
            transform: translateY(0) scale(0.98);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), inset 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        #vivoLoginModal .conta-nome .bold {
            font-weight: 700;
        }

        #vivoLoginModal .status-indicator {
            width: 52px;
            min-width: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            cursor: help;
            position: relative;
            z-index: 9999;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 -2px 6px rgba(0, 0, 0, 0.1), inset 0 2px 6px rgba(255, 255, 255, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        #vivoLoginModal .status-indicator:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.12), inset 0 2px 8px rgba(255, 255, 255, 0.4);
        }

        #vivoLoginModal .status-indicator:active {
            transform: translateY(-1px) scale(0.95);
        }

        #vivoLoginModal .status-indicator img {
            width: 26px;
            height: 26px;
            filter: brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
            pointer-events: none;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #vivoLoginModal .status-indicator:hover img {
            transform: scale(1.15);
        }

        #vivoLoginModal .status-indicator.ok {
            background: linear-gradient(145deg, rgba(61, 224, 61, 0.85), rgba(40, 181, 40, 0.9));
        }

        #vivoLoginModal .status-indicator.erro {
            background: linear-gradient(145deg, rgba(230, 57, 57, 0.85), rgba(181, 32, 32, 0.9));
        }

        #vivoLoginModal .status-indicator.renovando {
            background: linear-gradient(145deg, rgba(245, 221, 128, 0.85), rgba(219, 185, 80, 0.9));
        }

        #vivoLoginModal .status-indicator.neutro {
            background: linear-gradient(145deg, rgba(184, 184, 184, 0.75), rgba(143, 143, 143, 0.85));
        }

        #vivoLoginModal .status-indicator:hover::after {
            content: attr(data-observacao);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(30, 30, 30, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            color: white;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            white-space: normal;
            max-width: 250px;
            z-index: 99999;
            margin-bottom: 10px;
            pointer-events: none;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        #vivoLoginModal .status-indicator:hover::before {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 7px solid transparent;
            border-top-color: rgba(30, 30, 30, 0.95);
            margin-bottom: 3px;
            pointer-events: none;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        #vivoLoginModal .close-btn {
            position: absolute;
            top: 24px;
            right: 24px;
            background: rgba(120, 120, 128, 0.16);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            color: #1d1d1f;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 10;
            font-weight: 300;
        }

        #vivoLoginModal .close-btn:hover {
            background: #c92424;
            color: white;
            transform: scale(1.1);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        #vivoLoginModal .close-btn:active {
            transform: scale(0.95);
        }

        #vivoLoginModal .refresh-btn {
            position: absolute;
            top: 24px;
            right: 68px;
            background: rgba(120, 120, 128, 0.16);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 10;
        }

        #vivoLoginModal .refresh-btn:hover {
            background: rgba(102, 0, 153, 0.9);
            box-shadow: 0 4px 16px rgba(102, 0, 153, 0.3);
        }

        #vivoLoginModal .refresh-btn:active {
            transform: scale(0.9);
        }

        #vivoLoginModal .refresh-btn.loading {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        #vivoLoginModal .refresh-btn img {
            width: 18px;
            height: 18px;
            filter: brightness(0) saturate(100%) invert(12%) sepia(0%) saturate(0%) hue-rotate(0deg);
            transition: filter 0.3s ease;
        }

        #vivoLoginModal .refresh-btn:hover img {
            filter: brightness(0) invert(1);
        }

        #vivoLoginModal .footer-info {
            text-align: center;
            color: #86868b;
            font-size: 13px;
            margin-top: 30px;
            padding-top: 24px;
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            font-weight: 500;
        }

        #vivoLoginBtn {
            width: 100%;
            max-width: 550px;
            height: 56px;
            background: rgba(102, 0, 153, 0.9);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(102, 0, 153, 0.5);
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(102, 0, 153, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 600;
            color: white;
            margin: 20px auto;
            letter-spacing: 0.3px;
        }

        #vivoLoginBtn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 0, 153, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3);
            background: rgba(112, 0, 168, 0.95);
        }

        #vivoLoginBtn:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(102, 0, 153, 0.2);
        }

        @media (max-width: 1200px) {
            #vivoLoginModal .colunas-container { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 768px) {
            #vivoLoginModal .colunas-container { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 500px) {
            #vivoLoginModal .colunas-container { grid-template-columns: 1fr; }
        }
    </style>`;

    document.head.insertAdjacentHTML('beforeend', estilos);

    function formatarNomeConta(nome) {
        if (nome.length >= 4) {
            return `${nome.slice(0, -4)}<span class="bold">${nome.slice(-4)}</span>`;
        }
        return nome;
    }

    function obterCorStatus(nome) {
        return statusDasContas[nome] || '#A9A9A9';
    }

    // função extraída para evitar no-loop-func
    function construirContaItemHTML(cnpj, conta, index) {
        const corFundo = obterCorStatus(conta.nome);
        const observacao = observacoesDasContas[conta.nome] || 'Sem observações';

        let statusClasse = 'neutro';
        let statusIcone = 'https://cdn-icons-png.flaticon.com/512/162/162545.png';

        if (corFundo === '#33CC00') {
            statusClasse = 'ok';
            statusIcone = 'https://cdn-icons-png.flaticon.com/512/33/33281.png';
        } else if (corFundo === '#CC0000') {
            statusClasse = 'erro';
            statusIcone = 'https://cdn-icons-png.flaticon.com/512/159/159469.png';
        } else if (corFundo === '#ECD172') {
            statusClasse = 'renovando';
            statusIcone = 'https://cdn-icons-png.flaticon.com/512/61/61444.png';
        }

        return `
            <div class="conta-item" data-cnpj="${cnpj}" data-index="${index}">
                <div class="conta-nome">${formatarNomeConta(conta.nome)}</div>
                <div class="status-indicator ${statusClasse}" data-observacao="${observacao}">
                    <img src="${statusIcone}" alt="Status">
                </div>
            </div>
        `;
    }

    function criarBotaoFlutuante() {
        if (document.getElementById('vivoLoginBtn')) return;
        const botaoEntrar = document.querySelector('#botao_entrar') || document.querySelector('button[type="submit"]');

        if (botaoEntrar) {
            const botao = document.createElement('button');
            botao.id = 'vivoLoginBtn';
            botao.type = 'button';
            botao.textContent = 'Acessos do Vivo Gestão';
            botao.addEventListener('click', (e) => {
                e.preventDefault();
                const modalExistente = document.getElementById('vivoLoginModal');
                if (modalExistente) modalExistente.remove();
                criarModal();
            });
            botaoEntrar.parentNode.insertBefore(botao, botaoEntrar.nextSibling);
        }
    }

    function criarModal() {
        const modal = document.createElement('div');
        modal.id = 'vivoLoginModal';
        let colunasHTML = '';

        for (const [cnpj, contas] of Object.entries(contasPorCNPJ)) {
            let contasHTML = '';
            contas.forEach((conta, index) => {
                contasHTML += construirContaItemHTML(cnpj, conta, index);
            });
            colunasHTML += `<div class="coluna"><div class="coluna-titulo">${cnpj}</div>${contasHTML}</div>`;
        }

        modal.innerHTML = `
            <div class="modal-content">
                <button class="refresh-btn" id="refreshBtn" title="Atualizar status da planilha">
                    <img src="https://cdn-icons-png.flaticon.com/512/1449/1449312.png" alt="Atualizar">
                </button>
                <button class="close-btn" id="closeModal">×</button>
                <h2>Selecione uma Conta</h2>
                <div class="subtitle">Escolha a conta para fazer login no Vivo Gestão</div>
                <div class="colunas-container">${colunasHTML}</div>
                <div class="footer-info">
                    <img src="https://cdn-icons-png.flaticon.com/512/10021/10021044.png"
                        alt="Info"
                        style="width:24px;height:24px;vertical-align:middle;margin-right:6px;">
                    Dica: Verde = Renovação concluída | Amarelo = Renovando | Vermelho = Erro | Cinza = Aguardando Renovação
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.querySelectorAll('.conta-item').forEach(item => {
            const nomeContaEl = item.querySelector('.conta-nome');
            if (nomeContaEl) {
                nomeContaEl.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const cnpj = item.getAttribute('data-cnpj');
                    const index = item.getAttribute('data-index');
                    preencherLogin(contasPorCNPJ[cnpj][index]);
                });
            }
        });

        document.getElementById('closeModal').addEventListener('click', fecharModal);
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                atualizarStatus();
            });
        }
        modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });
    }

    async function atualizarStatus() {
        const btn = document.getElementById('refreshBtn');
        const img = btn?.querySelector('img');

        if (btn && img) {
            img.src = 'https://cdn-icons-png.flaticon.com/512/6356/6356687.png';
            btn.classList.add('loading');
            btn.disabled = true;
        }

        console.log('🔄 Atualizando status da planilha...');

        await buscarStatusContas();

        fecharModal();
        setTimeout(() => {
            criarModal();
            console.log('✅ Status atualizados!');
        }, 300);
    }

    function preencherLogin(conta) {
        const campoUsuario = document.querySelector('input[type="text"]');
        const campoSenha = document.querySelector('input[type="password"]');

        if (!campoUsuario || !campoSenha) return;

        const credPlanilha = credenciaisDasContas[conta.nome];

        const usuario = credPlanilha?.usuario || conta.usuario;
        const senha = credPlanilha?.senha || conta.senha;

        if (!usuario || !senha) {
            alert('Usuário ou senha não encontrados para esta conta na planilha.');
            return;
        }

        campoUsuario.value = usuario;
        campoSenha.value = senha;

        ['input', 'change'].forEach(evento => {
            campoUsuario.dispatchEvent(new Event(evento, { bubbles: true }));
            campoSenha.dispatchEvent(new Event(evento, { bubbles: true }));
        });

        campoUsuario.style.borderColor = '#660099';
        campoSenha.style.borderColor = '#660099';

        fecharModal();

        setTimeout(() => {
            campoUsuario.style.borderColor = '';
            campoSenha.style.borderColor = '';
        }, 500);
    }

    function fecharModal() {
        const modal = document.getElementById('vivoLoginModal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        }
    }

    function estaNaPaginaDeLogin() {
        return document.querySelector('input[type="text"]') &&
               document.querySelector('input[type="password"]') &&
               (document.querySelector('#botao_entrar') || document.querySelector('button[type="submit"]'));
    }

    async function inicializar() {
        await buscarStatusContas();
        if (estaNaPaginaDeLogin()) criarBotaoFlutuante();
    }

    const observador = new MutationObserver(() => {
        if (estaNaPaginaDeLogin() && !document.getElementById('vivoLoginBtn')) inicializar();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }

    window.addEventListener('load', () => {
        inicializar();
        observador.observe(document.body, { childList: true, subtree: true });
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(() => {
                if (estaNaPaginaDeLogin() && !document.getElementById('vivoLoginBtn')) inicializar();
            }, 500);
        }
    });

    setInterval(() => {
        if (estaNaPaginaDeLogin() && !document.getElementById('vivoLoginBtn')) inicializar();
    }, 2000);

})();
