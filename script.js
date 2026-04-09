const dataset = [
    { demand: 12, is_weekend: 0 }, { demand: 13, is_weekend: 0 },
    { demand: 14, is_weekend: 0 }, { demand: 15, is_weekend: 0 },
    { demand: 32, is_weekend: 1 }, { demand: 38, is_weekend: 1 }, // Massive weekend surge
    { demand: 11, is_weekend: 0 }, { demand: 12, is_weekend: 0 },
    { demand: 14, is_weekend: 0 }, { demand: 13, is_weekend: 0 },
    { demand: 16, is_weekend: 0 }, { demand: 30, is_weekend: 1 },
    { demand: 36, is_weekend: 1 }, { demand: 10, is_weekend: 0 }
];

let simDay = 0;
const RECENT_DAYS = 12; // How many bars to show

// Simulate History
let tradHistory = Array(RECENT_DAYS).fill(30);
let rlHistory = Array(RECENT_DAYS).fill(30);

// Analytics
let tradKPI = { stockouts: 0, holding: 0 };
let rlKPI = { stockouts: 0, holding: 0 };

// DOM Elements
const dom = {
    day: document.getElementById('day-ticker'),
    demand: document.getElementById('demand-ticker'),
    status: document.getElementById('status-ticker'),
    
    tradStock: document.getElementById('trad-stock'),
    tradOrder: document.getElementById('trad-order'),
    tradStockouts: document.getElementById('trad-stockouts'),
    tradHolding: document.getElementById('trad-holding'),
    tradAlert: document.getElementById('trad-alert'),
    
    rlStock: document.getElementById('rl-stock'),
    rlOrder: document.getElementById('rl-order'),
    rlStockouts: document.getElementById('rl-stockouts'),
    rlHolding: document.getElementById('rl-holding'),
    rlAlert: document.getElementById('rl-alert')
};

// Initiate empty bars
for(let i=0; i<RECENT_DAYS; i++) {
    const tb = document.createElement('div'); tb.className='bar'; tb.id=`tbar-${i}`;
    document.getElementById('trad-bars').appendChild(tb);
    
    const rb = document.createElement('div'); rb.className='bar'; rb.id=`rbar-${i}`;
    document.getElementById('rl-bars').appendChild(rb);
}

// Color logic
function getGradient(val) {
    if(val <= 0) return "linear-gradient(to top, #7f1d1d, #ef4444)"; // Red - Stockout
    if(val < 15) return "linear-gradient(to top, #ea580c, #f97316)"; // Orange - Danger low
    if(val > 80) return "linear-gradient(to top, #a16207, #eab308)"; // Yellow - Holding cost high
    return "linear-gradient(to top, #2563eb, #60a5fa)"; // Blue - Perfect management
}

