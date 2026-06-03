import json
from django.contrib import admin
from django import forms
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import (
    UserProfile, Problem, SavedProblem,
    TrainingPlan, TrainingProgress, CustomProblem, AlgorithmTemplate, AlgorithmTag
)


# 常用算法标签列表（来自Codeforces）
POPULAR_TAGS = [
    'implementation', 'math', 'greedy', 'dp', 'data structures',
    'brute force', 'constructive algorithms', 'sortings', 'dfs and similar',
    'graphs', 'binary search', 'trees', 'strings', 'two pointers',
    'bitmasks', 'combinatorics', 'shortest paths', 'probabilities',
    'games', 'number theory', 'geometry', 'interactive', 'flows',
    'dsu', 'divide and conquer', 'fft',
]


class TagsWidget(forms.Widget):
    """自定义标签选择控件"""
    def __init__(self, attrs=None):
        super().__init__(attrs)
    
    def render(self, name, value, attrs=None, renderer=None):
        # 将列表转换为逗号分隔的字符串
        if isinstance(value, list):
            current_tags = value
        elif value:
            current_tags = [tag.strip() for tag in str(value).split(',') if tag.strip()]
        else:
            current_tags = []
        
        # 生成标签按钮HTML
        tag_buttons = []
        for tag in POPULAR_TAGS:
            is_active = tag in current_tags
            btn_style = (
                f'background: {"#10b981" if is_active else "#f3f4f6"}; '
                f'color: {"white" if is_active else "#374151"}; '
                'border: 1px solid ' + ('#059669' if is_active else '#d1d5db') + '; '
                'border-radius: 20px; padding: 6px 14px; font-size: 13px; '
                'cursor: pointer; transition: all 0.2s ease; font-weight: 500; '
                'box-shadow: ' + ('0 1px 2px 0 rgba(0, 0, 0, 0.05)' if is_active else 'none') + ';'
            )
            btn_hover_style = (
                f'background: {"#059669" if is_active else "#e5e7eb"}; '
                f'transform: translateY(-1px); '
                'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'
            )
            tag_buttons.append(
                f'<button type="button" class="tag-btn-{name}" data-tag="{tag}" '
                f'style="{btn_style}" '
                f'onmouseover="this.style.cssText += \'{btn_hover_style}\'" '
                f'onmouseout="this.style.cssText = \'{btn_style}\'">{tag}</button>'
            )
        
        html = '''
        <div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                    <strong style="font-size: 14px; color: #374151; font-weight: 600;">标签管理</strong>
                </div>
                <input type="text" name="{name}" value="{value}" 
                       style="width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; transition: all 0.2s; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);"
                       placeholder="输入标签，多个标签用逗号分隔" 
                       class="tags-input" 
                       data-current-tags="{current_tags_json}"
                       onfocus="this.style.borderColor=\'#3b82f6\'; this.style.boxShadow=\'0 0 0 3px rgba(59, 130, 246, 0.1)\';"
                       onblur="this.style.borderColor=\'#d1d5db\'; this.style.boxShadow=\'0 1px 2px 0 rgba(0, 0, 0, 0.05)\';">
                <p style="color: #6b7280; font-size: 12px; margin-top: 8px; display: flex; align-items: center; gap: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    提示：点击下方按钮快速添加标签，也可手动输入
                </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <span style="font-size: 13px; color: #4b5563; font-weight: 500;">常用算法标签</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; row-gap: 8px;">
                    {tag_buttons}
                </div>
            </div>
        </div>
        
        <script>
            document.addEventListener('DOMContentLoaded', function() {{
                var input = document.querySelector('.tags-input[name=\"{name}\"]');
                if (!input) return;
                
                // 获取当前已有的标签
                var currentTags = [];
                try {{
                    var currentTagsJson = input.getAttribute('data-current-tags');
                    if (currentTagsJson) {{
                        currentTags = JSON.parse(currentTagsJson);
                    }}
                }} catch(e) {{}}
                
                // 更新按钮状态
                function updateButtonState() {{
                    var tags = input.value.split(',').map(t => t.trim()).filter(t => t);
                    document.querySelectorAll('.tag-btn-{name}').forEach(function(btn) {{
                        var tag = btn.getAttribute('data-tag');
                        if (tags.includes(tag)) {{
                            btn.style.backgroundColor = '#10b981';
                            btn.style.color = 'white';
                            btn.style.borderColor = '#059669';
                            btn.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                        }} else {{
                            btn.style.backgroundColor = '#f3f4f6';
                            btn.style.color = '#374151';
                            btn.style.borderColor = '#d1d5db';
                            btn.style.boxShadow = 'none';
                        }}
                    }});
                }}
                
                // 初始化按钮状态
                updateButtonState();
                
                // 标签按钮点击事件
                document.querySelectorAll('.tag-btn-{name}').forEach(function(btn) {{
                    btn.addEventListener('click', function() {{
                        var tag = this.getAttribute('data-tag');
                        var currentValue = input.value;
                        var tags = currentValue ? currentValue.split(',').map(t => t.trim()).filter(t => t) : [];
                        
                        if (!tags.includes(tag)) {{
                            tags.push(tag);
                        }} else {{
                            tags = tags.filter(t => t !== tag);
                        }}
                        
                        input.value = tags.join(', ');
                        updateButtonState();
                    }});
                }});
                
                // 输入时也更新按钮状态
                input.addEventListener('input', function() {{
                    updateButtonState();
                }});
            }});
        </script>
        '''.format(
            name=name,
            value=format_html('{}', ', '.join(current_tags)),
            current_tags_json=format_html('{}', '[]' if not current_tags else json.dumps(current_tags)),
            tag_buttons=''.join(tag_buttons)
        )
        
        return mark_safe(html)


