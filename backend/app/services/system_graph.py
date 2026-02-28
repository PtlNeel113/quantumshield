"""QuantumShield — System Graph Engine

Maps relationships between systems, assets, databases, and backups in Neo4j
to enable blast radius analysis and risk propagation.
"""

import structlog
from typing import List, Dict, Optional
from dataclasses import dataclass

from app.database import get_neo4j

logger = structlog.get_logger(__name__)


@dataclass
class GraphEdge:
    source_id: str
    target_id: str
    relation_type: str  # connects_to, replicates_to, authenticates_with, backs_up_to
    properties: Dict = None

    def __post_init__(self):
        if self.properties is None:
            self.properties = {}


class SystemGraphEngine:
    """Manages the Neo4j knowledge graph of system topology and dependencies."""

    async def ingest_asset(
        self,
        asset_id: str,
        name: str,
        asset_type: str,
        environment: str = "production"
    ):
        """Create or update an asset node in the graph."""
        driver = await get_neo4j()
        query = """
        MERGE (a:Asset {id: $asset_id})
        SET a.name = $name,
            a.type = $asset_type,
            a.environment = $environment,
            a.last_seen = datetime()
        RETURN a
        """
        async with driver.session() as session:
            await session.run(
                query,
                asset_id=asset_id,
                name=name,
                asset_type=asset_type,
                environment=environment,
            )

    async def add_relationship(self, edge: GraphEdge):
        """Add a directed relationship between two assets."""
        driver = await get_neo4j()
        
        # Note: Cypher doesn't allow parameterization of relationship types directly,
        # so we inject it safely by validating it.
        valid_rels = {"CONNECTS_TO", "REPLICATES_TO", "AUTHENTICATES_WITH", "BACKS_UP_TO", "DEPENDS_ON"}
        rel_type = edge.relation_type.upper()
        if rel_type not in valid_rels:
            rel_type = "CONNECTS_TO"

        query = f"""
        MATCH (src:Asset {{id: $source_id}})
        MATCH (tgt:Asset {{id: $target_id}})
        MERGE (src)-[r:{rel_type}]->(tgt)
        SET r += $properties, r.last_seen = datetime()
        RETURN r
        """
        
        async with driver.session() as session:
            await session.run(
                query,
                source_id=edge.source_id,
                target_id=edge.target_id,
                properties=edge.properties,
            )

    async def get_blast_radius(self, asset_id: str, max_depth: int = 3) -> Dict:
        """Calculate the blast radius if an asset is compromised."""
        driver = await get_neo4j()
        
        # Traverse outgoing and incoming paths
        query = """
        MATCH (start:Asset {id: $asset_id})
        CALL apoc.path.subgraphAll(start, {
            maxLevel: $max_depth,
            relationshipFilter: ">"
        })
        YIELD nodes, relationships
        RETURN nodes, relationships
        """
        
        # If apoc is not available, fallback to standard variable length path
        fallback_query = """
        MATCH path = (start:Asset {id: $asset_id})-[*1..3]->(downstream:Asset)
        RETURN path
        """
        
        graph_data = {"nodes": [], "edges": []}
        
        try:
            async with driver.session() as session:
                result = await session.run(fallback_query, asset_id=asset_id)
                nodes_seen = set()
                edges_seen = set()
                
                async for record in result:
                    path = record["path"]
                    for node in path.nodes:
                        if node.id not in nodes_seen:
                            graph_data["nodes"].append(dict(node))
                            nodes_seen.add(node.id)
                    for rel in path.relationships:
                        edge_id = f"{rel.start_node.id}-{rel.type}-{rel.end_node.id}"
                        if edge_id not in edges_seen:
                            graph_data["edges"].append({
                                "source": rel.start_node["id"],
                                "target": rel.end_node["id"],
                                "type": rel.type
                            })
                            edges_seen.add(edge_id)
                            
            return graph_data
        except Exception as e:
            logger.error("graph_query_failed", error=str(e), asset_id=asset_id)
            return {"error": str(e), "nodes": [], "edges": []}
