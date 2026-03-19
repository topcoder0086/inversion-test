"""
Models for the Family Tree Application.
"""
from django.db import models


class Person(models.Model):
    """
    Represents an individual in a family tree.

    Each person may have:
    - A biological father and mother (self-referential FK)
    - A unique identity number for external lookup
    - Basic personal attributes

    Relationships:
        father -> Person (nullable)
        mother -> Person (nullable)
    """
    id = models.AutoField(
        primary_key=True,
        db_column="id"
    )
    father = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children_from_father",
        db_column="father_id",
        help_text="Reference to the biological father."
    )
    mother = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children_from_mother",
        db_column="mother_id",
        help_text="Reference to the biological mother."
    )
    name = models.CharField(
        max_length=100,
        db_column="name",
        db_index=True,
        help_text="Given (first) name."
    )
    surname = models.CharField(
        max_length=100,
        db_column="surname",
        db_index=True,
        help_text="Family name / surname."
    )
    birth_date = models.DateField(
        null=True,
        blank=True,
        db_column="birth_date",
        db_index=True,
        help_text="Date of birth."
    )
    identity_number = models.CharField(
        max_length=50,
        unique=True,
        db_column="identity_number",
        help_text="Globally unique identity number."
    )

    class Meta:
        """
        Model metadata configuration.
        """
        db_table = 'person'
        verbose_name = "Person"
        verbose_name_plural = "People"
        managed = True

        indexes = [
            models.Index(fields=["father"], name="idx_person_father"),
            models.Index(fields=["mother"], name="idx_person_mother"),
            models.Index(fields=["surname"], name="idx_person_surname"),
        ]

    def __str__(self) -> str:
        """
        Human-readable representation of the Person.
        """
        return f"{self.name} {self.surname} ({self.identity_number})"