class ProblemForm(forms.ModelForm):
    """题目表单"""
    tags = forms.CharField(
        widget=TagsWidget,
        required=False,
        help_text='多个标签用逗号分隔'
    )
    
    class Meta:
        model = Problem
        fields = '__all__'
    
    def clean_tags(self):
        """将逗号分隔的字符串转换为列表"""
        tags_str = self.cleaned_data['tags']
        if tags_str:
            return [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        return []


class TrainingPlanForm(forms.ModelForm):
    """训练计划表单"""
    tags = forms.CharField(
        widget=TagsWidget,
        required=False,
        help_text='多个标签用逗号分隔'
    )
    
    class Meta:
        model = TrainingPlan
        fields = '__all__'
    
    def clean_tags(self):
        """将逗号分隔的字符串转换为列表"""
        tags_str = self.cleaned_data['tags']
        if tags_str:
            return [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        return []


class SavedProblemForm(forms.ModelForm):
    """保存题目表单"""
    tags = forms.CharField(
        widget=TagsWidget,
        required=False,
        help_text='多个标签用逗号分隔'
    )
    
    class Meta:
        model = SavedProblem
        fields = '__all__'
    
    def clean_tags(self):
        """将逗号分隔的字符串转换为列表"""
        tags_str = self.cleaned_data['tags']
        if tags_str:
            return [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        return []


class CustomProblemForm(forms.ModelForm):
    """自定义题目表单"""
    tags = forms.CharField(
        widget=TagsWidget,
        required=False,
        help_text='多个标签用逗号分隔'
    )
    
    class Meta:
        model = CustomProblem
        fields = '__all__'
    
    def clean_tags(self):
        """将逗号分隔的字符串转换为列表"""
        tags_str = self.cleaned_data['tags']
        if tags_str:
            return [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        return []


class TrainingProgressInline(admin.TabularInline):
    """在训练计划编辑页面内联管理题目"""
    model = TrainingProgress
    extra = 5
    fields = ['problem', 'completed', 'added_at']
    readonly_fields = ['added_at']
    autocomplete_fields = ['problem']
    
    def get_queryset(self, request):
        """按完成状态排序显示题目"""
        qs = super().get_queryset(request)
        return qs.select_related('problem').order_by('completed', '-added_at')


class IsOfficialFilter(admin.SimpleListFilter):
    """自定义过滤器：官方计划/用户计划"""
    title = '计划类型'
    parameter_name = 'plan_type'

    def lookups(self, request, model_admin):
        return (
            ('official', '官方计划'),
            ('user', '用户计划'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'official':
            return queryset.filter(user__isnull=True)
        if self.value() == 'user':
            return queryset.filter(user__isnull=False)
        return queryset


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['handle', 'platform', 'rating', 'max_rating', 'last_updated']
    list_filter = ['platform']
    search_fields = ['handle']


@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    form = ProblemForm
    list_display = ['contest_id', 'index', 'name', 'rating', 'solved_count', 'platform', 'get_tags']
    list_filter = ['platform', 'rating']
    search_fields = ['name', 'index', 'tags']
    
    def get_tags(self, obj):
        """显示标签列表"""
        if obj.tags:
            tags = obj.tags[:5]
            return ', '.join(tags) + (f', +{len(obj.tags)-5}' if len(obj.tags) > 5 else '')
        return '-'
    get_tags.short_description = '标签'


@admin.register(SavedProblem)
class SavedProblemAdmin(admin.ModelAdmin):
    form = SavedProblemForm
    list_display = ['id', 'name', 'status', 'saved_at', 'platform']
    list_filter = ['status', 'platform']
    search_fields = ['name']


@admin.register(TrainingPlan)
class TrainingPlanAdmin(admin.ModelAdmin):
    form = TrainingPlanForm
    list_display = ['id', 'title', 'target_rating', 'is_official', 'get_progress', 'created_at', 'completed']
    list_filter = ['completed', 'target_rating', IsOfficialFilter]
    search_fields = ['title', 'id', 'tags']
    inlines = [TrainingProgressInline]
    save_on_top = True
    
    def is_official(self, obj):
        """判断是否是官方训练计划"""
        return obj.user is None
    is_official.boolean = True
    is_official.short_description = '官方计划'
    
    def get_progress(self, obj):
        """显示完成进度"""
        total = obj.progresses.count()
        if total == 0:
            return '-'
        completed = obj.progresses.filter(completed=True).count()
        percentage = int(completed / total * 100) if total > 0 else 0
        return format_html(
            '<b>{}/{} ({}%)</b>',
            completed, total, percentage
        )
    get_progress.short_description = '完成进度'
    
    def get_queryset(self, request):
        """优化查询，预加载关联数据"""
        return super().get_queryset(request).prefetch_related('progresses__problem')


@admin.register(TrainingProgress)
class TrainingProgressAdmin(admin.ModelAdmin):
    list_display = ['training_plan', 'problem_info', 'problem_tags', 'completed', 'added_at']
    list_filter = ['completed', 'training_plan']
    search_fields = ['training_plan__title', 'problem__name', 'problem__tags']
    date_hierarchy = 'added_at'
    actions = ['mark_completed', 'mark_not_completed']
    
    def problem_info(self, obj):
        """显示题目信息"""
        if obj.problem:
            return format_html(
                '<b>{}</b> {}<br><span style="color:#666; font-size:11px;">★{}</span>',
                f'{obj.problem.contest_id or ""}{obj.problem.index or ""}',
                obj.problem.name,
                obj.problem.rating if obj.problem.rating else 'N/A'
            )
        return '-'
    problem_info.short_description = '题目'
    
    def problem_tags(self, obj):
        """显示题目标签"""
        if obj.problem and obj.problem.tags:
            tags = obj.problem.tags[:4]
            tags_html = ' '.join([f'<span style="background:#e9ecef; padding:1px 5px; border-radius:10px; font-size:10px; margin:1px;">{t}</span>' for t in tags])
            return mark_safe(tags_html)
        return '-'
    problem_tags.short_description = '标签'
    
    def mark_completed(self, request, queryset):
        """批量标记为已完成"""
        updated = queryset.update(completed=True)
        self.message_user(request, f'成功标记 {updated} 道题目为已完成')
    mark_completed.short_description = '标记为已完成'
    
    def mark_not_completed(self, request, queryset):
        """批量标记为未完成"""
        updated = queryset.update(completed=False)
        self.message_user(request, f'成功标记 {updated} 道题目为未完成')
    mark_not_completed.short_description = '标记为未完成'


@admin.register(CustomProblem)
class CustomProblemAdmin(admin.ModelAdmin):
    form = CustomProblemForm
    list_display = ['title', 'difficulty', 'created_at', 'updated_at']
    list_filter = ['difficulty']
    search_fields = ['title']


# 算法标签列表
ALGORITHM_TAGS = [
    '排序', '分治', '快速', '原地', '搜索', '二分', '有序数组', '查找',
    '图论', '最短路', '优先队列', '贪心', '队列', '层序', '数据结构',
    '区间查询', '线段树', '区间更新', '连通性', '路径压缩', '并查集',
    '树', '链表', '栈', '哈希表', '动态规划', 'dp', '数学', '几何',
    '数论', '组合数学', '博弈', '字符串', '后缀数组', 'AC自动机', 'KMP'
]


class AlgorithmTemplateTagsWidget(TagsWidget):
    """算法模板标签选择控件"""
    def __init__(self, attrs=None):
        super().__init__(attrs)
        # 使用算法标签而不是 Codeforces 标签
        global POPULAR_TAGS
        self._original_tags = POPULAR_TAGS.copy()
        POPULAR_TAGS = ALGORITHM_TAGS
    
    def render(self, name, value, attrs=None, renderer=None):
        # 临时替换为算法标签
        global POPULAR_TAGS
        old_tags = POPULAR_TAGS.copy()
        POPULAR_TAGS = ALGORITHM_TAGS
        
        result = super().render(name, value, attrs, renderer)
        
        # 恢复原来的标签
        POPULAR_TAGS = old_tags
        return result


class AlgorithmTemplateForm(forms.ModelForm):
    """算法模板表单"""
    tags = forms.CharField(
        widget=AlgorithmTemplateTagsWidget,
        required=False,
        help_text='多个标签用逗号分隔'
    )
    
    class Meta:
        model = AlgorithmTemplate
        fields = '__all__'
        widgets = {
            'code': forms.Textarea(attrs={
                'rows': 20,
                'cols': 80,
                'style': 'font-family: Monaco, Consolas, monospace; font-size: 13px;'
            }),
            'detailed_description': forms.Textarea(attrs={
                'rows': 8,
                'cols': 80,
            }),
        }
    
    def clean_tags(self):
        """将逗号分隔的字符串转换为列表"""
        tags_str = self.cleaned_data['tags']
        if tags_str:
            return [tag.strip() for tag in tags_str.split(',') if tag.strip()]
        return []


@admin.register(AlgorithmTemplate)
class AlgorithmTemplateAdmin(admin.ModelAdmin):
    form = AlgorithmTemplateForm
    list_display = ['name', 'category', 'difficulty', 'get_tags', 'created_at', 'updated_at']
    list_filter = ['category', 'difficulty', 'is_public']
    search_fields = ['name', 'description', 'tags']
    save_on_top = True
    
    def get_tags(self, obj):
        """显示标签列表"""
        if obj.tags:
            tags = obj.tags[:5]
            return ', '.join(tags) + (f', +{len(obj.tags)-5}' if len(obj.tags) > 5 else '')
        return '-'
    get_tags.short_description = '标签'


@admin.register(AlgorithmTag)
class AlgorithmTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'color_preview', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']
    save_on_top = True
    fieldsets = [
        ('基本信息', {
            'fields': ['name', 'category', 'description']
        }),
        ('显示设置', {
            'fields': ['color', 'is_active']
        }),
        ('时间信息', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    def color_preview(self, obj):
        """显示颜色预览"""
        return format_html(
            '<div style="width: 24px; height: 24px; border-radius: 4px; background-color: {}; border: 1px solid #ccc;"></div>',
            obj.color
        )
    color_preview.short_description = '颜色'
