document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const corpUI = document.getElementById('corporate-ui');
    const terminalUI = document.getElementById('terminal-ui');
    const glitchOverlay = document.getElementById('glitch-overlay');
    const bootSequence = document.getElementById('boot-sequence');
    const terminalInput = document.getElementById('terminal-input');

    // ============================================================
    //  CONFIG — single source of truth for where the API lives.
    //
    //  In PRODUCTION the FastAPI backend (src/retrofit_logic/api/
    //  server.py) serves this same folder at "/", so the API is
    //  same-origin: leave API_BASE as "" and the relative /api/v1
    //  calls just work.
    //
    //  In LOCAL/DEMO (no backend running) set DEMO_AUTO=true and the
    //  terminal runs the pipeline locally, so the site never dead-ends.
    //  Set DEMO_AUTO=false to force real API calls (will show the
    //  "connection refused" line if the backend is down).
    // ============================================================
    const CONFIG = {
        API_BASE: "",                       // "" = same-origin (prod). "http://host:8000" for a split backend.
        company_name: "Acme Corp",
        access_key: "RETROFIT",             // the "Access Portal" gate key (change for real auth)
        DEMO_AUTO: true,                    // true = fall back to local pipeline if the API is unreachable
    };
    const api = (p) => (CONFIG.API_BASE || "") + p;

    // The simulated boot sequence array
    const bootMessages = [
        "RetrofitLogic Kernel v3.4.1 (1985-04-12)",
        "Initializing core memory modules... [OK]",
        "Loading semantic processor... [OK]",
        DEMO ? "Establishing LOCAL SESSION (DEMO MODE)... " : "Establishing SECURE CONNECTION to Service-exe.com... ",
        DEMO ? "Session ready. No external backend required." : "Connection established. Encryption [ENABLED].",
        "Loading market intelligence subroutines...",
        "Standby for input.",
    ];

    // ---------------- Access gate (the "Access Portal") ----------------
    let authorized = false;
    loginBtn.addEventListener('click', () => {
        if (authorized) { startTransition(); return; }
        // Ask for the access key. In real auth this is where a session
        // token / form would live — for now a single key gates entry.
        const key = prompt("ACCESS PORTAL\n\nEnter your access key to continue:");
        if (key === null) return;                 // cancelled
        if (key.trim().toUpperCase() === CONFIG.access_key) {
            authorized = true;
            startTransition();
        } else {
            loginBtn.animate(
                [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' },
                 { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }],
                { duration: 260 }
            );
            alert("ACCESS DENIED. Invalid key.");
        }
    });

    function startTransition() {
        // Step 1: Trigger the heavy CRT shutdown/glitch animation
        glitchOverlay.classList.add('glitching');
        // Hide the corporate UI halfway through the glitch
        setTimeout(() => {
            corpUI.classList.add('hidden');
            document.body.className = '';
            document.body.style.backgroundColor = 'var(--terminal-bg)';
        }, 400); // 400ms is the middle of the crtSwitchOff animation
        // Step 2: Show terminal and start boot sequence
        setTimeout(() => {
            terminalUI.classList.add('active');
            runBootSequence();
        }, 1000); // Wait for glitch animation to finish
    }

    function runBootSequence() {
        let currentMessage = 0;
        function printNext() {
            if (currentMessage < bootMessages.length) {
                const line = document.createElement('div');
                line.className = 'boot-line';
                line.textContent = bootMessages[currentMessage];
                if (currentMessage === 1 || currentMessage === 3 || currentMessage === 5) {
                    line.classList.add('loading');
                }
                bootSequence.appendChild(line);
                const delay = Math.floor(Math.random() * 800) + 300; // 80s baud rate feel
                setTimeout(() => {
                    line.classList.remove('loading');
                    currentMessage++;
                    printNext();
                }, delay);
            } else {
                setTimeout(() => {
                    terminalInput.classList.remove('hidden');
                    typeInput();
                }, 500);
            }
        }
        printNext();
    }

    function addLine(html, color) {
        const line = document.createElement('div');
        line.className = 'boot-line';
        line.innerHTML = html;
        if (color) line.style.color = color;
        bootSequence.appendChild(line);
        return line;
    }

    // ---------------- Poll backend status (real mode only) ----------------
    function pollStatus(run_id) {
        let tries = 0;
        const MAX_TRIES = 60; // 60 * 2s = 2 min, then give up gracefully
        const interval = setInterval(() => {
            tries++;
            if (tries > MAX_TRIES) {
                clearInterval(interval);
                addLine('<br>> TIMED OUT. The engine did not report completion.<br>> (Backend: ' + CONFIG.API_BASE + ')', '#FF8C00');
                return;
            }
            fetch(api(`/api/v1/status/${run_id}`))
                .then(res => res.json())
                .then(data => {
                    if (data.status === "completed") {
                        clearInterval(interval);
                        addLine('<br>> PIPELINE COMPLETE.<br>> ARTICLE DEPLOYED TO WORDPRESS.<br>> OUTBOUND EMAIL DRAFTED.');
                    }
                })
                .catch(() => { /* keep polling on transient errors */ });
        }, 2000);
    }

    // ---------------- Auto-type a command, then run it ----------------
    function typeInput() {
        const textToType = "run retrofit_logic.exe --target market --execute";
        const promptSpan = document.querySelector('.prompt');
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < textToType.length) {
                promptSpan.textContent += textToType.charAt(index);
                index++;
            } else {
                clearInterval(typeInterval);
                setTimeout(runCommand, 800);
            }
        }, 100); // 100ms per character typing speed
    }

    function runCommand() {
        if (DEMO) {
            // No backend: run the whole pipeline locally so the site always completes.
            addLine('<br>> RUN ID: DEMO-' + Date.now().toString(36).toUpperCase());
            addLine('<br>> INITIATING ENGINE: STATUS ACCEPTED...');
            addLine('<br>> EXECUTING NODE 1: MARKET INTELLIGENCE... [OK]');
            setTimeout(() => addLine('<br>> EXECUTING NODE 2: ARTICLE SYNTHESIS... [OK]'), 700);
            setTimeout(() => addLine('<br>> EXECUTING NODE 3: WORDPRESS DEPLOY... [OK]'), 1400);
            setTimeout(() => addLine('<br>> EXECUTING NODE 4: OUTBOUND EMAIL DRAFT... [OK]'), 2100);
            setTimeout(() => addLine('<br>> PIPELINE COMPLETE.<br>> ARTICLE DEPLOYED TO WORDPRESS.<br>> OUTBOUND EMAIL DRAFTED.<br><br>[DEMO MODE] Wire a real backend by setting CONFIG.API_BASE in js/app.js', '#39FF14'), 2800);
            return;
        }
        // Real mode: POST to the backend.
        fetch(api('/api/v1/run'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_name: CONFIG.company_name, mock: true })
        }).then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        }).then(data => {
            addLine('<br>> RUN ID: ' + data.run_id + '<br>> INITIATING ENGINE: STATUS ACCEPTED...<br>> EXECUTING NODE 1: MARKET INTELLIGENCE...');
            pollStatus(data.run_id);
        }).catch(err => {
            addLine('<br>> ERROR: BACKEND CONNECTION REFUSED.<br>> START THE API WITH: uv run uvicorn retrofit_logic.api.server:app<br>> (or set CONFIG.API_BASE in js/app.js to point at a live backend)', 'red');
        });
    }
});
