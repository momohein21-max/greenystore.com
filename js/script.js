/* ===========================================================
   Greeny Store - Unified script.js
   Consolidates: shopping cart, deals, registration, 
   customer service, checkout integration
   =========================================================== */

(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  const qs = (s, ctx = document) => ctx.querySelector(s);
  const qsa = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const safeJSONParse = (str, fallback) => {
    try { return JSON.parse(str); } catch (e) { return fallback; }
  };

  const localKey = 'greeny-cart-items';
  const userKey = 'greenyStoreUser';

  function formatPrice(price) {
    if (typeof price !== 'number') price = Number(price) || 0;
    return price.toFixed(2);
  }

  /**
   * showAlert - attempts to write into a custom alert container (#customAlert)
   * if present, otherwise falls back to native alert().
   */
  function showAlert(message) {
    const container = qs('#customAlert');
    if (container) {
      container.innerText = message;
      container.style.display = 'block';
      // hide after a short time
      setTimeout(() => { container.style.display = 'none'; }, 5000);
    } else {
      alert(message);
    }
  }

  /* ---------- App State ---------- */
  let selectedItem = {};
  let cartItems = [];
  let currentQuantity = 1;

  /* ---------- Product Choices (bundle options) ---------- */
  const SMOOTHIE_CHOICES = [
      { value: 'Energy Boost', label: 'Energy Boost Smoothie (€5.10)' },
      { value: 'Green Detox', label: 'Green Detox Smoothie (€5.50)' },
      { value: 'Mango Delight', label: 'Mango Delight Smoothie (€5.35)' },
      { value: 'Diabetic-Friendly', label: 'Diabetic-Friendly Smoothie (€5.00)' }
  ];

  const FRESH_JUICE_CHOICES = [
      { value: 'Orange Pure', label: 'Orange Pure (€4.50)' },
      { value: 'Apple Glow', label: 'Apple Glow (€4.30)' },
      { value: 'Watermelon Fresh', label: 'Watermelon Fresh (€4.70)' },
      { value: 'Carrot Delight', label: 'Carrot Delight (€4.60)' },
      { value: 'Tropical Blast', label: 'Tropical Blast (€5.00)' }
  ];

  const DETOX_ENERGY_CHOICES = [
      { value: 'Ginger Lemon Detox', label: 'Ginger Lemon Detox (€4.50)' },
      { value: 'Turmeric Shot', label: 'Turmeric Shot (€4.80)' },
      { value: 'Wheatgrass Pure', label: 'Wheatgrass Pure (€5.20)' },
      { value: 'Beetroot Revive', label: 'Beetroot Revive (€4.90)' }
  ];

  /*
  |--------------------------------------------------------------------------
  | CART PERSISTENCE - LOCALSTORAGE
  |--------------------------------------------------------------------------
  | Loads and saves cart data to persist across page refreshes
  */

  function loadCart() {
    const raw = localStorage.getItem(localKey);
    const parsed = safeJSONParse(raw, null);
    if (parsed && Array.isArray(parsed.items)) {
      cartItems = parsed.items;
    } else {
      cartItems = [];
    }
    updateCartCountAndUI();
  }

  function saveCart() {
    try {
      const payload = { items: cartItems, updated: new Date().toISOString() };
      localStorage.setItem(localKey, JSON.stringify(payload));
    } catch (err) {
      console.error('Failed to save cart:', err);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | MODAL / BUNDLE UI FUNCTIONS
  |--------------------------------------------------------------------------
  */

  function populateBundleSelectors(id) {
    const container = qs('#smoothie-selectors');
    if (!container) return;
    container.innerHTML = '';

    let choices;
    if (id === 905) choices = SMOOTHIE_CHOICES;
    else if (id === 906) choices = FRESH_JUICE_CHOICES;
    else if (id === 907) choices = DETOX_ENERGY_CHOICES;
    else return;

    const defaultOption = '<option value="">--- Select Choice ---</option>';
    const optionsHtml = choices.map(c => `<option value="${c.value}">${c.label}</option>`).join('');

    // Create three dropdown selectors for bundle
    for (let i=1; i<=3; i++){
      const select = document.createElement('select');
      select.id = `bundle-choice-${i}`;
      select.className = 'choice-select form-control';
      select.innerHTML = defaultOption + optionsHtml;
      container.appendChild(select);
    }
  }

  function updateModalUI() {
    const qtyDisplay = qs('#modal-qty-display');
    const qtyHidden = qs('#modal-qty');
    const priceBtn = qs('#modal-price-btn');

    if (qtyDisplay) qtyDisplay.innerText = currentQuantity;
    if (qtyHidden) qtyHidden.value = currentQuantity;
    if (priceBtn) {
      const total = (selectedItem && selectedItem.price) ? (selectedItem.price * currentQuantity) : 0;
      priceBtn.innerText = formatPrice(total);
    }
  }

  function openDetails(id, name, desc, price, img) {
    const isBundleDeal = (id >= 905 && id <= 907);
    selectedItem = { id, name, desc, price: Number(price) || 0, img, isBundleDeal };
    currentQuantity = 1;

    const modal = qs('#detailsModal');
    if (!modal) {
      console.warn('Modal not present on page.');
      return;
    }

 //----
    function openDetails(itemData) {
    
    const modalImg = document.getElementById('modal-img');
    

    if (itemData && itemData.imageUrl) {
 
        modalImg.src = itemData.imageUrl; 
        modalImg.alt = itemData.name;
    } else {

        modalImg.src = ''; 
    }

    document.getElementById('modal-title').textContent = itemData.name;
    document.getElementById('modal-desc').textContent = itemData.description;
    document.getElementById('modal-price-btn').textContent = itemData.price.toFixed(2);
    
    document.getElementById('detailsModal').style.display = 'block'; 
}
//---


    const modalTitle = qs('#modal-title');
    const modalDesc = qs('#modal-desc');
    const modalImg = qs('#modal-img');
    const bundleOptions = qs('#bundle-options');

    if (modalTitle) modalTitle.innerText = name || '';
    if (modalDesc) modalDesc.innerText = desc || '';
    if (modalImg && img) modalImg.src = img;

    // Reset request field
    const req = qs('#modal-request'); 
    if (req) req.value = '';

    // Show/hide bundle selectors
    if (bundleOptions) {
      if (isBundleDeal) {
        bundleOptions.style.display = 'block';
        populateBundleSelectors(id);
      } else {
        bundleOptions.style.display = 'none';
      }
    }

    updateModalUI();
    modal.style.display = 'flex';
  }

   function closeDetails() {
    document.getElementById('detailsModal').style.display = 'none';
    const modal = qs('#detailsModal');
    if (modal) modal.style.display = 'none';
  }
function changeQty(delta) {
  const newQty = currentQuantity + (Number(change) || 0);
    if (newQty >= 1) {
      currentQuantity = newQty;
      updateModalUI();
}
}
  function changeQty(change) {
    const newQty = currentQuantity + (Number(change) || 0);
    if (newQty >= 1) {
      currentQuantity = newQty;
      updateModalUI();
    }
  }
  
  /*
  |--------------------------------------------------------------------------
  | CART MANAGEMENT FUNCTIONS
  |--------------------------------------------------------------------------
  */

  function findCartIndexForItem(itemId, request) {
    return cartItems.findIndex(it => {
      if (!it) return false;
      if (it.itemId !== itemId) return false;
      if ((it.request || '') === (request || '')) return true;
      return false;
    });
  }

  function addToCart() {
    if (!selectedItem || !selectedItem.id) {
      showAlert('No item selected to add.');
      return;
    }

    const qtyToAdd = Number(currentQuantity) || 1;
    const reqEl = qs('#modal-request');
    let specialRequest = reqEl ? reqEl.value.trim() : '';
    let choicesValid = true;

    if (selectedItem.isBundleDeal) {
      const c1 = qs('#bundle-choice-1') ? qs('#bundle-choice-1').value : '';
      const c2 = qs('#bundle-choice-2') ? qs('#bundle-choice-2').value : '';
      const c3 = qs('#bundle-choice-3') ? qs('#bundle-choice-3').value : '';

      if (!c1 || !c2 || !c3) {
        showAlert(`Please select all 3 choices for "${selectedItem.name}".`);
        choicesValid = false;
      } else {
        const bundleChoices = [c1, c2, c3].join(', ');
        const choiceType = selectedItem.name.includes('Smoothie') ? 'Smoothie Choices' : 
                          selectedItem.name.includes('Juice') ? 'Juice Choices' : 'Drink Choices';
        specialRequest = specialRequest ? 
                        `${choiceType}: ${bundleChoices}. Note: ${specialRequest}` : 
                        `${choiceType}: ${bundleChoices}`;
      }
    }

    if (!choicesValid) return;

    const existingIndex = findCartIndexForItem(selectedItem.id, specialRequest);
    if (existingIndex > -1) {
      cartItems[existingIndex].qty += qtyToAdd;
      cartItems[existingIndex].totalPrice = cartItems[existingIndex].price * cartItems[existingIndex].qty;
    } else {
      cartItems.push({
        itemId: selectedItem.id,
        name: selectedItem.name,
        price: Number(selectedItem.price) || 0,
        qty: qtyToAdd,
        img: selectedItem.img || '',
        request: specialRequest || '',
        totalPrice: (Number(selectedItem.price) || 0) * qtyToAdd,
        isBundleDeal: !!selectedItem.isBundleDeal
      });
    }

    saveCart();
    updateCartCountAndUI();
    closeDetails();
  }

  function updateCartCountAndUI() {
    const badge = qs('#cart-count');
    const count = cartItems.reduce((sum, it) => sum + (it.qty || 0), 0);
    if (badge) badge.innerText = count;

    const header = qs('.sidebar-header h2');
    if (header) header.innerText = `Cart (${count} Item${count === 1 ? '' : 's'})`;
    saveCart();
  }

  function renderCartItems() {
    const container = qs('.cart-items');
    const totalPriceEl = qs('.total-summary .total-price');
    if (!container) return;

    container.innerHTML = '';
    let subtotal = 0;
    let totalCount = 0;

    if (!cartItems || cartItems.length === 0) {
      container.innerHTML = '<p style="text-align:center;padding:40px 20px;color:#777">Your cart is empty!</p>';
    } else {
      cartItems.forEach((item, idx) => {
        subtotal += Number(item.totalPrice) || 0;
        totalCount += Number(item.qty) || 0;

        const requestText = item.request ? 
          `<p class="item-request" style="font-style:italic;color:#333;font-size:0.85rem;margin:3px 0 5px;">${escapeHtml(item.request).substring(0,70)}${String(item.request).length>70 ? '...' : ''}</p>` : '';

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.dataset.index = idx;
        el.innerHTML = `
          <div class="item-image-wrapper">
            <img src="${escapeAttr(item.img)}" alt="${escapeAttr(item.name)}">
          </div>
          <div class="item-details">
            <p class="item-name">${escapeHtml(item.name)}</p>
            ${requestText}
            <div class="item-qty-controls">
              <div class="qty-selector-group small">
                <button data-action="decrease" aria-label="Decrease">−</button>
                <span class="item-qty-display">${item.qty}</span>
                <button data-action="increase" aria-label="Increase">+</button>
              </div>
            </div>
          </div>
          <div class="item-total-and-remove">
            <span class="item-total">€${formatPrice(item.totalPrice)}</span>
            <button class="remove-item" data-action="remove" aria-label="Remove item">🗑️</button>
          </div>
        `;
        
        el.addEventListener('click', function (ev) {
          const action = ev.target.dataset.action;
          if (!action) return;
          if (action === 'decrease') updateCartItemQty(idx, -1);
          if (action === 'increase') updateCartItemQty(idx, +1);
          if (action === 'remove') removeFromCart(idx);
        });
        container.appendChild(el);
      });
    }

    if (totalPriceEl) totalPriceEl.innerText = `€${formatPrice(subtotal)}`;
    const badge = qs('#cart-count'); 
    if (badge) badge.innerText = totalCount;
    const header = qs('.sidebar-header h2'); 
    if (header) header.innerText = `Cart (${totalCount} Item${totalCount === 1 ? '' : 's'})`;
  }

  function viewCart() {
    const sidebar = qs('#cartSidebar');
    if (!sidebar) { 
      showAlert('Cart UI not present on this page.'); 
      return; 
    }
    sidebar.classList.add('open');
    renderCartItems();
    updateCartCountAndUI();
  }

  function closeCart() {
    const sidebar = qs('#cartSidebar');
    if (sidebar) sidebar.classList.remove('open');
  }

  function updateCartItemQty(index, change) {
    if (!cartItems[index]) return;
    const newQty = (cartItems[index].qty || 0) + Number(change || 0);
    if (newQty > 0) {
      cartItems[index].qty = newQty;
      cartItems[index].totalPrice = Number(cartItems[index].price || 0) * newQty;
      saveCart();
      renderCartItems();
      updateCartCountAndUI();
    } else {
      removeFromCart(index);
    }
  }

  function removeFromCart(index) {
    if (index < 0 || index >= cartItems.length) return;
    cartItems.splice(index, 1);
    saveCart();
    renderCartItems();
    updateCartCountAndUI();
  }

  /*
  |--------------------------------------------------------------------------
  | CHECKOUT PROCESS - REGISTRATION INTEGRATION
  |--------------------------------------------------------------------------
  */

  function startCheckout() {
    if (!cartItems || cartItems.length === 0) {
      showAlert('Your cart is empty. Please add items before checking out!');
      return;
    }
    
    closeCart();

    const userData = localStorage.getItem(userKey);
    const customerIsLoggedIn = userData !== null;

    if (customerIsLoggedIn) {
      showAlert('Welcome back! Proceeding to Payment & Shipping.\n\nIn a full implementation, this would redirect to a payment gateway.');
    } else {
      const needsToRegister = confirm(
        'To complete your order, please create an account or log in.\n\n' + 
        'Press OK to Register a new account.\n' + 
        'Press Cancel if you already have an account to Log In.'
      );
      
      if (needsToRegister) {
        window.location.href = 'registration.html';
      } else {
        showAlert('Login functionality will be implemented in a future phase.\n\nFor now, please register a new account.');
        window.location.href = 'registration.html';
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | UTILITY FUNCTIONS
  |--------------------------------------------------------------------------
  */

  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  
  function escapeAttr(s='') { 
    return escapeHtml(s); 
  }

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER SERVICE - FAQ ACCORDION
  |--------------------------------------------------------------------------
  */

  function toggleFAQ(button) {
    try {
      if (!button) return;
      const answer = button.nextElementSibling;
      if (!answer) {
        console.warn('toggleFAQ: no nextElementSibling found for', button);
        return;
      }

      // Are we opening or closing?
      const isOpen = button.classList.contains('active');

      // Close all FAQs first (accordion behaviour)
      qsa('.faq-question').forEach(faqBtn => {
        const ans = faqBtn.nextElementSibling;
        faqBtn.classList.remove('active');
        faqBtn.setAttribute('aria-expanded', 'false');
        if (ans) {
          ans.classList.remove('show');
          ans.setAttribute('aria-hidden', 'true');
          // reset inline styles to closed
          ans.style.maxHeight = '0px';
          ans.style.display = 'none';
        }
      });

      if (!isOpen) {
        // open clicked one
        button.classList.add('active');
        button.setAttribute('aria-expanded', 'true');

        // ensure answer is visible and animate
        answer.classList.add('show');
        answer.setAttribute('aria-hidden', 'false');
        answer.style.display = 'block';

        // allow a moment for display:block to take effect, then set maxHeight for transition
        // compute a reasonable maxHeight using scrollHeight
        const targetHeight = answer.scrollHeight || 400;
        // use requestAnimationFrame to ensure style changes apply
        requestAnimationFrame(() => {
          answer.style.maxHeight = targetHeight + 'px';
        });
      } else {
        // closing handled by the loop above (we already removed classes)
        // nothing else to do
      }

      console.debug('toggleFAQ:', button.textContent.trim().slice(0,60), '->', isOpen ? 'closed' : 'opened');
    } catch (err) {
      console.error('toggleFAQ error', err);
    }
  }
 

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER SERVICE - CONTACT FORM
  |--------------------------------------------------------------------------
  */

  function validateContactForm() {
    const out = { isValid: true, errors: [] };
    const nameEl = qs('#contactName'); 
    const emailEl = qs('#contactEmail');
    const subjectEl = qs('#contactSubject'); 
    const msgEl = qs('#contactMessage');
    
    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const subject = subjectEl ? subjectEl.value : '';
    const message = msgEl ? msgEl.value.trim() : '';

    if (!name || name.length < 2) { 
      out.isValid=false; 
      out.errors.push('Enter your full name (min 2 chars).'); 
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) { 
      out.isValid=false; 
      out.errors.push('Enter a valid email address.'); 
    }
    
    if (!subject) { 
      out.isValid=false; 
      out.errors.push('Select a subject.'); 
    }
    
    if (!message || message.length < 10) { 
      out.isValid=false; 
      out.errors.push('Enter a message (at least 10 characters).'); 
    }
    
    return out;
  }

  function handleContactFormSubmit(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    const form = qs('#contactForm');
    if (!form) return;
    
    console.log('Contact form submitted - validating...');
    
    const validation = validateContactForm();
    if (!validation.isValid) {
      showAlert('❌ Please fix the following errors:\n\n' + validation.errors.join('\n'));
      return;
    }
    
    const data = {
      name: qs('#contactName') ? qs('#contactName').value.trim() : '',
      email: qs('#contactEmail') ? qs('#contactEmail').value.trim() : '',
      subject: qs('#contactSubject') ? qs('#contactSubject').value : '',
      message: qs('#contactMessage') ? qs('#contactMessage').value.trim() : '',
      timestamp: new Date().toISOString()
    };
    
    console.log('Contact Form Data:', data);
    
    showAlert('✅ Message Sent Successfully!\n\nThank you for contacting Greeny Store, ' + data.name + '!\n\nWe will respond to your message within 24 hours.');
    
    const success = qs('#successMessage'); 
    if (success) success.style.display = 'block';
    
    form.reset();
    
    if (success) success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => { 
      if (success) success.style.display = 'none'; 
    }, 5000);
  }

  /*
  |--------------------------------------------------------------------------
  | REGISTRATION FORM - VALIDATION FUNCTIONS
  |--------------------------------------------------------------------------
  */

  function toggleValidation(input, errorEl, isValid) {
    if (!input) return;
    if (isValid) {
      input.classList.remove('is-invalid'); 
      input.classList.add('is-valid');
      if (errorEl) errorEl.style.display = 'none';
    } else {
      input.classList.remove('is-valid'); 
      input.classList.add('is-invalid');
      if (errorEl) errorEl.style.display = 'block';
    }
  }

  function validateFullName() {
    const el = qs('#fullName'); 
    const err = qs('#fullNameError');
    if (!el) return true;
    const ok = el && el.value.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(el.value.trim());
    toggleValidation(el, err, ok);
    return ok;
  }

  function validateEmail() {
    const el = qs('#email'); 
    const err = qs('#emailError');
    if (!el) return true;
    const pat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const ok = el && pat.test(el.value.trim());
    toggleValidation(el, err, ok);
    return ok;
  }

  function validatePhone() {
    const el = qs('#phone'); 
    const err = qs('#phoneError');
    if (!el) return true;
    const clean = el.value.replace(/\D/g,'');
    const ok = clean.length >= 10 && clean.length <= 15;
    toggleValidation(el, err, ok);
    return ok;
  }

  function validateAddress() {
    const el = qs('#address'); 
    const err = qs('#addressError');
    if (!el) return true;
    const ok = el && el.value.trim().length >= 5;
    toggleValidation(el, err, ok);
    return ok;
  }

  function validateCity() {
    const el = qs('#city'); 
    const err = qs('#cityError');
    if (!el) return true;
    const ok = el && el.value.trim().length >= 2;
    toggleValidation(el, err, ok);
    return ok;
  }

  function validatePostalCode() {
    const el = qs('#postalCode'); 
    const err = qs('#postalCodeError');
    if (!el) return true;
    const ok = el && el.value.trim().length >= 3;
    toggleValidation(el, err, ok);
    return ok;
  }

  // Get password elements globally (may not exist on all pages)
  let passwordInput = null;
  let confirmPasswordInput = null;
  let passwordStrengthBar = null;

  function updatePasswordStrength(password) {
    if (!passwordStrengthBar) return;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    passwordStrengthBar.className = 'password-strength';
    if (score <= 1) passwordStrengthBar.classList.add('strength-weak');
    else if (score <= 3) passwordStrengthBar.classList.add('strength-medium');
    else passwordStrengthBar.classList.add('strength-strong');
  }

  function validatePassword() {
    const pwdInput = qs('#password');
    if (!pwdInput) return true;
    
    const pwd = pwdInput.value || '';
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const isLongEnough = pwd.length >= 8;
    
    const ok = hasUpper && hasLower && hasNumber && isLongEnough;
    toggleValidation(pwdInput, qs('#passwordError'), ok);
    updatePasswordStrength(pwd);
    
    const confirmPwd = qs('#confirmPassword');
    if (confirmPwd && confirmPwd.value) validateConfirmPassword();
    
    return ok;
  }

  function validateConfirmPassword() {
    const confirmPwd = qs('#confirmPassword');
    const pwdInput = qs('#password');
    
    if (!confirmPwd || !pwdInput) return true;
    
    const ok = confirmPwd.value === pwdInput.value && confirmPwd.value.length > 0;
    toggleValidation(confirmPwd, qs('#confirmPasswordError'), ok);
    return ok;
  }

  function validateTerms() {
    const terms = qs('#terms'); 
    const err = qs('#termsError');
    if (!terms) return true;
    const ok = terms && terms.checked;
    if (err) err.style.display = ok ? 'none' : 'block';
    return ok;
  }

  /*
  |--------------------------------------------------------------------------
  | REGISTRATION FORM - SUBMISSION HANDLER
  |--------------------------------------------------------------------------
  */

  function handleRegistrationSubmit(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    const form = qs('#registrationForm');
    if (!form) return;

    console.log('Registration form submitted - validating...');

    const validations = {
      fullName: validateFullName(),
      email: validateEmail(),
      phone: validatePhone(),
      address: validateAddress(),
      city: validateCity(),
      postalCode: validatePostalCode(),
      password: validatePassword(),
      confirmPassword: validateConfirmPassword(),
      terms: validateTerms()
    };

    console.log('Validation results:', validations);

    const allValid = Object.values(validations).every(v => v === true);

    if (!allValid) {
      const errors = [];
      if (!validations.fullName) errors.push('- Full Name must be at least 2 characters and contain only letters');
      if (!validations.email) errors.push('- Valid email address required');
      if (!validations.phone) errors.push('- Phone number must be 10-15 digits');
      if (!validations.address) errors.push('- Address must be at least 5 characters');
      if (!validations.city) errors.push('- City name is required');
      if (!validations.postalCode) errors.push('- Postal code is required');
      if (!validations.password) errors.push('- Password must be at least 8 characters with uppercase, lowercase, and number');
      if (!validations.confirmPassword) errors.push('- Passwords do not match');
      if (!validations.terms) errors.push('- You must agree to Terms & Conditions');

      showAlert('Please fix the following errors:\n\n' + errors.join('\n'));

      const firstErr = qs('.is-invalid');
      if (firstErr) { 
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
        firstErr.focus(); 
      }
      return;
    }

    const userData = {
      fullName: qs('#fullName') ? qs('#fullName').value.trim() : '',
      email: qs('#email') ? qs('#email').value.trim() : '',
      phone: qs('#phone') ? qs('#phone').value.trim() : '',
      address: qs('#address') ? qs('#address').value.trim() : '',
      city: qs('#city') ? qs('#city').value.trim() : '',
      postalCode: qs('#postalCode') ? qs('#postalCode').value.trim() : '',
      newsletter: qs('#newsletter') ? !!qs('#newsletter').checked : false,
      registrationDate: new Date().toISOString()
    };

    console.log('User data to save:', userData);

    try {
      localStorage.setItem(userKey, JSON.stringify(userData));
      console.log('User data saved successfully');
      
      showAlert('🎉 Registration Successful!\n\nWelcome to Greeny Store, ' + userData.fullName + '!\n\nYour account has been created successfully.');
      
      const successModal = qs('#successModal');
      if (successModal) {
        successModal.style.display = 'flex';
      } else {
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      }
      
    } catch (e) {
      console.error('Failed to store registration data', e);
      showAlert('Error: Could not save registration data. Please try again.');
    }
  }

  function redirectToHome() {
    window.location.href = 'index.html';
  }

  /*
  |--------------------------------------------------------------------------
  | GLOBAL FUNCTION EXPORTS
  |--------------------------------------------------------------------------
  */

  window.openDetails = openDetails;
  window.closeDetails = closeDetails;
  window.addToCart = addToCart;
  window.changeQty = changeQty;
  window.viewCart = viewCart;
  window.closeCart = closeCart;
  window.updateCartItemQty = updateCartItemQty;
  window.removeFromCart = removeFromCart;
  window.startCheckout = startCheckout;
  window.toggleFAQ = toggleFAQ;
  window.redirectToHome = redirectToHome;
  // expose handlers so inline forms / external scripts can call them if needed
  window.handleRegistrationSubmit = handleRegistrationSubmit;
  window.handleContactFormSubmit = handleContactFormSubmit;

  /*
  |--------------------------------------------------------------------------
  | PAGE INITIALIZATION - DOMCONTENTLOADED
  |--------------------------------------------------------------------------
  */

  document.addEventListener('DOMContentLoaded', function () {
    console.log('Greeny Store script initializing...');
    
    loadCart();

    passwordInput = qs('#password');
    confirmPasswordInput = qs('#confirmPassword');
    passwordStrengthBar = qs('#passwordStrength');

    const contactForm = qs('#contactForm');
    if (contactForm) {
      console.log('Contact form found - attaching handler');
      contactForm.addEventListener('submit', handleContactFormSubmit);
    }

    const regForm = qs('#registrationForm');
    if (regForm) {
      console.log('Registration form found - attaching handler');
      regForm.addEventListener('submit', handleRegistrationSubmit);
      
      if (qs('#fullName')) {
        qs('#fullName').addEventListener('blur', validateFullName);
        qs('#fullName').addEventListener('input', function() {
          if (this.classList.contains('is-invalid')) validateFullName();
        });
      }
      
      if (qs('#email')) {
        qs('#email').addEventListener('blur', validateEmail);
        qs('#email').addEventListener('input', function() {
          if (this.classList.contains('is-invalid')) validateEmail();
        });
      }
      
      if (qs('#phone')) {
        qs('#phone').addEventListener('blur', validatePhone);
        qs('#phone').addEventListener('input', function() {
          if (this.classList.contains('is-invalid')) validatePhone();
        });
      }
      
      if (qs('#address')) {
        qs('#address').addEventListener('blur', validateAddress);
        qs('#address').addEventListener('input', function() {
          if (this.classList.contains('is-invalid')) validateAddress();
        });
      }
      
      if (qs('#city')) {
        qs('#city').addEventListener('blur', validateCity);
        qs('#city').addEventListener('input', function() {
          if (this.classList.contains('is-invalid')) validateCity();
        });
      }
      
      if (qs('#postalCode')) {
        qs('#postalCode').addEventListener('blur', validatePostalCode);
        qs('#postalCode').addEventListener('input', function() {
          if (this.classList.contains('is-invalid')) validatePostalCode();
        });
      }
      
      if (passwordInput) {
        passwordInput.addEventListener('input', validatePassword);
      }
      
      if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validateConfirmPassword);
      }
      
      if (qs('#terms')) {
        qs('#terms').addEventListener('change', validateTerms);
      }
    }

    qsa('.faq-question').forEach(btn => {
      btn.addEventListener('click', function () { toggleFAQ(this); });
    });

    const detailsModal = qs('#detailsModal');
    if (detailsModal) {
      detailsModal.addEventListener('click', function (ev) {
        if (ev.target === detailsModal) closeDetails();
      });
    }

    const successModal = qs('#successModal');
    if (successModal) {
      successModal.addEventListener('click', function (ev) {
        if (ev.target === successModal) successModal.style.display = 'none';
      });
    }

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        closeDetails();
        closeCart();
        if (successModal) successModal.style.display = 'none';
      }
    });

    updateModalUI();

    console.log('Greeny Store - Unified script.js loaded successfully');
  });

})();
