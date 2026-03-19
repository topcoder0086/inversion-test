"""
URL Routing for the Family Tree Application.
"""
from django.urls import path
from .views import FamilyTreeListView, RootAscendantView

urlpatterns = [
    path('tree/<str:IdentityNumber>/', FamilyTreeListView.as_view(), name='family-tree'),
    path('root-ascendant/<str:IdentityNumber>/', RootAscendantView.as_view(), name='root-ascendant'),
]
