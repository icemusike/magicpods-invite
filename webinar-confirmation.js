// Enhanced Webinar Confirmation Page Script

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initConfirmationCountdown();
    initCalendarButtons();
    initShareButtons();
    initIdeaForm();
    initAnimations();
    initInteractiveEffects();
    addEnhancedStyling();
    personalizeConfirmationHeader();
});

function initConfirmationCountdown() {
    const countdownEl = document.getElementById('confirm-timer');
    if (!countdownEl) return;

    // Set the webinar date - August 23, 2025 10:00 AM ET (EDT is UTC-4)
    const webinarDate = new Date('2025-08-23T10:00:00-04:00').getTime();

    // Create static timer structure once
    countdownEl.innerHTML = `
        <div class="timer-item">
            <span class="timer-number" id="days-timer">00</span>
            <span class="timer-label">Days</span>
        </div>
        <div class="timer-item">
            <span class="timer-number" id="hours-timer">00</span>
            <span class="timer-label">Hours</span>
        </div>
        <div class="timer-item">
            <span class="timer-number" id="minutes-timer">00</span>
            <span class="timer-label">Minutes</span>
        </div>
        <div class="timer-item">
            <span class="timer-number" id="seconds-timer">00</span>
            <span class="timer-label">Seconds</span>
        </div>
    `;

    // Get references to number elements
    const daysEl = document.getElementById('days-timer');
    const hoursEl = document.getElementById('hours-timer');
    const minutesEl = document.getElementById('minutes-timer');
    const secondsEl = document.getElementById('seconds-timer');

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = webinarDate - now;

        if (distance < 0) {
            countdownEl.innerHTML = '<div class="timer-ended" style="font-size: 2rem; color: #ef4444; font-weight: 800;">🎉 The webinar has started!</div>';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update only the numbers, keeping structure intact
        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function initCalendarButtons() {
    const calendarButtons = document.querySelector('.calendar-buttons');
    if (!calendarButtons) return;

    calendarButtons.addEventListener('click', function(e) {
        e.preventDefault();
        const target = e.target.closest('.btn-calendar');
        if (!target) return;

        // Add click animation
        addClickAnimation(target);

        const calType = target.dataset.cal;
        
        const eventDetails = {
            title: 'MagicPods AI Launch Webinar - Live Demo',
            startTime: '2025-08-23T10:00:00-04:00',
            endTime: '2025-08-23T11:00:00-04:00',
            description: '🎙️ Join us for the live launch of MagicPods AI! Watch us turn any text into a professional video podcast in real-time. Chance to win 1 of 10 FREE lifetime licenses! Your unique join link has been emailed.',
            location: 'Online Webinar'
        };

        let url = '';

        switch (calType) {
            case 'google':
                url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.title)}&dates=${formatDateForGoogle(eventDetails.startTime)}/${formatDateForGoogle(eventDetails.endTime)}&details=${encodeURIComponent(eventDetails.description)}&location=${encodeURIComponent(eventDetails.location)}`;
                break;
            case 'outlook':
                url = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(eventDetails.title)}&startdt=${eventDetails.startTime}&enddt=${eventDetails.endTime}&body=${encodeURIComponent(eventDetails.description)}&location=${encodeURIComponent(eventDetails.location)}`;
                break;
            case 'ics':
                const icsContent = createICSFile(eventDetails);
                const blob = new Blob([icsContent], { type: 'text/calendar' });
                url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'magicpods-webinar.ics';
                a.click();
                URL.revokeObjectURL(url);
                showToast('Calendar file downloaded! 📅', 'success');
                return;
        }
        
        if (url) {
            window.open(url, '_blank');
            showToast(`Opening ${calType.charAt(0).toUpperCase() + calType.slice(1)} Calendar...`, 'success');
        }
    });
}

