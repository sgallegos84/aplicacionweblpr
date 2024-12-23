import requests
import json
import pyodbc
from datetime import datetime
import uuid
import logging
import os
from logging.handlers import RotatingFileHandler

# Configuración de logs
log_directory = '/home/sgallegos/LPRAxxon/log'

# Asegurarse de que la carpeta de logs exista
os.makedirs(log_directory, exist_ok=True)

# Archivos de log
insertion_log = os.path.join(log_directory, 'insertion_log.log')
error_log = os.path.join(log_directory, 'error_log.log')

# Tamaño máximo para el archivo de log antes de rotar (en bytes)
max_log_size = 30 * 1024 * 1024  # 30 MB

# Configuración básica del logger
logging.basicConfig(level=logging.INFO)

# Logger para inserciones con rotación de archivos
insertion_logger = logging.getLogger('insertion_logger')
insertion_handler = RotatingFileHandler(
    insertion_log, 
    maxBytes=max_log_size, 
    backupCount=5  # Mantener 5 archivos de respaldo
)
insertion_handler.setLevel(logging.INFO)
insertion_formatter = logging.Formatter('%(asctime)s - %(message)s')
insertion_handler.setFormatter(insertion_formatter)
insertion_logger.addHandler(insertion_handler)

# Logger para errores
error_logger = logging.getLogger('error_logger')
error_handler = logging.FileHandler(error_log)
error_handler.setLevel(logging.ERROR)
error_formatter = logging.Formatter('%(asctime)s - %(message)s')
error_handler.setFormatter(error_formatter)
error_logger.addHandler(error_handler)

# Configuración de conexión a SQL Server
server_mobileapps = '10.13.61.249'  # Dirección IP del servidor MobileApps
server_robados = '10.13.61.249'  # Dirección IP del servidor Robados_FA
database_mobileapps = 'MobileApps'  # Nombre de la base de datos MobileApps
database_robados = 'MobileApps'  # Nombre de la base de datos Robados_FA
username = 'sgallegos'  # Nombre de usuario
password = 'P0khara1984'  # Contraseña

# URL del endpoint
url = "http://10.13.61.160:40000/core/Events"

# Encabezados opcionales
headers = {
    # Si necesitas agregar autenticación o cualquier otro encabezado:
    # "Authorization": "Bearer <tu_token>",
}

def conectar_a_sql(server, database):
    """Conecta a la base de datos SQL Server."""
    try:
        conn = pyodbc.connect(
            f'DRIVER={{ODBC Driver 17 for SQL Server}};'
            f'SERVER={server};'
            f'DATABASE={database};'
            f'UID={username};'
            f'PWD={password}'
        )
        logging.info(f"Conexión exitosa con la base de datos {database}.")
        return conn
    except Exception as e:
        error_logger.error(f"Error al conectar a la base de datos {database}: {e}")
        return None

def obtener_coordenadas(conn_mobileapps, cam_id):
    """Obtiene las coordenadas de la tabla LPR_PSIM usando el cam_id."""
    cursor = conn_mobileapps.cursor()

    try:
        # Consultar las coordenadas (latitud y longitud) según el cam_id
        cursor.execute("""
            SELECT [LATITUDE], [LONGITUDE]
            FROM [MobileApps].[dbo].[LPR_PSIM]
            WHERE [ID] = ?
        """, cam_id)

        # Obtener los resultados
        resultado = cursor.fetchone()
        if resultado:
            latitud, longitud = resultado
            return latitud, longitud
        else:
            error_logger.error(f"No se encontraron coordenadas para el cam_id {cam_id}.")
            return None, None
    except Exception as e:
        error_logger.error(f"Error al obtener coordenadas para cam_id {cam_id}: {e}")
        return None, None
    finally:
        cursor.close()

