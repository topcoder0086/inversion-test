from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("family_tree", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE IF EXISTS site.person SET SCHEMA public;",
            reverse_sql="ALTER TABLE IF EXISTS public.person SET SCHEMA site;",
        ),
    ]
