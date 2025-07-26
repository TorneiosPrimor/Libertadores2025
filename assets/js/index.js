import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBuS_X7qgNMBAQt4zOc0H9djkXFaYvXBTQ",
    authDomain: "torneio-6eee6.firebaseapp.com",
    databaseURL: "https://torneio-6eee6-default-rtdb.firebaseio.com",
    projectId: "torneio-6eee6",
    storageBucket: "torneio-6eee6.appspot.com",
    messagingSenderId: "3656695266",
    appId: "1:3656695266:web:9a8a9ae9b19bbafb09cdbb",
    measurementId: "G-V4MD1PYKL3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Adiciona o evento de clique para fechar o pop-up
const popupCloseButton = document.getElementById('popup-close-button');
if (popupCloseButton) {
    popupCloseButton.addEventListener('click', () => {
        document.getElementById('live-popup-overlay').style.display = 'none';
    });
}

function carregarTudoEmTempoReal() {
    const jogosRef = ref(db, 'jogos');
    const timesRef = ref(db, 'times');

    onValue(jogosRef, (jogosSnapshot) => {
        onValue(timesRef, (timesSnapshot) => {
            if (!jogosSnapshot.exists() || !timesSnapshot.exists()) {
                document.getElementById('loadingMessage').innerText = "Dados não encontrados ou incompletos.";
                return;
            }

            const jogosData = jogosSnapshot.val();
            const timesData = timesSnapshot.val();
            const todosJogos = [];
            for (const fase in jogosData) {
                for (const jogoId in jogosData[fase]) {
                    todosJogos.push({ ...jogosData[fase][jogoId], fase, jogoId });
                }
            }
            const jogosAoVivo = todosJogos.filter(j => j.jogoAndamento);

            // Passa 'timesData' para todas as funções de exibição
            displayJogos(jogosData, jogosAoVivo, timesData);
            displaySuspensos(timesData, jogosData);
            displayClassificacao(timesData, jogosData, jogosAoVivo);
            displayArtilharia(timesData);
            displayCartoes(timesData);

            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('jogosContainer').style.display = 'block';
            document.getElementById('suspensosContainer').style.display = 'block';
            document.getElementById('classificacaoContainer').style.display = 'block';
            document.getElementById('artilhariaContainer').style.display = 'block';
            document.getElementById('cartoesContainer').style.display = 'block';
        });
    });
}

