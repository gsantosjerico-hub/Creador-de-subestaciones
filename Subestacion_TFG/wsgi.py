import sys
import os

# Asegura que el directorio del proyecto esté en el path de Python
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app

if __name__ == "__main__":
    app.run()
