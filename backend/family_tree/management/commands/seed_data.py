"""
Database seeding utility for the Family Tree application.
"""
import random
from datetime import date, timedelta
from typing import List, Tuple

from django.core.management.base import BaseCommand
from family_tree.models import Person


# Constants
FIRST_NAMES_MALE = [
    'James', 'John', 'Robert', 'Michael', 'William',
    'David', 'Richard', 'Joseph', 'Thomas', 'Charles'
]

FIRST_NAMES_FEMALE = [
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth',
    'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'
]

LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
    'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'
]

GENERATION_GAP_YEARS = 25
# Increase depth so the tree has many levels to test scrolling.
# With 20 generations and up to ~2 children per couple, this will
# typically create on the order of 1–2 million Person records.
TOTAL_GENERATIONS = 20


# Utility Functions
def get_random_name(gender: str) -> str:
    """
    Return a random first name based on gender.

    Args:
        gender (str): 'male' or 'female'

    Returns:
        str: Randomly selected first name
    """
    return random.choice(
        FIRST_NAMES_MALE if gender == 'male' else FIRST_NAMES_FEMALE
    )


def create_person(
    *,
    name: str,
    surname: str,
    birth_date: date,
    identity_number: str,
    father=None,
    mother=None
) -> Person:
    """
    Create and persist a Person instance.

    Args:
        name (str): First name
        surname (str): Last name
        birth_date (date): Date of birth
        identity_number (str): Unique identifier
        father (Person, optional): Father reference
        mother (Person, optional): Mother reference

    Returns:
        Person: Saved Person instance
    """
    return Person.objects.create(
        name=name,
        surname=surname,
        birth_date=birth_date,
        identity_number=identity_number,
        father=father,
        mother=mother
    )


def create_spouse(child: Person, identity_number: str) -> Person:
    """
    Create a spouse for a given child.

    Args:
        child (Person): Person to assign spouse
        identity_number (str): Unique ID for spouse

    Returns:
        Person: Created spouse instance
    """
    spouse_gender = 'female' if child.name in FIRST_NAMES_MALE else 'male'

    return create_person(
        name=get_random_name(spouse_gender),
        surname=random.choice(LAST_NAMES),
        birth_date=child.birth_date + timedelta(
            days=random.randint(-365, 365)
        ),
        identity_number=identity_number
    )


class Command(BaseCommand):
    """
    Django management command to seed the database with a
    realistic multi-generation family tree.

    The generated dataset:
    - Starts from a root couple (circa 1750)
    - Expands across 10 generations
    - Each couple has 2–3 children
    - Each child is assigned a spouse
    """

    help = "Seed the database with a realistic 10-generation family tree"

    def handle(self, *args, **kwargs) -> None:
        """
        Entry point for command execution.
        """
        self._clear_data()
        self._seed_family_tree()

    def _clear_data(self) -> None:
        """
        Remove all existing Person records.
        """
        self.stdout.write("Clearing existing data...")
        Person.objects.all().delete()

    def _seed_family_tree(self) -> None:
        """
        Generate the full 10-generation family tree.
        """
        id_counter = 1000
        generation_year = 1750

        # Create root couple
        father = create_person(
            name=get_random_name('male'),
            surname=random.choice(LAST_NAMES),
            birth_date=date(1750, 1, 1),
            identity_number=str(id_counter)
        )
        id_counter += 1

        mother = create_person(
            name=get_random_name('female'),
            surname=random.choice(LAST_NAMES),
            birth_date=date(1752, 1, 1),
            identity_number=str(id_counter)
        )
        id_counter += 1

        current_generation: List[Tuple[Person, Person]] = [(father, mother)]

        # Generate generations
        for gen in range(1, TOTAL_GENERATIONS + 1):
            self.stdout.write(f"Processing Generation {gen}...")
            next_generation: List[Tuple[Person, Person]] = []

            generation_year += GENERATION_GAP_YEARS

            for father, mother in current_generation:
                children = self._create_children(
                    father,
                    mother,
                    generation_year,
                    id_counter
                )

                for child, spouse, new_id in children:
                    id_counter = new_id
                    next_generation.append((child, spouse))

            current_generation = next_generation

        total_created = id_counter - 1000
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {total_created} persons "
                f"across {TOTAL_GENERATIONS} generations."
            )
        )

    def _create_children(
        self,
        father: Person,
        mother: Person,
        base_year: int,
        id_counter: int
    ) -> List[Tuple[Person, Person, int]]:
        """
        Create children for a given couple along with their spouses.

        Args:
            father (Person): Father
            mother (Person): Mother
            base_year (int): Base year for birth
            id_counter (int): Current ID counter

        Returns:
            List of tuples: (child, spouse, updated_id_counter)
        """
        results = []
        # Keep children per couple relatively small (1–2) so that
        # total record count is in the millions range but does not
        # explode to an unmanageable size.
        num_children = random.randint(1, 2)

        for _ in range(num_children):
            gender = random.choice(['male', 'female'])

            child = create_person(
                name=get_random_name(gender),
                surname=father.surname,
                birth_date=date(
                    base_year + random.randint(0, 5),
                    random.randint(1, 12),
                    random.randint(1, 28)
                ),
                identity_number=str(id_counter),
                father=father,
                mother=mother
            )
            id_counter += 1

            spouse = create_spouse(child, str(id_counter))
            id_counter += 1

            # Maintain (father, mother) ordering
            if gender == 'male':
                results.append((child, spouse, id_counter))
            else:
                results.append((spouse, child, id_counter))

        return results
