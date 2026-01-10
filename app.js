// Import Firebase services
import { auth, db, storage } from './firebase.js';

// DOM Elements
const appContainer = document.getElementById('appContainer');
const loadingSkeleton = document.getElementById('loadingSkeleton');
const authModal = document.getElementById('authModal');
const productModal = document.getElementById('productModal');
const checkoutModal = document.getElementById('checkoutModal');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// State Variables
let currentUser = null;
let cart = [];
let products = [];
let categories = [];
let banners = [];
let currentSlide = 0;
let slideInterval;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Initialize Application
async function initApp() {
    // Load initial data
    await Promise.all([
        loadBanners(),
        loadCategories(),
        loadProducts(),
        initAuthState()
    ]);
    
    // Initialize UI
    initNavigation();
    initEventListeners();
    initBannerSlider();
    startFlashSaleTimer();
    
    // Hide loading skeleton and show app
    setTimeout(() => {
        loadingSkeleton.style.display = 'none';
        appContainer.classList.add('loaded');
        appContainer.style.opacity = '1';
    }, 500);
}

// Initialize Authentication State
async function initAuthState() {
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        if (user) {
            // Load user cart
            await loadUserCart(user.uid);
        } else {
            // Load local cart
            loadLocalCart();
        }
    });
}

// Load Banners from Firebase
async function loadBanners() {
    try {
        const snapshot = await db.collection('banners').where('status', '==', 'active').get();
        banners = [];
        snapshot.forEach(doc => {
            banners.push({ id: doc.id, ...doc.data() });
        });
        
        // If no banners in Firebase, use dummy data
        if (banners.length === 0) {
            banners = [
                { id: '1', imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', title: 'Summer Sale' },
                { id: '2', imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', title: 'Electronics' },
                { id: '3', imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', title: 'Fashion' }
            ];
        }
        
        renderBanners();
    } catch (error) {
        console.error('Error loading banners:', error);
        showToast('Error loading banners', 'error');
    }
}

// Load Categories from Firebase
async function loadCategories() {
    try {
        const snapshot = await db.collection('categories').where('status', '==', 'active').get();
        categories = [];
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        
        // If no categories in Firebase, use dummy data
        if (categories.length === 0) {
            categories = [
                { id: '1', name: 'Electronics', icon: 'fas fa-laptop', color: '#4CAF50' },
                { id: '2', name: 'Fashion', icon: 'fas fa-tshirt', color: '#2196F3' },
                { id: '3', name: 'Home & Living', icon: 'fas fa-home', color: '#FF9800' },
                { id: '4', name: 'Beauty', icon: 'fas fa-spa', color: '#E91E63' },
                { id: '5', name: 'Sports', icon: 'fas fa-futbol', color: '#009688' },
                { id: '6', name: 'Books', icon: 'fas fa-book', color: '#795548' },
                { id: '7', name: 'Toys', icon: 'fas fa-gamepad', color: '#9C27B0' },
                { id: '8', name: 'Groceries', icon: 'fas fa-shopping-basket', color: '#8BC34A' }
            ];
        }
        
        renderCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Error loading categories', 'error');
    }
}

// Load Products from Firebase
async function loadProducts() {
    try {
        const snapshot = await db.collection('products').where('status', '==', 'active').limit(20).get();
        products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        // If no products in Firebase, use dummy data
        if (products.length === 0) {
            products = generateDummyProducts();
        }
        
        renderFlashSaleProducts();
        renderFeaturedProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products', 'error');
        // Use dummy data as fallback
        products = generateDummyProducts();
        renderFlashSaleProducts();
        renderFeaturedProducts();
    }
}

// Generate Dummy Products
function generateDummyProducts() {
    const dummyProducts = [];
    const productNames = [
        'Wireless Bluetooth Headphones',
        'Smart Watch Series 5',
        'Digital Camera 24MP',
        'Gaming Laptop RTX 3060',
        'Wireless Mouse',
        'Mechanical Keyboard',
        'USB-C Hub 6-in-1',
        'Portable Charger 20000mAh',
        'Fitness Tracker Band',
        'Noise Cancelling Earphones'
    ];
    
    for (let i = 0; i < 20; i++) {
        const price = Math.floor(Math.random() * 5000) + 1000;
        const discount = Math.floor(Math.random() * 50) + 10;
        const discountedPrice = price - (price * discount / 100);
        
        dummyProducts.push({
            id: `product_${i + 1}`,
            title: productNames[Math.floor(Math.random() * productNames.length)],
            price: price,
            discount: discount,
            discountedPrice: discountedPrice,
            imageUrl: `https://picsum.photos/300/200?random=${i + 1}`,
            category: categories[Math.floor(Math.random() * categories.length)]?.name || 'Electronics',
            rating: (Math.random() * 2 + 3).toFixed(1),
            reviewCount: Math.floor(Math.random() * 1000),
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            status: 'active'
        });
    }
    
    return dummyProducts;
}

// Render Banners
function renderBanners() {
    const sliderTrack = document.querySelector('.slider-track');
    const sliderDots = document.querySelector('.slider-dots');
    
    if (!sliderTrack || !sliderDots) return;
    
    sliderTrack.innerHTML = '';
    sliderDots.innerHTML = '';
    
    banners.forEach((banner, index) => {
        // Create slide
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.innerHTML = `
            <img src="${banner.imageUrl}" alt="${banner.title || 'Banner'}">
        `;
        sliderTrack.appendChild(slide);
        
        // Create dot
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.dataset.index = index;
        dot.addEventListener('click', () => goToSlide(index));
        sliderDots.appendChild(dot);
    });
}

// Render Categories
function renderCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    const categoriesList = document.querySelector('.categories-list');
    
    if (categoriesGrid) {
        categoriesGrid.innerHTML = '';
        categories.forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.dataset.categoryId = category.id;
            categoryCard.innerHTML = `
                <div class="category-icon" style="background-color: ${category.color || '#f85606'};">
                    <i class="${category.icon || 'fas fa-box'}"></i>
                </div>
                <h3>${category.name}</h3>
            `;
            categoryCard.addEventListener('click', () => filterProductsByCategory(category.name));
            categoriesGrid.appendChild(categoryCard);
        });
    }
    
    if (categoriesList) {
        categoriesList.innerHTML = '';
        categories.forEach(category => {
            const categoryItem = document.createElement('a');
            categoryItem.className = 'category-item';
            categoryItem.href = '#';
            categoryItem.dataset.categoryId = category.id;
            categoryItem.innerHTML = `
                <div class="category-icon" style="background-color: ${category.color || '#f85606'};">
                    <i class="${category.icon || 'fas fa-box'}"></i>
                </div>
                <span class="category-name">${category.name}</span>
            `;
            categoryItem.addEventListener('click', (e) => {
                e.preventDefault();
                filterProductsByCategory(category.name);
            });
            categoriesList.appendChild(categoryItem);
        });
    }
}

