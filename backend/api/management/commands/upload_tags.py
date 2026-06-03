"""
Django Management Command: 上传算法标签数据
Usage: python manage.py upload_tags
"""
from django.core.management.base import BaseCommand
from api.models import AlgorithmTag


class Command(BaseCommand):
    help = '上传算法标签数据到数据库'

    def handle(self, *args, **options):
        # 算法标签数据
        tags = [
            # 排序算法
            {"name": "排序", "category": "排序算法", "description": "排序相关算法", "color": "#3b82f6"},
            {"name": "快速排序", "category": "排序算法", "description": "快速排序算法", "color": "#3b82f6"},
            {"name": "归并排序", "category": "排序算法", "description": "归并排序算法", "color": "#3b82f6"},
            {"name": "堆排序", "category": "排序算法", "description": "堆排序算法", "color": "#3b82f6"},
            {"name": "插入排序", "category": "排序算法", "description": "插入排序算法", "color": "#3b82f6"},
            {"name": "冒泡排序", "category": "排序算法", "description": "冒泡排序算法", "color": "#3b82f6"},
            {"name": "选择排序", "category": "排序算法", "description": "选择排序算法", "color": "#3b82f6"},
            {"name": "分治", "category": "排序算法", "description": "分治策略", "color": "#3b82f6"},
            {"name": "原地", "category": "排序算法", "description": "原地算法", "color": "#3b82f6"},
            
            # 搜索算法
            {"name": "搜索", "category": "搜索算法", "description": "搜索相关算法", "color": "#10b981"},
            {"name": "二分", "category": "搜索算法", "description": "二分查找", "color": "#10b981"},
            {"name": "二分查找", "category": "搜索算法", "description": "二分查找算法", "color": "#10b981"},
            {"name": "有序数组", "category": "搜索算法", "description": "有序数组", "color": "#10b981"},
            {"name": "查找", "category": "搜索算法", "description": "查找操作", "color": "#10b981"},
            {"name": "三分", "category": "搜索算法", "description": "三分查找", "color": "#10b981"},
            {"name": "倍增", "category": "搜索算法", "description": "倍增算法", "color": "#10b981"},
            
            # 图算法
            {"name": "图论", "category": "图算法", "description": "图论相关算法", "color": "#8b5cf6"},
            {"name": "最短路", "category": "图算法", "description": "最短路径算法", "color": "#8b5cf6"},
            {"name": "Dijkstra", "category": "图算法", "description": "Dijkstra算法", "color": "#8b5cf6"},
            {"name": "Bellman-Ford", "category": "图算法", "description": "Bellman-Ford算法", "color": "#8b5cf6"},
            {"name": "Floyd", "category": "图算法", "description": "Floyd-Warshall算法", "color": "#8b5cf6"},
            {"name": "SPFA", "category": "图算法", "description": "SPFA算法", "color": "#8b5cf6"},
            {"name": "BFS", "category": "图算法", "description": "广度优先搜索", "color": "#8b5cf6"},
            {"name": "DFS", "category": "图算法", "description": "深度优先搜索", "color": "#8b5cf6"},
            {"name": "层序", "category": "图算法", "description": "层序遍历", "color": "#8b5cf6"},
            {"name": "拓扑排序", "category": "图算法", "description": "拓扑排序", "color": "#8b5cf6"},
            {"name": "强连通分量", "category": "图算法", "description": "强连通分量", "color": "#8b5cf6"},
            {"name": "割点", "category": "图算法", "description": "割点", "color": "#8b5cf6"},
            {"name": "桥", "category": "图算法", "description": "桥", "color": "#8b5cf6"},
            {"name": "欧拉路径", "category": "图算法", "description": "欧拉路径", "color": "#8b5cf6"},
            {"name": "哈密顿路径", "category": "图算法", "description": "哈密顿路径", "color": "#8b5cf6"},
            {"name": "二分图", "category": "图算法", "description": "二分图", "color": "#8b5cf6"},
            {"name": "最大匹配", "category": "图算法", "description": "最大匹配", "color": "#8b5cf6"},
            {"name": "网络流", "category": "图算法", "description": "网络流", "color": "#8b5cf6"},
            {"name": "最小生成树", "category": "图算法", "description": "最小生成树", "color": "#8b5cf6"},
            {"name": "Kruskal", "category": "图算法", "description": "Kruskal算法", "color": "#8b5cf6"},
            {"name": "Prim", "category": "图算法", "description": "Prim算法", "color": "#8b5cf6"},
            {"name": "LCA", "category": "图算法", "description": "最近公共祖先", "color": "#8b5cf6"},
            {"name": "树链剖分", "category": "图算法", "description": "树链剖分", "color": "#8b5cf6"},
            {"name": "差分约束", "category": "图算法", "description": "差分约束", "color": "#8b5cf6"},
            
            # 数据结构
            {"name": "数据结构", "category": "数据结构", "description": "数据结构", "color": "#f59e0b"},
            {"name": "线段树", "category": "数据结构", "description": "线段树", "color": "#f59e0b"},
            {"name": "区间查询", "category": "数据结构", "description": "区间查询", "color": "#f59e0b"},
            {"name": "区间更新", "category": "数据结构", "description": "区间更新", "color": "#f59e0b"},
            {"name": "树状数组", "category": "数据结构", "description": "树状数组/Fenwick Tree", "color": "#f59e0b"},
            {"name": "并查集", "category": "数据结构", "description": "并查集/Union-Find", "color": "#f59e0b"},
            {"name": "连通性", "category": "数据结构", "description": "连通性", "color": "#f59e0b"},
            {"name": "路径压缩", "category": "数据结构", "description": "路径压缩", "color": "#f59e0b"},
            {"name": "堆", "category": "数据结构", "description": "堆", "color": "#f59e0b"},
            {"name": "优先队列", "category": "数据结构", "description": "优先队列", "color": "#f59e0b"},
            {"name": "队列", "category": "数据结构", "description": "队列", "color": "#f59e0b"},
            {"name": "栈", "category": "数据结构", "description": "栈", "color": "#f59e0b"},
            {"name": "链表", "category": "数据结构", "description": "链表", "color": "#f59e0b"},
            {"name": "树", "category": "数据结构", "description": "树", "color": "#f59e0b"},
            {"name": "二叉搜索树", "category": "数据结构", "description": "二叉搜索树", "color": "#f59e0b"},
            {"name": "AVL树", "category": "数据结构", "description": "AVL树", "color": "#f59e0b"},
            {"name": "红黑树", "category": "数据结构", "description": "红黑树", "color": "#f59e0b"},
            {"name": "哈希表", "category": "数据结构", "description": "哈希表", "color": "#f59e0b"},
            {"name": "字典树", "category": "数据结构", "description": "字典树/Trie", "color": "#f59e0b"},
            {"name": "后缀数组", "category": "数据结构", "description": "后缀数组", "color": "#f59e0b"},
            {"name": "单调栈", "category": "数据结构", "description": "单调栈", "color": "#f59e0b"},
            {"name": "单调队列", "category": "数据结构", "description": "单调队列", "color": "#f59e0b"},
            {"name": "滑动窗口", "category": "数据结构", "description": "滑动窗口", "color": "#f59e0b"},
            {"name": "双端队列", "category": "数据结构", "description": "双端队列", "color": "#f59e0b"},
            {"name": "块状数组", "category": "数据结构", "description": "块状数组", "color": "#f59e0b"},
            {"name": "平衡树", "category": "数据结构", "description": "平衡树", "color": "#f59e0b"},
            {"name": "珂朵莉树", "category": "数据结构", "description": "珂朵莉树", "color": "#f59e0b"},
            
            # 动态规划
            {"name": "动态规划", "category": "动态规划", "description": "动态规划", "color": "#ef4444"},
            {"name": "dp", "category": "动态规划", "description": "动态规划", "color": "#ef4444"},
            {"name": "线性DP", "category": "动态规划", "description": "线性动态规划", "color": "#ef4444"},
            {"name": "区间DP", "category": "动态规划", "description": "区间动态规划", "color": "#ef4444"},
            {"name": "树形DP", "category": "动态规划", "description": "树形动态规划", "color": "#ef4444"},
            {"name": "状压DP", "category": "动态规划", "description": "状态压缩动态规划", "color": "#ef4444"},
            {"name": "数位DP", "category": "动态规划", "description": "数位动态规划", "color": "#ef4444"},
            {"name": "背包DP", "category": "动态规划", "description": "背包问题", "color": "#ef4444"},
            {"name": "最长上升子序列", "category": "动态规划", "description": "最长上升子序列", "color": "#ef4444"},
            {"name": "最长公共子序列", "category": "动态规划", "description": "最长公共子序列", "color": "#ef4444"},
            {"name": "递推", "category": "动态规划", "description": "递推", "color": "#ef4444"},
            {"name": "记忆化搜索", "category": "动态规划", "description": "记忆化搜索", "color": "#ef4444"},
            {"name": "斜率优化", "category": "动态规划", "description": "斜率优化", "color": "#ef4444"},
            {"name": "单调队列优化", "category": "动态规划", "description": "单调队列优化", "color": "#ef4444"},
            {"name": "四边形不等式", "category": "动态规划", "description": "四边形不等式优化", "color": "#ef4444"},
            
            # 数学
            {"name": "数学", "category": "数学", "description": "数学相关算法", "color": "#06b6d4"},
            {"name": "数论", "category": "数学", "description": "数论", "color": "#06b6d4"},
            {"name": "组合数学", "category": "数学", "description": "组合数学", "color": "#06b6d4"},
            {"name": "概率论", "category": "数学", "description": "概率论", "color": "#06b6d4"},
            {"name": "线性代数", "category": "数学", "description": "线性代数", "color": "#06b6d4"},
            {"name": "矩阵", "category": "数学", "description": "矩阵", "color": "#06b6d4"},
            {"name": "高斯消元", "category": "数学", "description": "高斯消元", "color": "#06b6d4"},
            {"name": "快速幂", "category": "数学", "description": "快速幂", "color": "#06b6d4"},
            {"name": "矩阵快速幂", "category": "数学", "description": "矩阵快速幂", "color": "#06b6d4"},
            {"name": "欧拉定理", "category": "数学", "description": "欧拉定理", "color": "#06b6d4"},
            {"name": "费马小定理", "category": "数学", "description": "费马小定理", "color": "#06b6d4"},
            {"name": "扩展欧几里得", "category": "数学", "description": "扩展欧几里得", "color": "#06b6d4"},
            {"name": "中国剩余定理", "category": "数学", "description": "中国剩余定理", "color": "#06b6d4"},
            {"name": "莫比乌斯反演", "category": "数学", "description": "莫比乌斯反演", "color": "#06b6d4"},
            {"name": "容斥原理", "category": "数学", "description": "容斥原理", "color": "#06b6d4"},
            {"name": "组合数", "category": "数学", "description": "组合数", "color": "#06b6d4"},
            {"name": "排列组合", "category": "数学", "description": "排列组合", "color": "#06b6d4"},
            {"name": "二项式定理", "category": "数学", "description": "二项式定理", "color": "#06b6d4"},
            {"name": "逆元", "category": "数学", "description": "逆元", "color": "#06b6d4"},
            {"name": "素数", "category": "数学", "description": "素数", "color": "#06b6d4"},
            {"name": "筛法", "category": "数学", "description": "筛法", "color": "#06b6d4"},
            {"name": "欧拉筛", "category": "数学", "description": "欧拉筛", "color": "#06b6d4"},
            {"name": "质因数分解", "category": "数学", "description": "质因数分解", "color": "#06b6d4"},
            {"name": "gcd", "category": "数学", "description": "最大公约数", "color": "#06b6d4"},
            {"name": "lcm", "category": "数学", "description": "最小公倍数", "color": "#06b6d4"},
            {"name": "斐波那契", "category": "数学", "description": "斐波那契数列", "color": "#06b6d4"},
            {"name": "卡特兰数", "category": "数学", "description": "卡特兰数", "color": "#06b6d4"},
            {"name": "斯特林数", "category": "数学", "description": "斯特林数", "color": "#06b6d4"},
            {"name": "FFT", "category": "数学", "description": "快速傅里叶变换", "color": "#06b6d4"},
            {"name": "NTT", "category": "数学", "description": "快速数论变换", "color": "#06b6d4"},
            {"name": "多项式", "category": "数学", "description": "多项式", "color": "#06b6d4"},
            
            # 字符串
            {"name": "字符串", "category": "字符串", "description": "字符串处理", "color": "#ec4899"},
            {"name": "KMP", "category": "字符串", "description": "KMP算法", "color": "#ec4899"},
            {"name": "Z函数", "category": "字符串", "description": "Z函数", "color": "#ec4899"},
            {"name": "哈希", "category": "字符串", "description": "字符串哈希", "color": "#ec4899"},
            {"name": "双哈希", "category": "字符串", "description": "双哈希", "color": "#ec4899"},
            {"name": "Manacher", "category": "字符串", "description": "Manacher算法", "color": "#ec4899"},
            {"name": "AC自动机", "category": "字符串", "description": "AC自动机", "color": "#ec4899"},
            {"name": "后缀自动机", "category": "字符串", "description": "后缀自动机", "color": "#ec4899"},
            {"name": "SAM", "category": "字符串", "description": "后缀自动机", "color": "#ec4899"},
            {"name": "最小表示法", "category": "字符串", "description": "最小表示法", "color": "#ec4899"},
            {"name": "回文", "category": "字符串", "description": "回文", "color": "#ec4899"},
            {"name": "字典序", "category": "字符串", "description": "字典序", "color": "#ec4899"},
            
            # 贪心
            {"name": "贪心", "category": "贪心", "description": "贪心算法", "color": "#84cc16"},
            {"name": "区间贪心", "category": "贪心", "description": "区间贪心", "color": "#84cc16"},
            {"name": "排序贪心", "category": "贪心", "description": "排序贪心", "color": "#84cc16"},
            {"name": "优先队列贪心", "category": "贪心", "description": "优先队列贪心", "color": "#84cc16"},
            
            # 博弈
            {"name": "博弈", "category": "博弈", "description": "博弈论", "color": "#f97316"},
            {"name": "Nim游戏", "category": "博弈", "description": "Nim游戏", "color": "#f97316"},
            {"name": "SG函数", "category": "博弈", "description": "SG函数", "color": "#f97316"},
            {"name": "巴什博弈", "category": "博弈", "description": "巴什博弈", "color": "#f97316"},
            {"name": "威佐夫博弈", "category": "博弈", "description": "威佐夫博弈", "color": "#f97316"},
            
            # 几何
            {"name": "几何", "category": "几何", "description": "计算几何", "color": "#a855f7"},
            {"name": "点积", "category": "几何", "description": "点积", "color": "#a855f7"},
            {"name": "叉积", "category": "几何", "description": "叉积", "color": "#a855f7"},
            {"name": "凸包", "category": "几何", "description": "凸包", "color": "#a855f7"},
            {"name": "旋转卡壳", "category": "几何", "description": "旋转卡壳", "color": "#a855f7"},
            {"name": "半平面交", "category": "几何", "description": "半平面交", "color": "#a855f7"},
            {"name": "圆", "category": "几何", "description": "圆相关", "color": "#a855f7"},
            {"name": "最近点对", "category": "几何", "description": "最近点对", "color": "#a855f7"},
            {"name": "面积", "category": "几何", "description": "面积计算", "color": "#a855f7"},
            {"name": "距离", "category": "几何", "description": "距离计算", "color": "#a855f7"},
            
            # 其他
            {"name": "暴力", "category": "其他", "description": "暴力算法", "color": "#6b7280"},
            {"name": "模拟", "category": "其他", "description": "模拟", "color": "#6b7280"},
            {"name": "构造", "category": "其他", "description": "构造题", "color": "#6b7280"},
            {"name": "交互", "category": "其他", "description": "交互题", "color": "#6b7280"},
            {"name": "分块", "category": "其他", "description": "分块", "color": "#6b7280"},
            {"name": "离线", "category": "其他", "description": "离线处理", "color": "#6b7280"},
            {"name": "在线", "category": "其他", "description": "在线处理", "color": "#6b7280"},
            {"name": "随机化", "category": "其他", "description": "随机化算法", "color": "#6b7280"},
            {"name": "启发式", "category": "其他", "description": "启发式算法", "color": "#6b7280"},
            {"name": "倍增", "category": "其他", "description": "倍增", "color": "#6b7280"},
            {"name": "双指针", "category": "其他", "description": "双指针", "color": "#6b7280"},
            {"name": "two pointers", "category": "其他", "description": "双指针", "color": "#6b7280"},
            {"name": "三分", "category": "其他", "description": "三分查找", "color": "#6b7280"},
            {"name": "剪枝", "category": "其他", "description": "剪枝", "color": "#6b7280"},
            {"name": "位运算", "category": "其他", "description": "位运算", "color": "#6b7280"},
            {"name": "二进制", "category": "其他", "description": "二进制", "color": "#6b7280"},
            {"name": "状压", "category": "其他", "description": "状态压缩", "color": "#6b7280"},
            {"name": "动态树", "category": "其他", "description": "动态树", "color": "#6b7280"},
            {"name": "Link-Cut Tree", "category": "其他", "description": "Link-Cut Tree", "color": "#6b7280"},
            {"name": "可持久化", "category": "其他", "description": "可持久化", "color": "#6b7280"},
            {"name": "CDQ分治", "category": "其他", "description": "CDQ分治", "color": "#6b7280"},
            {"name": "整体二分", "category": "其他", "description": "整体二分", "color": "#6b7280"},
            {"name": "离线分治", "category": "其他", "description": "离线分治", "color": "#6b7280"},
        ]

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  上传算法标签数据"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")

        # 上传算法标签
        self.stdout.write(self.style.HTTP_INFO("📤 上传算法标签..."))
        self.stdout.write("-" * 40)
        created_count = 0
        updated_count = 0
        for tag_data in tags:
            tag, created = AlgorithmTag.objects.update_or_create(
                name=tag_data["name"],
                defaults=tag_data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"✅ 创建: {tag.name}"))
            else:
                updated_count += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  ✅ 数据上传完成！"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        # 列出所有算法标签分类
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("📋 当前数据库中的算法标签分类:"))
        self.stdout.write("-" * 40)
        categories = AlgorithmTag.objects.values_list('category', flat=True).distinct()
        for category in sorted(categories):
            count = AlgorithmTag.objects.filter(category=category).count()
            self.stdout.write(f"  • {category}: {count} 个标签")
        self.stdout.write(f"\n总计: {AlgorithmTag.objects.count()} 个算法标签")