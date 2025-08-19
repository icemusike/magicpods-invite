// ================================
// WEBINAR REGISTRATION PAGE SCRIPT
// ================================

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initCountdownTimers();
    initWebinarForm();
    initRecentRegistrations();
    initScrollEffects();
    initFAQAccordion();

    // Prefill form fields from query params if present
    tryPrefillFromQuery();
});

// Countdown Timer Functionality
function initCountdownTimers() {
    // 6:00 PM ET (EDT in August) is 22:00 UTC
    const webinarDate = new Date('2025-08-19T22:00:00Z').getTime();
    
    // Update both top and bottom timers
    const topTimer = document.getElementById('top-timer');
    const bottomTimer = document.getElementById('bottom-timer');
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = webinarDate - now;
        
        if (distance < 0) {
            // Webinar has started
            updateTimerDisplay('top', 0, 0, 0, 0);
            updateTimerDisplay('bottom', 0, 0, 0, 0);
            return;
        }
        
        // Calculate time components
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Update both timers
        updateTimerDisplay('top', days, hours, minutes, seconds);
        updateTimerDisplay('bottom', days, hours, minutes, seconds);
    }
    
    function updateTimerDisplay(location, days, hours, minutes, seconds) {
        const prefix = location === 'top' ? 'top' : 'bottom';
        
        const daysEl = document.getElementById(`days-${prefix}`);
        const hoursEl = document.getElementById(`hours-${prefix}`);
        const minutesEl = document.getElementById(`minutes-${prefix}`);
        const secondsEl = document.getElementById(`seconds-${prefix}`);
        
        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    }
    
    // Update countdown every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Webinar Registration Form
function initWebinarForm() {
    const form = document.getElementById('webinar-optin');
    if (!form) return;
    
    form.addEventListener('submit', handleWebinarSubmit);
    
    // Add real-time validation
    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function tryPrefillFromQuery() {
    const form = document.getElementById('webinar-optin');
    if (!form) return;
    const params = new URLSearchParams(window.location.search);
    const fullname = params.get('fullname');
    const email = params.get('email');
    if (fullname) {
        const nameInput = form.querySelector('input[name="fullname"]');
        if (nameInput) nameInput.value = fullname;
    }
    if (email) {
        const emailInput = form.querySelector('input[name="email"]');
        if (emailInput) emailInput.value = email;
    }
}

async function handleWebinarSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('.btn-register');
    const fullName = (form.querySelector('input[name="firstName"]')?.value || form.querySelector('input[name="fullname"]')?.value || '').trim();
    const email = form.querySelector('input[name="email"]').value.trim();
    
    // Validate inputs
    if (!fullName || !email) {
        showFormError('Please fill in all required fields');
        return;
    }
    
    if (!isValidEmail(email)) {
        showFormError('Please enter a valid email address');
        return;
    }
    
    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    submitBtn.disabled = true;
    
    try {
        // Get affiliate tracking data
        const affiliateData = getAffiliateTracking();
        
        // Send registration to N8N
        await fetch('https://callflujent.app.n8n.cloud/webhook/b189d0e4-3bcc-4c54-893f-0fae5aaa1ed0', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
                event: 'webinar_registration',
                firstName: fullName,
                email,
                webinar_date: form.querySelector('input[name="webinar_date"]').value,
                page: window.location.href,
                referrer: document.referrer || undefined,
                timestamp: new Date().toISOString(),
                ...affiliateData
            })
        });
        
        // Track registration
        trackWebinarRegistration(email, fullName);
        // Update UI
        showRegistrationSuccess(fullName);
        updateRegistrationCount();
        // Build redirect URL passing user data and any key info from query
        const qp = new URLSearchParams(window.location.search);
        const hadKeyValid = qp.get('key_valid') || qp.get('keyValid') || 'false';
        const params = new URLSearchParams({ fullname: fullName, email, key_valid: hadKeyValid });
        setTimeout(() => {
            window.location.href = `webinar-confirmation.html?${params.toString()}`;
        }, 800);
        
    } catch (error) {
        console.error('Registration error:', error);
        showFormError('Registration failed. Please try again.');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    clearFieldError(e);
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    return true;
}

