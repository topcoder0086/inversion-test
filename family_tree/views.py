"""
API Views for the Family Tree Application.
Strictly following Inversion Specification.
"""
from django.db import models, connection
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Person
from .serializers import PersonSerializer


class FamilyTreeListView(APIView):
    """
    API endpoint to retrieve a person's descendants as a hierarchical tree.
    Initially returns 10 levels deep as per specification.
    """
    def get(self, request, IdentityNumber):
        """
        Handle GET request to fetch descendant tree.
        """
        # Lookup by exact spec field name
        person = get_object_or_404(Person, identity_number=IdentityNumber)
        
        # Initial 10 levels as per specification
        requested_levels = int(request.query_params.get('levels', 10))
        
        # Fetch all descendants in a single query using Recursive CTE
        flat_data = self._fetch_descendants_cte(person.id, requested_levels)
        
        # Reconstruct hierarchical tree from flat list in memory
        tree = self._reconstruct_tree(flat_data, person.id)
        
        return Response(tree)

    def _fetch_descendants_cte(self, root_id, levels):
        """
        Recursive CTE optimized for the 'site.person' table.
        """
        table_name = connection.ops.quote_name(Person._meta.db_table)

        query = f"""
        WITH RECURSIVE descendants AS (
            -- Initial node (Base Case)
            SELECT id as "Id", name as "Name", surname as "Surname", identity_number as "IdentityNumber", birth_date as "BirthDate", father_id as "FatherId", mother_id as "MotherId", 0 as depth
            FROM {table_name}
            WHERE id = %s
            
            UNION ALL
            
            -- Hierarchical recursion (Recursive Step)
            SELECT p.id as "Id", p.name as "Name", p.surname as "Surname", p.identity_number as "IdentityNumber", p.birth_date as "BirthDate", p.father_id as "FatherId", p.mother_id as "MotherId", d.depth + 1
            FROM {table_name} p
            JOIN descendants d ON p.father_id = d."Id" OR p.mother_id = d."Id"
            WHERE d.depth < %s
        )
        SELECT * FROM descendants;
        """
        with connection.cursor() as cursor:
            cursor.execute(query, [root_id, levels])
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def _reconstruct_tree(self, flat_list, root_id):
        """
        Convert a flat list of nodes into a nested tree structure.
        """
        if not flat_list:
            return None

        # Create a map for fast lookup
        nodes = {item['Id']: {**item, 'children': []} for item in flat_list}
        root = None

        for node_id, node in nodes.items():
            if node_id == root_id:
                root = node
            
            father_id = node.get('FatherId')
            mother_id = node.get('MotherId')

            # Link to parents present in the current result set
            if father_id in nodes:
                nodes[father_id]['children'].append(node)
                continue # If both parents present, avoid double entry for this task's tree view
            
            if mother_id in nodes:
                nodes[mother_id]['children'].append(node)

        return root


class RootAscendantView(APIView):
    """
    API endpoint to retrieve the root ascendant in the person's lineage tree.
    """
    def get(self, request, IdentityNumber):
        """
        Handle GET request to find root ancestor.
        """
        person = get_object_or_404(Person, identity_number=IdentityNumber)
        root = self._find_root_ascendant_cte(person.id)
        serializer = PersonSerializer(root)

        return Response(serializer.data)

    def _find_root_ascendant_cte(self, person_id):
        """
        Trace upward to the oldest ancestor using a Recursive CTE.
        """
        table_name = connection.ops.quote_name(Person._meta.db_table)

        query = f"""
        WITH RECURSIVE ancestors AS (
            -- Start with the subject
            SELECT id as "Id", name as "Name", surname as "Surname", identity_number as "IdentityNumber", birth_date as "BirthDate", father_id as "FatherId", mother_id as "MotherId"
            FROM {table_name}
            WHERE id = %s
            
            UNION ALL
            
            -- Trace upward (Following father primarily, then mother)
            SELECT p.id as "Id", p.name as "Name", p.surname as "Surname", p.identity_number as "IdentityNumber", p.birth_date as "BirthDate", p.father_id as "FatherId", p.mother_id as "MotherId"
            FROM {table_name} p
            JOIN ancestors a ON a."FatherId" = p.id OR (a."FatherId" IS NULL AND a."MotherId" = p.id)
        )
        SELECT * FROM ancestors ORDER BY "Id" ASC LIMIT 1;
        """
        with connection.cursor() as cursor:
            cursor.execute(query, [person_id])
            row = cursor.fetchone()
            if row:
                return Person.objects.get(id=row[0])
            return None
