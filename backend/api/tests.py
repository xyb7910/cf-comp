from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import UserProfile, Problem, SavedProblem, TrainingPlan, CustomProblem


class HealthCheckTest(TestCase):
    def test_health_check(self):
        response = self.client.get(reverse('health-check'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'healthy')


class UserProfileTests(APITestCase):
    def setUp(self):
        self.user_data = {
            'handle': 'tourist',
            'platform': 'codeforces',
            'rating': 3979,
            'max_rating': 3979
        }
    
    def test_create_user_profile(self):
        response = self.client.post('/api/users/', self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(UserProfile.objects.count(), 1)


class ProblemTests(APITestCase):
    def setUp(self):
        self.problem_data = {
            'contest_id': 1923,
            'index': 'A',
            'name': 'Hello World',
            'rating': 800,
            'tags': ['implementation'],
            'platform': 'codeforces'
        }
    
    def test_create_problem(self):
        response = self.client.post('/api/problems/', self.problem_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class SavedProblemTests(APITestCase):
    def setUp(self):
        self.saved_data = {
            'id': '1923-A',
            'contest_id': 1923,
            'index': 'A',
            'name': 'Hello World',
            'rating': 800,
            'tags': ['implementation'],
            'status': 'todo'
        }
    
    def test_saved_problem_crud(self):
        response = self.client.post('/api/saved-problems/', self.saved_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        saved_problem = SavedProblem.objects.get(id='1923-A')
        self.assertEqual(saved_problem.status, 'todo')
