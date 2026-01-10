// Main Application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    initCart();
    loadProducts();
    setupEventListeners();
    setupSlider();
    startCountdownTimer();
    
    // Check auth state
    checkAuthState();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
    
    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreProducts);
    }
    
    // Cart dropdown interactions
    document.addEventListener('click', function(e) {
        // Handle cart quantity changes
        if (e.target.classList.contains('decrease-qty')) {
            const productId = parseInt(e.target.dataset.id);
            updateCartQuantity(productId, -1);
        }
        
        if (e.target.classList.contains('increase-qty')) {
            const productId = parseInt(e.target.dataset.id);
            updateCartQuantity(productId, 1);
        }
        
        if (e.target.classList.contains('remove-item-btn')) {
            const productId = parseInt(e.target.dataset.id);
            removeFromCart(productId);
        }
        
        // Handle checkout button
        if (e.target.id === 'checkoutBtn') {
            openCheckoutModal();
        }
    });
    
    // Modal close buttons
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeProductModal);
    }
    
    const closeCheckoutModalBtn = document.getElementById('closeCheckoutModalBtn');
    if (closeCheckoutModalBtn) {
        closeCheckoutModalBtn.addEventListener('click', closeCheckoutModal);
    }
    
    const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    if (closeAuthModalBtn) {
        closeAuthModalBtn.addEventListener('click', closeAuthModal);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const productModalOverlay = document.getElementById('productModalOverlay');
        if (e.target === productModalOverlay) {
            closeProductModal();
        }
        
        const checkoutModalOverlay = document.getElementById('checkoutModalOverlay');
        if (e.target === checkoutModalOverlay) {
            closeCheckoutModal();
        }
        
        const authModalOverlay = document.getElementById('authModalOverlay');
        if (e.target === authModalOverlay) {
            closeAuthModal();
        }
    });
    
    // Auth tab switching
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchAuthTab(tabName);
        });
    });
    
    // Auth form submissions
    const loginFormElement = document.getElementById('loginFormElement');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }
    
    const signupFormElement = document.getElementById('signupFormElement');
    if (signupFormElement) {
        signupFormElement.addEventListener('submit', handleSignup);
    }
    
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
    
    // Checkout form submission
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
    
    // Auth links
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            openAuthModal('login');
        });
    }
    
    const signupLink = document.getElementById('signupLink');
    if (signupLink) {
        signupLink.addEventListener('click', function(e) {
            e.preventDefault();
            openAuthModal('signup');
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Load products
function loadProducts() {
    loadFlashSaleProducts();
    loadBestSellers();
}

// Load flash sale products
function loadFlashSaleProducts() {
    const flashSaleProducts = document.getElementById('flashSaleProducts');
    if (!flashSaleProducts) return;
    
    // Get first 5 products for flash sale
    const flashProducts = products.slice(0, 5);
    
    flashSaleProducts.innerHTML = flashProducts.map(product => createProductCard(product)).join('');
    
    // Add event listeners to product cards
    setTimeout(() => {
        document.querySelectorAll('#flashSaleProducts .product-card').forEach(card => {
            const productId = parseInt(card.dataset.id);
            const product = products.find(p => p.id === productId);
            
            card.addEventListener('click', function(e) {
                if (!e.target.closest('.add-to-cart-btn') && !e.target.closest('.buy-now-btn')) {
                    openProductModal(product);
                }
            });
            
            const addToCartBtn = card.querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    addToCart(productId);
                });
            }
            
            const buyNowBtn = card.querySelector('.buy-now-btn');
            if (buyNowBtn) {
                buyNowBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    handleBuyNow(productId);
                });
            }
        });
    }, 100);
}

// Load best sellers
function loadBestSellers() {
    const bestSellersProducts = document.getElementById('bestSellersProducts');
    if (!bestSellersProducts) return;
    
    // Get all products for best sellers (sorted by sold count)
    const bestSellers = [...products].sort((a, b) => b.sold - a.sold).slice(0, 10);
    
    bestSellersProducts.innerHTML = bestSellers.map(product => createProductCard(product)).join('');
    
    // Add event listeners to product cards
    setTimeout(() => {
        document.querySelectorAll('#bestSellersProducts .product-card').forEach(card => {
            const productId = parseInt(card.dataset.id);
            const product = products.find(p => p.id === productId);
            
            card.addEventListener('click', function(e) {
                if (!e.target.closest('.add-to-cart-btn') && !e.target.closest('.buy-now-btn')) {
                    openProductModal(product);
                }
            });
            
            const addToCartBtn = card.querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    addToCart(productId);
                });
            }
            
            const buyNowBtn = card.querySelector('.buy-now-btn');
            if (buyNowBtn) {
                buyNowBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    handleBuyNow(productId);
                });
            }
        });
    }, 100);
}

