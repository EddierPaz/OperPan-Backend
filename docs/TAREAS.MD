FFFF
















Preguntas Clave para Generar los Templates:
1. Sobre las bases (base.html):
¿Cómo están estructurados los base.html de admin y empleado?

Adjunto los archivos base.html y base.html
Base de administrador: contiene  tareas operativas , novedades , reportes.
Iniciaremos con el administrador

¿Tienen bloques definidos? (ej: {% block content %}, {% block extra_css %}, {% block extra_js %})

Analiza el codigo y ahi estará

¿Qué bloques específicos tienen para insertar contenido?
Analiza el codigo y ahi estará

2. Sobre los archivos HTML de tareas:
Los archivos 2-tareas.html y 3-tareas.html que me enviaste, ¿están completos o son solo el contenido (sin el base.html)?
son solo el contenido sin el base.html 

¿Estos archivos ya usan el base.html o son páginas independientes?
los archivos ya usan base.html, te enviaré cuentas.html para que tomes de referencia

3. Sobre los archivos estáticos (CSS y JS):
¿Tienes archivos CSS específicos para tareas (ej: tareas.css)?
te enviare el css  de tareas admin

¿Tienes archivos JS específicos para tareas (ej: tareas.js)?
A continuacion el codigo de tareas .html incluyendo su js

<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <title>OperPan | Tareas (Admin)</title>
    
  <!-- Meta Tags SEO -->
  <meta name="description" content="OperPan — Sistema de Gestión de Personal para Estación Paisa. Automatiza procesos administrativos, control de asistencia, horarios, permisos y reportes." />
  <meta name="keywords" content="gestión de personal, recursos humanos, control de asistencia, horarios, permisos, reportes, Estación Paisa, OperPan" />
  <meta name="author" content="ClessLab: EddierPaz, Paula Herrera, Santiago Muñeton" />
  <meta name="robots" content="index, follow" />

  <!-- Open Graph / Facebook -->
  <meta property="og:title" content="OperPan — Sistema de Gestión de Personal · Estación Paisa" />
  <meta property="og:description" content="Centraliza la gestión del personal y optimiza la operación administrativa de Estación Paisa. Todo en un solo lugar, seguro y organizado." />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://github.com/operpangestion/OperPan/blob/main/Assets/img/logo/00-operpan.png" />
  <meta property="og:url" content="https://operpangestion.github.io/OperPan/" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="OperPan — Sistema de Gestión de Personal" />
  <meta name="twitter:description" content="Gestión integral de empleados, horarios, asistencia y permisos para Estación Paisa." />
  <meta name="twitter:image" content="https://github.com/operpangestion/OperPan/blob/main/Assets/img/logo/00-operpan.png" />

  <link rel="icon" type="image/png" href="../../../Assets/img/logo/00-operpan.png" />

  <!-- Bootstrap 5 + Icons + Google Fonts -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="../Assets/style.css">
  <link rel="stylesheet" href="../Assets/tareas.css">
</head>

