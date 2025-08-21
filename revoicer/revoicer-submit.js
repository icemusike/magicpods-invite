(function(){
	// Ensure we only affect the Revoicer page
	document.addEventListener('DOMContentLoaded', function() {
		var form = document.querySelector('form.webinar-optin');
		if (!form) return;

		// Intercept before any bubbling listeners (from shared scripts)
		form.addEventListener('submit', async function(e){
			try {
				// Stop other listeners from handling this submit
				e.preventDefault();
				e.stopPropagation();
				if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

				var firstNameInput = form.querySelector('input[name="firstName"], input#firstName');
				var emailInput = form.querySelector('input[name="email"]');
				var submitBtn = form.querySelector('.btn-register');

				var firstName = (firstNameInput && firstNameInput.value || '').trim();
				var email = (emailInput && emailInput.value || '').trim();

				if (!firstName || !email) {
					alert('Please enter your name and email.');
					return;
				}
				var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(email)) {
					alert('Please enter a valid email address.');
					return;
				}

				var originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
				if (submitBtn) {
					submitBtn.disabled = true;
					submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
				}

				var payload = {
					firstName: firstName,
					email: email,
					page: window.location.href,
					source: 'revoicer'
				};

				var resp = await fetch('https://callflujent.app.n8n.cloud/webhook/6603d99b-0c38-4dd5-bb74-c80050ed00ac', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					keepalive: true,
					body: JSON.stringify(payload)
				});

				if (!resp.ok) {
					throw new Error('Webhook response not OK');
				}

				// On success, redirect to confirmation with params (project root)
				var qs = new URLSearchParams({ fullname: firstName, email: email });
				window.location.href = '../webinar-confirmation-rv.html?' + qs.toString();
			} catch (err) {
				console.error('Revoicer submit error:', err);
				alert('Registration failed. Please try again.');
			} finally {
				if (submitBtn) {
					submitBtn.innerHTML = originalBtnHtml;
					submitBtn.disabled = false;
				}
			}
		}, true);
	});
})();


