#!/usr/bin/env python3
"""
Serveur webhook simple pour recevoir les notifications de GitHub Actions
et déclencher le déploiement sur le Raspberry Pi
"""

import json
import subprocess
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Configuration
WEBHOOK_PORT = int(os.getenv('WEBHOOK_PORT', '9002'))
WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', 'changez-ce-secret')
PROJECT_DIR = os.getenv('PROJECT_DIR', '/home/dinitech/bnk2026')
SCRIPT_PATH = os.path.join(os.path.dirname(__file__), 'webhook-receiver.sh')

class WebhookHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Override pour logger dans un fichier"""
        message = format % args
        log_file = '/var/log/bnk2026-webhook.log'
        try:
            with open(log_file, 'a') as f:
                f.write(f"[{self.log_date_time_string()}] {message}\n")
        except:
            pass
        print(message)
    
    def do_POST(self):
        """Gérer les requêtes POST"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            payload = self.rfile.read(content_length).decode('utf-8')
            
            # Vérifier le secret (optionnel)
            secret = self.headers.get('X-Webhook-Secret', '')
            if secret != WEBHOOK_SECRET:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Invalid secret'}).encode())
                return
            
            # Parser le JSON
            try:
                data = json.loads(payload)
            except:
                data = {}
            
            # Exécuter le script de déploiement
            env = os.environ.copy()
            env['WEBHOOK_SECRET'] = WEBHOOK_SECRET
            env['PROJECT_DIR'] = PROJECT_DIR
            
            process = subprocess.Popen(
                ['bash', SCRIPT_PATH],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env,
                cwd=PROJECT_DIR
            )
            
            stdout, stderr = process.communicate(input=payload.encode())
            
            if process.returncode == 0:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {
                    'status': 'success',
                    'message': 'Deployment triggered',
                    'output': stdout.decode()[:500]  # Limiter la taille
                }
                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {
                    'status': 'error',
                    'message': 'Deployment failed',
                    'error': stderr.decode()[:500]
                }
                self.wfile.write(json.dumps(response).encode())
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def do_GET(self):
        """Health check"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            'status': 'ok',
            'service': 'bnk2026-webhook',
            'port': WEBHOOK_PORT
        }).encode())

def main():
    server = HTTPServer(('0.0.0.0', WEBHOOK_PORT), WebhookHandler)
    print(f"Webhook server démarré sur le port {WEBHOOK_PORT}")
    print(f"Secret: {WEBHOOK_SECRET}")
    print(f"Project dir: {PROJECT_DIR}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt du serveur webhook...")
        server.shutdown()

if __name__ == '__main__':
    main()
