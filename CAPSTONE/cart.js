// cart.js (Shared Cart System with outside click to close cart modal)

let currentItem = {};
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// 📍 Fixed location of Brisk n' Brew Café
const storeLocation = { lat: 14.5776, lng: 120.9944 }; 

function openPopup(name, price) {
    currentItem = {
        name: name,
        price: parseFloat(price.replace(/[^\d.]/g, '')),
        quantity: 1
    };
    document.getElementById("popupItemName").textContent = name;
    document.getElementById("popupItemPrice").textContent = price;
    document.getElementById("quantity").textContent = currentItem.quantity;
    document.getElementById("itemPopup").classList.remove("hidden");
}

function closePopup() {
    document.getElementById("itemPopup").classList.add("hidden");
}

function changeQuantity(amount) {
    currentItem.quantity = Math.max(1, currentItem.quantity + amount);
    document.getElementById("quantity").textContent = currentItem.quantity;
}

function addToCart() {
    const existing = cart.find(item => item.name === currentItem.name);
    if (existing) {
        existing.quantity += currentItem.quantity;
    } else {
        cart.push({ ...currentItem });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    closePopup();
    updateCartCount();
}

function updateCartCount() {
    const btn = document.querySelector(".cart-button");
    if (!btn) return;
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    btn.textContent = `🛒 See My Cart (${totalQty})`;
}

function openCart() {
    const list = document.getElementById("cartItemsList");
    const totalDisplay = document.getElementById("cartTotal");
    list.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const li = document.createElement('li');
        li.innerHTML = `${item.name} x ${item.quantity} = P${itemTotal} <button class="remove-item-btn" onclick="removeItem(${index})">✖</button>`;
        list.appendChild(li);
    });

    totalDisplay.textContent = `Total: P${total}`;
    document.getElementById("cartModal").classList.remove("hidden");
}

function closeCart() {
    document.getElementById("cartModal").classList.add("hidden");
}

function removeItem(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    openCart();
}

function clearCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    openCart();
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();

    document.querySelectorAll('.food-item-box, .beverage-item').forEach(box => {
        box.style.cursor = 'pointer';
        box.addEventListener('click', () => {
            const name = box.querySelector('.food-name, .beverage-name')?.textContent || '';
            const price = box.querySelector('.food-price, .beverage-price')?.textContent || 'P0';
            openPopup(name, price);
        });
    });

    // Close cart modal if user clicks outside of cart-modal-content
    document.getElementById("cartModal").addEventListener('click', (e) => {
        if (e.target.id === 'cartModal') {
            closeCart();
        }
    });

    // Close item popup if user clicks outside of popup-content
    document.getElementById("itemPopup").addEventListener('click', (e) => {
        if (e.target.id === 'itemPopup') {
            closePopup();
        }
    });
});
// ==========================
// Delivery Distance Checker
// ==========================

// Haversine Formula to calculate distance (km) between two lat/lng
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Geocode address using OpenStreetMap (Nominatim API)
async function calculateDistance(address) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        if (data.length === 0) {
            alert("❌ Address not found. Please check spelling.");
            return null;
        }

        const customerLat = parseFloat(data[0].lat);
        const customerLon = parseFloat(data[0].lon);

        const distance = haversine(storeLocation.lat, storeLocation.lng, customerLat, customerLon);
        console.log(`📍 Distance: ${distance.toFixed(2)} km`);

        // If farther than 5km → show reminder + block beverage
        if (distance > 5) {
            alert("⚠️ Friendly Reminder from Brisk n Brew:\nTo ensure the best quality of our products, some items like beverages may not be available for delivery to locations more than 5 kilometers from our store.");
            
            document.querySelectorAll('.beverage-item').forEach(item => {
                item.style.pointerEvents = "none";
                item.style.opacity = "0.5";
                item.setAttribute("title", "Not available for delivery beyond 5km");
            });
        } else {
            document.querySelectorAll('.beverage-item').forEach(item => {
                item.style.pointerEvents = "auto";
                item.style.opacity = "1";
                item.removeAttribute("title");
            });
        }

        return distance;
    } catch (err) {
        console.error("Geocoding error:", err);
        return null;
    }
}

