import config from '../../../config.js';

export async function initializeTransactions() {
    // Adicionar event listeners
    setupEventListeners();
    // Carregar dados iniciais
    await updateTransactionsTable();
}

function setupEventListeners() {
    // Event listeners para filtros
    const searchInput = document.querySelector('.search-input');
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const itemsPerPage = document.getElementById('itemsPerPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    if (searchInput && statusFilter && typeFilter) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            updateTransactionsTable();
        });
        statusFilter.addEventListener('change', () => {
            currentPage = 1;
            updateTransactionsTable();
        });
        typeFilter.addEventListener('change', () => {
            currentPage = 1;
            updateTransactionsTable();
        });
    }

    if (startDate && endDate) {
        startDate.addEventListener('change', () => {
            currentPage = 1;
            updateTransactionsTable();
        });
        endDate.addEventListener('change', () => {
            currentPage = 1;
            updateTransactionsTable();
        });
    }

    if (itemsPerPage) {
        itemsPerPage.addEventListener('change', () => {
            currentPage = 1;
            updateTransactionsTable();
        });
    }

    if (prevPageBtn && nextPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateTransactionsTable();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateTransactionsTable();
            }
        });
    }

    // Event listener para o botão de nova transação
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const newTransactionModal = document.getElementById('newTransactionModal');
    const newTransactionForm = document.getElementById('newTransactionForm');

    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            newTransactionModal.classList.add('active');
            loadServices();
            
            // Definir data atual como padrão
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('transactionDate').value = now.toISOString().slice(0, 16);
        });
    }

    // Event listeners para fechar modais
    document.querySelectorAll('.close-modal').forEach(button => {
        const modalId = button.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        
        button.addEventListener('click', () => {
            modal.classList.remove('active');
            if (modalId === 'newTransactionModal') {
                newTransactionForm.reset();
            }
        });
    });

    // Event listener para o formulário de nova transação
    if (newTransactionForm) {
        newTransactionForm.addEventListener('submit', handleNewTransaction);
    }

    // Event listener para o formulário de edição
    const editTransactionForm = document.getElementById('editTransactionForm');
    if (editTransactionForm) {
        editTransactionForm.addEventListener('submit', handleEditTransaction);
    }

    // Event listeners para fechar modais ao clicar fora ou pressionar ESC
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
    });
}

// Variáveis globais para paginação
let currentPage = 1;
let totalPages = 1;

export async function updateTransactionsTable() {
    try {
        const searchQuery = document.querySelector('.search-input').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);

        const response = await fetch(`${config.apiBaseUrl}/transactions`);
        if (!response.ok) throw new Error('Falha ao carregar transações');
        
        let transactions = await response.json();
        
        // Aplicar filtros
        transactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            const matchesSearch = 
                transaction.description?.toLowerCase().includes(searchQuery) ||
                transaction.value?.toString().includes(searchQuery) ||
                formatDate(transaction.date).includes(searchQuery);
                
            const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
            const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
            
            // Verificar se está dentro do intervalo de datas
            const matchesDateRange = (!startDate || transactionDate >= new Date(startDate)) &&
                                   (!endDate || transactionDate <= new Date(endDate));
            
            return matchesSearch && matchesStatus && matchesType && matchesDateRange;
        });

        // Ordenar por data (mais recente primeiro)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calcular paginação
        totalPages = Math.ceil(transactions.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedTransactions = transactions.slice(startIndex, endIndex);
        
        // Atualizar informações de paginação
        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
        
        // Limpar tabela
        const tableBody = document.getElementById('transactionsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        // Preencher tabela com transações paginadas
        paginatedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.id}</td>
                <td>${formatTransactionType(transaction.type)}</td>
                <td>${formatCurrency(transaction.value)}</td>
                <td>${transaction.service?.name || '-'}</td>
                <td>${formatDate(transaction.date)}</td>
                <td><span class="status-badge ${transaction.status}">${formatStatus(transaction.status)}</span></td>
                <td class="action-buttons">
                    <button class="action-button" onclick="showTransactionDetails(${JSON.stringify(transaction).replace(/"/g, '&quot;')})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-button" onclick="showEditTransactionModal(${JSON.stringify(transaction).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-button" onclick="deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao atualizar tabela:', error);
        showNotification('Erro ao carregar transações', 'error');
    }
}