function initShareButtons() {
    const shareButtons = document.querySelector('.share-buttons');
    if (!shareButtons) return;

    shareButtons.addEventListener('click', function(e) {
        e.preventDefault();
        const target = e.target.closest('.btn-share');
        if (!target) return;

        // Add click animation
        addClickAnimation(target);

        const network = target.dataset.net;
        const shareUrl = window.location.origin + '/webinar-registration.html';
        const shareText = '🚀 I just registered for the MagicPods AI Launch Webinar on Aug 19 @ 6 PM ET! Watch them build a podcast in 60 minutes and enter to win FREE Golden Keys! 🎙️';
        let url = '';

        switch (network) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
                break;
            case 'linkedin':
                url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=MagicPods AI Launch Webinar&summary=${encodeURIComponent(shareText)}`;
                break;
            case 'email':
                url = `mailto:?subject=🎙️ You're Invited: MagicPods AI Launch Webinar&body=${encodeURIComponent(shareText + '\n\nRegister here: ' + shareUrl)}`;
                break;
            case 'sms':
                url = `sms:?&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(shareUrl).then(() => {
                    showToast('Link copied to clipboard! 📋', 'success');
                }).catch(() => {
                    showToast('Failed to copy link', 'error');
                });
                return;
        }

        if (url) {
            window.open(url, '_blank');
            showToast(`Sharing on ${network.charAt(0).toUpperCase() + network.slice(1)}...`, 'success');
        }
    });
}

function initIdeaForm() {
    const ideaForm = document.getElementById('idea-submit');
    if (!ideaForm) return;

    // Add real-time validation
    const podNameInput = ideaForm.querySelector('input[name="pod_name"]');
    const podDescInput = ideaForm.querySelector('textarea[name="pod_desc"]');

    // Add character counter for description
    if (podDescInput) {
        const counter = document.createElement('div');
        counter.style.cssText = 'font-size: 0.8rem; color: #6b7280; margin-top: 0.5rem; text-align: right;';
        podDescInput.parentNode.insertBefore(counter, podDescInput.nextSibling);
        
        function updateCounter() {
            const count = podDescInput.value.length;
            counter.textContent = `${count}/500 characters`;
            counter.style.color = count > 450 ? '#ef4444' : count > 300 ? '#f59e0b' : '#6b7280';
        }
        
        podDescInput.addEventListener('input', updateCounter);
        podDescInput.setAttribute('maxlength', '500');
        updateCounter();
    }

    ideaForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const submitBtn = ideaForm.querySelector('.btn-submit');
        
        // Enhanced validation
        const podName = podNameInput.value.trim();
        const podDesc = podDescInput.value.trim();
        
        if (!podName || podName.length < 3) {
            showToast('Podcast name must be at least 3 characters', 'error');
            podNameInput.focus();
            return;
        }
        
        if (!podDesc || podDesc.length < 10) {
            showToast('Description must be at least 10 characters', 'error');
            podDescInput.focus();
            return;
        }

        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span style="display: flex; align-items: center; gap: 0.5rem;"><span style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></span>Submitting...</span>';
        submitBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            submitBtn.innerHTML = '✅ Submitted!';
            showToast('Your idea has been submitted! 🎉 Adrian will review it for the live demo.', 'success');
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                ideaForm.reset();
                updateCounter();
            }, 2000);
        }, 1500);
    });
}

function initAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    document.querySelectorAll('.step-card, .host-card, .timer-item, .detail-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
}

function initInteractiveEffects() {
    // Enhanced hover effects
    document.querySelectorAll('.step-card, .host-card, .detail-item').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
    
    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            addRippleEffect(e, this);
        });
    });
    
    // Parallax effect for header
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const header = document.querySelector('.confirm-header');
        if (header) {
            header.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}

function addEnhancedStyling() {
    // Add dynamic CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .btn {
            position: relative;
            overflow: hidden;
            transform-style: preserve-3d;
        }
        
        .timer-item {
            transition: all 0.3s ease;
        }
        
        .timer-item:hover {
            transform: translateY(-5px) scale(1.05);
        }
        
        .step::before {
            transition: all 0.3s ease;
        }
        
        .host-image {
            transition: all 0.3s ease;
        }
        
        .confirm-header::after {
            animation: float 3s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);
}

function personalizeConfirmationHeader(){
    const params=new URLSearchParams(location.search);
    const fullname=params.get('fullname')||'';
    const keyValidParam = params.get('key_valid')||'';
    const keyValid = keyValidParam.toLowerCase() === 'true';
    
    console.log('Debug: key_valid parameter:', keyValidParam, 'evaluated as:', keyValid);
    const titleEl=document.getElementById('confirmTitle');
    const statusEl=document.getElementById('confirmStatus');
    const vipBadge=document.getElementById('vipBadge');
    const firstName=fullname?fullname.split(' ')[0]:'';
    
    if(titleEl){
        if(firstName){
            titleEl.innerHTML=`Congratulations <span class="banner-headline-span1">${firstName}</span> <br class="d-none d-lg-block"/> You're In & All Set For <span class="banner-headline-span1">MagicPods AI Webinar!</span>`;
        } else {
            titleEl.innerHTML=`Congratulations <br class="d-none d-lg-block"/> You're In & All Set For <span class="banner-headline-span1">MagicPods AI Webinar!</span>`;
        }
        
        if(keyValid && vipBadge){
            vipBadge.style.display='inline-flex';
        }
    }
    
    if(statusEl){
        statusEl.innerHTML='<span class="hero-lead-span">Watch this short video and get ready to see AI turn any text into <span class="w700">binge-worthy podcasts</span>—plus learn how you could win FREE VIP access!</span>';
    }

    // Handle VIP Access Section for Valid Key Holders
    console.log('Debug: Checking VIP access - keyValid:', keyValid, 'firstName:', firstName);
    if(keyValid){
        console.log('Debug: Initializing VIP section');
        initVIPAccessSection(firstName);
    } else {
        console.log('Debug: Key not valid, VIP section will not show');
    }
}