// Load more products
function loadMoreProducts() {
    const bestSellersProducts = document.getElementById('bestSellersProducts');
    if (!bestSellersProducts) return;
    
    // Load 5 more products
    const currentCount = bestSellersProducts.children.length;
    const moreProducts = products.slice(currentCount, currentCount + 5);
    
    if (moreProducts.length === 0) {
        document.getElementById('loadMoreBtn').textContent = 'No More Products';
        document.getElementById('loadMoreBtn').disabled = true;
        return;
    }
    
    moreProducts.forEach(product => {
        const productCard = createProductCard(product);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = productCard;
        const cardElement = tempDiv.firstChild;
        
        bestSellersProducts.appendChild(cardElement);
        
        // Add event listeners
        const productId = product.id;
        
        cardElement.addEventListener('click', function(e) {
            if (!e.target.closest('.add-to-cart-btn') && !e.target.closest('.buy-now-btn')) {
                openProductModal(product);
            }
        });
        
        const addToCartBtn = cardElement.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                addToCart(productId);
            });
        }
        
        const buyNowBtn = cardElement.querySelector('.buy-now-btn');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                handleBuyNow(productId);
            });
        }
    });
}

// Create product card HTML
function createProductCard(product) {
    const discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    
    return `
        <div class="product-card" data-id="${product.id}">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">
                <span class="current-price">৳ ${product.price.toLocaleString()}</span>
                <span class="original-price">৳ ${product.originalPrice.toLocaleString()}</span>
                <span class="discount-badge">-${discountPercentage}%</span>
            </div>
            <div class="product-rating">
                <div class="rating-stars">
                    ${createStarRating(product.rating)}
                </div>
                <span class="rating-count">(${product.reviews.toLocaleString()})</span>
            </div>
            <div class="sold-count">${product.sold.toLocaleString()} sold</div>
            <div class="product-actions">
                <button class="add-to-cart-btn">Add to Cart</button>
                <button class="buy-now-btn">Buy Now</button>
            </div>
        </div>
    `;
}

// Create star rating HTML
function createStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    // In a real app, this would filter products and show search results
    console.log('Searching for:', searchTerm);
}

// Setup banner slider
function setupSlider() {
    const banners = document.querySelectorAll('.banner');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    
    let currentSlide = 0;
    
    function showSlide(index) {
        banners.forEach(banner => banner.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        currentSlide = (index + banners.length) % banners.length;
        
        banners[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showSlide(index));
    });
    
    // Auto slide every 5 seconds
    setInterval(() => showSlide(currentSlide + 1), 5000);
}

// Countdown timer
function startCountdownTimer() {
    const countdownTimer = document.getElementById('countdownTimer');
    if (!countdownTimer) return;
    
    let hours = 12;
    let minutes = 45;
    let seconds = 30;
    
    function updateTimer() {
        seconds--;
        
        if (seconds < 0) {
            seconds = 59;
            minutes--;
        }
        
        if (minutes < 0) {
            minutes = 59;
            hours--;
        }
        
        if (hours < 0) {
            hours = 0;
            minutes = 0;
            seconds = 0;
            clearInterval(timerInterval);
        }
        
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    // Update immediately
    updateTimer();
    
    // Update every second
    const timerInterval = setInterval(updateTimer, 1000);
}

// Open product modal
function openProductModal(product) {
    const modalOverlay = document.getElementById('productModalOverlay');
    const modalContent = document.getElementById('productModalContent');
    
    if (!modalOverlay || !modalContent) return;
    
    const discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    
    modalContent.innerHTML = `
        <div class="product-details">
            <div class="product-gallery">
                <img src="${product.image}" alt="${product.name}" class="main-image" id="mainImage">
                <div class="thumbnails">
                    <img src="${product.image}" alt="${product.name}" class="thumbnail active" data-image="${product.image}">
                    <img src="https://images.unsplash.com/photo-1523206489230-c012c64b2b48?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Product view 2" class="thumbnail" data-image="https://images.unsplash.com/photo-1523206489230-c012c64b2b48?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80">
                    <img src="https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Product view 3" class="thumbnail" data-image="https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80">
                </div>
            </div>
            <div class="product-info">
                <h2>${product.name}</h2>
                <div class="product-rating-large">
                    <div class="rating-stars">
                        ${createStarRating(product.rating)}
                    </div>
                    <span class="rating-count">${product.reviews.toLocaleString()} ratings</span>
                    <span class="sold-count">${product.sold.toLocaleString()} sold</span>
                </div>
                
                <div class="product-price-large">
                    <div class="price-row">
                        <span class="current-price-large">৳ ${product.price.toLocaleString()}</span>
                        <span class="original-price-large">৳ ${product.originalPrice.toLocaleString()}</span>
                        <span class="discount-badge-large">-${discountPercentage}%</span>
                    </div>
                </div>
                
                <div class="stock-status">In Stock</div>
                
                <div class="quantity-control">
                    <span>Quantity:</span>
                    <button class="quantity-btn" id="decreaseQty">-</button>
                    <input type="text" class="quantity-input" id="quantityInput" value="1">
                    <button class="quantity-btn" id="increaseQty">+</button>
                </div>
                
                <div class="product-actions-large">
                    <button class="add-to-cart-btn-large" id="modalAddToCart">Add to Cart</button>
                    <button class="buy-now-btn-large" id="modalBuyNow">Buy Now</button>
                </div>
                
                <div class="product-description">
                    <h3>Description</h3>
                    <p>${product.description}</p>
                </div>
            </div>
        </div>
    `;
    
    modalOverlay.style.display = 'flex';
    
    // Add event listeners for modal
    setTimeout(() => {
        // Quantity controls
        const decreaseQty = document.getElementById('decreaseQty');
        const increaseQty = document.getElementById('increaseQty');
        const quantityInput = document.getElementById('quantityInput');
        
        if (decreaseQty) {
            decreaseQty.addEventListener('click', () => {
                let value = parseInt(quantityInput.value) || 1;
                if (value > 1) {
                    quantityInput.value = value - 1;
                }
            });
        }
        
        if (increaseQty) {
            increaseQty.addEventListener('click', () => {
                let value = parseInt(quantityInput.value) || 1;
                quantityInput.value = value + 1;
            });
        }
        
        if (quantityInput) {
            quantityInput.addEventListener('change', function() {
                let value = parseInt(this.value) || 1;
                if (value < 1) value = 1;
                this.value = value;
            });
        }
        
        // Add to cart button
        const modalAddToCart = document.getElementById('modalAddToCart');
        if (modalAddToCart) {
            modalAddToCart.addEventListener('click', () => {
                const quantity = parseInt(quantityInput.value) || 1;
                addToCart(product.id, quantity);
                closeProductModal();
            });
        }
        
        // Buy now button
        const modalBuyNow = document.getElementById('modalBuyNow');
        if (modalBuyNow) {
            modalBuyNow.addEventListener('click', () => {
                const quantity = parseInt(quantityInput.value) || 1;
                handleBuyNow(product.id, quantity);
            });
        }
        
        // Thumbnail click
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', function() {
                const mainImage = document.getElementById('mainImage');
                const imageUrl = this.dataset.image;
                
                mainImage.src = imageUrl;
                
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }, 100);
}

// Close product modal
function closeProductModal() {
    const modalOverlay = document.getElementById('productModalOverlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

// Handle buy now
function handleBuyNow(productId, quantity = 1) {
    // In a real app, this would redirect to affiliate link
    // For demo, we'll add to cart and open checkout
    
    addToCart(productId, quantity);
    openCheckoutModal();
}

// Open checkout modal
function openCheckoutModal() {
    const modalOverlay = document.getElementById('checkoutModalOverlay');
    if (!modalOverlay) return;
    
    // Update order summary
    let subtotal = 0;
    let totalItems = 0;
    
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            subtotal += product.price * item.quantity;
            totalItems += item.quantity;
        }
    });
    
    const shipping = 60;
    const total = subtotal + shipping;
    
    document.getElementById('summaryItems').textContent = `৳ ${subtotal.toLocaleString()}`;
    document.getElementById('summaryTotal').textContent = `৳ ${total.toLocaleString()}`;
    
    modalOverlay.style.display = 'flex';
}

