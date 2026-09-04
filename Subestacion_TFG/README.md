# Asistente de Diseño de Subestaciones Eléctricas

Herramienta web de asistencia al diseño de subestaciones eléctricas desarrollada como Trabajo de Fin de Grado.
Permite guiar al proyectista a través de un asistente paso a paso para definir los parámetros eléctricos de una subestación y seleccionar el esquema de conexión más adecuado.

---

## ▶ Cómo ejecutar la aplicación

### Requisito previo: Python instalado

Necesitas tener **Python 3.10 o superior** instalado en tu ordenador.  
Puedes descargarlo gratis desde: https://www.python.org/downloads/  
_(Marca la casilla "Add Python to PATH" durante la instalación)_

### Arranque con doble clic (recomendado)

1. Abre la carpeta del proyecto.
2. Haz **doble clic** en el archivo `iniciar_aplicacion.bat`.
3. Se abrirá una ventana de consola que instalará las dependencias automáticamente y lanzará la aplicación.
4. Tu navegador se abrirá solo en: **http://127.0.0.1:5000**
5. Mantén la ventana de consola **abierta** mientras uses la aplicación.
6. Para cerrar la aplicación, cierra la ventana de consola.

### Arranque manual (alternativa)

Abre una terminal (`cmd` o PowerShell) dentro de la carpeta del proyecto y ejecuta:

```bash
pip install -r requirements.txt
python app.py
```

Luego abre tu navegador en: http://127.0.0.1:5000

---

## 📁 Estructura de la carpeta

```
Subestacion_TFG/
│
├── iniciar_aplicacion.bat   ← Doble clic para arrancar
├── app.py                   ← Servidor Python (Flask)
├── requirements.txt         ← Lista de dependencias
│
├── BASE DE DATOS/           ← Excel con datos técnicos (esquemas, tensiones, etc.)
├── Instrucciones/           ← Documentos de instrucciones de uso (.docx o .txt)
├── Proyectos/               ← Carpetas generadas por cada diseño guardado
├── static/                  ← CSS, JavaScript de la interfaz web
└── templates/               ← Plantillas HTML de la aplicación
```

---

## 💡 Funcionalidades principales

- **Asistente por fases**: Proyectista → Ubicación → Disponibilidad → Parámetros → Esquema
- **Mapa interactivo**: Haz clic en el mapa para obtener coordenadas, altitud y clima automáticamente
- **Multi-unidades independientes**: Configura cada generador, transformador y posición de línea de forma individual
- **Filtrado inteligente de esquemas**: El motor recomienda esquemas priorizando la disponibilidad exigida
- **Exportación automática**: Genera un archivo Excel multi-hoja y un PDF de reporte por cada diseño
- **Historial de proyectos**: Accede a todos los diseños anteriores desde la pantalla principal

---

## ⚠ Notas importantes

- La carpeta `BASE DE DATOS/` contiene los archivos Excel con los esquemas y tensiones. **No moverla ni renombrarla**.
- La carpeta `Proyectos/` se genera automáticamente y almacena los diseños guardados. No es necesario incluirla al compartir el proyecto.
- Para añadir instrucciones de uso personalizadas, coloca un archivo `.docx` o `.txt` en la carpeta `Instrucciones/`.

---

*Proyecto desarrollado con Python (Flask) + HTML/CSS/JavaScript*
