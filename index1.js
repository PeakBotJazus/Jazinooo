// --- ОСНОВНЫЕ ПЕРЕМЕННЫЕ ---
let balance = 1000.00;
let bet = 0.50;
const bets = [0.10, 0.50, 1.00, 2.00, 5.00, 10.00];
let betIdx = 1;
let isSpinning = false;
let freeSpins = 0;
let currentBonusWin = 0; // Копилка выигрыша внутри бонусного раунда
let currentGame = null;

// --- КОНФИГУРАЦИЯ ИГР (Символы и их ценность) ---
const gameConfigs = {
    book: { title: "Treasure Book", symbols: [{char:'🤠', val: 500}, {char:'👺', val: 200}, {char:'🪲', val: 75}, {char:'🏺', val: 75}, {char:'A', val: 15}, {char:'K', val: 15}, {char:'Q', val: 10}, {char:'J', val: 10}, {char:'10', val: 10}], scatter: '📖', color: '#784a0e' },
    diamonds: { title: "Double Success", symbols: [{char:'💎', val: 300}, {char:'7️⃣', val: 150}, {char:'🔔', val: 100}, {char:'🍇', val: 50}, {char:'🍒', val: 20}, {char:'🍋', val: 10}], scatter: '⭐', color: '#2b0347' },
    pirate: { title: "Pirate Luck", symbols: [{char:'🏴‍☠️', val: 400}, {char:'💰', val: 200}, {char:'⚔️', val: 100}, {char:'⚓', val: 50}, {char:'🗺️', val: 30}, {char:'🗝️', val: 10}], scatter: '🦜', color: '#064e3b' },
    fruits: { title: "Fruit Blast", symbols: [{char:'🍎', val: 200}, {char:'🍉', val: 100}, {char:'🍓', val: 50}, {char:'🍇', val: 30}, {char:'🍋', val: 15}, {char:'🍒', val: 5}], scatter: '🎁', color: '#1d4ed8' },
    space: { title: "Cosmic Stars", symbols: [{char:'🛸', val: 500}, {char:'🚀', val: 250}, {char:'🪐', val: 100}, {char:'👽', val: 50}, {char:'🌠', val: 20}, {char:'☄️', val: 10}], scatter: '🌌', color: '#1e1b4b' },
    neon: { title: "Neon 777", symbols: [{char:'7️⃣', val: 500}, {char:'💎', val: 200}, {char:'🔔', val: 100}, {char:'🍀', val: 50}, {char:'🍒', val: 20}, {char:'🍋', val: 10}], scatter: '🔥', color: '#7f1d1d' }
};

// --- 10 ВЫИГРЫШНЫХ ЛИНИЙ (Кривые и прямые) ---
const paylines = [
    [5, 6, 7, 8, 9],    // 1: Центральная горизонталь
    [0, 1, 2, 3, 4],    // 2: Верхняя горизонталь
    [10, 11, 12, 13, 14], // 3: Нижняя горизонталь
    [0, 6, 12, 8, 4],   // 4: V-образная
    [10, 6, 2, 8, 14],  // 5: Перевернутая V
    [0, 1, 7, 13, 14],  // 6: Ступенька вниз
    [10, 11, 7, 3, 4],  // 7: Ступенька вверх
    [5, 1, 2, 3, 9],    // 8: Дуга верх
    [5, 11, 12, 13, 9], // 9: Дуга низ
    [0, 6, 7, 8, 4]     // 10: Ломаная линия
];

// --- ИНИЦИАЛИЗАЦИЯ ИНТЕРФЕЙСА ---
function initInterface() {
    const nums = [4, 2, 8, 1, 10, 6, 9, 7, 3, 5]; // Порядок цифр как на фото
    const l = document.getElementById('l-nums');
    const r = document.getElementById('r-nums');
    if (l && r) {
        l.innerHTML = r.innerHTML = nums.map(n => `<div class="lnum">${n}</div>`).join('');
    }
}

function openGame(id) {
    currentGame = gameConfigs[id];
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    document.body.style.background = `radial-gradient(circle, ${currentGame.color} 0%, #000 100%)`;
    initGrid();
    initInterface();
    updateUI();
}

