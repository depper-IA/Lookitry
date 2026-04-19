#!/usr/bin/env python3
"""
Lookitry Social OS - Content Calendar Scheduler
==============================================
Gestiona el calendario de contenido y programa posts.

Uso:
    python3 scheduler.py list
    python3 scheduler.py add --platform instagram --theme inauguracion
    python3 scheduler.py next
    python3 scheduler.py complete --id post_001
"""

import os
import sys
import json
from datetime import datetime, timedelta
from typing import List, Optional

BASE_PATH = '/home/travis/Lookitry/Lookitry/social-os'
CALENDAR_PATH = f'{BASE_PATH}/calendar/content_calendar.json'
TEMPLATES_PATH = f'{BASE_PATH}/slideshows/templates.json'

class ContentScheduler:
    def __init__(self):
        self.calendar = self.load_calendar()
        self.templates = self.load_templates()
    
    def load_calendar(self) -> dict:
        """Carga el calendario"""
        if os.path.exists(CALENDAR_PATH):
            with open(CALENDAR_PATH, 'r') as f:
                return json.load(f)
        return {'calendar': {}, 'best_times': {}, 'posting_frequency': {}}
    
    def save_calendar(self):
        """Guarda el calendario"""
        with open(CALENDAR_PATH, 'w') as f:
            json.dump(self.calendar, f, indent=2)
    
    def load_templates(self) -> dict:
        """Carga templates"""
        if os.path.exists(TEMPLATES_PATH):
            with open(TEMPLATES_PATH, 'r') as f:
                return json.load(f)['templates']
        return {}
    
    def list_posts(self, days: int = 7, status: str = None) -> List[dict]:
        """Lista posts del calendario"""
        posts = []
        today = datetime.now().date()
        end_date = today + timedelta(days=days)
        
        for date_str, day_posts in self.calendar.get('calendar', {}).items():
            post_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            if today <= post_date <= end_date:
                for post in day_posts:
                    if status is None or post.get('status') == status:
                        posts.append({
                            'date': date_str,
                            **post
                        })
        
        # Sort by date
        posts.sort(key=lambda x: (x['date'], x.get('time', '00:00')))
        return posts
    
    def add_post(self, platform: str, template: str, 
                 date: str = None, time: str = None,
                 theme: str = None) -> dict:
        """Añade un post al calendario"""
        
        # Defaults
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        if time is None:
            time = self.calendar.get('best_times', {}).get(platform, ['10:00'])[0]
        
        # Find next available slot for this date
        day_posts = self.calendar.get('calendar', {}).get(date, [])
        
        # Generate ID
        post_id = f"post_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Get template info
        template_data = self.templates.get(template, {})
        captions = template_data.get('captions', [])
        
        post = {
            'id': post_id,
            'platform': platform,
            'time': time,
            'content_type': 'carousel' if template_data.get('slides', 0) > 1 else 'image',
            'template': template,
            'theme': theme or template_data.get('name', template),
            'caption_preview': captions[0] if captions else '',
            'status': 'planned',
            'hook_type': self.detect_hook(captions[0] if captions else ''),
            'created_at': datetime.now().isoformat()
        }
        
        day_posts.append(post)
        self.calendar.setdefault('calendar', {})[date] = day_posts
        self.save_calendar()
        
        return post
    
    def get_next(self, days: int = 7) -> Optional[dict]:
        """Obtiene el siguiente post por ejecutar"""
        today = datetime.now().date()
        
        for i in range(days):
            check_date = today + timedelta(days=i)
            date_str = check_date.strftime('%Y-%m-%d')
            day_posts = self.calendar.get('calendar', {}).get(date_str, [])
            
            for post in day_posts:
                if post.get('status') == 'planned':
                    return {
                        'date': date_str,
                        **post
                    }
        
        return None
    
    def complete_post(self, post_id: str, buffer_post_id: str = None):
        """Marca un post como completado"""
        for date_str, day_posts in self.calendar.get('calendar', {}).items():
            for post in day_posts:
                if post.get('id') == post_id:
                    post['status'] = 'posted'
                    if buffer_post_id:
                        post['buffer_post_id'] = buffer_post_id
                    post['posted_at'] = datetime.now().isoformat()
                    self.save_calendar()
                    return True
        return False
    
    def cancel_post(self, post_id: str):
        """Cancela un post"""
        for date_str, day_posts in self.calendar.get('calendar', {}).items():
            for post in day_posts:
                if post.get('id') == post_id:
                    post['status'] = 'cancelled'
                    self.save_calendar()
                    return True
        return False
    
    def get_stats(self) -> dict:
        """Obtiene estadísticas del calendario"""
        stats = {
            'total_planned': 0,
            'total_posted': 0,
            'total_cancelled': 0,
            'by_platform': {},
            'by_template': {},
            'by_hook_type': {}
        }
        
        for date_str, day_posts in self.calendar.get('calendar', {}).items():
            for post in day_posts:
                status = post.get('status', 'planned')
                platform = post.get('platform', 'unknown')
                template = post.get('template', 'unknown')
                hook = post.get('hook_type', 'unknown')
                
                if status == 'planned':
                    stats['total_planned'] += 1
                elif status == 'posted':
                    stats['total_posted'] += 1
                elif status == 'cancelled':
                    stats['total_cancelled'] += 1
                
                stats['by_platform'][platform] = stats['by_platform'].get(platform, 0) + 1
                stats['by_template'][template] = stats['by_template'].get(template, 0) + 1
                stats['by_hook_type'][hook] = stats['by_hook_type'].get(hook, 0) + 1
        
        return stats
    
    def generate_week_plan(self, start_date: str = None) -> dict:
        """Genera un plan de contenido para la semana"""
        
        if start_date is None:
            start_date = datetime.now().strftime('%Y-%m-%d')
        
        # Best times per platform
        best_times = self.calendar.get('best_times', {
            'instagram': ['10:00', '19:00'],
            'twitter': ['09:00', '17:00'],
            'facebook': ['11:00', '14:00'],
            'linkedin': ['08:00', '12:00']
        })
        
        # Content plan
        plan = {
            'monday': {'instagram': 'educativo', 'twitter': 'producto'},
            'tuesday': {'linkedin': 'testimonial', 'facebook': 'educativo'},
            'wednesday': {'instagram': 'producto', 'twitter': 'cta'},
            'thursday': {'linkedin': 'educativo', 'instagram': 'testimonial'},
            'friday': {'twitter': 'producto', 'facebook': 'cta'},
            'saturday': {'instagram': 'inauguracion'},
            'sunday': {'linkedin': 'educativo'}
        }
        
        return {
            'start_date': start_date,
            'best_times': best_times,
            'plan': plan
        }
    
    @staticmethod
    def detect_hook(text: str) -> str:
        """Detecta el tipo de hook"""
        text_lower = text.lower()
        if '¿sabías' in text_lower or 'sabias' in text_lower:
            return 'question'
        elif '%' in text or 'por ciento' in text_lower:
            return 'stat'
        elif 'cómo' in text_lower or 'como' in text_lower:
            return 'howto'
        elif 'esta es' in text_lower:
            return 'story'
        elif 'prueba' in text_lower or 'reto' in text_lower:
            return 'challenge'
        elif 'antes' in text_lower:
            return 'comparison'
        else:
            return 'general'


