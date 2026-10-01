(function () {
  function fit() {
    var frames = document.querySelectorAll('.rsx-frame');
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i], r = f.querySelector('.rsx'); if (!r) continue;
      var w = parseFloat(r.style.width) || 794, s = f.clientWidth / w;
      if (s > 0) { r.style.transform = 'scale(' + s + ')'; }
    }
  }
  window.RSfit = fit;
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  if (window.ResizeObserver) { var ro = new ResizeObserver(fit); var fr = document.querySelectorAll('.rsx-frame'); for (var i = 0; i < fr.length; i++) ro.observe(fr[i]); }
})();
