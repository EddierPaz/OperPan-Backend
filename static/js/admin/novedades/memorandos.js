// ============================================================
// MEMORANDOS.JS - MÓDULO DE MEMORANDOS
// Panel de administración de novedades - OperPan
// ============================================================

(function () {

    let memorandosData = [];
    let empleadosData = [];


    // ============================================================
    // CARGAR EMPLEADOS
    // ============================================================

    async function cargarEmpleados() {

        try {

            const resp = await fetch('/memorandos/empleados/');

            empleadosData = await resp.json();

            const select = document.getElementById('memorandoEmpleado');

            if (!select) return;

            select.innerHTML =
                '<option value="">Seleccionar empleado</option>';

            empleadosData.forEach(emp => {

                const option = document.createElement('option');

                option.value = emp.id;
                option.textContent = emp.nombre_completo;

                option.dataset.cargo = emp.cargo;

                select.appendChild(option);

            });


            // Autocompletar cargo
            select.addEventListener('change', function () {

                const cargoInput =
                    document.getElementById('memorandoCargo');

                const selectedOption =
                    this.options[this.selectedIndex];

                if (
                    selectedOption &&
                    selectedOption.dataset.cargo
                ) {

                    cargoInput.value =
                        selectedOption.dataset.cargo;

                } else {

                    cargoInput.value = '';

                }

            });

        } catch (err) {

            console.error(
                'Error al cargar empleados:',
                err
            );

            if (typeof showMessage === 'function') {

                showMessage(
                    '❌ No se pudieron cargar los empleados.'
                );

            }

        }

    }


    // ============================================================
    // CARGAR HISTORIAL
    // ============================================================

    async function cargarMemorandosHistorial() {

        try {

            const timestamp = new Date().getTime();

            const resp =
                await fetch(`/memorandos/?_=${timestamp}`);

            if (!resp.ok) {

                throw new Error(
                    `Error HTTP: ${resp.status}`
                );

            }

            memorandosData = await resp.json();

            renderizarTablaMemorandos(memorandosData);

            actualizarKPIsMemorandos(memorandosData);

        } catch (err) {

            console.error(
                'Error al cargar historial:',
                err
            );

            const tbody =
                document.getElementById(
                    'memorandosTablaBody'
                );

            const sinResultados =
                document.getElementById(
                    'memorandosSinResultados'
                );

            if (tbody) {

                tbody.innerHTML = '';

                if (sinResultados) {

                    sinResultados.classList.remove('d-none');

                    sinResultados.innerHTML = `
                        <i class="bi bi-exclamation-triangle fs-1 d-block mb-2 text-warning"></i>
                        Error al cargar los memorandos. Por favor, intente nuevamente.
                    `;

                }

            }

        }

    }


    // ============================================================
    // RENDERIZAR TABLA
    // ============================================================

    function renderizarTablaMemorandos(data) {

        const tbody =
            document.getElementById(
                'memorandosTablaBody'
            );

        const sinResultados =
            document.getElementById(
                'memorandosSinResultados'
            );

        if (!tbody) return;


        if (!data || data.length === 0) {

            tbody.innerHTML = '';

            if (sinResultados) {

                sinResultados.classList.remove('d-none');

                sinResultados.innerHTML = `
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay memorandos registrados.
                `;

            }

            return;
        }


        if (sinResultados) {

            sinResultados.classList.add('d-none');

        }


        tbody.innerHTML = data.map(m => {

            const tipoBadge =
                `<span class="badge text-dark badge-memorando-${m.tipo_raw || 'default'}">
                    ${m.tipo || 'Sin tipo'}
                </span>`;


            const btnDescarga = m.archivo_pdf

                ? `
                    <a
                        href="/memorandos/${m.id}/descargar/"
                        class="btn-action btn-action-download"
                        target="_blank"
                        title="Descargar PDF"
                    >
                        <i class="bi bi-download"></i>
                    </a>
                `

                : `
                    <span class="text-muted">
                        <i class="bi bi-file-earmark-pdf"></i>
                        Sin PDF
                    </span>
                `;


            const empleadoConCargo =
                m.empleado_cargo

                    ? `${m.empleado}
                        <br>
                        <small
                            class="text-muted"
                            style="font-size: 0.7rem;"
                        >
                            ${m.empleado_cargo}
                        </small>`

                    : m.empleado;


            return `
                <tr>

                    <td data-label="Consecutivo">
                        <strong>
                            ${m.consecutivo || 'N/A'}
                        </strong>
                    </td>

                    <td data-label="Empleado">
                        ${empleadoConCargo}
                    </td>

                    <td data-label="Tipo">
                        ${tipoBadge}
                    </td>

                    <td data-label="Asunto">
                        ${m.asunto || 'Sin asunto'}
                    </td>

                    <td data-label="Fecha emisión">
                        ${
                            m.fecha_emision
                                ? new Date(
                                    m.fecha_emision
                                  ).toLocaleString('es-CO')
                                : 'N/A'
                        }
                    </td>

                    <td data-label="Generado por">
                        ${m.generado_por || '—'}
                    </td>

                    <td data-label="Acciones">
                        ${btnDescarga}
                    </td>

                </tr>
            `;

        }).join('');

    }


    // ============================================================
    // ACTUALIZAR KPIs
    // ============================================================

    function actualizarKPIsMemorandos(data) {

        const ahora = new Date();

        const mes = ahora.getMonth();
        const año = ahora.getFullYear();

        const hoy = ahora.toDateString();


        const total =
            data ? data.length : 0;


        const esteMes =
            data

                ? data.filter(m => {

                    try {

                        const f =
                            new Date(m.fecha_emision);

                        return (
                            f.getMonth() === mes &&
                            f.getFullYear() === año
                        );

                    } catch (e) {

                        return false;

                    }

                }).length

                : 0;


        const hoyCount =
            data

                ? data.filter(m => {

                    try {

                        const f =
                            new Date(m.fecha_emision);

                        return (
                            f.toDateString() === hoy
                        );

                    } catch (e) {

                        return false;

                    }

                }).length

                : 0;


        const elTotal =
            document.getElementById(
                'memorandosKpiTotal'
            );

        const elMes =
            document.getElementById(
                'memorandosKpiMes'
            );

        const elHoy =
            document.getElementById(
                'memorandosKpiHoy'
            );


        if (elTotal) {
            elTotal.innerText = total;
        }

        if (elMes) {
            elMes.innerText = esteMes;
        }

        if (elHoy) {
            elHoy.innerText = hoyCount;
        }

    }


    // ============================================================
    // AGREGAR MEMORANDO LOCALMENTE
    // ============================================================

    function agregarMemorandoLocal(memorando) {

        if (!memorando) return false;


        const existe =
            memorandosData.some(
                m => m.id === memorando.id
            );


        if (existe) return false;


        memorandosData.unshift(memorando);

        renderizarTablaMemorandos(
            memorandosData
        );

        actualizarKPIsMemorandos(
            memorandosData
        );

        return true;
    }


    // ============================================================
    // CONFIGURAR FORMULARIO
    // ============================================================

    function configurarFormularioMemorando() {

        const form =
            document.getElementById(
                'memorandoForm'
            );


        if (
            !form ||
            form.dataset.bound === 'true'
        ) {
            return;
        }


        form.dataset.bound = 'true';


        // ========================================================
        // BOTÓN LIMPIAR
        // ========================================================

        const btnLimpiar =
            document.querySelector(
                'button[form="memorandoForm"][type="reset"]'
            );


        if (btnLimpiar) {

            btnLimpiar.addEventListener(
                'click',
                function (e) {

                    e.preventDefault();


                    setTimeout(function () {

                        const cargoInput =
                            document.getElementById(
                                'memorandoCargo'
                            );

                        if (cargoInput) {
                            cargoInput.value = '';
                        }


                        const select =
                            document.getElementById(
                                'memorandoEmpleado'
                            );

                        if (select) {
                            select.value = '';
                        }


                        const tipoSelect =
                            document.getElementById(
                                'memorandoTipo'
                            );

                        if (tipoSelect) {
                            tipoSelect.value = '';
                        }


                        const asuntoInput =
                            document.getElementById(
                                'memorandoAsunto'
                            );

                        if (asuntoInput) {
                            asuntoInput.value = '';
                        }


                        const contenidoTextarea =
                            document.getElementById(
                                'memorandoContenido'
                            );

                        if (contenidoTextarea) {
                            contenidoTextarea.value = '';
                        }


                        document
                            .querySelectorAll(
                                '.seleccionado'
                            )
                            .forEach(el => {

                                el.classList.remove(
                                    'seleccionado'
                                );

                            });

                    }, 10);

                }
            );

        }


        // ========================================================
        // ENVIAR FORMULARIO
        // ========================================================

        form.addEventListener(
            'submit',
            async function (e) {

                e.preventDefault();


                const btn =
                    document.getElementById(
                        'memorandoBtnGenerar'
                    );


                const originalBtnText =
                    btn.innerHTML;


                btn.disabled = true;

                btn.innerHTML = `
                    <span
                        class="spinner-border spinner-border-sm me-1"
                    ></span>
                    Generando...
                `;


                try {

                    const empleadoId =
                        document.getElementById(
                            'memorandoEmpleado'
                        ).value;


                    const tipo =
                        document.getElementById(
                            'memorandoTipo'
                        ).value;


                    const asunto =
                        document.getElementById(
                            'memorandoAsunto'
                        ).value.trim();


                    const contenido =
                        document.getElementById(
                            'memorandoContenido'
                        ).value.trim();


                    // ====================================================
                    // VALIDACIÓN
                    // ====================================================

                    if (!empleadoId) {

                        showMessage(
                            '⚠️ Por favor seleccione un empleado.',
                            'warning'
                        );

                        btn.disabled = false;
                        btn.innerHTML =
                            originalBtnText;

                        return;
                    }


                    // ====================================================
                    // CREAR MEMORANDO
                    // ====================================================

                    const resp =
                        await fetch(
                            '/memorandos/crear/',
                            {
                                method: 'POST',

                                headers: {
                                    'X-CSRFToken':
                                        getCSRFToken(),

                                    'Content-Type':
                                        'application/json'
                                },

                                body: JSON.stringify({
                                    empleado:
                                        empleadoId,

                                    tipo:
                                        tipo,

                                    asunto:
                                        asunto,

                                    contenido:
                                        contenido
                                })
                            }
                        );


                    const data =
                        await resp.json();


                    // ====================================================
                    // ÉXITO
                    // ====================================================

                    if (
                        resp.ok &&
                        data.status === 'ok'
                    ) {

                        // Cerrar modal
                        bootstrap.Modal
                            .getInstance(
                                document.getElementById(
                                    'modalMemorando'
                                )
                            )
                            ?.hide();


                        // Agregar localmente
                        let memorandoAgregado =
                            false;


                        if (data.memorando) {

                            memorandoAgregado =
                                agregarMemorandoLocal(
                                    data.memorando
                                );

                        }


                        // Si no pudo agregarse localmente,
                        // recargar historial
                        if (!memorandoAgregado) {

                            await cargarMemorandosHistorial();

                        }


                        // ====================================================
                        // NOTIFICACIÓN GLOBAL OPERPAN
                        // ====================================================

                        const consecutivo =
                            data.consecutivo
                                ? ` (${data.consecutivo})`
                                : '';


                        showMessage(
                            `✅ Memorando generado correctamente${consecutivo}.`,
                            'success'
                        );


                        // ====================================================
                        // RESETEAR FORMULARIO
                        // ====================================================

                        form.reset();


                        const cargoInput =
                            document.getElementById(
                                'memorandoCargo'
                            );


                        if (cargoInput) {
                            cargoInput.value = '';
                        }

                    }

                    // ========================================================
                    // ERROR DEL SERVIDOR
                    // ========================================================

                    else {

                        showMessage(
                            `❌ ${
                                data.error ||
                                data.detalles ||
                                'No se pudo procesar la solicitud.'
                            }`,
                            'error'
                        );

                    }


                } catch (err) {

                    console.error(
                        'Error:',
                        err
                    );


                    showMessage(
                        '❌ No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.',
                        'error'
                    );


                } finally {

                    btn.disabled = false;

                    btn.innerHTML =
                        originalBtnText;

                }

            }
        );

    }


    // ============================================================
    // CSRF
    // ============================================================

    function getCSRFToken() {

        const cookieValue =
            document.cookie
                .split('; ')
                .find(
                    row =>
                        row.startsWith(
                            'csrftoken='
                        )
                )
                ?.split('=')[1];


        return cookieValue || '';

    }


    // ============================================================
    // FUNCIÓN PÚBLICA
    // ============================================================

    window.cargarMemorandos =
        async function () {

            await cargarEmpleados();

            await cargarMemorandosHistorial();

            configurarFormularioMemorando();

        };


    // ============================================================
    // INICIALIZACIÓN
    // ============================================================

    if (
        document
            .getElementById('tabMemorandos')
            ?.classList.contains('active')
    ) {

        window.cargarMemorandos();

    }


})();