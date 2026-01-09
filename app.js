// app.js

// Import Firebase services
import { 
  auth, 
  db, 
  storage, 
  usersCollection, 
  productsCollection, 
  categoriesCollection,
  cartsCollection,
  ordersCollection,
  bannersCollection,
  currentUser,
  isAdmin
} from './firebase.js';

// Global variables
let products = [];
let categories = [];
let banners = [];
let cart = [];
let currentProductPage = 1;
const productsPerPage = 12;

// DOM Elements
const DOM = {
  // Modals
  authModal: document.getElementById("authModal"),
  productModal: document.getElementById("productModal"),
  productFormModal: document.getElementById("productFormModal"),
  adminPanel: document.getElementById("adminPanel"),
  
  // Buttons
  searchBtn: document.getElementById("searchBtn"),
  cartBtn: document.getElementById("cartBtn"),
  closeCart: document.getElementById("closeCart"),
  loadMoreBtn: document.getElementById("loadMoreBtn"),
  checkoutBtn: document.getElementById("checkoutBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  adminLoginBtn: document.getElementById("adminLoginBtn"),
  closeAdminPanel: document.getElementById("closeAdminPanel"),
  
  // Forms
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  productForm: document.getElementById("productForm"),
  
  // Content containers
  productsGrid: document.getElementById("productsGrid"),
  categoriesGrid: document.getElementById("categoriesGrid"),
  cartItems: document.getElementById("cartItems"),
  searchSuggestions: document.getElementById("searchSuggestions"),
  
  // Counters
  cartCount: document.getElementById("cartCount"),
  cartTotalPrice: document.getElementById("cartTotalPrice"),
  
  // Admin elements
  totalProducts: document.getElementById("totalProducts"),
  totalOrders: document.getElementById("totalOrders"),
  totalUsers: document.getElementById("totalUsers"),
  totalRevenue: document.getElementById("totalRevenue"),
  
  // Loading skeleton
  loadingSkeleton: document.getElementById("loadingSkeleton")
};

// Initialize the application
function initApp() {
  setupEventListeners();
  loadInitialData();
  setupFlashSaleTimer();
  checkAuthState();
}

// Setup event listeners
function setupEventListeners() {
  // Authentication
  document.addEventListener("click", (e) => {
    if (e.target.id === "loginBtn" || e.target.closest("#loginBtn")) {
      e.preventDefault();
      showAuthModal();
      switchAuthTab("login");
    }
    
    if (e.target.id === "registerBtn" || e.target.closest("#registerBtn")) {
      e.preventDefault();
      showAuthModal();
      switchAuthTab("register");
    }
    
    if (e.target.id === "showRegister" || e.target.closest("#showRegister")) {
      e.preventDefault();
      switchAuthTab("register");
    }
    
    if (e.target.id === "showLogin" || e.target.closest("#showLogin")) {
      e.preventDefault();
      switchAuthTab("login");
    }
    
    if (e.target.id === "logoutBtn" || e.target.closest("#logoutBtn")) {
      e.preventDefault();
      logout();
    }
    
    if (e.target.id === "adminLoginBtn" || e.target.closest("#adminLoginBtn")) {
      e.preventDefault();
      toggleAdminPanel();
    }
  });

  // Auth forms
  if (DOM.loginForm) {
    DOM.loginForm.addEventListener("submit", handleLogin);
  }
  
  if (DOM.registerForm) {
    DOM.registerForm.addEventListener("submit", handleRegister);
  }

  // Search functionality
  if (DOM.searchBtn) {
    DOM.searchBtn.addEventListener("click", handleSearch);
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", handleSearchInput);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSearch();
    });
  }

  // Cart functionality
  if (DOM.cartBtn) {
    DOM.cartBtn.addEventListener("click", toggleCart);
  }
  
  if (DOM.closeCart) {
    DOM.closeCart.addEventListener("click", toggleCart);
  }
  
  if (DOM.checkoutBtn) {
    DOM.checkoutBtn.addEventListener("click", handleCheckout);
  }

  // Modal close buttons
  document.querySelectorAll(".close-modal").forEach(btn => {
    btn.addEventListener("click", () => {
      hideModal(btn.closest(".modal"));
    });
  });

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      hideModal(e.target);
    }
    
    if (e.target.classList.contains("cart-overlay")) {
      toggleCart();
    }
  });

  // Category filtering
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category;
      filterProductsByCategory(category);
      
      // Update active state
      document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Sorting
  const sortBy = document.getElementById("sortBy");
  if (sortBy) {
    sortBy.addEventListener("change", handleSortChange);
  }

  // Load more products
  if (DOM.loadMoreBtn) {
    DOM.loadMoreBtn.addEventListener("click", loadMoreProducts);
  }

  // Admin panel
  if (DOM.closeAdminPanel) {
    DOM.closeAdminPanel.addEventListener("click", toggleAdminPanel);
  }
  
  // Admin tabs
  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      switchAdminTab(tab);
    });
  });
  
  // Product form
  if (DOM.productForm) {
    DOM.productForm.addEventListener("submit", handleProductSubmit);
  }
  
  // Add product button
  const addProductBtn = document.getElementById("addProductBtn");
  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => {
      showProductForm();
    });
  }
  
  // Add category button
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", handleAddCategory);
  }
  
  // Upload banner button
  const uploadBannerBtn = document.getElementById("uploadBannerBtn");
  if (uploadBannerBtn) {
    uploadBannerBtn.addEventListener("click", handleUploadBanner);
  }
}

// Load initial data
async function loadInitialData() {
  showLoading(true);
  
  try {
    // Load categories
    await loadCategories();
    
    // Load products
    await loadProducts();
    
    // Load banners
    await loadBanners();
    
    // Load cart if user is logged in
    if (currentUser) {
      await loadCart();
    }
    
    // Load admin stats if admin
    if (isAdmin) {
      await loadAdminStats();
    }
    
    showLoading(false);
  } catch (error) {
    console.error("Error loading initial data:", error);
    showLoading(false);
    showNotification("Failed to load data. Please refresh the page.", "error");
  }
}

