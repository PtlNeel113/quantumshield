#!/usr/bin/env python3
"""
QuantumShield - Automated Partition Management
Creates future partitions for partitioned tables
Run monthly via cron or scheduler
"""

import sys
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'quantumshield',
    'user': 'quantumshield_app',
    'password': 'your_secure_password'  # Use environment variable in production
}

# Partitioned tables configuration
PARTITIONED_TABLES = [
    'scan_jobs',
    'tls_findings',
    'crypto_findings',
    'risk_scores',
    'audit_logs'
]

# Number of months to create ahead
MONTHS_AHEAD = 3


def get_db_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        sys.exit(1)


def partition_exists(cursor, partition_name):
    """Check if partition already exists"""
    cursor.execute("""
        SELECT EXISTS (
            SELECT 1 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = %s
        )
    """, (partition_name,))
    return cursor.fetchone()[0]


def create_partition(cursor, table_name, start_date, end_date):
    """Create a single partition"""
    partition_name = f"{table_name}_{start_date.strftime('%Y_%m')}"
    
    # Check if partition already exists
    if partition_exists(cursor, partition_name):
        logger.info(f"Partition {partition_name} already exists, skipping")
        return False
    
    # Create partition
    try:
        sql = f"""
        CREATE TABLE IF NOT EXISTS {partition_name} 
        PARTITION OF {table_name}
        FOR VALUES FROM ('{start_date.strftime('%Y-%m-%d')}') 
                    TO ('{end_date.strftime('%Y-%m-%d')}')
        """
        cursor.execute(sql)
        logger.info(f"Created partition: {partition_name}")
        return True
    except Exception as e:
        logger.error(f"Failed to create partition {partition_name}: {e}")
        return False


def create_future_partitions(months_ahead=MONTHS_AHEAD):
    """Create partitions for future months"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    created_count = 0
    
    try:
        # Get current date (first day of current month)
        current_date = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        logger.info(f"Creating partitions for {months_ahead} months ahead")
        logger.info(f"Starting from: {current_date.strftime('%Y-%m')}")
        
        # Create partitions for each month
        for i in range(months_ahead):
            start_date = current_date + relativedelta(months=i)
            end_date = start_date + relativedelta(months=1)
            
            logger.info(f"\nProcessing month: {start_date.strftime('%Y-%m')}")
            
            # Create partition for each table
            for table_name in PARTITIONED_TABLES:
                if create_partition(cursor, table_name, start_date, end_date):
                    created_count += 1
        
        logger.info(f"\nPartition creation complete. Created {created_count} new partitions.")
        
    except Exception as e:
        logger.error(f"Error during partition creation: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


def list_existing_partitions():
    """List all existing partitions"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        logger.info("\nExisting partitions:")
        
        for table_name in PARTITIONED_TABLES:
            cursor.execute("""
                SELECT tablename, 
                       pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size
                FROM pg_tables
                WHERE schemaname = 'public'
                  AND tablename LIKE %s
                ORDER BY tablename
            """, (f"{table_name}_%",))
            
            partitions = cursor.fetchall()
            
            if partitions:
                logger.info(f"\n{table_name}:")
                for partition_name, size in partitions:
                    logger.info(f"  - {partition_name}: {size}")
            else:
                logger.info(f"\n{table_name}: No partitions found")
                
    except Exception as e:
        logger.error(f"Error listing partitions: {e}")
    finally:
        cursor.close()
        conn.close()


