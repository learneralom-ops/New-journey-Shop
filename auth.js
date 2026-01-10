// DOM Elements
const authLinks = document.getElementById('authLinks');
const userProfile = document.getElementById('userProfile');
const loginLink = document.getElementById('loginLink');
const signupLink = document.getElementById('signupLink');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const authModalOverlay = document.getElementById('authModalOverlay');
const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const googleLoginBtn = document.getElementById('googleLoginBtn');

// Sample product data (in real app, this would come from Firebase)
const products = [
    {
        id: 1,
        name: "Xiaomi Redmi Note 11 - 128GB",
        price: 18999,
        originalPrice: 22999,
        discount: 17,
        rating: 4.3,
        reviews: 1250,
        sold: 4500,
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "smartphones",
        description: "Xiaomi Redmi Note 11 comes with 6.43-inch AMOLED display, 50MP quad camera, 5000mAh battery with 33W fast charging."
    },
    {
        id: 2,
        name: "Samsung Galaxy A23 - 128GB",
        price: 22999,
        originalPrice: 25999,
        discount: 12,
        rating: 4.2,
        reviews: 890,
        sold: 3200,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "smartphones",
        description: "Samsung Galaxy A23 features 6.6-inch display, quad camera setup, 5000mAh battery and One UI interface."
    },
    {
        id: 3,
        name: "Realme C35 - 64GB",
        price: 14999,
        originalPrice: 17999,
        discount: 17,
        rating: 4.0,
        reviews: 670,
        sold: 2800,
        image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "smartphones",
        description: "Realme C35 with 6.6-inch display, 50MP main camera, 5000mAh battery and ultra-slim design."
    },
    {
        id: 4,
        name: "Apple iPhone 13 - 128GB",
        price: 84999,
        originalPrice: 92999,
        discount: 9,
        rating: 4.7,
        reviews: 2450,
        sold: 1800,
        image: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "smartphones",
        description: "Apple iPhone 13 with A15 Bionic chip, dual-camera system with Night mode, Ceramic Shield front."
    },
    {
        id: 5,
        name: "OnePlus Nord CE 2 - 128GB",
        price: 28999,
        originalPrice: 32999,
        discount: 12,
        rating: 4.4,
        reviews: 1120,
        sold: 3100,
        image: "https://images.unsplash.com/photo-1598327105854-c8674faddf74?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "smartphones",
        description: "OnePlus Nord CE 2 features 6.43-inch AMOLED display, 64MP triple camera, 65W fast charging."
    },
    {
        id: 6,
        name: "HP Pavilion Laptop - 15.6\"",
        price: 68999,
        originalPrice: 78999,
        discount: 13,
        rating: 4.5,
        reviews: 890,
        sold: 1200,
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "electronics",
        description: "HP Pavilion laptop with Intel Core i5, 8GB RAM, 512GB SSD, Windows 11."
    },
    {
        id: 7,
        name: "Sony Headphones WH-1000XM4",
        price: 29999,
        originalPrice: 34999,
        discount: 14,
        rating: 4.8,
        reviews: 1450,
        sold: 2100,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "electronics",
        description: "Industry-leading noise canceling headphones with Dual Noise Sensor technology."
    },
    {
        id: 8,
        name: "Canon EOS 2000D DSLR Camera",
        price: 44999,
        originalPrice: 52999,
        discount: 15,
        rating: 4.6,
        reviews: 760,
        sold: 900,
        image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "electronics",
        description: "24.1MP APS-C CMOS sensor, Full HD video, Wi-Fi, NFC, 3.0-inch LCD screen."
    },
    {
        id: 9,
        name: "Men's Casual Shirt - Regular Fit",
        price: 899,
        originalPrice: 1499,
        discount: 40,
        rating: 4.2,
        reviews: 3450,
        sold: 8900,
        image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "fashion",
        description: "100% Cotton, Regular Fit, Machine Wash, Available in multiple colors."
    },
    {
        id: 10,
        name: "Women's Kurti - Cotton Silk",
        price: 1299,
        originalPrice: 1999,
        discount: 35,
        rating: 4.4,
        reviews: 2890,
        sold: 6700,
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        category: "fashion",
        description: "Cotton Silk blend, Hand Embroidery, Machine Wash, Elegant design."
    }
];

// Cart management
let cart = [];

// Initialize cart from localStorage
function initCart() {
    const savedCart = localStorage.getItem('newJourneyShopCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('newJourneyShopCart', JSON.stringify(cart));
    updateCartCount();
}

// Update cart count in header
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart dropdown
    updateCartDropdown();
}

// Update cart dropdown
function updateCartDropdown() {
    const cartEmpty = document.getElementById('cartEmpty');
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartSubtotal = document.getElementById('cartSubtotal');
    
    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartItems.innerHTML = '';
        cartFooter.style.display = 'none';
        return;
    }
    
    cartEmpty.style.display = 'none';
    
    // Calculate subtotal
    let subtotal = 0;
    
    cartItems.innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        
        return `
            <div class="cart-item" data-id="${item.id}">
                <img src="${product.image}" alt="${product.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-title">${product.name}</div>
                    <div class="cart-item-price">৳ ${product.price.toLocaleString()}</div>
                    <div class="cart-item-quantity">
                        <div class="quantity-control-small">
                            <button class="quantity-btn-small decrease-qty" data-id="${item.id}">-</button>
                            <input type="text" class="quantity-input-small" value="${item.quantity}" readonly>
                            <button class="quantity-btn-small increase-qty" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-item-btn" data-id="${item.id}">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    cartSubtotal.textContent = `৳ ${subtotal.toLocaleString()}`;
    cartFooter.style.display = 'block';
}

// Add to cart
function addToCart(productId, quantity = 1) {
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            quantity: quantity
        });
    }
    
    saveCart();
    showNotification('Product added to cart!');
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

// Update cart quantity
function updateCartQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
    }
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: #f57224;
        color: white;
        padding: 15px 25px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initCart();
});
