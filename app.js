/**
 * ASTRAL HUB - Core Application Logic
 * Arquitectura Modular (Módulo App)
 */

const App = (function() {
  
  // ==========================================
  // CONFIGURACIÓN Y SEGURIDAD (Obfuscada)
  // ==========================================
  const CONFIG = {
    dbKey: 'astral_cuentas_v2',
    adminHash: 'QXN0cmFsMjIzNiM=' 
  };

  let toquesTitulo = 0;
  let timerToques = null;

  // ==========================================
  // MANEJO DE BASE DE DATOS LOCAL
  // ==========================================
  function obtenerBD() {
    try {
      const data = localStorage.getItem(CONFIG.dbKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Error leyendo base de datos", e);
      return {};
    }
  }

  function guardarBD(data) {
    localStorage.setItem(CONFIG.dbKey, JSON.stringify(data));
  }

  // ==========================================
  // CONTROLADOR DE INTERFAZ (UI)
  // ==========================================
  
  // ARREGLO DE CARGA LENTA: Quita la pantalla de inicio al instante
  function quitarSplash() {
    const splash = document.getElementById('splash');
    if (splash && !splash.classList.contains('hidden')) {
      splash.classList.add('hidden');
      document.body.classList.remove('loading');
      setTimeout(() => splash.style.display = 'none', 700);
    }
  }
  
  // Dispara la apertura apenas el código básico carga (ultra rápido)
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(quitarSplash, 800); 
  });
  // Respaldo de seguridad por si falla la red
  window.addEventListener('load', quitarSplash);


  function abrirModalAnimado(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 20);
  }

  // ARREGLO DE CHOQUE DE ANIMACIONES
  function cerrarModales() {
    const modales = document.querySelectorAll('.modal-overlay');
    modales.forEach(m => {
      if (m.classList.contains('active')) {
        m.classList.remove('active');
        setTimeout(() => {
          // Solo lo oculta si no se ha vuelto a activar
          if (!m.classList.contains('active')) {
            m.style.display = 'none';
          }
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

  // ==========================================
  // MÓDULO DE ADMINISTRACIÓN (Acceso Secreto)
  // ==========================================
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
    // Decodifica la clave oculta y valida
    if (pinIngresado === atob(CONFIG.adminHash)) {
      // Cierra únicamente la ventana del PIN para que no choque
      const modalPin = document.getElementById('modalPin');
      modalPin.classList.remove('active');
      setTimeout(() => {
        modalPin.style.display = 'none';
        abrirPanelAdmin(); // Abre el panel maestro sin interferencias
      }, 350);
    } else {
      mostrarToast("❌ Clave Incorrecta");
    }
  }

  function abrirPanelAdmin() {
    cargarListaAdmin();
    abrirModalAnimado('modalAdmin');
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
          <button class="btn-del" onclick="App.eliminarCuentaAdmin('${plat}', ${idx})">Borrar</button>
        `;
        cont.appendChild(item);
      });
    }

    if (!hayCuentas) {
      cont.innerHTML = '<div style="font-size:11px; color:#64748b; padding:8px;">No hay cuentas guardadas aún.</div>';
    }
  }

  // ==========================================
  // MÓDULO DEL CATÁLOGO (Cliente)
  // ==========================================
  function verCuentas(plat) {
    const bd = obtenerBD();
    document.getElementById('mUserTitle').innerText = plat;
    const cont = document.getElementById('mUserContent');
    cont.innerHTML = '';

    if (bd[plat] && bd[plat].length > 0) {
      const c = bd[plat][0];
      cont.innerHTML = `
        <div class="account-card">
          <div class="field-lbl">USUARIO / CORREO:</div>
          <div class="field-box">
            <span id="usrVal">${c.usuario}</span>
            <button class="btn-copy-tag" onclick="App.copiarTexto('usrVal')">Copiar</button>
          </div>
          <div class="field-lbl">CONTRASEÑA:</div>
          <div class="field-box">
            <span id="pwdVal">${c.password}</span>
            <button class="btn-copy-tag" onclick="App.copiarTexto('pwdVal')">Copiar</button>
          </div>
        </div>
      `;
    } else {
      cont.innerHTML = `
        <div class="account-card" style="text-align:center; padding:18px 10px;">
          <p style="font-size:13px; color:#cbd5e1;">😔 No hay stock disponible de esta cuenta en este momento.</p>
        </div>
      `;
    }
    abrirModalAnimado('modalUser');
  }

  function filtrar(cat, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('searchInput').value = '';
    
    document.querySelectorAll('.card').forEach(card => {
      if (cat === 'todos' || card.getAttribute('data-cat') === cat) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  function filtrarBusqueda() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
      const title = card.querySelector('.card-title').innerText.toLowerCase();
      const desc = card.querySelector('.card-desc').innerText.toLowerCase();
      if (title.includes(q) || desc.includes(q)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Exponer métodos globalmente
  return {
    tocarTituloAdmin, validarPin, guardarCuentaAdmin, eliminarCuentaAdmin,
    verCuentas, cerrarModales, copiarTexto, filtrar, filtrarBusqueda
  };

})();
