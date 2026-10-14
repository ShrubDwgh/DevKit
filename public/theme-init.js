// Menerapkan tema sebelum React dimuat agar tidak berkedip. Hanya membaca preferensi tema lokal.
(function () {
  var mode = 'dark';
  try {
    var t = localStorage.getItem('devkit:theme');
    if (t === 'light') mode = 'light';
    else if (t === 'system' && window.matchMedia && !window.matchMedia('(prefers-color-scheme: dark)').matches) mode = 'light';
  } catch (e) {}
  document.documentElement.setAttribute('data-theme', mode);
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', mode === 'light' ? '#F6F7F9' : '#0B0D10');
})();
