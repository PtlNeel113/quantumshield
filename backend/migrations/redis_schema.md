# QuantumShield Redis Caching Schema

## Overview
Redis is used as a high-performance caching layer for frequently accessed data and real-time analytics.

## Key Naming Conventions

```
{namespace}:{entity}:{id}:{field}
```

Examples:
- `qs:asset:750e8400-e29b-41d4-a716-446655440001:risk_score`
- `qs:org:550e8400-e29b-41d4-a716-446655440001:stats`
- `qs:scan:850e8400-e29b-41d4-a716-446655440001:status`

## Data Structures

### 1. Asset Risk Scores (String)
**Pattern:** `qs:asset:{asset_id}:risk`  
**TTL:** 3600 seconds (1 hour)  
**Value:** JSON string with latest risk score

```json
{
  "risk_score": 85.5,
  "risk_severity": "critical",
  "calculated_at": "2024-01-15T10:30:00Z",
  "components": {
    "data_sensitivity": 90.0,
    "data_longevity": 85.0,
    "crypto_weakness": 75.0,
    "exposure_surface": 80.0,
    "adversary_value": 95.0
  }
}
```

**Commands:**
```redis
SET qs:asset:750e8400-e29b-41d4-a716-446655440001:risk '{"risk_score": 85.5, ...}' EX 3600
GET qs:asset:750e8400-e29b-41d4-a716-446655440001:risk
```

### 2. Organization Statistics (Hash)
**Pattern:** `qs:org:{org_id}:stats`  
**TTL:** 1800 seconds (30 minutes)  
**Fields:**
- `total_assets`
- `critical_assets`
- `high_risk_assets`
- `avg_risk_score`
- `last_scan`
- `findings_count`

```redis
HSET qs:org:550e8400-e29b-41d4-a716-446655440001:stats total_assets 150
HSET qs:org:550e8400-e29b-41d4-a716-446655440001:stats critical_assets 25
HSET qs:org:550e8400-e29b-41d4-a716-446655440001:stats avg_risk_score 67.5
EXPIRE qs:org:550e8400-e29b-41d4-a716-446655440001:stats 1800

HGETALL qs:org:550e8400-e29b-41d4-a716-446655440001:stats
```

### 3. Scan Job Status (Hash)
**Pattern:** `qs:scan:{scan_job_id}:status`  
**TTL:** 7200 seconds (2 hours)  
**Fields:**
- `status` (pending, running, completed, failed)
- `progress` (0-100)
- `assets_scanned`
- `findings_count`
- `started_at`
- `estimated_completion`

```redis
HSET qs:scan:850e8400-e29b-41d4-a716-446655440001:status status running
HSET qs:scan:850e8400-e29b-41d4-a716-446655440001:status progress 45
HSET qs:scan:850e8400-e29b-41d4-a716-446655440001:status assets_scanned 23
EXPIRE qs:scan:850e8400-e29b-41d4-a716-446655440001:status 7200
```

### 4. Top Risk Assets (Sorted Set)
**Pattern:** `qs:org:{org_id}:top_risks`  
**TTL:** 3600 seconds (1 hour)  
**Score:** Risk score (0-100)  
**Member:** Asset ID

```redis
ZADD qs:org:550e8400-e29b-41d4-a716-446655440001:top_risks 95.3 750e8400-e29b-41d4-a716-446655440002
ZADD qs:org:550e8400-e29b-41d4-a716-446655440001:top_risks 88.7 750e8400-e29b-41d4-a716-446655440009
ZADD qs:org:550e8400-e29b-41d4-a716-446655440001:top_risks 85.5 750e8400-e29b-41d4-a716-446655440001
EXPIRE qs:org:550e8400-e29b-41d4-a716-446655440001:top_risks 3600

# Get top 10 highest risk assets
ZREVRANGE qs:org:550e8400-e29b-41d4-a716-446655440001:top_risks 0 9 WITHSCORES
```

### 5. Algorithm Distribution (Hash)
**Pattern:** `qs:org:{org_id}:algo_dist`  
**TTL:** 7200 seconds (2 hours)  
**Fields:** Algorithm names  
**Values:** Usage count

