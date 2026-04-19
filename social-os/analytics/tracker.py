#!/usr/bin/env python3
"""
Lookitry Social OS - Analytics Tracker
======================================
Script para trackear posts en redes sociales y sus métricas.

Uso:
    python3 tracker.py log --platform instagram --caption "..." --image "url"
    python3 tracker.py update --post-id UUID --likes 100 --comments 10
    python3 tracker.py stats --platform instagram --days 7
"""

import json
import sys
import os
from datetime import datetime, timedelta
from typing import Optional
import argparse

# Configuración
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
BUCKET_PATH = '/home/travis/Lookitry/Lookitry/social-os'

# Colores para output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def log(msg, color='GREEN'):
    colors = {'GREEN': GREEN, 'RED': RED, 'YELLOW': YELLOW, 'BLUE': BLUE, 'RESET': RESET}
    print(f"{colors.get(color, '')}{msg}{RESET}")

def save_to_json(data, filename):
    """Guarda data a archivo JSON local"""
    filepath = os.path.join(BUCKET_PATH, 'analytics', filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, default=str)
    return filepath

def load_from_json(filename):
    """Carga data desde archivo JSON local"""
    filepath = os.path.join(BUCKET_PATH, 'analytics', filename)
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return []

# =====================================================
# COMANDOS
# =====================================================

def cmd_log(args):
    """Log a new social media post"""
    post = {
        'id': generate_id(),
        'platform': args.platform,
        'content_type': args.content_type or 'image',
        'caption_text': args.caption,
        'image_url': args.image,
        'posted_at': datetime.now().isoformat(),
        'buffer_post_id': args.buffer_id or '',
        'status': 'posted',
        'hook_type': detect_hook_type(args.caption),
        'hook_text': extract_hook(args.caption),
        'metrics': {
            'likes': 0,
            'comments': 0,
            'shares': 0,
            'views': 0,
            'saves': 0,
            'reach': 0
        },
        'engagement_rate': 0.0,
        'created_at': datetime.now().isoformat()
    }
    
    # Guardar localmente
    posts = load_from_json('posts.json')
    posts.append(post)
    save_to_json(posts, 'posts.json')
    
    log(f"✅ Post logged successfully!", 'GREEN')
    log(f"   Platform: {post['platform']}", 'BLUE')
    log(f"   Hook: {post['hook_type']}", 'BLUE')
    log(f"   ID: {post['id']}", 'BLUE')
    
    return post['id']

def cmd_update(args):
    """Update metrics for an existing post"""
    posts = load_from_json('posts.json')
    
    post = None
    for p in posts:
        if p['id'] == args.post_id:
            post = p
            break
    
    if not post:
        log(f"❌ Post not found: {args.post_id}", 'RED')
        return
    
    # Update metrics
    if args.likes is not None:
        post['metrics']['likes'] = args.likes
    if args.comments is not None:
        post['metrics']['comments'] = args.comments
    if args.shares is not None:
        post['metrics']['shares'] = args.shares
    if args.views is not None:
        post['metrics']['views'] = args.views
    if args.saves is not None:
        post['metrics']['saves'] = args.saves
    if args.reach is not None:
        post['metrics']['reach'] = args.reach
    
    # Recalculate engagement rate
    total = sum(post['metrics'].values())
    views = post['metrics']['views']
    if views > 0:
        post['engagement_rate'] = round((total / views) * 100, 2)
    
    save_to_json(posts, 'posts.json')
    
    log(f"✅ Post updated!", 'GREEN')
    log(f"   Metrics: {post['metrics']}", 'BLUE')
    log(f"   Engagement: {post['engagement_rate']}%", 'BLUE')

def cmd_stats(args):
    """Show statistics for posts"""
    posts = load_from_json('posts.json')
    
    # Filter by platform and days
    cutoff = datetime.now() - timedelta(days=args.days)
    filtered = []
    
    for p in posts:
        created = datetime.fromisoformat(p['created_at'])
        if created >= cutoff:
            if args.platform == 'all' or p['platform'] == args.platform:
                filtered.append(p)
    
    if not filtered:
        log(f"No posts found for {args.platform} in last {args.days} days", 'YELLOW')
        return
    
    # Calculate stats
    total_posts = len(filtered)
    total_likes = sum(p['metrics']['likes'] for p in filtered)
    total_comments = sum(p['metrics']['comments'] for p in filtered)
    total_shares = sum(p['metrics']['shares'] for p in filtered)
    total_views = sum(p['metrics']['views'] for p in filtered)
    avg_engagement = sum(p['engagement_rate'] for p in filtered) / total_posts if total_posts > 0 else 0
    
    log(f"\n📊 STATISTICS - Last {args.days} days", 'GREEN')
    log(f"{'='*50}", 'BLUE')
    log(f"Platform: {args.platform}", 'BLUE')
    log(f"Total Posts: {total_posts}", 'BLUE')
    log(f"Total Likes: {total_likes}", 'BLUE')
    log(f"Total Comments: {total_comments}", 'BLUE')
    log(f"Total Shares: {total_shares}", 'BLUE')
    log(f"Total Views: {total_views:,}", 'BLUE')
    log(f"Avg Engagement: {avg_engagement:.2f}%", 'BLUE')
    
    # By hook type
    log(f"\n📈 ENGAGEMENT BY HOOK TYPE:", 'YELLOW')
    hook_stats = {}
    for p in filtered:
        hook = p.get('hook_type', 'unknown')
        if hook not in hook_stats:
            hook_stats[hook] = {'count': 0, 'engagement': 0}
        hook_stats[hook]['count'] += 1
        hook_stats[hook]['engagement'] += p['engagement_rate']
    
    for hook, stats in sorted(hook_stats.items(), key=lambda x: x[1]['engagement'], reverse=True):
        avg = stats['engagement'] / stats['count'] if stats['count'] > 0 else 0
        log(f"  {hook}: {avg:.2f}% avg ({stats['count']} posts)", 'BLUE')

