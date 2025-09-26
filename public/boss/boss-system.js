// Boss Battle System
class BossSystem {
    constructor() {
        this.currentBoss = null;
        this.battleActive = false;
        this.battleProgress = 0; // -100 to 100, 0 is center
        this.mcAtBattleStart = 0;
        this.totalMcChange = 0;
        this.bossWins = 0;
        this.bossLosses = 0;
        this.lastBattleTime = Date.now(); // Initialize to current time to prevent immediate battle
        this.battleCooldown = 900000; // 10 seconds between battles (testing)
        this.battleTimer = null;
        this.countdownInterval = null;
        this.winThreshold = 0;
        this.loseThreshold = 0;
        this.battleThreshold = 0;
        this.defeatedBosses = new Set(); // Track which bosses have been defeated
        this.currentBossIndex = 0; // Track current boss progression
        
        // Initialize global pause state
        window.bossSystemPaused = false;
        
        this.initializeBossWindow();
        this.loadStats();
        // Always show boss stats on initialization
        this.updateMainScreenStats();
        // Start countdown timer
        this.startCountdownTimer();
    }

    // Boss data with varying difficulties
    getBosses() {
        return [
            {
                name: "Luke Belmar",
                image: "boss/belmar.jpg",
                difficultyPercent: 1, // 1% of current market cap
                description: "He studied bro"
            },
            {
                name: "Andrew Tate",
                image: "boss/tate.jpg",
                difficultyPercent: 2, // 2% of current market cap
                description: "What color is you Bugatti?"
            },
            {
                name: "CZ",
                image: "boss/cz.jpg",
                difficultyPercent: 3, // 3% of current market cap
                description: "If you can't hold you won't be rich."
            },
            {
                name: "Elon Musk",
                image: "boss/elon.jpg",
                difficultyPercent: 4, // 4% of current market cap
                description: "TOP 1 Diablo IV player in the world"
            },
            {
                name: "Toly",
                image: "boss/toly.jpg",
                difficultyPercent: 5, // 5% of current market cap
                description: "Father of solana, he fucks"
            },
            {
                name: "SBF",
                image: "boss/sbf.jpg",
                difficultyPercent: 6, // 6% of current market cap
                description: "I will treat $AGI like FTX"
            },
            {
                name: "Trump",
                image: "boss/trump.jpg",
                difficultyPercent: 7, // 7% of current market cap
                description: "CHINA, CHINA, CHINA, CHINA, CHINA."
            },
            {
                name: "Vitalik",
                image: "boss/vitalik.jpg",
                difficultyPercent: 8, // 8% of current market cap
                description: "i want to donate the markecap to charity"
            },
            {
                name: "Ansem",
                image: "boss/ansem.jpg",
                difficultyPercent: 10, // 10% of current market cap
                description: "Doomer final boss"
            },
            {
                name: "Dior",
                image: "boss/dior.jpg",
                difficultyPercent: 15, // 15% of current market cap - hardest boss
                description: "The creator of the alon gyatt meme"
            }
        ];
    }

