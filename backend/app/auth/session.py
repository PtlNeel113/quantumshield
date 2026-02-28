"""
QuantumShield - Session management
Redis-based session storage and device tracking
"""

import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import redis
from .security import generate_session_id


class SessionStore:
    """Redis-based session store"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.session_prefix = "qs:session:"
        self.user_sessions_prefix = "qs:user_sessions:"
        self.refresh_token_prefix = "qs:refresh:"
        
    def create_session(
        self,
        user_id: str,
        refresh_token: str,
        device_info: Dict[str, Any],
        remember_device: bool = False
    ) -> str:
        """
        Create new session
        
        Args:
            user_id: User UUID
            refresh_token: Refresh token
            device_info: Device information (user_agent, ip, etc.)
            remember_device: Whether to extend session duration
            
        Returns:
            Session ID
        """
        session_id = generate_session_id()
        
        # Session duration
        if remember_device:
            ttl = timedelta(days=30)
        else:
            ttl = timedelta(days=7)
        
        # Session data
        session_data = {
            "user_id": user_id,
            "session_id": session_id,
            "device": device_info.get("user_agent", "Unknown"),
            "ip_address": device_info.get("ip_address", "Unknown"),
            "country": device_info.get("country"),
            "device_fingerprint": device_info.get("device_fingerprint"),
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            "remember_device": remember_device
        }
        
        # Store session
        session_key = f"{self.session_prefix}{session_id}"
        self.redis.setex(
            session_key,
            int(ttl.total_seconds()),
            json.dumps(session_data)
        )
        
        # Store refresh token mapping
        refresh_key = f"{self.refresh_token_prefix}{refresh_token}"
        self.redis.setex(
            refresh_key,
            int(ttl.total_seconds()),
            session_id
        )
        
        # Add to user's session list
        user_sessions_key = f"{self.user_sessions_prefix}{user_id}"
        self.redis.sadd(user_sessions_key, session_id)
        self.redis.expire(user_sessions_key, int(ttl.total_seconds()))
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session data
        
        Args:
            session_id: Session ID
            
        Returns:
            Session data or None if not found
        """
        session_key = f"{self.session_prefix}{session_id}"
        data = self.redis.get(session_key)
        
        if data:
            return json.loads(data)
        return None
    
    def get_session_by_refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Get session by refresh token
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            Session data or None if not found
        """
        refresh_key = f"{self.refresh_token_prefix}{refresh_token}"
        session_id = self.redis.get(refresh_key)
        
        if session_id:
            return self.get_session(session_id.decode() if isinstance(session_id, bytes) else session_id)
        return None
    
    def update_session_activity(self, session_id: str):
        """
        Update session last activity timestamp
        
        Args:
            session_id: Session ID
        """
        session = self.get_session(session_id)
        if session:
            session["last_activity"] = datetime.utcnow().isoformat()
            
            session_key = f"{self.session_prefix}{session_id}"
            ttl = self.redis.ttl(session_key)
            
            if ttl > 0:
                self.redis.setex(
                    session_key,
                    ttl,
                    json.dumps(session)
                )
    
    def delete_session(self, session_id: str):
        """
        Delete session
        
        Args:
            session_id: Session ID
        """
        session = self.get_session(session_id)
        
        if session:
            # Remove session
            session_key = f"{self.session_prefix}{session_id}"
            self.redis.delete(session_key)
            
            # Remove from user's session list
            user_id = session.get("user_id")
            if user_id:
                user_sessions_key = f"{self.user_sessions_prefix}{user_id}"
                self.redis.srem(user_sessions_key, session_id)
    
    def delete_user_sessions(self, user_id: str):
        """
        Delete all sessions for a user
        
        Args:
            user_id: User UUID
        """
        user_sessions_key = f"{self.user_sessions_prefix}{user_id}"
        session_ids = self.redis.smembers(user_sessions_key)
        
        for session_id in session_ids:
            session_id_str = session_id.decode() if isinstance(session_id, bytes) else session_id
            self.delete_session(session_id_str)
        
        # Clear user sessions set
        self.redis.delete(user_sessions_key)
    
    def get_user_sessions(self, user_id: str) -> list[Dict[str, Any]]:
        """
        Get all active sessions for a user
        
        Args:
            user_id: User UUID
            
        Returns:
            List of session data
        """
        user_sessions_key = f"{self.user_sessions_prefix}{user_id}"
        session_ids = self.redis.smembers(user_sessions_key)
        
        sessions = []
        for session_id in session_ids:
            session_id_str = session_id.decode() if isinstance(session_id, bytes) else session_id
            session = self.get_session(session_id_str)
            if session:
                sessions.append(session)
        
        return sessions
    
    def revoke_refresh_token(self, refresh_token: str):
        """
        Revoke refresh token
        
        Args:
            refresh_token: Refresh token to revoke
        """
        refresh_key = f"{self.refresh_token_prefix}{refresh_token}"
        session_id = self.redis.get(refresh_key)
        
        if session_id:
            session_id_str = session_id.decode() if isinstance(session_id, bytes) else session_id
            self.delete_session(session_id_str)
        
        self.redis.delete(refresh_key)


class RateLimiter:
    """Redis-based rate limiter"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.prefix = "qs:ratelimit:"
    
    def check_rate_limit(
        self,
        key: str,
        limit: int,
        window: int = 60
    ) -> tuple[bool, int]:
        """
        Check if rate limit is exceeded
        
        Args:
            key: Rate limit key (e.g., IP address, user ID)
            limit: Maximum number of requests
            window: Time window in seconds
            
        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        rate_key = f"{self.prefix}{key}"
        
        # Increment counter
        current = self.redis.incr(rate_key)
        
        # Set expiry on first request
        if current == 1:
            self.redis.expire(rate_key, window)
        
        # Check if limit exceeded
        is_allowed = current <= limit
        remaining = max(0, limit - current)
        
        return is_allowed, remaining
    
    def reset_rate_limit(self, key: str):
        """
        Reset rate limit for a key
        
        Args:
            key: Rate limit key
        """
        rate_key = f"{self.prefix}{key}"
        self.redis.delete(rate_key)


class LoginAttemptTracker:
    """Track failed login attempts"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.prefix = "qs:login_attempts:"
        self.lockout_prefix = "qs:account_lockout:"
        
    def record_failed_attempt(self, email: str, ip_address: str) -> int:
        """
        Record failed login attempt
        
        Args:
            email: User email
            ip_address: IP address
            
        Returns:
            Number of failed attempts
        """
        # Track by email
        email_key = f"{self.prefix}email:{email}"
        email_attempts = self.redis.incr(email_key)
        if email_attempts == 1:
            self.redis.expire(email_key, 900)  # 15 minutes
        
        # Track by IP
        ip_key = f"{self.prefix}ip:{ip_address}"
        ip_attempts = self.redis.incr(ip_key)
        if ip_attempts == 1:
            self.redis.expire(ip_key, 900)
        
        return email_attempts
    
    def get_failed_attempts(self, email: str) -> int:
        """
        Get number of failed attempts for email
        
        Args:
            email: User email
            
        Returns:
            Number of failed attempts
        """
        email_key = f"{self.prefix}email:{email}"
        attempts = self.redis.get(email_key)
        return int(attempts) if attempts else 0
    
    def reset_attempts(self, email: str):
        """
        Reset failed attempts for email
        
        Args:
            email: User email
        """
        email_key = f"{self.prefix}email:{email}"
        self.redis.delete(email_key)
    
    def lock_account(self, email: str, duration: int = 1800):
        """
        Lock account temporarily
        
        Args:
            email: User email
            duration: Lockout duration in seconds (default 30 minutes)
        """
        lockout_key = f"{self.lockout_prefix}{email}"
        self.redis.setex(lockout_key, duration, "locked")
    
    def is_account_locked(self, email: str) -> bool:
        """
        Check if account is locked
        
        Args:
            email: User email
            
        Returns:
            True if account is locked
        """
        lockout_key = f"{self.lockout_prefix}{email}"
        return self.redis.exists(lockout_key) > 0
    
    def unlock_account(self, email: str):
        """
        Unlock account
        
        Args:
            email: User email
        """
        lockout_key = f"{self.lockout_prefix}{email}"
        self.redis.delete(lockout_key)
        self.reset_attempts(email)
