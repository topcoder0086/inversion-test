"""
Serializers for the Family Tree Application.
"""
from rest_framework import serializers
from .models import Person

# Base Serializer
class PersonSerializer(serializers.ModelSerializer):
    """
    Standard serializer for the Person model.

    Exposes fields using Inversion Specification naming convention.
    """
    Id = serializers.IntegerField(source="id", read_only=True)
    FatherId = serializers.PrimaryKeyRelatedField(
        source="father",
        queryset=Person.objects.all(),
        allow_null=True,
        required=False
    )
    MotherId = serializers.PrimaryKeyRelatedField(
        source="mother",
        queryset=Person.objects.all(),
        allow_null=True,
        required=False
    )
    Name = serializers.CharField(source="name")
    Surname = serializers.CharField(source="surname")
    BirthDate = serializers.DateField(source="birth_date", allow_null=True)
    IdentityNumber = serializers.CharField(source="identity_number")

    class Meta:
        model = Person
        fields = [
            "Id",
            "FatherId",
            "MotherId",
            "Name",
            "Surname",
            "BirthDate",
            "IdentityNumber",
        ]


# Recursive Tree Serializer
class PersonTreeSerializer(serializers.ModelSerializer):
    """
    Recursive serializer for representing a person's descendants.

    Features:
    - Maintains Inversion Spec field names
    - Recursively nests children
    - Avoids infinite recursion via controlled depth (optional)
    """
    Id = serializers.IntegerField(source="id", read_only=True)
    Name = serializers.CharField(source="name")
    Surname = serializers.CharField(source="surname")
    BirthDate = serializers.DateField(source="birth_date", allow_null=True)
    IdentityNumber = serializers.CharField(source="identity_number")

    children = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = [
            "Id",
            "Name",
            "Surname",
            "BirthDate",
            "IdentityNumber",
            "children",
        ]

    def get_children(self, obj):
        """
        Recursively fetch children of the current person.

        Returns:
            List[dict]: Serialized children tree
        """
        children_qs = obj.children_from_father.all() | obj.children_from_mother.all()

        children_qs = children_qs.distinct()

        serializer = PersonTreeSerializer(
            children_qs,
            many=True,
            context=self.context
        )
        return serializer.data
