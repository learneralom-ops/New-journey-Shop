// Main Application State
let currentUser = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let currentCategory = 'all';

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartIcon = document.getElementById('cartIcon');
const cartSidebar = document.getElementById('cartSidebar');
const cartItems = document.getElementById('cartItems');
const cartCount = document.querySelector('.cart-count');
const totalPrice = document.querySelector('.total-price');
const loginModal = document.getElementById('loginModal');
const productModal = document.getElementById('productModal');
const checkoutModal = document.getElementById('checkoutModal');
const successMessage = document.getElementById('successMessage');
const categoryBtns = document.querySelectorAll('.category-btn');
const searchInput = document.querySelector('.search-input');

// Initialize App
function initApp() {
    loadProducts();
    updateCartCount();
    setupEventListeners();
    checkAuthState();
}

// Load Products from Firebase
function loadProducts() {
    database.ref('products').on('value', (snapshot) => {
        products = [];
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            products.push(product);
        });
        displayProducts(products);
    });
}

// Display Products in Grid
function displayProducts(productsToShow) {
    productsGrid.innerHTML = '';
    
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <p>No products found</p>
            </div>
        `;
        return;
    }
    
    productsToShow.forEach(product => {
        if (currentCategory !== 'all' && product.category !== currentCategory) {
            return;
        }
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                 alt="${product.name}" 
                 class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="current-price">৳ ${product.price.toLocaleString()}</span>
                    ${product.originalPrice ? `
                        <span class="original-price">৳ ${product.originalPrice.toLocaleString()}</span>
                        <span class="discount-badge">${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF</span>
                    ` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="btn btn-buy" onclick="showProductDetails(${product.id})">
                        <i class="fas fa-bolt"></i> Buy Now
                    </button>
                </div>
            </div>
        `;
        
        productCard.addEventListener('click', (e) => {
            if (!e.target.closest('.product-actions')) {
                showProductDetails(product.id);
            }
        });
        
        productsGrid.appendChild(productCard);
    });
}

// Show Product Details Modal
function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductImage').src = product.image || 'https://via.placeholder.com/300x200?text=No+Image';
    document.getElementById('modalCurrentPrice').textContent = `৳ ${product.price.toLocaleString()}`;
    
    if (product.originalPrice) {
        document.getElementById('modalOriginalPrice').textContent = `৳ ${product.originalPrice.toLocaleString()}`;
        const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        document.getElementById('modalDiscount').textContent = `${discount}% OFF`;
        document.getElementById('modalOriginalPrice').style.display = 'inline';
        document.getElementById('modalDiscount').style.display = 'inline';
    } else {
        document.getElementById('modalOriginalPrice').style.display = 'none';
        document.getElementById('modalDiscount').style.display = 'none';
    }
    
    document.getElementById('modalDescription').textContent = product.description || 'No description available.';
    
    // Set up modal buttons
    document.getElementById('addToCartModal').onclick = () => {
        addToCart(productId);
        productModal.classList.remove('active');
    };
    
    document.getElementById('buyNowModal').onclick = () => {
        addToCart(productId);
        productModal.classList.remove('active');
        cartSidebar.classList.add('active');
    };
    
    productModal.classList.add('active');
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert('Not enough stock available');
            return;
        }
    } else {
        if (product.stock > 0) {
            cart.push({
                ...product,
                quantity: 1
            });
        } else {
            alert('Product out of stock');
            return;
        }
    }
    
    saveCart();
    updateCartDisplay();
    showSuccessMessage('Product added to cart!');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartDisplay();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(productId);
    } else if (newQuantity > product.stock) {
        alert('Not enough stock available');
    } else {
        item.quantity = newQuantity;
        saveCart();
        updateCartDisplay();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
}

function updateCartDisplay() {
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        totalPrice.textContent = '৳ 0';
        return;
    }
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image || 'https://via.placeholder.com/80x80?text=No+Image'}" 
                 alt="${item.name}" 
                 class="cart-item-image">
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name}</h4>
                <div class="cart-item-price">৳ ${item.price.toLocaleString()} × ${item.quantity}</div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="qty-btn minus" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <input type="number" class="qty-input" value="${item.quantity}" min="1" readonly>
                        <button class="qty-btn plus" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    totalPrice.textContent = `৳ ${total.toLocaleString()}`;
}

