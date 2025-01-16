import config from '../../../config.js';

export async function updateDashboardData() {
    try {
        // Atualizar nome do usuário
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
        const userName = document.getElementById('userName');
        if (userName && userInfo.display_name) {
            userName.textContent = userInfo.display_name;
        }

        // Buscar todas as transações
        const response = await fetch(`${config.apiBaseUrl}/transactions`);
        if (!response.ok) throw new Error('Falha ao carregar dados do dashboard');
        
        const transactions = await response.json();
        
        // Calcular estatísticas
        const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        const stats = transactions.reduce((acc, transaction) => {
            const transactionDate = transaction.date.split('T')[0];
            const value = parseFloat(transaction.value) || 0;
            const isOutput = transaction.type === 'output';
            
            // Adicionar ou subtrair do total geral baseado no tipo
            acc.totalValue += isOutput ? -value : value;
            
            // Se for uma transação de hoje
            if (transactionDate === today) {
                acc.todayTransactions++;
                // Adicionar ou subtrair do total de hoje baseado no tipo
                acc.todayValue += isOutput ? -value : value;
            }
            
            return acc;
        }, {
            todayTransactions: 0,
            todayValue: 0,
            totalValue: 0
        });
        
        // Atualizar dados nos cards
        document.getElementById('todayTransactions').textContent = stats.todayTransactions;
        document.getElementById('todayValue').textContent = formatCurrency(stats.todayValue);
        document.getElementById('totalValue').textContent = formatCurrency(stats.totalValue);
    } catch (error) {
        console.error('Erro ao atualizar dados do dashboard:', error);
        showNotification('Erro ao carregar dados do dashboard', 'error');
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            container.removeChild(notification);
            if (container.children.length === 0) {
                document.body.removeChild(container);
            }
        }, 300);
    }, 3000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    document.body.appendChild(container);
    return container;
}
