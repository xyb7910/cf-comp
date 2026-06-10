from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'users/profiles', views.UserProfileViewSet)
router.register(r'problems', views.ProblemViewSet)
router.register(r'saved-problems', views.SavedProblemViewSet)
router.register(r'training-plans', views.TrainingPlanViewSet)
router.register(r'training-progress', views.TrainingProgressViewSet)
router.register(r'custom-problems', views.CustomProblemViewSet)
router.register(r'algorithm-templates', views.AlgorithmTemplateViewSet)
router.register(r'algorithm-tags', views.AlgorithmTagViewSet)

urlpatterns = [
    # 用户认证
    path('auth/register/', views.UserRegisterView.as_view(), name='register'),
    path('auth/login/', views.UserLoginView.as_view(), name='login'),
    path('auth/logout/', views.UserLogoutView.as_view(), name='logout'),
    path('auth/user/', views.UserInfoView.as_view(), name='user-info'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # 其他 API
    path('', include(router.urls)),
    path('health/', views.health_check, name='health-check'),
    re_path(r'^user-info/?$', views.user_info, name='user-info'),
    path('codeforces/<path:endpoint>/', views.CodeforcesProxyView.as_view(), name='codeforces-proxy'),
]