// Show/hide loading skeleton
function showLoading(show) {
  if (DOM.loadingSkeleton) {
    if (show) {
      DOM.loadingSkeleton.classList.add("active");
    } else {
      DOM.loadingSkeleton.classList.remove("active");
    }
  }
}

// Load products from Firestore
async function loadProducts() {
  try {
    const snapshot = await productsCollection
      .where("status", "==", "active")
      .limit(productsPerPage)
      .get();
    
    products = [];
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    renderProducts(products);
    updateProductCount();
  } catch (error) {
    console.error("Error loading products:", error);
    // Use dummy data if Firebase fails
    loadDummyProducts();
  }
}

// Load more products
async function loadMoreProducts() {
  try {
    const snapshot = await productsCollection
      .where("status", "==", "active")
      .limit(productsPerPage * (currentProductPage + 1))
      .get();
    
    products = [];
    snapshot.forEach(doc => {
      products.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    currentProductPage++;
    renderProducts(products);
    
    // Hide load more button if no more products
    const totalProducts = await productsCollection
      .where("status", "==", "active")
      .get();
    
    if (products.length >= totalProducts.size) {
      DOM.loadMoreBtn.style.display = "none";
    }
  } catch (error) {
    console.error("Error loading more products:", error);
    showNotification("Failed to load more products", "error");
  }
}

// Load categories from Firestore
async function loadCategories() {
  try {
    const snapshot = await categoriesCollection.get();
    categories = [];
    snapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    renderCategories(categories);
    
    // Update category select in product form
    updateCategorySelect();
  } catch (error) {
    console.error("Error loading categories:", error);
    // Use dummy categories if Firebase fails
    loadDummyCategories();
  }
}

// Load banners from Firestore
async function loadBanners() {
  try {
    const snapshot = await bannersCollection.get();
    banners = [];
    snapshot.forEach(doc => {
      banners.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    renderBanners(banners);
  } catch (error) {
    console.error("Error loading banners:", error);
    // Use dummy banners if Firebase fails
    loadDummyBanners();
  }
}

// Load cart from Firestore
async function loadCart() {
  if (!currentUser) return;
  
  try {
    const cartDoc = await cartsCollection.doc(currentUser.uid).get();
    if (cartDoc.exists) {
      cart = cartDoc.data().items || [];
    } else {
      cart = [];
    }
    
    updateCartUI();
  } catch (error) {
    console.error("Error loading cart:", error);
    cart = [];
  }
}

// Render products to the grid
function renderProducts(productsToRender) {
  if (!DOM.productsGrid) return;
  
  DOM.productsGrid.innerHTML = "";
  
  if (productsToRender.length === 0) {
    DOM.productsGrid.innerHTML = `
      <div class="no-products">
        <i class="fas fa-box-open"></i>
        <p>No products found</p>
      </div>
    `;
    return;
  }
  
  productsToRender.forEach(product => {
    const discount = product.discount || 0;
    const discountedPrice = discount > 0 ? 
      product.price * (1 - discount / 100) : 
      product.price;
    
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    if (discount > 0) {
      productCard.classList.add("discount");
      productCard.setAttribute("data-discount", `-${discount}%`);
    }
    
    productCard.innerHTML = `
      <div class="product-image">
        <img src="${product.imageUrl || 'https://via.placeholder.com/250x200?text=Product+Image'}" 
             alt="${product.title}" 
             loading="lazy">
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>
        <div class="product-price">
          <span class="current-price">৳${discountedPrice.toFixed(2)}</span>
          ${discount > 0 ? `<span class="original-price">৳${product.price.toFixed(2)}</span>` : ''}
        </div>
        <div class="product-rating">
          <div class="stars">
            ${generateStarRating(product.rating || 4.0)}
          </div>
          <span class="rating-count">(${Math.floor(Math.random() * 100) + 1})</span>
        </div>
        <button class="add-to-cart-btn" data-product-id="${product.id}">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
      </div>
    `;
    
    // Add event listeners
    const addToCartBtn = productCard.querySelector(".add-to-cart-btn");
    addToCartBtn.addEventListener("click", () => addToCart(product));
    
    const productImage = productCard.querySelector(".product-image");
    productImage.addEventListener("click", () => showProductDetails(product));
    
    DOM.productsGrid.appendChild(productCard);
  });
  
  // Update flash sale products
  renderFlashSaleProducts(productsToRender.slice(0, 6));
}

// Render flash sale products
function renderFlashSaleProducts(flashProducts) {
  const flashSaleContainer = document.querySelector(".flash-sale-products");
  if (!flashSaleContainer) return;
  
  flashSaleContainer.innerHTML = "";
  
  flashProducts.forEach(product => {
    const discount = product.discount || 15 + Math.floor(Math.random() * 40);
    const discountedPrice = product.price * (1 - discount / 100);
    
    const productCard = document.createElement("div");
    productCard.className = "product-card discount";
    productCard.setAttribute("data-discount", `-${discount}%`);
    
    productCard.innerHTML = `
      <div class="product-image">
        <img src="${product.imageUrl || 'https://via.placeholder.com/250x200?text=Flash+Sale'}" 
             alt="${product.title}">
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>
        <div class="product-price">
          <span class="current-price">৳${discountedPrice.toFixed(2)}</span>
          <span class="original-price">৳${product.price.toFixed(2)}</span>
        </div>
        <div class="product-rating">
          <div class="stars">
            ${generateStarRating(product.rating || 4.5)}
          </div>
          <span class="rating-count">(${Math.floor(Math.random() * 200) + 50})</span>
        </div>
        <button class="add-to-cart-btn" data-product-id="${product.id}">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
      </div>
    `;
    
    const addToCartBtn = productCard.querySelector(".add-to-cart-btn");
    addToCartBtn.addEventListener("click", () => addToCart(product));
    
    const productImage = productCard.querySelector(".product-image");
    productImage.addEventListener("click", () => showProductDetails(product));
    
    flashSaleContainer.appendChild(productCard);
  });
}

// Render categories
function renderCategories(categoriesToRender) {
  if (!DOM.categoriesGrid) return;
  
  DOM.categoriesGrid.innerHTML = "";
  
  // Default categories if none in database
  const defaultCategories = [
    { id: "electronics", name: "Electronics", icon: "fas fa-mobile-alt" },
    { id: "fashion", name: "Fashion", icon: "fas fa-tshirt" },
    { id: "home", name: "Home & Living", icon: "fas fa-home" },
    { id: "beauty", name: "Beauty & Health", icon: "fas fa-spa" },
    { id: "sports", name: "Sports & Outdoors", icon: "fas fa-futbol" },
    { id: "toys", name: "Toys & Games", icon: "fas fa-gamepad" },
    { id: "grocery", name: "Grocery", icon: "fas fa-shopping-basket" },
    { id: "books", name: "Books & Stationery", icon: "fas fa-book" }
  ];
  
  const categoriesList = categoriesToRender.length > 0 ? 
    categoriesToRender : defaultCategories;
  
  categoriesList.forEach(category => {
    const categoryCard = document.createElement("a");
    categoryCard.className = "category-card";
    categoryCard.href = "#";
    categoryCard.dataset.category = category.id || category.name.toLowerCase();
    
    categoryCard.innerHTML = `
      <i class="${category.iconUrl || category.icon || 'fas fa-box'}"></i>
      <h3>${category.name}</h3>
    `;
    
    categoryCard.addEventListener("click", (e) => {
      e.preventDefault();
      filterProductsByCategory(category.id || category.name.toLowerCase());
    });
    
    DOM.categoriesGrid.appendChild(categoryCard);
  });
}

// Render banners
function renderBanners(bannersToRender) {
  const bannerSlides = document.querySelector(".banner-slides");
  const sliderDots = document.querySelector(".slider-dots");
  
  if (!bannerSlides || !sliderDots) return;
  
  // Default banners if none in database
  const defaultBanners = [
    { id: 1, imageUrl: "https://via.placeholder.com/1200x400/FF6B6B/FFFFFF?text=Big+Sale+Up+to+70%25+Off" },
    { id: 2, imageUrl: "https://via.placeholder.com/1200x400/4ECDC4/FFFFFF?text=New+Arrivals+Just+Landed" },
    { id: 3, imageUrl: "https://via.placeholder.com/1200x400/45B7D1/FFFFFF?text=Free+Shipping+on+Orders+Over+৳999" }
  ];
  
  const bannersList = bannersToRender.length > 0 ? bannersToRender : defaultBanners;
  
  bannerSlides.innerHTML = "";
  sliderDots.innerHTML = "";
  
  bannersList.forEach((banner, index) => {
    // Create slide
    const slide = document.createElement("div");
    slide.className = "banner-slide";
    slide.style.backgroundImage = `url('${banner.imageUrl}')`;
    slide.dataset.index = index;
    
    // Create dot
    const dot = document.createElement("div");
    dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
    dot.dataset.index = index;
    
    dot.addEventListener("click", () => {
      goToSlide(index);
    });
    
    bannerSlides.appendChild(slide);
    sliderDots.appendChild(dot);
  });
  
  // Setup slider controls
  setupBannerSlider();
}

// Setup banner slider
function setupBannerSlider() {
  const slides = document.querySelectorAll(".banner-slide");
  const dots = document.querySelectorAll(".slider-dot");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");
  
  if (slides.length === 0) return;
  
  let currentSlide = 0;
  
  function updateSlider() {
    const bannerSlides = document.querySelector(".banner-slides");
    bannerSlides.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentSlide);
    });
  }
  
  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider();
  }
  
  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider();
  }
  
  function goToSlide(index) {
    currentSlide = index;
    updateSlider();
  }
  
  if (prevBtn) prevBtn.addEventListener("click", prevSlide);
  if (nextBtn) nextBtn.addEventListener("click", nextSlide);
  
  // Auto slide every 5 seconds
  setInterval(nextSlide, 5000);
}

