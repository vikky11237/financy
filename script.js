const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});

// Toast Function
function showToast(message) {
	const toast = document.getElementById("toast");
	toast.className = "toast show";
	toast.innerText = message;
	setTimeout(function () { toast.className = toast.className.replace("show", ""); }, 3000);
}

// Handle Signup
document.getElementById('signupForm').addEventListener('submit', async (e) => {
	e.preventDefault();
	const name = document.getElementById('signup-name').value;
	const email = document.getElementById('signup-email').value;
	const password = document.getElementById('signup-password').value;

	try {
		const response = await fetch('/signup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, email, password })
		});

		const contentType = response.headers.get("content-type");
		if (contentType && contentType.indexOf("application/json") !== -1) {
			const data = await response.json();
			if (response.ok) {
				showToast('Signup Successful! Please Sign In.');
				signInButton.click();
			} else {
				showToast(data.error || 'Signup failed');
			}
		} else {
			const text = await response.text();
			console.error('Non-JSON response:', text);
			showToast('Server error. Check console/logs.');
		}
	} catch (error) {
		console.error('Error:', error);
		showToast('An error occurred. Please try again.');
	}
});

// Handle Login
document.getElementById('signinForm').addEventListener('submit', async (e) => {
	e.preventDefault();
	const email = document.getElementById('signin-email').value;
	const password = document.getElementById('signin-password').value;

	try {
		const response = await fetch('/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		const data = await response.json();
		if (response.ok) {
			showToast('Login Successful! Redirecting...');
			setTimeout(() => {
				window.location.href = `dashboard.html?user=${encodeURIComponent(data.user.name)}`;
			}, 1000);
		} else {
			showToast(data.error);
		}
	} catch (error) {
		console.error('Error:', error);
		showToast('An error occurred. Please try again.');
	}
});
