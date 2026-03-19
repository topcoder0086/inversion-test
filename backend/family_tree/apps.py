from django.apps import AppConfig
from django.db.models.signals import pre_migrate
from django.db import connection

def create_site_schema(sender, **kwargs):
    """
    Ensure the 'site' schema exists before running any migrations.
    This is critical for PostgreSQL when using custom schemas in test databases.
    """
    with connection.cursor() as cursor:
        cursor.execute('CREATE SCHEMA IF NOT EXISTS site;')

class FamilyTreeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'family_tree'

    def ready(self):
        # Register the pre_migrate signal
        pre_migrate.connect(create_site_schema, sender=self)
