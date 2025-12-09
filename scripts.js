/* scripts.js
 - Prefill booking modal service field
 - Set page year
 - Lightweight behavior, no external dependencies required besides Bootstrap
*/

document.addEventListener('DOMContentLoaded', function () {
  // Set year in footer
  var yEl = document.getElementById('year');
  if (yEl) yEl.textContent = new Date().getFullYear();

  // Prefill service when Book button clicked
  document.body.addEventListener('click', function (evt) {
    var btn = evt.target.closest('.btn-book');
    if (!btn) return;
    var service = btn.getAttribute('data-service') || btn.getAttribute('data-apt-service') || '';
    var svcField = document.getElementById('serviceField');
    if (!svcField) {
      // If form field not present (older form), create hidden input for Google Form naming convention
      var modalForm = document.querySelector('#bookModal form');
      if (modalForm) {
        var hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'entry.555555555';
        hidden.id = 'serviceField';
        hidden.value = service;
        modalForm.appendChild(hidden);
      }
    } else {
      svcField.value = service;
    }

    // Update modal title (if present)
    var modalTitle = document.querySelector('#bookModal .modal-title');
    if (modalTitle) modalTitle.textContent = 'Book — ' + (service || 'Appointment');

    // focus first input after a small delay (Bootstrap will show modal)
    setTimeout(function () {
      var firstInput = document.querySelector('#bookModal input[type="text"], #bookModal input[type="tel"], #bookModal input[type="email"], #bookModal select');
      if (firstInput) firstInput.focus();
    }, 250);
  });

  // Small accessibility: allow Enter on hero 'Explore Services' to scroll smoothly
  var heroCta = document.querySelector('.btn-hero');
  if (heroCta) {
    heroCta.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector('#services');
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }
});