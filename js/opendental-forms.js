/*
 * Open Dental Forms Integration Script - Spring Valley Dental Associates
 * Save as: js/opendental-forms.js
 * 
 * This script handles the integration with Open Dental webforms
 * Replace the placeholder URLs with actual Open Dental form URLs
 */

// Configuration - Replace these with your actual Open Dental form URLs
const OPENDENTAL_FORMS = {
  NEW_PATIENT_FORM_URL: 'https://patientviewer.com/WebFormsGWT/GWT/WebForms/WebForms.html?DOID=20379&RKID=5353&WSDID=164555&NFID=164561&NFID=164558&NFID=164564&NFID=164567&NFID=164570',
  EXISTING_PATIENT_FORM_URL: 'https://patientviewer.com/WebForms.html?RegistrationKey=YOUR_REG_KEY&FID=124&CID=456',
  EMERGENCY_FORM_URL: 'https://patientviewer.com/WebForms.html?RegistrationKey=YOUR_REG_KEY&FID=125&CID=456',
  CONSULTATION_FORM_URL: 'https://patientviewer.com/WebForms.html?RegistrationKey=YOUR_REG_KEY&FID=126&CID=456'
};

// Analytics tracking for form usage
function trackFormUsage(formType) {
  // Replace with your analytics tracking code
  if (typeof gtag !== 'undefined') {
    gtag('event', 'form_start', {
      'event_category': 'Patient Forms',
      'event_label': formType,
      'form_type': formType
    });
  }
  
  // Console log for debugging
  console.log('Patient form opened:', formType);
}

// Main function to open Open Dental forms
function openOpenDentalForm(formUrlKey) {
  const formUrl = OPENDENTAL_FORMS[formUrlKey];
  
  if (!formUrl) {
    console.error('Form URL not found for:', formUrlKey);
    showErrorMessage('Form not available. Please call our office at (972) 852-2222.');
    return;
  }

  // Determine form type for analytics
  const formType = formUrlKey.replace('_FORM_URL', '').toLowerCase().replace('_', '-');
  
  // Track form usage
  trackFormUsage(formType);
  
  // Show loading indicator
  showLoadingMessage(formType);
  
  // Open form in new window/tab
  const formWindow = window.open(
    formUrl, 
    'SpringValleyDentistryForm',
    'width=900,height=700,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
  );
  
  // Check if popup was blocked
  if (!formWindow || formWindow.closed || typeof formWindow.closed === 'undefined') {
    showPopupBlockedMessage(formUrl);
  } else {
    // Hide loading message after a short delay
    setTimeout(hideLoadingMessage, 2000);
    
    // Focus the form window
    formWindow.focus();
    
    // Optional: Monitor when form window is closed
    const checkClosed = setInterval(() => {
      if (formWindow.closed) {
        clearInterval(checkClosed);
        onFormClosed(formType);
      }
    }, 1000);
  }
}