async function handleNewTransaction(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transaction = {
        date: formData.get('date'), // Enviando a data diretamente sem conversão
        description: formData.get('description'),
        value: parseFloat(formData.get('value')),
        type: formData.get('type'),
        service_id: formData.get('service_id') ? parseInt(formData.get('service_id')) : null,
        payment_method: formData.get('payment_method'),
        status: formData.get('status')
    };
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transaction)
        });
        
        if (!response.ok) throw new Error('Falha ao criar transação');
        
        // Fechar modal e atualizar tabela
        document.getElementById('newTransactionModal').classList.remove('active');
        e.target.reset();
        await updateTransactionsTable();
        showNotification('Transação adicionada com sucesso!');
    } catch (error) {
        console.error('Erro ao criar transação:', error);
        showNotification('Erro ao criar transação', 'error');
    }
}

async function handleEditTransaction(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transactionId = formData.get('id');
    const transaction = {
        date: formData.get('date'), // Enviando a data diretamente sem conversão
        description: formData.get('description'),
        value: parseFloat(formData.get('value')),
        type: formData.get('type'),
        service_id: formData.get('service_id') ? parseInt(formData.get('service_id')) : null,
        payment_method: formData.get('payment_method'),
        status: formData.get('status')
    };
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/transactions/${transactionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transaction)
        });
        
        if (!response.ok) throw new Error('Falha ao atualizar transação');
        
        // Fechar modal e atualizar tabela
        document.getElementById('editTransactionModal').classList.remove('active');
        await updateTransactionsTable();
        showNotification('Transação atualizada com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar transação:', error);
        showNotification('Erro ao atualizar transação', 'error');
    }
}

export async function deleteTransaction(transactionId) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    
    try {
        const response = await fetch(`${config.apiBaseUrl}/transactions/${transactionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Falha ao excluir transação');
        
        await updateTransactionsTable();
        showNotification('Transação excluída com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir transação:', error);
        showNotification('Erro ao excluir transação', 'error');
    }
}

export function showTransactionDetails(transaction) {
    const modal = document.getElementById('transactionModal');
    
    // Preencher os campos do modal
    document.getElementById('modalId').textContent = transaction.id;
    document.getElementById('modalDescription').textContent = transaction.description;
    document.getElementById('modalType').textContent = formatTransactionType(transaction.type);
    document.getElementById('modalValue').textContent = formatCurrency(transaction.value);
    document.getElementById('modalPaymentMethod').textContent = formatPaymentMethod(transaction.payment_method);
    document.getElementById('modalService').textContent = transaction.service_name || '-';
    document.getElementById('modalDate').textContent = formatDate(transaction.date);
    document.getElementById('modalStatus').textContent = formatStatus(transaction.status);
    document.getElementById('modalCreatedAt').textContent = formatDate(transaction.created_at);
    document.getElementById('modalUpdatedAt').textContent = formatDate(transaction.updated_at);
    
    // Mostrar o modal
    modal.classList.add('active');
}

export function showEditTransactionModal(transaction) {
    const modal = document.getElementById('editTransactionModal');
    
    // Preencher os campos do formulário
    document.getElementById('editTransactionId').value = transaction.id;
    document.getElementById('editTransactionDate').value = transaction.date.slice(0, 16);
    document.getElementById('editTransactionDescription').value = transaction.description;
    document.getElementById('editTransactionValue').value = transaction.value;
    document.getElementById('editTransactionType').value = transaction.type;
    document.getElementById('editTransactionPayment').value = transaction.payment_method;
    document.getElementById('editTransactionStatus').value = transaction.status;
    
    // Carregar serviços e selecionar o atual
    loadServices('editTransactionService', transaction.service_id);
    
    // Mostrar o modal
    modal.classList.add('active');
}

async function loadServices(selectId = 'transactionService', selectedValue = null) {
    try {
        const response = await fetch(`${config.apiBaseUrl}/services`);
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
        showNotification('Erro ao carregar serviços', 'error');
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTransactionType(type) {
    const types = {
        'input': 'Entrada',
        'output': 'Saída'
    };
    return types[type] || type;
}

function formatStatus(status) {
    const statuses = {
        'pendente': 'Pendente',
        'concluido': 'Concluído',
        'cancelado': 'Cancelado'
    };
    return statuses[status] || status;
}

function formatPaymentMethod(method) {
    const methods = {
        'dinheiro': 'Dinheiro',
        'pix': 'PIX',
        'cartao': 'Cartão'
    };
    return methods[method] || method;
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
