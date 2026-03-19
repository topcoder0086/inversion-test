"""
Test cases for the Family Tree Application.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework import status

from .models import Person


class FamilyTreeTests(TestCase):
    """
    Test suite for validating family tree APIs and relationships.
    """

    def setUp(self):
        """
        Create a simple 3-level family hierarchy:

            Root (1)
              |
            Child (2)
              |
         Grandchild (3)
        """

        self.root = Person.objects.create(
            name="Root",
            surname="Ancestor",
            identity_number="1"
        )

        self.child = Person.objects.create(
            name="Child",
            surname="One",
            identity_number="2",
            father=self.root
        )

        self.grandchild = Person.objects.create(
            name="Grandchild",
            surname="One",
            identity_number="3",
            father=self.child
        )

    def test_root_ascendant(self):
        """
        GIVEN a grandchild
        WHEN requesting root ascendant
        THEN the root ancestor should be returned
        """

        url = reverse("root-ascendant", kwargs={"IdentityNumber": "3"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["IdentityNumber"], "1")

    def test_descendants_tree(self):
        """
        GIVEN a root person
        WHEN requesting descendants tree
        THEN full hierarchical structure should be returned
        """

        url = reverse("family-tree", kwargs={"IdentityNumber": "1"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data

        # Level 1 (child)
        self.assertEqual(len(data["children"]), 1)
        self.assertEqual(
            data["children"][0]["IdentityNumber"],
            "2"
        )

        # Level 2 (grandchild)
        self.assertEqual(
            len(data["children"][0]["children"]),
            1
        )
        self.assertEqual(
            data["children"][0]["children"][0]["IdentityNumber"],
            "3"
        )

    def test_person_creation(self):
        """
        Ensure Person object is created correctly.
        """

        person = Person.objects.get(identity_number="1")

        self.assertEqual(person.name, "Root")
        self.assertEqual(person.surname, "Ancestor")

    def test_leaf_node_has_no_children(self):
        """
        Leaf nodes should return empty children list.
        """

        url = reverse("family-tree", kwargs={"IdentityNumber": "3"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["children"], [])

    def test_invalid_identity_number(self):
        """
        Invalid identity number should return 404.
        """

        url = reverse("family-tree", kwargs={"IdentityNumber": "999"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
