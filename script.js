// Enhanced landing page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initGoldenKeyActivation();
    initCountdownTimer();
    initProgressBars();
    initScrollAnimations();
    initHeaderScroll();
    initVideoPlayer();
    initUrgencyCounters();
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add success message element to DOM
    createSuccessMessage();
    
    // Initialize intersection observer styles
    initIntersectionStyles();
});

// N8N webhook endpoint for lead capture
const N8N_WEBHOOK_URL = 'https://callflujent.app.n8n.cloud/webhook-test/b189d0e4-3bcc-4c54-893f-0fae5aaa1ed0';

// State for automatic key validation on Step 2
let lastValidatedKey = '';
let isKeyValidating = false;
let validateKeyTimer = null;
let simulationTimeouts = [];

function clearSimulationTimeouts() {
    if (simulationTimeouts.length) {
        simulationTimeouts.forEach(id => clearTimeout(id));
        simulationTimeouts = [];
    }
}

function collectUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        utm_source: params.get('utm_source') || undefined,
        utm_medium: params.get('utm_medium') || undefined,
        utm_campaign: params.get('utm_campaign') || undefined,
        utm_term: params.get('utm_term') || undefined,
        utm_content: params.get('utm_content') || undefined
    };
}

function getAffiliateId() {
    const params = new URLSearchParams(window.location.search);
    return (
        params.get('aff') ||
        params.get('aff_id') ||
        params.get('aid') ||
        undefined
    );
}

function buildTagsForLead(utm) {
    const affiliateId = getAffiliateId();
    const tags = [];
    if (affiliateId) tags.push(`AFF_${affiliateId}`);
    if (utm.utm_source) tags.push(`SOURCE_${utm.utm_source}`);
    return tags;
}

async function sendLeadToN8N(payload) {
    try {
        await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        });
    } catch (err) {
        // Non-blocking failure; continue UX regardless
        console.warn('N8N webhook failed', err);
    }
}

// Golden Key Activation System
function initGoldenKeyActivation() {
    const activationForm = document.getElementById('activationForm');
    if (!activationForm) return;
    
    activationForm.addEventListener('submit', handleActivationSubmit);
}

function nextStep() {
    const currentStep = document.querySelector('.form-step.active');
    const nextStepEl = document.querySelector('.form-step[data-step="2"]');
    const stepIndicators = document.querySelectorAll('.step');
    
    // Validate current step
    const firstName = document.getElementById('firstName').value.trim();
    const email = document.getElementById('email').value.trim();
    if (!firstName || !email) {
        showError('Please fill in all fields');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    // Send lead to N8N (non-blocking)
    const utm = collectUtmParams();
    sendLeadToN8N({
        event: 'index_lead_submit_step1',
        firstName,
        email,
        page: window.location.href,
        referrer: document.referrer || undefined,
        ...utm,
        timestamp: new Date().toISOString()
    });

    // Proceed to Step 2 in-place
    currentStep.classList.remove('active');
    nextStepEl.classList.add('active');
    stepIndicators[0].classList.remove('active');
    stepIndicators[1].classList.add('active');
    setTimeout(() => {
        const keyEl = document.getElementById('goldenKey');
        if (keyEl) keyEl.focus();
    }, 100);
}

function prevStep() {
    const currentStep = document.querySelector('.form-step.active');
    const prevStep = document.querySelector('.form-step[data-step="1"]');
    const stepIndicators = document.querySelectorAll('.step');
    
    currentStep.classList.remove('active');
    prevStep.classList.add('active');
    
    stepIndicators[1].classList.remove('active');
    stepIndicators[0].classList.add('active');
}

async function handleActivationSubmit(e) {
    e.preventDefault();
    // On submit, trigger the same automatic flow used for live validation
    const goldenKey = document.getElementById('goldenKey').value.trim();
    if (goldenKey && goldenKey.length >= 6) {
        scheduleKeyValidation(goldenKey, true);
    }
}

// Email form submission handler
function handleEmailSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const emailInput = form.querySelector('input[type="email"]');
    const submitBtn = form.querySelector('button[type="submit"]');
    const email = emailInput.value.trim();
    
    // Basic email validation
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Joining...</span>';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Clear form
        emailInput.value = '';
        
        // Show success message
        showSuccess('🎉 Welcome to the waitlist! Check your email for updates.');
        
        // Track the signup (you can replace with actual analytics)
        trackSignup(email);
        
    }, 1500);
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Success message display
function showSuccess(message) {
    const successEl = document.getElementById('success-message');
    successEl.textContent = message;
    successEl.className = 'success-message show';
    
    setTimeout(() => {
        successEl.className = 'success-message';
    }, 5000);
}