<body>
  <div class="wrapper">
    <!-- SIDEBAR NEGRA -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="logo-area">
          <div class="logo-icon">
            <img src="../../../Assets/img/logo/01-estacion-paisa.png" alt="Empresa">
          </div>
        </div>
      </div>
      <nav class="nav-menu">
        <ul>
          <li><a href="../landingAdmin.html"><i class="bi bi-grid-3x3-gap-fill"></i> Inicio</a></li>
          <li><a href="./7-horarios.html"><i class="bi bi-calendar3-week"></i> Horarios</a></li>
          <li><a href="./1-cuentas.html"><i class="bi bi-people"></i> Cuentas</a></li>
          <li class="active"><a href="./2-tareas.html"><i class="bi bi-list-task"></i> Tareas Operativas</a></li>
          <li><a href="./3-novedades.html"><i class="bi bi-megaphone"></i> Novedades</a></li>
          <li><a href="./4-reportes.html"><i class="bi bi-bar-chart"></i> Reportes</a></li>
        </ul>
      </nav>
      <div class="p-3 border-top border-secondary">
        <a class="soporte"
          href="https://mail.google.com/mail/?view=cm&fs=1&to=eddierpaz9@gmail.com&su=Soporte%20OperPan">
          <small><i class="bi bi-question-circle me-2"></i>Ayuda / Soporte</small>
        </a>
      </div>
      <div class="p-3 border-top border-secondary">
        <small class="text-white-50"><i class="bi bi-shield-lock"></i> v2.0 · Administrador</small>
      </div>
    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <div class="main-content">
      <header class="topbar">
        <div class="d-flex align-items-center gap-3">
          <button class="menu-toggle btn btn-dark" id="menuToggle"><i class="bi bi-list"></i></button>
          <div class="company-info">
            <h2>Gestión de Tareas</h2>
            <p>Asigna, modifica y da seguimiento a las tareas del personal</p>
          </div>
        </div>
        <div class="user-info">
          <div class="user-badge">
            <i class="bi bi-shield-fill-check"></i>
            <span>Administrador</span>
          </div>
          <button class="btn-logout" id="logoutBtn"><i class="bi bi-box-arrow-right"></i> Salir</button>
        </div>
      </header>

      <main class="dashboard-container">
        <!-- KPIs -->
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <div class="stat-card d-flex justify-content-between">
              <div><span class="text-muted">Pendientes</span>
                <h3 id="pendientesCount">0</h3>
              </div><i class="bi bi-hourglass-split fs-2" style="color:#A40706;"></i>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card d-flex justify-content-between">
              <div><span class="text-muted">En progreso</span>
                <h3 id="progresoCount">0</h3>
              </div><i class="bi bi-arrow-repeat fs-2" style="color:#A40706;"></i>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card d-flex justify-content-between">
              <div><span class="text-muted">Finalizadas</span>
                <h3 id="finalizadasCount">0</h3>
              </div><i class="bi bi-check2-circle fs-2" style="color:#1E7B48;"></i>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card d-flex justify-content-between">
              <div><span class="text-muted">Total asignadas</span>
                <h3 id="totalCount">0</h3>
              </div><i class="bi bi-list-task fs-2" style="color:#A40706;"></i>
            </div>
          </div>
        </div>

        <!-- Formulario de asignación/edición -->
        <div class="form-section">
          <h3 class="mb-3"><i class="bi bi-plus-circle-fill me-2"></i> <span id="formTitle">Asignar nueva tarea</span>
          </h3>
          <form id="taskForm">
            <div class="row g-3">
              <div class="col-12"><label class="form-label">Título *</label><input type="text" class="form-control"
                  id="titulo" required placeholder="Ej: Limpieza de vitrina"></div>
              <div class="col-md-6"><label class="form-label">Empleado *</label><select class="form-select"
                  id="empleadoId" required></select></div>
              <div class="col-md-6"><label class="form-label">Prioridad *</label><select class="form-select"
                  id="prioridad">
                  <option value="alta">Alta</option>
                  <option value="media" selected>Media</option>
                  <option value="baja">Baja</option>
                </select></div>
              <div class="col-12"><label class="form-label">Descripción *</label><textarea class="form-control"
                  id="descripcion" rows="2" required placeholder="Instrucciones detalladas..."></textarea></div>
              <div class="col-md-3"><label class="form-label">Fecha límite *</label><input type="date"
                  class="form-control" id="fechaLimite" required></div>
              <div class="col-md-3"><label class="form-label">Hora límite</label><input type="time" class="form-control"
                  id="horaLimite"></div>
              <div class="col-md-3"><label class="form-label">Área</label><select class="form-select" id="area">
                  <option value="">Sin área</option>
                  <option>Panadería</option>
                  <option>Repostería</option>
                  <option>Servicio al Cliente</option>
                  <option>Aseo</option>
                  <option>Producción</option>
                </select></div>
              <div class="col-md-3"><label class="form-label">Turno asociado</label><select class="form-select"
                  id="turno">
                  <option value="mañana">Mañana (6am-2pm)</option>
                  <option value="tarde">Tarde (2pm-10pm)</option>
                  <option value="noche">Noche (10pm-6am)</option>
                </select></div>
              <div class="col-12 d-flex gap-3">
                <button type="submit" class="btn btn-primary-corporate"><i class="bi bi-save"></i> Guardar
                  tarea</button>
                <button type="button" class="btn btn-outline-corporate" id="cancelarEdicion"
                  style="display:none;">Cancelar</button>
                <button type="reset" class="btn btn-outline-secondary">Limpiar</button>
              </div>
            </div>
          </form>
        </div>

        <!-- Filtros y búsqueda -->
        <div class="d-flex justify-content-between align-items-center flex-wrap mb-3">
          <h3><i class="bi bi-table me-2"></i> Listado de tareas</h3>
          <div class="filters-bar">
            <button class="btn btn-sm filter-btn active" data-filter="todas">Todas</button>
            <button class="btn btn-sm filter-btn" data-filter="pendiente">Pendientes</button>
            <button class="btn btn-sm filter-btn" data-filter="progreso">En progreso</button>
            <button class="btn btn-sm filter-btn" data-filter="finalizada">Finalizadas</button>
          </div>
        </div>
        <div class="input-group mb-3 w-50"><input type="text" class="form-control" id="searchTask"
            placeholder="Buscar por título, empleado..."><button class="btn btn-outline-secondary" id="searchBtn"><i
              class="bi bi-search"></i></button></div>

        <div id="tasksContainer"></div>
        <footer><i class="bi bi-shield-check"></i> Trazabilidad completa - Cada acción queda registrada en auditoría
        </footer>
      </main>
    </div>
  </div>

  <!-- Modal confirmación -->
  <div class="modal fade" id="confirmModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirmar acción</h5><button type="button" class="btn-close"
            data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" id="modalBodyText"></div>
        <div class="modal-footer"><button type="button" class="btn btn-secondary"
            data-bs-dismiss="modal">Cancelar</button><button type="button" class="btn btn-danger"
            id="confirmActionBtn">Confirmar</button></div>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div class="toast-message" id="liveToast" style="display:none;">
    <div class="bg-white rounded-3 shadow p-3 border-start border-4 border-danger">
      <div class="d-flex gap-2"><i class="bi bi-info-circle-fill text-danger fs-5"></i><span id="toastMsg"></span></div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    // ============================================================
    // MÓDULO DE GESTIÓN DE TAREAS - ADMINISTRADOR (OperPan)
    // Cumple: RF-TR-01 a RF-TR-04, RNF-TR-01 a RNF-TR-05, RN-TR-01 a RN-TR-11
    // Trazabilidad, notificaciones, persistencia localStorage
    // ============================================================

    const STORAGE_TASKS = "operpan_tareas_admin";
    const STORAGE_AUDIT = "operpan_audit_tareas";
    const STORAGE_USERS = "operpan_usuarios"; // Desde módulo cuentas

    let tareas = [];
    let auditLog = [];
    let empleados = [];
    let editandoId = null;
    let filtroActual = "todas";
    let busquedaActual = "";

    // Inicializar datos de ejemplo si no existen
    function inicializarDatos() {
      // Cargar empleados desde localStorage (creados en módulo cuentas)
      const storedUsers = localStorage.getItem(STORAGE_USERS);
      if (storedUsers) {
        empleados = JSON.parse(storedUsers).filter(u => u.estado === "activo");
      } else {
        empleados = [
          { id: "EMP-2024-156", nombres: "Eddie R", apellidos: "Paz Pardo", cargo: "Panadero Principal", rol: "empleado" },
          { id: "EMP-2024-155", nombres: "María", apellidos: "González Torres", cargo: "Repostera", rol: "empleado" },
          { id: "EMP-2024-154", nombres: "Carlos", apellidos: "Rodríguez Ruiz", cargo: "Servicio al Cliente", rol: "empleado" }
        ];
      }

      const storedTasks = localStorage.getItem(STORAGE_TASKS);
      if (!storedTasks) {
        const hoy = new Date().toISOString().split('T')[0];
        tareas = [
          { id: "t1", titulo: "Limpieza de vitrina de postres", empleadoId: "EMP-2024-156", descripcion: "Realizar limpieza profunda de vitrinas", fechaLimite: "2025-04-16", horaLimite: "16:00", prioridad: "alta", area: "Repostería", turno: "mañana", estado: "pendiente", fechaAsignacion: "2025-04-14T10:00:00", historialCambios: [] },
          { id: "t2", titulo: "Limpieza de baños", empleadoId: "EMP-2024-155", descripcion: "Desinfección completa", fechaLimite: "2025-04-15", horaLimite: "15:00", prioridad: "media", area: "Aseo", turno: "tarde", estado: "progreso", fechaAsignacion: "2025-04-13T09:30:00", historialCambios: [] },
          { id: "t3", titulo: "Organización de mesas", empleadoId: "EMP-2024-154", descripcion: "Organizar mesas del comedor", fechaLimite: "2025-04-12", horaLimite: "17:00", prioridad: "baja", area: "Servicio al Cliente", turno: "tarde", estado: "finalizada", fechaAsignacion: "2025-04-10T11:00:00", fechaFinalizacion: "2025-04-12T16:30:00", historialCambios: [] }
        ];
        localStorage.setItem(STORAGE_TASKS, JSON.stringify(tareas));
      } else {
        tareas = JSON.parse(storedTasks);
      }

      const storedAudit = localStorage.getItem(STORAGE_AUDIT);
      auditLog = storedAudit ? JSON.parse(storedAudit) : [];
    }

    function guardarDatos() {
      localStorage.setItem(STORAGE_TASKS, JSON.stringify(tareas));
      localStorage.setItem(STORAGE_AUDIT, JSON.stringify(auditLog));
    }

    function registrarAuditoria(accion, detalles, tareaId, empleadoAfectado) {
      const registro = {
        fecha: new Date().toISOString(),
        administrador: "Administrador Principal",
        accion,
        detalles,
        tareaId,
        empleadoAfectado,
        timestamp: Date.now()
      };
      auditLog.unshift(registro);
      if (auditLog.length > 200) auditLog.pop();
      guardarDatos();
      console.log("[AUDITORÍA TAREAS]", registro);
      // Notificación simulada al empleado (RNF-TR-02)
      if (empleadoAfectado) {
        mostrarMensaje(`Notificación enviada al empleado: ${accion} en tarea "${detalles}"`, "info");
      }
    }

    function mostrarMensaje(msg, tipo = "success") {
      const toast = document.getElementById("liveToast");
      const span = document.getElementById("toastMsg");
      span.innerText = msg;
      toast.style.display = "block";
      setTimeout(() => toast.style.display = "none", 3000);
    }

    function renderizarSelectEmpleados() {
      const select = document.getElementById("empleadoId");
      if (!select) return;
      select.innerHTML = '<option value="" disabled selected>Seleccionar empleado</option>';
      empleados.forEach(emp => {
        select.innerHTML += `<option value="${emp.id}">${emp.nombres} ${emp.apellidos} (${emp.cargo})</option>`;
      });
    }

    function actualizarKPIs() {
      const pendientes = tareas.filter(t => t.estado === "pendiente").length;
      const progreso = tareas.filter(t => t.estado === "progreso").length;
      const finalizadas = tareas.filter(t => t.estado === "finalizada").length;
      document.getElementById("pendientesCount").innerText = pendientes;
      document.getElementById("progresoCount").innerText = progreso;
      document.getElementById("finalizadasCount").innerText = finalizadas;
      document.getElementById("totalCount").innerText = tareas.length;
    }

    function filtrarTareas() {
      let filtradas = tareas.filter(t => {
        if (filtroActual !== "todas" && t.estado !== filtroActual) return false;
        if (busquedaActual) {
          const empleado = empleados.find(e => e.id === t.empleadoId);
          const nombreEmpleado = empleado ? `${empleado.nombres} ${empleado.apellidos}` : "";
          return t.titulo.toLowerCase().includes(busquedaActual) || nombreEmpleado.toLowerCase().includes(busquedaActual);
        }
        return true;
      });
      return filtradas.sort((a, b) => new Date(b.fechaAsignacion) - new Date(a.fechaAsignacion));
    }

    function renderizarTareas() {
      const container = document.getElementById("tasksContainer");
      if (!container) return;
      const filtradas = filtrarTareas();
      if (filtradas.length === 0) {
        container.innerHTML = '<div class="alert alert-light text-center">No hay tareas con los filtros seleccionados.</div>';
        return;
      }
      let html = '';
      filtradas.forEach(t => {
        const empleado = empleados.find(e => e.id === t.empleadoId) || { nombres: "Desconocido", apellidos: "" };
        const prioridadClass = t.prioridad === "alta" ? "priority-high" : (t.prioridad === "media" ? "priority-medium" : "priority-low");
        const prioridadText = t.prioridad === "alta" ? "🔴 Alta" : (t.prioridad === "media" ? "🟡 Media" : "🟢 Baja");
        const estadoClass = t.estado === "pendiente" ? "badge-pendiente" : (t.estado === "progreso" ? "badge-progreso" : "badge-finalizada");
        const estadoText = t.estado === "pendiente" ? "Pendiente" : (t.estado === "progreso" ? "En progreso" : "Finalizada");
        html += `
        <div class="task-card">
          <div class="d-flex justify-content-between align-items-start flex-wrap">
            <div><h5 class="mb-1">${t.titulo}</h5><span class="${prioridadClass}">${prioridadText}</span> <span class="badge-status ${estadoClass}">${estadoText}</span></div>
            <div><small class="text-muted"><i class="bi bi-person"></i> ${empleado.nombres} ${empleado.apellidos}</small></div>
          </div>
          <p class="mt-2 mb-2">${t.descripcion}</p>
          <div class="d-flex gap-3 small text-muted"><span><i class="bi bi-calendar"></i> Límite: ${t.fechaLimite} ${t.horaLimite ? t.horaLimite : ''}</span><span><i class="bi bi-briefcase"></i> ${t.area || 'Sin área'}</span><span><i class="bi bi-clock"></i> Turno: ${t.turno === 'mañana' ? 'Mañana' : (t.turno === 'tarde' ? 'Tarde' : 'Noche')}</span></div>
          <div class="mt-3 d-flex gap-2">
            ${t.estado !== "finalizada" ? `<button class="btn btn-sm btn-outline-primary editarTarea" data-id="${t.id}"><i class="bi bi-pencil"></i> Editar</button>
            <button class="btn btn-sm btn-outline-success cambiarEstado" data-id="${t.id}" data-estado="progreso"><i class="bi bi-arrow-repeat"></i> Progreso</button>
            <button class="btn btn-sm btn-outline-success cambiarEstado" data-id="${t.id}" data-estado="finalizada"><i class="bi bi-check-lg"></i> Finalizar</button>` : ''}
            <button class="btn btn-sm btn-outline-danger eliminarTarea" data-id="${t.id}"><i class="bi bi-trash"></i> Eliminar</button>
          </div>
        </div>
      `;
      });
      container.innerHTML = html;
      actualizarKPIs();

      // Eventos dinámicos
      document.querySelectorAll(".editarTarea").forEach(btn => btn.addEventListener("click", () => editarTarea(btn.dataset.id)));
      document.querySelectorAll(".cambiarEstado").forEach(btn => btn.addEventListener("click", () => cambiarEstadoTarea(btn.dataset.id, btn.dataset.estado)));
      document.querySelectorAll(".eliminarTarea").forEach(btn => btn.addEventListener("click", () => confirmarEliminacion(btn.dataset.id)));
    }

    function editarTarea(id) {
      const tarea = tareas.find(t => t.id === id);
      if (!tarea) return;
      if (tarea.estado === "finalizada") {
        mostrarMensaje("No se puede editar una tarea ya finalizada.", "error");
        return;
      }
      editandoId = id;
      document.getElementById("formTitle").innerText = "Editar tarea";
      document.getElementById("titulo").value = tarea.titulo;
      document.getElementById("empleadoId").value = tarea.empleadoId;
      document.getElementById("prioridad").value = tarea.prioridad;
      document.getElementById("descripcion").value = tarea.descripcion;
      document.getElementById("fechaLimite").value = tarea.fechaLimite;
      document.getElementById("horaLimite").value = tarea.horaLimite || "";
      document.getElementById("area").value = tarea.area || "";
      document.getElementById("turno").value = tarea.turno;
      document.getElementById("cancelarEdicion").style.display = "inline-block";
    }

    function cancelarEdicion() {
      editandoId = null;
      document.getElementById("formTitle").innerText = "Asignar nueva tarea";
      document.getElementById("taskForm").reset();
      document.getElementById("cancelarEdicion").style.display = "none";
    }

    document.getElementById("cancelarEdicion")?.addEventListener("click", cancelarEdicion);

    document.getElementById("taskForm")?.addEventListener("submit", function (e) {
      e.preventDefault();
      const titulo = document.getElementById("titulo").value.trim();
      const empleadoId = document.getElementById("empleadoId").value;
      const prioridad = document.getElementById("prioridad").value;
      const descripcion = document.getElementById("descripcion").value.trim();
      const fechaLimite = document.getElementById("fechaLimite").value;
      const horaLimite = document.getElementById("horaLimite").value;
      const area = document.getElementById("area").value;
      const turno = document.getElementById("turno").value;

      if (!titulo || !empleadoId || !descripcion || !fechaLimite) {
        mostrarMensaje("Complete todos los campos obligatorios.", "error");
        return;
      }
      const hoy = new Date().toISOString().split('T')[0];
      if (fechaLimite < hoy) {
        mostrarMensaje("La fecha límite no puede ser anterior a hoy.", "error");
        return;
      }

      if (editandoId) {
        const idx = tareas.findIndex(t => t.id === editandoId);
        if (idx !== -1 && tareas[idx].estado !== "finalizada") {
          const old = tareas[idx];
          tareas[idx] = { ...old, titulo, empleadoId, prioridad, descripcion, fechaLimite, horaLimite, area, turno, ultimaModificacion: new Date().toISOString() };
          registrarAuditoria("MODIFICAR TAREA", `Tarea "${titulo}" modificada`, editandoId, empleadoId);
          mostrarMensaje("Tarea actualizada correctamente.", "success");
        } else {
          mostrarMensaje("No se puede modificar una tarea finalizada.", "error");
        }
        cancelarEdicion();
      } else {
        const nuevaTarea = {
          id: Date.now().toString(),
          titulo, empleadoId, prioridad, descripcion, fechaLimite, horaLimite, area, turno,
          estado: "pendiente",
          fechaAsignacion: new Date().toISOString(),
          historialCambios: []
        };
        tareas.push(nuevaTarea);
        registrarAuditoria("ASIGNAR TAREA", `Tarea "${titulo}" asignada a empleado ${empleadoId}`, nuevaTarea.id, empleadoId);
        mostrarMensaje(`Tarea "${titulo}" asignada correctamente.`, "success");
        document.getElementById("taskForm").reset();
      }
      guardarDatos();
      renderizarTareas();
    });

    function cambiarEstadoTarea(id, nuevoEstado) {
      const tarea = tareas.find(t => t.id === id);
      if (!tarea) return;
      if (tarea.estado === "finalizada" && nuevoEstado !== "finalizada") {
        mostrarMensaje("No se puede cambiar estado de una tarea finalizada.", "error");
        return;
      }
      const estadoAnterior = tarea.estado;
      tarea.estado = nuevoEstado;
      if (nuevoEstado === "finalizada") {
        tarea.fechaFinalizacion = new Date().toISOString();
      }
      registrarAuditoria("CAMBIAR ESTADO", `Tarea "${tarea.titulo}" cambió de ${estadoAnterior} a ${nuevoEstado}`, id, tarea.empleadoId);
      mostrarMensaje(`Estado actualizado a "${nuevoEstado}".`, "success");
      guardarDatos();
      renderizarTareas();
    }

    let eliminarId = null;
    function confirmarEliminacion(id) {
      const tarea = tareas.find(t => t.id === id);
      if (!tarea) return;
      eliminarId = id;
      const modal = new bootstrap.Modal(document.getElementById("confirmModal"));
      document.getElementById("modalBodyText").innerHTML = `¿Eliminar permanentemente la tarea "${tarea.titulo}"? Esta acción se registrará en auditoría.`;
      document.getElementById("confirmActionBtn").onclick = () => {
        if (eliminarId) {
          const idx = tareas.findIndex(t => t.id === eliminarId);
          if (idx !== -1) {
            const eliminada = tareas[idx];
            tareas.splice(idx, 1);
            registrarAuditoria("ELIMINAR TAREA", `Tarea "${eliminada.titulo}" eliminada`, eliminarId, eliminada.empleadoId);
            mostrarMensaje("Tarea eliminada correctamente.", "success");
            guardarDatos();
            renderizarTareas();
          }
          eliminarId = null;
          modal.hide();
        }
      };
      modal.show();
    }

    // Filtros y búsqueda
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        filtroActual = this.getAttribute("data-filter");
        renderizarTareas();
      });
    });
    document.getElementById("searchBtn")?.addEventListener("click", () => {
      busquedaActual = document.getElementById("searchTask").value.toLowerCase();
      renderizarTareas();
    });
    document.getElementById("searchTask")?.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        busquedaActual = e.target.value.toLowerCase();
        renderizarTareas();
      }
    });

    // Cierre sesión
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      mostrarMensaje("Cerrando sesión...", "info");
      setTimeout(() => window.location.href = "../../login.html", 800);
    });

    // Sidebar toggle
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    if (menuToggle) {
      menuToggle.addEventListener("click", () => sidebar.classList.toggle("active"));
    }
    // Cerrar el menú si se hace clic fuera de él (en la zona blanca)
    document.addEventListener("click", (event) => {
      // Verificamos si el sidebar está abierto (tiene la clase active)
      if (sidebar.classList.contains("active")) {
        // Si el clic NO fue dentro del sidebar Y TAMPOCO en el botón de hamburguesa...
        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
          sidebar.classList.remove("active");
        }
      }
    });

    // Inicializar
    inicializarDatos();
    renderizarSelectEmpleados();
    renderizarTareas();
  </script>