def cmd_list(args):
    """Lista posts"""
    scheduler = ContentScheduler()
    
    if args.status:
        posts = scheduler.list_posts(days=args.days, status=args.status)
    else:
        posts = scheduler.list_posts(days=args.days)
    
    if not posts:
        print("No hay posts en el calendario")
        return
    
    print(f"\n📅 POSTS EN CALENDARIO (próximos {args.days} días)")
    print("=" * 70)
    print(f"{'Fecha':<12} {'Hora':<8} {'Platform':<12} {'Template':<15} {'Hook':<12} {'Status':<10}")
    print("-" * 70)
    
    for post in posts:
        print(f"{post['date']:<12} {post.get('time', 'N/A'):<8} {post['platform']:<12} "
              f"{post.get('template', 'N/A'):<15} {post.get('hook_type', 'N/A'):<12} {post.get('status', 'planned'):<10}")
    
    print(f"\nTotal: {len(posts)} posts")


def cmd_add(args):
    """Añade un post"""
    scheduler = ContentScheduler()
    
    post = scheduler.add_post(
        platform=args.platform,
        template=args.template,
        date=args.date,
        time=args.time,
        theme=args.theme
    )
    
    print(f"✅ Post añadido:")
    print(f"   ID: {post['id']}")
    print(f"   Platform: {post['platform']}")
    print(f"   Date: {post.get('date', 'N/A')}")
    print(f"   Time: {post['time']}")
    print(f"   Template: {post['template']}")
    print(f"   Theme: {post['theme']}")