function initGrid() {
    const grid = document.getElementById('slot-grid');
    grid.innerHTML = '';
    for (let i = 0; i < 15; i++) {
        grid.innerHTML += `<div class="cell"><div class="reel-strip" id="s-${i}"><div class="symbol">?</div></div></div>`;
    }
}

function changeBet(v) {
    if (isSpinning || freeSpins > 0) return;
    betIdx = Math.max(0, Math.min(bets.length - 1, betIdx + v));
    bet = bets[betIdx];
    document.getElementById('display-bet').innerText = bet.toFixed(2);
}

// --- ЛОГИКА ВРАЩЕНИЯ ---
function handleSpin() {
    if ((balance < bet && freeSpins === 0) || isSpinning) return;
    
    isSpinning = true;
    if (freeSpins > 0) {
        freeSpins--;
    } else {
        balance -= bet;
    }
    updateUI();

    document.getElementById('spin-btn').disabled = true;
    document.getElementById('status').innerText = "";
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('win-active'));

    const results = [];
    const cellH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-h'));

    for (let i = 0; i < 15; i++) {
        const strip = document.getElementById(`s-${i}`);
        
        // ВЫСОКИЙ ШАНС БОНУСА (30% на каждую ячейку)
        const isScatter = Math.random() > 0.7; 
        const symObj = currentGame.symbols[Math.floor(Math.random() * currentGame.symbols.length)];
        const finalSym = isScatter ? currentGame.scatter : symObj.char;
        results[i] = finalSym;

        let content = '';
        for (let j = 0; j < 25; j++) {
            const s = currentGame.symbols[Math.floor(Math.random() * currentGame.symbols.length)].char;
            content += `<div class="symbol">${j === 0 ? finalSym : s}</div>`;
        }
        strip.innerHTML = content;
        strip.style.transition = 'none';
        strip.style.transform = `translateY(-${24 * cellH}px)`;

        // Задержка остановки для эффекта барабанов
        const columnIndex = i % 5;
        setTimeout(() => {
            strip.style.transition = `transform ${1.2 + columnIndex * 0.2}s cubic-bezier(0.1, 0.9, 0.3, 1.05)`;
            strip.style.transform = 'translateY(0px)';
        }, 50);
    }

    setTimeout(() => { checkWins(results); }, 2400);
}

// --- РАСЧЕТ ВЫИГРЫШЕЙ ---
function checkWins(res) {
    let lineWinTotal = 0;
    const allCells = document.querySelectorAll('.cell');
    const scatterCount = res.filter(s => s === currentGame.scatter).length;

    // Проверка линий
    paylines.forEach(line => {
        let matchCount = 1;
        let firstSym = res[line[0]];
        if (firstSym === currentGame.scatter) return;

        for (let i = 1; i < 5; i++) {
            if (res[line[i]] === firstSym) matchCount++;
            else break;
        }

        if (matchCount >= 3) {
            const symData = currentGame.symbols.find(s => s.char === firstSym);
            const baseVal = symData ? symData.val : 10;
            let countMult = matchCount === 3 ? 1 : (matchCount === 4 ? 5 : 20);
            
            let lineWin = (baseVal / 10) * countMult * bet;
            lineWinTotal += lineWin;
            
            for (let i = 0; i < matchCount; i++) {
                allCells[line[i]].classList.add('win-active');
            }
        }
    });

    // Зачисление выигрыша
    if (lineWinTotal > 0) {
        if (freeSpins > 0 || (scatterCount >= 3 && freeSpins === 0)) {
            currentBonusWin += lineWinTotal;
        } else {
            balance += lineWinTotal;
        }
        document.getElementById('status').innerText = `ВЫИГРЫШ: ${lineWinTotal.toFixed(2)} BYN`;
    }

    // Проверка на бонусные вращения (3+ Скаттера)
    if (scatterCount >= 3 && freeSpins === 0) {
        showModal("ПОЗДРАВЛЯЕМ!", "Вы запустили 10 бонусных вращений!", "Продолжить", startBonusFlow);
        return;
    }

    isSpinning = false;
    updateUI();

    // Если идут фриспины — продолжаем крутить автоматически
    if (freeSpins > 0) {
        setTimeout(handleSpin, 1200);
    } else if (document.getElementById('machine').classList.contains('bonus-active')) {
        // Окно финала бонуски
        showModal("БОНУС ЗАВЕРШЕН!", `Ваш суммарный выигрыш: ${currentBonusWin.toFixed(2)} BYN`, "Забрать", endBonusFlow);
    } else {
        document.getElementById('spin-btn').disabled = false;
    }
}

