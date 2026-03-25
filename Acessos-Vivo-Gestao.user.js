// ==UserScript==
// @name         Vivo Gestão - Acessos
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Modal com 5 colunas + Status colorido - Senhas em localStorage
// @author       Você
// @match        https://vivogestao.vivoempresas.com.br/Portal/*
// @updateURL    https://raw.githubusercontent.com/Videljr/acesso-vivo-gestao-script/main/Acessos-Vivo-Gestao.user.js
// @downloadURL  https://raw.githubusercontent.com/Videljr/acesso-vivo-gestao-script/main/Acessos-Vivo-Gestao.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // URL DA PLANILHA PUBLICADA
    const PLANILHA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBP7xcGcd3_-ZRJTMzL8nV4ZNRat4idK_lDMFoDi-5aZwXXD_5LhW4xzqhpwCaM0YsJn_VdnO4uDNe/pub?gid=930179876&single=true&output=csv';

    // CHAVE PARA SALVAR NO LOCALSTORAGE
    const STORAGE_KEY = 'vivoGestaoContas';

    // Configuração padrão (vazia) - será preenchida pelo usuário
    const CONFIG_PADRAO = {
        "NALDO SAT": [],
        "STUDIO MATHEUS": [],
        "F DE ASSIS": [],
        "CONNECTA": [],
        "CN ENGENHARIA": []
    };

    // Objeto para armazenar o status das contas
    let statusDasContas = {};

    // Carregar contas do localStorage
    function carregarContas() {
        try {
            const dados = localStorage.getItem(STORAGE_KEY);
            if (dados) {
                return JSON.parse(dados);
            }
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
        }
        return CONFIG_PADRAO;
    }

    // Salvar contas no localStorage
    function salvarContas(contas) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(contas));
            console.log('✅ Contas salvas com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar contas:', error);
            return false;
        }
    }

    // Contas carregadas do localStorage
    let contasPorCNPJ = carregarContas();

    // Função para buscar status da planilha (Coluna H)
    async function buscarStatusContas() {
        try {
            const response = await fetch(PLANILHA_URL);
            const csvText = await response.text();

            const linhas = csvText.split('\n');

            let dataReferencia = '';
            if (linhas[1]) {
                const colunas = linhas[1].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                dataReferencia = colunas[1]?.trim().replace(/"/g, '');
            }

            console.log('📅 Data de referência da planilha:', dataReferencia);

            for (let i = 0; i < linhas.length; i++) {
                const linha = linhas[i];
                if (!linha.trim()) continue;

                const colunas = linha.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];

                const conta = colunas[2]?.trim().replace(/"/g, '');
                const status = colunas[7]?.trim().replace(/"/g, '').toUpperCase();

                if (conta && /^\d{10}$/.test(conta)) {
                    let cor = '#A9A9A9';

                    if (status === 'OK') {
                        cor = '#33CC00';
                    } else if (status && (status.includes('ERROR ASSINCRONO') ||
                               status.includes('ESPELHAMENTO') ||
                               status.includes('MULTIPLOS ERROS'))) {
                        cor = '#CC0000';
                    }

                    statusDasContas[conta] = cor;
                }
            }

            console.log('✅ Status das contas carregados:', statusDasContas);
            console.log('📊 Total de contas encontradas:', Object.keys(statusDasContas).length);
        } catch (error) {
            console.error('❌ Erro ao buscar status:', error);
        }
    }
    const estilos = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            #vivoLoginModal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 999999; font-family: 'Inter', sans-serif; animation: fadeIn 0.3s ease; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            #vivoLoginModal .modal-content { background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%); border-radius: 20px; padding: 40px; max-width: 1400px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4); animation: slideUp 0.4s ease; }
            #vivoLoginModal h2 { margin: 0 0 10px 0; color: #660099; font-size: 32px; font-weight: 700; text-align: center; font-family: 'Inter', sans-serif; }
            #vivoLoginModal .subtitle { text-align: center; color: #666; margin-bottom: 35px; font-size: 15px; font-family: 'Inter', sans-serif; font-weight: 400; }
            #vivoLoginModal .colunas-container { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; margin-bottom: 25px; }
            #vivoLoginModal .coluna { background: white; border-radius: 15px; padding: 20px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); }
            #vivoLoginModal .coluna-titulo { font-weight: 700; font-size: 15px; color: #660099; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 3px solid #660099; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Inter', sans-serif; }
            #vivoLoginModal .conta-item { border-radius: 10px; padding: 14px; margin-bottom: 10px; cursor: pointer; transition: all 0.25s ease; position: relative; overflow: hidden; text-align: center; border: 2px solid transparent; }
            #vivoLoginModal .conta-item:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2); filter: brightness(0.95); }
            #vivoLoginModal .conta-item:active { transform: translateY(-1px) scale(0.98); }
            #vivoLoginModal .conta-nome { font-size: 14px; color: white; position: relative; z-index: 1; font-family: 'Inter', sans-serif; font-weight: 400; letter-spacing: 0.3px; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); }
            #vivoLoginModal .conta-nome .bold { font-weight: 700; }
            #vivoLoginModal .close-btn { position: absolute; top: 20px; right: 20px; background: #f0f0f0; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 24px; color: #666; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; z-index: 10; font-family: 'Inter', sans-serif; }
            #vivoLoginModal .close-btn:hover { background: #660099; color: white; transform: rotate(90deg); }
            #vivoLoginModal .footer-info { text-align: center; color: #999; font-size: 12px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-family: 'Inter', sans-serif; font-weight: 400; }
            #vivoLoginModal .config-btn { background: #666; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-top: 10px; transition: all 0.3s ease; }
            #vivoLoginModal .config-btn:hover { background: #555; }
            #vivoLoginModal .empty-state { text-align: center; padding: 40px; color: #999; }
            #vivoLoginModal .empty-state h3 { color: #660099; margin-bottom: 10px; }
            #vivoLoginBtn { width: 100%; max-width: 550px; height: 56px; background: linear-gradient(135deg, #660099, #7000A8); border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 0, 153, 0.3); transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 600; color: white; font-family: 'Inter', sans-serif; margin: 20px auto; letter-spacing: 0.3px; }
            #vivoLoginBtn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 0, 153, 0.4); background: linear-gradient(135deg, #7000A8, #660099); }
            #vivoLoginBtn:active { transform: translateY(0px); }
            @media (max-width: 1200px) { #vivoLoginModal .colunas-container { grid-template-columns: repeat(3, 1fr); } }
            @media (max-width: 768px) { #vivoLoginModal .colunas-container { grid-template-columns: repeat(2, 1fr); } }
            @media (max-width: 500px) { #vivoLoginModal .colunas-container { grid-template-columns: 1fr; } }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', estilos);

    function formatarNomeConta(nome) {
        if (nome.length >= 4) {
            const inicio = nome.slice(0, -4);
            const ultimos4 = nome.slice(-4);
            return `${inicio}<span class="bold">${ultimos4}</span>`;
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

            botao.addEventListener('click', function(e) {
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

        // Recarregar contas do localStorage
        contasPorCNPJ = carregarContas();

        // Verificar se há contas configuradas
        const temContas = Object.values(contasPorCNPJ).some(arr => arr.length > 0);

        let conteudoHTML = '';

        if (!temContas) {
            conteudoHTML = `
                <div class="empty-state">
                    <h3>⚠️ Nenhuma conta configurada</h3>
                    <p>Clique no botão abaixo para configurar suas contas de acesso.</p>
                    <button class="config-btn" id="btnConfigurar" style="font-size: 14px; padding: 12px 24px; margin-top: 20px;">⚙️ Configurar Contas</button>
                </div>
            `;
        } else {
            let colunasHTML = '';

            for (const [cnpj, contas] of Object.entries(contasPorCNPJ)) {
                if (contas.length === 0) continue;

                let contasHTML = '';

                contas.forEach((conta, index) => {
                    const corFundo = obterCorStatus(conta.nome);
                    contasHTML += `
                        <div class="conta-item" data-cnpj="${cnpj}" data-index="${index}" style="background-color: ${corFundo};">
                            <div class="conta-nome">${formatarNomeConta(conta.nome)}</div>
                        </div>
                    `;
                });

                colunasHTML += `
                    <div class="coluna">
                        <div class="coluna-titulo">${cnpj}</div>
                        ${contasHTML}
                    </div>
                `;
            }

            conteudoHTML = `
                <div class="colunas-container">${colunasHTML}</div>
                <div class="footer-info">
                    💡 Verde = OK | Vermelho = Erro | Cinza = Sem informação
                    <br>
                    <button class="config-btn" id="btnConfigurar">⚙️ Configurar Contas</button>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-btn" id="closeModal">×</button>
                <h2>Selecione uma Conta</h2>
                <div class="subtitle">Escolha a conta para fazer login no Vivo Gestão</div>
                ${conteudoHTML}
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

        const btnConfig = document.getElementById('btnConfigurar');
        if (btnConfig) {
            btnConfig.addEventListener('click', abrirConfiguracao);
        }
    }

    function abrirConfiguracao() {
        const config = prompt(
            '🔧 CONFIGURAÇÃO DE CONTAS\n\n' +
            'Cole aqui o JSON com suas contas no formato:\n\n' +
            '{\n' +
            '  "NALDO SAT": [\n' +
            '    {"nome": "0455828133", "usuario": "0455828133", "senha": "0455828133"}\n' +
            '  ],\n' +
            '  "STUDIO MATHEUS": [...]\n' +
            '}\n\n' +
            'Contas atuais:\n' +
            JSON.stringify(contasPorCNPJ, null, 2)
        );

        if (config) {
            try {
                const novasContas = JSON.parse(config);
                if (salvarContas(novasContas)) {
                    alert('✅ Contas salvas com sucesso!\n\nRecarregue o modal para ver as mudanças.');
                    fecharModal();
                }
            } catch (error) {
                alert('❌ Erro ao salvar contas!\n\nVerifique se o JSON está correto.\n\n' + error.message);
            }
        }
    }

    function preencherLogin(conta) {
        const campoUsuario = document.querySelector('input[type="text"]');
        const campoSenha = document.querySelector('input[type="password"]');

        if (campoUsuario && campoSenha) {
            campoUsuario.value = conta.usuario;
            campoSenha.value = conta.senha;

            campoUsuario.dispatchEvent(new Event('input', { bubbles: true }));
            campoSenha.dispatchEvent(new Event('input', { bubbles: true }));
            campoUsuario.dispatchEvent(new Event('change', { bubbles: true }));
            campoSenha.dispatchEvent(new Event('change', { bubbles: true }));

            campoUsuario.style.transition = 'border-color 0.3s ease';
            campoSenha.style.transition = 'border-color 0.3s ease';
            campoUsuario.style.borderColor = '#660099';
            campoSenha.style.borderColor = '#660099';

            fecharModal();

            setTimeout(() => {
                const botaoEntrar = document.querySelector('#botao_entrar button[type="submit"]') ||
                                   document.querySelector('button[type="submit"]') ||
                                   document.querySelector('#botao_entrar');

                if (botaoEntrar) {
                    botaoEntrar.click();
                } else {
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
        const campoUsuario = document.querySelector('input[type="text"]');
        const campoSenha = document.querySelector('input[type="password"]');
        const botaoEntrar = document.querySelector('#botao_entrar') || document.querySelector('button[type="submit"]');
        return campoUsuario && campoSenha && botaoEntrar;
    }

    async function inicializar() {
        await buscarStatusContas();

        if (estaNaPaginaDeLogin()) {
            criarBotaoFlutuante();
        }
    }

    const observador = new MutationObserver(function() {
        if (estaNaPaginaDeLogin() && !document.getElementById('vivoLoginBtn')) {
            inicializar();
        }
    });

    window.addEventListener('load', function() {
        inicializar();

        observador.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(function() {
                if (estaNaPaginaDeLogin() && !document.getElementById('vivoLoginBtn')) {
                    inicializar();
                }
            }, 500);
        }
    });

    setInterval(function() {
        if (estaNaPaginaDeLogin() && !document.getElementById('vivoLoginBtn')) {
            inicializar();
        }
    }, 2000);

})();