// Success message with confetti animation
function showSuccessWithConfetti(message) {
    // Show success message
    showSuccess(message);
    
    // Create confetti effect
    createConfetti();
}

// Error message display
function showError(message) {
    const successEl = document.getElementById('success-message');
    successEl.textContent = message;
    successEl.className = 'success-message error show';
    
    setTimeout(() => {
        successEl.className = 'success-message';
    }, 4000);
}

// Error message with webinar CTA
function showErrorWithWebinarCTA(message) {
    const successEl = document.getElementById('success-message');
    successEl.innerHTML = `
        <div class="error-content">
            <div class="error-text">${message}</div>
            <a href="#webinar" class="webinar-cta-link">
                <i class="fas fa-video"></i>
                Register for Webinar
            </a>
        </div>
    `;
    successEl.className = 'success-message error show';
    
    setTimeout(() => {
        successEl.className = 'success-message';
    }, 8000);
}

// Confetti animation
function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
        confettiContainer.appendChild(confetti);
    }
    
    // Remove confetti after animation
    setTimeout(() => {
        confettiContainer.remove();
    }, 5000);
}

// Create success message element
function createSuccessMessage() {
    const successMessage = document.createElement('div');
    successMessage.id = 'success-message';
    successMessage.className = 'success-message';
    document.body.appendChild(successMessage);
    
    // Add styles for success message
    const style = document.createElement('style');
    style.textContent = `
        .success-message {
            position: fixed;
            top: 100px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            transform: translateX(400px);
            transition: transform 0.3s ease;
            z-index: 1001;
            max-width: 350px;
            font-weight: 500;
        }
        
        .success-message.show {
            transform: translateX(0);
        }
        
        .success-message.error {
            background: #ef4444;
        }
        
        @media (max-width: 768px) {
            .success-message {
                top: 80px;
                right: 10px;
                left: 10px;
                max-width: none;
                transform: translateY(-100px);
            }
            
            .success-message.show {
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// Header scroll effect
function handleHeaderScroll() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'none';
    }
}

// Intersection observer handler for animations
function handleIntersection(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            
            // Add special effect for stats
            if (entry.target.classList.contains('stat')) {
                animateNumber(entry.target);
            }
        }
    });
}

// Initialize intersection observer styles
function initIntersectionStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .feature-card, .testimonial-card, .stat, .stat-card {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .stat-card:nth-child(1) { transition-delay: 0.1s; }
        .stat-card:nth-child(2) { transition-delay: 0.2s; }
        .stat-card:nth-child(3) { transition-delay: 0.3s; }
        .stat-card:nth-child(4) { transition-delay: 0.4s; }
        
        .testimonial-card:nth-child(1) { transition-delay: 0.1s; }
        .testimonial-card:nth-child(2) { transition-delay: 0.3s; }
        .testimonial-card:nth-child(3) { transition-delay: 0.5s; }
    `;
    document.head.appendChild(style);
}

// Animate numbers in stats
function animateNumber(element) {
    const numberEl = element.querySelector('.stat-number');
    if (!numberEl || numberEl.dataset.animated) return;
    
    const finalText = numberEl.textContent;
    const hasPlus = finalText.includes('+');
    const hasSlash = finalText.includes('/');
    const hasSec = finalText.includes('sec');
    
    let targetNumber;
    if (hasSlash) {
        targetNumber = parseFloat(finalText);
    } else {
        targetNumber = parseInt(finalText.replace(/[^0-9]/g, ''));
    }
    
    if (isNaN(targetNumber)) return;
    
    numberEl.dataset.animated = 'true';
    
    let currentNumber = 0;
    const increment = targetNumber / 50;
    const timer = setInterval(() => {
        currentNumber += increment;
        
        if (currentNumber >= targetNumber) {
            currentNumber = targetNumber;
            clearInterval(timer);
        }
        
        if (hasSlash) {
            numberEl.textContent = currentNumber.toFixed(1) + '/5';
        } else if (hasSec) {
            numberEl.textContent = Math.floor(currentNumber) + ' sec';
        } else {
            numberEl.textContent = Math.floor(currentNumber).toLocaleString() + (hasPlus ? '+' : '');
        }
    }, 50);
}