function clearFieldError(e) {
    const field = e.target;
    const errorEl = field.parentNode.querySelector('.field-error');
    if (errorEl) {
        errorEl.remove();
    }
    field.style.borderColor = '';
}

function showFieldError(field, message) {
    clearFieldError({ target: field });
    
    const errorEl = document.createElement('div');
    errorEl.className = 'field-error';
    errorEl.style.cssText = 'color: #ef4444; font-size: 0.8rem; margin-top: 0.25rem;';
    errorEl.textContent = message;
    
    field.style.borderColor = '#ef4444';
    field.parentNode.appendChild(errorEl);
}

function showFormError(message) {
    // Create or update error message
    let errorEl = document.querySelector('.form-error');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'form-error';
        errorEl.style.cssText = `
            background: #fef2f2;
            color: #dc2626;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            border: 1px solid #fecaca;
        `;
        
        const form = document.getElementById('webinar-optin');
        form.insertBefore(errorEl, form.firstChild);
    }
    
    errorEl.textContent = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorEl && errorEl.parentNode) {
            errorEl.parentNode.removeChild(errorEl);
        }
    }, 5000);
}

function showRegistrationSuccess(name) {
    const successEl = document.createElement('div');
    successEl.className = 'registration-success';
    successEl.style.cssText = `
        background: #f0fdf4;
        color: #166534;
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 1rem;
        text-align: center;
        font-weight: 600;
        border: 1px solid #bbf7d0;
        animation: slideDown 0.3s ease;
    `;
    
    successEl.innerHTML = `
        <i class="fas fa-check-circle" style="margin-right: 0.5rem; color: #10b981;"></i>
        Success! ${name}, you're registered for the webinar.
        <div style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.8;">
            Check your email for confirmation and webinar link.
        </div>
    `;
    
    const form = document.getElementById('webinar-optin');
    form.insertBefore(successEl, form.firstChild);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        if (successEl && successEl.parentNode) {
            successEl.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (successEl.parentNode) {
                    successEl.parentNode.removeChild(successEl);
                }
            }, 300);
        }
    }, 8000);
}

// Recent Registrations Simulation
function initRecentRegistrations() {
    const recentRegs = document.querySelector('.recent-regs');
    if (!recentRegs) return;
    
    const names = [
        'Sarah M.', 'Mike R.', 'Jessica L.', 'David K.', 'Emma S.',
        'John D.', 'Lisa W.', 'Chris P.', 'Amanda T.', 'Mark B.',
        'Rachel H.', 'Kevin L.', 'Sophia C.', 'Ryan M.', 'Nicole F.',
        'Daniel P.', 'Olivia R.', 'Ethan H.', 'Mia T.', 'Noah B.',
        'Ava S.', 'Liam C.', 'Isabella K.', 'Mason G.', 'Charlotte V.'
    ];

    // Shuffle helper for uniqueness cycles
    function shuffle(arr){
        for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()* (i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
        return arr;
    }
    let pool = shuffle(names.slice());
    let poolIdx = 0;
    function nextUniqueName(){
        if (poolIdx >= pool.length) { pool = shuffle(names.slice()); poolIdx = 0; }
        return pool[poolIdx++];
    }
    
    function updateRecentRegs() {
        const regItems = recentRegs.querySelectorAll('.reg-item');
        
        // Shift existing registrations down
        for (let i = regItems.length - 1; i > 0; i--) {
            const currentName = regItems[i - 1].querySelector('.reg-name').textContent;
            const currentTime = regItems[i - 1].querySelector('.reg-time').textContent;
            
            regItems[i].querySelector('.reg-name').textContent = currentName;
            regItems[i].querySelector('.reg-time').textContent = updateTime(currentTime);
        }
        
        // Add new registration at top
        const uniqueName = nextUniqueName();
        regItems[0].querySelector('.reg-name').textContent = uniqueName;
        regItems[0].querySelector('.reg-time').textContent = 'Just now';
        
        // Add animation
        regItems[0].style.animation = 'none';
        regItems[0].offsetHeight; // Trigger reflow
        regItems[0].style.animation = 'slideDown 0.3s ease';

        // Increment counters: "Already Registered X / Y" and remaining seats
        updateRegistrationCount();
    }
    
    function updateTime(timeStr) {
        if (timeStr === 'Just now') return '1 min ago';
        if (timeStr === '1 min ago') return '2 min ago';
        if (timeStr === '2 min ago') return '3 min ago';
        return timeStr;
    }
    
    // Ensure initial remaining seats reflects count (Y - X)
    (function syncInitialRemaining(){
        const countEl = document.querySelector('.registered-count strong');
        const remainingEl = document.querySelector('.seats-remaining');
        if (!countEl || !remainingEl) return;
        const match = countEl.textContent.match(/(\d+)\s*\/\s*(\d+)/);
        if (!match) return;
        const current = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);
        const remaining = Math.max(0, total - current);
        remainingEl.textContent = `Only ${remaining} spots remaining • live updating`;
    })();

    // Update registrations every 3 seconds
    setInterval(updateRecentRegs, 3000);
}

