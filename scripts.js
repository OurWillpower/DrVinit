/* scripts.js — stable booking + mobile improvements */

document.addEventListener('DOMContentLoaded', function () {
  // Year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Prefill hidden service field when Book clicked
  document.body.addEventListener('click', function (evt) {
    var btn = evt.target.closest('.btn-book');
    if (!btn) return;
    var service = btn.getAttribute('data-service') || '';
    var svcField = document.getElementById('serviceField');
    if (!svcField) {
      var form = document.querySelector('#bookModal form');
      if (form) {
        var hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'entry.555555555';
        hidden.id = 'serviceField';
        hidden.value = service;
        form.appendChild(hidden);
      }
    } else {
      svcField.value = service;
    }
    // Update modal title
    var title = document.querySelector('#bookModal .modal-title');
    if (title) title.textContent = 'Book — ' + (service || 'Appointment');

    // Focus first input after modal shows
    setTimeout(function () {
      var first = document.querySelector('#bookModal input[type="text"], #bookModal input[type="tel"], #bookModal input[type="email"], #bookModal select');
      if (first) first.focus();
    }, 220);
  });

  // Smooth scroll for Explore Services
  var heroCta = document.querySelector('.btn-hero');
  if (heroCta) {
    heroCta.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector('#services');
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }
});