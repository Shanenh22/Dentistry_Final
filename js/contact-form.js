/*
 * Contact Form Enhancement Script - Spring Valley Dental Associates
 * Save as: js/contact-form.js
 * Now includes server-side form submission to process-contact-form.php
 */

document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Show loading state
      const submitBtn = document.getElementById('submitBtn');
      const formContainer = document.querySelector('.form-container');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.innerHTML = '<span class="loading"></span>Sending...';
      formContainer.classList.add('submitting');
      
      // Collect form data
      const formData = new FormData(contactForm);
      
      // Submit form to server
      fetch('process-contact-form.php', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Show success message
          const successMsg = document.getElementById('successMessage');
          successMsg.textContent = data.message;
          successMsg.style.display = 'block';
          
          // Reset form
          contactForm.reset();
          
          // Remove validation classes
          const inputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
          inputs.forEach(input => {
            input.classList.remove('error', 'success');
          });
          
          // Scroll to success message
          successMsg.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
        } else {
          // Show error message
          const successMsg = document.getElementById('successMessage');
          successMsg.style.background = 'var(--color-alert, #E46C5E)';
          successMsg.style.color = 'white';
          successMsg.textContent = data.message || 'There was an error sending your message. Please try again.';
          successMsg.style.display = 'block';
          
          // Log errors to console for debugging
          if (data.errors) {
            console.error('Form validation errors:', data.errors);
          }
        }
      })
      .catch(error => {
        console.error('Form submission error:', error);
        
        // Show fallback error message
        const successMsg = document.getElementById('successMessage');
        successMsg.style.background = 'var(--color-alert, #E46C5E)';
        successMsg.style.color = 'white';
        successMsg.textContent = 'There was an error sending your message. Please call us directly at (972) 852-2222.';
        successMsg.style.display = 'block';
      })
      .finally(() => {
        // Restore button state
        submitBtn.innerHTML = originalText;
        formContainer.classList.remove('submitting');
      });
    });

    // Auto-hide success/error message after 8 seconds
    function hideMessage() {
      setTimeout(() => {
        const successMsg = document.getElementById('successMessage');
        if (successMsg.style.display === 'block') {
          successMsg.style.display = 'none';
          // Reset message styling for next use
          successMsg.style.background = '';
          successMsg.style.color = '';
        }
      }, 8000);
    }

    // Show/hide message observer
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const successMsg = document.getElementById('successMessage');
          if (successMsg.style.display === 'block') {
            hideMessage();
          }
        }
      });
    });

    observer.observe(document.getElementById('successMessage'), {
      attributes: true,
      attributeFilter: ['style']
    });

    // Form validation enhancements with design brief colors
    const inputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', function() {
        if (!this.value.trim()) {
          this.classList.remove('success');
          this.classList.add('error');
        } else {
          this.classList.remove('error');
          this.classList.add('success');
        }
      });
      
      input.addEventListener('input', function() {
        if (this.value.trim()) {
          this.classList.remove('error');
          this.classList.add('success');
        }
      });
    });

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 6) {
          value = value.replace(/(\d{3})(\d{3})(\d+)/, '($1) $2-$3');
        } else if (value.length >= 3) {
          value = value.replace(/(\d{3})(\d+)/, '($1) $2');
        }
        e.target.value = value;
      });
    }
  }
});