// Wave animation for hero section
function initWaveAnimation() {
    const waveBars = document.querySelectorAll('.wave-bar');
    waveBars.forEach((bar, index) => {
        bar.style.animationDelay = `${index * 0.1}s`;
    });
}

// Typewriter effect for hero title
function initTypewriterEffect() {
    const titleElement = document.querySelector('.hero-title');
    if (!titleElement) return;
    
    const fullText = titleElement.innerHTML;
    titleElement.innerHTML = '';
    titleElement.style.opacity = '1';
    
    let index = 0;
    const typeSpeed = 50;
    
    function typeChar() {
        if (index < fullText.length) {
            titleElement.innerHTML += fullText.charAt(index);
            index++;
            setTimeout(typeChar, typeSpeed);
        }
    }
    
    // Start typing after a short delay
    setTimeout(typeChar, 500);
}

// Countdown Timer for Webinar
function initCountdownTimer() {
    // Set the date we're counting down to (August 19th, 10:00 AM EST)
    const countDownDate = new Date("Aug 19, 2025 10:00:00 EST").getTime();
    
    const timer = setInterval(function() {
        const now = new Date().getTime();
        const distance = countDownDate - now;
        
        // Time calculations
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Update DOM
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
        
        // If countdown is over
        if (distance < 0) {
            clearInterval(timer);
            if (daysEl) daysEl.textContent = "00";
            if (hoursEl) hoursEl.textContent = "00";
            if (minutesEl) minutesEl.textContent = "00";
            if (secondsEl) secondsEl.textContent = "00";
        }
    }, 1000);
}