// Add product to cart
async function addToCart(product) {
  if (!currentUser) {
    showAuthModal();
    showNotification("Please login to add items to cart", "info");
    return;
  }
  
  // Check if product already in cart
  const existingItemIndex = cart.findIndex(item => item.id === product.id);
  
  if (existingItemIndex > -1) {
    // Increase quantity
    cart[existingItemIndex].quantity += 1;
  } else {
    // Add new item
    const discount = product.discount || 0;
    const discountedPrice = discount > 0 ? 
      product.price * (1 - discount / 100) : 
      product.price;
    
    cart.push({
      id: product.id,
      title: product.title,
      price: discountedPrice,
      originalPrice: product.price,
      imageUrl: product.imageUrl,
      quantity: 1
    });
  }
  
  // Update cart in Firebase
  await saveCart();
  
  // Update UI
  updateCartUI();
  
  // Show success message
  showNotification("Product added to cart!", "success");
  
  // Update button text temporarily
  const addBtn = event?.target;
  if (addBtn) {
    const originalText = addBtn.innerHTML;
    addBtn.innerHTML = '<i class="fas fa-check"></i> Added';
    addBtn.classList.add("added");
    
    setTimeout(() => {
      addBtn.innerHTML = originalText;
      addBtn.classList.remove("added");
    }, 2000);
  }
}

// Remove item from cart
async function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  await saveCart();
  updateCartUI();
  showNotification("Product removed from cart", "info");
}

// Update cart quantity
async function updateCartQuantity(productId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(productId);
    return;
  }
  
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex > -1) {
    cart[itemIndex].quantity = newQuantity;
    await saveCart();
    updateCartUI();
  }
}

