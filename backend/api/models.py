from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """用户配置模型，存储用户在不同平台的信息"""
    PLATFORM_CHOICES = [
        ('codeforces', 'Codeforces'),
        ('atcoder', 'AtCoder'),
        ('luogu', '洛谷'),
        ('nowcoder', '牛客'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='platform_profiles', null=True, blank=True)
    handle = models.CharField(max_length=100)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='codeforces')
    rating = models.IntegerField(null=True, blank=True)
    max_rating = models.IntegerField(null=True, blank=True)
    avatar = models.URLField(blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'handle', 'platform']
        ordering = ['-rating']
    
    def __str__(self):
        return f"{self.handle} ({self.platform})"


class Problem(models.Model):
    """题目模型，存储题目信息"""
    PLATFORM_CHOICES = [
        ('codeforces', 'Codeforces'),
        ('atcoder', 'AtCoder'),
        ('luogu', '洛谷'),
        ('nowcoder', '牛客'),
        ('other', '其他'),
    ]
    
    contest_id = models.IntegerField(null=True, blank=True)
    index = models.CharField(max_length=10)  # e.g. "A", "B", "C1"
    name = models.CharField(max_length=500)
    rating = models.IntegerField(null=True, blank=True)
    tags = models.JSONField(default=list)  # 存储标签数组
    problemset_name = models.CharField(max_length=200, blank=True)
    problem_type = models.CharField(max_length=50, default='PROGRAMMING')
    points = models.FloatField(null=True, blank=True)
    solved_count = models.IntegerField(default=0)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='codeforces')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['contest_id', 'index', 'platform']
        ordering = ['-contest_id', 'index']
    
    def __str__(self):
        return f"{self.contest_id or ''}-{self.index}: {self.name}"


class SavedProblem(models.Model):
    """保存的题目模型"""
    STATUS_CHOICES = [
        ('todo', '待做'),
        ('attempting', '尝试中'),
        ('solved', '已解决'),
    ]
    
    PLATFORM_CHOICES = [
        ('codeforces', 'Codeforces'),
        ('atcoder', 'AtCoder'),
        ('luogu', '洛谷'),
        ('nowcoder', '牛客'),
        ('other', '其他'),
    ]
    
    id = models.CharField(max_length=100, primary_key=True)  # e.g. "1923-C"
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_problems', null=True, blank=True)
    contest_id = models.IntegerField(null=True, blank=True)
    index = models.CharField(max_length=10)
    name = models.CharField(max_length=500)
    rating = models.IntegerField(null=True, blank=True)
    tags = models.JSONField(default=list)
    saved_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    notes = models.TextField(blank=True)
    difficulty = models.CharField(max_length=50, blank=True)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='codeforces')
    
    class Meta:
        ordering = ['-saved_at']
        unique_together = ['user', 'id']
    
    def __str__(self):
        return f"{self.name} ({self.status})"


class TrainingPlan(models.Model):
    """训练计划模型"""
    id = models.CharField(max_length=100, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='training_plans', null=True, blank=True)
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=200, blank=True)
    target_rating = models.IntegerField()
    target_count = models.IntegerField(default=0)
    tags = models.ManyToManyField('AlgorithmTag', related_name='training_plans', blank=True)
    badge_color = models.CharField(max_length=100, blank=True)
    gradient = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    deadline = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'id']
    
    def __str__(self):
        return self.title


class TrainingProgress(models.Model):
    """训练进度模型，关联训练计划和题目"""
    training_plan = models.ForeignKey(TrainingPlan, on_delete=models.CASCADE, related_name='progresses')
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    added_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ['training_plan', 'problem']
        ordering = ['-added_at']
    
    def __str__(self):
        return f"{self.training_plan.title} - {self.problem.name}"


class CustomProblem(models.Model):
    """自定义题目模型"""
    PLATFORM_CHOICES = [
        ('codeforces', 'Codeforces'),
        ('atcoder', 'AtCoder'),
        ('luogu', '洛谷'),
        ('nowcoder', '牛客'),
        ('other', '其他'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_problems', null=True, blank=True)
    title = models.CharField(max_length=500)
    content = models.TextField()  # 题目描述
    difficulty = models.CharField(max_length=50, blank=True)
    tags = models.JSONField(default=list)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='other')
    input_example = models.TextField(blank=True)
    output_example = models.TextField(blank=True)
    time_limit = models.IntegerField(default=1000)  # 毫秒
    memory_limit = models.IntegerField(default=256)  # MB
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class AlgorithmTag(models.Model):
    """算法标签模型，用于管理常见的算法标签"""
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=20, default='#3b82f6')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name}"


class AlgorithmTemplate(models.Model):
    """算法模板模型"""
    DIFFICULTY_CHOICES = [
        ('基础', '基础'),
        ('进阶', '进阶'),
        ('高级', '高级'),
    ]
    
    id = models.CharField(max_length=100, primary_key=True)
    category = models.CharField(max_length=100)
    name = models.CharField(max_length=200)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='基础')
    description = models.TextField()
    detailed_description = models.TextField(blank=True)
    time_complexity = models.CharField(max_length=200)
    space_complexity = models.CharField(max_length=200)
    code = models.TextField()
    tags = models.ManyToManyField(AlgorithmTag, related_name='templates', blank=True)
    usage = models.TextField(blank=True)
    example_input = models.TextField(blank=True)
    example_output = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.category})"