#!/usr/bin/env python3
"""
Lookitry Social OS - SonAuto Music Generator
==========================================
Genera música para TikTok usando SonAuto Melodia API.

Uso:
    python3 music_generator.py generate --prompt "upbeat fashion song" --tags electronic,upbeat
    python3 music_generator.py status --task-id abc123
"""

import os
import sys
import json
import time
import requests
from datetime import datetime

# Paths
BASE_PATH = '/home/travis/Lookitry/Lookitry/social-os'
MUSIC_OUTPUT = f'{BASE_PATH}/music/output'
MUSIC_HISTORY = f'{BASE_PATH}/music/history.json'

# API Config
SONAUTO_API_KEY = 'sksonauto_wrlgeFuh0RI9Ajb7I8yMfg132qj_PBIFJn55_hWP74IrnJid'
SONAUTO_API_URL = 'https://api.sonauto.ai/v1'

# Brand music styles for TikTok (using VALID SonAuto tags only!)
BRAND_MUSIC_STYLES = {
    'energetic': {
        'tags': ['electronic', 'dance', '2020s'],
        'prompt': 'An energetic upbeat electronic dance track, modern tech vibes, fast rhythm'
    },
    'chill': {
        'tags': ['chill', 'ambient', 'relaxation', 'lo-fi'],
        'prompt': 'A chill relaxed ambient track, fashion lifestyle mood, smooth beat'
    },
    'corporate': {
        'tags': ['corporate', 'positive', 'motivational', 'business'],
        'prompt': 'A positive motivational corporate track, tech startup energy'
    },
    'trending': {
        'tags': ['electronic', 'pop', '2020s'],
        'prompt': 'A trending viral TikTok track, energetic and catchy, modern sound'
    },
    'fashion': {
        'tags': ['electronic', 'dance', '2020s'],
        'prompt': 'A fashion-forward electronic track, luxury vibes, sleek beat'
    },
    'tech': {
        'tags': ['electronic', 'synthpop', 'modern'],
        'prompt': 'A modern tech-focused electronic track, futuristic vibes'
    }
}

