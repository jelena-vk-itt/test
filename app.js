'use strict';

// --- State ---
var categories = [];        // [{name, totalMs}]
var currentIndex = -1;      // index in categories[] of the active category
var segmentStart = null;    // Date when the current segment started
var tickInterval = null;    // setInterval handle for live updates

// --- DOM refs ---
var categoryInput = document.getElementById('category-input');
var addBtn        = document.getElementById('add-btn');
var categorySelect = document.getElementById('category-select');
var statusMsg     = document.getElementById('status-msg');
var tableBody     = document.getElementById('table-body');
var emptyMsg      = document.getElementById('empty-msg');

// --- Helpers ---

function formatTime(ms) {
  var totalSeconds = Math.floor(ms / 1000);
  var hours   = Math.floor(totalSeconds / 3600);
  var minutes = Math.floor((totalSeconds % 3600) / 60);
  var seconds = totalSeconds % 60;
  return (
    String(hours).padStart(2, '0') + ':' +
    String(minutes).padStart(2, '0') + ':' +
    String(seconds).padStart(2, '0')
  );
}

function elapsedSinceSegmentStart() {
  return segmentStart ? (Date.now() - segmentStart) : 0;
}

// --- Rendering ---

function renderTable() {
  var liveExtra = elapsedSinceSegmentStart();

  if (categories.length === 0) {
    emptyMsg.style.display = '';
    tableBody.innerHTML = '';
    return;
  }

  emptyMsg.style.display = 'none';
  tableBody.innerHTML = '';

  categories.forEach(function(cat, idx) {
    var row = document.createElement('tr');
    var displayMs = cat.totalMs + (idx === currentIndex ? liveExtra : 0);

    if (idx === currentIndex) {
      row.className = 'active-row';
    }

    var nameCell = document.createElement('td');
    nameCell.textContent = cat.name;

    var timeCell = document.createElement('td');
    timeCell.className = 'time-cell';
    timeCell.textContent = formatTime(displayMs);

    row.appendChild(nameCell);
    row.appendChild(timeCell);
    tableBody.appendChild(row);
  });
}

function updateStatus(msg) {
  statusMsg.textContent = msg;
}

// --- Event handlers ---

function onAddCategory() {
  var name = categoryInput.value.trim();
  if (!name) return;

  // Prevent duplicates
  for (var i = 0; i < categories.length; i++) {
    if (categories[i].name.toLowerCase() === name.toLowerCase()) {
      updateStatus('Category "' + name + '" already exists.');
      return;
    }
  }

  categories.push({ name: name, totalMs: 0 });

  // Add to dropdown
  var option = document.createElement('option');
  option.value = String(categories.length - 1);
  option.textContent = name;
  categorySelect.appendChild(option);

  categoryInput.value = '';
  updateStatus('Category "' + name + '" added.');
  renderTable();
}

function onSelectCategory() {
  var selectedIndex = parseInt(categorySelect.value, 10);
  if (isNaN(selectedIndex)) return;

  var now = Date.now();

  // If there is an active category, close its segment
  if (currentIndex !== -1 && segmentStart !== null) {
    categories[currentIndex].totalMs += now - segmentStart;
  }

  // Start new segment
  currentIndex = selectedIndex;
  segmentStart = now;

  updateStatus('Timing: ' + categories[currentIndex].name);
  renderTable();

  // Start live-update ticker if not already running
  if (!tickInterval) {
    tickInterval = setInterval(renderTable, 1000);
  }
}

// --- Wire up events ---

addBtn.addEventListener('click', onAddCategory);

categoryInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') onAddCategory();
});

categorySelect.addEventListener('change', onSelectCategory);

// Initial render
renderTable();