def insertar_evento(conn_mobileapps, conn_robados, evento):
    """Inserta un evento en la base de datos MobileApps."""
    cursor = conn_mobileapps.cursor()

    try:
        # Construir la consulta SQL de inserción con 54 marcadores de parámetros
        sql = """
        INSERT INTO PSIM_Detection (
            cam_id,
            cam_name,
            category,
            category_adr_class,
            category_adr_meaning,
            charNum,
            complete,
            confidence,
            control_summ,
            country_code,
            country_region_code,
            current_frame,
            datafile,
            datetime,
            direction,
            event_type,
            fluid_level,
            good_meaning,
            hazard_class,
            id,
            is_entry,
            limit_speed,
            module,
            number_defined,
            param0,
            param0_unicode,
            param3,
            plate,
            plate_bottom,
            plate_guid,
            plate_left,
            plate_region_code,
            plate_right,
            plate_top,
            protocol_id,
            reason,
            roadar_country,
            slave_id,
            source_guid,
            speed,
            src_action,
            src_objid,
            src_objtype,
            threshold_speed,
            time,
            total_frames,
            type,
            type_number,
            unicode_plate,
            vehicle_brand,
            vehicle_color,
            vehicle_model,
            vehicle_type,
            without_plate
            ) VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
            )
        """
        
        # Extraer valores del evento, manejando posibles valores nulos
        parametros = (
            evento.get('cam_id'), 
            evento.get('cam_name'), 
            evento.get('category', ''),
            evento.get('category_adr_class', ''), 
            evento.get('category_adr_meaning', ''),
            int(evento.get('charNum', 0)), 
            int(evento.get('complete', 0)), 
            int(evento.get('confidence', 0)),
            int(evento.get('control_summ', 0)), 
            evento.get('country_code', ''),
            evento.get('country_region_code', ''), 
            int(evento.get('current_frame', 0)),
            evento.get('datafile', ''), 
            evento.get('datetime', None), 
            int(evento.get('direction', 0)),
            int(evento.get('event_type', 0)), 
            int(evento.get('fluid_level', -1)), 
            evento.get('good_meaning', ''),
            evento.get('hazard_class', ''), 
            evento.get('id', None), 
            int(evento.get('is_entry', 0)),
            int(evento.get('limit_speed', 0)), 
            evento.get('module', ''), 
            int(evento.get('number_defined', 0)),
            evento.get('param0', ''), 
            evento.get('param0_unicode', ''), 
            evento.get('param3', ''),
            evento.get('plate', ''), 
            int(evento.get('plate_bottom', 0)),
            uuid.UUID(evento.get('plate_guid')) if evento.get('plate_guid') else None,
            int(evento.get('plate_left', 0)), 
            evento.get('plate_region_code', ''),
            int(evento.get('plate_right', 0)), 
            int(evento.get('plate_top', 0)),
            uuid.UUID(evento.get('protocol_id')) if evento.get('protocol_id') else None,
            evento.get('reason', ''), 
            evento.get('roadar_country', ''), 
            evento.get('slave_id', ''),
            uuid.UUID(evento.get('source_guid')) if evento.get('source_guid') else None,
            int(evento.get('speed', 0)), 
            evento.get('src_action', ''), 
            int(evento.get('src_objid', 0)),
            evento.get('src_objtype', ''), 
            int(evento.get('threshold_speed', 0)),
            evento.get('datetime', None), 
            int(evento.get('total_frames', -1)), 
            evento.get('type', ''),
            int(evento.get('type_number', 0)), 
            evento.get('unicode_plate', ''),
            evento.get('vehicle_brand', ''), 
            evento.get('vehicle_color', ''),
            evento.get('vehicle_model', ''), 
            evento.get('vehicle_type', ''),
            int(evento.get('without_plate', 0))
        )

        # Verificar la longitud de los parámetros
        if len(parametros) != 54:
            error_logger.error(f"Error: Se esperaban 54 parámetros, pero se encontraron {len(parametros)}.")
            return
        
        # Ejecutar la consulta
        cursor.execute(sql, parametros)
        conn_mobileapps.commit()
        insertion_logger.info(f"Evento insertado exitosamente: {json.dumps(evento, indent=4)}")

        # Consultar si la placa está en la base de datos de vehículos robados
        if evento.get('plate'):
            consultar_vehiculo_robado(conn_mobileapps, conn_robados, evento.get('plate'), evento)

    except Exception as e:
        error_logger.error(f"Error al insertar el evento en la base de datos: {e}")
        conn_mobileapps.rollback()
    finally:
        cursor.close()