    initializeBossWindow() {
        // Create boss battle overlay
        const overlay = document.createElement('div');
        overlay.id = 'bossOverlay';
        overlay.className = 'boss-overlay';
        overlay.innerHTML = `
            <div class="boss-window">
                <div class="boss-header">
                    <h2 id="bossTitle">A Wild Boss Appears!</h2>
                </div>
                <div class="battle-arena">
                    <div class="fighter alon-fighter">
                        <div class="fighter-image">
                            <img src="top.png" alt="Alon" class="alon-portrait">
                        </div>
                        <div class="fighter-name">Alon</div>
                        <div class="fighter-hp">fuck it. jew mode.</div>
                    </div>
                    <div class="battle-bar-container">
                        <div class="battle-bar">
                            <div class="battle-progress" id="battleProgress"></div>
                            <div class="battle-center"></div>
                        </div>
                        <div class="battle-info">
                            <div class="battle-requirement" id="battleRequirement"></div>
                            <div class="battle-current" id="battleCurrent"></div>
                            <div class="battle-mcap" id="battleMcap">Current: $0</div>
                            <div class="battle-conditions">
                                <div class="lose-condition" id="loseCondition">Lose: Drop to $0</div>
                                <div class="win-condition" id="winCondition">Win: Reach $0</div>
                            </div>
                        </div>
                    </div>
                    <div class="fighter boss-fighter">
                        <div class="fighter-image" id="bossImage">🤖</div>
                        <div class="fighter-name" id="bossName">Boss</div>
                        <div class="fighter-hp" id="bossDescription">Enemy Description</div>
                    </div>
                </div>
                <div class="battle-timer">
                    <div id="battleTimer">Battle Timer: 60s</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    shouldTriggerBattle() {
        const now = Date.now();
        if (this.battleActive || (now - this.lastBattleTime) < this.battleCooldown) {
            return false;
        }
        
        // Timer-based: trigger when cooldown is complete
        return true;
    }

    startTimerBattle() {
        if (!this.shouldTriggerBattle()) return;
        
        const bosses = this.getBosses();
        let currentBoss;
        
        // Check if we've beaten all bosses (completed the progression)
        if (this.currentBossIndex >= bosses.length) {
            // After beating all bosses, switch to random selection
            currentBoss = bosses[Math.floor(Math.random() * bosses.length)];
        } else {
            // During progression, use sequential order
            currentBoss = bosses[this.currentBossIndex];
        }
        
        this.startBattle(currentBoss);
    }

    startBattle(boss) {
        // Prevent multiple battles from starting
        if (this.battleActive) {
            console.log('Battle already active, ignoring new battle request');
            return;
        }
        
        this.currentBoss = boss;
        this.battleActive = true;
        this.battleProgress = 0;
        
        // Get current market cap from the frontend element (top right display)
        const marketCapElement = document.querySelector('.marketcap-amount');
        if (marketCapElement) {
            const rawText = marketCapElement.textContent;
            const cleanedText = rawText.replace(/[$,]/g, '');
            this.mcAtBattleStart = parseFloat(cleanedText) || 0;
            console.log(`Market cap element found: "${rawText}" -> cleaned: "${cleanedText}" -> parsed: ${this.mcAtBattleStart}`);
        } else {
            this.mcAtBattleStart = window.lastMc || 0;
            console.log(`Market cap element NOT found, using window.lastMc: ${this.mcAtBattleStart}`);
        }
        
        this.totalMcChange = 0;
        this.lastBattleTime = Date.now();
        
        // Calculate dynamic thresholds based on percentage of current market cap
        const finalThreshold = Math.round(this.mcAtBattleStart * (boss.difficultyPercent / 100));
        // Ensure minimum threshold of $1 to prevent 0 change scenarios (only for very small caps)
        const actualThreshold = Math.max(finalThreshold, 1);
        
        // Store the threshold for battle calculations
        this.battleThreshold = actualThreshold;
        this.winThreshold = this.mcAtBattleStart + actualThreshold;
        this.loseThreshold = this.mcAtBattleStart - actualThreshold;

        // Update UI
        document.getElementById('bossTitle').textContent = `A Wild ${boss.name} Appears!`;
        const bossImageElement = document.getElementById('bossImage');
        bossImageElement.innerHTML = `<img src="${boss.image}" alt="${boss.name}" class="boss-portrait">`;
        document.getElementById('bossName').textContent = boss.name;
        document.getElementById('bossDescription').textContent = boss.description;
        document.getElementById('battleRequirement').textContent = `* ${boss.name} is trying to dump the price! Pump it to win!`;
        
        // Update battle conditions with Undertale theme
        const currentMcElement = document.querySelector('.marketcap-amount');
        const currentDisplayMc = currentMcElement ? 
            currentMcElement.textContent.replace(/[$,]/g, '') : 
            this.mcAtBattleStart;
            
        document.getElementById('battleMcap').textContent = `* Current: $${parseInt(currentDisplayMc).toLocaleString()}`;
        document.getElementById('winCondition').textContent = `*📈 PUMP +$${actualThreshold.toLocaleString()} to win`;
        document.getElementById('loseCondition').textContent = `*📉 Don't let it DUMP -$${actualThreshold.toLocaleString()}`;
        
        // Reset vertical candlestick battle display
        const progressBar = document.getElementById('battleProgress');
        const currentElement = document.getElementById('battleCurrent');
        
        progressBar.style.height = '0%';
        progressBar.style.top = '50%';
        progressBar.style.background = '#00ff40';
        currentElement.textContent = `* 📊 Battle starts at current price`;
        
        // Hide any existing side messages
        this.hideSideMessage('left');
        this.hideSideMessage('right');
        
        // Show overlay
        document.getElementById('bossOverlay').classList.add('active');
        
        // Start boss battle music
        this.startBattleMusic();
        
        // Pause all other UI elements
        this.pauseOtherUI();
        
        // Speed up market cap fetching during battle
        if (window.setMarketCapFetchInterval && window.battleFetchInterval) {
            window.setMarketCapFetchInterval(window.battleFetchInterval);
        }
        
        // Start 2-minute timer
        this.startBattleTimer();
        
        console.log(`Boss battle started: ${boss.name}`);
        console.log(`- Market cap at start: $${this.mcAtBattleStart}`);
        console.log(`- Difficulty: ${boss.difficultyPercent}%`);
        console.log(`- Calculated threshold: $${finalThreshold} (${boss.difficultyPercent}%) -> $${actualThreshold} (final)`);
        console.log(`- Win at: $${this.winThreshold} | Lose at: $${this.loseThreshold}`);
    }

