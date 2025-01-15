import config from '../config.js';

// Garantir que a URL da API sempre use HTTPS
const apiBaseUrl = config.apiBaseUrl.replace('http://', 'https://');

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const leftMenu = document.getElementById('leftMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const modal = document.getElementById('transactionModal');
    const closeModal = document.querySelector('.close-modal');

    // Load initial dashboard data
    updateDashboardData();

    // Add event listeners for transaction filters
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');

    if (searchInput && filterSelect) {
        searchInput.addEventListener('input', updateTransactionsTable);
        filterSelect.addEventListener('change', updateTransactionsTable);
    }

    // Modal close button
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });

    // Toggle menu on mobile
    menuToggle.addEventListener('click', () => {
        leftMenu.classList.toggle('active');
    });

    // Close menu when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!leftMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                leftMenu.classList.remove('active');
            }
        }
    });

    // Logout functionality
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '../index.html';
        }
    });

    // Handle menu item clicks
    const menuItems = document.querySelectorAll('.menu-item a');
    menuItems.forEach(item => {
        if (!item.id.includes('logoutBtn')) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                menuItems.forEach(i => i.parentElement.classList.remove('active'));
                item.parentElement.classList.add('active');
                
                const contentArea = document.getElementById('contentArea');
                const href = item.getAttribute('href').replace('#', '');
                loadContent(href, contentArea);
            });
        }
    });

    // Elementos do modal de nova transação
    const newTransactionModal = document.getElementById('newTransactionModal');
    const newTransactionForm = document.getElementById('newTransactionForm');
    const addTransactionBtn = document.getElementById('addTransactionBtn');

    // Carregar serviços no select
    async function loadServices(selectId = 'transactionService', selectedValue = null) {
        try {
            const response = await fetch(`${apiBaseUrl}/services`);
            if (!response.ok) throw new Error('Falha ao carregar serviços');
            
            const services = await response.json();
            const serviceSelect = document.getElementById(selectId);
            
            // Limpar opções existentes
            serviceSelect.innerHTML = '<option value="">Selecione um serviço</option>';
            
            // Adicionar novas opções
            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.name;
                if (selectedValue && service.id === selectedValue) {
                    option.selected = true;
                }
                serviceSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
        }
    }

    // Abrir modal de nova transação
    addTransactionBtn.addEventListener('click', () => {
        newTransactionModal.classList.add('active');
        loadServices();
        
        // Definir data atual como padrão
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('transactionDate').value = now.toISOString().slice(0, 16);
    });

    // Fechar modal de nova transação
    document.querySelectorAll('[data-modal="newTransactionModal"]').forEach(button => {
        button.addEventListener('click', () => {
            newTransactionModal.classList.remove('active');
            newTransactionForm.reset();
        });
    });

    // Submeter nova transação
    newTransactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(newTransactionForm);
        const transaction = {
            date: new Date(formData.get('date')).toISOString(),
            description: formData.get('description'),
            value: parseFloat(formData.get('value')),
            type: formData.get('type'),
            service_id: formData.get('service_id') ? parseInt(formData.get('service_id')) : null,
            payment_method: formData.get('payment_method'),
            status: formData.get('status')
        };
        
        try {
            const response = await fetch(`${apiBaseUrl}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transaction)
            });
            
            if (!response.ok) throw new Error('Falha ao criar transação');
            
            // Fechar modal e atualizar tabela
            newTransactionModal.classList.remove('active');
            newTransactionForm.reset();
            updateTransactionsTable();
            showNotification('Transação adicionada com sucesso!');
        } catch (error) {
            console.error('Erro ao criar transação:', error);
            alert('Erro ao criar transação. Por favor, tente novamente.');
        }
    });

    // Function to load content
    function loadContent(page, contentArea) {
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => section.classList.remove('active'));

        switch(page) {
            case 'home':
                document.getElementById('homeContent').classList.add('active');
                updateDashboardData();
                break;
            case 'transactions':
                document.getElementById('transactionsContent').classList.add('active');
                updateTransactionsTable();
                break;
            default:
                document.getElementById('homeContent').classList.add('active');
                console.log('Page not found, showing home');
        }
    }

    // Function to update dashboard data
    async function updateDashboardData() {
        try {
            const response = await fetch(`${apiBaseUrl}/transactions`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const transactions = await response.json();
            
            const today = new Date().toISOString().split('T')[0];
            const todayTransactions = transactions.filter(t => 
                t.date.startsWith(today) && t.status === 'concluido'
            );
            
            const totalValue = todayTransactions.reduce((sum, t) => sum + t.value, 0);
            
            document.getElementById('todayTransactions').textContent = todayTransactions.length;
            document.getElementById('totalValue').textContent = formatCurrency(totalValue);
            
        } catch (error) {
            console.error('Error fetching transaction data:', error);
            document.getElementById('todayTransactions').textContent = '-';
            document.getElementById('totalValue').textContent = '-';
        }
    }

    // Function to update transactions table
    async function updateTransactionsTable() {
        const searchInput = document.querySelector('.search-input');
        const filterSelect = document.querySelector('.filter-select');
        const tableBody = document.getElementById('transactionsTableBody');
        
        if (!tableBody) return;
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const statusFilter = filterSelect ? filterSelect.value : 'all';

        try {
            const response = await fetch(`${apiBaseUrl}/transactions`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const transactions = await response.json();
            
            // Clear existing rows
            tableBody.innerHTML = '';
            
            // Filter and sort transactions
            const filteredTransactions = transactions
                .filter(transaction => {
                    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm);
                    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
                    return matchesSearch && matchesStatus;
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Add new rows
            filteredTransactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${transaction.id}</td>
                    <td>${formatTransactionType(transaction.type)}</td>
                    <td>${formatCurrency(transaction.value)}</td>
                    <td>${transaction.service_id || '-'}</td>
                    <td>${formatDate(transaction.date)}</td>
                    <td><span class="status-badge ${transaction.status}">${transaction.status}</span></td>
                    <td>
                        <button class="action-btn view-transaction" title="Ver detalhes" data-id="${transaction.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-transaction" title="Editar" data-id="${transaction.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-transaction" title="Deletar" data-id="${transaction.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                // Add click event for view button
                const viewButton = row.querySelector('.view-transaction');
                viewButton.addEventListener('click', () => showTransactionDetails(transaction));
                
                // Add click event for edit button
                const editButton = row.querySelector('.edit-transaction');
                editButton.addEventListener('click', () => showEditTransactionModal(transaction));
                
                // Add click event for delete button
                const deleteButton = row.querySelector('.delete-transaction');
                deleteButton.addEventListener('click', () => deleteTransaction(transaction.id));
                
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }

    // Function to delete transaction
    async function deleteTransaction(transactionId) {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
        
        try {
            const response = await fetch(`${apiBaseUrl}/transactions/${transactionId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            updateTransactionsTable();
            showNotification('Transação deletada com sucesso!');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Erro ao deletar transação');
        }
    }

    // Function to show transaction details
    function showTransactionDetails(transaction) {
        const modal = document.getElementById('transactionModal');
        if (!modal) return;

        // Update modal content
        document.getElementById('modalId').textContent = `#${transaction.id}`;
        document.getElementById('modalDescription').textContent = transaction.description;
        document.getElementById('modalType').textContent = formatTransactionType(transaction.type);
        document.getElementById('modalValue').textContent = formatCurrency(transaction.value);
        document.getElementById('modalPaymentMethod').innerHTML = `<span class="payment-badge ${transaction.payment_method}">${formatPaymentMethod(transaction.payment_method)}</span>`;
        document.getElementById('modalService').textContent = transaction.service_id || '-';
        document.getElementById('modalDate').textContent = formatDate(transaction.date);
        document.getElementById('modalStatus').innerHTML = `<span class="status-badge ${transaction.status}">${formatStatus(transaction.status)}</span>`;
        document.getElementById('modalCreatedAt').textContent = formatDate(transaction.created_at);
        document.getElementById('modalUpdatedAt').textContent = formatDate(transaction.updated_at);

        // Show modal
        modal.classList.add('active');
    }

    // Function to show edit transaction modal
    async function showEditTransactionModal(transaction) {
        const editModal = document.getElementById('editTransactionModal');
        const form = document.getElementById('editTransactionForm');
        
        // Preencher o formulário com os dados da transação
        document.getElementById('editTransactionId').value = transaction.id;
        document.getElementById('editTransactionDate').value = transaction.date.slice(0, 16); // Remove segundos
        document.getElementById('editTransactionDescription').value = transaction.description;
        document.getElementById('editTransactionValue').value = transaction.value;
        document.getElementById('editTransactionType').value = transaction.type;
        document.getElementById('editTransactionPayment').value = transaction.payment_method;
        document.getElementById('editTransactionStatus').value = transaction.status;
        
        // Carregar serviços e selecionar o atual
        await loadServices('editTransactionService', transaction.service_id);
        
        // Mostrar modal
        editModal.classList.add('active');
    }

    // Event listener para o formulário de edição
    document.getElementById('editTransactionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transactionId = formData.get('id');
        const transaction = {
            date: new Date(formData.get('date')).toISOString(),
            description: formData.get('description'),
            value: parseFloat(formData.get('value')),
            type: formData.get('type'),
            service_id: formData.get('service_id') ? parseInt(formData.get('service_id')) : null,
            payment_method: formData.get('payment_method'),
            status: formData.get('status')
        };
        
        try {
            const response = await fetch(`${apiBaseUrl}/transactions/${transactionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transaction)
            });
            
            if (!response.ok) throw new Error('Falha ao atualizar transação');
            
            // Fechar modal e atualizar tabela
            document.getElementById('editTransactionModal').classList.remove('active');
            updateTransactionsTable();
            showNotification('Transação editada com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar transação:', error);
            alert('Erro ao atualizar transação. Por favor, tente novamente.');
        }
    });

    // Event listener para fechar o modal de edição
    document.querySelectorAll('[data-modal="editTransactionModal"]').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('editTransactionModal').classList.remove('active');
        });
    });

    // Helper function to format currency
    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    // Helper function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // Helper function to format transaction type
    function formatTransactionType(type) {
        switch (type) {
            case 'input':
                return 'Entrada';
            case 'output':
                return 'Saída';
            default:
                return type;
        }
    }

    // Helper function to format status
    function formatStatus(status) {
        const statuses = {
            'concluido': 'Concluído',
            'pendente': 'Pendente',
            'cancelado': 'Cancelado'
        };
        return statuses[status] || status;
    }

    // Helper function to format payment method
    function formatPaymentMethod(method) {
        const methods = {
            'cash': 'Dinheiro',
            'credit': 'Cartão de Crédito',
            'debit': 'Cartão de Débito',
            'pix': 'PIX'
        };
        return methods[method] || method;
    }

    // Função para mostrar notificação
    function showNotification(message, duration = 3000) {
        const container = document.getElementById('notificationContainer') || createNotificationContainer();
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        const text = document.createElement('span');
        text.textContent = message;
        
        const progress = document.createElement('div');
        progress.className = 'progress';
        
        notification.appendChild(text);
        notification.appendChild(progress);
        container.appendChild(notification);
        
        // Animar a barra de progresso
        progress.style.transition = `width ${duration}ms linear`;
        requestAnimationFrame(() => {
            progress.style.width = '100%';
        });
        
        // Remover a notificação após o tempo especificado
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                notification.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, duration);
    }

    function createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }
});