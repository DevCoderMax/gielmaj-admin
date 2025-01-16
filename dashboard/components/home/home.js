import config from '../../../config.js';

let transactionsChart;

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
                acc.todayValue += isOutput ? -value : value;
            }
            
            return acc;
        }, { todayTransactions: 0, todayValue: 0, totalValue: 0 });

        // Atualizar elementos do DOM
        document.getElementById('todayTransactions').textContent = stats.todayTransactions;
        document.getElementById('todayValue').textContent = formatCurrency(stats.todayValue);
        document.getElementById('totalValue').textContent = formatCurrency(stats.totalValue);

        // Atualizar o gráfico
        updateTransactionsChart(transactions);

    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
        showNotification('Erro ao atualizar dados do dashboard', 'error');
    }
}

function updateTransactionsChart(transactions) {
    // Ordenar transações por data
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Preparar dados para o gráfico
    const chartData = sortedTransactions.map(t => ({
        x: new Date(t.date),
        y: t.type === 'output' ? -t.value : t.value
    }));

    // Acumular valores
    let accumulator = 0;
    const accumulatedData = chartData.map(point => {
        accumulator += point.y;
        return {
            x: point.x,
            y: accumulator
        };
    });

    const ctx = document.getElementById('transactionsChart');
    
    if (transactionsChart) {
        transactionsChart.destroy();
    }

    transactionsChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Valor Total Acumulado',
                data: accumulatedData,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Total: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        displayFormats: {
                            hour: 'dd/MM HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Data/Hora'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Valor Total (R$)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
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
