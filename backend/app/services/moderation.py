"""
Content moderation service
Uses OpenAI Moderation API with fallback to basic word filter
"""
from typing import List, Tuple
import re
from openai import OpenAI
from app.core.config import settings

# Initialize OpenAI client if API key is available
openai_client = None
if settings.openai_api_key:
    openai_client = OpenAI(api_key=settings.openai_api_key)

# Basic profanity filter (fallback)
BLACKLISTED_WORDS = [
    # Add words here as needed
]

# Bahamian context-aware moderation
BAHAMIAN_SLANG_ALLOWED = [
    "ya", "mon", "gwan", "ting", "wha", "dat"
]


def moderate_content(content: str) -> Tuple[bool, str]:
    """
    Moderate message content using OpenAI or fallback filter
    
    Returns:
        (is_safe, reason) - True if content is safe, False with reason if not
    """
    if not content or len(content.strip()) == 0:
        return False, "Empty message"
    
    # Check length
    if len(content) > 10000:  # 10k character limit
        return False, "Message too long"
    
    # Try OpenAI moderation if available
    if openai_client:
        try:
            is_safe, reason = moderate_with_openai_sync(content)
            if not is_safe:
                return False, reason
        except Exception as e:
            # Log error and fall back to basic filter
            print(f"OpenAI moderation error: {e}")
    
    # Basic word filter (case-insensitive) as fallback
    content_lower = content.lower()
    for word in BLACKLISTED_WORDS:
        if word in content_lower:
            return False, "Content contains inappropriate language"
    
    return True, ""


def moderate_with_openai_sync(content: str) -> Tuple[bool, str]:
    """
    Use OpenAI moderation API to check content (synchronous version)
    
    Returns:
        (is_safe, reason)
    """
    if not openai_client:
        return True, ""
    
    response = openai_client.moderations.create(input=content)
    result = response.results[0]
    
    if result.flagged:
        # Find which categories were flagged
        flagged_categories = []
        categories = result.categories
        
        if categories.hate:
            flagged_categories.append("hate speech")
        if categories.harassment:
            flagged_categories.append("harassment")
        if categories.self_harm:
            flagged_categories.append("self-harm content")
        if categories.sexual:
            flagged_categories.append("sexual content")
        if categories.violence:
            flagged_categories.append("violence")
        
        reason = f"Content flagged for: {', '.join(flagged_categories)}" if flagged_categories else "Content violates community guidelines"
        return False, reason
    
    return True, ""


async def moderate_with_openai(content: str) -> Tuple[bool, str]:
    """
    Use OpenAI moderation API to check content (async version)
    
    Returns:
        (is_safe, reason)
    """
    # OpenAI Python client doesn't have native async, use sync version
    return moderate_with_openai_sync(content)


def check_spam(content: str, user_id: int, recent_messages: List[str]) -> Tuple[bool, str]:
    """
    Basic spam detection
    
    Args:
        content: Message content
        user_id: User ID
        recent_messages: List of recent messages from this user
    
    Returns:
        (is_spam, reason)
    """
    # Check for repeated messages
    if recent_messages and content in recent_messages[-3:]:
        return True, "Repeated message detected"
    
    # Check for excessive length variations (potential copy-paste spam)
    if len(recent_messages) >= 5:
        lengths = [len(msg) for msg in recent_messages[-5:]]
        if all(abs(len(content) - l) < 5 for l in lengths):
            return True, "Potential spam pattern detected"
    
    return False, ""


