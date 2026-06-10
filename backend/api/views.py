from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import models
import requests
import os
from dotenv import load_dotenv

from .models import (
    UserProfile, Problem, SavedProblem,
    TrainingPlan, TrainingProgress, CustomProblem,
    AlgorithmTemplate, AlgorithmTag
)
from .serializers import (
    UserRegisterSerializer, UserSerializer, UserProfileSerializer, 
    ProblemSerializer, SavedProblemSerializer,
    TrainingPlanSerializer, TrainingPlanListSerializer, TrainingProgressSerializer, CustomProblemSerializer,
    AlgorithmTemplateSerializer, AlgorithmTagSerializer
)

load_dotenv()


# ============ 用户认证 API ============

class UserRegisterView(APIView):
    """用户注册"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': '注册成功'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """用户登录"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': '请提供用户名和密码'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': '登录成功'
            })
        return Response({'error': '用户名或密码错误'}, status=status.HTTP_401_UNAUTHORIZED)


class UserLogoutView(APIView):
    """用户登出"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': '登出成功'})
        except Exception:
            return Response({'message': '登出成功'})


class UserInfoView(APIView):
    """获取和更新当前用户信息"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        # 同时返回用户的平台配置
        profiles = UserProfile.objects.filter(user=request.user)
        profile_serializer = UserProfileSerializer(profiles, many=True)
        return Response({
            'user': serializer.data,
            'profiles': profile_serializer.data
        })
    
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """修改用户密码"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        new_password2 = request.data.get('new_password2')
        
        if not old_password or not new_password or not new_password2:
            return Response({'error': '请提供所有必填字段'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(old_password):
            return Response({'error': '原密码错误'}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != new_password2:
            return Response({'error': '两次输入的新密码不一致'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        return Response({'message': '密码修改成功'})


# ============ Codeforces API 代理 ============

class CodeforcesProxyView(APIView):
    """Codeforces API 代理"""
    permission_classes = [permissions.AllowAny]
    BASE_URL = "https://codeforces.com/api"
    
    def get(self, request, endpoint):
        try:
            url = f"{self.BASE_URL}/{endpoint}"
            params = request.GET.dict()
            response = requests.get(url, params=params, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============ ViewSets ============

class UserProfileViewSet(viewsets.ModelViewSet):
    """用户平台配置"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_platform(self, request):
        platform = request.query_params.get('platform', 'codeforces')
        profiles = UserProfile.objects.filter(user=request.user, platform=platform)
        serializer = self.get_serializer(profiles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def default(self, request):
        """获取用户默认的平台账号（按平台分类）"""
        profiles = UserProfile.objects.filter(user=request.user)
        result = {}
        for profile in profiles:
            if profile.platform not in result:
                result[profile.platform] = {
                    'handle': profile.handle,
                    'rating': profile.rating,
                    'max_rating': profile.max_rating,
                    'id': profile.id
                }
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def primary(self, request):
        """获取用户主平台账号（优先返回有rating的）"""
        profiles = UserProfile.objects.filter(user=request.user)
        if not profiles:
            return Response({})
        
        primary_profile = profiles.first()
        for profile in profiles:
            if profile.rating and (not primary_profile.rating or profile.rating > primary_profile.rating):
                primary_profile = profile
        
        serializer = self.get_serializer(primary_profile)
        return Response(serializer.data)


class ProblemViewSet(viewsets.ModelViewSet):
    """题目"""
    queryset = Problem.objects.all()
    serializer_class = ProblemSerializer
    permission_classes = [permissions.AllowAny]  # 题目数据公开
    
    def get_queryset(self):
        queryset = Problem.objects.all()
        
        platform = self.request.query_params.get('platform')
        rating_min = self.request.query_params.get('rating_min')
        rating_max = self.request.query_params.get('rating_max')
        tags = self.request.query_params.getlist('tags')
        
        if platform:
            queryset = queryset.filter(platform=platform)
        if rating_min:
            queryset = queryset.filter(rating__gte=rating_min)
        if rating_max:
            queryset = queryset.filter(rating__lte=rating_max)
        if tags:
            for tag in tags:
                queryset = queryset.filter(tags__contains=[tag])
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """获取推荐题目"""
        rating = request.query_params.get('rating', 1500)
        try:
            rating = int(rating)
        except ValueError:
            rating = 1500
        
        problems = Problem.objects.filter(
            rating__range=(rating - 200, rating + 200)
        ).order_by('?')[:20]
        
        serializer = self.get_serializer(problems, many=True)
        return Response(serializer.data)


class SavedProblemViewSet(viewsets.ModelViewSet):
    """保存的题目"""
    queryset = SavedProblem.objects.all()
    serializer_class = SavedProblemSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        queryset = SavedProblem.objects.filter(user=self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, id=None):
        saved_problem = self.get_object()
        new_status = request.data.get('status')
        if new_status in ['todo', 'attempting', 'solved']:
            saved_problem.status = new_status
            saved_problem.save()
            return Response(SavedProblemSerializer(saved_problem).data)
        return Response({"error": "Invalid status"}, status=400)


class TrainingPlanViewSet(viewsets.ModelViewSet):
    """训练计划"""
    queryset = TrainingPlan.objects.all()
    serializer_class = TrainingPlanSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # 允许公开读取，需要认证才能写入
    lookup_field = 'id'
    
    def get_serializer_class(self):
        if self.action == 'list' or self.action == 'active' or self.action == 'templates':
            return TrainingPlanListSerializer
        return TrainingPlanSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            # 登录用户可以看到：模板（无用户的计划）、admin创建的计划、自己的计划
            return TrainingPlan.objects.filter(
                models.Q(user__isnull=True) | 
                models.Q(user__is_superuser=True) | 
                models.Q(user=user)
            )
        else:
            # 未登录用户可以看到：模板（无用户的计划）、admin创建的计划
            return TrainingPlan.objects.filter(
                models.Q(user__isnull=True) | 
                models.Q(user__is_superuser=True)
            )
    
    def create(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            request.data['user'] = request.user.username
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """获取未完成的训练计划"""
        if request.user.is_authenticated:
            plans = TrainingPlan.objects.filter(user=request.user, completed=False)
        else:
            plans = TrainingPlan.objects.filter(user__isnull=True, completed=False)
        serializer = self.get_serializer(plans, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def templates(self, request):
        """获取所有公开的训练计划模板"""
        plans = TrainingPlan.objects.filter(user__isnull=True)
        serializer = self.get_serializer(plans, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_problem(self, request, id=None):
        """向训练计划添加题目"""
        training_plan = self.get_object()
        problem_id = request.data.get('problem_id')
        
        if not problem_id:
            return Response({"error": "problem_id is required"}, status=400)
        
        if '-' in problem_id:
            parts = problem_id.rsplit('-', 1)
            contest_id = int(parts[0]) if parts[0].isdigit() else None
            index = parts[1]
            problem = get_object_or_404(Problem, contest_id=contest_id, index=index)
        else:
            problem = get_object_or_404(Problem, id=problem_id)
        
        progress, created = TrainingProgress.objects.get_or_create(
            training_plan=training_plan,
            problem=problem
        )
        
        serializer = TrainingProgressSerializer(progress)
        return Response(serializer.data, status=201 if created else 200)
    
    @action(detail=True, methods=['post'])
    def remove_problem(self, request, id=None):
        """从训练计划移除题目"""
        training_plan = self.get_object()
        problem_id = request.data.get('problem_id')
        
        if not problem_id:
            return Response({"error": "problem_id is required"}, status=400)
        
        if '-' in problem_id:
            parts = problem_id.rsplit('-', 1)
            contest_id = int(parts[0]) if parts[0].isdigit() else None
            index = parts[1]
            deleted, _ = TrainingProgress.objects.filter(
                training_plan=training_plan,
                problem__contest_id=contest_id,
                problem__index=index
            ).delete()
        else:
            deleted, _ = TrainingProgress.objects.filter(
                training_plan=training_plan,
                problem_id=problem_id
            ).delete()
        
        if deleted:
            return Response({"message": "Problem removed from training plan"})
        return Response({"error": "Problem not found in training plan"}, status=404)
    
    @action(detail=True, methods=['post'])
    def mark_complete(self, request, id=None):
        """标记训练计划为完成"""
        training_plan = self.get_object()
        training_plan.completed = True
        training_plan.save()
        return Response(self.get_serializer(training_plan).data)
    
    @action(detail=True, methods=['get'])
    def problems_by_tag(self, request, id=None):
        """获取训练计划的题目，按标签分类"""
        training_plan = self.get_object()
        
        # 获取所有进度记录
        progresses = TrainingProgress.objects.filter(training_plan=training_plan).select_related('problem')
        
        # 按标签分组
        problems_by_tag = {}
        all_problems = []
        
        for progress in progresses:
            problem = progress.problem
            problem_data = {
                'id': f"{problem.contest_id}-{problem.index}",
                'contest_id': problem.contest_id,
                'index': problem.index,
                'name': problem.name,
                'rating': problem.rating,
                'tags': problem.tags,
                'platform': problem.platform,
                'solved_count': problem.solved_count,
                'completed': progress.completed,
                'completed_at': progress.completed_at,
            }
            
            all_problems.append(problem_data)
            
            # 添加到"全部"分类
            if '全部' not in problems_by_tag:
                problems_by_tag['全部'] = []
            problems_by_tag['全部'].append(problem_data)
            
            # 添加到各个标签分类
            for tag in problem.tags:
                if tag not in problems_by_tag:
                    problems_by_tag[tag] = []
                problems_by_tag[tag].append(problem_data)
        
        # 添加训练计划的目标标签分类（优先显示）
        priority_tags = [tag.name for tag in training_plan.tags.all()]
        ordered_tags = ['全部'] + priority_tags + [t for t in problems_by_tag.keys() if t not in priority_tags and t != '全部']
        
        # 按优先级排序返回
        result = {
            'plan_id': training_plan.id,
            'plan_title': training_plan.title,
            'target_rating': training_plan.target_rating,
            'total_problems': len(all_problems),
            'completed_count': sum(1 for p in all_problems if p['completed']),
            'tags_order': ordered_tags,
            'problems_by_tag': {tag: problems_by_tag.get(tag, []) for tag in ordered_tags if tag in problems_by_tag},
        }
        
        return Response(result)


class TrainingProgressViewSet(viewsets.ModelViewSet):
    """训练进度"""
    queryset = TrainingProgress.objects.all()
    serializer_class = TrainingProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TrainingProgress.objects.filter(training_plan__user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """切换题目的完成状态"""
        progress = self.get_object()
        progress.completed = not progress.completed
        if progress.completed:
            from django.utils import timezone
            progress.completed_at = timezone.now()
        else:
            progress.completed_at = None
        progress.save()
        return Response(self.get_serializer(progress).data)


class CustomProblemViewSet(viewsets.ModelViewSet):
    """自定义题目"""
    queryset = CustomProblem.objects.all()
    serializer_class = CustomProblemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CustomProblem.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ============ 健康检查 ============

class AlgorithmTemplateViewSet(viewsets.ModelViewSet):
    """算法模板"""
    queryset = AlgorithmTemplate.objects.all()
    serializer_class = AlgorithmTemplateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'id'
    
    def get_queryset(self):
        # 管理员可以查看所有模板（包括非公开的）
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            queryset = AlgorithmTemplate.objects.all()
        else:
            # 普通用户只可以看到公开模板
            queryset = AlgorithmTemplate.objects.filter(is_public=True)
        
        category = self.request.query_params.get('category')
        difficulty = self.request.query_params.get('difficulty')
        tags = self.request.query_params.getlist('tags')
        
        if category:
            queryset = queryset.filter(category=category)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        if tags:
            for tag in tags:
                queryset = queryset.filter(tags__name=tag)
        
        return queryset
    
    def perform_create(self, serializer):
        """只有管理员可以创建模板"""
        if self.request.user.is_staff:
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('只有管理员可以创建算法模板')
    
    def perform_update(self, serializer):
        """只有管理员可以更新模板"""
        if self.request.user.is_staff:
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('只有管理员可以更新算法模板')
    
    def perform_destroy(self, instance):
        """只有管理员可以删除模板"""
        if self.request.user.is_staff:
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('只有管理员可以删除算法模板')
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """获取所有分类（包括非公开模板的分类）"""
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            categories = AlgorithmTemplate.objects.values_list('category', flat=True).distinct()
        else:
            categories = AlgorithmTemplate.objects.filter(is_public=True).values_list('category', flat=True).distinct()
        return Response(sorted(categories))


class AlgorithmTagViewSet(viewsets.ModelViewSet):
    """算法标签管理"""
    queryset = AlgorithmTag.objects.all()
    serializer_class = AlgorithmTagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """普通用户只看到活跃标签，管理员可以看到所有标签"""
        queryset = AlgorithmTag.objects.all()
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(is_active=True)
        
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset
    
    def perform_create(self, serializer):
        """只有管理员可以创建标签"""
        if self.request.user.is_staff:
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('只有管理员可以创建算法标签')
    
    def perform_update(self, serializer):
        """只有管理员可以更新标签"""
        if self.request.user.is_staff:
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('只有管理员可以更新算法标签')
    
    def perform_destroy(self, instance):
        """只有管理员可以删除标签"""
        if self.request.user.is_staff:
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('只有管理员可以删除算法标签')
    
    @action(detail=False, methods=['get'])
    def list_names(self, request):
        """获取所有标签名称列表（仅返回名称，用于前端下拉选择）"""
        tags = self.get_queryset().values_list('name', flat=True)
        return Response(sorted(tags))
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """获取所有标签分类"""
        categories = self.get_queryset().values_list('category', flat=True).distinct()
        return Response(sorted([c for c in categories if c]))


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    return Response({
        "status": "healthy",
        "message": "Codeforces Companion Backend API"
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def user_info(request):
    """获取用户信息（支持多个平台）"""
    platform = request.query_params.get('platform', 'codeforces')
    handle = request.query_params.get('handle', '')
    
    if not handle:
        return Response({"status": "FAILED", "error": "Handle is required"}, status=400)
    
    try:
        if platform == 'codeforces':
            headers = {
                'User-Agent': 'Codeforces Companion (https://cper.online)'
            }
            response = requests.get(
                f'https://codeforces.com/api/user.info?handles={handle}',
                headers=headers,
                timeout=10
            )
            data = response.json()
            return Response(data)
        
        elif platform == 'atcoder':
            import urllib.parse
            url = f'https://atcoder.jp/users/{urllib.parse.quote(handle)}/history/json'
            response = requests.get(url)
            if response.status_code == 200:
                history = response.json()
                if history:
                    latest_rating = history[-1].get('NewRating', 0)
                    max_rating = max(h.get('NewRating', 0) for h in history)
                    result = [{
                        'handle': handle,
                        'rating': latest_rating,
                        'maxRating': max_rating,
                        'rank': '',
                        'maxRank': '',
                        'registrationTimeSeconds': history[0].get('EndTime', 0),
                        'lastOnlineTimeSeconds': history[-1].get('EndTime', 0),
                        'contribution': 0,
                        'friendOfCount': 0,
                        'avatar': f'https://img.atcoder.jp/users/{urllib.parse.quote(handle)}/medium.jpg',
                        'titlePhoto': '',
                        'organization': ''
                    }]
                    return Response({"status": "OK", "result": result})
                else:
                    return Response({"status": "FAILED", "error": "No contest history found"})
            else:
                return Response({"status": "FAILED", "error": "User not found"}, status=404)
        
        elif platform == 'luogu':
            url = f'https://www.luogu.com.cn/api/user/search?keyword={handle}'
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data.get('users'):
                    user = data['users'][0]
                    result = [{
                        'handle': user.get('name', handle),
                        'rating': user.get('rating', 0),
                        'maxRating': user.get('maxRating', user.get('rating', 0)),
                        'rank': user.get('rank', ''),
                        'maxRank': '',
                        'registrationTimeSeconds': user.get('registerTime', 0),
                        'lastOnlineTimeSeconds': user.get('lastOnline', 0),
                        'contribution': user.get('contribution', 0),
                        'friendOfCount': 0,
                        'avatar': f'https://cdn.luogu.com.cn/upload/usericon/{user.get("uid", "")}.png',
                        'titlePhoto': '',
                        'organization': user.get('organization', '')
                    }]
                    return Response({"status": "OK", "result": result})
                else:
                    return Response({"status": "FAILED", "error": "User not found"}, status=404)
            else:
                return Response({"status": "FAILED", "error": "Request failed"}, status=500)
        
        elif platform == 'nowcoder':
            result = [{
                'handle': handle,
                'rating': 0,
                'maxRating': 0,
                'rank': '',
                'maxRank': '',
                'registrationTimeSeconds': 0,
                'lastOnlineTimeSeconds': 0,
                'contribution': 0,
                'friendOfCount': 0,
                'avatar': '',
                'titlePhoto': '',
                'organization': ''
            }]
            return Response({"status": "OK", "result": result})
        
        else:
            return Response({"status": "FAILED", "error": f"Unknown platform: {platform}"}, status=400)
    
    except requests.exceptions.RequestException as e:
        return Response({"status": "FAILED", "error": str(e)}, status=500)