def cmd_next(args):
    """Muestra el siguiente post"""
    scheduler = ContentScheduler()
    
    post = scheduler.get_next(days=args.days)
    
    if not post:
        print("No hay posts pendientes")
        return
    
    print(f"\n📌 SIGUIENTE POST:")
    print("=" * 50)
    print(f"ID: {post['id']}")
    print(f"Fecha: {post['date']}")
    print(f"Hora: {post['time']}")
    print(f"Platform: {post['platform']}")
    print(f"Template: {post['template']}")
    print(f"Theme: {post['theme']}")
    print(f"Hook: {post.get('hook_type', 'N/A')}")
    print(f"\nCaption Preview:")
    print(f"   {post.get('caption_preview', 'N/A')}")


def cmd_complete(args):
    """Marca post como completado"""
    scheduler = ContentScheduler()
    
    if scheduler.complete_post(args.id, args.buffer_id):
        print(f"✅ Post {args.id} marcado como completado")
    else:
        print(f"❌ Post {args.id} no encontrado")


def cmd_stats(args):
    """Muestra estadísticas"""
    scheduler = ContentScheduler()
    
    stats = scheduler.get_stats()
    
    print(f"\n📊 ESTADÍSTICAS DEL CALENDARIO")
    print("=" * 50)
    print(f"Posts planeados: {stats['total_planned']}")
    print(f"Posts publicados: {stats['total_posted']}")
    print(f"Posts cancelados: {stats['total_cancelled']}")
    
    print(f"\nPor Platform:")
    for platform, count in sorted(stats['by_platform'].items()):
        print(f"  {platform}: {count}")
    
    print(f"\nPor Template:")
    for template, count in sorted(stats['by_template'].items()):
        print(f"  {template}: {count}")
    
    print(f"\nPor Hook Type:")
    for hook, count in sorted(stats['by_hook_type'].items()):
        print(f"  {hook}: {count}")


def cmd_generate_plan(args):
    """Genera plan semanal"""
    scheduler = ContentScheduler()
    
    plan = scheduler.generate_week_plan()
    
    print(f"\n📆 PLAN SEMANAL (desde {plan['start_date']})")
    print("=" * 50)
    
    days_es = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    days_es_names = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    
    for day_en, day_es_name in zip(days_es, days_es_names):
        posts = plan['plan'].get(day_en, {})
        if posts:
            print(f"\n{day_es_name}:")
            for platform, template in posts.items():
                times = plan['best_times'].get(platform, ['10:00'])
                print(f"  {platform}: {template} ({times[0]})")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Lookitry Content Calendar')
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # list
    list_parser = subparsers.add_parser('list', help='List posts')
    list_parser.add_argument('--days', type=int, default=7)
    list_parser.add_argument('--status', help='Filter by status')
    
    # add
    add_parser = subparsers.add_parser('add', help='Add post')
    add_parser.add_argument('--platform', required=True, 
                           choices=['instagram', 'twitter', 'facebook', 'linkedin'])
    add_parser.add_argument('--template', required=True,
                           choices=['inauguracion', 'educativo', 'producto', 'testimonial', 'cta'])
    add_parser.add_argument('--date', help='Date (YYYY-MM-DD)')
    add_parser.add_argument('--time', help='Time (HH:MM)')
    add_parser.add_argument('--theme', help='Theme description')
    
    # next
    next_parser = subparsers.add_parser('next', help='Show next post')
    next_parser.add_argument('--days', type=int, default=7)
    
    # complete
    complete_parser = subparsers.add_parser('complete', help='Mark post as complete')
    complete_parser.add_argument('--id', required=True)
    complete_parser.add_argument('--buffer-id', dest='buffer_id', help='Buffer post ID')
    
    # stats
    stats_parser = subparsers.add_parser('stats', help='Show statistics')
    
    # generate-plan
    plan_parser = subparsers.add_parser('generate-plan', help='Generate weekly plan')
    
    args = parser.parse_args()
    
    if args.command == 'list':
        cmd_list(args)
    elif args.command == 'add':
        cmd_add(args)
    elif args.command == 'next':
        cmd_next(args)
    elif args.command == 'complete':
        cmd_complete(args)
    elif args.command == 'stats':
        cmd_stats(args)
    elif args.command == 'generate-plan':
        cmd_generate_plan(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
