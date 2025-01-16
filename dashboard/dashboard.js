import config from '../config.js';
import { updateDashboardData, initializeDashboard } from './components/home/home.js';
import { initializeTransactions, deleteTransaction, showTransactionDetails, showEditTransactionModal } from './components/transactions/transactions.js';

document.addEventListener('DOMContentLoaded', async function() {
    const menuToggle = document.getElementById('menuToggle');
    const leftMenu = document.getElementById('leftMenu');
    const logoutBtn = document.getElementById('logoutBtn');

    // Carregar o componente Home inicialmente
    await loadContent('home');
    initializeDashboard();

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
});

// Function to load content
async function loadContent(page) {
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => section.classList.remove('active'));

    switch(page) {
        case 'home':
            const homeContainer = document.getElementById('homeContainer');
            const homeResponse = await fetch('./components/home/home.html');
            const homeContent = await homeResponse.text();
            homeContainer.innerHTML = homeContent;
            homeContainer.classList.add('active');
            updateDashboardData();
            break;
        case 'transactions':
            const transactionsContainer = document.getElementById('transactionsContent');
            const transactionsResponse = await fetch('./components/transactions/transactions.html');
            const transactionsContent = await transactionsResponse.text();
            transactionsContainer.innerHTML = transactionsContent;
            transactionsContainer.classList.add('active');
            initializeTransactions();
            break;
    }
}

// Expose functions to window for onclick handlers
window.deleteTransaction = deleteTransaction;
window.showTransactionDetails = showTransactionDetails;
window.showEditTransactionModal = showEditTransactionModal;