// Render Flash Sale Products
function renderFlashSaleProducts() {
    const flashSaleProducts = document.getElementById('flashSaleProducts');
    if (!flashSaleProducts) return;
    
    // Get products with highest discounts
    const flashProducts = [...products]
        .filter(p => p.discount >= 30)
        .slice(0, 8);
    
    flashSaleProducts.innerHTML = '';
    
    if (flashProducts.length === 0) {
        flashSaleProducts.innerHTML = '<p class="no-products">No flash sale products available</p>';
        return;
    }
    
    flashProducts.forEach(product => {
        const productCard = createProductCard(product);
        flashSaleProducts.appendChild(productCard);
    });
}

// Render Featured Products
function renderFeaturedProducts() {
    const featuredProducts = document.getElementById('featuredProducts');
    if (!featuredProducts) return;
    
    // Get random featured products
    const featured = [...products].slice(0, 12);
    
    featuredProducts.innerHTML = '';
    
    featured.forEach(product => {
        const productCard = createProductCard(product);
        featuredProducts.appendChild(productCard);
    });
}

// Create Product Card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    
    const discountPercentage = Math.round(product.discount || 0);
    const originalPrice = product.price || 0;
    const discountedPrice = product.discountedPrice || originalPrice - (originalPrice * discountPercentage / 100);
    
    card.innerHTML = `
        ${discountPercentage > 0 ? `<div class="product-badge">-${discountPercentage}%</div>` : ''}
        <div class="product-image">
            <img src="${product.imageUrl || 'https://picsum.photos/300/200'}" 
                 alt="${product.title}" 
                 loading="lazy">
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.title || 'Product Name'}</h3>
            <div class="product-price">
                <span class="current-price">৳${discountedPrice.toFixed(2)}</span>
                ${discountPercentage > 0 ? `<span class="original-price">৳${originalPrice.toFixed(2)}</span>` : ''}
            </div>
            <div class="product-rating">
                <div class="rating-stars">
                    ${getStarRating(product.rating || 4.5)}
                </div>
                <span class="rating-count">(${product.reviewCount || 0})</span>
            </div>
            <button class="add-to-cart-btn" data-product-id="${product.id}">
                <i class="fas fa-cart-plus"></i>
                Add to Cart
            </button>
        </div>
    `;
    
    // Add event listeners
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(product);
    });
    
    card.addEventListener('click', () => {
        showProductDetails(product);
    });
    
    return card;
}

