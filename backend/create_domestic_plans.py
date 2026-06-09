import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import TrainingPlan, AlgorithmTag

plans = [
    {
        'id': 'csp-j',
        'title': 'CSP-J 入门级训练题单',
        'subtitle': '面向初中级选手的入门竞赛训练',
        'target_rating': 1400,
        'target_count': 30,
        'description': 'CSP-J（普及组）是面向初中生的入门级信息学竞赛，重点训练基础算法与程序设计能力。',
        'tags': ['implementation', 'brute force', 'sorting', 'binary search', 'greedy', 'math'],
        'badge_color': 'bg-blue-50 text-blue-700 border-blue-200',
        'gradient': 'from-blue-400 to-blue-600',
    },
    {
        'id': 'csp-s',
        'title': 'CSP-S 提高级训练题单',
        'subtitle': '面向高中级选手的提高竞赛训练',
        'target_rating': 1800,
        'target_count': 25,
        'description': 'CSP-S（提高组）是面向高中生的提高级竞赛，重点训练树图算法、动态规划等核心能力。',
        'tags': ['dp', 'dfs and similar', 'graphs', 'data structures', 'trees'],
        'badge_color': 'bg-green-50 text-green-700 border-green-200',
        'gradient': 'from-green-400 to-emerald-600',
    },
    {
        'id': 'noip',
        'title': 'NOIP 全国联赛训练题单',
        'subtitle': 'NOIP 全国青少年信息学奥林匹克联赛冲刺训练',
        'target_rating': 2100,
        'target_count': 20,
        'description': 'NOIP 是全国性信息学奥赛，需要全面的算法知识与解题技巧，适合省赛及更高水平选手。',
        'tags': ['dp', 'graphs', 'trees', 'data structures', 'combinatorics', 'flows'],
        'badge_color': 'bg-amber-50 text-amber-700 border-amber-200',
        'gradient': 'from-amber-400 to-orange-600',
    },
    {
        'id': 'domestic-training',
        'title': '国内赛事综合训练题单',
        'subtitle': '全面覆盖国内信息学竞赛常考题型',
        'target_rating': 1600,
        'target_count': 40,
        'description': '针对 CSP、NOIP 等国内赛事的综合训练计划，涵盖各类高频考点与经典题型。',
        'tags': ['implementation', 'dp', 'greedy', 'math', 'graphs', 'data structures'],
        'badge_color': 'bg-purple-50 text-purple-700 border-purple-200',
        'gradient': 'from-purple-400 to-indigo-600',
    },
]

for plan_data in plans:
    tags_data = plan_data.pop('tags')
    plan, created = TrainingPlan.objects.get_or_create(id=plan_data['id'], defaults=plan_data)
    for tag_name in tags_data:
        tag, _ = AlgorithmTag.objects.get_or_create(name=tag_name)
        plan.tags.add(tag)
    print(f'Created/Updated: {plan.id} - {plan.title}')

print('Done!')