"""
Django Management Command: 上传初始训练计划数据
Usage: python manage.py upload_training_data
"""
from django.core.management.base import BaseCommand
from api.models import TrainingPlan


class Command(BaseCommand):
    help = '上传初始训练计划数据到数据库'

    def handle(self, *args, **options):
        # 国内竞赛训练计划
        domestic_plans = [
            {
                "id": "csp-j",
                "title": "CSP-J 入门级训练题单",
                "target_rating": 1400,
                "tags": ["implementation", "brute force", "sorting", "binary search", "greedy", "math"],
                "description": "CSP-J（普及组）是面向初中生的入门级信息学竞赛，重点训练基础算法与程序设计能力。目标难度 1400，重点训练基础算法。",
            },
            {
                "id": "csp-s",
                "title": "CSP-S 提高级训练题单",
                "target_rating": 1800,
                "tags": ["dp", "dfs and similar", "graphs", "data structures", "trees"],
                "description": "CSP-S（提高组）是面向高中生的提高级竞赛，重点训练树图算法、动态规划等核心能力。目标难度 1800，重点训练树图算法。",
            },
            {
                "id": "noip",
                "title": "NOIP 全国联赛训练题单",
                "target_rating": 2100,
                "tags": ["dp", "graphs", "trees", "data structures", "combinatorics", "flows"],
                "description": "NOIP 是全国性信息学奥赛，需要全面的算法知识与解题技巧，适合省赛及更高水平选手。目标难度 2100。",
            },
            {
                "id": "domestic-training",
                "title": "国内赛事综合训练题单",
                "target_rating": 1600,
                "tags": ["implementation", "dp", "greedy", "math", "graphs", "data structures"],
                "description": "针对 CSP、NOIP 等国内赛事的综合训练计划，涵盖各类高频考点与经典题型。目标难度 1600。",
            },
        ]

        # 从入门到大师的训练阶段
        syllabus_stages = [
            {
                "id": "stage-1",
                "title": "Stage 1: 筑基起步 (Beginner)",
                "target_rating": 1000,
                "tags": ["implementation", "brute force", "sorting"],
                "description": "语法基础与工程模拟专项突破。重点在快速且无疏漏地把头脑中的模拟思路翻译为高品质的代码。",
            },
            {
                "id": "stage-2",
                "title": "Stage 2: 渐入佳境 (Novice)",
                "target_rating": 1200,
                "tags": ["greedy", "binary search", "math", "constructive algorithms"],
                "description": "高频竞赛思维与策略构造。重点在于摆脱公式教条，培养对最优决策问题的贪心直觉。",
            },
            {
                "id": "stage-3",
                "title": "Stage 3: 登堂入室 (Specialist)",
                "target_rating": 1400,
                "tags": ["dp", "dfs and similar", "data structures", "graphs"],
                "description": "经典算法、深度状态空间与树图基础。攻克树与图的深度优先/广度优先基础遍历。",
            },
            {
                "id": "stage-4",
                "title": "Stage 4: 破壁跃迁 (Expert)",
                "target_rating": 1700,
                "tags": ["trees", "strings", "combinatorics", "shortest paths", "bitmasks"],
                "description": "高维树图结构、复杂优化与区间动态规划。掌握图论拓扑与连通分量。",
            },
            {
                "id": "stage-5",
                "title": "Stage 5: 登峰造极 (Master)",
                "target_rating": 2000,
                "tags": ["flows", "strings", "geometry", "probabilities", "games"],
                "description": "极限匹配流、分治莫队与后缀精妙结构。探索国家队与ICPC高频极限界。",
            },
        ]

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  上传初始训练计划数据"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")

        # 上传国内竞赛训练计划
        self.stdout.write(self.style.HTTP_INFO("📤 上传国内竞赛训练计划..."))
        self.stdout.write("-" * 40)
        for plan_data in domestic_plans:
            # 创建无用户的公开模板
            plan, created = TrainingPlan.objects.update_or_create(
                id=plan_data["id"],
                defaults={
                    **plan_data,
                    "user": None  # 设为公开模板
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ 创建: {plan.title}"))
            else:
                self.stdout.write(self.style.WARNING(f"🔄 更新: {plan.title}"))

        self.stdout.write("")

        # 上传训练阶段
        self.stdout.write(self.style.HTTP_INFO("📤 上传从入门到大师训练阶段..."))
        self.stdout.write("-" * 40)
        for plan_data in syllabus_stages:
            # 创建无用户的公开模板
            plan, created = TrainingPlan.objects.update_or_create(
                id=plan_data["id"],
                defaults={
                    **plan_data,
                    "user": None  # 设为公开模板
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ 创建: {plan.title}"))
            else:
                self.stdout.write(self.style.WARNING(f"🔄 更新: {plan.title}"))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  ✅ 数据上传完成！"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        # 列出所有训练计划
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("📋 当前数据库中的训练计划:"))
        self.stdout.write("-" * 40)
        plans = TrainingPlan.objects.all()
        for plan in plans:
            self.stdout.write(f"  • {plan.title} (Rating: {plan.target_rating})")
        self.stdout.write(f"\n总计: {plans.count()} 个训练计划")
