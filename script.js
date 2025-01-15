import config from './config.js';

// Configuração das partículas
class Particle {
    constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.size = Math.random() * 2;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = `rgba(114, 137, 218, ${Math.random() * 0.5})`;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > window.innerWidth) this.x = 0;
        if (this.x < 0) this.x = window.innerWidth;
        if (this.y > window.innerHeight) this.y = 0;
        if (this.y < 0) this.y = window.innerHeight;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Inicialização do canvas e partículas
const particlesCanvas = document.createElement('canvas');
particlesCanvas.id = 'particlesCanvas';
document.querySelector('.particles').appendChild(particlesCanvas);
const ctx = particlesCanvas.getContext('2d');

function resizeCanvas() {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const particles = Array.from({ length: 50 }, () => new Particle());

function animate() {
    ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
    });
    requestAnimationFrame(animate);
}

animate();

// Gerenciamento do formulário
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const button = loginForm.querySelector('button');
    const originalText = button.innerHTML;
    
    try {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        button.disabled = true;
        
        // Chamada real para a API
        const response = await fetch(`${config.apiBaseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (data.success) {
            errorMessage.style.color = 'var(--success-color)';
            errorMessage.textContent = data.message;
            
            // Salva o ID e informações do usuário no sessionStorage
            sessionStorage.setItem('userId', data.user_id);
            sessionStorage.setItem('userInfo', JSON.stringify(data.user_info));
            
            // Adiciona efeito de sucesso
            loginForm.style.animation = 'success 0.5s ease';
            setTimeout(() => {
                window.location.href = '/dashboard/dashboard.html';
            }, 1000);
        } else {
            errorMessage.style.color = 'var(--error-color)';
            errorMessage.textContent = data.message;
            
            // Adiciona efeito de shake no formulário
            loginForm.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                loginForm.style.animation = '';
            }, 500);
        }
    } catch (error) {
        errorMessage.style.color = 'var(--error-color)';
        errorMessage.textContent = error.message || 'Erro ao tentar fazer login';
        
        // Adiciona efeito de shake no formulário
        loginForm.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            loginForm.style.animation = '';
        }, 500);
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;
    }
});

// Efeitos de animação para o formulário
document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', () => {
        input.parentElement.style.transform = 'scale(1)';
    });
});

// Adiciona keyframes para as animações
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    @keyframes success {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);