function initVIPAccessSection(firstName) {
    console.log('Debug: initVIPAccessSection called with firstName:', firstName);
    const vipSection = document.getElementById('vipAccessSection');
    const vipTitle = document.getElementById('vipTitle');
    const claimBtn = document.getElementById('claimAccountBtn');
    
    if(!vipSection) {
        console.log('Debug: VIP section element not found');
        return;
    }
    
    // Show the VIP section
    console.log('Debug: Showing VIP section');
    vipSection.style.display = 'block';
    
    // Personalize the title
    if(vipTitle && firstName){
        vipTitle.innerHTML = `Congratulations ${firstName} You've managed to Snatch a VIP Early Access Valid Golden Key!`;
    }
    
    // Get saved registerUrl from localStorage or sessionStorage
    const savedValidationData = getSavedValidationData();
    
    if(savedValidationData && savedValidationData.registerUrl){
        claimBtn.href = savedValidationData.registerUrl;
        claimBtn.target = '_blank';
        
        // Add click tracking
        claimBtn.addEventListener('click', function() {
            // Track the claim event
            console.log('VIP Account Claim clicked:', savedValidationData.registerUrl);
            showToast('🎉 Redirecting to your VIP account setup...', 'success');
        });
    } else {
        // Fallback if no saved data found
        claimBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('⚠️ Registration data not found. Please try activating your key again.', 'error');
        });
    }
    
    // Add entrance animation
    setTimeout(() => {
        vipSection.style.opacity = '0';
        vipSection.style.transform = 'translateY(30px)';
        vipSection.style.transition = 'all 0.8s ease-out';
        
        requestAnimationFrame(() => {
            vipSection.style.opacity = '1';
            vipSection.style.transform = 'translateY(0)';
        });
    }, 500);
}

function getSavedValidationData() {
    // Try to get from sessionStorage first (temporary), then localStorage (persistent)
    try {
        const sessionData = sessionStorage.getItem('magicpods_validation_data');
        if(sessionData) {
            return JSON.parse(sessionData);
        }
        
        const localData = localStorage.getItem('magicpods_validation_data');
        if(localData) {
            return JSON.parse(localData);
        }
        
        // Also try to get from URL parameters as fallback
        const params = new URLSearchParams(window.location.search);
        const registerUrl = params.get('register_url');
        if(registerUrl) {
            return { registerUrl: decodeURIComponent(registerUrl) };
        }
    } catch(e) {
        console.warn('Failed to parse saved validation data:', e);
    }
    
    return null;
}

// Helper Functions
function addClickAnimation(element) {
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
        element.style.transform = '';
    }, 150);
}

function addRippleEffect(e, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    `;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.5rem;">${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
        </div>
    `;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 16px;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        transform: translateX(120%);
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        max-width: 400px;
        word-wrap: break-word;
        font-size: 0.95rem;
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 400);
    }, 4000);
}

// Calendar helper functions
function formatDateForGoogle(dateTime) {
    return new Date(dateTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
}

function createICSFile(eventDetails) {
    const formatDateForICS = (dateTime) => new Date(dateTime).toISOString().replace(/-|:|\.\d\d\d/g, '') + 'Z';

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MagicPods//Webinar//EN',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@magicpods.ai`,
        `URL:${document.location.href}`,
        `DTSTART:${formatDateForICS(eventDetails.startTime)}`,
        `DTEND:${formatDateForICS(eventDetails.endTime)}`,
        `SUMMARY:${eventDetails.title}`,
        `DESCRIPTION:${eventDetails.description}`,
        `LOCATION:${eventDetails.location}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');
}