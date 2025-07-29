#!/bin/bash
# EPV Valuation Pro - Database Backup Script

set -e

# Configuration
DB_NAME=${POSTGRES_DB:-epv_valuation}
DB_USER=${POSTGRES_USER:-postgres}
DB_HOST=${POSTGRES_HOST:-postgres}
BACKUP_DIR="/backups"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/epv_backup_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting database backup: $DATE"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME --verbose --no-password > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "Backup completed: $BACKUP_FILE"

# Calculate file size
BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
echo "Backup size: $BACKUP_SIZE"

# Clean up old backups
find $BACKUP_DIR -name "epv_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
REMOVED_COUNT=$(find $BACKUP_DIR -name "epv_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS | wc -l)

if [ $REMOVED_COUNT -gt 0 ]; then
    echo "Removed $REMOVED_COUNT old backup files (older than $RETENTION_DAYS days)"
fi

# List current backups
echo "Current backups:"
ls -lh $BACKUP_DIR/epv_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "Backup process completed successfully"