// Close checkout modal
function closeCheckoutModal() {
    const modalOverlay = document.getElementById('checkoutModalOverlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

// Handle checkout
function handleCheckout(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    
    // In a real app, this would save to Firebase
    console.log('Order placed:', {
        fullName,
        phoneNumber,
        email,
        address,
        city,
        cart,
        total: document.getElementById('summaryTotal').textContent
    });
    
    showNotification('Order placed successfully!');
    
    // Clear cart
    cart = [];
    saveCart();
    
    // Close modal and reset form
    closeCheckoutModal();
    e.target.reset();
}

// Open auth modal
function openAuthModal(tab = 'login') {
    const modalOverlay = document.getElementById('authModalOverlay');
    if (!modalOverlay) return;
    
    switchAuthTab(tab);
    modalOverlay.style.display = 'flex';
}

// Close auth modal
function closeAuthModal() {
    const modalOverlay = document.getElementById('authModalOverlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

// Switch auth tab
function switchAuthTab(tabName) {
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${tabName}Form`);
    });
}

// Check auth state
function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            document.getElementById('authLinks').style.display = 'none';
            document.getElementById('userProfile').style.display = 'flex';
            document.getElementById('userName').textContent = user.displayName || user.email.split('@')[0];
        } else {
            // User is signed out
            document.getElementById('authLinks').style.display = 'flex';
            document.getElementById('userProfile').style.display = 'none';
        }
    });
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            showNotification('Login successful!');
            closeAuthModal();
            e.target.reset();
        })
        .catch(error => {
            showNotification(`Login failed: ${error.message}`);
        });
}

// Handle signup
function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters!');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Update user profile with name
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            showNotification('Account created successfully!');
            closeAuthModal();
            e.target.reset();
        })
        .catch(error => {
            showNotification(`Signup failed: ${error.message}`);
        });
}

// Handle Google login
function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider)
        .then(result => {
            showNotification('Google login successful!');
            closeAuthModal();
        })
        .catch(error => {
            showNotification(`Google login failed: ${error.message}`);
        });
}

// Handle logout
function handleLogout() {
    auth.signOut()
        .then(() => {
            showNotification('Logged out successfully!');
        })
        .catch(error => {
            showNotification(`Logout failed: ${error.message}`);
        });
}
