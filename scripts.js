/* scripts.js
   - Prefill booking modal 'service' hidden field
   - Update page year
   - Small safety checks
*/

document.addEventListener('DOMContentLoaded', function () {
  // Set current year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Prefill service name when a Book button opens the modal
  document.body.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-bs-toggle="modal"][data-bs-target="#bookModal"]');
    if (!btn) return;
    var service = btn.dataset.service || '';
    var svcField = document.getElementById('serviceField');
    if (svcField) svcField.value = service;

    // Update modal title for user clarity
    var title = document.querySelector('#bookModal .modal-title');
    if (title) title.textContent = 'Book — ' + (service || 'Appointment');

    // Ensure first input gets focus shortly after modal shows
    setTimeout(function () {
      var nameInput = document.querySelector('#bookModal input[name^="entry."]');
      if (nameInput) nameInput.focus();
    }, 200);
  });

  // Optional: Ensure Google Form mapping shows — no further JS needed.
});