class SonAutoMusicGenerator:
    def __init__(self):
        self.api_key = SONAUTO_API_KEY
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        self.history = self.load_history()
    
    def load_history(self) -> dict:
        """Carga historial de generaciones"""
        os.makedirs(os.path.dirname(MUSIC_HISTORY), exist_ok=True)
        if os.path.exists(MUSIC_HISTORY):
            with open(MUSIC_HISTORY, 'r') as f:
                return json.load(f)
        return {'generations': []}
    
    def save_history(self):
        """Guarda historial"""
        with open(MUSIC_HISTORY, 'w') as f:
            json.dump(self.history, f, indent=2, default=str)
    
    def generate(self, prompt: str, tags: list = None, style: str = None) -> dict:
        """
        Genera una canción con SonAuto.
        
        Args:
            prompt: Descripción textual de la canción
            tags: Lista de tags (género, mood, etc.)
            style: Estilo predefinido de marca
        
        Returns:
            dict con task_id y datos
        """
        
        # Si hay style, usar preset
        if style and style in BRAND_MUSIC_STYLES:
            preset = BRAND_MUSIC_STYLES[style]
            tags = tags or preset['tags']
            prompt = prompt or preset['prompt']
        
        # Default tags si no hay
        if not tags:
            tags = ['electronic', 'upbeat', '2020s']
        
        print(f"🎵 Generando música...")
        print(f"   Prompt: {prompt}")
        print(f"   Tags: {', '.join(tags)}")
        
        # Crear payload
        payload = {
            'prompt': prompt,
            'tags': tags,
            'num_songs': 1
        }
        
        try:
            # Iniciar generación
            response = requests.post(
                f'{SONAUTO_API_URL}/generations',
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"❌ Error API: {response.status_code}")
                print(f"   {response.text[:200]}")
                return None
            
            data = response.json()
            task_id = data.get('task_id')
            
            print(f"✅ Generación iniciada!")
            print(f"   Task ID: {task_id}")
            
            return {
                'task_id': task_id,
                'prompt': prompt,
                'tags': tags,
                'status': 'started',
                'started_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def poll_status(self, task_id: str, poll_interval: int = 5) -> dict:
        """
        Hace poll del estado de la generación.
        
        Returns:
            dict con status y song_url si está listo
        """
        print(f"\n⏳ Esperando generación...")
        
        while True:
            try:
                response = requests.get(
                    f'{SONAUTO_API_URL}/generations/status/{task_id}',
                    headers=self.headers,
                    timeout=30
                )
                
                if response.status_code != 200:
                    print(f"❌ Error polling: {response.status_code}")
                    break
                
                status = response.text.strip('"')
                print(f"   Status: {status}")
                
                if status == 'SUCCESS':
                    return self.get_result(task_id)
                elif status == 'FAILURE':
                    print("❌ Generación fallida")
                    return None
                
                time.sleep(poll_interval)
                
            except Exception as e:
                print(f"❌ Error: {e}")
                break
        
        return None
    
    def get_result(self, task_id: str) -> dict:
        """Obtiene el resultado de una generación"""
        try:
            response = requests.get(
                f'{SONAUTO_API_URL}/generations/{task_id}',
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            
            song_url = data.get('song_paths', [None])[0]
            lyrics = data.get('lyrics', '')
            seed = data.get('seed', '')
            tags = data.get('tags', [])
            
            # Guardar archivo
            if song_url:
                song_path = self.download_song(song_url, task_id)
            else:
                song_path = None
            
            result = {
                'task_id': task_id,
                'song_url': song_url,
                'song_path': song_path,
                'lyrics': lyrics,
                'seed': seed,
                'tags': tags,
                'status': 'SUCCESS',
                'completed_at': datetime.now().isoformat()
            }
            
            # Guardar en historial
            self.history['generations'].append(result)
            self.save_history()
            
            return result
            
        except Exception as e:
            print(f"❌ Error getting result: {e}")
            return None
    
    def download_song(self, url: str, task_id: str) -> str:
        """Descarga la canción generada"""
        os.makedirs(MUSIC_OUTPUT, exist_ok=True)
        
        filename = f"sonauto_{task_id}_{datetime.now().strftime('%H%M%S')}.ogg"
        filepath = os.path.join(MUSIC_OUTPUT, filename)
        
        try:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ Canción guardada: {filepath}")
            return filepath
            
        except Exception as e:
            print(f"❌ Error descargando: {e}")
            return None
    
    def generate_and_wait(self, prompt: str, tags: list = None, 
                         style: str = None, poll_interval: int = 5) -> dict:
        """Genera y espera resultado completo"""
        
        # Iniciar generación
        result = self.generate(prompt, tags, style)
        if not result:
            return None
        
        task_id = result['task_id']
        
        # Guardar en historial como started
        self.history['generations'].append(result)
        self.save_history()
        
        # Esperar resultado
        final_result = self.poll_status(task_id, poll_interval)
        
        if final_result:
            # Actualizar historial
            for i, gen in enumerate(self.history['generations']):
                if gen['task_id'] == task_id:
                    self.history['generations'][i] = final_result
                    break
            self.save_history()
        
        return final_result
    
    def list_generations(self, limit: int = 10) -> list:
        """Lista generaciones recientes"""
        gens = self.history.get('generations', [])
        return sorted(gens, key=lambda x: x.get('completed_at', ''), reverse=True)[:limit]


def cmd_generate(args):
    """Comando: Generar música"""
    gen = SonAutoMusicGenerator()
    
    tags = args.tags.split(',') if args.tags else None
    
    result = gen.generate_and_wait(
        prompt=args.prompt,
        tags=tags,
        style=args.style
    )
    
    if result:
        print(f"\n🎉 ¡Música generada!")
        print(f"   Song URL: {result['song_url']}")
        print(f"   Saved: {result['song_path']}")
        print(f"\n📝 Lyrics:")
        print(result.get('lyrics', 'N/A')[:500])


def cmd_status(args):
    """Comando: Ver status de generación"""
    gen = SonAutoMusicGenerator()
    
    result = gen.get_result(args.task_id)
    
    if result:
        print(f"\n✅ Resultado:")
        print(f"   Song URL: {result['song_url']}")
        print(f"   Saved: {result['song_path']}")
    else:
        print("❌ No se pudo obtener resultado")


def cmd_list(args):
    """Comando: Listar generaciones"""
    gen = SonAutoMusicGenerator()
    
    generations = gen.list_generations(args.limit)
    
    print(f"\n📋 ÚLTIMAS {len(generations)} GENERACIONES:")
    print("="*60)
    
    for g in generations:
        status = g.get('status', 'unknown')
        song_path = g.get('song_path', 'N/A')
        tags = ', '.join(g.get('tags', [])[:3])
        print(f"{status} | {tags} | {song_path}")


def cmd_styles(args):
    """Comando: Ver estilos disponibles"""
    gen = SonAutoMusicGenerator()
    
    print("\n🎨 ESTILOS DE MÚSICA PARA MARCA:")
    print("="*60)
    
    for style, data in BRAND_MUSIC_STYLES.items():
        print(f"\n📌 {style.upper()}")
        print(f"   Tags: {', '.join(data['tags'])}")
        print(f"   Prompt: {data['prompt']}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='SonAuto Music Generator')
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # generate
    gen_parser = subparsers.add_parser('generate', help='Generate music')
    gen_parser.add_argument('--prompt', required=True, help='Music description')
    gen_parser.add_argument('--tags', help='Comma-separated tags')
    gen_parser.add_argument('--style', choices=list(BRAND_MUSIC_STYLES.keys()), 
                           help='Use brand preset style')
    
    # status
    status_parser = subparsers.add_parser('status', help='Check generation status')
    status_parser.add_argument('--task-id', required=True, help='Task ID')
    
    # list
    list_parser = subparsers.add_parser('list', help='List recent generations')
    list_parser.add_argument('--limit', type=int, default=10)
    
    # styles
    subparsers.add_parser('styles', help='Show available styles')
    
    args = parser.parse_args()
    
    if args.command == 'generate':
        cmd_generate(args)
    elif args.command == 'status':
        cmd_status(args)
    elif args.command == 'list':
        cmd_list(args)
    elif args.command == 'styles':
        cmd_styles(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
