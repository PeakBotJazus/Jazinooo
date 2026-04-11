let balance = 1000.00;
let bet = 1.00;
const betSteps = [0.2, 1, 5, 10, 20, 50, 100];
let betIdx = 1;
let currentGame = null;
let freeSpins = 0;

const gameConfigs = {
    diamonds: { 
        title: "Double Success", 
        symbols: ['💎','💎','🔔','🍒','🍇','🍋','🍊','7️⃣'], 
        scatter: '⭐', 
        color: '#4a0e78',
        bg: 'radial-gradient(circle, #2b0347 0%, #000000 100%)',
        icon: '💎' 
    },
    fruits: { 
        title: "Fruit Blast", 
        symbols: ['🍎','🍎','🍇','🍉','🍓','🍋','🍍','🍒'], 
        scatter: '🎁', 
        color: '#1d4ed8',
        bg: 'radial-gradient(circle, #1e3a8a 0%, #000000 100%)',
        icon: '🍎'
    },
    pirate: { 
        title: "Pirate Luck", 
        symbols: ['⚓','⚓','⚔️','🏴‍☠️','💰','🗺️','📦','🗝️'], 
        scatter: '💀', 
        color: '#166534',
        bg: 'radial-gradient(circle, #064e3b 0%, #000000 100%)',
        icon: '🏴‍☠️'
    },
    space: { 
        title: "Cosmic Stars", 
        symbols: ['🚀','🚀','🪐','👽','☄️','🛰️','🌌','🌠'], 
        scatter: '🛸', 
        color: '#1e1b4b',
        bg: 'radial-gradient(circle, #1e1b4b 0%, #000000 100%)',
        icon: '🪐'
    },
    neon: { 
        title: "Neon 777", 
        symbols: ['7️⃣','7️⃣','💎','🔔','🍒','🍋','🍀','⭐'], 
        scatter: '🔥', 
        color: '#991b1b',
        bg: 'radial-gradient(circle, #7f1d1d 0%, #000000 100%)',
        icon: '⚡'
    }
};

function openGame(id) {
    currentGame = gameConfigs[id];
    
    // Смена фона всей страницы
    document.body.style.background = currentGame.bg;
    
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    document.getElementById('game-title').innerText = currentGame.title;
    
    const wrap = document.getElementById('machine-style');
    wrap.style.borderColor = currentGame.color;
    wrap.style.boxShadow = `0 0 50px ${currentGame.color}88`;

    // Добавляем или обновляем фоновый рисунок внутри автомата
    let bgDeco = document.querySelector('.bg-decoration');
    if (!bgDeco) {
        bgDeco = document.createElement('div');
        bgDeco.className = 'bg-decoration';
        wrap.prepend(bgDeco);
    }
    bgDeco.innerText = currentGame.icon;

    document.getElementById('status').innerText = "Удачи!";
    initGrid();
}

function exitGame() {
    if (freeSpins > 0) return alert("Дождитесь окончания бонуса!");
    
    // Возвращаем стандартный темный фон для лобби
    document.body.style.background = '#0f021a';
    
    document.getElementById('lobby').style.display = 'grid';
    document.getElementById('game-screen').style.display = 'none';
}

// ... остальной код (spin, checkResults, updateUI) остается прежним ...

function initGrid() {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = '';
    for (let i = 0; i < 15; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.innerText = '❓';
        grid.appendChild(cell);
    }
}

function changeBet(dir) {
    if (freeSpins > 0) return;
    betIdx = Math.max(0, Math.min(betSteps.length - 1, betIdx + dir));
    bet = betSteps[betIdx];
    document.getElementById('current-bet').innerText = bet.toFixed(2);
}

function spin() {
    if (freeSpins === 0 && balance < bet) return alert("Недостаточно средств!");
    const btn = document.getElementById('spin-btn');
    btn.disabled = true;
    if (freeSpins > 0) freeSpins--; else balance -= bet;
    updateUI();
    const cells = document.querySelectorAll('.cell');
    cells.forEach(c => { c.classList.add('spinning'); c.classList.remove('win-anim'); });
    setTimeout(() => {
        let results = [];
        cells.forEach(c => {
            c.classList.remove('spinning');
            const isScatter = Math.random() > 0.985; 
            const sym = isScatter ? currentGame.scatter : currentGame.symbols[Math.floor(Math.random() * currentGame.symbols.length)];
            c.innerText = sym;
            results.push(sym);
        });
        checkResults(results);
    }, 850);
}

function checkResults(res) {
    const status = document.getElementById('status');
    const scatters = res.filter(s => s === currentGame.scatter).length;
    const counts = {};
    res.forEach(s => counts[s] = (counts[s] || 0) + 1);
    let maxMatch = 0;
    let winSym = '';
    for (let s in counts) {
        if (s !== currentGame.scatter && counts[s] > maxMatch) {
            maxMatch = counts[s];
            winSym = s;
        }
    }
    if (scatters >= 3 && !document.getElementById('machine-style').classList.contains('bonus-active')) {
        startBonus();
        return;
    }
    let multiplier = 0;
    if (maxMatch >= 10) multiplier = 30;
    else if (maxMatch >= 7) multiplier = 8;
    else if (maxMatch >= 5) multiplier = 2;
    if (multiplier > 0) {
        const winAmount = bet * multiplier;
        balance += winAmount;
        status.innerText = `ВЫИГРЫШ: ${winAmount.toFixed(2)} BYN (x${multiplier})`;
        document.querySelectorAll('.cell').forEach(c => {
            if (c.innerText === winSym) c.classList.add('win-anim');
        });
    } else { status.innerText = ""; }
    updateUI();
    if (freeSpins > 0) setTimeout(spin, 1200);
    else {
        document.getElementById('spin-btn').disabled = false;
        if (document.getElementById('machine-style').classList.contains('bonus-active')) endBonus();
    }
}

function startBonus() {
    freeSpins = 10;
    document.getElementById('status').innerText = "🔥 БОНУСНЫЕ ИГРЫ! 🔥";
    document.getElementById('machine-style').classList.add('bonus-active');
    document.getElementById('spin-btn').classList.add('bonus');
    document.getElementById('spin-btn').innerText = "БОНУС";
    document.getElementById('bonus-counter').style.display = "block";
    updateBonusUI();
    setTimeout(spin, 1500);
}

function endBonus() {
    document.getElementById('machine-style').classList.remove('bonus-active');
    document.getElementById('spin-btn').classList.remove('bonus');
    document.getElementById('spin-btn').innerText = "КРУТИТЬ";
    document.getElementById('bonus-counter').style.display = "none";
    document.getElementById('spin-btn').disabled = false;
    document.getElementById('status').innerText = "Бонус завершен!";
}

function updateBonusUI() { document.getElementById('fs-count').innerText = freeSpins; }
function updateUI() { 
    document.getElementById('balance').innerText = balance.toFixed(2); 
    if (freeSpins > 0) updateBonusUI();
}
updateUI();