function atualizarPopupAoVivo(jogosAoVivo, timesData) {
    const popupOverlay = document.getElementById('live-popup-overlay');
    const popupDetails = document.getElementById('live-game-details');

    if (jogosAoVivo.length > 0) {
        let html = '';
        jogosAoVivo.forEach((jogo, index) => {
            const timeA_id = jogo.timeA_id || 'a-definir';
            const timeB_id = jogo.timeB_id || 'a-definir';
            const nomeCompletoA = timesData[timeA_id]?.nome || 'A definir';
            const nomeCompletoB = timesData[timeB_id]?.nome || 'A definir';
            const golsA = jogo.estatisticas?.timeA?.golsTotal ?? '0';
            const golsB = jogo.estatisticas?.timeB?.golsTotal ?? '0';

            let placarHtml = `${golsA} x ${golsB}`;
            const penaltis = jogo.estatisticas?.penaltis;
            if (jogo.fase === 'fase_eliminatoria' && penaltis && (penaltis.timeA != null || penaltis.timeB != null)) {
                placarHtml = `${golsA} (${penaltis.timeA ?? 0}) x (${penaltis.timeB ?? 0}) ${golsB}`;
            }

            let artilheiros1 = [];
            if (jogo.estatisticas?.timeA?.gols && jogo.estatisticas.timeA.gols !== 'null') {
                for (const jogadorId in jogo.estatisticas.timeA.gols) {
                    const numGols = jogo.estatisticas.timeA.gols[jogadorId];
                    // --- CORREÇÃO AQUI ---
                    if (numGols > 0) {
                        const nome = timesData[timeA_id]?.jogadores?.[jogadorId]?.nome || 'Desconhecido';
                        artilheiros1.push(`<div style="display: flex; align-items: center; gap: 5px; margin-bottom: 2px;"><img src="assets/icons/bola-icon.svg" alt="Ícone de gol" style="width: 12px; height: 12px; transform: translateY(-.5px);"><span>${nome} ${numGols > 1 ? `(${numGols})` : ''}</span></div>`);
                    }
                }
            }
            if (jogo.estatisticas?.timeA?.golsContra > 0) {
                artilheiros1.push(`<div style="display: flex; align-items: center; gap: 5px; margin-bottom: 2px;"><img src="assets/icons/bola-icon.svg" alt="Ícone de gol" style="width: 12px; height: 12px; transform: translateY(-.5px);"><span>GC ${jogo.estatisticas.timeA.golsContra > 1 ? `(${jogo.estatisticas.timeA.golsContra})` : ''}</span></div>`);
            }
            let artilheiros2 = [];
            if (jogo.estatisticas?.timeB?.gols && jogo.estatisticas.timeB.gols !== 'null') {
                for (const jogadorId in jogo.estatisticas.timeB.gols) {
                    const numGols = jogo.estatisticas.timeB.gols[jogadorId];
                    // --- CORREÇÃO AQUI ---
                    if (numGols > 0) {
                        const nome = timesData[timeB_id]?.jogadores?.[jogadorId]?.nome || 'Desconhecido';
                        artilheiros2.push(`<div style="display: flex; align-items: center; justify-content: flex-end; gap: 5px; margin-bottom: 2px;"><span>${nome} ${numGols > 1 ? `(${numGols})` : ''}</span><img src="assets/icons/bola-icon.svg" alt="Ícone de gol" style="width: 12px; height: 12px; transform: translateY(-.5px);"></div>`);
                    }
                }
            }
            if (jogo.estatisticas?.timeB?.golsContra > 0) {
                artilheiros2.push(`<div style="display: flex; align-items: center; justify-content: flex-end; gap: 5px; margin-bottom: 2px;"><span>GC ${jogo.estatisticas.timeB.golsContra > 1 ? `(${jogo.estatisticas.timeB.golsContra})` : ''}</span><img src="assets/icons/bola-icon.svg" alt="Ícone de gol" style="width: 12px; height: 12px; transform: translateY(-.5px);"></div>`);
            }
            let goalscorersHtml = '';
            if (artilheiros1.length > 0 || artilheiros2.length > 0) {
                 goalscorersHtml = `<div class="goalscorers-popup" style="display: flex; justify-content: space-between; font-size: .8em; margin-top: 1rem; width: 100%;"><div class="teamA-scorers" style="text-align: left; width: 45%;">${artilheiros1.join('')}</div><div class="teamB-scorers" style="text-align: right; width: 45%;">${artilheiros2.join('')}</div></div>`;
            }

            html += `
                <div class="teams" style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 1rem;">
                    <img src="assets/images/${timeA_id}.png" alt="${nomeCompletoA}" style="width: 40px; height: 40px; object-fit: contain;">
                    <span style="font-size: 1.2em; font-weight: bold;">vs</span>
                    <img src="assets/images/${timeB_id}.png" alt="${nomeCompletoB}" style="width: 40px; height: 40px; object-fit: contain;">
                </div>
                <div class="score">${placarHtml}</div>
                ${goalscorersHtml}
            `;
            if (index < jogosAoVivo.length - 1) {
                html += '<hr style="margin-top: 15px;">';
            }
        });
        popupDetails.innerHTML = html;
        popupOverlay.style.display = 'flex';
    } else {
        popupOverlay.style.display = 'none';
    }
}

function getDiaDaSemana(dataStr) {
    if (!dataStr) return '';
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = new Date(dataStr + 'T12:00:00');
    return dias[data.getDay()];
}

