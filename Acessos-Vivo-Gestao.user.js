// ==UserScript==
// @name         Acessos VG
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Modal com 5 colunas + Status colorido da planilha
// @author       Videljr
// @match        https://vivogestao.vivoempresas.com.br/Portal/*
// @updateURL    https://raw.githubusercontent.com/Videljr/acesso-vivo-gestao-script/main/Acessos-Vivo-Gestao.user.js
// @downloadURL  https://raw.githubusercontent.com/Videljr/acesso-vivo-gestao-script/main/Acessos-Vivo-Gestao.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // CONFIGURAÇÃO DAS CONTAS AGRUPADAS POR CNPJ
    const contasPorCNPJ = {
        "NALDO SAT": [
            { nome: "0455828133", usuario: "0455828133", senha: "0455828133" },
            { nome: "0459325639", usuario: "NALDOSAT5639", senha: "293735639" },
            { nome: "0453979554", usuario: "NALDOSAT9554", senha: "293739554" },
            { nome: "0444346918", usuario: "NALDOSAT6918", senha: "293736918" },
            { nome: "0450619128", usuario: "NALDOSAT9128", senha: "293739128" }
        ],
        "STUDIO MATHEUS": [
            { nome: "0452109744", usuario: "045210974400", senha: "508309744" },
            { nome: "0454860388", usuario: "STUDIO_0388", senha: "508300388" },
            { nome: "0444225746", usuario: "studiomatheu", senha: "508305746" },
            { nome: "0457460616", usuario: "STUDIO_0616", senha: "508300616" },
            { nome: "0462105797", usuario: "0462105797", senha: "508305797" },
            { nome: "0466121938", usuario: "0466121938", senha: "508301938" }
        ],
        "F DE ASSIS": [
            { nome: "0463297834", usuario: "0463297834", senha: "352687834" },
            { nome: "0451176465", usuario: "FDEASSIS02", senha: "352686465" },
            { nome: "0443889484", usuario: "ASSIS_9484", senha: "CONECTA" },
            { nome: "0461401781", usuario: "0461401781", senha: "352681781" }
        ],
        "CONNECTA": [
            { nome: "0469102728", usuario: "CONNECTA2728", senha: "641142728" },
            { nome: "0469103350", usuario: "connecta3350", senha: "0469103350" }
        ],
        "CN ENGENHARIA": [
            { nome: "0468571160", usuario: "0468571160", senha: "0468571160" },
            { nome: "0469296149", usuario: "0469296149", senha: "Maju2026" },
            { nome: "0469301552", usuario: "0469301552", senha: "Maju2026" }
        ]
    };

    // URL DA PLANILHA PUBLICADA
    const PLANILHA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBP7xcGcd3_-ZRJTMzL8nV4ZNRat4idK_lDMFoDi-5aZwXXD_5LhW4xzqhpwCaM0YsJn_VdnO4uDNe/pub?gid=930179876&single=true&output=csv';

    let statusDasContas = {};

    async function buscarStatusContas() {
        try {
            const response = await fetch(PLANILHA_URL);
            const csvText = await response.text();
            const linhas = csvText.split('\n');

            for (let i = 0; i < linhas.length; i++) {
                const linha = linhas[i];
                if (!linha.trim()) continue;
                const colunas = linha.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                const conta = colunas[2]?.trim().replace(/"/g, '');
                const status = colunas[7]?.trim().replace(/"/g, '').toUpperCase();

                if (conta && /^\d{10}$/.test(conta)) {
                    let cor = '#A9A9A9'; // Cinza por padrão

                    if (status === 'OK') {
                        cor = '#33CC00'; // Verde
                    } else if (status === 'RENOVANDO') {
                        cor = '#ECD172'; // Amarelo
                    } else if (status && (status.includes('ERROR ASSINCRONO') ||
                               status.includes('ESPELHAMENTO') ||
                               status.includes('MULTIPLOS ERROS'))) {
                        cor = '#CC0000'; // Vermelho
                    }

                    statusDasContas[conta] = cor;
                }
            }
            console.log('✅ Status carregados:', Object.keys(statusDasContas).length, 'contas');
        } catch (e) {
            console.error('❌ Erro ao buscar status:', e);
        }
    }
            const estilos = `<style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

        #vivoLoginModal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(10px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999999;
            font-family: 'Inter', sans-serif;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        #vivoLoginModal .modal-content {
            background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%);
            border-radius: 20px;
            padding: 40px;
            max-width: 1400px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
            animation: slideUp 0.4s ease;
        }

        #vivoLoginModal h2 {
            margin: 0 0 10px 0;
            color: #660099;
            font-size: 32px;
            font-weight: 700;
            text-align: center;
        }

        #vivoLoginModal .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 35px;
            font-size: 15px;
        }

        #vivoLoginModal .colunas-container {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 20px;
            margin-bottom: 25px;
        }

        #vivoLoginModal .coluna {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }

        #vivoLoginModal .coluna-titulo {
            font-weight: 700;
            font-size: 15px;
            color: #660099;
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 3px solid #660099;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* NOVO ESTILO DOS CARDS */
        #vivoLoginModal .conta-item {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            padding: 0;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.25s ease;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: stretch;
            height: 50px;
        }

        #vivoLoginModal .conta-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            border-color: #660099;
        }

        #vivoLoginModal .conta-item:active {
            transform: translateY(-1px) scale(0.98);
        }

        #vivoLoginModal .conta-nome {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #333;
            font-weight: 400;
            letter-spacing: 0.3px;
            padding: 0 15px;
        }

        #vivoLoginModal .conta-nome .bold {
            font-weight: 700;
        }

        /* INDICADOR DE STATUS */
        #vivoLoginModal .status-indicator {
            width: 50px;
            min-width: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0 8px 8px 0;
        }

        #vivoLoginModal .status-indicator img {
            width: 24px;
            height: 24px;
            filter: brightness(0) invert(1);
        }

        #vivoLoginModal .status-indicator.ok {
            background: #33CC00;
        }

        #vivoLoginModal .status-indicator.erro {
            background: #CC0000;
        }

        #vivoLoginModal .status-indicator.renovando {
            background: #ECD172;
        }

        #vivoLoginModal .status-indicator.neutro {
            background: #A9A9A9;
        }

        #vivoLoginModal .close-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: #f0f0f0;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 24px;
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            z-index: 10;
        }

        #vivoLoginModal .close-btn:hover {
            background: #660099;
            color: white;
            transform: rotate(90deg);
        }

        #vivoLoginModal .footer-info {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }

        #vivoLoginBtn {
            width: 100%;
            max-width: 550px;
            height: 56px;
            background: linear-gradient(135deg, #660099, #7000A8);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 0, 153, 0.3);
            transition: all 0.3s ease;
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
            box-shadow: 0 6px 20px rgba(102, 0, 153, 0.4);
            background: linear-gradient(135deg, #7000A8, #660099);
        }

        #vivoLoginBtn:active {
            transform: translateY(0px);
        }

        @media (max-width: 1200px) {
            #vivoLoginModal .colunas-container {
                grid-template-columns: repeat(3, 1fr);
            }
        }

        @media (max-width: 768px) {
            #vivoLoginModal .colunas-container {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 500px) {
            #vivoLoginModal .colunas-container {
                grid-template-columns: 1fr;
            }
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
            botaoEntrar.parentNode.insertBefore(botao, botaoEntrar);
        }
    }

    function criarModal() {
        const modal = document.createElement('div');
        modal.id = 'vivoLoginModal';
        let colunasHTML = '';

        for (const [cnpj, contas] of Object.entries(contasPorCNPJ)) {
            let contasHTML = '';
                                    contas.forEach((conta, index) => {
                const corFundo = obterCorStatus(conta.nome);
                let statusClasse = 'neutro';
                let statusIcone = 'https://cdn-icons-png.flaticon.com/512/61/61444.png'; // Padrão: interrogação

                if (corFundo === '#33CC00') {
                    statusClasse = 'ok';
                    statusIcone = 'https://cdn-icons-png.flaticon.com/512/33/33281.png'; // Check verde
                } else if (corFundo === '#CC0000') {
                    statusClasse = 'erro';
                    statusIcone = 'https://cdn-icons-png.flaticon.com/512/159/159469.png'; // X vermelho
                } else if (corFundo === '#ECD172') {
                    statusClasse = 'renovando';
                    statusIcone = 'https://cdn-icons-png.flaticon.com/512/61/61444.png'; // Interrogação amarela
                }

                contasHTML += `
                    <div class="conta-item" data-cnpj="${cnpj}" data-index="${index}">
                        <div class="conta-nome">${formatarNomeConta(conta.nome)}</div>
                        <div class="status-indicator ${statusClasse}">
                            <img src="${statusIcone}" alt="Status">
                        </div>
                    </div>
                `;
            });
            colunasHTML += `<div class="coluna"><div class="coluna-titulo">${cnpj}</div>${contasHTML}</div>`;
        }

        modal.innerHTML = `<div class="modal-content"><button class="close-btn" id="closeModal">×</button><h2>Selecione uma Conta</h2><div class="subtitle">Escolha a conta para fazer login no Vivo Gestão</div><div class="colunas-container">${colunasHTML}</div>
                <div class="footer-info">
                    💡 Verde = OK | Amarelo = Renovando | Vermelho = Erro | Cinza = Sem informação
                </div>
            `;

        document.body.appendChild(modal);

        document.querySelectorAll('.conta-item').forEach(item => {
            item.addEventListener('click', function() {
                const cnpj = this.getAttribute('data-cnpj');
                const index = this.getAttribute('data-index');
                preencherLogin(contasPorCNPJ[cnpj][index]);
            });
        });

        document.getElementById('closeModal').addEventListener('click', fecharModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });
    }
        function preencherLogin(conta) {
        const campoUsuario = document.querySelector('input[type="text"]');
        const campoSenha = document.querySelector('input[type="password"]');

        if (campoUsuario && campoSenha) {
            campoUsuario.value = conta.usuario;
            campoSenha.value = conta.senha;

            ['input', 'change'].forEach(evento => {
                campoUsuario.dispatchEvent(new Event(evento, { bubbles: true }));
                campoSenha.dispatchEvent(new Event(evento, { bubbles: true }));
            });

            campoUsuario.style.borderColor = '#660099';
            campoSenha.style.borderColor = '#660099';

            fecharModal();

            setTimeout(() => {
                const botaoEntrar = document.querySelector('#botao_entrar button[type="submit"]') || document.querySelector('button[type="submit"]') || document.querySelector('#botao_entrar');
                if (botaoEntrar) botaoEntrar.click();
                else {
                    const form = campoUsuario.closest('form');
                    if (form) form.submit();
                }
                setTimeout(() => {
                    campoUsuario.style.borderColor = '';
                    campoSenha.style.borderColor = '';
                }, 500);
            }, 300);
        }
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