```redis
HSET qs:org:550e8400-e29b-41d4-a716-446655440001:algo_dist RSA-2048 45
HSET qs:org:550e8400-e29b-41d4-a716-446655440001:algo_dist AES-256 120
HSET qs:org:550e8400-e29b-41d4-a716-446655440001:algo_dist ECDSA-256 30
EXPIRE qs:org:550e8400-e29b-41d4-a716-446655440001:algo_dist 7200

HGETALL qs:org:550e8400-e29b-41d4-a716-446655440001:algo_dist
```

### 6. User Sessions (String)
**Pattern:** `qs:session:{session_id}`  
**TTL:** 86400 seconds (24 hours)  
**Value:** JSON with user session data

```json
{
  "user_id": "650e8400-e29b-41d4-a716-446655440001",
  "organization_id": "550e8400-e29b-41d4-a716-446655440001",
  "role": "admin",
  "created_at": "2024-01-15T09:00:00Z",
  "last_activity": "2024-01-15T14:30:00Z"
}
```

```redis
SET qs:session:abc123def456 '{"user_id": "650e8400...", ...}' EX 86400
GET qs:session:abc123def456
```

### 7. Rate Limiting (String)
**Pattern:** `qs:ratelimit:{user_id}:{endpoint}`  
**TTL:** 60 seconds (1 minute)  
**Value:** Request count

```redis
INCR qs:ratelimit:650e8400-e29b-41d4-a716-446655440001:/api/scans
EXPIRE qs:ratelimit:650e8400-e29b-41d4-a716-446655440001:/api/scans 60

GET qs:ratelimit:650e8400-e29b-41d4-a716-446655440001:/api/scans
```

### 8. Real-time Scan Progress (Pub/Sub)
**Channel:** `qs:scan:{scan_job_id}:progress`  
**Message:** JSON with progress updates

```json
{
  "scan_job_id": "850e8400-e29b-41d4-a716-446655440001",
  "status": "running",
  "progress": 45,
  "current_target": "api.acme.com",
  "findings_count": 12,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

```redis
# Publisher
PUBLISH qs:scan:850e8400-e29b-41d4-a716-446655440001:progress '{"status": "running", ...}'

# Subscriber
SUBSCRIBE qs:scan:850e8400-e29b-41d4-a716-446655440001:progress
```

### 9. Quantum Break Estimates Cache (String)
**Pattern:** `qs:quantum:{algorithm}:{key_size}`  
**TTL:** 604800 seconds (7 days)  
**Value:** JSON with break estimates

```json
{
  "algorithm": "RSA",
  "key_size": 2048,
  "earliest_break_year": 2030,
  "latest_break_year": 2035,
  "confidence": 0.75,
  "logical_qubits_required": 4096
}
```

```redis
SET qs:quantum:RSA:2048 '{"earliest_break_year": 2030, ...}' EX 604800
GET qs:quantum:RSA:2048
```

### 10. Dashboard Metrics (Hash)
**Pattern:** `qs:dashboard:{org_id}:{dashboard_type}`  
**TTL:** 300 seconds (5 minutes)  
**Fields:** Various metrics

```redis
HSET qs:dashboard:550e8400-e29b-41d4-a716-446655440001:overview total_assets 150
HSET qs:dashboard:550e8400-e29b-41d4-a716-446655440001:overview critical_findings 23
HSET qs:dashboard:550e8400-e29b-41d4-a716-446655440001:overview avg_risk 67.5
HSET qs:dashboard:550e8400-e29b-41d4-a716-446655440001:overview quantum_vulnerable 45
EXPIRE qs:dashboard:550e8400-e29b-41d4-a716-446655440001:overview 300
```

### 11. Asset Search Index (Set)
**Pattern:** `qs:search:{org_id}:{search_term}`  
**TTL:** 1800 seconds (30 minutes)  
**Members:** Asset IDs matching search

```redis
SADD qs:search:550e8400-e29b-41d4-a716-446655440001:payment 750e8400-e29b-41d4-a716-446655440001
SADD qs:search:550e8400-e29b-41d4-a716-446655440001:payment 750e8400-e29b-41d4-a716-446655440005
EXPIRE qs:search:550e8400-e29b-41d4-a716-446655440001:payment 1800