// Save cart to Firebase
async function saveCart() {
  if (!currentUser) return;
  
  try {
    await cartsCollection.doc(currentUser.uid).set({
      items: cart,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving cart:", error);
    showNotification("Failed to save cart", "error");
  }
}

// Update cart UI
function updateCartUI() {
  // Update cart count
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (DOM.cartCount) {
    DOM.cartCount.textContent = totalItems;
    DOM.cartCount.style.display = totalItems > 0 ? "flex" : "none";
  }
  
  // Update cart items list
  if (DOM.cartItems) {
    if (cart.length === 0) {
      DOM.cartItems.innerHTML = `
        <div class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <p>Your cart is empty</p>
        </div>
      `;
      if (DOM.checkoutBtn) DOM.checkoutBtn.disabled = true;
      return;
    }
    
    DOM.cartItems.innerHTML = "";
    let totalPrice = 0;
    
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      totalPrice += itemTotal;
      
      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";
      cartItem.innerHTML = `
        <div class="cart-item-image">
          <img src="${item.imageUrl || 'https://via.placeholder.com/80x80?text=Product'}" 
               alt="${item.title}">
        </div>
        <div class="cart-item-details">
          <h4 class="cart-item-title">${item.title}</h4>
          <div class="cart-item-price">৳${item.price.toFixed(2)}</div>
          <div class="cart-item-actions">
            <div class="quantity-control">
              <button class="quantity-btn minus" data-product-id="${item.id}">-</button>
              <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-product-id="${item.id}">
              <button class="quantity-btn plus" data-product-id="${item.id}">+</button>
            </div>
            <button class="remove-item" data-product-id="${item.id}">Remove</button>
          </div>
        </div>
      `;
      
      // Add event listeners
      const minusBtn = cartItem.querySelector(".minus");
      const plusBtn = cartItem.querySelector(".plus");
      const quantityInput = cartItem.querySelector(".quantity-input");
      const removeBtn = cartItem.querySelector(".remove-item");
      
      minusBtn.addEventListener("click", () => {
        updateCartQuantity(item.id, item.quantity - 1);
      });
      
      plusBtn.addEventListener("click", () => {
        updateCartQuantity(item.id, item.quantity + 1);
      });
      
      quantityInput.addEventListener("change", (e) => {
        const newQuantity = parseInt(e.target.value) || 1;
        updateCartQuantity(item.id, newQuantity);
      });
      
      removeBtn.addEventListener("click", () => {
        removeFromCart(item.id);
      });
      
      DOM.cartItems.appendChild(cartItem);
    });
    
    // Update total price
    if (DOM.cartTotalPrice) {
      DOM.cartTotalPrice.textContent = `৳${totalPrice.toFixed(2)}`;
    }
    
    if (DOM.checkoutBtn) DOM.checkoutBtn.disabled = false;
  }
}