// Show loading message
function showLoadingMessage(formType) {
  const message = document.createElement('div');
  message.id = 'form-loading-message';
  message.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(14, 54, 90, 0.2);
      z-index: 10000;
      text-align: center;
      max-width: 400px;
      border-left: 4px solid var(--color-primary-accent, #3DA6D5);
    ">
      <div style="
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #3DA6D5;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 1rem;
      "></div>
      <h3 style="
        color: var(--color-primary, #0E365A);
        margin-bottom: 0.5rem;
        font-family: 'Montserrat', sans-serif;
      ">Opening Your Form</h3>
      <p style="
        color: var(--color-text-secondary, #7B8A97);
        margin: 0;
        font-family: 'Inter', sans-serif;
      ">Please wait while we load your secure patient form...</p>
    </div>
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    "></div>
  `;
  
  // Add spin animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(message);
}

// Hide loading message
function hideLoadingMessage() {
  const message = document.getElementById('form-loading-message');
  if (message) {
    message.remove();
  }
}

// Show error message
function showErrorMessage(errorText) {
  const message = document.createElement('div');
  message.id = 'form-error-message';
  message.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(228, 108, 94, 0.2);
      z-index: 10000;
      text-align: center;
      max-width: 400px;
      border-left: 4px solid var(--color-alert, #E46C5E);
    ">
      <div style="
        font-size: 2rem;
        color: var(--color-alert, #E46C5E);
        margin-bottom: 1rem;
      ">⚠️</div>
      <h3 style="
        color: var(--color-primary, #0E365A);
        margin-bottom: 1rem;
        font-family: 'Montserrat', sans-serif;
      ">Form Unavailable</h3>
      <p style="
        color: var(--color-text-secondary, #7B8A97);
        margin-bottom: 1.5rem;
        font-family: 'Inter', sans-serif;
      ">${errorText}</p>
      <button onclick="closeErrorMessage()" style="
        background: var(--color-primary-accent, #3DA6D5);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      ">Close</button>
    </div>
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    " onclick="closeErrorMessage()"></div>
  `;
  
  document.body.appendChild(message);
}

// Close error message
function closeErrorMessage() {
  const message = document.getElementById('form-error-message');
  if (message) {
    message.remove();
  }
}

// Show popup blocked message
function showPopupBlockedMessage(formUrl) {
  const message = document.createElement('div');
  message.id = 'popup-blocked-message';
  message.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(14, 54, 90, 0.2);
      z-index: 10000;
      text-align: center;
      max-width: 450px;
      border-left: 4px solid var(--color-primary-accent, #3DA6D5);
    ">
      <div style="
        font-size: 2rem;
        color: var(--color-primary-accent, #3DA6D5);
        margin-bottom: 1rem;
      ">🚫</div>
      <h3 style="
        color: var(--color-primary, #0E365A);
        margin-bottom: 1rem;
        font-family: 'Montserrat', sans-serif;
      ">Popup Blocked</h3>
      <p style="
        color: var(--color-text-secondary, #7B8A97);
        margin-bottom: 1.5rem;
        font-family: 'Inter', sans-serif;
        line-height: 1.5;
      ">Your browser blocked the form popup. Please allow popups for our website or click the button below to open the form in a new tab.</p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button onclick="closePopupMessage()" style="
          background: var(--color-neutral-medium, #EEF2F6);
          color: var(--color-text-primary, #24313A);
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        ">Close</button>
        <a href="${formUrl}" target="_blank" style="
          background: var(--color-primary-accent, #3DA6D5);
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
        ">Open Form</a>
      </div>
    </div>
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    " onclick="closePopupMessage()"></div>
  `;
  
  document.body.appendChild(message);
}

// Close popup blocked message
function closePopupMessage() {
  const message = document.getElementById('popup-blocked-message');
  if (message) {
    message.remove();
  }
}

// Handle when form window is closed
function onFormClosed(formType) {
  // Track form completion (note: this doesn't guarantee completion, just that window was closed)
  if (typeof gtag !== 'undefined') {
    gtag('event', 'form_closed', {
      'event_category': 'Patient Forms',
      'event_label': formType,
      'form_type': formType
    });
  }
  
  console.log('Form window closed:', formType);
  
  // Optional: Show a thank you message or next steps
  showThankYouMessage(formType);
}

// Show thank you message after form completion
function showThankYouMessage(formType) {
  const message = document.createElement('div');
  message.id = 'thank-you-message';
  message.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(143, 214, 200, 0.2);
      z-index: 10000;
      text-align: center;
      max-width: 400px;
      border-left: 4px solid var(--color-success, #8FD6C8);
    ">
      <div style="
        font-size: 2rem;
        color: var(--color-success, #8FD6C8);
        margin-bottom: 1rem;
      ">✅</div>
      <h3 style="
        color: var(--color-primary, #0E365A);
        margin-bottom: 1rem;
        font-family: 'Montserrat', sans-serif;
      ">Thank You!</h3>
      <p style="
        color: var(--color-text-secondary, #7B8A97);
        margin-bottom: 1.5rem;
        font-family: 'Inter', sans-serif;
        line-height: 1.5;
      ">If you completed your form, we'll review it and contact you within 24 hours. If you need immediate assistance, please call us at (972) 852-2222.</p>
      <button onclick="closeThankYouMessage()" style="
        background: var(--color-primary-accent, #3DA6D5);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      ">Close</button>
    </div>
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 9999;
    " onclick="closeThankYouMessage()"></div>
  `;
  
  document.body.appendChild(message);
  
  // Auto-close after 8 seconds
  setTimeout(closeThankYouMessage, 8000);
}

// Close thank you message
function closeThankYouMessage() {
  const message = document.getElementById('thank-you-message');
  if (message) {
    message.remove();
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add click event listeners to form buttons
  const formButtons = document.querySelectorAll('[data-form-type]');
  
  formButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const formType = this.getAttribute('data-form-type');
      const formUrlKey = formType.toUpperCase().replace('-', '_') + '_FORM_URL';
      openOpenDentalForm(formUrlKey);
    });
  });
  
  // Log page load for analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
      'page_title': 'Contact Forms',
      'page_location': window.location.href
    });
  }
});

// Utility function to get URL parameters (if needed for pre-filling forms)
function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

// Export functions for global access
window.openOpenDentalForm = openOpenDentalForm;
window.closeErrorMessage = closeErrorMessage;
window.closePopupMessage = closePopupMessage;
window.closeThankYouMessage = closeThankYouMessage;