// Get Star Rating HTML
function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

// Initialize Navigation
function initNavigation() {
    // Navigation buttons
    const homeBtn = document.querySelector('a[href="#home"]');
    const cartBtn = document.getElementById('cartBtn');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const shopNowBtn = document.getElementById('shopNowBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    // Home navigation
    if (homeBtn) {
        homeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('home');
        });
    }
    
    // Cart navigation
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            showSection('cart');
            renderCart();
        });
    }
    
    // Authentication
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            showAuthModal('login');
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            showAuthModal('register');
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Shop Now button
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', () => {
            showSection('home');
        });
    }
    
    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                showCheckoutModal();
            }
        });
    }
    
    // Load more products
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreProducts);
    }
    
    // Search functionality
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
}

// Initialize Event Listeners
function initEventListeners() {
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            hideModal(authModal);
        }
        if (e.target === productModal) {
            hideModal(productModal);
        }
        if (e.target === checkoutModal) {
            hideModal(checkoutModal);
        }
    });
    
    // Close modals with close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            hideModal(authModal);
            hideModal(productModal);
            hideModal(checkoutModal);
        });
    });
    
    // Auth form switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchAuthTab(tabName);
        });
    });
    
    // Switch between login and register
    document.querySelectorAll('.switch-to-login').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthTab('login');
        });
    });
    
    document.querySelectorAll('.switch-to-register').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthTab('register');
        });
    });
    
    // Form submissions
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const checkoutForm = document.getElementById('checkoutForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
}

// Initialize Banner Slider
function initBannerSlider() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentSlide - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide(currentSlide + 1);
        });
    }
    
    // Auto slide
    startAutoSlide();
}

// Banner Slider Functions
function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const sliderTrack = document.querySelector('.slider-track');
    
    if (slides.length === 0) return;
    
    // Wrap around
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    
    currentSlide = index;
    
    // Update slider position
    sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update active dot
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
    
    // Reset auto slide timer
    resetAutoSlide();
}

function startAutoSlide() {
    slideInterval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, 5000); // Change slide every 5 seconds
}

function resetAutoSlide() {
    clearInterval(slideInterval);
    startAutoSlide();
}

// Flash Sale Timer
function startFlashSaleTimer() {
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    if (!hoursElement || !minutesElement || !secondsElement) return;
    
    // Set end time (12 hours from now)
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 12);
    
    function updateTimer() {
        const now = new Date();
        const timeLeft = endTime - now;
        
        if (timeLeft <= 0) {
            // Timer expired
            hoursElement.textContent = '00';
            minutesElement.textContent = '00';
            secondsElement.textContent = '00';
            return;
        }
        
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        hoursElement.textContent = hours.toString().padStart(2, '0');
        minutesElement.textContent = minutes.toString().padStart(2, '0');
        secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
    
    // Update immediately
    updateTimer();
    
    // Update every second
    setInterval(updateTimer, 1000);
}