</body>

</html>





¿Dónde deberían ubicarse? (asumo en static/css/admin/, static/css/empleado/, etc.)
En el caso de admin :static/css/admin/

4. Sobre la lógica del backend:
¿Ya tienes las vistas (views.py) listas para pasar el contexto (tareas, KPIs, etc.)?

Si ya la tengo, si necesitas verlo, dimelo
¿Cómo se llaman las variables que pasarás al template? (ej: tareas, kpis, etc.)
Analiza todo lo que se ha hecho en la conversación respecto a urls.py,views.py, models.py y tú mismo determina cuales son las variables también teniendo en cuenta el CSS,JS, HTML.
5. Sobre los formularios:
En el HTML del administrador hay un formulario de creación/edición. ¿Este formulario se renderizará con Django Forms o lo manejarás con JS (como está ahora)?
Django Forms , DEL JS sie es posible borrarlo todo para enfocarlo todo con django

¿Quieres mantener la lógica JS actual o prefieres que Django maneje la creación/edición?
Quiero que Django maneje la creación/edición
6. Sobre la estructura de archivos:
¿Cómo quieres organizar los templates de tareas?

Opción A: admin/tareas/list.html, admin/tareas/form.html, admin/tareas/detail.html
  
Opción B: Todo en un solo archivo admin/tareas/index.html (como el 2-tareas.html actual)
elijo la B
¿Prefieres separar en varios archivos o mantener todo en uno?
mANTENER TODO EN UN ARCHIVO
7. Sobre las URLs:
¿Cómo quieres las URLs? (ej: /tareas/admin/, /tareas/mis-tareas/)
Así lo tengo en el archivo urls.py 
from django.urls import path
from . import views