def drop_old_partitions(retention_months=36):
    """Drop partitions older than retention period"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    dropped_count = 0
    cutoff_date = datetime.now() - relativedelta(months=retention_months)
    
    try:
        logger.info(f"\nDropping partitions older than {cutoff_date.strftime('%Y-%m')}")
        
        for table_name in PARTITIONED_TABLES:
            # Special handling for audit_logs (7 year retention)
            if table_name == 'audit_logs':
                table_cutoff = datetime.now() - relativedelta(years=7)
            else:
                table_cutoff = cutoff_date
            
            # Get all partitions for this table
            cursor.execute("""
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                  AND tablename LIKE %s
                ORDER BY tablename
            """, (f"{table_name}_%",))
            
            partitions = cursor.fetchall()
            
            for (partition_name,) in partitions:
                try:
                    # Extract date from partition name (format: table_YYYY_MM)
                    date_part = partition_name.split('_')[-2:]  # ['YYYY', 'MM']
                    partition_date = datetime.strptime(f"{date_part[0]}-{date_part[1]}-01", "%Y-%m-%d")
                    
                    if partition_date < table_cutoff:
                        # Get partition size before dropping
                        cursor.execute("""
                            SELECT pg_size_pretty(pg_total_relation_size('public.' || %s))
                        """, (partition_name,))
                        size = cursor.fetchone()[0]
                        
                        # Drop partition
                        cursor.execute(f"DROP TABLE IF EXISTS {partition_name}")
                        logger.info(f"Dropped old partition: {partition_name} (size: {size})")
                        dropped_count += 1
                        
                except (ValueError, IndexError) as e:
                    logger.warning(f"Could not parse date from partition name {partition_name}: {e}")
                    continue
        
        logger.info(f"\nDropped {dropped_count} old partitions")
        
    except Exception as e:
        logger.error(f"Error dropping old partitions: {e}")
    finally:
        cursor.close()
        conn.close()


def verify_partitions():
    """Verify partition coverage and identify gaps"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        logger.info("\nVerifying partition coverage:")
        
        for table_name in PARTITIONED_TABLES:
            cursor.execute("""
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                  AND tablename LIKE %s
                ORDER BY tablename
            """, (f"{table_name}_%",))
            
            partitions = cursor.fetchall()
            
            if not partitions:
                logger.warning(f"{table_name}: No partitions found!")
                continue
            
            # Extract dates and check for gaps
            partition_dates = []
            for (partition_name,) in partitions:
                try:
                    date_part = partition_name.split('_')[-2:]
                    partition_date = datetime.strptime(f"{date_part[0]}-{date_part[1]}-01", "%Y-%m-%d")
                    partition_dates.append(partition_date)
                except (ValueError, IndexError):
                    continue
            
            partition_dates.sort()
            
            # Check for gaps
            gaps = []
            for i in range(len(partition_dates) - 1):
                expected_next = partition_dates[i] + relativedelta(months=1)
                if partition_dates[i + 1] != expected_next:
                    gaps.append((partition_dates[i], partition_dates[i + 1]))
            
            if gaps:
                logger.warning(f"{table_name}: Found {len(gaps)} gap(s) in partition coverage:")
                for start, end in gaps:
                    logger.warning(f"  Gap between {start.strftime('%Y-%m')} and {end.strftime('%Y-%m')}")
            else:
                first_partition = partition_dates[0].strftime('%Y-%m')
                last_partition = partition_dates[-1].strftime('%Y-%m')
                logger.info(f"{table_name}: Coverage from {first_partition} to {last_partition} ({len(partition_dates)} partitions)")
                
    except Exception as e:
        logger.error(f"Error verifying partitions: {e}")
    finally:
        cursor.close()
        conn.close()


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='QuantumShield Partition Management')
    parser.add_argument('--create', action='store_true', help='Create future partitions')
    parser.add_argument('--list', action='store_true', help='List existing partitions')
    parser.add_argument('--drop-old', action='store_true', help='Drop old partitions')
    parser.add_argument('--verify', action='store_true', help='Verify partition coverage')
    parser.add_argument('--months', type=int, default=MONTHS_AHEAD, 
                       help=f'Number of months ahead to create (default: {MONTHS_AHEAD})')
    parser.add_argument('--retention', type=int, default=36,
                       help='Retention period in months for dropping old partitions (default: 36)')
    
    args = parser.parse_args()
    
    # If no action specified, show help
    if not any([args.create, args.list, args.drop_old, args.verify]):
        parser.print_help()
        sys.exit(0)
    
    logger.info("=" * 60)
    logger.info("QuantumShield Partition Management")
    logger.info("=" * 60)
    
    if args.list:
        list_existing_partitions()
    
    if args.verify:
        verify_partitions()
    
    if args.create:
        create_future_partitions(args.months)
    
    if args.drop_old:
        drop_old_partitions(args.retention)
    
    logger.info("\n" + "=" * 60)
    logger.info("Partition management complete")
    logger.info("=" * 60)


if __name__ == '__main__':
    main()