def consultar_vehiculo_robado(conn_mobileapps, conn_robados, placa, evento):
    try:
        cursor_robados = conn_robados.cursor()

        cursor_robados.execute("""
            SELECT [Placa] FROM Robados_PSIM_Prueba WHERE [Placa] = ?
        """, placa)

        if cursor_robados.fetchone():
            cursor_mobileapps = conn_mobileapps.cursor()
            cursor_mobileapps.execute("""
                INSERT INTO PSIM_ROBADOS (Fecha, Placas) VALUES (?, ?)
            """, datetime.now(), placa)
            conn_mobileapps.commit()
            insertion_logger.info(f"Vehículo robado insertado: {placa}")

            # Enviar la solicitud POST cuando se detecta un vehículo robado
            enviar_solicitud_post(evento, evento, evento['datetime'], conn_mobileapps)

    except Exception as e:
        error_logger.error(f"Error al consultar/inserta: {e}")
    finally:
        cursor_robados.close()

def enviar_solicitud_post(vehiculo, ubicacion, fecha_evento, conn_mobileapps):
    """Envía la solicitud POST a la ruta indicada con los datos del vehículo y la ubicación del evento."""
    url_post = "http://10.13.61.120:49169"
    
    # Obtener las coordenadas del cam_id desde la base de datos
    latitud, longitud = obtener_coordenadas(conn_mobileapps, vehiculo['cam_id'])
    
    # Si no se obtuvieron las coordenadas, se usan las proporcionadas por el evento
    if latitud is None or longitud is None:
        latitud = vehiculo.get('latitude', '0')
        longitud = vehiculo.get('longitude', '0')
    
    # Obtener la información relevante del vehículo
    tipo_incidente = "30402"  # Tipo de incidente (según el ejemplo proporcionado)
    tipo_imagen = "image/jpeg"
    info_lugar = vehiculo['cam_name']
    imagen_ruta_plate = f"http://{vehiculo['SlaveId']}:10001/lprserver/GetImage/Plate_numbers/{vehiculo['PlateGuid']}"
    imagen_ruta_frames = f"http://{vehiculo['SlaveId']}:10001/lprserver/GetImage/Frames/{vehiculo['PlateGuid']}"
    placa = vehiculo['plate']
    marca = vehiculo.get('vehicle_brand', '')
    modelo = vehiculo.get('vehicle_model', '') 
    color = vehiculo.get('vehicle_color', '')

    # Datos de la solicitud POST
    datos_post = {
        "method": "create",
        "params": [
            "1",  # Usuario (LPR_PSIM)
            "LPR_PSIM",  # Usuario
            "es_MX",  # Idioma
            "ARCO",  # Ubicación del evento
            "1",  # Otro parámetro (no especificado en el ejemplo)
            fecha_evento,  # Fecha del evento
            "AGUASCALIENTES",  # Estado
            "",  # Otro campo vacío
            fecha_evento,  # Fecha del evento (segunda vez)
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            tipo_incidente, 
            tipo_imagen, 
            imagen_ruta_plate,
            fecha_evento, 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            latitud, 
            longitud, 
            "0", 
            fecha_evento, 
            "0", 
            "0", 
            vehiculo.get('speed', '0'),
            vehiculo.get('direction', 'NO'), 
            "", 
            "",
            "", 
            "", 
            "", 
            "",
            "", 
            info_lugar, 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "",
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            "", 
            tipo_imagen,
            imagen_ruta_frames, 
            fecha_evento, 
            "", 
            ["", ""], 
            ["", ""], 
            "", 
            "", 
            "",
            "", 
            "", 
            placa, 
            "", 
            "", 
            "", 
            marca, 
            modelo, 
            color
        ],
        "id": "1234567890"
    }
    
    # Realizar la solicitud POST
    try:
        response = requests.post(url_post, json=datos_post)
        response.raise_for_status()  # Verificar si la respuesta fue exitosa
        insertion_logger.info(f"Solicitud POST enviada exitosamente: {response.text}")
    except requests.exceptions.RequestException as e:
        error_logger.error(f"Error al enviar solicitud POST: {e}")