// Initialize Progress Bars
function initProgressBars() {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        const progress = progressFill.getAttribute('data-progress');
        progressFill.style.width = progress + '%';
    }
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .testimonial-card, .stat, .scarcity-stats, .stat-card').forEach(el => {
        observer.observe(el);
    });
    
    // Add staggered animation for testimonial cards
    document.querySelectorAll('.testimonial-card').forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.2}s`;
    });
}

// Header Scroll Effect
function initHeaderScroll() {
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    const scarcityBar = document.querySelector('.sticky-scarcity-bar');

    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop) {
            // Downscroll
            header.style.top = '-80px';
            scarcityBar.style.top = '0';
        } else {
            // Upscroll
            header.style.top = '0';
            scarcityBar.style.top = '65px';
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
    });
}

// Video Player Initialization
function initVideoPlayer() {
    // Vimeo video is now embedded directly
    // Track video interactions if needed
    const videoWrapper = document.querySelector('.video-wrapper');
    if (videoWrapper) {
        videoWrapper.addEventListener('click', function() {
            trackEvent('Video Interaction');
        });
    }
}

// Urgency Counters (simulate real-time updates)
function initUrgencyCounters() {
    const joinedTodayEl = document.getElementById('joinedToday');
    if (joinedTodayEl) {
        let currentCount = 50;
        
        // Randomly increase the counter every 30-60 seconds
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance each interval
                currentCount += Math.floor(Math.random() * 3) + 1; // Increase by 1-3
                joinedTodayEl.textContent = currentCount;
                
                // Add animation effect
                joinedTodayEl.style.transform = 'scale(1.2)';
                joinedTodayEl.style.color = '#ef4444';
                
                setTimeout(() => {
                    joinedTodayEl.style.transform = 'scale(1)';
                    joinedTodayEl.style.color = '#ef4444';
                }, 300);
            }
        }, 30000); // Check every 30 seconds
    }
}

// Golden Key input simulation trigger
document.addEventListener('input', function(e) {
    if (e.target.id === 'goldenKey') {
        const value = e.target.value.trim();
        
        // Trigger console simulation only if there's meaningful input
        if (value.length > 3) {
            simulateKeyValidation(value);
            // Auto-start validation with debounce once key is reasonably complete
            if (value.length >= 6) {
                scheduleKeyValidation(value);
            }
        } else {
            // Hide console if input is too short
            const console = document.getElementById('keyConsole');
            console.classList.remove('show');
        }
    }
});

// Console simulation for Golden Key validation
function simulateKeyValidation(key) {
    const console = document.getElementById('keyConsole');
    const consoleContent = document.getElementById('consoleContent');
    const progress = document.getElementById('keyProgress');
    const progressFill = document.getElementById('keyProgressFill');
    
    if (key.length <= 6) {
        console.classList.remove('show');
        return;
    }
    
    console.classList.add('show');
    if (progress && progressFill && progress.classList.contains('show') === false) {
        progress.classList.add('show');
        progressFill.style.width = '18%';
        const id = setTimeout(()=>progressFill.style.width='30%', 150); simulationTimeouts.push(id);
    }
    // Prevent re-starting simulation while it's already running
    if (console.dataset.simulating === '1') {
        return;
    }
    console.dataset.simulating = '1';
    
    if (consoleContent.childElementCount === 0) {
        console.removeAttribute('data-lines');
        console.classList.remove('expanded');
    }
    
    const messages = [
        { text: 'Initializing Golden Key validation system...', type: 'info', delay: 0 },
        { text: 'Connecting to MagicPods AI validation node...', type: 'info', delay: 500 },
        { text: 'Negotiating secure channel (TLS 1.3)...', type: 'info', delay: 1000 },
        { text: 'Key format validation: PASSED ✓', type: 'success', delay: 1500 },
        { text: 'Performing authenticity checks (HMAC/SHA-256)...', type: 'info', delay: 2000 }
    ];
    
    // Add more specific validation based on key length
    if (key.length >= 8) {
        messages.push(
            { text: 'Scanning distributed validation database...', type: 'info', delay: 2500 },
            { text: 'Cross-referencing with invitation registry...', type: 'info', delay: 3000 },
            { text: 'Awaiting server validation response...', type: 'warning', delay: 3600 }
        );
    } else if (key.length >= 6) {
        messages.push(
            { text: 'Processing key with basic validation...', type: 'warning', delay: 2500 }
        );
    }
    
    // Display messages with delays
    messages.forEach((message) => {
        const id = setTimeout(() => {
            addConsoleMessage(message.text, message.type);
        }, message.delay);
        simulationTimeouts.push(id);
    });
}

function scheduleKeyValidation(value, immediate = false) {
    const submitBtn = document.querySelector('#activationForm .btn-activate');
    const progress = document.getElementById('keyProgress');
    const progressFill = document.getElementById('keyProgressFill');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating...';
    }
    if (progress && progressFill) {
        progress.classList.add('show');
        progressFill.style.width = '12%';
        setTimeout(()=>progressFill.style.width='35%', 150);
    }
    if (validateKeyTimer) {
        clearTimeout(validateKeyTimer);
    }
    validateKeyTimer = setTimeout(() => performKeyValidation(value), immediate ? 0 : 700);
}

async function performKeyValidation(goldenKey) {
    if (isKeyValidating || lastValidatedKey === goldenKey) return;
    const firstName = document.getElementById('firstName').value.trim();
    const email = document.getElementById('email').value.trim();
    const consoleEl = document.getElementById('keyConsole');
    const submitBtn = document.querySelector('#activationForm .btn-activate');
    const utm = collectUtmParams();
    const tags = buildTagsForLead(utm);
    
    if (!firstName || !email) {
        showError('Please complete Step 1 first.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Unlock My Free Access';
        }
        return;
    }
    
    // Stop any running simulation
    clearSimulationTimeouts();
    const consoleBox = document.getElementById('keyConsole');
    if (consoleBox) delete consoleBox.dataset.simulating;
    
    isKeyValidating = true;
    consoleEl.classList.add('show');
    addConsoleMessage('Establishing secure TLS connection...');
    await new Promise(r => setTimeout(r, 600));
    // Progress advance
    const progressFill = document.getElementById('keyProgressFill');
    if (progressFill) progressFill.style.width = '35%';
    addConsoleMessage('Authenticating with MagicPods validation endpoint...');
    await new Promise(r => setTimeout(r, 700));
    if (progressFill) progressFill.style.width = '60%';
    addConsoleMessage(`Transmitting encrypted key: ${goldenKey.substring(0,4)}****`);
    await new Promise(r => setTimeout(r, 600));
    if (progressFill) progressFill.style.width = '80%';
    addConsoleMessage('Running cryptographic validation algorithms...');

    try {
        const response = await fetch(`https://api.magicpodsai.com/app/voucher-validate?code=${encodeURIComponent(goldenKey)}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        await new Promise(r => setTimeout(r, 400));

        if (result.isValid && result.isRedeemable) {
            lastValidatedKey = goldenKey;
            await new Promise(r => setTimeout(r, 500));
            addConsoleMessage('Validation complete: KEY APPROVED ✓','success');
            await new Promise(r => setTimeout(r, 400));
            addConsoleMessage('Initializing VIP access privileges...','success');
            await new Promise(r => setTimeout(r, 300));
            if (progressFill) progressFill.style.width = '100%';
            addConsoleMessage('Account activation ready for deployment','success');

            // Build magic link if provided, otherwise fallback
            const magicLink = result.magicLink || `https://app.magicpodsai.com/onboarding?ml=${encodeURIComponent(goldenKey)}&n=${encodeURIComponent(firstName)}&e=${encodeURIComponent(email)}`;
            
            // Send tags + event to N8N
            sendLeadToN8N({
                event: 'index_key_valid_auto',
                firstName,
                email,
                goldenKey,
                tags: ['KEY_VALID', 'VIP_TRIAL_ACTIVE', ...tags],
                page: window.location.href,
                referrer: document.referrer || undefined,
                ...utm,
                timestamp: new Date().toISOString()
            });

            // Premium modal overlay for success
            openPremiumModal({
                variant: 'success',
                title: `🎉 Congrats, ${firstName}!`,
                body: `You just unlocked your VIP Early FREE Access to MagicPods.<br/><br/>Your VIP access runs through Aug 19, 2025. Join the live session at 10:00 AM Eastern • 7:00 AM Pacific • 3:00 PM GMT for pro tips and bonuses.`,
                actions: [
                    { label: 'Secure My Seat & Activate Account Now →', href: `webinar-registration.html?${new URLSearchParams({ fullname: firstName, email }).toString()}`, primary: true }
                ],
                headline: 'Important Next Step...'
            });
            showSuccessWithConfetti(`🎉 Congrats, ${firstName}! You just unlocked your VIP Early FREE Access to MagicPods AI`);
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Activated';
            }
        } else if (result.isValid && !result.isRedeemable) {
            // Already claimed
            addConsoleMessage('🔒 This key has been claimed already.','warning');
            await new Promise(r => setTimeout(r, 500));
            if (progressFill) progressFill.style.width = '100%';
            showInvalidOrClaimedUI(firstName, email, goldenKey, utm, tags, 'This key has already been claimed.');
        } else {
            // Invalid
            addConsoleMessage('❌ Invalid or expired key.','warning');
            await new Promise(r => setTimeout(r, 400));
            if (progressFill) progressFill.style.width = '100%';
            showInvalidOrClaimedUI(firstName, email, goldenKey, utm, tags, 'This key appears invalid or expired.');
        }
    } catch (error) {
        console.error('Validation error:', error);
        addConsoleMessage('❌ Network error occurred.');
        addConsoleMessage('🔄 Please check your connection and try again.');
        const progressFill = document.getElementById('keyProgressFill');
        if (progressFill) progressFill.style.width = '100%';
        // Premium warning modal for error/unknown status
        const qs = new URLSearchParams({ fullname: firstName, email }).toString();
        openPremiumModal({
            variant: 'warning',
            title: "We couldn't verify your key right now",
            body: 'This could be an invalid key or a temporary network issue. Join our VIP Launch Webinar on Aug 19 @ 10:00 AM Eastern to get another chance to win a Golden Key live.',
            actions: [
                { label: 'Register for the VIP Webinar', href: `webinar-registration.html?${qs}#webinar-optin`, target: '_blank', primary: true }
            ],
            boosters: true
        });
        // Track incident
        sendLeadToN8N({
            event: 'index_key_validation_error',
            firstName,
            email,
            goldenKey,
            page: window.location.href,
            referrer: document.referrer || undefined,
            ...utm,
            timestamp: new Date().toISOString()
        });
        const submitBtn = document.querySelector('#activationForm .btn-activate');
        if (submitBtn) {
            submitBtn.innerHTML = 'Try Another Key';
            submitBtn.disabled = false;
        }
    } finally {
        isKeyValidating = false;
        const progress = document.getElementById('keyProgress');
        if (progress) setTimeout(()=>progress.classList.remove('show'), 900);
    }
}

