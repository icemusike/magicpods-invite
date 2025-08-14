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

    // Redirect to webinar registration with query params to prefill
    const qs = new URLSearchParams({ fullname: firstName, email }).toString();
    window.location.href = `webinar-registration.html?${qs}#webinar-optin`;

    // If redirect is blocked, preserve original step behavior as fallback
    try {
        currentStep.classList.remove('active');
        nextStepEl.classList.add('active');
        stepIndicators[0].classList.remove('active');
        stepIndicators[1].classList.add('active');
        setTimeout(() => {
            const keyEl = document.getElementById('goldenKey');
            if (keyEl) keyEl.focus();
        }, 100);
    } catch (_) {}
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
    
    const firstName = document.getElementById('firstName').value.trim();
    const email = document.getElementById('email').value.trim();
    const goldenKey = document.getElementById('goldenKey').value.trim();
    const submitBtn = e.target.querySelector('.btn-activate');
    const console = document.getElementById('keyConsole');
    
    // Validate inputs
    if (!firstName || !email || !goldenKey) {
        showError('Please fill in all required fields');
        return;
    }
    
    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating...';
    submitBtn.disabled = true;
    
    // Show console and start validation animation
    console.classList.add('show');
    addConsoleMessage('🔍 Connecting to MagicPods AI validation server...');
    
    try {
        // Add console messages for validation process
        await new Promise(resolve => setTimeout(resolve, 800));
        addConsoleMessage('📡 Sending Golden Key for verification...');
        
        await new Promise(resolve => setTimeout(resolve, 600));
        addConsoleMessage(`🔐 Validating key: ${goldenKey}`);
        
        // Make API call to validate the golden key
        const encodedKey = encodeURIComponent(goldenKey);
        const response = await fetch(`https://api.magicpodsai.com/app/voucher-validate?code=${encodedKey}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        if (result.isValid && result.isRedeemable) {
            // Success case - valid and redeemable
            addConsoleMessage('✅ Golden Key validated successfully!');
            addConsoleMessage('🎉 Key is available for redemption!');
            addConsoleMessage('🚀 Activating your MagicPods AI access...');
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Track successful signup
            trackSignup(email, firstName);
            
            // Show success with confetti
            showSuccessWithConfetti(`🎉 Congratulations ${firstName}! Your Golden Key has been activated successfully!`);
            
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Activated';
            
        } else if (result.isValid && !result.isRedeemable) {
            // Key is valid but already claimed
            addConsoleMessage('⚠️ Golden Key validated but already redeemed.');
            addConsoleMessage('🔒 This key has been claimed already.');
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            showErrorWithWebinarCTA('Golden Key has been claimed already - Register for Webinar to get another chance!');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
        } else {
            // Invalid key
            addConsoleMessage('❌ Golden Key validation failed.');
            addConsoleMessage('🚫 Invalid or expired key.');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            showError('Invalid Golden Key. Please check your invitation email for the correct code.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Validation error:', error);
        addConsoleMessage('❌ Network error occurred.');
        addConsoleMessage('🔄 Please check your connection and try again.');
        
        showError('Network error. Please check your connection and try again.');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
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
    
    if (key.length <= 6) {
        console.classList.remove('show');
        return;
    }
    
    console.classList.add('show');
    consoleContent.innerHTML = '';
    
    const messages = [
        { text: '> Initializing Golden Key validation...', type: 'info', delay: 0 },
        { text: '> Connecting to MagicPods AI servers...', type: 'info', delay: 800 },
        { text: '> Key format: PROCESSING ⏳', type: 'success', delay: 1600 },
        { text: '> Checking key authenticity...', type: 'warning', delay: 2400 }
    ];
    
    // Add more specific validation based on key length
    if (key.length >= 6) {
        messages.push(
            { text: '> Scanning quantum database...', type: 'info', delay: 3200 },
            { text: '> Cross-referencing invitation logs...', type: 'warning', delay: 4000 },
            { text: '> Status: ⏳ VALIDATION PENDING', type: 'warning', delay: 4800 }
        );
    } else {
        messages.push(
            { text: '> Key incomplete...', type: 'warning', delay: 3200 }
        );
    }
    
    // Display messages with delays
    messages.forEach((message, index) => {
        setTimeout(() => {
            addConsoleMessage(message.text, message.type);
        }, message.delay);
    });
}

function addConsoleMessage(text, type = 'info') {
    const consoleContent = document.getElementById('consoleContent');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = text;
    
    consoleContent.appendChild(line);
    
    // Auto scroll to bottom
    const console = document.getElementById('keyConsole');
    console.scrollTop = console.scrollHeight;
    
    // Add animation delay
    setTimeout(() => {
        line.style.animationDelay = '0s';
    }, 100);
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