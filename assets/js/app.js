(function () {
  var navToggle = document.querySelector('[data-nav-toggle]');
  var navLinks = document.querySelector('[data-nav-links]');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('is-open');
    });
  }

  var filterButtons = document.querySelectorAll('[data-filter]');
  var attractionCards = document.querySelectorAll('[data-category]');

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var filter = button.getAttribute('data-filter');

      filterButtons.forEach(function (item) {
        item.classList.remove('active');
      });
      button.classList.add('active');

      attractionCards.forEach(function (card) {
        var matches = filter === 'all' || card.getAttribute('data-category') === filter;
        card.hidden = !matches;
      });
    });
  });

  var bookingForm = document.querySelector('[data-booking-form]');

  if (bookingForm) {
    var ticketType = bookingForm.querySelector('[data-ticket-type]');
    var quantity = bookingForm.querySelector('[data-quantity]');
    var total = bookingForm.querySelector('[data-total]');
    var visitDate = bookingForm.querySelector('input[name="visit_date"]');

    if (visitDate) {
      visitDate.min = new Date().toISOString().slice(0, 10);
    }

    var updateTotal = function () {
      var selected = ticketType.options[ticketType.selectedIndex];
      var price = parseInt(selected.getAttribute('data-price'), 10) || 0;
      var count = parseInt(quantity.value, 10) || 1;
      total.textContent = '$' + price * count;
    };

    ticketType.addEventListener('change', updateTotal);
    quantity.addEventListener('input', updateTotal);
    updateTotal();
  }
})();
