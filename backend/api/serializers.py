from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import (
    UserProfile, Problem, SavedProblem,
    TrainingPlan, TrainingProgress, CustomProblem,
    AlgorithmTemplate, AlgorithmTag
)


# 用户注册序列化器
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'email': {'required': False}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "两次密码不一致"})
        return attrs
    
    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


# 用户信息序列化器
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id', 'username')


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'


class ProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Problem
        fields = '__all__'


class SavedProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedProblem
        fields = '__all__'
        read_only_fields = ('user',)


class TrainingProgressSerializer(serializers.ModelSerializer):
    problem = ProblemSerializer(read_only=True)
    
    class Meta:
        model = TrainingProgress
        fields = '__all__'


# 精简版训练计划序列化器（用于列表）
class TrainingPlanListSerializer(serializers.ModelSerializer):
    completion_rate = serializers.SerializerMethodField()
    total_problems = serializers.SerializerMethodField()
    
    class Meta:
        model = TrainingPlan
        fields = ['id', 'title', 'target_rating', 'tags', 'description', 'completed', 
                 'created_at', 'completion_rate', 'total_problems']
    
    def get_completion_rate(self, obj):
        total = obj.progresses.count()
        if total == 0:
            return 0
        completed = obj.progresses.filter(completed=True).count()
        return round(completed / total * 100, 1)
    
    def get_total_problems(self, obj):
        return obj.progresses.count()


# 完整版训练计划序列化器（用于详情）
class TrainingPlanSerializer(serializers.ModelSerializer):
    progresses = TrainingProgressSerializer(many=True, read_only=True)
    completion_rate = serializers.SerializerMethodField()
    total_problems = serializers.SerializerMethodField()
    
    class Meta:
        model = TrainingPlan
        fields = '__all__'
        read_only_fields = ('user',)
    
    def get_completion_rate(self, obj):
        total = obj.progresses.count()
        if total == 0:
            return 0
        completed = obj.progresses.filter(completed=True).count()
        return round(completed / total * 100, 1)
    
    def get_total_problems(self, obj):
        return obj.progresses.count()


class CustomProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomProblem
        fields = '__all__'
        read_only_fields = ('user',)


class AlgorithmTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlgorithmTag
        fields = '__all__'


class AlgorithmTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlgorithmTemplate
        fields = '__all__'