app_name = 'tareas'

urlpatterns = [
    # ===== URLs del Administrador =====
    path('admin/tareas/', views.admin_tareas_list, name='admin_tareas_list'),
    path('admin/tareas/crear/', views.admin_tarea_create, name='admin_tarea_create'),
    path('admin/tareas/editar/<int:pk>/', views.admin_tarea_edit, name='admin_tarea_edit'),
    path('admin/tareas/eliminar/<int:pk>/', views.admin_tarea_delete, name='admin_tarea_delete'),
    path('admin/tareas/cambiar-estado/<int:pk>/', views.admin_tarea_cambiar_estado, name='admin_tarea_cambiar_estado'),
    path('admin/tareas/vencidas/', views.admin_tareas_vencidas, name='admin_tareas_vencidas'),
    

    Busca la forma para que quede de acuerdo a ello
8. Sobre el contexto:
¿Qué variables específicas esperas recibir en el template?
Analizalas a partir del HTML
Para admin: tareas, kpis, filter_form, search_form

Para empleado: tareas, kpis(CUANTAS TAREAS HAY), estado_filtro

Mi recomendación:
Basado en tu estructura actual, sugiero:

Crear un archivo por vista (más modular y mantenible):

admin/tareas/list.html (el listado principal con KPIs y formulario)

admin/tareas/form.html (si quieres separar el formulario, pero podría estar en list)

admin/tareas/confirm_delete.html (para confirmar eliminación)

Para empleado:

empleado/tareas/list.html (el listado principal con KPIs)

empleado/tareas/detail.html (modal o página de detalle)

Extender de base.html usando bloques:

{% extends "admin/base/base.html" %} y {% extends "empleado/base/base.html" %}

Separar CSS y JS:

Mover estilos específicos a static/css/admin/tareas.css y static/css/empleado/tareas.css

Mover JS específico a static/js/admin/tareas.js y static/js/empleado/tareas.js

Para comenzar con el Administrador:
Necesito que me envíes:

El contenido de admin/base/base.html (para saber qué bloques tiene)

Confirmar si 2-tareas.html es la página completa o solo el contenido

El archivo CSS de tareas si lo tienes (o el que estás usando)

El archivo JS de tareas si lo tienes

Con eso puedo:

Integrar el HTML de tareas en un template Django que extienda de base.html

Pasar el contexto desde las vistas

Reemplazar las referencias estáticas con la etiqueta {% static %}

Separar en archivos según la lógica

¿Me envías esos archivos? Empecemos con administrador y luego vamos con empleado.







1. OPCION A: PENDIENTE
se abrirá con datos del servidor, recuerda que la idea es borrar el javascript en lo posible.
Sí, debe enviar los datos al backend para guardarlos en la base de datos.
3. utiliza el modelo de tareas como ejemplo(te enviaré el archivo models.py), dime si necesitas otro archivo

C. al finalizar la tarea
Opción A en django 

5.Opción A-abre un modal
6. si ,utiliza filtros de django
7.En lo posible utilice iconos de boostrap y no emogis 
8. Sí, extender de base.html y solo poner el contenido principal.

Necesitas que te responda algo más?





































































































Preguntas específicas antes de empezar:
1. Sobre el formulario de creación/edición:
En el HTML actual, el formulario tiene campos que coinciden con TaskForm.
por favor  Renderiza manualmente para mantener el diseño actual (con clases Bootstrap y estructura de columnas).

2. Sobre los filtros:
El HTML actual tiene botones de filtro (Todas, Pendientes, etc.) que usan JS.
SI, ACEPTO EL MÉTODO GET, QUE ME RECOMIENDAS
Mi recomendación: Usar un formulario con method="GET" y botones que cambien el valor del campo estado.

3. Sobre el modal de confirmación:
 Dejarlo en tareas.html ya que es específico de tareas.

4. Sobre el archivo tareas.css:
Ya lo tienes. Necesito que lo mueva a static/css/admin/tareas.css



5. Sobre el archivo tareas.js:
Voy a crear static/js/admin/tareas.js con solo el código necesario (sin localStorage). ¿Te parece?
Perfecto