// Show product details modal
function showProductDetails(product) {
  const productModal = document.getElementById("productModal");
  const productDetails = document.getElementById("productDetails");
  
  if (!productModal || !productDetails) return;
  
  const discount = product.discount || 0;
  const discountedPrice = discount > 0 ? 
    product.price * (1 - discount / 100) : 
    product.price;
  
  productDetails.innerHTML = `
    <div class="product-details">
      <div class="product-gallery">
        <div class="main-image">
          <img src="${product.imageUrl || 'https://via.placeholder.com/400x400?text=Product+Image'}" 
               alt="${product.title}" id="mainProductImage">
        </div>
        <div class="thumbnail-images">
          <div class="thumbnail active">
            <img src="${product.imageUrl || 'https://via.placeholder.com/60x60?text=Thumb+1'}" 
                 alt="Thumbnail 1">
          </div>
          <div class="thumbnail">
            <img src="https://via.placeholder.com/60x60/FF6B6B/FFFFFF?text=Thumb+2" 
                 alt="Thumbnail 2">
          </div>
          <div class="thumbnail">
            <img src="https://via.placeholder.com/60x60/4ECDC4/FFFFFF?text=Thumb+3" 
                 alt="Thumbnail 3">
          </div>
        </div>
      </div>
      <div class="product-info-details">
        <h2>${product.title}</h2>
        <div class="product-rating-details">
          <div class="stars">
            ${generateStarRating(product.rating || 4.0)}
          </div>
          <span>${product.rating || 4.0} (${Math.floor(Math.random() * 100) + 1} ratings)</span>
        </div>
        <div class="product-price-details">
          <div class="current-price-large">৳${discountedPrice.toFixed(2)}</div>
          ${discount > 0 ? `
            <div class="original-price-large">৳${product.price.toFixed(2)}</div>
            <div class="discount-badge-large">Save ${discount}%</div>
          ` : ''}
        </div>
        <div class="product-description">
          <h3>Description</h3>
          <p>${product.description || 'No description available for this product.'}</p>
        </div>
        <div class="quantity-selector">
          <label for="productQuantity">Quantity:</label>
          <div class="quantity-control">
            <button class="quantity-btn minus" id="detailMinusBtn">-</button>
            <input type="number" id="productQuantity" value="1" min="1">
            <button class="quantity-btn plus" id="detailPlusBtn">+</button>
          </div>
        </div>
        <div class="product-actions">
          <button class="btn-primary" id="addToCartDetail">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
          <button class="btn-buy-now" id="buyNowBtn">
            <i class="fas fa-bolt"></i> Buy Now
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add event listeners for product details
  const quantityInput = document.getElementById("productQuantity");
  const minusBtn = document.getElementById("detailMinusBtn");
  const plusBtn = document.getElementById("detailPlusBtn");
  const addToCartBtn = document.getElementById("addToCartDetail");
  const buyNowBtn = document.getElementById("buyNowBtn");
  
  minusBtn.addEventListener("click", () => {
    const currentVal = parseInt(quantityInput.value) || 1;
    if (currentVal > 1) {
      quantityInput.value = currentVal - 1;
    }
  });
  
  plusBtn.addEventListener("click", () => {
    const currentVal = parseInt(quantityInput.value) || 1;
    quantityInput.value = currentVal + 1;
  });
  
  addToCartBtn.addEventListener("click", () => {
    const quantity = parseInt(quantityInput.value) || 1;
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    hideModal(productModal);
  });
  
  buyNowBtn.addEventListener("click", () => {
    const quantity = parseInt(quantityInput.value) || 1;
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    hideModal(productModal);
    toggleCart();
  });
  
  // Thumbnail click events
  document.querySelectorAll(".thumbnail").forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      document.querySelectorAll(".thumbnail").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
      
      // In a real app, you would change the main image
      const mainImage = document.getElementById("mainProductImage");
      mainImage.src = thumb.querySelector("img").src;
    });
  });
  
  showModal(productModal);
}

// Authentication handlers
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const authMessage = document.getElementById("authMessage");
  
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    showNotification("Login successful!", "success");
    hideModal(DOM.authModal);
  } catch (error) {
    console.error("Login error:", error);
    showAuthMessage("Invalid email or password", "error");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  
  // Validation
  if (password !== confirmPassword) {
    showAuthMessage("Passwords do not match", "error");
    return;
  }
  
  if (password.length < 6) {
    showAuthMessage("Password must be at least 6 characters", "error");
    return;
  }
  
  try {
    // Create user
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Update profile
    await user.updateProfile({
      displayName: name
    });
    
    // Save user to Firestore
    await usersCollection.doc(user.uid).set({
      name: name,
      email: email,
      role: "user", // Default role
      createdAt: new Date().toISOString()
    });
    
    showNotification("Registration successful!", "success");
    hideModal(DOM.authModal);
  } catch (error) {
    console.error("Registration error:", error);
    showAuthMessage(error.message, "error");
  }
}

async function logout() {
  try {
    await auth.signOut();
    cart = [];
    updateCartUI();
    showNotification("Logged out successfully", "info");
  } catch (error) {
    console.error("Logout error:", error);
    showNotification("Failed to logout", "error");
  }
}

// Search functionality
function handleSearch() {
  const searchInput = document.getElementById("searchInput");
  const query = searchInput.value.trim().toLowerCase();
  
  if (!query) {
    renderProducts(products);
    return;
  }
  
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(query) ||
    (product.description && product.description.toLowerCase().includes(query))
  );
  
  renderProducts(filteredProducts);
  hideSearchSuggestions();
}

function handleSearchInput() {
  const searchInput = document.getElementById("searchInput");
  const query = searchInput.value.trim().toLowerCase();
  
  if (query.length < 2) {
    hideSearchSuggestions();
    return;
  }
  
  // Filter products for suggestions
  const suggestions = products
    .filter(product => product.title.toLowerCase().includes(query))
    .slice(0, 5);
  
  showSearchSuggestions(suggestions);
}

function showSearchSuggestions(suggestions) {
  if (!DOM.searchSuggestions) return;
  
  if (suggestions.length === 0) {
    DOM.searchSuggestions.innerHTML = `
      <div class="suggestion-item">No results found</div>
    `;
  } else {
    DOM.searchSuggestions.innerHTML = suggestions
      .map(product => `
        <div class="suggestion-item" data-product-id="${product.id}">
          ${product.title}
        </div>
      `).join("");
    
    // Add click events to suggestions
    DOM.searchSuggestions.querySelectorAll(".suggestion-item").forEach(item => {
      item.addEventListener("click", () => {
        const productId = item.dataset.productId;
        const product = products.find(p => p.id === productId);
        if (product) {
          showProductDetails(product);
          hideSearchSuggestions();
        }
      });
    });
  }
  
  DOM.searchSuggestions.classList.add("active");
}

function hideSearchSuggestions() {
  if (DOM.searchSuggestions) {
    DOM.searchSuggestions.classList.remove("active");
  }
}

// Filter products by category
function filterProductsByCategory(category) {
  if (category === "all") {
    renderProducts(products);
    return;
  }
  
  const filteredProducts = products.filter(product => 
    product.category === category
  );
  
  renderProducts(filteredProducts);
}

// Handle sort change
function handleSortChange() {
  const sortBy = document.getElementById("sortBy").value;
  let sortedProducts = [...products];
  
  switch (sortBy) {
    case "price-low":
      sortedProducts.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      sortedProducts.sort((a, b) => b.price - a.price);
      break;
    case "discount":
      sortedProducts.sort((a, b) => (b.discount || 0) - (a.discount || 0));
      break;
    case "rating":
      sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
  }
  
  renderProducts(sortedProducts);
}

// Toggle cart sidebar
function toggleCart() {
  const cartSidebar = document.getElementById("cartSidebar");
  const cartOverlay = document.getElementById("cartOverlay");
  
  if (cartSidebar && cartOverlay) {
    cartSidebar.classList.toggle("active");
    cartOverlay.classList.toggle("active");
  }
}

// Handle checkout
async function handleCheckout() {
  if (!currentUser) {
    showAuthModal();
    return;
  }
  
  if (cart.length === 0) {
    showNotification("Your cart is empty", "info");
    return;
  }
  
  try {
    // Create order
    const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
      orderId: orderId,
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email,
      items: cart,
      totalPrice: totalPrice,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    
    // Save order to Firestore
    await ordersCollection.doc(orderId).set(order);
    
    // Clear cart
    cart = [];
    await saveCart();
    updateCartUI();
    
    // Show success message
    showNotification(`Order placed successfully! Order ID: ${orderId}`, "success");
    
    // Close cart
    toggleCart();
    
    // In a real app, you would redirect to order confirmation page
  } catch (error) {
    console.error("Checkout error:", error);
    showNotification("Failed to place order", "error");
  }
}

// Admin functions
function toggleAdminPanel() {
  if (!isAdmin) {
    showNotification("Admin access required", "error");
    return;
  }
  
  const adminPanel = document.getElementById("adminPanel");
  if (adminPanel) {
    adminPanel.classList.toggle("active");
    
    if (adminPanel.classList.contains("active")) {
      loadAdminData();
    }
  }
}

async function loadAdminStats() {
  try {
    // Get counts
    const productsSnapshot = await productsCollection.get();
    const ordersSnapshot = await ordersCollection.get();
    const usersSnapshot = await usersCollection.get();
    
    // Calculate revenue
    let revenue = 0;
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      if (order.status === "delivered") {
        revenue += order.totalPrice || 0;
      }
    });
    
    // Update UI
    if (DOM.totalProducts) DOM.totalProducts.textContent = productsSnapshot.size;
    if (DOM.totalOrders) DOM.totalOrders.textContent = ordersSnapshot.size;
    if (DOM.totalUsers) DOM.totalUsers.textContent = usersSnapshot.size;
    if (DOM.totalRevenue) DOM.totalRevenue.textContent = `৳${revenue.toFixed(2)}`;
  } catch (error) {
    console.error("Error loading admin stats:", error);
  }
}

async function loadAdminData() {
  await loadAdminStats();
  await loadAdminProducts();
  await loadAdminOrders();
  await loadAdminCategories();
  await loadAdminBanners();
}

async function loadAdminProducts() {
  try {
    const snapshot = await productsCollection.get();
    const productList = document.getElementById("productList");
    
    if (!productList) return;
    
    productList.innerHTML = "";
    
    if (snapshot.empty) {
      productList.innerHTML = "<p>No products found</p>";
      return;
    }
    
    snapshot.forEach(doc => {
      const product = { id: doc.id, ...doc.data() };
      const productItem = document.createElement("div");
      productItem.className = "admin-item";
      productItem.innerHTML = `
        <div>
          <strong>${product.title}</strong>
          <div>৳${product.price} • ${product.status || 'active'}</div>
        </div>
        <div class="admin-item-actions">
          <button class="btn-secondary edit-product" data-product-id="${product.id}">Edit</button>
          <button class="btn-danger delete-product" data-product-id="${product.id}">Delete</button>
        </div>
      `;
      
      // Add event listeners
      const editBtn = productItem.querySelector(".edit-product");
      const deleteBtn = productItem.querySelector(".delete-product");
      
      editBtn.addEventListener("click", () => editProduct(product));
      deleteBtn.addEventListener("click", () => deleteProduct(product.id));
      
      productList.appendChild(productItem);
    });
  } catch (error) {
    console.error("Error loading admin products:", error);
  }
}

async function loadAdminOrders() {
  try {
    const snapshot = await ordersCollection.orderBy("createdAt", "desc").get();
    const orderList = document.getElementById("orderList");
    
    if (!orderList) return;
    
    orderList.innerHTML = "";
    
    if (snapshot.empty) {
      orderList.innerHTML = "<p>No orders found</p>";
      return;
    }
    
    snapshot.forEach(doc => {
      const order = { id: doc.id, ...doc.data() };
      const orderItem = document.createElement("div");
      orderItem.className = "order-card";
      orderItem.innerHTML = `
        <div class="order-header">
          <div>
            <strong>Order #${order.orderId}</strong>
            <div>${order.userName}</div>
          </div>
          <div class="order-status status-${order.status}">
            ${order.status}
          </div>
        </div>
        <div class="order-items">
          <div>${order.items?.length || 0} items • Total: ৳${order.totalPrice?.toFixed(2) || '0.00'}</div>
          <div>Placed: ${new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
        <div class="order-actions">
          <select class="order-status-select" data-order-id="${order.id}">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="approved" ${order.status === 'approved' ? 'selected' : ''}>Approved</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          </select>
        </div>
      `;
      
      // Add event listener for status change
      const statusSelect = orderItem.querySelector(".order-status-select");
      statusSelect.addEventListener("change", (e) => {
        updateOrderStatus(order.id, e.target.value);
      });
      
      orderList.appendChild(orderItem);
    });
  } catch (error) {
    console.error("Error loading admin orders:", error);
  }
}

async function loadAdminCategories() {
  try {
    const snapshot = await categoriesCollection.get();
    const categoryList = document.getElementById("categoryList");
    
    if (!categoryList) return;
    
    categoryList.innerHTML = "";
    
    if (snapshot.empty) {
      categoryList.innerHTML = "<p>No categories found</p>";
      return;
    }
    
    snapshot.forEach(doc => {
      const category = { id: doc.id, ...doc.data() };
      const categoryItem = document.createElement("div");
      categoryItem.className = "admin-item";
      categoryItem.innerHTML = `
        <div>
          <strong>${category.name}</strong>
        </div>
        <div class="admin-item-actions">
          <button class="btn-danger delete-category" data-category-id="${category.id}">Delete</button>
        </div>
      `;
      
      // Add event listener
      const deleteBtn = categoryItem.querySelector(".delete-category");
      deleteBtn.addEventListener("click", () => deleteCategory(category.id));
      
      categoryList.appendChild(categoryItem);
    });
  } catch (error) {
    console.error("Error loading admin categories:", error);
  }
}

async function loadAdminBanners() {
  try {
    const snapshot = await bannersCollection.get();
    const bannerList = document.getElementById("bannerList");
    
    if (!bannerList) return;
    
    bannerList.innerHTML = "";
    
    if (snapshot.empty) {
      bannerList.innerHTML = "<p>No banners found</p>";
      return;
    }
    
    snapshot.forEach(doc => {
      const banner = { id: doc.id, ...doc.data() };
      const bannerItem = document.createElement("div");
      bannerItem.className = "admin-item";
      bannerItem.innerHTML = `
        <div>
          <img src="${banner.imageUrl}" alt="Banner" style="width: 100px; height: 50px; object-fit: cover;">
        </div>
        <div class="admin-item-actions">
          <button class="btn-danger delete-banner" data-banner-id="${banner.id}">Delete</button>
        </div>
      `;
      
      // Add event listener
      const deleteBtn = bannerItem.querySelector(".delete-banner");
      deleteBtn.addEventListener("click", () => deleteBanner(banner.id));
      
      bannerList.appendChild(bannerItem);
    });
  } catch (error) {
    console.error("Error loading admin banners:", error);
  }
}

function showProductForm(product = null) {
  const modal = document.getElementById("productFormModal");
  const formTitle = document.getElementById("productFormTitle");
  const productForm = document.getElementById("productForm");
  
  if (!modal || !formTitle || !productForm) return;
  
  if (product) {
    // Edit mode
    formTitle.textContent = "Edit Product";
    document.getElementById("productId").value = product.id;
    document.getElementById("productTitle").value = product.title;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productDiscount").value = product.discount || 0;
    document.getElementById("productCategory").value = product.category || "";
    document.getElementById("productRating").value = product.rating || 4.0;
    document.getElementById("productDescription").value = product.description || "";
    document.getElementById("productImage").value = product.imageUrl || "";
    document.getElementById("productStatus").value = product.status || "active";
  } else {
    // Add mode
    formTitle.textContent = "Add New Product";
    productForm.reset();
    document.getElementById("productId").value = "";
    document.getElementById("productStatus").value = "active";
  }
  
  showModal(modal);
}

async function handleProductSubmit(e) {
  e.preventDefault();
  
  const productId = document.getElementById("productId").value;
  const title = document.getElementById("productTitle").value;
  const price = parseFloat(document.getElementById("productPrice").value);
  const discount = parseInt(document.getElementById("productDiscount").value) || 0;
  const category = document.getElementById("productCategory").value;
  const rating = parseFloat(document.getElementById("productRating").value);
  const description = document.getElementById("productDescription").value;
  const imageUrl = document.getElementById("productImage").value;
  const status = document.getElementById("productStatus").value;
  
  const productData = {
    title,
    price,
    discount,
    category,
    rating,
    description,
    status,
    updatedAt: new Date().toISOString()
  };
  
  // Add image URL if provided
  if (imageUrl) {
    productData.imageUrl = imageUrl;
  }
  
  try {
    if (productId) {
      // Update existing product
      await productsCollection.doc(productId).update(productData);
      showNotification("Product updated successfully!", "success");
    } else {
      // Add new product
      productData.createdAt = new Date().toISOString();
      await productsCollection.add(productData);
      showNotification("Product added successfully!", "success");
    }
    
    // Reload products
    await loadProducts();
    await loadAdminProducts();
    
    // Close modal
    hideModal(document.getElementById("productFormModal"));
  } catch (error) {
    console.error("Error saving product:", error);
    showNotification("Failed to save product", "error");
  }
}

async function editProduct(product) {
  showProductForm(product);
}

async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  
  try {
    await productsCollection.doc(productId).delete();
    showNotification("Product deleted successfully!", "success");
    await loadProducts();
    await loadAdminProducts();
  } catch (error) {
    console.error("Error deleting product:", error);
    showNotification("Failed to delete product", "error");
  }
}

async function handleAddCategory() {
  const categoryNameInput = document.getElementById("categoryName");
  const categoryName = categoryNameInput.value.trim();
  
  if (!categoryName) {
    showNotification("Please enter a category name", "error");
    return;
  }
  
  try {
    await categoriesCollection.add({
      name: categoryName,
      createdAt: new Date().toISOString()
    });
    
    showNotification("Category added successfully!", "success");
    categoryNameInput.value = "";
    
    // Reload categories
    await loadCategories();
    await loadAdminCategories();
    updateCategorySelect();
  } catch (error) {
    console.error("Error adding category:", error);
    showNotification("Failed to add category", "error");
  }
}

async function deleteCategory(categoryId) {
  if (!confirm("Are you sure you want to delete this category?")) return;
  
  try {
    await categoriesCollection.doc(categoryId).delete();
    showNotification("Category deleted successfully!", "success");
    await loadCategories();
    await loadAdminCategories();
    updateCategorySelect();
  } catch (error) {
    console.error("Error deleting category:", error);
    showNotification("Failed to delete category", "error");
  }
}

async function handleUploadBanner() {
  const imageInput = document.getElementById("bannerImage");
  
  if (!imageInput.files || !imageInput.files[0]) {
    showNotification("Please select an image file", "error");
    return;
  }
  
  const file = imageInput.files[0];
  const storageRef = storage.ref(`banners/${Date.now()}_${file.name}`);
  
  try {
    // Upload image to Firebase Storage
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    
    // Save banner to Firestore
    await bannersCollection.add({
      imageUrl: downloadURL,
      createdAt: new Date().toISOString()
    });
    
    showNotification("Banner uploaded successfully!", "success");
    imageInput.value = "";
    
    // Reload banners
    await loadBanners();
    await loadAdminBanners();
  } catch (error) {
    console.error("Error uploading banner:", error);
    showNotification("Failed to upload banner", "error");
  }
}

async function deleteBanner(bannerId) {
  if (!confirm("Are you sure you want to delete this banner?")) return;
  
  try {
    await bannersCollection.doc(bannerId).delete();
    showNotification("Banner deleted successfully!", "success");
    await loadBanners();
    await loadAdminBanners();
  } catch (error) {
    console.error("Error deleting banner:", error);
    showNotification("Failed to delete banner", "error");
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await ordersCollection.doc(orderId).update({
      status: status,
      updatedAt: new Date().toISOString()
    });
    
    showNotification("Order status updated!", "success");
    await loadAdminOrders();
    await loadAdminStats();
  } catch (error) {
    console.error("Error updating order status:", error);
    showNotification("Failed to update order status", "error");
  }
}

// Utility functions
function showModal(modal) {
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function hideModal(modal) {
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function showAuthModal() {
  showModal(DOM.authModal);
  switchAuthTab("login");
}

function switchAuthTab(tab) {
  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  
  // Show/hide forms
  document.querySelectorAll(".auth-form").forEach(form => {
    form.classList.toggle("active-form", form.id === `${tab}Form`);
  });
  
  // Clear messages
  const authMessage = document.getElementById("authMessage");
  if (authMessage) {
    authMessage.textContent = "";
    authMessage.className = "auth-message";
    authMessage.style.display = "none";
  }
}

function showAuthMessage(message, type) {
  const authMessage = document.getElementById("authMessage");
  if (authMessage) {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
    authMessage.style.display = "block";
  }
}

function switchAdminTab(tab) {
  // Update tab buttons
  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  
  // Show/hide tab content
  document.querySelectorAll(".admin-tab-content").forEach(content => {
    content.classList.toggle("active-tab", content.id === `admin${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
  });
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button class="close-notification">&times;</button>
  `;
  
  // Add styles if not already added
  if (!document.querySelector("#notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: var(--radius);
        color: white;
        font-weight: 500;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        box-shadow: var(--shadow-hover);
        animation: slideIn 0.3s ease;
      }
      
      .notification-info { background: #17a2b8; }
      .notification-success { background: #28a745; }
      .notification-error { background: #dc3545; }
      .notification-warning { background: #ffc107; color: #000; }
      
      .close-notification {
        background: none;
        border: none;
        color: inherit;
        font-size: 20px;
        cursor: pointer;
        margin-left: 15px;
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add close functionality
  const closeBtn = notification.querySelector(".close-notification");
  closeBtn.addEventListener("click", () => {
    notification.remove();
  });
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
  
  document.body.appendChild(notification);
}

function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  let stars = "";
  
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

function updateCategorySelect() {
  const categorySelect = document.getElementById("productCategory");
  if (!categorySelect) return;
  
  // Keep the first option
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  
  // Add categories
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category.id || category.name.toLowerCase();
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

function updateProductCount() {
  const productCount = document.querySelector(".products-count");
  if (productCount) {
    productCount.textContent = `(${products.length} products)`;
  }
}

function checkAuthState() {
  // This is handled by Firebase auth observer in firebase.js
  // We just need to make sure UI is updated
  if (currentUser) {
    updateUIForLoggedInUser(currentUser);
  } else {
    updateUIForLoggedOutUser();
  }
}

function setupFlashSaleTimer() {
  // Set end time (24 hours from now)
  const endTime = new Date();
  endTime.setHours(endTime.getHours() + 24);
  
  function updateTimer() {
    const now = new Date();
    const diff = endTime - now;
    
    if (diff <= 0) {
      // Timer expired
      document.getElementById("hours").textContent = "00";
      document.getElementById("minutes").textContent = "00";
      document.getElementById("seconds").textContent = "00";
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById("hours").textContent = hours.toString().padStart(2, '0');
    document.getElementById("minutes").textContent = minutes.toString().padStart(2, '0');
    document.getElementById("seconds").textContent = seconds.toString().padStart(2, '0');
  }
  
  // Update timer every second
  updateTimer();
  setInterval(updateTimer, 1000);
}

// Dummy data for initial display (if Firebase fails)
function loadDummyProducts() {
  products = [
    {
      id: "1",
      title: "Wireless Bluetooth Headphones",
      price: 2999,
      discount: 20,
      category: "electronics",
      rating: 4.5,
      description: "High-quality wireless headphones with noise cancellation",
      imageUrl: "https://via.placeholder.com/250x200/FF6B6B/FFFFFF?text=Headphones"
    },
    {
      id: "2",
      title: "Smart Watch Series 5",
      price: 5999,
      discount: 15,
      category: "electronics",
      rating: 4.3,
      description: "Advanced smartwatch with health monitoring features",
      imageUrl: "https://via.placeholder.com/250x200/4ECDC4/FFFFFF?text=Smart+Watch"
    },
    {
      id: "3",
      title: "Cotton T-Shirt (Pack of 3)",
      price: 899,
      discount: 30,
      category: "fashion",
      rating: 4.2,
      description: "Comfortable cotton t-shirts in various colors",
      imageUrl: "https://via.placeholder.com/250x200/45B7D1/FFFFFF?text=T-Shirts"
    },
    {
      id: "4",
      title: "Non-Stick Cookware Set",
      price: 3499,
      discount: 25,
      category: "home",
      rating: 4.7,
      description: "10-piece non-stick cookware set for your kitchen",
      imageUrl: "https://via.placeholder.com/250x200/96CEB4/FFFFFF?text=Cookware"
    },
    {
      id: "5",
      title: "Sports Running Shoes",
      price: 2499,
      discount: 10,
      category: "sports",
      rating: 4.4,
      description: "Comfortable running shoes for sports and casual wear",
      imageUrl: "https://via.placeholder.com/250x200/FFEAA7/000000?text=Running+Shoes"
    },
    {
      id: "6",
      title: "Gaming Mouse RGB",
      price: 1299,
      discount: 0,
      category: "electronics",
      rating: 4.1,
      description: "RGB gaming mouse with adjustable DPI",
      imageUrl: "https://via.placeholder.com/250x200/DDA0DD/FFFFFF?text=Gaming+Mouse"
    },
    {
      id: "7",
      title: "Moisturizing Face Cream",
      price: 699,
      discount: 20,
      category: "beauty",
      rating: 4.6,
      description: "Natural moisturizing cream for all skin types",
      imageUrl: "https://via.placeholder.com/250x200/98D8C8/FFFFFF?text=Face+Cream"
    },
    {
      id: "8",
      title: "Board Game Collection",
      price: 1599,
      discount: 15,
      category: "toys",
      rating: 4.8,
      description: "Family board game collection with 5 popular games",
      imageUrl: "https://via.placeholder.com/250x200/F7DC6F/000000?text=Board+Games"
    }
  ];
  
  renderProducts(products);
}

function loadDummyCategories() {
  categories = [
    { id: "electronics", name: "Electronics", iconUrl: "" },
    { id: "fashion", name: "Fashion", iconUrl: "" },
    { id: "home", name: "Home & Living", iconUrl: "" },
    { id: "beauty", name: "Beauty & Health", iconUrl: "" },
    { id: "sports", name: "Sports & Outdoors", iconUrl: "" },
    { id: "toys", name: "Toys & Games", iconUrl: "" },
    { id: "grocery", name: "Grocery", iconUrl: "" }
  ];
  
  renderCategories(categories);
}

function loadDummyBanners() {
  banners = [
    { id: "1", imageUrl: "https://via.placeholder.com/1200x400/FF6B6B/FFFFFF?text=Big+Sale+Up+to+70%25+Off" },
    { id: "2", imageUrl: "https://via.placeholder.com/1200x400/4ECDC4/FFFFFF?text=New+Arrivals+Just+Landed" },
    { id: "3", imageUrl: "https://via.placeholder.com/1200x400/45B7D1/FFFFFF?text=Free+Shipping+on+Orders+Over+৳999" }
  ];
  
  renderBanners(banners);
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);