function displayJogos(jogosData, jogosAoVivo, timesData) {
    const primeiraFaseContainer = document.getElementById('jogosPrimeiraFase');
    const eliminatoriasContainer = document.getElementById('jogosEliminatorias');
    let todosJogos = [];
    for (const fase in jogosData) {
        for (const jogoId in jogosData[fase]) {
            todosJogos.push({ ...jogosData[fase][jogoId], fase, jogoId });
        }
    }

    // --- LÓGICA DE ORDENAÇÃO ATUALIZADA AQUI ---
    todosJogos.sort((a, b) => {
        // Converte o status 'jogoAndamento' para um número (true=1, false=0)
        const liveA = a.jogoAndamento ? 1 : 0;
        const liveB = b.jogoAndamento ? 1 : 0;

        // 1. Critério primário: Jogo em andamento (ordem decrescente, para que 1 venha antes de 0)
        if (liveA !== liveB) {
            return liveB - liveA;
        }

        // 2. Critério secundário: Data do jogo (ordem cronológica crescente)
        return new Date(a.data) - new Date(b.data);
    });
    
    const jogosPrimeiraFase = todosJogos.filter(j => j.fase === 'fase1');
    const jogosEliminatorias = todosJogos.filter(j => j.fase === 'fase_eliminatoria');

    const renderTabelaJogos = (jogos, container, tituloFase) => {
        let tituloHtml = '';
        if (jogos.length > 0 && tituloFase) {
            tituloHtml = `<h2 class="artilharia">${tituloFase}</h2>`;
        }

        if (jogos.length === 0) {
            container.innerHTML = ""; // Modificado para não mostrar nada se não houver jogos
            return;
        }

        const tabelaHTML = jogos.map((jogo, index) => {
            const placarA_raw = jogo.estatisticas?.timeA?.golsTotal;
            const placarB_raw = jogo.estatisticas?.timeB?.golsTotal;
            let placarA = (placarA_raw == null || placarA_raw === 'null') ? '' : placarA_raw;
            let placarB = (placarB_raw == null || placarB_raw === 'null') ? '' : placarB_raw;
            
            const penaltis = jogo.estatisticas?.penaltis;
            if (jogo.fase === 'fase_eliminatoria' && (jogo.jogoAndamento || jogo.jogoEncerrado) && penaltis && (penaltis.timeA != null || penaltis.timeB != null)) {
                placarA += ` <span style="font-size:0.9em; color: #ccc;">(${penaltis.timeA ?? 0})</span>`;
                placarB = `<span style="font-size:0.9em; color: #ccc;">(${penaltis.timeB ?? 0})</span> ${placarB}`;
            }

            let tituloHtml = '';
            if (jogo.fase === 'fase_eliminatoria') {
                const nomeDoJogo = jogo.nome || `Eliminatória Jogo ${index + 1}`;
                tituloHtml = `
                    <tr class="titulo-jogo-eliminatorio">
                        <td colspan="7" style="text-align: center; padding: 10px 0; color: #ddd; text-transform: uppercase; font-size: 1.1em; font-weight: bold;">
                            ${nomeDoJogo}
                        </td>
                    </tr>
                `;
            }

            const timeA_id = jogo.timeA_id || 'a-definir';
            const timeB_id = jogo.timeB_id || 'a-definir';
            const nomeExibicaoA = timesData[timeA_id]?.abreviacao || timesData[timeA_id]?.nome || 'A definir';
            const nomeExibicaoB = timesData[timeB_id]?.abreviacao || timesData[timeB_id]?.nome || 'A definir';
            const nomeCompletoA = timesData[timeA_id]?.nome || 'A definir';
            const nomeCompletoB = timesData[timeB_id]?.nome || 'A definir';
            const dia = getDiaDaSemana(jogo.data);
            const iconHtml = jogo.jogoAndamento ? `<span class="live-indicator"></span>` : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M284.3 11.7c-15.6-15.6-40.9-15.6-56.6 0l-216 216c-15.6 15.6-15.6 40.9 0 56.6l216 216c15.6 15.6 40.9 15.6 56.6 0l216-216c15.6-15.6-15.6-40.9 0-56.6l-216-216z"/></svg>`;
            const placarClass = jogo.jogoAndamento ? 'class="live-update"' : '';

            let artilheiros1 = [];
            if (jogo.estatisticas?.timeA?.gols && jogo.estatisticas.timeA.gols !== 'null') {
                for (const jogadorId in jogo.estatisticas.timeA.gols) {
                    const numGols = jogo.estatisticas.timeA.gols[jogadorId];
                    if (numGols > 0) {
                        const nome = timesData[timeA_id]?.jogadores?.[jogadorId]?.nome || 'Desconhecido';
                        artilheiros1.push(`${nome} ${numGols > 1 ? `(${numGols})` : ''}`);
                    }
                }
            }
            if (jogo.estatisticas?.timeA?.golsContra > 0) {
                artilheiros1.push(`GC ${jogo.estatisticas.timeA.golsContra > 1 ? `(${jogo.estatisticas.timeA.golsContra})` : ''}`);
            }
            let artilheiros2 = [];
            if (jogo.estatisticas?.timeB?.gols && jogo.estatisticas.timeB.gols !== 'null') {
                for (const jogadorId in jogo.estatisticas.timeB.gols) {
                    const numGols = jogo.estatisticas.timeB.gols[jogadorId];
                    if (numGols > 0) {
                        const nome = timesData[timeB_id]?.jogadores?.[jogadorId]?.nome || 'Desconhecido';
                        artilheiros2.push(`${nome} ${numGols > 1 ? `(${numGols})` : ''}`);
                    }
                }
            }
            if (jogo.estatisticas?.timeB?.golsContra > 0) {
                artilheiros2.push(`GC ${jogo.estatisticas.timeB.golsContra > 1 ? `(${jogo.estatisticas.timeB.golsContra})` : ''}`);
            }
            let goalscorersRow = '';
            if ((artilheiros1.length > 0 || artilheiros2.length > 0) && (jogo.jogoAndamento || jogo.jogoEncerrado)) {
                goalscorersRow = `<tr><td></td><td class="golTime1" colspan="2">${artilheiros1.join('<br>')}</td><td></td><td class="golTime2" colspan="2">${artilheiros2.join('<br>')}</td><td></td></tr>`;
            }
            
            const separadorHtml = `<tr class="separador-jogo"><td colspan="7"><img src="assets/images/efeito-1.png" alt="Separador de jogo"></td></tr>`;
            
            const jogoHtml = `
                <tr class="dataHora">
                    <td></td>
                    <td class="imgDataHora"><img src="assets/icons/Calendar.svg" alt="">${formatarData(jogo.data)} <strong>|</strong> ${dia}</td>
                    <td></td>
                    <td class="losango">${iconHtml}</td>
                    <td></td>
                    <td class="imgDataHora"><img src="assets/icons/Clock.svg" alt="">${jogo.hora || 'A definir'}</td>
                    <td></td>
                </tr>
                <tr class="resultado">
                    <td class="imgLeft"><img src="assets/images/${timeA_id}.png" alt="${nomeCompletoA}"></td>
                    <td>${nomeExibicaoA}</td>
                    <td ${placarClass}>${placarA}</td>
                    <td>x</td>
                    <td ${placarClass}>${placarB}</td>
                    <td>${nomeExibicaoB}</td>
                    <td class="imgRight"><img src="assets/images/${timeB_id}.png" alt="${nomeCompletoB}"></td>
                </tr>
                ${goalscorersRow}`;
            
            return separadorHtml + tituloHtml + jogoHtml;

        }).join('');

        let finalHtml = tabelaHTML;
        if (finalHtml.startsWith('<tr class="separador-jogo">')) {
            finalHtml = finalHtml.substring(finalHtml.indexOf('</tr>') + 5);
        }

        const separadorFinal = jogos.length > 0 ? `<tr class="separador-jogo"><td colspan="7"><img src="assets/images/efeito-1.png" alt="Separador de jogo"></td></tr>` : '';

        container.innerHTML = `${tituloHtml}<table><tbody>${finalHtml}${separadorFinal}</tbody></table>`;
    };

    renderTabelaJogos(jogosPrimeiraFase, primeiraFaseContainer, "Fase de Grupos");
    renderTabelaJogos(jogosEliminatorias, eliminatoriasContainer, "Eliminatórias");
    atualizarPopupAoVivo(jogosAoVivo, timesData);
}