// Checkout Functions
function openCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    const orderSummary = document.getElementById('orderSummary');
    let summaryHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        summaryHTML += `
            <div class="order-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>৳ ${itemTotal.toLocaleString()}</span>
            </div>
        `;
    });
    
    orderSummary.innerHTML = summaryHTML;
    document.querySelector('.total-amount').textContent = `৳ ${total.toLocaleString()}`;
    
    checkoutModal.classList.add('active');
    cartSidebar.classList.remove('active');
}

function submitOrder(event) {
    event.preventDefault();
    
    const name = document.getElementById('checkoutName').value;
    const phone = document.getElementById('checkoutPhone').value;
    const address = document.getElementById('checkoutAddress').value;
    
    if (!name || !phone || !address) {
        alert('Please fill all fields');
        return;
    }
    
    const orderData = {
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        date: new Date().toISOString(),
        orderId: 'ORD' + Date.now()
    };
    
    // Save order to Firebase
    database.ref('orders/' + orderData.orderId).set(orderData)
        .then(() => {
            // Update product stock
            cart.forEach(item => {
                database.ref('products/' + item.id + '/stock').transaction((currentStock) => {
                    return (currentStock || 0) - item.quantity;
                });
            });
            
            // Clear cart
            cart = [];
            saveCart();
            updateCartDisplay();
            
            // Show success message
            showSuccessMessage('Order placed successfully!');
            
            // Close modals
            checkoutModal.classList.remove('active');
            
            // Reset form
            event.target.reset();
            
            // Facebook Pixel Conversion Tracking
            fbq('track', 'Purchase', {
                value: orderData.total,
                currency: 'BDT'
            });
        })
        .catch((error) => {
            console.error('Error saving order:', error);
            alert('Error placing order. Please try again.');
        });
}

// Authentication Functions
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        const loginBtn = document.getElementById('loginBtn');
        
        if (user) {
            loginBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span>${user.email}</span>
            `;
            loginBtn.onclick = () => {
                auth.signOut();
            };
        } else {
            loginBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span>Login / Register</span>
            `;
            loginBtn.onclick = () => {
                loginModal.classList.add('active');
            };
        }
    });
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            loginModal.classList.remove('active');
            showSuccessMessage('Logged in successfully!');
            event.target.reset();
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
}

function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Save user info to database
            return database.ref('users/' + userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });
        })
        .then(() => {
            loginModal.classList.remove('active');
            showSuccessMessage('Account created successfully!');
            event.target.reset();
            switchToLogin();
        })
        .catch((error) => {
            alert('Error: ' + error.message);
        });
}

function switchToRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function switchToLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

// Utility Functions
function showSuccessMessage(message) {
    successMessage.querySelector('p').textContent = message;
    successMessage.classList.add('active');
    
    setTimeout(() => {
        successMessage.classList.remove('active');
    }, 3000);
}

function closeAllModals() {
    loginModal.classList.remove('active');
    productModal.classList.remove('active');
    checkoutModal.classList.remove('active');
}

// Search Function
function searchProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    displayProducts(filteredProducts);
}

// Event Listeners Setup
function setupEventListeners() {
    // Cart toggle
    cartIcon.addEventListener('click', () => {
        updateCartDisplay();
        cartSidebar.classList.toggle('active');
    });
    
    // Close cart
    document.querySelector('.close-cart').addEventListener('click', () => {
        cartSidebar.classList.remove('active');
    });
    
    // Category filtering
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            displayProducts(products);
        });
    });
    
    // Close modals when clicking overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay').classList.remove('active');
        });
    });
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Form switching
    document.getElementById('switchToRegister').addEventListener('click', (e) => {
        e.preventDefault();
        switchToRegister();
    });
    
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        switchToLogin();
    });
    
    // Checkout
    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
    document.getElementById('checkoutForm').addEventListener('submit', submitOrder);
    
    // Search
    searchInput.addEventListener('input', searchProducts);
    document.querySelector('.search-btn').addEventListener('click', searchProducts);
    
    // Close success message
    successMessage.addEventListener('click', () => {
        successMessage.classList.remove('active');
    });
    
    // Banner button
    document.querySelector('.banner-btn').addEventListener('click', () => {
        window.scrollTo({ top: productsGrid.offsetTop - 100, behavior: 'smooth' });
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Global functions for inline onclick handlers
window.addToCart = addToCart;
window.showProductDetails = showProductDetails;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