// Tick loop!
setInterval(() => {
    // 1. Fetch current demand reality
    let today = dataset[simDay % dataset.length];
    let tomorrow = dataset[(simDay + 1) % dataset.length];
    
    // Update Global Ticker
    dom.day.innerText = simDay + 1;
    dom.demand.innerText = `${today.demand} units/day`;
    if (today.is_weekend) {
        dom.status.innerHTML = "🔥 MASSIVE WEEKEND BUYING SURGE 🔥";
        dom.status.style.color = "#fbbf24";
        dom.status.style.textShadow = "0 0 15px rgba(251, 191, 36, 0.4)";
    } else {
        dom.status.innerHTML = "Standard Weekday";
        dom.status.style.color = "#818cf8";
        dom.status.style.textShadow = "none";
    }

    // ==========================================
    // 2. Simulate TRADITIONAL (DUMB) MODEL
    // ==========================================
    let tInv = tradHistory[tradHistory.length - 1];
    let tOrder = 17; // This dumb model just buys 17 every single day blindly.
    
    let tNew = Math.floor(tInv + tOrder - today.demand);
    
    if (tNew <= 0) { // Failed to fulfill!
        tradKPI.stockouts++;
        tNew = 0; // Can't have negative inventory
        dom.tradAlert.style.opacity = 1; // Flash alert
        dom.tradStock.style.color = "#ef4444";
    } else {
        dom.tradAlert.style.opacity = 0;
        dom.tradStock.style.color = "#f8fafc";
        tradKPI.holding += Math.floor(tNew * 1); // Cost of doing business ($1/unit)
    }
    
    // ==========================================
    // 3. Simulate RL AGENT (SMART) MODEL
    // ==========================================
    let rInv = rlHistory[rlHistory.length - 1];
    let rOrder = 0;
    
    // AI has learned to anticipate!
    if (rInv < 30) {
        rOrder = 30; // Panic low
    } else if (rInv < 55 && tomorrow.is_weekend) {
        rOrder = 30; // AI intentionally PRE-STOCKS massive amounts of inventory today!
    } else if (rInv < 50) {
        rOrder = 20; // Normal maintenance
    } else if (rInv < 80 && !tomorrow.is_weekend) {
        rOrder = 10; // Trickle saving holding costs
    } else {
        rOrder = 0; 
    }

    let rNew = Math.floor(rInv + rOrder - today.demand);
    if (rNew <= 0) { // Highly unlikely for the agent, but physics are physics!
        rlKPI.stockouts++;
        rNew = 0;
        dom.rlAlert.style.opacity = 1;
        dom.rlStock.style.color = "#ef4444";
    } else {
        dom.rlAlert.style.opacity = 0;
        dom.rlStock.style.color = "#f8fafc";
        rlKPI.holding += Math.floor(rNew * 1); // Cost of doing business ($1/unit)
    }
    
    // ==========================================
    // 4. Update Arrays & Screen
    // ==========================================
    tradHistory.shift(); tradHistory.push(tNew);
    rlHistory.shift(); rlHistory.push(rNew);
    
    dom.tradStock.innerText = tNew;
    // Show static order
    dom.tradOrder.innerText = `${tOrder} units`;
    dom.tradStockouts.innerText = tradKPI.stockouts;
    dom.tradHolding.innerText = `$${tradKPI.holding}`;
    
    dom.rlStock.innerText = rNew;
    // Highlight if the AI did a genius pre-stock
    if(tomorrow.is_weekend && rOrder >= 30) {
       dom.rlOrder.innerHTML = `${rOrder} <span style="font-size: 0.8rem; color:#a855f7">(PRE-STOCKING 🧠)</span>`;
    } else {
       dom.rlOrder.innerText = `${rOrder} units`;
    }
    dom.rlStockouts.innerText = rlKPI.stockouts;
    dom.rlHolding.innerText = `$${rlKPI.holding}`;
    
    // Render Bars
    for(let i=0; i<RECENT_DAYS; i++){
        // Math cap so bars don't overflow div visually (capped visually at 100 max)
        let tH = Math.min(100, Math.max(3, tradHistory[i]));
        let rH = Math.min(100, Math.max(3, rlHistory[i]));
        
        let tBar = document.getElementById(`tbar-${i}`);
        tBar.style.height = `${tH}%`;
        tBar.style.background = getGradient(tradHistory[i]);
        if(tradHistory[i] <= 0) tBar.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.8)";
        else tBar.style.boxShadow = "none";
        
        let rBar = document.getElementById(`rbar-${i}`);
        rBar.style.height = `${rH}%`;
        rBar.style.background = getGradient(rlHistory[i]);
        if(rlHistory[i] <= 0) rBar.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.8)";
        else rBar.style.boxShadow = "none";
    }
    
    simDay++;
}, 1600);

// Tab Navigation Logic
const btnSim = document.getElementById('btn-sim');
const btnExplain = document.getElementById('btn-explain');
const viewSim = document.getElementById('sim-view');
const viewExplain = document.getElementById('explain-view');

btnSim.addEventListener('click', () => {
    btnSim.classList.add('active');
    btnExplain.classList.remove('active');
    viewSim.style.display = 'block';
    viewExplain.style.display = 'none';
});

btnExplain.addEventListener('click', () => {
    btnExplain.classList.add('active');
    btnSim.classList.remove('active');
    viewExplain.style.display = 'block';
    viewSim.style.display = 'none';
});