// --- УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ ---
function showModal(title, text, btnText, callback) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-text').innerText = text;
    const btn = document.getElementById('modal-btn');
    btn.innerText = btnText;
    btn.onclick = () => {
        document.getElementById('modal-overlay').style.display = 'none';
        callback();
    };
    document.getElementById('modal-overlay').style.display = 'flex';
}

function startBonusFlow() {
    freeSpins = 10;
    currentBonusWin = 0;
    document.getElementById('machine').classList.add('bonus-active');
    updateUI();
    handleSpin();
}

function endBonusFlow() {
    balance += currentBonusWin;
    currentBonusWin = 0;
    document.getElementById('machine').classList.remove('bonus-active');
    document.getElementById('spin-btn').disabled = false;
    updateUI();
}

// --- ОБНОВЛЕНИЕ UI ---
function updateUI() {
    document.getElementById('balance').innerText = balance.toFixed(2);
    const fsDisplay = document.getElementById('bonus-info');
    if (freeSpins > 0 || (isSpinning && document.getElementById('machine').classList.contains('bonus-active'))) {
        fsDisplay.style.display = 'block';
        document.getElementById('fs-count').innerText = freeSpins;
        document.getElementById('fs-total-win').innerText = currentBonusWin.toFixed(2);
    } else {
        fsDisplay.style.display = 'none';
    }
}

function exitGame() {
    if (isSpinning || freeSpins > 0) return;
    document.getElementById('lobby').style.display = 'grid';
    document.getElementById('game-screen').style.display = 'none';
    document.body.style.background = '#0f021a';
}

// Инициализация при загрузке скрипта
updateUI();
    // --- ЛОГИКА ВРАЩЕНИЯ С ОБНОВЛЕННЫМ ШАНСОМ ---
    function handleSpin() {
        if (isSpinning || (balance < bet && freeSpins === 0)) return;
        isSpinning = true;
        
        if (freeSpins > 0) freeSpins--;
        else balance -= bet;
        
        updateUI();
        document.getElementById('spin-btn').disabled = true;
        document.getElementById('status').innerText = "";
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('win-active'));

        const results = [];
        const cellH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-h'));

        for (let i = 0; i < 15; i++) {
            const strip = document.getElementById(`s-${i}`);
            
            // ШАНС БОНУСА: 0.96 означает 4% шанса на Scatter в каждой ячейке.
            // Теперь поймать 3 штуки для запуска бонуса будет гораздо сложнее и азартнее.
            const isScatter = Math.random() > 0.96; 
            
            const symObj = currentGame.symbols[Math.floor(Math.random() * currentGame.symbols.length)];
            const finalSym = isScatter ? currentGame.scatter : symObj.char;
            results[i] = finalSym;

            let content = '';
            for (let j = 0; j < 25; j++) {
                const s = currentGame.symbols[Math.floor(Math.random() * currentGame.symbols.length)].char;
                content += `<div class="symbol">${j === 0 ? finalSym : s}</div>`;
            }
            strip.innerHTML = content;
            strip.style.transition = 'none';
            strip.style.transform = `translateY(-${24 * cellH}px)`;

            const col = i % 5;
            setTimeout(() => {
                strip.style.transition = `transform ${1.2 + col * 0.2}s cubic-bezier(0.1, 0.9, 0.3, 1.05)`;
                strip.style.transform = 'translateY(0px)';
            }, 50);
        }
        setTimeout(() => { checkWins(results); }, 2500);
    }