function updateRegistrationCount() {
    const countEl = document.querySelector('.registered-count strong');
    if (!countEl) return;
    
    const currentText = countEl.textContent;
    const match = currentText.match(/(\d+)\s*\/\s*(\d+)/);
    
    if (match) {
        const current = parseInt(match[1]);
        const total = parseInt(match[2]);
        const newCount = Math.min(current + 1, total);
        
        countEl.textContent = `${newCount} / ${total}`;
        
        // Update remaining seats
        const remainingEl = document.querySelector('.seats-remaining');
        if (remainingEl) {
            const remaining = total - newCount;
            remainingEl.textContent = `Only ${remaining} spots remaining • live updating`;
        }
        
        // Add animation
        countEl.style.animation = 'pulse 0.5s ease';
        setTimeout(() => {
            countEl.style.animation = '';
        }, 500);
    }
}

// Scroll Effects
function initScrollEffects() {
    // Smooth scrolling for anchor links
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
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'slideUp 0.6s ease forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.benefit-card, .host-card, .step-item, .bullet-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

// FAQ Accordion
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const summary = item.querySelector('.faq-question');
        
        summary.addEventListener('click', (e) => {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.hasAttribute('open')) {
                    otherItem.removeAttribute('open');
                }
            });
        });
    });
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function trackWebinarRegistration(email, name) {
    // Analytics tracking - replace with your analytics service
    if (typeof gtag !== 'undefined') {
        gtag('event', 'webinar_registration', {
            event_category: 'registration',
            event_label: 'webinar_signup',
            value: 1
        });
    }
    
    // You can also send to your backend
    console.log('Webinar registration tracked:', { email, name });
}

// CSS Animations (added via JavaScript)
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Get affiliate tracking data from URL or saved cookies/localStorage
function getAffiliateTracking() {
    const qs = new URLSearchParams(window.location.search);
    const getCookieData = () => {
        try {
            const c = document.cookie.split('; ').find(x => x.startsWith('mp_aff='));
            if (c) return JSON.parse(decodeURIComponent(c.split('=')[1]));
        } catch (_) { /* noop */ }
        try {
            const ls = localStorage.getItem('mp_aff');
            if (ls) return JSON.parse(ls);
        } catch (_) { /* noop */ }
        return null;
    };
    const saved = getCookieData() || {};

    const aidFromUrl = qs.get('aid');
    const subIdFromUrl = qs.get('tid') || qs.get('subid') || qs.get('sub_id') || qs.get('sid');
    const affiliateIdFromUrl = qs.get('aff') || qs.get('affiliate') || qs.get('affiliate_id') || qs.get('aff_id');

    const payload = {
        aff_source: saved.source || 'jvzoo',
        aff_key: saved.affKey || undefined,
        affiliate_id: affiliateIdFromUrl || saved.affVal || undefined,
        sub_key: saved.subKey || undefined,
        sub_id: subIdFromUrl || saved.subVal || undefined,
        aid: aidFromUrl || saved.aid || (saved.affKey === 'aid' ? saved.affVal : undefined),
        jvzoo_aff_id: saved.jvzoo_aff_id || undefined
    };
    return payload;
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCountdownTimers,
        initWebinarForm,
        isValidEmail,
        trackWebinarRegistration,
        getAffiliateTracking
    };
}