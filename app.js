/**
 * ASTRAL HUB - Core Application Logic (v2.5)
 * Smart Paste, Bulk Import, Live Stock Badges & Backup
 */

const App = (function() {
  
  const CONFIG = {
    dbKey: 'astral_cuentas_v2',
    adminHash: 'QXN0cmFsMjIzNiM=' 
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
    localStorage.setItem(CONFIG.dbKey, JSON.stringify(data));
    actualizarBadgesStock();
  }
  
  function quitarSplash() {
    if (splashQuitado) return;
    splashQuitado = true;
    const splash = document.getElementById('splash');
    if (splash && !splash.classList.contains('hidden')) {
      splash.classList.add('hidden');
      document.body.classList.remove('loading');
      setTimeout(() => splash.style.display = 'none', 700);
    }
  }
  
  setTimeout(quitarSplash, 4500);

  // Actualiza los badges de stock en las tarjetas
  function actualizarBadgesStock() {
    const bd = obtenerBD();
    document.querySelectorAll('.card').forEach(card => {
      const title = card.querySelector('.card-title')?.innerText?.trim();
      const badge = card.querySelector('.stock-badge');
      if (badge && title) {
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
  }

  // Ejecutar actualización de badges al cargar
  window.addEventListener('DOMContentLoaded', actualizarBadgesStock);
  setTimeout(actualizarBadgesStock, 500);

  function abrirModalAnimado(modalId) {
    document.body.classList.add('no-scroll'); 
    const modal = document.getElementById(modalId);
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
    t.innerText = txt;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  function copiarTexto(id) {
    const txt = document.getElementById(id).innerText;
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
      document.getElementById('inpPin').value = '';
      abrirModalAnimado('modalPin');
      setTimeout(() => document.getElementById('inpPin').focus(), 300);
    }
  }

  function validarPin() {
    const pinIngresado = document.getElementById('inpPin').value;
    if (pinIngresado === atob(CONFIG.adminHash)) {
      const modalPin = document.getElementById('modalPin');
      modalPin.classList.remove('active');
      setTimeout(() => {
        modalPin.style.display = 'none';
        abrirPanelAdmin(); 
      }, 350);
    } else {
      mostrarToast("❌ Clave Incorrecta");
    }
  }

  function abrirPanelAdmin() {
    // Resetear formulario de pegado
    const smart = document.getElementById('inpSmartPaste');
    if (smart) smart.value = '';
    document.getElementById('camposIndividuales').style.display = 'block';
    const btnMasivo = document.getElementById('btnCargaMasiva');
    if (btnMasivo) btnMasivo.style.display = 'none';

    cargarListaAdmin();
    abrirModalAnimado('modalAdmin');
  }

  // --- SMART PASTE Y BULK IMPORT ---
  function procesarSmartPaste(el) {
    const texto = el.value.trim();
    if (!texto) {
      document.getElementById('camposIndividuales').style.display = 'block';
      const btnMasivo = document.getElementById('btnCargaMasiva');
      if (btnMasivo) btnMasivo.style.display = 'none';
      return;
    }

    const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lineas.length === 1) {
      // Caso 1 sola cuenta
      const linea = lineas[0];
      const sepIdx = linea.search(/[:|;\t]/);
      if (sepIdx !== -1) {
        const u = linea.substring(0, sepIdx).trim();
        const p = linea.substring(sepIdx + 1).trim();
        document.getElementById('inpUsuario').value = u;
        document.getElementById('inpClave').value = p;
        document.getElementById('camposIndividuales').style.display = 'block';
        const btnMasivo = document.getElementById('btnCargaMasiva');
        if (btnMasivo) btnMasivo.style.display = 'none';
        mostrarToast("⚡ Datos autocompletados");
      }
    } else if (lineas.length > 1) {
      // Caso masivo (lote)
      document.getElementById('camposIndividuales').style.display = 'none';
      const btnMasivo = document.getElementById('btnCargaMasiva');
      if (btnMasivo) {
        btnMasivo.style.display = 'block';
        btnMasivo.innerText = `🚀 Guardar ${lineas.length} Cuentas`;
      }
    }
  }

  function guardarLoteMasivo() {
    const plat = document.getElementById('selPlataforma').value;
    const texto = document.getElementById('inpSmartPaste').value.trim();
    const lineas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lineas.length === 0) return;

    const bd = obtenerBD();
    if (!bd[plat]) bd[plat] = [];

    let guardadas = 0;
    lineas.forEach(linea => {
      const sepIdx = linea.search(/[:|;\t]/);
      if (sepIdx !== -1) {
        const u = linea.substring(0, sepIdx).trim();
        const p = linea.substring(sepIdx + 1).trim();
        if (u && p) {
          bd[plat].push({ usuario: u, password: p });
          guardadas++;
        }
      }
    });

    if (guardadas > 0) {
      guardarBD(bd);
      document.getElementById('inpSmartPaste').value = '';
      document.getElementById('camposIndividuales').style.display = 'block';
      document.getElementById('btnCargaMasiva').style.display = 'none';
      cargarListaAdmin();
      mostrarToast(`✅ ${guardadas} cuentas guardadas`);
    } else {
      mostrarToast("⚠️ Formato incorrecto. Usa usuario:clave");
    }
  }

  function guardarCuentaAdmin() {
    const plat = document.getElementById('selPlataforma').value;
    const user = document.getElementById('inpUsuario').value.trim();
    const pass = document.getElementById('inpClave').value.trim();

    if (!user || !pass) {
      mostrarToast("⚠️ Completa los campos");
      return;
    }

    const bd = obtenerBD();
    if (!bd[plat]) bd[plat] = [];
    bd[plat].push({ usuario: user, password: pass });
    guardarBD(bd);

    document.getElementById('inpUsuario').value = '';
    document.getElementById('inpClave').value = '';
    const smart = document.getElementById('inpSmartPaste');
    if (smart) smart.value = '';

    cargarListaAdmin();
    mostrarToast("✅ Guardado con éxito");
  }

  function eliminarCuentaAdmin(plat, idx) {
    const bd = obtenerBD();
    if (bd[plat]) {
      bd[plat].splice(idx, 1);
      if (bd[plat].length === 0) delete bd[plat];
      guardarBD(bd);
      cargarListaAdmin();
      mostrarToast("🗑️ Cuenta eliminada");
    }
  }

  function cargarListaAdmin() {
    const bd = obtenerBD();
    const cont = document.getElementById('listaAdminCuentas');
    cont.innerHTML = '';
    let hayCuentas = false;

    for (let plat in bd) {
      bd[plat].forEach((c, idx) => {
        hayCuentas = true;
        const item = document.createElement('div');
        item.className = 'account-item-admin';
        item.innerHTML = `
          <div>
            <strong>${plat}</strong><br>
            <span style="color:#38bdf8;">${c.usuario}</span>
          </div>
          <button class="btn-del" onclick="App.eliminarCuentaAdmin('${plat}',${idx})">Borrar</button>
        `;
        cont.appendChild(item);
      });
    }

    if (!hayCuentas) {
      cont.innerHTML = '<div style="font-size:11px; color:#64748b; padding:8px;">No hay cuentas guardadas aún.</div>';
    }
  }

  // --- BACKUP Y RESTAURACIÓN ---
  function exportarBackup() {
    const bd = obtenerBD();
    const str = JSON.stringify(bd, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(str).then(() => {
        mostrarToast("📋 Backup copiado al portapapeles");
      });
    } else {
      prompt("Copia tu backup JSON:", str);
    }
  }

  function verCuentas(plat) {
    const bd = obtenerBD();
    document.getElementById('mUserTitle').innerText = plat;
    const cont = document.getElementById('mUserContent');
    const badge = document.getElementById('mUserBadge');
    cont.innerHTML = '';

    const cuentas = bd[plat] || [];

    if (cuentas.length > 0) {
      if (badge) {
        badge.innerText = `✅ ${cuentas.length} Disponible(s)`;
        badge.style.background = 'rgba(34, 197, 94, 0.15)';
        badge.style.color = '#4ade80';
        badge.style.borderColor = 'rgba(34, 197, 94, 0.3)';
      }

      // Mostramos las cuentas disponibles
      cuentas.forEach((c, i) => {
        const item = document.createElement('div');
        item.className = 'account-card';
        item.style.marginBottom = '12px';
        item.innerHTML = `
          <div style="font-size: 11px; color: #a855f7; font-weight: 700; margin-bottom: 6px;">OPCIÓN #${i + 1}</div>
          <div class="field-lbl">USUARIO / CORREO:</div>
          
