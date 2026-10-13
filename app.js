/**
 * ASTRAL HUB - Core Application Logic (v2.6 Seguro)
 */

const App = (function() {
  
  const CONFIG = {
    dbKey: 'astral_cuentas_v2',
    adminHash: 'QXN0cmFsMjIzNiM=' // Clave: Astral2236#
  };

  let toquesTitulo = 0;
  let timerToques = null;
  let splashQuitado = false;

  function obtenerBD() {
    try {
      const data = localStorage.getItem(CONFIG.dbKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function guardarBD(data) {
    try {
      localStorage.setItem(CONFIG.dbKey, JSON.stringify(data));
      actualizarBadgesStock();
    } catch (e) {}
  }
  
  // Quitar pantalla de carga sí o sí
  function quitarSplash() {
    if (splashQuitado) return;
    splashQuitado = true;
    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.add('hidden');
      document.body.classList.remove('loading');
      setTimeout(() => { splash.style.display = 'none'; }, 600);
    }
  }

  // Quitar automáticamente tras 2.5 segundos
  setTimeout(quitarSplash, 2500);

  // Función segura para actualizar badges sin romper nada si no existen
  function actualizarBadgesStock() {
    try {
      const bd = obtenerBD();
      document.querySelectorAll('.card').forEach(card => {
        const titleEl = card.querySelector('.card-title');
        const badge = card.querySelector('.stock-badge');
        if (badge && titleEl) {
          const title = titleEl.innerText.trim();
          const cant = (bd[title] && bd[title].length) ? bd[title].length : 0;
          badge.innerText = cant;
          if (cant > 0) {
            badge.style.background = 'rgba(34, 197, 94, 0.2)';
            badge.style.color = '#4ade80';
            badge.style.borderColor = 'rgba(34, 197, 94, 0.4)';
          } else {
            badge.style.background = 'rgba(148, 163, 184, 0.1)';
            badge.style.color = '#64748b';
            badge.style.borderColor = 'rgba(148, 163, 184, 0.2)';
          }
        }
      });
    } catch (err) {}
  }

  function abrirModalAnimado(modalId) {
    document.body.classList.add('no-scroll'); 
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 20);
  }

  function cerrarModales() {
    document.body.classList.remove('no-scroll');
    const modales = document.querySelectorAll('.modal-overlay');
    modales.forEach(m => {
      if (m.classList.contains('active')) {
        m.classList.remove('active');
        setTimeout(() => {
          if (!m.classList.contains('active')) m.style.display = 'none';
        }, 350);
      }
    });
  }

  function mostrarToast(txt) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = txt;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  function copiarTexto(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const txt = el.innerText;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(() => mostrarToast("Copiado al portapapeles"));
    } else {
      const ta = document.createElement('textarea');
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      mostrarToast("Copiado al portapapeles");
    }
  }

  function tocarTituloAdmin() {
    toquesTitulo++;
    clearTimeout(timerToques);
    timerToques = setTimeout(() => { toquesTitulo = 0; }, 1400);

    if (toquesTitulo >= 5) {
      toquesTitulo = 0;
      const inp = document.getElementById('inpPin');
      if (inp) inp.value = '';
      abrirModalAnimado('modalPin');
      setTimeout(() => { if (inp) inp.focus(); }, 300);
    }
  }

  function validarPin() {
    const inp = document.getElementById('inpPin');
    const pinIngresado = inp ? inp.value : '';
    if (pinIngresado === atob(CONFIG.adminHash)) {
      const modalPin = document.getElementById('modalPin');
      if (modalPin) {
        modalPin.classList.remove('active');
        setTimeout(() => {
          modalPin.style.display = 'none';
          abrirPanelAdmin(); 
        }, 350);
      }
    } else {
      mostrarToast("❌ Clave Incorrecta");
    }
  }

  function abrirPanelAdmin() {
    const smart = document.getElementById('inpSmartPaste');
    if (smart) smart.value = '';
    
    const campos = document.getElementById('camposIndividuales');
    if (campos) campos.style.display = 'block';

    const btnMasivo = document.getElementById('btnCargaMasiva');
    if (btnMasivo) btnMasivo.style.display = 'none';

    cargarListaAdmin();
    abrirModalAnimado('modalAdmin');
  }

  function procesarSmartPaste(el) {
    const texto = el.value.trim();
    const campos = document.getElementById('camposIndividuales');
    const btnMasivo = document.getElementById('btnCargaMasiva');

    if (!texto) {
      if (campos) campos.style.display = 'block';
      if (btnMasivo) btnMasivo.style.display = 'none';
      return;
    }

    const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lineas.length === 1) {
      const linea = lineas[0];
      const sepIdx = linea.search(/[:|;\t]/);
      if (sepIdx !== -1) {
        const u = linea.substring(0, sepIdx).trim();
        const p = linea.substring(sepIdx + 1).trim();
        const inpU = document.getElementById('inpUsuario');
        const inpP = document.getElementById('inpClave');
        if (inpU) inpU.value = u;
        if (inpP) inpP.value = p;
        if (campos) campos.style.display = 'block';
        if (btnMasivo) btnMasivo.style.display = 'none';
        mostrarToast("⚡ Datos autocompletados");
      }
    } else if (lineas.length > 1) {
      if (campos) campos.style.display = 'none';
      if (btnMasivo) {
        btnMasivo.style.display = 'block';
        btnMas