// Show/Hide Sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Modal Functions
function showModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Auth Modal
function showAuthModal(initialTab = 'login') {
    switchAuthTab(initialTab);
    showModal(authModal);
}

function switchAuthTab(tabName) {
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${tabName}Form`);
    });
    
    // Clear messages
    const authMessage = document.getElementById('authMessage');
    if (authMessage) {
        authMessage.style.display = 'none';
        authMessage.textContent = '';
    }
}

// Product Details Modal
function showProductDetails(product) {
    const productDetails = document.getElementById('productDetails');
    if (!productDetails) return;
    
    const discountPercentage = Math.round(product.discount || 0);
    const originalPrice = product.price || 0;
    const discountedPrice = product.discountedPrice || originalPrice - (originalPrice * discountPercentage / 100);
    
    productDetails.innerHTML = `
        <div class="product-gallery">
            <div class="main-product-image">
                <img src="${product.imageUrl || 'https://picsum.photos/600/400'}" 
                     alt="${product.title}" 
                     id="mainProductImage">
            </div>
            <div class="product-thumbnails">
                <div class="product-thumbnail active" data-image="${product.imageUrl || 'https://picsum.photos/600/400'}">
                    <img src="${product.imageUrl || 'https://picsum.photos/100/100'}" alt="Thumbnail 1">
                </div>
                <!-- Additional thumbnails can be added here -->
            </div>
        </div>
        <div class="product-info-details">
            <h2>${product.title}</h2>
            <div class="product-rating-details">
                <div class="rating-stars">
                    ${getStarRating(product.rating || 4.5)}
                </div>
                <span class="rating-count">${product.rating || 4.5} (${product.reviewCount || 0} reviews)</span>
            </div>
            <div class="product-price-details">
                <div class="price-container">
                    <span class="discounted-price">৳${discountedPrice.toFixed(2)}</span>
                    ${discountPercentage > 0 ? `
                        <span class="original-price-details">৳${originalPrice.toFixed(2)}</span>
                        <span class="discount-badge">-${discountPercentage}%</span>
                    ` : ''}
                </div>
                <p>Inclusive of all taxes</p>
            </div>
            <div class="product-description">
                <p>${product.description || 'No description available.'}</p>
                <p><strong>Category:</strong> ${product.category || 'Uncategorized'}</p>
            </div>
            <div class="quantity-selector">
                <label for="productQuantity">Quantity:</label>
                <div class="quantity-control">
                    <button type="button" class="quantity-btn minus">-</button>
                    <input type="number" id="productQuantity" class="quantity-input" value="1" min="1" max="10">
                    <button type="button" class="quantity-btn plus">+</button>
                </div>
            </div>
            <div class="product-actions">
                <button class="buy-now-btn" data-product-id="${product.id}">
                    <i class="fas fa-bolt"></i>
                    Buy Now
                </button>
                <button class="add-to-cart-modal-btn" data-product-id="${product.id}">
                    <i class="fas fa-cart-plus"></i>
                    Add to Cart
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners for quantity control
    const quantityInput = productDetails.querySelector('#productQuantity');
    const minusBtn = productDetails.querySelector('.quantity-btn.minus');
    const plusBtn = productDetails.querySelector('.quantity-btn.plus');
    const addToCartBtn = productDetails.querySelector('.add-to-cart-modal-btn');
    const buyNowBtn = productDetails.querySelector('.buy-now-btn');
    
    if (minusBtn && quantityInput) {
        minusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
    }
    
    if (plusBtn && quantityInput) {
        plusBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue < 10) {
                quantityInput.value = currentValue + 1;
            }
        });
    }
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            addToCart(product, quantity);
            addToCartBtn.classList.add('added');
            addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Added to Cart';
            
            setTimeout(() => {
                addToCartBtn.classList.remove('added');
                addToCartBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
            }, 2000);
        });
    }
    
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            addToCart(product, quantity);
            hideModal(productModal);
            showSection('cart');
            renderCart();
        });
    }
    
    showModal(productModal);
}

