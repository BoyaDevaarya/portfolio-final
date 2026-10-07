/* ==========================================================================
   DEVAARYA.EXE // FUTURISTIC HUD INTERACTION ENGINE
   Author: Boya Devaarya
   Stack: Vanilla JavaScript (Audio Synth, Canvas HUD, Terminal, Micro-interactions)
   ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. WEB AUDIO API SYNTHESIZER (SFX SYSTEM)
     -------------------------------------------------------------------------- */
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'boot') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'secret') {
        const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major
        chord.forEach((freq, idx) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g);
          g.connect(audioCtx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + idx * 0.08);
          g.gain.setValueAtTime(0.06, now + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
          o.start(now + idx * 0.08);
          o.stop(now + idx * 0.08 + 0.3);
        });
      }
    } catch (e) {
      console.warn('Audio Synth Error:', e);
    }
  }

  // Sound Toggle Button
  const sfxBtn = document.getElementById('sfx-toggle');
  if (sfxBtn) {
    sfxBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      const sfxText = sfxBtn.querySelector('.sfx-text');
      const sfxIcon = sfxBtn.querySelector('.sfx-icon');
      if (soundEnabled) {
        if (sfxText) sfxText.textContent = 'SFX: ON';
        if (sfxIcon) sfxIcon.textContent = '🔊';
        sfxBtn.style.color = 'var(--accent-purple)';
        playSound('click');
      } else {
        if (sfxText) sfxText.textContent = 'SFX: OFF';
        if (sfxIcon) sfxIcon.textContent = '🔇';
        sfxBtn.style.color = 'var(--text-muted)';
      }
    });
  }

  /* --------------------------------------------------------------------------
     2. BOOT SCREEN INTRO SEQUENCE
     -------------------------------------------------------------------------- */
  const bootScreen = document.getElementById('boot-screen');
  const bootTerminal = document.getElementById('boot-terminal');
  const bootFill = document.getElementById('boot-progress-fill');
  const skipBootBtn = document.getElementById('skip-boot-btn');
  const bootClock = document.getElementById('boot-clock');

  function updateClock() {
    if (bootClock) {
      const now = new Date();
      bootClock.textContent = now.toTimeString().split(' ')[0];
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  let bootCompleted = false;

  function finishBoot() {
    if (bootCompleted) return;
    bootCompleted = true;
    if (bootFill) bootFill.style.width = '100%';
    playSound('boot');
    setTimeout(() => {
      if (bootScreen) bootScreen.classList.add('fade-out');
    }, 300);
  }

  if (bootScreen) {
    const bootLines = [
      '> INITIALIZING DEVAARYA.EXE...',
      '> LOADING PLAYER PROFILE [BOYA DEVAARYA]...',
      '> LOADING QUEST LOG & SKILL TREE...',
      '> CONNECTING TO REVA AI NODE...',
      '> SYSTEM ONLINE'
    ];

    let lineIndex = 0;

    function runBootStep() {
      if (bootCompleted) return;
      if (lineIndex < bootLines.length) {
        const line = document.createElement('div');
        line.className = 'boot-line' + (lineIndex === bootLines.length - 1 ? ' success' : '');
        line.textContent = bootLines[lineIndex];
        if (bootTerminal) {
          bootTerminal.appendChild(line);
          bootTerminal.scrollTop = bootTerminal.scrollHeight;
        }
        lineIndex++;
        const percent = (lineIndex / bootLines.length) * 100;
        if (bootFill) bootFill.style.width = `${percent}%`;

        setTimeout(runBootStep, 250);
      } else {
        setTimeout(finishBoot, 300);
      }
    }

    setTimeout(runBootStep, 100);

    if (skipBootBtn) {
      skipBootBtn.addEventListener('click', finishBoot);
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') finishBoot();
    });
  }

  /* --------------------------------------------------------------------------
     3. BACKGROUND CANVAS GRID & HUD PARTICLES
     -------------------------------------------------------------------------- */
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const numParticles = Math.min(Math.floor(width / 35), 45);

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5 + 1;
        this.color = Math.random() > 0.5 ? 'rgba(168, 85, 247, 0.4)' : 'rgba(0, 240, 255, 0.4)';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }

    function renderCanvas() {
      ctx.clearRect(0, 0, width, height);

      // Subtle Cyber Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 60;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render Connected Tech Particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.18 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(renderCanvas);
    }
    renderCanvas();
  }

  /* --------------------------------------------------------------------------
     4. CUSTOM CURSOR & HOVER EFFECTS
     -------------------------------------------------------------------------- */
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');

  if (cursorDot && cursorRing && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    });

    function animateCursor() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const interactables = document.querySelectorAll('a, button, input, .skill-node, .quest-card, .meta-card, .achievement-card');
    interactables.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursorRing.classList.add('active');
        playSound('hover');
      });
      el.addEventListener('mouseleave', () => {
        cursorRing.classList.remove('active');
      });
      el.addEventListener('click', () => {
        playSound('click');
      });
    });
  }

  /* --------------------------------------------------------------------------
     5. SCROLL PROGRESS & NAVBAR ENGINE
     -------------------------------------------------------------------------- */
  const scrollXpFill = document.getElementById('scroll-xp-bar');
  const scrollXpPercent = document.getElementById('scroll-xp-percent');
  const hudNav = document.getElementById('hud-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  function handleScroll() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.min(Math.round((scrollY / docHeight) * 100), 100) : 0;

    if (scrollXpFill) scrollXpFill.style.width = `${scrollPercent}%`;
    if (scrollXpPercent) scrollXpPercent.textContent = `${scrollPercent}%`;

    if (hudNav) {
      if (scrollY > 40) {
        hudNav.classList.add('scrolled');
      } else {
        hudNav.classList.remove('scrolled');
      }
    }

    sections.forEach((sec) => {
      const top = sec.offsetTop - 120;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* Mobile Nav Toggle */
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-open');
      });
    });
  }

  /* --------------------------------------------------------------------------
     6. INTERACTIVE SKILL TREE TOOLTIPS
     -------------------------------------------------------------------------- */
  const skillTooltip = document.getElementById('skill-tooltip');
  const tooltipTitle = document.getElementById('tooltip-title');
  const tooltipLevel = document.getElementById('tooltip-level');
  const tooltipProjects = document.getElementById('tooltip-projects');
  const tooltipStatus = document.getElementById('tooltip-status');

  const skillNodes = document.querySelectorAll('.skill-node, .unlock-node');

  skillNodes.forEach((node) => {
    node.addEventListener('mousemove', (e) => {
      if (!skillTooltip) return;

      const name = node.getAttribute('data-skill') || 'UNKNOWN';
      const level = node.getAttribute('data-level') || node.getAttribute('data-xp') ? `${node.getAttribute('data-xp')} XP` : '--';
      const projects = node.getAttribute('data-projects') || node.getAttribute('data-details') || '--';
      const status = node.getAttribute('data-status') || '--';

      if (tooltipTitle) tooltipTitle.textContent = name;
      if (tooltipLevel) tooltipLevel.textContent = `METRIC: ${level}`;
      if (tooltipProjects) tooltipProjects.textContent = `SCOPE: ${projects}`;
      if (tooltipStatus) tooltipStatus.textContent = `STATUS: ${status}`;

      skillTooltip.classList.remove('hidden');

      const tooltipWidth = skillTooltip.offsetWidth;
      const tooltipHeight = skillTooltip.offsetHeight;

      let left = e.clientX + 15;
      let top = e.clientY + 15;

      if (left + tooltipWidth > window.innerWidth) {
        left = e.clientX - tooltipWidth - 15;
      }
      if (top + tooltipHeight > window.innerHeight) {
        top = e.clientY - tooltipHeight - 15;
      }

      skillTooltip.style.left = `${left}px`;
      skillTooltip.style.top = `${top}px`;
    });

    node.addEventListener('mouseleave', () => {
      if (skillTooltip) skillTooltip.classList.add('hidden');
    });
  });

  /* --------------------------------------------------------------------------
     7. INTERACTIVE COMMAND TERMINAL
     -------------------------------------------------------------------------- */
  const termScreen = document.getElementById('terminal-screen');
  const termInput = document.getElementById('terminal-input');
  const quickBtns = document.querySelectorAll('.quick-cmd-btn');

  function appendTermOutput(text, type = 'output') {
    if (!termScreen) return;
    const line = document.createElement('div');
    line.className = `term-line ${type}`;
    line.innerHTML = text;
    termScreen.appendChild(line);
    termScreen.scrollTop = termScreen.scrollHeight;
  }

  function executeCommand(cmdRaw) {
    const cmd = cmdRaw.trim().toLowerCase();
    if (!cmd) return;

    appendTermOutput(`<span class="term-prompt">DEVAARYA@PORTFOLIO:~$</span> <span class="term-cmd">${cmdRaw}</span>`);

    switch (cmd) {
      case 'help':
        appendTermOutput(`Available commands:
  • <span class="term-cmd">about</span> - Navigate to Player Profile
  • <span class="term-cmd">quests</span> - View Project Quests
  • <span class="term-cmd">skills</span> - Inspect Skill Tree
  • <span class="term-cmd">achievements</span> - View Badges & Certifications
  • <span class="term-cmd">education</span> - View Academic Timeline
  • <span class="term-cmd">contact</span> - Contact Mission Control
  • <span class="term-cmd">status</span> - Check System Diagnostics
  • <span class="term-cmd">clear</span> - Clear Terminal Screen
  • <span class="term-cmd">matrix</span> - Execute Digital Rain
  • <span class="term-cmd">secret</span> - Hint for Godmode`);
        break;

      case 'about':
        appendTermOutput('Navigating to Player Profile...', 'success');
        document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
        break;

      case 'quests':
        appendTermOutput('Opening Quest Log...', 'success');
        document.getElementById('quests')?.scrollIntoView({ behavior: 'smooth' });
        break;

      case 'skills':
        appendTermOutput('Loading Skill Tree Spec...', 'success');
        document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' });
        break;

      case 'achievements':
        appendTermOutput('Displaying Unlocked Achievements...', 'success');
        document.getElementById('achievements')?.scrollIntoView({ behavior: 'smooth' });
        break;

      case 'education':
        appendTermOutput('Viewing Academic Mission Timeline...', 'success');
        document.getElementById('education')?.scrollIntoView({ behavior: 'smooth' });
        break;

      case 'contact':
        appendTermOutput('Connecting to Mission Control...', 'success');
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        break;

      case 'status':
        appendTermOutput(`SYSTEM DIAGNOSTICS:
  PLAYER: Boya Devaarya
  LEVEL: 18
  DISCIPLINE: B.Tech AI & Data Science (REVA University)
  STATUS: ONLINE ●
  SYSTEM HEALTH: 100% (READY FOR NEW QUESTS)`, 'success');
        break;

      case 'clear':
        if (termScreen) termScreen.innerHTML = '';
        break;

      case 'matrix':
        appendTermOutput('Executing Matrix Protocol...', 'success');
        let count = 0;
        const interval = setInterval(() => {
          const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          appendTermOutput(`0x${hex}`, 'success');
          count++;
          if (count > 6) clearInterval(interval);
        }, 80);
        break;

      case 'secret':
      case 'konami':
        appendTermOutput('HINT: Try pressing <span class="term-cmd">↑ ↑ ↓ ↓ ← → ← → B A</span> on your keyboard.', 'prompt');
        break;

      case 'whoami':
        appendTermOutput('PLAYER_01 // GUEST VISITOR', 'output');
        break;

      case 'sudo':
        appendTermOutput('Permission denied: You are not root, but Boya Devaarya appreciates your curiosity.', 'error');
        break;

      default:
        appendTermOutput(`Command not recognized: '<span class="term-cmd">${cmdRaw}</span>'. Type '<span class="term-cmd">help</span>' for available options.`, 'error');
        break;
    }
  }

  if (termInput) {
    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeCommand(termInput.value);
        termInput.value = '';
      }
    });
  }

  quickBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd) executeCommand(cmd);
    });
  });

  /* --------------------------------------------------------------------------
     8. KONAMI CODE EASTER EGG (SECRET DEVAARYA MODE)
     -------------------------------------------------------------------------- */
  const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  let konamiIndex = 0;

  const secretModal = document.getElementById('secret-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const secretOkBtn = document.getElementById('secret-ok-btn');

  function unlockSecretMode() {
    if (secretModal) {
      secretModal.classList.remove('hidden');
      playSound('secret');
      const levelEl = document.querySelector('.player-info .level');
      if (levelEl) levelEl.textContent = '19 (GODMODE)';
    }
  }

  window.addEventListener('keydown', (e) => {
    const key = e.key;
    const requiredKey = konamiSequence[konamiIndex];

    if (key.toLowerCase() === requiredKey.toLowerCase()) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) {
        unlockSecretMode();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => secretModal?.classList.add('hidden'));
  }
  if (secretOkBtn) {
    secretOkBtn.addEventListener('click', () => secretModal?.classList.add('hidden'));
  }

  /* --------------------------------------------------------------------------
     9. HUD FPS COUNTER METRIC
     -------------------------------------------------------------------------- */
  const fpsCounter = document.getElementById('fps-counter');
  let frameCount = 0;
  let lastTime = performance.now();

  function calcFPS() {
    const now = performance.now();
    frameCount++;
    if (now - lastTime >= 1000) {
      if (fpsCounter) fpsCounter.textContent = Math.round((frameCount * 1000) / (now - lastTime));
      frameCount = 0;
      lastTime = now;
    }
    requestAnimationFrame(calcFPS);
  }
  calcFPS();

  /* --------------------------------------------------------------------------
     10. SAFE INTERSECTION OBSERVER FOR XP PROGRESS BARS
     -------------------------------------------------------------------------- */
  const observerOptions = {
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Ensure progress bars animate safely to their target data-progress value
        const bars = entry.target.querySelectorAll('.xp-fill, .mini-bar-fill, .skill-bar-fill, .unlock-fill');
        bars.forEach((bar) => {
          const target = bar.getAttribute('data-progress');
          if (target && !bar.dataset.animated) {
            bar.dataset.animated = 'true';
            bar.style.width = '0%';
            requestAnimationFrame(() => {
              setTimeout(() => {
                bar.style.width = target;
              }, 80);
            });
          }
        });
      }
    });
  }, observerOptions);

  document.querySelectorAll('section, .glass-panel').forEach((el) => {
    observer.observe(el);
  });

  // Initial trigger for top/hero bars immediately
  setTimeout(() => {
    document.querySelectorAll('.hero-section .xp-fill, .hero-section .mini-bar-fill').forEach((bar) => {
      const target = bar.getAttribute('data-progress');
      if (target) bar.style.width = target;
    });
  }, 100);

})();
