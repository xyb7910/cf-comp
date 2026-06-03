"""
Django Management Command: 上传训练题目数据到数据库
Usage: python manage.py upload_problems
"""
from django.core.management.base import BaseCommand
from api.models import Problem, TrainingPlan, TrainingProgress
import requests
import time


class Command(BaseCommand):
    help = '上传训练题目数据到数据库，并关联到训练计划'

    def fetch_codeforces_problems(self):
        """从 Codeforces API 获取题目数据"""
        self.stdout.write("📡 从 Codeforces API 获取题目数据...")
        
        try:
            response = requests.get('https://codeforces.com/api/problemset.problems', timeout=30)
            if response.status_code == 200:
                data = response.json()
                if data['status'] == 'OK':
                    return data['result']['problems']
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"获取失败: {e}"))
        
        return []

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  上传训练题目数据"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")

        # 获取 Codeforces 题目
        cf_problems = self.fetch_codeforces_problems()
        
        if not cf_problems:
            self.stdout.write(self.style.ERROR("无法获取 Codeforces 题目数据"))
            return
        
        self.stdout.write(self.style.SUCCESS(f"✅ 获取到 {len(cf_problems)} 道题目"))
        self.stdout.write("")

        # 获取所有训练计划
        training_plans = TrainingPlan.objects.all()
        self.stdout.write(f"📋 找到 {training_plans.count()} 个训练计划")
        self.stdout.write("")

        # 为每个训练计划筛选并上传题目
        for plan in training_plans:
            self.stdout.write(self.style.HTTP_INFO(f"📤 处理训练计划: {plan.title}"))
            self.stdout.write("-" * 40)
            
            # 筛选匹配的题目
            target_rating = plan.target_rating
            target_tags = plan.tags
            
            # 题目难度范围: target_rating ± 200
            min_rating = target_rating - 200
            max_rating = target_rating + 100
            
            matched_problems = []
            for prob in cf_problems:
                rating = prob.get('rating', 0)
                tags = prob.get('tags', [])
                contest_id = prob.get('contestId')
                index = prob.get('index', '')
                
                if not contest_id or not rating:
                    continue
                
                # 难度匹配
                if rating < min_rating or rating > max_rating:
                    continue
                
                # 标签匹配（至少有一个标签匹配）
                if target_tags:
                    has_matching_tag = any(tag in tags for tag in target_tags)
                    if not has_matching_tag:
                        continue
                
                matched_problems.append(prob)
            
            # 限制题目数量（每个计划最多 30 道题）
            matched_problems = matched_problems[:30]
            
            self.stdout.write(f"  找到 {len(matched_problems)} 道匹配题目")
            
            # 按标签分组统计
            tag_counts = {}
            for prob in matched_problems:
                for tag in prob.get('tags', []):
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
            
            # 显示标签分布
            if tag_counts:
                self.stdout.write("  标签分布:")
                for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1])[:5]:
                    self.stdout.write(f"    • {tag}: {count} 道")
            
            # 创建题目并关联到训练计划
            created_count = 0
            for prob in matched_problems:
                contest_id = prob.get('contestId')
                index = prob.get('index', '')
                name = prob.get('name', '')
                rating = prob.get('rating', 0)
                tags = prob.get('tags', [])
                
                # 创建唯一 ID
                problem_id = f"{contest_id}-{index}"
                
                # 创建或更新题目
                problem, created = Problem.objects.update_or_create(
                    contest_id=contest_id,
                    index=index,
                    platform='codeforces',
                    defaults={
                        'name': name,
                        'rating': rating,
                        'tags': tags,
                        'solved_count': prob.get('solvedCount', 0),
                    }
                )
                
                # 关联到训练计划
                TrainingProgress.objects.update_or_create(
                    training_plan=plan,
                    problem=problem,
                    defaults={'completed': False}
                )
                
                if created:
                    created_count += 1
            
            self.stdout.write(self.style.SUCCESS(f"  ✅ 创建 {created_count} 道新题目，关联 {len(matched_problems)} 道题目到计划"))
            self.stdout.write("")
            
            # 短暂延迟避免 API 限流
            time.sleep(0.1)

        # 最终统计
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  ✅ 题目上传完成！"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        
        total_problems = Problem.objects.count()
        total_progress = TrainingProgress.objects.count()
        
        self.stdout.write("")
        self.stdout.write(f"📊 数据库统计:")
        self.stdout.write(f"  • 题目总数: {total_problems}")
        self.stdout.write(f"  • 训练进度记录: {total_progress}")
        self.stdout.write("")
        
        # 按训练计划显示题目数量
        self.stdout.write("📋 各训练计划题目数量:")
        for plan in training_plans:
            count = plan.progresses.count()
            self.stdout.write(f"  • {plan.title}: {count} 道题目")