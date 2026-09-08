document.addEventListener('DOMContentLoaded', () => {
    document.body.setAttribute('data-screen', 'screen-main');

    const showScreen = (screenId) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        document.body.setAttribute('data-screen', screenId);
        
        if(screenId === 'screen-instructions') loadInstrucciones();
        if(screenId === 'screen-projects') loadProyectos();
    };

    const modal = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    let modalYesAction = null;

    const showModal = (title, text, onYes) => {
        modalTitle.innerText = title;
        modalText.innerText = text;
        modalYesAction = onYes;
        modal.classList.add('active');
    };

    document.getElementById('modal-no').addEventListener('click', () => modal.classList.remove('active'));
    document.getElementById('modal-yes').addEventListener('click', () => {
        modal.classList.remove('active');
        if(modalYesAction) modalYesAction();
    });

    document.getElementById('btn-instrucciones').addEventListener('click', () => showScreen('screen-instructions'));
    document.getElementById('btn-proyectos').addEventListener('click', () => showScreen('screen-projects'));
    
    document.getElementById('btn-diseno').addEventListener('click', () => {
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        document.getElementById('step_proyectista').classList.add('active');
        
        document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], textarea').forEach(i => i.value = i.defaultValue || '');
        document.querySelectorAll('select').forEach(i => i.selectedIndex = 0);
        
        document.getElementById('container_mapa').style.display = 'none';
        document.getElementById('form_generacion').style.display = 'none';
        document.getElementById('form_trans_dist').style.display = 'none';
        
        loadTensiones();
        loadEsquemas();
        showScreen('screen-design');
        setTimeout(initMap, 300);
    });
    
    document.getElementById('btn-salir').addEventListener('click', () => {
        showModal('Salir', '¿Estás seguro de que quieres salir?', () => {
            document.body.innerHTML = `
                <div style="text-align:center; margin-top: 30vh;">
                    <h1 style="font-size: 3rem;">👋</h1>
                    <h1>Programa Finalizado</h1>
                </div>`;
        });
    });

    document.querySelectorAll('.home-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const isDesign = e.target.closest('#screen-design') !== null;
            if (isDesign) {
                showModal('Volver sin guardar', '¿Perder datos actuales?', () => showScreen('screen-main'));
            } else {
                showScreen('screen-main');
            }
        });
    });

    // === API Loads ===
    const loadInstrucciones = async () => {
        const area = document.getElementById('instrucciones-content');
        area.innerHTML = '<div class="loader">Cargando instrucciones...</div>';
        try {
            const res = await fetch('/api/instrucciones');
            const data = await res.json();
            if (data.is_html) area.innerHTML = `<div class="instrucciones-texto" style="white-space: normal;">${data.text}</div>`;
            else area.innerHTML = `<div class="instrucciones-texto">${data.text}</div>`;
        } catch (e) {
            area.innerHTML = '<div class="instrucciones-texto" style="color: #ef4444;">Error al conectar con el servidor.</div>';
        }
    };

    const loadProyectos = async () => {
        const area = document.getElementById('proyectos-content');
        area.innerHTML = '<div class="loader">Buscando proyectos...</div>';
        try {
            const res = await fetch('/api/proyectos');
            const data = await res.json();
            
            if (!data.proyectos || data.proyectos.length === 0) {
                area.innerHTML = `
                    <div style="text-align:center; padding: 40px; color: var(--text-muted);">
                        <p style="font-size: 2rem;">☁️</p>
                        <p style="margin-top: 10px;">En la versión en línea, los proyectos se descargan directamente a tu ordenador al finalizar cada diseño.</p>
                        <p style="margin-top: 10px; font-size: 0.9rem;">No se almacenan en el servidor.</p>
                    </div>`;
            } else {
                area.innerHTML = data.proyectos.map(p => `
                    <div class="project-item">
                        <div><h3>📄 ${p}</h3></div>
                    </div>
                `).join('');
            }
        } catch (e) {
            area.innerHTML = `
                <div style="text-align:center; padding: 40px; color: var(--text-muted);">
                    <p style="font-size: 2rem;">☁️</p>
                    <p style="margin-top: 10px;">En la versión en línea, los proyectos se descargan directamente a tu ordenador al finalizar cada diseño.</p>
                    <p style="margin-top: 10px; font-size: 0.9rem;">No se almacenan en el servidor.</p>
                </div>`;
        }
    };

    let allEsquemas = [];
    let allTensionesData = [];
    let optionsTension = '<option value="">Seleccione...</option>';
    
    const loadTensiones = async () => {
        try {
            const res = await fetch('/api/tensiones');
            const data = await res.json();
            if (data.tensiones) allTensionesData = data.tensiones;
        } catch (e) { console.error(e); }
    };

    const loadEsquemas = async () => {
        try {
            const res = await fetch('/api/esquemas');
            const data = await res.json();
            if (data.esquemas) allEsquemas = data.esquemas;
        } catch (e) { console.error(e); }
    };

    // === Mapa Leaflet ===
    let map = null;
    let marker = null;
    const initMap = () => {
        if(map) return;
        map = L.map('map-container').setView([40.4168, -3.7038], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

        map.on('click', async (e) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            if(marker) map.removeLayer(marker);
            marker = L.marker([lat, lng]).addTo(map);
            
            document.getElementById('inp_coordenadas').value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            document.getElementById('inp_altitud').value = "Cargando...";
            document.getElementById('inp_clima').value = "Cargando...";
            try {
                const resElev = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
                const dataElev = await resElev.json();
                document.getElementById('inp_altitud').value = dataElev.elevation ? dataElev.elevation[0] : 0;

                const resWeather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
                const dataWeather = await resWeather.json();
                if(dataWeather.current_weather) {
                    document.getElementById('inp_clima').value = `Temp: ${dataWeather.current_weather.temperature}°C, Viento: ${dataWeather.current_weather.windspeed}km/h`;
                }
            } catch(e) {
                document.getElementById('inp_altitud').value = "Error API";
                document.getElementById('inp_clima').value = "Error API";
            }
        });
    };

    // === Navegación y Colección ===
    let designData = {};

    const collectInputs = (stepId, destObj) => {
        const inputs = document.querySelectorAll(`#${stepId} input:not([type="hidden"]):not([style*="display: none"]), #${stepId} select:not([style*="display: none"])`);
        inputs.forEach(input => {
            if(input.closest('[style*="display: none"]') === null) {
                destObj[input.name || input.id] = input.value;
            }
        });
    };

    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentStepDiv = e.target.closest('.form-step');
            const currentStepId = currentStepDiv.id;
            const nextStepId = e.target.getAttribute('data-next');
            
            const reqs = currentStepDiv.querySelectorAll('input[required]');
            for(let r of reqs) {
                if(!r.value) { alert('Rellena todos los campos requeridos.'); return; }
            }

            designData[currentStepId] = {};
            collectInputs(currentStepId, designData[currentStepId]);

            currentStepDiv.classList.remove('active');
            document.getElementById(nextStepId).classList.add('active');
            
            if(nextStepId === 'step_parametros') setupParametros();
        });
    });

    document.querySelectorAll('.prev-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentStepDiv = e.target.closest('.form-step');
            const prevStepId = e.target.getAttribute('data-prev');
            currentStepDiv.classList.remove('active');
            document.getElementById(prevStepId).classList.add('active');
        });
    });

    // === Fase 2 y 3 Lógica ===
    const selTipoInst = document.getElementById('sel_tipo_instalacion');
    const contAisl = document.getElementById('container_aislamiento');
    const selAisl = document.getElementById('sel_medio_aislante');
    const contOtro = document.getElementById('container_aislamiento_otro');
    const contMapa = document.getElementById('container_mapa');
    const contEntorno = document.getElementById('container_entorno');

    selTipoInst.addEventListener('change', (e) => {
        const t = e.target.value;
        contAisl.style.display = t ? 'block' : 'none';
        contMapa.style.display = (t === 'Exterior') ? 'block' : 'none';
        selAisl.innerHTML = '<option value="">Selecciona...</option>';
        if(t === 'Interior') {
            selAisl.innerHTML += '<option value="SF6">SF6</option><option value="Otro">Otro</option>';
            contEntorno.style.display = 'none';
        } else if(t === 'Exterior') {
            selAisl.innerHTML += '<option value="Aire">Aire</option><option value="SF6">SF6</option><option value="Otro">Otro</option>';
            setTimeout(()=> { if(map) map.invalidateSize(); }, 200);
        }
    });

    selAisl.addEventListener('change', (e) => {
        const v = e.target.value;
        contOtro.style.display = (v === 'Otro') ? 'block' : 'none';
        if(selTipoInst.value === 'Exterior') contEntorno.style.display = (v === 'Aire') ? 'block' : 'none';
    });

    // === Multi-Units Renderers ===
    const renderBloqueGenerador = (index) => `
        <div class="sub-form" style="background:rgba(0,0,0,0.2); padding:10px; margin-bottom:10px; border-left:4px solid var(--primary);">
            <h4>Generador ${index}</h4>
            <div class="form-grid">
                <div class="form-group"><label>Tensión (kV)</label><select class="tension-select gen-tension" data-index="${index}">${optionsTension}</select></div>
                <div class="form-group"><label>Potencia nominal (MVA)</label><input type="number" step="0.1" class="gen-pot" data-index="${index}"></div>
                <div class="form-group"><label>Potencia CC (MVA)</label><input type="number" step="0.1" class="gen-cc" data-index="${index}"></div>
            </div>
        </div>`;

    const renderBloqueTrafoAsoc = (index) => `
        <div class="sub-form" style="background:rgba(0,0,0,0.2); padding:10px; margin-bottom:10px; border-left:4px solid var(--accent);">
            <h4>Trafo Asociado (Gen ${index})</h4>
            <div class="form-grid">
                <div class="form-group"><label>Primario (kV)</label><input type="text" value="Igual a Gen ${index}" disabled></div>
                <div class="form-group"><label>Secundario (kV)</label><select class="tension-select trafo-sec" data-index="${index}">${optionsTension}</select></div>
            </div>
        </div>`;

    const renderBloqueTrafo = (index, tipo) => `
        <div class="sub-form" style="background:rgba(0,0,0,0.2); padding:10px; margin-bottom:10px; border-left:4px solid var(--accent);">
            <h4>Trafo ${tipo} ${index}</h4>
            <div class="form-grid">
                <div class="form-group"><label>Primario (kV)</label><select class="tension-select trafo-pri-gen" data-index="${index}">${optionsTension}</select></div>
                <div class="form-group"><label>Secundario (kV)</label><select class="tension-select trafo-sec-gen" data-index="${index}">${optionsTension}</select></div>
            </div>
        </div>`;

    const renderBloqueLinea = (index, tipo) => `
        <div class="form-group"><label>Tensión Posición Línea ${index} (kV)</label><select class="tension-select linea-tension-${tipo}" data-index="${index}">${optionsTension}</select></div>`;

    const updateRender = (containerId, num, renderFunc, tipo=null) => {
        const cont = document.getElementById(containerId);
        cont.innerHTML = '';
        for(let i=1; i<=num; i++) cont.innerHTML += renderFunc(i, tipo);
        // Refresh values since innerHTML wipes them
        const selects = cont.querySelectorAll('.tension-select');
        selects.forEach(sel => sel.innerHTML = optionsTension);
    };

    // === Fase 4 Lógica ===
    const selFuncion = document.getElementById('sel_funcion');
    const formGen = document.getElementById('form_generacion');
    const formTrans = document.getElementById('form_trans_dist');

    const updateCentralOptions = () => {
        const tipo = document.getElementById('sel_gen_tipo').value;
        const disp = document.getElementById('sel_disponibilidad').value;
        const selC = document.getElementById('sel_gen_central');
        selC.innerHTML = '<option value="">Selecciona...</option>';
        if(tipo === 'Síncrona o asíncrona') {
            if(disp === 'Alta') selC.innerHTML += '<option value="Nuclear">Nuclear</option>';
            selC.innerHTML += '<option value="Hidráulica">Hidráulica</option><option value="Minihidráulica">Minihidráulica</option><option value="Ciclo Combinado">Ciclo Combinado</option><option value="Solar térmica">Solar térmica</option>';
        } else if(tipo === 'Estática') {
            selC.innerHTML += '<option value="Eólica">Eólica</option><option value="Fotovoltaica">Fotovoltaica</option><option value="Baterías">Baterías</option>';
        }
    };

    const setupParametros = () => {
        const rank = { "TERCERA": 1, "SEGUNDA": 2, "PRIMERA": 3, "ESPECIAL": 4, "UNKNOWN": 5 };
        const userCat = document.getElementById('sel_categoria').value;
        const userRank = rank[userCat];

        const validTensiones = allTensionesData.filter(t => (rank[t.categoria] || 5) <= userRank);
        optionsTension = '<option value="">Seleccione...</option>';
        validTensiones.forEach(t => optionsTension += `<option value="${t.tension}">${t.tension} kV</option>`);
        
        document.querySelectorAll('.tension-select').forEach(sel => {
            const prev = sel.value;
            sel.innerHTML = optionsTension;
            if(prev) sel.value = prev;
        });
        
        updateCentralOptions();
    };

    document.getElementById('sel_gen_tipo').addEventListener('change', updateCentralOptions);

    selFuncion.addEventListener('change', (e) => {
        const f = e.target.value;
        formGen.style.display = (f === 'GENERACION') ? 'block' : 'none';
        formTrans.style.display = (f === 'TRANSPORTE' || f === 'DISTRIBUCION') ? 'block' : 'none';
        validateForm4();
    });

    // Eventos Generación Multi-Unidades
    document.getElementById('inp_gen_num_generadores').addEventListener('input', e => {
        const n = parseInt(e.target.value) || 0;
        updateRender('container_gen_generadores', n, renderBloqueGenerador);
        if(document.getElementById('sel_gen_trafos_asoc').value === 'Si') updateRender('container_gen_trafos_asoc', n, renderBloqueTrafoAsoc);
        validateForm4();
    });
    document.getElementById('sel_gen_trafos_asoc').addEventListener('change', e => {
        const n = parseInt(document.getElementById('inp_gen_num_generadores').value) || 0;
        const disp = e.target.value === 'Si';
        document.getElementById('container_gen_trafos_asoc').style.display = disp ? 'block' : 'none';
        if(disp) updateRender('container_gen_trafos_asoc', n, renderBloqueTrafoAsoc);
        validateForm4();
    });
    document.getElementById('inp_gen_num_transformadores').addEventListener('input', e => {
        const n = parseInt(e.target.value) || 0;
        document.getElementById('container_gen_trafos_extra').style.display = n > 0 ? 'block' : 'none';
        if(n>0) updateRender('container_gen_trafos_extra', n, renderBloqueTrafo, 'Extra');
        validateForm4();
    });
    document.getElementById('inp_gen_num_lineas').addEventListener('input', e => {
        updateRender('container_gen_lineas', parseInt(e.target.value) || 0, renderBloqueLinea, 'gen');
    });

    // Eventos Trans/Dist
    const selTransTipo = document.getElementById('sel_trans_tipo');
    selTransTipo.addEventListener('change', e => {
        document.getElementById('form_trans_maniobra').style.display = (e.target.value === 'Maniobra') ? 'block' : 'none';
        document.getElementById('form_trans_transformacion').style.display = (e.target.value === 'Transformación') ? 'block' : 'none';
        validateForm4();
    });
    
    document.getElementById('inp_trans_man_num_lineas').addEventListener('input', e => {
        updateRender('container_trans_man_lineas', parseInt(e.target.value) || 0, renderBloqueLinea, 'man');
    });
    document.getElementById('inp_trans_trf_num_lineas').addEventListener('input', e => {
        updateRender('container_trans_trf_lineas', parseInt(e.target.value) || 0, renderBloqueLinea, 'trf');
    });
    document.getElementById('inp_trans_trf_num_trafos').addEventListener('input', e => {
        updateRender('container_trans_trf_trafos', parseInt(e.target.value) || 0, renderBloqueTrafo, 'Transformación');
        validateForm4();
    });

    const validateForm4 = () => {
        let valid = false;
        const f = selFuncion.value;
        const err = document.getElementById('err_trans_trf');
        err.style.display = 'none';

        if(f === 'GENERACION') {
            valid = true;
            const tExtra = parseInt(document.getElementById('inp_gen_num_transformadores').value) || 0;
            if (tExtra > 1) {
                const pris = Array.from(document.querySelectorAll('#container_gen_trafos_extra .trafo-pri-gen')).map(s=>s.value).filter(v=>v);
                const secs = Array.from(document.querySelectorAll('#container_gen_trafos_extra .trafo-sec-gen')).map(s=>s.value).filter(v=>v);
                const allTensions = pris.concat(secs);
                const hasDuplicate = new Set(allTensions).size !== allTensions.length;
                if(!hasDuplicate && allTensions.length === (tExtra * 2)) {
                    err.innerText = "Error: Múltiples trafos extra deben compartir al menos una tensión (embarrado común).";
                    err.style.display = 'block';
                    valid = false;
                }
            }
        }
        if(f === 'TRANSPORTE' || f === 'DISTRIBUCION') {
            if(selTransTipo.value === 'Maniobra') valid = true;
            if(selTransTipo.value === 'Transformación') {
                valid = true;
                const pris = Array.from(document.querySelectorAll('#container_trans_trf_trafos .trafo-pri-gen')).map(s=>s.value).filter(v=>v);
                const secs = Array.from(document.querySelectorAll('#container_trans_trf_trafos .trafo-sec-gen')).map(s=>s.value).filter(v=>v);
                
                // 1. Check primary != secondary for each trafo
                const prisRaw = Array.from(document.querySelectorAll('#container_trans_trf_trafos .trafo-pri-gen')).map(s=>s.value);
                const secsRaw = Array.from(document.querySelectorAll('#container_trans_trf_trafos .trafo-sec-gen')).map(s=>s.value);
                for(let i=0; i<prisRaw.length; i++) {
                    if(prisRaw[i] && secsRaw[i] && prisRaw[i] === secsRaw[i]) {
                        err.innerText = "Error: Primario y secundario no pueden ser iguales en el mismo transformador.";
                        err.style.display = 'block';
                        valid = false;
                    }
                }
                
                // 2. Check that at least one tension matches across multiple trafos
                const tNum = parseInt(document.getElementById('inp_trans_trf_num_trafos').value) || 0;
                if(valid && tNum > 1 && pris.length === tNum && secs.length === tNum) {
                    const allTensions = pris.concat(secs);
                    const hasDuplicate = new Set(allTensions).size !== allTensions.length;
                    if(!hasDuplicate) {
                        err.innerText = "Error: Múltiples transformadores deben tener al menos una tensión en común (embarrado).";
                        err.style.display = 'block';
                        valid = false;
                    }
                }
            }
        }
        document.getElementById('btn-to-esquemas').disabled = !valid;
    };
    
    document.getElementById('container_trans_trf_trafos').addEventListener('change', validateForm4);

    const extractArrayData = () => {
        const d = { func_generadores: [], func_trafos_asoc: [], func_trafos_extra: [], func_lineas: [], trans_man_lineas: [], trans_trf_trafos: [], trans_trf_lineas: [] };
        
        document.querySelectorAll('.gen-tension').forEach(el => {
            const idx = el.getAttribute('data-index');
            d.func_generadores.push({
                tension: el.value,
                potencia: document.querySelector(`.gen-pot[data-index="${idx}"]`).value,
                cc: document.querySelector(`.gen-cc[data-index="${idx}"]`).value
            });
        });
        document.querySelectorAll('.trafo-sec').forEach(el => d.func_trafos_asoc.push({ secundario: el.value }));
        document.querySelectorAll('#container_gen_trafos_extra .trafo-pri-gen').forEach(el => {
            const idx = el.getAttribute('data-index');
            d.func_trafos_extra.push({
                primario: el.value,
                secundario: document.querySelector(`#container_gen_trafos_extra .trafo-sec-gen[data-index="${idx}"]`).value
            });
        });
        document.querySelectorAll('.linea-tension-gen').forEach(el => d.func_lineas.push({ tension: el.value }));
        document.querySelectorAll('.linea-tension-man').forEach(el => d.trans_man_lineas.push({ tension: el.value }));
        
        document.querySelectorAll('#container_trans_trf_trafos .trafo-pri-gen').forEach(el => {
            const idx = el.getAttribute('data-index');
            d.trans_trf_trafos.push({
                primario: el.value,
                secundario: document.querySelector(`#container_trans_trf_trafos .trafo-sec-gen[data-index="${idx}"]`).value
            });
        });
        document.querySelectorAll('.linea-tension-trf').forEach(el => d.trans_trf_lineas.push({ tension: el.value }));
        return d;
    };

    // Ir a Esquemas
    document.getElementById('btn-to-esquemas').addEventListener('click', () => {
        designData['step_parametros'] = {};
        collectInputs('step_parametros', designData['step_parametros']);
        designData['arrays_dinamicos'] = extractArrayData();
        
        document.getElementById('step_parametros').classList.remove('active');
        document.getElementById('step_esquemas').classList.add('active');
        renderEsquemas(true);
    });

    // === Fase 5: Esquemas ===
    document.getElementById('btn-ver-todos').addEventListener('click', () => renderEsquemas(false));
    document.getElementById('btn-ver-recomendados').addEventListener('click', () => renderEsquemas(true));

    const renderEsquemas = (filterRecommended) => {
        try {
            const container = document.getElementById('esquemas-container');
            container.innerHTML = '';
            designData.esquema_seleccionado = null;
            document.getElementById('btn-next-final').disabled = true;
            
            document.getElementById('btn-ver-todos').style.display = filterRecommended ? 'inline-block' : 'none';
            document.getElementById('btn-ver-recomendados').style.display = filterRecommended ? 'none' : 'inline-block';

            const f = designData.step_parametros.funcion || '';
            const arr = designData.arrays_dinamicos;
            let numLineas = 0;
            if(f === 'GENERACION') numLineas = arr.func_lineas.length;
            else {
                if(designData.step_parametros.trans_tipo === 'Maniobra') numLineas = arr.trans_man_lineas.length;
                else numLineas = arr.trans_trf_lineas.length;
            }

            const dispUserStr = designData.step_categoria.disponibilidad ? designData.step_categoria.disponibilidad.toUpperCase() : 'BAJA';
            const dispRank = {"BAJA": 1, "MEDIA": 2, "ALTA": 3, "MUY ALTA": 4};
            const uRank = dispRank[dispUserStr] || 1;

            let mostrar = allEsquemas;

            if (filterRecommended) {
                mostrar = allEsquemas.filter(esq => {
                    const apl = (esq.aplicacion || '').toUpperCase();
                    if (!apl.includes(f)) return false;
                    
                    // Prioridad 1: Disponibilidad
                    const eRank = dispRank[(esq.disponibilidad || '').toUpperCase()] || 0;
                    if(eRank < uRank) return false;

                    // Prioridad 2: Número de posiciones (secundario)
                    const posStr = esq.posiciones || '';
                    if (posStr.includes('<=')) return numLineas <= parseInt(posStr.replace('<=',''));
                    if (posStr.includes('<')) return numLineas < parseInt(posStr.replace('<',''));
                    if (posStr.includes('>=')) return numLineas >= parseInt(posStr.replace('>=',''));
                    if (posStr.includes('>')) return numLineas > parseInt(posStr.replace('>',''));
                    return true;
                });
            }

            if(mostrar.length === 0) {
                container.innerHTML = '<p>No hay esquemas recomendados para esta configuración. Pulsa "Mostrar todos los esquemas posibles".</p>';
                return;
            }

            mostrar.forEach(esq => {
                const card = document.createElement('div');
                card.className = 'esquema-card';
                card.innerHTML = `
                    <img src="/api/esquemas_imagen/${encodeURIComponent(esq.esquema || 'none')}" alt="Foto del Esquema" onerror="this.style.display='none'">
                    <h4>${esq.esquema || 'Desconocido'}</h4>
                    <p><strong>Funcionalidad:</strong> ${esq.aplicacion || ''}</p>
                    <p><strong>Disponibilidad:</strong> ${esq.disponibilidad || ''}</p>
                `;
                card.addEventListener('click', () => {
                    document.querySelectorAll('.esquema-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    designData.esquema_seleccionado = esq;
                    document.getElementById('btn-next-final').disabled = false;
                });
                container.appendChild(card);
            });
        } catch(err) {
            document.getElementById('esquemas-container').innerHTML = `<p style="color:red;">Error JS en renderEsquemas: ${err.message}</p>`;
        }
    };

    // Generación Final
    document.getElementById('btn-next-final').addEventListener('click', async () => {
        document.getElementById('step_esquemas').classList.remove('active');
        document.getElementById('step_generation').classList.add('active');
        
        const statusArea = document.getElementById('generation-status');
        statusArea.innerHTML = '<div class="loader">Generando archivos Excel y reporte PDF...</div>';
        
        try {
            const res = await fetch('/api/guardar_diseno', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(designData)
            });
            const data = await res.json();
            
            if(data.status === 'success') {
                // Descarga PDF desde base64
                const pdfBlob = new Blob([Uint8Array.from(atob(data.pdf_b64), c => c.charCodeAt(0))], {type: 'application/pdf'});
                const pdfUrl = URL.createObjectURL(pdfBlob);

                // Descarga Excel desde base64
                const xlsxBlob = new Blob([Uint8Array.from(atob(data.excel_b64), c => c.charCodeAt(0))], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
                const xlsxUrl = URL.createObjectURL(xlsxBlob);

                statusArea.innerHTML = `
                    <h3 style="color: var(--primary); margin-bottom: 10px;">¡Proceso Completado con Éxito! 🎉</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">Proyecto: <strong>${data.project_name}</strong></p>
                    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <a href="${pdfUrl}" download="${data.project_name}.pdf" class="btn">📄 Descargar PDF</a>
                        <a href="${xlsxUrl}" download="${data.project_name}.xlsx" class="btn">📊 Descargar Excel</a>
                        <button class="btn btn-primary" id="btn-finish">Volver al Inicio</button>
                    </div>
                `;
                document.getElementById('btn-finish').addEventListener('click', () => showScreen('screen-main'));
            } else {
                statusArea.innerHTML = `<h3 style="color: var(--danger);">Error en la Generación</h3><p>${data.message || ''}</p>`;
            }
        } catch (e) {
            statusArea.innerHTML = `<h3 style="color: var(--danger);">Error de conexión: ${e.message}</h3>`;
        }
    });
});