// Checkout Modal
function showCheckoutModal() {
    const checkoutSummary = document.getElementById('checkoutSummary');
    if (!checkoutSummary) return;
    
    // Calculate totals
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryCharge = subtotal > 1000 ? 0 : 60;
    const discount = cart.reduce((total, item) => total + ((item.originalPrice - item.price) * item.quantity), 0);
    const total = subtotal + deliveryCharge;
    
    // Render summary
    checkoutSummary.innerHTML = '';
    
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-summary-item';
        itemElement.innerHTML = `
            <span>${item.title} x ${item.quantity}</span>
            <span>৳${(item.price * item.quantity).toFixed(2)}</span>
        `;
        checkoutSummary.appendChild(itemElement);
    });
    
    // Add totals
    const subtotalElement = document.createElement('div');
    subtotalElement.className = 'order-summary-item';
    subtotalElement.innerHTML = `
        <span>Subtotal</span>
        <span>৳${subtotal.toFixed(2)}</span>
    `;
    checkoutSummary.appendChild(subtotalElement);
    
    const deliveryElement = document.createElement('div');
    deliveryElement.className = 'order-summary-item';
    deliveryElement.innerHTML = `
        <span>Delivery Charge</span>
        <span>${deliveryCharge === 0 ? 'FREE' : `৳${deliveryCharge.toFixed(2)}`}</span>
    `;
    checkoutSummary.appendChild(deliveryElement);
    
    if (discount > 0) {
        const discountElement = document.createElement('div');
        discountElement.className = 'order-summary-item';
        discountElement.innerHTML = `
            <span>Discount</span>
            <span>-৳${discount.toFixed(2)}</span>
        `;
        checkoutSummary.appendChild(discountElement);
    }
    
    const totalElement = document.createElement('div');
    totalElement.className = 'order-summary-item';
    totalElement.innerHTML = `
        <span>Total</span>
        <span>৳${total.toFixed(2)}</span>
    `;
    checkoutSummary.appendChild(totalElement);
    
    // Pre-fill user data if logged in
    if (currentUser) {
        const fullNameInput = document.getElementById('fullName');
        const phoneInput = document.getElementById('phoneNumber');
        
        if (fullNameInput && currentUser.displayName) {
            fullNameInput.value = currentUser.displayName;
        }
        
        if (phoneInput && currentUser.phoneNumber) {
            phoneInput.value = currentUser.phoneNumber;
        }
    }
    
    showModal(checkoutModal);
}

// Cart Functions
function addToCart(product, quantity = 1) {
    // Check if product is already in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex > -1) {
        // Update quantity
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item
        const cartItem = {
            id: product.id,
            title: product.title,
            price: product.discountedPrice || product.price,
            originalPrice: product.price,
            imageUrl: product.imageUrl,
            quantity: quantity,
            discount: product.discount || 0
        };
        cart.push(cartItem);
    }
    
    // Update cart count
    updateCartCount();
    
    // Save cart
    saveCart();
    
    // Show success message
    showToast(`${product.title} added to cart!`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    saveCart();
    renderCart();
    showToast('Item removed from cart', 'success');
}

function updateCartItemQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        if (item.quantity < 1) {
            removeFromCart(productId);
        } else {
            updateCartCount();
            saveCart();
            renderCart();
        }
    }
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const subtotalElement = document.getElementById('subtotal');
    const deliveryChargeElement = document.getElementById('deliveryCharge');
    const discountElement = document.getElementById('discount');
    const totalPriceElement = document.getElementById('totalPrice');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add items to your cart to see them here</p>
                <button id="shopNowBtn" class="shop-now-btn">Shop Now</button>
            </div>
        `;
        
        // Re-attach event listener to shop now button
        document.getElementById('shopNowBtn')?.addEventListener('click', () => {
            showSection('home');
        });
        
        // Update summary
        if (subtotalElement) subtotalElement.textContent = '৳0';
        if (deliveryChargeElement) deliveryChargeElement.textContent = '৳60';
        if (discountElement) discountElement.textContent = '-৳0';
        if (totalPriceElement) totalPriceElement.textContent = '৳60';
        if (checkoutBtn) checkoutBtn.disabled = true;
        
        return;
    }
    
    // Render cart items
    cartItems.innerHTML = '';
    
    cart.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.imageUrl}" alt="${item.title}">
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-title">${item.title}</h3>
                <div class="cart-item-price">৳${item.price.toFixed(2)}</div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button type="button" class="quantity-btn minus" data-product-id="${item.id}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10" data-product-id="${item.id}">
                        <button type="button" class="quantity-btn plus" data-product-id="${item.id}">+</button>
                    </div>
                    <button class="remove-item-btn" data-product-id="${item.id}">Remove</button>
                </div>
            </div>
        `;
        cartItems.appendChild(cartItemElement);
    });
    
    // Calculate totals
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryCharge = subtotal > 1000 ? 0 : 60;
    const discount = cart.reduce((total, item) => total + ((item.originalPrice - item.price) * item.quantity), 0);
    const total = subtotal + deliveryCharge;
    
    // Update summary
    if (subtotalElement) subtotalElement.textContent = `৳${subtotal.toFixed(2)}`;
    if (deliveryChargeElement) deliveryChargeElement.textContent = deliveryCharge === 0 ? 'FREE' : `৳${deliveryCharge.toFixed(2)}`;
    if (discountElement) discountElement.textContent = `-৳${discount.toFixed(2)}`;
    if (totalPriceElement) totalPriceElement.textContent = `৳${total.toFixed(2)}`;
    if (checkoutBtn) checkoutBtn.disabled = false;
    
    // Add event listeners to cart items
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.productId;
            const item = cart.find(item => item.id === productId);
            if (item) {
                updateCartItemQuantity(productId, item.quantity - 1);
            }
        });
    });
    
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.productId;
            const item = cart.find(item => item.id === productId);
            if (item && item.quantity < 10) {
                updateCartItemQuantity(productId, item.quantity + 1);
            }
        });
    });
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', () => {
            const productId = input.dataset.productId;
            const quantity = parseInt(input.value);
            if (quantity >= 1 && quantity <= 10) {
                updateCartItemQuantity(productId, quantity);
            } else {
                // Reset to current quantity
                const item = cart.find(item => item.id === productId);
                if (item) {
                    input.value = item.quantity;
                }
            }
        });
    });
    
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.productId;
            removeFromCart(productId);
        });
    });
}