    startBattleTimer() {
        let timeLeft = 120; // 2 minutes
        const timerElement = document.getElementById('battleTimer');
        
        const timer = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `Battle Timer: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                this.endBattle(false, "Time's up!");
            }
        }, 1000);
        
        this.battleTimer = timer;
    }

    updateBattle(mcChange) {
        if (!this.battleActive || !this.currentBoss) return;
        
        this.totalMcChange += mcChange;
        const currentMc = this.mcAtBattleStart + this.totalMcChange;
        
        // Calculate progress based on how close we are to winning or losing
        // Positive totalMcChange = progress toward victory
        // Negative totalMcChange = progress toward defeat
        let progressPercent = 0;
        
        if (this.totalMcChange >= 0) {
            // Moving toward victory - calculate percentage of win threshold reached
            progressPercent = Math.min(100, (this.totalMcChange / this.battleThreshold) * 100);
        } else {
            // Moving toward defeat - calculate percentage of lose threshold reached  
            progressPercent = Math.max(-100, (this.totalMcChange / this.battleThreshold) * 100);
        }
        this.battleProgress = progressPercent;
        
        // Update UI
        const progressBar = document.getElementById('battleProgress');
        const currentElement = document.getElementById('battleCurrent');
        const mcapElement = document.getElementById('battleMcap');
        
        // Update current market cap display from main screen component
        const marketCapElement = document.querySelector('.marketcap-amount');
        const actualCurrentMc = marketCapElement ? 
            marketCapElement.textContent.replace(/[$,]/g, '') : 
            (window.lastMc || 0);
        
        mcapElement.textContent = `* Current: $${parseInt(actualCurrentMc).toLocaleString()}`;
        
        // Vertical candlestick logic: positive moves up, negative moves down
        // Max height is 50% (from center to top/bottom)
        if (this.totalMcChange >= 0) {
            // Pumping: green bar extends upward from center (max 50% height)
            const barHeight = (progressPercent / 100) * 50; // Scale to max 50%
            progressBar.style.height = barHeight + '%';
            progressBar.style.top = (50 - barHeight) + '%';
            progressBar.style.background = '#00ff40';
            // Show pump message on Alon's side (left)
            this.showSideMessage('left', `📈 +$${this.totalMcChange.toLocaleString()} PUMP`, '#00ff40');
            this.hideSideMessage('right');
            currentElement.textContent = `* Price moving up!`;
        } else {
            // Dumping: red bar extends downward from center (max 50% height)
            const absProgressPercent = Math.abs(progressPercent);
            const barHeight = (absProgressPercent / 100) * 50; // Scale to max 50%
            progressBar.style.height = barHeight + '%';
            progressBar.style.top = '50%';
            progressBar.style.background = '#ff4444';
            // Show dump message on Boss's side (right)
            this.showSideMessage('right', `📉 -$${Math.abs(this.totalMcChange).toLocaleString()} DUMP`, '#ff4444');
            this.hideSideMessage('left');
            currentElement.textContent = `* Price moving down!`;
        }
        
        // Check win/lose conditions based on absolute market cap
        if (currentMc >= this.winThreshold) {
            this.endBattle(true, "Victory!");
        } else if (currentMc <= this.loseThreshold) {
            this.endBattle(false, "Defeated by boss!");
        }
    }

    endBattle(won, reason) {
        if (!this.battleActive) return;
        
        this.battleActive = false;
        // Clear battle timer safely
        if (this.battleTimer) {
            clearInterval(this.battleTimer);
            this.battleTimer = null;
        }
        
        // Update lastBattleTime IMMEDIATELY to start new cooldown
        this.lastBattleTime = Date.now();
        
        if (won) {
            this.bossWins++;
            // Add boss to defeated list (trophy earned!)
            this.defeatedBosses.add(this.currentBoss.name);
            // Advance to next boss only when current one is defeated
            this.currentBossIndex++;
        } else {
            this.bossLosses++;
            // Stay on the same boss if defeated - no progression
        }
        
        // Use the stored battle threshold for display
        const finalThreshold = this.battleThreshold;
        
        // Show result with Undertale theme
        const resultMessage = won ? 
            `* You won! You earned ${finalThreshold} Marketcap.` :
            `* You lost. ${this.currentBoss.name} is getting stronger.`;
        
        document.getElementById('bossTitle').textContent = resultMessage;
        
        // Stop battle music and play victory/loss sound
        this.stopBattleMusic();
        this.playResultSound(won);
        
        // Show congratulatory popup after 1 second
        setTimeout(() => {
            this.showCongratulationPopup(won);
        }, 1000);
        
        // Hide overlay after 8 seconds (longer to show popup and hear sounds)
        setTimeout(() => {
            document.getElementById('bossOverlay').classList.remove('active');
            // Resume all other UI elements
            this.resumeOtherUI();
            
            // Restore normal market cap fetch interval
            if (window.setMarketCapFetchInterval && window.normalFetchInterval) {
                window.setMarketCapFetchInterval(window.normalFetchInterval);
            }
            
            // Reset battle state completely
            this.currentBoss = null;
            this.battleProgress = 0;
            this.totalMcChange = 0;
            this.winThreshold = 0;
            this.loseThreshold = 0;
            this.battleThreshold = 0;
        }, 8000);
        
        // Save stats
        this.saveStats();
        
        // Update main screen stats
        this.updateMainScreenStats();
        
        console.log(`Battle ended: ${won ? 'Won' : 'Lost'} - ${reason}`);
        console.log(`Boss record: ${this.bossWins}W - ${this.bossLosses}L`);
    }

    showSideMessage(side, message, color) {
        let messageElement = document.getElementById(`${side}SideMessage`);
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = `${side}SideMessage`;
            messageElement.className = `side-message ${side}-side`;
            
            // Find the appropriate fighter element to attach to
            const fighterElement = side === 'left' ? 
                document.querySelector('.alon-fighter') : 
                document.querySelector('.boss-fighter');
            
            if (fighterElement) {
                fighterElement.appendChild(messageElement);
            }
        }
        
        messageElement.textContent = message;
        messageElement.style.color = color;
        messageElement.style.display = 'block';
    }

    hideSideMessage(side) {
        const messageElement = document.getElementById(`${side}SideMessage`);
        if (messageElement) {
            messageElement.style.display = 'none';
        }
    }

    startBattleMusic() {
        console.log('Starting battle music...', {
            audioEnabled: window.audioEnabled,
            bossBattleMusic: !!window.bossBattleMusic,
            currentBgMusic: !!window.currentBgMusic
        });
        
        if (!window.audioEnabled || !window.bossBattleMusic) {
            console.log('Battle music not started - audio disabled or music not found');
            return;
        }
        
        // Pause normal background music
        if (window.currentBgMusic) {
            window.currentBgMusic.pause();
            console.log('Paused normal bg music');
        }
        
        // Start boss battle music
        window.bossBattleMusic.volume = 0.05; // Make it louder so we can hear it
        window.bossBattleMusic.currentTime = 0;
        window.bossBattleMusic.play().then(() => {
            console.log('Boss battle music started successfully');
        }).catch(e => {
            console.log('Boss battle music failed:', e);
        });
    }

    stopBattleMusic() {
        if (!window.bossBattleMusic) return;
        
        // Stop boss battle music
        window.bossBattleMusic.pause();
        window.bossBattleMusic.currentTime = 0;
        
        // Resume normal background music after a delay (3 seconds)
        setTimeout(() => {
            if (window.audioEnabled && window.currentBgMusic) {
                window.currentBgMusic.volume = 0.03;
                window.currentBgMusic.play().catch(e => console.log('Background music resume failed:', e));
                console.log('Normal background music resumed after delay');
            }
        }, 3000);
    }

    playResultSound(won) {
        console.log('Playing result sound...', {
            won: won,
            audioEnabled: window.audioEnabled,
            victorySound: !!window.victorySound,
            lossSound: !!window.lossSound
        });
        
        if (!window.audioEnabled) {
            console.log('Result sound not played - audio disabled');
            return;
        }
        
        const sound = won ? window.victorySound : window.lossSound;
        const soundName = won ? 'victory' : 'loss';
        
        if (sound) {
            sound.volume = 0.5; // Make it louder
            sound.currentTime = 0;
            sound.play().then(() => {
                console.log(`${soundName} sound played successfully`);
            }).catch(e => {
                console.log(`${soundName} sound failed:`, e);
            });
        } else {
            console.log(`${soundName} sound not found`);
        }
    }

    updateMainScreenStats() {
        let statsElement = document.getElementById('bossStats');
        if (!statsElement) {
            // Create stats element if it doesn't exist
            statsElement = document.createElement('div');
            statsElement.id = 'bossStats';
            statsElement.className = 'boss-stats';
            document.querySelector('.container').appendChild(statsElement);
        }
        
        const winRate = this.bossWins + this.bossLosses > 0 ? 
            Math.round((this.bossWins / (this.bossWins + this.bossLosses)) * 100) : 0;
        
        statsElement.innerHTML = `
            <div class="stats-icon">⚔️</div>
            <div class="stats-text">
                <div>Boss Battles</div>
                <div>${this.bossWins}W - ${this.bossLosses}L (${winRate}%)</div>
            </div>
        `;
        
        // Create or update countdown timer at bottom center
        let countdownElement = document.getElementById('bossCountdown');
        if (!countdownElement) {
            countdownElement = document.createElement('div');
            countdownElement.id = 'bossCountdown';
            countdownElement.className = 'boss-countdown-center';
            document.querySelector('.container').appendChild(countdownElement);
        }
        
        // Create or update trophy display
        this.updateTrophyDisplay();
    }

    updateTrophyDisplay() {
        let trophyElement = document.getElementById('bosseTrophies');
        if (!trophyElement) {
            // Create trophy element if it doesn't exist
            trophyElement = document.createElement('div');
            trophyElement.id = 'bosseTrophies';
            trophyElement.className = 'boss-trophies';
            document.querySelector('.container').appendChild(trophyElement);
        }
        
        const allBosses = this.getBosses();
        const trophyCount = this.defeatedBosses.size;
        const totalBosses = allBosses.length;
        const isProgressionComplete = this.currentBossIndex >= totalBosses;
        
        let trophyHTML = `
            <div class="trophy-header">
                <div class="trophy-icon">🏆</div>
                <div class="trophy-text">
                    <div>Boss Trophies</div>
                    <div>${trophyCount}/${totalBosses} Defeated ${isProgressionComplete ? '✨ COMPLETE!' : ''}</div>
                </div>
            </div>
            <div class="trophy-grid">
        `;
        
        // Add trophy for each boss
        allBosses.forEach((boss, index) => {
            const isDefeated = this.defeatedBosses.has(boss.name);
            const isCurrent = index === this.currentBossIndex && !isProgressionComplete;
            const isUpcoming = index > this.currentBossIndex && !isProgressionComplete;
            
            let statusClass = 'locked';
            let statusIcon = '🔒';
            
            if (isDefeated) {
                statusClass = 'defeated';
                statusIcon = '✅';
            } else if (isCurrent) {
                statusClass = 'current';
                statusIcon = '⚔️';
            }
            
            trophyHTML += `
                <div class="trophy-item ${statusClass}">
                    <img src="${boss.image}" alt="${boss.name}" class="trophy-portrait">
                    <div class="trophy-name">${boss.name}</div>
                    <div class="trophy-status">${statusIcon}</div>
                </div>
            `;
        });
        
        trophyHTML += `</div>`;
        trophyElement.innerHTML = trophyHTML;
    }

    saveStats() {
        const stats = {
            bossWins: this.bossWins,
            bossLosses: this.bossLosses,
            defeatedBosses: Array.from(this.defeatedBosses), // Convert Set to Array for JSON
            currentBossIndex: this.currentBossIndex, // Save progression
            achievements: window.achievements || {},
            achievementCount: window.achievementCount || 0,
            timestamp: Date.now()
        };
        
        try {
            // Save to localStorage only (works on Vercel/static hosting)
            localStorage.setItem('gyattStats', JSON.stringify(stats));
            console.log(`Stats saved to localStorage - Trophies: ${this.defeatedBosses.size}`);
        } catch (error) {
            console.error('Error saving stats to localStorage:', error);
        }
    }

    loadStats() {
        try {
            // Load from localStorage only (works on Vercel/static hosting)
            const localStats = localStorage.getItem('gyattStats');
            if (localStats) {
                const stats = JSON.parse(localStats);
                
                this.bossWins = stats.bossWins || 0;
                this.bossLosses = stats.bossLosses || 0;
                this.currentBossIndex = stats.currentBossIndex || 0; // Load progression
                
                // Load defeated bosses (convert Array back to Set)
                if (stats.defeatedBosses) {
                    this.defeatedBosses = new Set(stats.defeatedBosses);
                }
                
                // Restore achievements if available
                if (stats.achievements && window.achievements) {
                    window.achievements = { ...window.achievements, ...stats.achievements };
                    window.achievementCount = stats.achievementCount || 0;
                    if (window.updateAchievementCounter) {
                        window.updateAchievementCounter();
                    }
                }
                
                this.updateMainScreenStats();
                console.log(`Loaded stats from localStorage: ${this.bossWins}W - ${this.bossLosses}L`);
            }
        } catch (error) {
            console.error('Error loading stats from localStorage:', error);
        }
    }

    startCountdownTimer() {
        // Update countdown every second
        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 1000);
    }

    updateCountdown() {
        const countdownElement = document.getElementById('bossCountdown');
        if (!countdownElement) return;

        const now = Date.now();
        const timeSinceLastBattle = now - this.lastBattleTime;
        const timeUntilNext = this.battleCooldown - timeSinceLastBattle;
        
        // Get current boss info for display
        const bosses = this.getBosses();
        let bossName;
        
        if (this.currentBossIndex >= bosses.length) {
            // After completing all bosses, show random
            bossName = 'Random Boss';
        } else {
            // During progression, show specific boss
            const currentBoss = bosses[this.currentBossIndex];
            bossName = currentBoss ? currentBoss.name : 'Unknown';
        }

        if (this.battleActive) {
            countdownElement.textContent = 'Battle Active!';
            countdownElement.style.color = '#ff4444';
            // Don't process any timer logic during battle
            return;
        } else if (timeUntilNext <= 0) {
            // Auto-trigger battle when timer reaches zero (only if no battle is active)
            this.startTimerBattle();
            countdownElement.textContent = `${bossName} Incoming!`;
            countdownElement.style.color = '#ffff00';
        } else {
            const totalSecondsLeft = Math.ceil(timeUntilNext / 1000);
            const minutesLeft = Math.floor(totalSecondsLeft / 60);
            const secondsLeft = totalSecondsLeft % 60;
            
            if (minutesLeft > 0) {
                countdownElement.textContent = `Next: ${bossName} in ${minutesLeft}m ${secondsLeft}s`;
            } else {
                countdownElement.textContent = `Next: ${bossName} in ${secondsLeft}s`;
            }
            countdownElement.style.color = '#ffff88';
        }
    }

    pauseOtherUI() {
        // Hide achievement popups
        const achievementPopup = document.getElementById('achievementPopup');
        if (achievementPopup) {
            achievementPopup.style.display = 'none';
        }
        
        // Hide dialogue box
        const dialogueBox = document.getElementById('dialogueBox');
        if (dialogueBox) {
            dialogueBox.style.display = 'none';
        }
        
        // Pause achievement system by setting a flag
        window.bossSystemPaused = true;
    }

    resumeOtherUI() {
        // Show achievement popups
        const achievementPopup = document.getElementById('achievementPopup');
        if (achievementPopup) {
            achievementPopup.style.display = 'block';
        }
        
        // Show dialogue box
        const dialogueBox = document.getElementById('dialogueBox');
        if (dialogueBox) {
            dialogueBox.style.display = 'block';
        }
        
        // Resume achievement system
        window.bossSystemPaused = false;
        
        // Process any queued achievements after battle ends
        setTimeout(() => {
            this.processQueuedAchievements();
        }, 500);
    }

    showCongratulationPopup(won) {
        console.log('Showing congratulation popup for:', won ? 'victory' : 'defeat');
        
        // Create congratulation popup
        const popup = document.createElement('div');
        popup.className = 'congratulation-popup';
        
        let message, alonsReaction;
        
        if (won) {
            message = `* Alon beat ${this.currentBoss.name}!`;
            const winReactions = [
                "* my gyatt power was DETERMINED!",
                "* no boss can handle this level of gyatt!",
                "* gyatt energy fills you with DETERMINATION.",
                "* that boss got gyatt-slapped!",
                "* my ass cheeks of victory!",
                "* gyatt supremacy achieved!",
                "* boss battle? more like boss defeat!",
                "* this gyatt is filled with DETERMINATION!"
            ];
            alonsReaction = winReactions[Math.floor(Math.random() * winReactions.length)];
        } else {
            message = `* ${this.currentBoss.name} defeated Alon!`;
            const loseReactions = [
                "* my gyatt wasn't ready for that...",
                "* even my ass has limits...",
                "* that boss was too powerful!",
                "* need more gyatt training!",
                "* my gyatt got humbled...",
                "* time to pump harder!",
                "* this gyatt needs more power!",
                "* but it refused to give up."
            ];
            alonsReaction = loseReactions[Math.floor(Math.random() * loseReactions.length)];
        }
        
        popup.innerHTML = `
            <div class="congrat-content">
                <div class="congrat-fighters">
                    <div class="congrat-fighter">
                        <div class="congrat-portrait">
                            <img src="top.png" alt="Alon" class="alon-congrat-portrait">
                            ${!won ? '<div class="defeat-indicator">✗</div>' : ''}
                        </div>
                        <div class="fighter-name">Alon</div>
                    </div>
                    <div class="congrat-fighter">
                        <div class="congrat-portrait">
                            <img src="${this.currentBoss.image}" alt="${this.currentBoss.name}" class="boss-congrat-portrait">
                            ${won ? '<div class="defeat-indicator">✗</div>' : ''}
                        </div>
                        <div class="fighter-name">${this.currentBoss.name}</div>
                    </div>
                </div>
                <div class="congrat-text">
                    <div class="congrat-title ${won ? 'win' : 'lose'}">${message}</div>
                    <div class="congrat-quote">"${alonsReaction}"</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Add popup-active class to boss overlay for opacity effect
        const bossOverlay = document.getElementById('bossOverlay');
        if (bossOverlay) {
            bossOverlay.classList.add('popup-active');
        }
        
        // Show popup with animation
        setTimeout(() => {
            popup.classList.add('show');
        }, 100);
        
        // Remove popup after 5 seconds (2 seconds longer)
        setTimeout(() => {
            popup.classList.remove('show');
            // Remove popup-active class
            if (bossOverlay) {
                bossOverlay.classList.remove('popup-active');
            }
            setTimeout(() => {
                popup.remove();
            }, 300);
        }, 5000);
    }

    processQueuedAchievements() {
        // Trigger the first queued achievement if any exist
        if (window.achievementQueue && window.achievementQueue.length > 0 && !window.isShowingAchievement) {
            const next = window.achievementQueue.shift();
            if (window.displayAchievement) {
                window.displayAchievement(next.title, next.description);
            }
        }
    }

    // Cleanup method for proper state management
    destroy() {
        // Stop battle music if playing
        this.stopBattleMusic();
        
        // Clear all intervals
        if (this.battleTimer) {
            clearInterval(this.battleTimer);
            this.battleTimer = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        // Reset all state
        this.battleActive = false;
        this.currentBoss = null;
        this.battleProgress = 0;
        this.totalMcChange = 0;
        window.bossSystemPaused = false;
        
        // Remove battle overlay
        const overlay = document.getElementById('bossOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Export for use in main file
window.BossSystem = BossSystem;
