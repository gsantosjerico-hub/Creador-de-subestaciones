# test

data = {
    "step_proyectista": {"nombre": "Test"},
    "step_ubicacion": {"clima": "Temp: 15°C, Viento: 10km/h"},
    "step_categoria": {"disponibilidad": "Alta"},
    "step_parametros": {"funcion": "GENERACION", "trans_tipo": ""},
    "arrays_dinamicos": {
        "func_generadores": [{"tension": "20", "potencia": "100", "cc": "50"}],
        "func_trafos_asoc": [],
        "func_trafos_extra": [],
        "func_lineas": [{"tension": "220"}],
        "trans_man_lineas": [],
        "trans_trf_trafos": [],
        "trans_trf_lineas": []
    },
    "esquema_seleccionado": {
        "esquema": "Interruptor simple (IS)",
        "aplicacion": "GENERACION",
        "disponibilidad": "ALTA",
        "funcionalidad": "TEST",
        "posiciones": "<=4"
    }
}

try:
    res = requests.post('http://127.0.0.1:5000/api/guardar_diseno', json=data)
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    import urllib.request
    import json
    req = urllib.request.Request('http://127.0.0.1:5000/api/guardar_diseno', data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        res = urllib.request.urlopen(req)
        print("Status:", res.status)
        print("Response:", res.read().decode('utf-8'))
    except Exception as err:
        print("Error:", err)