function updateCartCount() {
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

// Load User Cart from Firebase
async function loadUserCart(userId) {
    try {
        const cartDoc = await db.collection('carts').doc(userId).get();
        if (cartDoc.exists) {
            cart = cartDoc.data().items || [];
        } else {
            cart = [];
        }
        updateCartCount();
        renderCart();
    } catch (error) {
        console.error('Error loading user cart:', error);
        cart = [];
        updateCartCount();
    }
}

// Load Local Cart from localStorage
function loadLocalCart() {
    try {
        const savedCart = localStorage.getItem('newJourneyCart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        } else {
            cart = [];
        }
        updateCartCount();
    } catch (error) {
        console.error('Error loading local cart:', error);
        cart = [];
        updateCartCount();
    }
}

// Save Cart
async function saveCart() {
    // Save to localStorage for guests
    localStorage.setItem('newJourneyCart', JSON.stringify(cart));
    
    // Save to Firebase for logged in users
    if (currentUser) {
        try {
            await db.collection('carts').doc(currentUser.uid).set({
                items: cart,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error saving cart to Firebase:', error);
        }
    }
}

// Authentication Handlers
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const authMessage = document.getElementById('authMessage');
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        showToast('Login successful!', 'success');
        hideModal(authModal);
        
        // Clear form
        e.target.reset();
    } catch (error) {
        console.error('Login error:', error);
        
        // Show error message
        if (authMessage) {
            authMessage.textContent = getAuthErrorMessage(error);
            authMessage.className = 'auth-message error';
            authMessage.style.display = 'block';
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const authMessage = document.getElementById('authMessage');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        if (authMessage) {
            authMessage.textContent = 'Passwords do not match';
            authMessage.className = 'auth-message error';
            authMessage.style.display = 'block';
        }
        return;
    }
    
    try {
        // Create user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update user profile
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Create user document in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            role: 'user',
            createdAt: new Date()
        });
        
        showToast('Registration successful!', 'success');
        hideModal(authModal);
        
        // Clear form
        e.target.reset();
    } catch (error) {
        console.error('Registration error:', error);
        
        // Show error message
        if (authMessage) {
            authMessage.textContent = getAuthErrorMessage(error);
            authMessage.className = 'auth-message error';
            authMessage.style.display = 'block';
        }
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        showToast('Logged out successfully', 'success');
        
        // Clear cart
        cart = [];
        updateCartCount();
        saveCart();
        
        // Show home section
        showSection('home');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    }
}

function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'Email already in use';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled';
        case 'auth/weak-password':
            return 'Password is too weak';
        case 'auth/user-disabled':
            return 'User account is disabled';
        case 'auth/user-not-found':
            return 'User not found';
        case 'auth/wrong-password':
            return 'Incorrect password';
        default:
            return error.message;
    }
}

// Checkout Handler
async function handleCheckout(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Please login to place an order', 'error');
        hideModal(checkoutModal);
        showAuthModal('login');
        return;
    }
    
    const fullName = document.getElementById('fullName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const address = document.getElementById('address').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    // Calculate order total
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryCharge = subtotal > 1000 ? 0 : 60;
    const total = subtotal + deliveryCharge;
    
    // Create order object
    const order = {
        userId: currentUser.uid,
        userName: fullName,
        userPhone: phoneNumber,
        userAddress: address,
        items: cart.map(item => ({
            productId: item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl
        })),
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        total: total,
        paymentMethod: paymentMethod,
        status: 'pending',
        createdAt: new Date(),
        orderId: 'ORD' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
    };
    
    try {
        // Save order to Firebase
        await db.collection('orders').doc(order.orderId).set(order);
        
        // Clear cart
        cart = [];
        updateCartCount();
        saveCart();
        
        // Hide modal and show success message
        hideModal(checkoutModal);
        showToast(`Order placed successfully! Order ID: ${order.orderId}`, 'success');
        
        // Show orders section
        showSection('orders');
        loadUserOrders();
    } catch (error) {
        console.error('Error placing order:', error);
        showToast('Error placing order. Please try again.', 'error');
    }
}

// Load User Orders
async function loadUserOrders() {
    if (!currentUser) return;
    
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;
    
    try {
        const snapshot = await db.collection('orders')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        
        renderOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersContainer.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading orders</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
}

// Render Orders
function renderOrders(orders) {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-box-open"></i>
                <h3>No orders yet</h3>
                <p>Your orders will appear here</p>
            </div>
        `;
        return;
    }
    
    ordersContainer.innerHTML = '';
    
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        // Format date
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const formattedDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Get status class
        let statusClass = 'status-pending';
        if (order.status === 'approved') statusClass = 'status-approved';
        if (order.status === 'delivered') statusClass = 'status-delivered';
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${order.orderId}</div>
                    <div class="order-date">${formattedDate}</div>
                </div>
                <div class="order-status ${statusClass}">${order.status.toUpperCase()}</div>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <div class="order-item-image">
                            <img src="${item.imageUrl}" alt="${item.title}">
                        </div>
                        <div class="order-item-info">
                            <div class="order-item-title">${item.title}</div>
                            <div class="order-item-quantity">Quantity: ${item.quantity}</div>
                            <div class="order-item-price">৳${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <div class="order-shipping">
                    <div><strong>Shipping to:</strong> ${order.userAddress}</div>
                    <div><strong>Payment:</strong> ${order.paymentMethod === 'cash' ? 'Cash on Delivery' : order.paymentMethod}</div>
                </div>
                <div class="order-total">Total: ৳${order.total.toFixed(2)}</div>
            </div>
        `;
        
        ordersContainer.appendChild(orderCard);
    });
}