SMEMBERS qs:search:550e8400-e29b-41d4-a716-446655440001:payment
```

### 12. Background Job Queue (List)
**Pattern:** `qs:queue:{queue_name}`  
**No TTL** (persistent until processed)  
**Values:** JSON job definitions

```redis
# Add job to queue
LPUSH qs:queue:risk_calculation '{"asset_id": "750e8400...", "priority": "high"}'

# Process job from queue
RPOP qs:queue:risk_calculation
```

## Cache Invalidation Strategies

### 1. Time-based (TTL)
Most caches expire automatically based on TTL.

### 2. Event-based
Invalidate cache when data changes:

```python
# When asset risk is recalculated
redis.delete(f"qs:asset:{asset_id}:risk")
redis.zrem(f"qs:org:{org_id}:top_risks", asset_id)
redis.delete(f"qs:dashboard:{org_id}:overview")
```

### 3. Pattern-based
Invalidate multiple related keys:

```python
# Invalidate all org caches
keys = redis.keys(f"qs:org:{org_id}:*")
if keys:
    redis.delete(*keys)
```

## Performance Optimization

### 1. Pipeline Commands
Batch multiple operations:

```python
pipe = redis.pipeline()
pipe.hset(f"qs:org:{org_id}:stats", "total_assets", 150)
pipe.hset(f"qs:org:{org_id}:stats", "critical_assets", 25)
pipe.expire(f"qs:org:{org_id}:stats", 1800)
pipe.execute()
```

### 2. Lua Scripts
Atomic operations:

```lua
-- Increment rate limit with automatic expiry
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local current = redis.call('INCR', key)
if current == 1 then
    redis.call('EXPIRE', key, ttl)
end

if current > limit then
    return 0
else
    return 1
end
```

## Monitoring Keys

### Key Count by Pattern
```redis
# Count all QuantumShield keys
EVAL "return #redis.call('keys', 'qs:*')" 0

# Memory usage
INFO memory
```

### Most Used Keys
```redis
# Enable key tracking
CONFIG SET maxmemory-policy allkeys-lru

# Monitor commands
MONITOR
```

## Backup and Persistence

### RDB Snapshots
```redis
# Manual snapshot
SAVE

# Background snapshot
BGSAVE

# Configure automatic snapshots in redis.conf
save 900 1      # After 900 sec if at least 1 key changed
save 300 10     # After 300 sec if at least 10 keys changed
save 60 10000   # After 60 sec if at least 10000 keys changed
```

### AOF (Append Only File)
```redis
# Enable AOF in redis.conf
appendonly yes
appendfsync everysec
```

## Security

### Authentication
```redis
# Set password in redis.conf
requirepass your_strong_password_here

# Connect with auth
AUTH your_strong_password_here
```

### Network Security
```redis
# Bind to specific interface in redis.conf
bind 127.0.0.1 ::1

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

## Example Usage in Python

```python
import redis
import json
from datetime import timedelta

# Connect to Redis
r = redis.Redis(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True
)

# Cache asset risk score
def cache_asset_risk(asset_id: str, risk_data: dict):
    key = f"qs:asset:{asset_id}:risk"
    r.setex(key, timedelta(hours=1), json.dumps(risk_data))

# Get cached risk score
def get_cached_risk(asset_id: str) -> dict:
    key = f"qs:asset:{asset_id}:risk"
    data = r.get(key)
    return json.loads(data) if data else None

# Update organization stats
def update_org_stats(org_id: str, stats: dict):
    key = f"qs:org:{org_id}:stats"
    pipe = r.pipeline()
    for field, value in stats.items():
        pipe.hset(key, field, value)
    pipe.expire(key, 1800)
    pipe.execute()

# Add to top risks sorted set
def add_to_top_risks(org_id: str, asset_id: str, risk_score: float):
    key = f"qs:org:{org_id}:top_risks"
    r.zadd(key, {asset_id: risk_score})
    r.expire(key, 3600)

# Get top N risk assets
def get_top_risks(org_id: str, limit: int = 10) -> list:
    key = f"qs:org:{org_id}:top_risks"
    return r.zrevrange(key, 0, limit - 1, withscores=True)

# Rate limiting
def check_rate_limit(user_id: str, endpoint: str, limit: int = 100) -> bool:
    key = f"qs:ratelimit:{user_id}:{endpoint}"
    current = r.incr(key)
    if current == 1:
        r.expire(key, 60)
    return current <= limit
```
