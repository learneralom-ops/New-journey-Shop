// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDbc54ZsWBXFqX50KvY85kbHkUo_Ct5hLk",
    authDomain: "arifa-shop.firebaseapp.com",
    databaseURL: "https://arifa-shop-default-rtdb.firebaseio.com",
    projectId: "arifa-shop",
    storageBucket: "arifa-shop.firebasestorage.app",
    messagingSenderId: "792267788402",
    appId: "1:792267788402:web:96dd32886699ff188472eb"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Admin credentials (for demo purposes)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

// Initialize data if empty
function initializeDatabase() {
    // Check if products exist
    database.ref('products').once('value', (snapshot) => {
        if (!snapshot.exists()) {
            const initialProducts = [
                {
                    id: 1,
                    name: "Wireless Bluetooth Headphones",
                    category: "electronics",
                    price: 1599,
                    originalPrice: 2499,
                    discount: 36,
                    stock: 50,
                    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                    description: "High-quality wireless headphones with noise cancellation"
                },
                {
                    id: 2,
                    name: "Smart Watch Series 5",
                    category: "electronics",
                    price: 3999,
                    originalPrice: 5999,
                    discount: 33,
                    stock: 30,
                    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                    description: "Latest smart watch with fitness tracking"
                },
                {
                    id: 3,
                    name: "Men's Casual T-Shirt",
                    category: "fashion",
                    price: 599,
                    originalPrice: 999,
                    discount: 40,
                    stock: 100,
                    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                    description: "Premium cotton t-shirt for casual wear"
                },
                {
                    id: 4,
                    name: "Organic Green Tea",
                    category: "grocery",
                    price: 299,
                    originalPrice: 499,
                    discount: 40,
                    stock: 200,
                    image: "https://images.unsplash.com/photo-1561047029-3000c68339ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                    description: "Pure organic green tea leaves"
                },
                {
                    id: 5,
                    name: "Smartphone X Pro",
                    category: "mobile",
                    price: 29999,
                    originalPrice: 39999,
                    discount: 25,
                    stock: 20,
                    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                    description: "Latest smartphone with triple camera"
                },
                {
                    id: 6,
                    name: "Leather Wallet",
                    category: "accessories",
                    price: 899,
                    originalPrice: 1499,
                    discount: 40,
                    stock: 75,
                    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                    description: "Genuine leather wallet with multiple compartments"
                }
            ];
            
            initialProducts.forEach(product => {
                database.ref('products/' + product.id).set(product);
            });
            
            // Initialize categories
            const categories = [
                { id: 'sex-toy', name: 'Sex Toy', count: 0, icon: 'fas fa-heart' },
                { id: 'electronics', name: 'Electronics', count: 2, icon: 'fas fa-laptop' },
                { id: 'fashion', name: 'Fashion', count: 1, icon: 'fas fa-tshirt' },
                { id: 'grocery', name: 'Grocery', count: 1, icon: 'fas fa-shopping-basket' },
                { id: 'mobile', name: 'Mobile', count: 1, icon: 'fas fa-mobile-alt' },
                { id: 'accessories', name: 'Accessories', count: 1, icon: 'fas fa-glasses' }
            ];
            
            categories.forEach(category => {
                database.ref('categories/' + category.id).set(category);
            });
            
            console.log("Database initialized with sample data");
        }
    });
}

// Call initialize function when page loads
document.addEventListener('DOMContentLoaded', initializeDatabase);