function showInvalidOrClaimedUI(firstName, email, goldenKey, utm, tags, headlineText) {
    const qs = new URLSearchParams({ fullname: firstName, email }).toString();
    const subHeadline = `Don't Worry — There's Still Hope To Grab One...<br/><strong>You could win 1 of 10 Golden Keys live.</strong>`;
    const countdown = `
        <div class="mp-countdown" id="mpCountdown">
            <div class="mpc-item"><div class="mpc-num" id="mpc-days">00</div><div class="mpc-label">Days</div></div>
            <div class="mpc-item"><div class="mpc-num" id="mpc-hours">00</div><div class="mpc-label">Hours</div></div>
            <div class="mpc-item"><div class="mpc-num" id="mpc-mins">00</div><div class="mpc-label">Minutes</div></div>
            <div class="mpc-item"><div class="mpc-num" id="mpc-secs">00</div><div class="mpc-label">Seconds</div></div>
        </div>
    `;
    openPremiumModal({
        variant: 'warning',
        title: 'This Key has already been claimed by someone else...',
        body: `${subHeadline}${countdown}`,
        actions: [
            { label: 'Secure My Seat Now', href: `webinar-registration.html?${qs}#webinar-optin`, target: '_blank', primary: true }
        ],
        boosters: false
    });
    // Start countdown inside modal
    startModalCountdown('Aug 19, 2025 10:00:00 EST');
    // Send lead with context
    sendLeadToN8N({
        event: headlineText.includes('claimed') ? 'index_key_redeemed_already' : 'index_key_invalid',
        firstName,
        email,
        goldenKey,
        tags: tags,
        page: window.location.href,
        referrer: document.referrer || undefined,
        ...utm,
        timestamp: new Date().toISOString()
    });
    const submitBtn = document.querySelector('#activationForm .btn-activate');
    if (submitBtn) {
        submitBtn.innerHTML = 'Try Another Key';
        submitBtn.disabled = false;
    }
}