// Search Handler
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) return;
    
    // Filter products
    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
    
    // Show search results
    const featuredProducts = document.getElementById('featuredProducts');
    if (featuredProducts) {
        featuredProducts.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            featuredProducts.innerHTML = `
                <div class="no-search-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 48px; color: var(--gray-light); margin-bottom: 20px;"></i>
                    <h3>No products found</h3>
                    <p>Try different keywords</p>
                </div>
            `;
        } else {
            filteredProducts.forEach(product => {
                const productCard = createProductCard(product);
                featuredProducts.appendChild(productCard);
            });
        }
    }
    
    // Show home section
    showSection('home');
    
    // Scroll to products
    featuredProducts.scrollIntoView({ behavior: 'smooth' });
    
    // Show search feedback
    showToast(`Found ${filteredProducts.length} products for "${query}"`, 'success');
}

// Filter Products by Category
function filterProductsByCategory(categoryName) {
    const filteredProducts = products.filter(product =>
        product.category.toLowerCase() === categoryName.toLowerCase()
    );
    
    const featuredProducts = document.getElementById('featuredProducts');
    if (featuredProducts) {
        featuredProducts.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            featuredProducts.innerHTML = `
                <div class="no-category-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-box-open" style="font-size: 48px; color: var(--gray-light); margin-bottom: 20px;"></i>
                    <h3>No products in ${categoryName}</h3>
                    <p>Check back later for new arrivals</p>
                </div>
            `;
        } else {
            filteredProducts.forEach(product => {
                const productCard = createProductCard(product);
                featuredProducts.appendChild(productCard);
            });
        }
    }
    
    // Show home section
    showSection('home');
    
    // Scroll to products
    featuredProducts.scrollIntoView({ behavior: 'smooth' });
    
    // Show category feedback
    showToast(`Showing ${filteredProducts.length} products in ${categoryName}`, 'success');
}

// Load More Products
async function loadMoreProducts() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const featuredProducts = document.getElementById('featuredProducts');
    
    if (!loadMoreBtn || !featuredProducts) return;
    
    // Show loading state
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    try {
        // Load more products from Firebase
        const snapshot = await db.collection('products')
            .where('status', '==', 'active')
            .startAfter(products.length)
            .limit(8)
            .get();
        
        const newProducts = [];
        snapshot.forEach(doc => {
            newProducts.push({ id: doc.id, ...doc.data() });
        });
        
        if (newProducts.length === 0) {
            // No more products
            loadMoreBtn.style.display = 'none';
            showToast('No more products to load', 'info');
            return;
        }
        
        // Add to products array
        products.push(...newProducts);
        
        // Render new products
        newProducts.forEach(product => {
            const productCard = createProductCard(product);
            featuredProducts.appendChild(productCard);
        });
        
        // Reset button
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Load More Products';
        
        // Show success message
        showToast(`Loaded ${newProducts.length} more products`, 'success');
    } catch (error) {
        console.error('Error loading more products:', error);
        showToast('Error loading more products', 'error');
        
        // Reset button
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Load More Products';
    }
}

// Toast Notification
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = 'toast';
    toast.classList.add('show');
    
    // Add type class
    if (type === 'success') {
        toast.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        toast.style.backgroundColor = '#dc3545';
    } else if (type === 'warning') {
        toast.style.backgroundColor = '#ffc107';
        toast.style.color = '#212529';
    }
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
