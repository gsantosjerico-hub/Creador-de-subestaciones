import os
import io
import datetime
from flask import Flask, render_template, request, jsonify, send_file
import pandas as pd
from fpdf import FPDF
import glob

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTRUCCIONES_DIR = os.path.join(BASE_DIR, 'Instrucciones')
os.makedirs(INSTRUCCIONES_DIR, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/instrucciones', methods=['GET'])
def get_instrucciones():
    archivos = os.listdir(INSTRUCCIONES_DIR)
    
    for file in archivos:
        if file.endswith('.docx'):
            try:
                import mammoth
                with open(os.path.join(INSTRUCCIONES_DIR, file), "rb") as docx_file:
                    result = mammoth.convert_to_html(docx_file)
                    html = result.value
                return jsonify({'text': html, 'is_html': True})
            except Exception as e:
                return jsonify({'text': f"Error al leer el archivo Word: {e}", 'is_html': False})
                
    for file in archivos:
        if file.endswith('.txt'):
            try:
                with open(os.path.join(INSTRUCCIONES_DIR, file), 'r', encoding='utf-8') as f:
                    return jsonify({'text': f.read()})
            except Exception as e:
                return jsonify({'text': f"Error al leer el archivo de texto: {e}"})
                
    return jsonify({'text': "No se encontró ningún archivo de instrucciones en la carpeta 'Instrucciones'."})

@app.route('/api/proyectos', methods=['GET'])
def get_proyectos():
    # En la versión cloud los proyectos no se almacenan en el servidor.
    # Los archivos se descargan directamente al ordenador del usuario.
    return jsonify({'proyectos': [], 'info': 'Versión en la nube: los proyectos se descargan directamente.'})

@app.route('/api/tensiones', methods=['GET'])
def get_tensiones():
    try:
        excel_path = os.path.join(BASE_DIR, 'BASE DE DATOS', 'BASE DE DATOS 1.xlsx')
        if not os.path.exists(excel_path):
            return jsonify({'tensiones': [], 'error': 'No se encontró el archivo de base de datos.'})
            
        df = pd.read_excel(excel_path, header=None)
        cat_series = df.iloc[3:, 4].ffill()
        tensiones_raw = df.iloc[3:, 1]
        
        tensiones = []
        for t, c in zip(tensiones_raw, cat_series):
            if pd.notna(t) and str(t).strip() != '':
                tensiones.append({
                    'tension': str(t).strip(),
                    'categoria': str(c).strip().upper() if pd.notna(c) else 'UNKNOWN'
                })
        
        return jsonify({'tensiones': tensiones})
    except Exception as e:
        return jsonify({'tensiones': [], 'error': str(e)})

@app.route('/api/esquemas', methods=['GET'])
def get_esquemas():
    try:
        excel_path = os.path.join(BASE_DIR, 'BASE DE DATOS', 'BASE DE DATOS 1.xlsx')
        if not os.path.exists(excel_path):
            return jsonify({'esquemas': [], 'error': 'No se encontró el archivo de base de datos.'})
            
        df = pd.read_excel(excel_path, sheet_name='ESQUEMAS', header=2)
        df.columns = df.columns.str.strip()
        df = df.dropna(subset=['ESQUEMA'])
        
        esquemas = []
        for _, row in df.iterrows():
            esquemas.append({
                'esquema': str(row['ESQUEMA']).strip(),
                'aplicacion': str(row['APLICACIÓN']).strip(),
                'funcionalidad': str(row['FUNCIONALIDAD']).strip(),
                'posiciones': str(row['POSICIONES']).strip(),
                'disponibilidad': str(row['DISPONIBILIDAD']).strip()
            })
        return jsonify({'esquemas': esquemas})
    except Exception as e:
        return jsonify({'esquemas': [], 'error': str(e)})

@app.route('/api/esquemas_imagen/<path:filename>')
def serve_esquema_imagen(filename):
    fotos_dir = os.path.join(BASE_DIR, 'BASE DE DATOS', 'FOTOS ESQUEMAS')
    pattern = os.path.join(fotos_dir, f"{filename}.*")
    matches = glob.glob(pattern)
    if matches:
        return send_file(matches[0])
    return "Not found", 404

# -----------------------------------------------------------------------
# GENERACIÓN EN MEMORIA (sin guardar en disco, compatible con servidores)
# -----------------------------------------------------------------------

def _build_pdf_bytes(data, timestamp):
    """Construye el PDF en memoria y devuelve bytes."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", style="B", size=16)
    pdf.cell(0, 10, text="Reporte de Diseño de Subestación", new_x="LMARGIN", new_y="NEXT", align='C')
    pdf.set_font("Helvetica", size=10)
    pdf.cell(0, 10, text=f"Fecha: {timestamp}", new_x="LMARGIN", new_y="NEXT", align='C')
    pdf.ln(10)

    sections = [
        ("Fase 1: Datos Proyectista", data.get('step_proyectista', {})),
        ("Fase 2: Ubicación", data.get('step_ubicacion', {})),
        ("Fase 3: Disponibilidad y Categoría", data.get('step_categoria', {})),
        ("Fase 4: Parámetros Eléctricos", data.get('step_parametros', {})),
    ]
    
    for title, section_data in sections:
        pdf.set_font("Helvetica", style="B", size=14)
        pdf.cell(0, 10, text=title, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", size=12)
        for k, v in section_data.items():
            k_format = k.replace("_", " ").capitalize()
            v_format = str(v).replace("\n", " | ").encode('latin-1', 'replace').decode('latin-1')
            pdf.multi_cell(0, 8, text=f"{k_format}: {v_format}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(5)

    arrays = data.get('arrays_dinamicos', {})
    array_labels = {
        'func_generadores': 'Generadores',
        'func_trafos_asoc': 'Trafos Asociados a Generadores',
        'func_trafos_extra': 'Trafos Extra',
        'func_lineas': 'Posiciones de Línea (Generación)',
        'trans_man_lineas': 'Posiciones de Línea (Maniobra)',
        'trans_trf_trafos': 'Transformadores Principales',
        'trans_trf_lineas': 'Posiciones de Línea (Transformación)'
    }

    for key, arr in arrays.items():
        if arr and len(arr) > 0:
            pdf.set_font("Helvetica", style="B", size=12)
            pdf.cell(0, 8, text=f"-> {array_labels.get(key, key)}", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", size=10)
            for i, item in enumerate(arr):
                details = ", ".join([f"{k}: {v}" for k, v in item.items()])
                details = details.encode('latin-1', 'replace').decode('latin-1')
                pdf.multi_cell(0, 6, text=f"  Unidad {i+1}: {details}", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(3)

    pdf.ln(5)

    if data.get('esquema_seleccionado'):
        esq = data['esquema_seleccionado']
        pdf.add_page()
        pdf.set_font("Helvetica", style="B", size=14)
        pdf.cell(0, 10, text="Fase 5: Esquema Seleccionado", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", size=12)
        pdf.multi_cell(0, 8, text=f"Esquema: {esq.get('esquema', '')}", new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(0, 8, text=f"Disponibilidad: {esq.get('disponibilidad', '')}", new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(0, 8, text=f"Funcionalidad: {esq.get('funcionalidad', '')}", new_x="LMARGIN", new_y="NEXT")
        
        fotos_dir = os.path.join(BASE_DIR, 'BASE DE DATOS', 'FOTOS ESQUEMAS')
        pattern = os.path.join(fotos_dir, f"{esq.get('esquema', '')}.*")
        matches = glob.glob(pattern)
        if matches:
            pdf.ln(5)
            pdf.image(matches[0], w=180)

    return pdf.output()  # Devuelve bytes


def _build_excel_bytes(data):
    """Construye el Excel en memoria y devuelve bytes."""
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        pd.DataFrame([data.get('step_proyectista', {})]).to_excel(writer, sheet_name='Datos Proyectista', index=False)
        pd.DataFrame([data.get('step_ubicacion', {})]).to_excel(writer, sheet_name='Ubicación', index=False)
        pd.DataFrame([data.get('step_categoria', {})]).to_excel(writer, sheet_name='Disponibilidad y Categoría', index=False)
        pd.DataFrame([data.get('step_parametros', {})]).to_excel(writer, sheet_name='Parámetros Eléctricos', index=False)

        arrays = data.get('arrays_dinamicos', {})
        for sheet_label, arr in [
            ('Generadores', arrays.get('func_generadores')),
            ('Trafos Asoc Gen', arrays.get('func_trafos_asoc')),
            ('Trafos Extra Gen', arrays.get('func_trafos_extra')),
            ('Líneas Gen', arrays.get('func_lineas')),
            ('Líneas Maniobra', arrays.get('trans_man_lineas')),
            ('Trafos Transf', arrays.get('trans_trf_trafos')),
            ('Líneas Transf', arrays.get('trans_trf_lineas')),
        ]:
            if arr and len(arr) > 0:
                pd.DataFrame(arr).to_excel(writer, sheet_name=sheet_label[:31], index=False)

        esq = data.get('esquema_seleccionado')
        if esq:
            pd.DataFrame([esq]).to_excel(writer, sheet_name='Esquema Seleccionado', index=False)

    buffer.seek(0)
    return buffer.read()


@app.route('/api/guardar_diseno', methods=['POST'])
def guardar_diseno():
    """Genera PDF + Excel en memoria y devuelve ambos en base64 para descarga directa."""
    data = request.json
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    project_name = f"Proyecto_Subestacion_{timestamp}"

    try:
        import base64
        pdf_bytes = _build_pdf_bytes(data, timestamp)
        excel_bytes = _build_excel_bytes(data)

        return jsonify({
            'status': 'success',
            'project_name': project_name,
            'pdf_b64': base64.b64encode(pdf_bytes).decode('utf-8'),
            'excel_b64': base64.b64encode(excel_bytes).decode('utf-8'),
        })
    except Exception as e:
        import traceback
        return jsonify({'status': 'error', 'message': str(e), 'trace': traceback.format_exc()})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'production') != 'production'
    print(f"Iniciando servidor en puerto {port}...")
    app.run(debug=debug, host='0.0.0.0', port=port)