function displayClassificacao(timesData, jogosData, jogosAoVivo) {
    const container = document.getElementById('classificacao');
    let statsBase = {};

    for (const timeId in timesData) {
        statsBase[timeId] = { id: timeId, nome: timesData[timeId].nome, P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0 };
    }

    if (jogosData.fase1) {
        for (const jogoId in jogosData.fase1) {
            const jogo = jogosData.fase1[jogoId];
            if (!jogo.jogoEncerrado || !jogo.estatisticas) continue;
            const { timeA_id, timeB_id } = jogo;
            const golsA = parseInt(jogo.estatisticas?.timeA?.golsTotal) || 0;
            const golsB = parseInt(jogo.estatisticas?.timeB?.golsTotal) || 0;
            if (!statsBase[timeA_id] || !statsBase[timeB_id]) continue;
            statsBase[timeA_id].J++; statsBase[timeB_id].J++;
            statsBase[timeA_id].GP += golsA; statsBase[timeB_id].GP += golsB;
            statsBase[timeA_id].GC += golsB; statsBase[timeB_id].GC += golsA;
            if (golsA > golsB) { statsBase[timeA_id].V++; statsBase[timeA_id].P += 3; statsBase[timeB_id].D++; }
            else if (golsB > golsA) { statsBase[timeB_id].V++; statsBase[timeB_id].P += 3; statsBase[timeA_id].D++; }
            else { statsBase[timeA_id].E++; statsBase[timeB_id].E++; statsBase[timeA_id].P++; statsBase[timeB_id].P++; }
        }
    }

    // Objeto para rastrear qual foi o resultado parcial (V, E, D) de um time durante o jogo ao vivo
    const resultadosAoVivo = {};

    let statsAoVivo = JSON.parse(JSON.stringify(statsBase));
    const timesJogando = [];
    jogosAoVivo.forEach(jogo => {
        if (jogo.fase !== 'fase1' || !jogo.estatisticas) return;
        const { timeA_id, timeB_id } = jogo;
        timesJogando.push(timeA_id, timeB_id);
        const golsA = parseInt(jogo.estatisticas?.timeA?.golsTotal) || 0;
        const golsB = parseInt(jogo.estatisticas?.timeB?.golsTotal) || 0;
        if (!statsAoVivo[timeA_id] || !statsAoVivo[timeB_id]) return;
        statsAoVivo[timeA_id].J++; statsAoVivo[timeB_id].J++;
        statsAoVivo[timeA_id].GP += golsA; statsAoVivo[timeB_id].GP += golsB;
        statsAoVivo[timeA_id].GC += golsB; statsAoVivo[timeB_id].GC += golsA;
        
        if (golsA > golsB) {
            statsAoVivo[timeA_id].V++; 
            statsAoVivo[timeA_id].P += 3; 
            statsAoVivo[timeB_id].D++;
            resultadosAoVivo[timeA_id] = 'V';
            resultadosAoVivo[timeB_id] = 'D';
        } else if (golsB > golsA) {
            statsAoVivo[timeB_id].V++; 
            statsAoVivo[timeB_id].P += 3; 
            statsAoVivo[timeA_id].D++;
            resultadosAoVivo[timeB_id] = 'V';
            resultadosAoVivo[timeA_id] = 'D';
        } else {
            statsAoVivo[timeA_id].E++; 
            statsAoVivo[timeB_id].E++; 
            statsAoVivo[timeA_id].P++; 
            statsAoVivo[timeB_id].P++;
            resultadosAoVivo[timeA_id] = 'E';
            resultadosAoVivo[timeB_id] = 'E';
        }
    });

    const classificacaoFinal = Object.values(statsAoVivo).map(time => {
        time.SG = time.GP - time.GC;
        return time;
    });
    classificacaoFinal.sort((a, b) => b.P - a.P || b.V - a.V || b.SG - a.SG || b.GP - a.GP);

    let html = `
        <h2 class="artilharia">Classificação 🏆</h2>
        <table>
        <thead>
            <tr>
                <th></th>
                <th>#</th>
                <th style="text-align: left;">Time</th> 
                <th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>Pts</th>
            </tr>
        </thead>
        <tbody>`;
    
    classificacaoFinal.forEach((time, index) => {
        const isPlaying = timesJogando.includes(time.id);
        
        // --- LÓGICA DE CLASSES ATUALIZADA AQUI ---
        const jClass = isPlaying ? 'class="live-update"' : '';
        const vClass = isPlaying && resultadosAoVivo[time.id] === 'V' ? 'class="live-update"' : '';
        const eClass = isPlaying && resultadosAoVivo[time.id] === 'E' ? 'class="live-update"' : '';
        const dClass = isPlaying && resultadosAoVivo[time.id] === 'D' ? 'class="live-update"' : '';
        const pClass = isPlaying ? 'class="live-update col-pontos"' : 'class="col-pontos"';
        
        let tagStyle = '';
        if (index < 4) {
            tagStyle = 'style="border-right: 2px solid green;"';
        } else {
            tagStyle = 'style="border-right: 2px solid red;"';
        }

        html += `
            <tr>
                <td class="tags" ${tagStyle}></td>
                <td>${index + 1}</td>
                <td class="classificacao-time-cell">
                    <img src="assets/images/${time.id}.png" alt="${time.nome}">
                    <span class="team-name-desktop">${time.nome}</span>
                </td>
                <td ${jClass}>${time.J}</td>
                <td ${vClass}>${time.V}</td>
                <td ${eClass}>${time.E}</td>
                <td ${dClass}>${time.D}</td>
                <td>${time.GP}</td>
                <td>${time.GC}</td>
                <td>${time.SG}</td>
                <td ${pClass}>${time.P}</td>
            </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function formatarData(dataStr) { if (!dataStr) return 'A definir'; const [ano, mes, dia] = dataStr.split('-'); return `${dia}/${mes}`; }

function displaySuspensos(timesData, jogosData) {
    const container = document.getElementById('suspensos'); // ID do container de suspensos
    let todosJogos = [];
    for (const fase in jogosData) { for (const jogoId in jogosData[fase]) { todosJogos.push({ ...jogosData[fase][jogoId], jogoId }); } }
    todosJogos.sort((a, b) => new Date(a.data) - new Date(b.data));
    
    let suspensosAtivos = [];
    for (const timeId in timesData) {
        const time = timesData[timeId];
        if (!time.jogadores) continue;
        for (const jogadorId in time.jogadores) {
            const jogador = time.jogadores[jogadorId];
            if (jogador.suspenso && jogador.suspensoNoJogoId) {
                const indiceJogoPunicao = todosJogos.findIndex(j => j.jogoId === jogador.suspensoNoJogoId);
                if (indiceJogoPunicao !== -1) {
                    for (let i = indiceJogoPunicao + 1; i < todosJogos.length; i++) {
                        const proximoJogo = todosJogos[i];
                        if (proximoJogo.timeA_id === timeId || proximoJogo.timeB_id === timeId) {
                            suspensosAtivos.push({ nome: jogador.nome, timeId: timeId, proximoJogo });
                            break;
                        }
                    }
                }
            }
        }
    }
    
    if (suspensosAtivos.length === 0) { 
        container.innerHTML = "<h2 class='artilharia'><strong>Suspensões</strong></h2><p>Nenhum jogador suspenso no momento.</p>"; 
        return; 
    }
    
    const tabelaHTML = suspensosAtivos.map(s => {
        const adversarioId = s.proximoJogo.timeA_id === s.timeId ? s.proximoJogo.timeB_id : s.proximoJogo.timeA_id;
        const nomeAdversario = timesData[adversarioId]?.nome || 'A definir';
        const dataJogo = formatarData(s.proximoJogo.data); // Usando a formatação DD/MM

        return `
            <tr class="tableArtilharia">
                <td class="imgArtilharia"><img src="assets/images/${s.timeId}.png" alt=""></td>
                <td class="nomeArtilharia">${s.nome}</td>
                <td>vs ${nomeAdversario} (${dataJogo})</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <h2 class="artilharia"><strong>Suspensões</strong></h2>
        <table>
            <thead>
                <tr>
                    <th style="text-align: left;">Time</th>
                    <th>Jogador</th>
                    <th>Cumpre em</th>
                </tr>
            </thead>
            <tbody>
                ${tabelaHTML}
            </tbody>
        </table>
        <h5 style="margin-top: 1rem; text-align: center;"><i>Jogadores cumprirão <br> suspensão de 1 partida</i></h5>
    `;
}

function displayArtilharia(timesData) {
    const container = document.getElementById('artilharia'); // Certifique-se que o ID no HTML é 'artilharia'
    let artilheiros = [];

    for (const timeId in timesData) {
        if (!timesData[timeId].jogadores) continue;
        for (const jogadorId in timesData[timeId].jogadores) {
            const jogador = timesData[timeId].jogadores[jogadorId];
            if (jogador.gols > 0) {
                // Adicionamos o timeId para poder montar a URL da imagem
                artilheiros.push({
                    nome: jogador.nome,
                    timeId: timeId,
                    gols: jogador.gols
                });
            }
        }
    }

    artilheiros.sort((a, b) => b.gols - a.gols);

    const tabelaHTML = artilheiros.map((artilheiro, index) => `
        <tr class="tableArtilharia">
            <td>${index + 1}</td>
            <td class="imgArtilharia"><img src="assets/images/${artilheiro.timeId}.png" alt=""></td>
            <td class="nomeArtilharia">${artilheiro.nome}</td>
            <td>${artilheiro.gols}</td>
        </tr>
    `).join('');

    // Monta o HTML final com o cabeçalho e o corpo da tabela
    container.innerHTML = `
        <h2 class="artilharia"><strong>Artilharia</strong></h2>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th></th>
                    <th>Jogador</th>
                    <th>Gols</th>
                </tr>
            </thead>
            <tbody>
                ${tabelaHTML}
            </tbody>
        </table>
    `;
}

function displayCartoes(timesData) {
    const jogadoresContainer = document.getElementById('cartoesJogadores');
    const timesContainer = document.getElementById('cartoesTimes');
    let jogadoresComCartoes = [];
    let timesComCartoes = [];

    for (const timeId in timesData) {
        const time = timesData[timeId];
        const nomeTime = time.nome || timeId;

        // Processa jogadores (lógica inalterada)
        if (time.jogadores) {
            for (const jogadorId in time.jogadores) {
                const jogador = time.jogadores[jogadorId];
                const ca = jogador.cartoesAmarelos || 0;
                const cv = jogador.cartoesVermelhos || 0;
                if (ca > 0 || cv > 0) {
                    jogadoresComCartoes.push({
                        nome: jogador.nome,
                        timeId: timeId,
                        amarelos: ca,
                        vermelhos: cv
                    });
                }
            }
        }
        
        // --- LÓGICA CORRIGIDA PARA OS TIMES ---
        // Pega os cartões do time, usando 0 como padrão se não existirem
        const caTime = time.estatisticas?.cartoesAmarelos || 0;
        const cvTime = time.estatisticas?.cartoesVermelhos || 0;

        // Adiciona o time à lista INCONDICIONALMENTE
        timesComCartoes.push({
            nome: nomeTime,
            timeId: timeId,
            amarelos: caTime,
            vermelhos: cvTime
        });
    }
    
    // Ordenação (lógica inalterada)
    jogadoresComCartoes.sort((a, b) => b.vermelhos - a.vermelhos || b.amarelos - a.amarelos);
    timesComCartoes.sort((a, b) => b.vermelhos - a.vermelhos || b.amarelos - a.amarelos);
    
    // --- HTML para Cartões de Jogadores (lógica inalterada) ---
    const tabelaJogadoresHTML = jogadoresComCartoes.map((j) => `
        <tr class="tableArtilharia">
            <td class="imgArtilharia"><img src="assets/images/${j.timeId}.png" alt=""></td>
            <td class="nomeArtilharia">${j.nome}</td>
            <td>${j.amarelos}</td>
            <td>${j.vermelhos}</td>
        </tr>
    `).join('');

    jogadoresContainer.innerHTML = `
        <h2 class="artilharia"><strong>Cartões (Jogadores)</strong></h2>
        <table>
            <thead>
                <tr>
                    <th style="text-align: left;">Time</th>
                    <th>Jogador</th>
                    <th><div style="background: yellow;" class="cartao"></div></th>
                    <th><div style="background: red;" class="cartao"></div></th>
                </tr>
            </thead>
            <tbody>
                ${tabelaJogadoresHTML}
            </tbody>
        </table>
    `;

    // --- HTML para Cartões de Times (lógica inalterada) ---
    const tabelaTimesHTML = timesComCartoes.map((t) => `
        <tr class="tableArtilharia">
            <td class="imgArtilharia"><img src="assets/images/${t.timeId}.png" alt=""></td>
            <td class="nomeArtilharia">${t.nome}</td>
            <td>${t.amarelos}</td>
            <td>${t.vermelhos}</td>
        </tr>
    `).join('');

    timesContainer.innerHTML = `
         <h2 class="artilharia"><strong>Cartões (Times)</strong></h2>
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Time</th>
                    <th><div style="background: yellow;" class="cartao"></div></th>
                    <th><div style="background: red;" class="cartao"></div></th>
                </tr>
            </thead>
            <tbody>
                ${tabelaTimesHTML}
            </tbody>
        </table>
    `;
}

function configurarBotoesDeNavegacao() {
    // Lista de IDs dos botões e das seções correspondentes
    const links = [
        { buttonId: 'buttonPartidas', sectionId: 'jogosContainer' },
        { buttonId: 'buttonEliminatorias', sectionId: 'jogosEliminatorias' },
        { buttonId: 'buttonClassificacao', sectionId: 'classificacaoContainer' }
    ];

    links.forEach(link => {
        const button = document.getElementById(link.buttonId);
        const section = document.getElementById(link.sectionId);

        if (button && section) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const yOffset = -80;
                const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            });
        }
    });
}

configurarBotoesDeNavegacao();
carregarTudoEmTempoReal();