def cmd_list(args):
    """List recent posts"""
    posts = load_from_json('posts.json')
    
    # Sort by date desc
    posts.sort(key=lambda x: x['created_at'], reverse=True)
    
    log(f"\n📋 RECENT POSTS", 'GREEN')
    log(f"{'='*80}", 'BLUE')
    log(f"{'Platform':<12} {'Hook Type':<15} {'Likes':<8} {'Comments':<10} {'Views':<10} {'Eng%':<8}", 'YELLOW')
    log(f"{'-'*80}", 'BLUE')
    
    for p in posts[:args.limit]:
        m = p['metrics']
        total = m['likes'] + m['comments'] + m['shares']
        log(f"{p['platform']:<12} {p.get('hook_type', 'N/A'):<15} {m['likes']:<8} {m['comments']:<10} {m['views']:<10} {p['engagement_rate']:.1f}%")

def generate_id():
    """Generate a simple unique ID"""
    return f"post_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

def detect_hook_type(caption):
    """Detect the type of hook used in the caption"""
    if not caption:
        return 'none'
    
    caption_lower = caption.lower()
    
    if '¿sabías' in caption_lower or 'sabias' in caption_lower or 'did you know' in caption_lower:
        return 'question'
    elif any(word in caption_lower for word in ['%', 'por ciento', 'de cada']):
        return 'stat'
    elif 'cómo' in caption_lower or 'como' in caption_lower or 'how to' in caption_lower:
        return 'howto'
    elif 'esta es' in caption_lower or 'esta es la historia' in caption_lower:
        return 'story'
    elif 'antes vs' in caption_lower or 'antes y después' in caption_lower:
        return 'comparison'
    elif 'prueba' in caption_lower or 'reto' in caption_lower or 'challenge' in caption_lower:
        return 'challenge'
    else:
        return 'general'

def extract_hook(caption):
    """Extract the first hook sentence from caption"""
    if not caption:
        return ''
    
    # Split by common delimiters
    for delimiter in ['\n', '. ', '? ', '! ']:
        parts = caption.split(delimiter)
        if len(parts) > 0:
            hook = parts[0].strip()
            if len(hook) > 10 and len(hook) < 100:
                return hook
    
    return caption[:100] if len(caption) > 100 else caption

# =====================================================
# MAIN
# =====================================================

def main():
    parser = argparse.ArgumentParser(description='Lookitry Social OS - Analytics Tracker')
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # log command
    log_parser = subparsers.add_parser('log', help='Log a new post')
    log_parser.add_argument('--platform', required=True, choices=['twitter', 'facebook', 'instagram', 'linkedin'])
    log_parser.add_argument('--caption', required=True)
    log_parser.add_argument('--image', help='URL of the image')
    log_parser.add_argument('--content-type', choices=['image', 'carousel', 'video', 'text'])
    log_parser.add_argument('--buffer-id', help='Buffer post ID')
    
    # update command
    update_parser = subparsers.add_parser('update', help='Update post metrics')
    update_parser.add_argument('--post-id', required=True)
    update_parser.add_argument('--likes', type=int)
    update_parser.add_argument('--comments', type=int)
    update_parser.add_argument('--shares', type=int)
    update_parser.add_argument('--views', type=int)
    update_parser.add_argument('--saves', type=int)
    update_parser.add_argument('--reach', type=int)
    
    # stats command
    stats_parser = subparsers.add_parser('stats', help='Show statistics')
    stats_parser.add_argument('--platform', default='all')
    stats_parser.add_argument('--days', type=int, default=7)
    
    # list command
    list_parser = subparsers.add_parser('list', help='List recent posts')
    list_parser.add_argument('--limit', type=int, default=10)
    
    args = parser.parse_args()
    
    if args.command == 'log':
        cmd_log(args)
    elif args.command == 'update':
        cmd_update(args)
    elif args.command == 'stats':
        cmd_stats(args)
    elif args.command == 'list':
        cmd_list(args)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