function openPremiumModal({ variant = 'success', title = '', body = '', actions = [], boosters = false, headline = '' }) {
    const overlay = document.getElementById('mpModal');
    const card = document.getElementById('mpModalCard');
    const titleEl = document.getElementById('mpModalTitle');
    const bodyEl = document.getElementById('mpModalBody');
    const actionsEl = document.getElementById('mpModalActions');
    const closeBtn = document.getElementById('mpModalClose');

    card.classList.remove('success', 'warning');
    card.classList.add(variant);
    
    // Add icon before title
    const iconHtml = variant === 'success' 
        ? '<div class="mp-modal-icon"><i class="fas fa-check"></i></div>' 
        : '<div class="mp-modal-icon"><i class="fas fa-exclamation-triangle"></i></div>';
    
    titleEl.innerHTML = iconHtml + title;
    bodyEl.innerHTML = body;
    actionsEl.innerHTML = '';

    // Add headline if provided
    if (headline) {
        const headlineEl = document.createElement('div');
        headlineEl.className = 'mp-modal-headline';
        headlineEl.textContent = headline;
        headlineEl.style.cssText = 'font-size: 1rem; font-weight: 700; color: #6b7280; text-align: center; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;';
        actionsEl.appendChild(headlineEl);
    }

    actions.forEach(a => {
        const link = document.createElement('a');
        link.href = a.href || '#';
        if (a.target) link.target = a.target;
        link.textContent = a.label;
        link.className = a.primary ? 'mp-primary' : 'mp-secondary';
        actionsEl.appendChild(link);
    });

    if (boosters) {
        const boostersWrap = document.createElement('div');
        boostersWrap.className = 'mp-boosters';
        boostersWrap.innerHTML = `
            <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap; margin-bottom:12px;">
                <label>
                    <input type="checkbox" id="smsReminderChk"> Text me reminders
                </label>
                <label>
                    <input type="checkbox" id="telegramJoinChk"> Join our Telegram for instant alerts
                </label>
            </div>
            <div id="phoneReveal" style="display:none;">
                <input type="tel" id="smsPhone" placeholder="Your phone number">
            </div>
        `;
        actionsEl.appendChild(boostersWrap);

        const smsChk = boostersWrap.querySelector('#smsReminderChk');
        const phoneReveal = boostersWrap.querySelector('#phoneReveal');
        if (smsChk) {
            smsChk.addEventListener('change', () => {
                phoneReveal.style.display = smsChk.checked ? 'block' : 'none';
            });
        }
    }

    function close() {
        overlay.classList.remove('show');
    }
    overlay.classList.add('show');
    closeBtn.onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    document.addEventListener('keydown', function escListener(ev) {
        if (ev.key === 'Escape') {
            close();
            document.removeEventListener('keydown', escListener);
        }
    });
}

