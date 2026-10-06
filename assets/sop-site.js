/* SOP maker pages: scale the static paper previews to fit their frames. */
(function () {
  function fit() {
    document.querySelectorAll('.sm-paper').forEach(function (p) { var s = p.querySelector('.sm-scale'); if (s) s.style.transform = 'scale(' + (p.clientWidth / 794) + ')'; });
  }
  fit(); window.addEventListener('resize', fit); window.addEventListener('load', fit);
})();