// Countdown utility for modal
function startModalCountdown(targetDateStr) {
    const target = new Date(targetDateStr).getTime();
    function update() {
        const now = new Date().getTime();
        let diff = Math.max(0, target - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff %= (1000 * 60 * 60 * 24);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff %= (1000 * 60 * 60);
        const mins = Math.floor(diff / (1000 * 60));
        diff %= (1000 * 60);
        const secs = Math.floor(diff / 1000);
        const dEl = document.getElementById('mpc-days');
        if (!dEl) return; // modal closed
        document.getElementById('mpc-days').textContent = String(days).padStart(2,'0');
        document.getElementById('mpc-hours').textContent = String(hours).padStart(2,'0');
        document.getElementById('mpc-mins').textContent = String(mins).padStart(2,'0');
        document.getElementById('mpc-secs').textContent = String(secs).padStart(2,'0');
        if (target - now > 0) setTimeout(update, 1000);
    }
    update();
}

function addConsoleMessage(text, type = 'info') {
    const consoleContent = document.getElementById('consoleContent');
    const consoleContainer = document.getElementById('keyConsole');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    
    // Create timestamp
    const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    // Pick icon based on type
    const icon = type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : type === 'error' ? 'fa-times-circle' : 'fa-terminal';
    line.innerHTML = `
        <i class="console-icon fas ${icon}"></i>
        <div class="console-line-content">${text}</div>
        <div class="console-line-timestamp">${timestamp}</div>
    `;
    
    consoleContent.appendChild(line);
    // Ensure the line remains visible and not overwritten
    line.style.willChange = 'transform, opacity';
    
    // Auto-expand based on line count with immediate effect
    const lineCount = consoleContent.querySelectorAll('.console-line').length;
    consoleContainer.setAttribute('data-lines', Math.min(lineCount + 1, 6).toString());
    if (lineCount >= 2) {
        consoleContainer.classList.add('expanded');
    }
    
    // Auto scroll to bottom with smooth behavior
    requestAnimationFrame(() => {
        consoleContent.scrollTop = consoleContent.scrollHeight + 200;
    });
    
    // Update cursor status
    const cursor = consoleContainer.querySelector('.console-cursor');
    if (cursor && type === 'success') {
        cursor.innerHTML = '<i class="fas fa-check-circle"></i> Validation complete';
        cursor.style.color = '#10b981';
    } else if (cursor && (type === 'warning' || type === 'error')) {
        cursor.innerHTML = '<i class="fas fa-exclamation-circle"></i> Process complete';
        cursor.style.color = '#f59e0b';
    }
}

// Track signup (replace with actual analytics)
function trackSignup(email) {
    console.log('Signup tracked:', email);
    trackEvent('Golden Key Activation', { email });
}

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        if (e.target.matches('input[type="email"]')) {
            e.target.closest('form').dispatchEvent(new Event('submit'));
        } else if (e.target.id === 'fullName') {
            nextStep();
        }
    }
});

// Add loading state for page
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    const style = document.createElement('style');
    style.textContent = `
        body {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        body.loaded {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
});

// Analytics helper
function trackEvent(eventName, properties = {}) {
    console.log(`Event: ${eventName}`, properties);
}

// Track page interactions
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        trackEvent('Navigation Click', {
            link: e.target.getAttribute('href'),
            text: e.target.textContent
        });
    }
    
    if (e.target.closest('.feature-card')) {
        trackEvent('Feature Card Click', {
            feature: e.target.closest('.feature-card').querySelector('h3').textContent
        });
    }
    
    if (e.target.closest('.webinar-cta-btn')) {
        trackEvent('Webinar Registration Click');
    }
});