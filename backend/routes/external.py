"""
External API Routes
Integration with external APIs
"""

from fastapi import APIRouter, Query, Path, HTTPException, status
from typing import Optional
import httpx
import logging

from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/github/users/{username}")
async def get_github_user(
    username: str
):
    """
    Get GitHub user information (public)
    
    Example integration with external API
    """
    if not username or len(username) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is required"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/users/{username}",
                headers={
                    "Accept": "application/vnd.github.v3+json",
                    **({"Authorization": f"token {settings.GITHUB_API_TOKEN}"} 
                       if settings.GITHUB_API_TOKEN else {})
                },
                timeout=settings.EXTERNAL_API_TIMEOUT
            )
            
            if response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"GitHub user '{username}' not found"
                )
            
            if response.status_code != 200:
                logger.error(f"GitHub API error: {response.status_code}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Error fetching from GitHub API"
                )
            
            data = response.json()
            
            return {
                "status": "success",
                "user": {
                    "username": data.get("login"),
                    "name": data.get("name"),
                    "bio": data.get("bio"),
                    "company": data.get("company"),
                    "location": data.get("location"),
                    "email": data.get("email"),
                    "blog": data.get("blog"),
                    "twitter": data.get("twitter_username"),
                    "public_repos": data.get("public_repos"),
                    "followers": data.get("followers"),
                    "following": data.get("following"),
                    "avatar_url": data.get("avatar_url"),
                    "profile_url": data.get("html_url"),
                    "created_at": data.get("created_at"),
                    "updated_at": data.get("updated_at")
                }
            }
    
    except httpx.TimeoutException:
        logger.error(f"GitHub API timeout for user {username}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="GitHub API request timed out"
        )
    except Exception as e:
        logger.error(f"Error fetching GitHub user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching external data"
        )


@router.get("/github/repos/{owner}/{repo}")
async def get_github_repo(
    owner: str,
    repo: str
):
    """
    Get GitHub repository information
    
    Example: /api/external/github/repos/anthropics/anthropic-sdk-python
    """
    if not owner or not repo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owner and repo are required"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}",
                headers={
                    "Accept": "application/vnd.github.v3+json",
                    **({"Authorization": f"token {settings.GITHUB_API_TOKEN}"} 
                       if settings.GITHUB_API_TOKEN else {})
                },
                timeout=settings.EXTERNAL_API_TIMEOUT
            )
            
            if response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Repository not found"
                )
            
            if response.status_code != 200:
                logger.error(f"GitHub API error: {response.status_code}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Error fetching from GitHub API"
                )
            
            data = response.json()
            
            return {
                "status": "success",
                "repository": {
                    "name": data.get("name"),
                    "full_name": data.get("full_name"),
                    "description": data.get("description"),
                    "url": data.get("html_url"),
                    "stars": data.get("stargazers_count"),
                    "forks": data.get("forks_count"),
                    "watchers": data.get("watchers_count"),
                    "language": data.get("language"),
                    "license": data.get("license", {}).get("name"),
                    "open_issues": data.get("open_issues_count"),
                    "created_at": data.get("created_at"),
                    "updated_at": data.get("updated_at"),
                    "pushed_at": data.get("pushed_at"),
                    "topics": data.get("topics", [])
                }
            }
    
    except httpx.TimeoutException:
        logger.error(f"GitHub API timeout for repo {owner}/{repo}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="GitHub API request timed out"
        )
    except Exception as e:
        logger.error(f"Error fetching GitHub repo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching external data"
        )


@router.get("/weather/{city}")
async def get_weather(
    city: str = Path(..., min_length=2),
    country: Optional[str] = Query(None)
):
    """
    Get weather information using Open-Meteo API (free, no auth required)
    
    Example: /api/external/weather/London?country=UK
    """
    try:
        # First, get coordinates for the city using geocoding
        async with httpx.AsyncClient() as client:
            # Geocode the city
            geocode_url = "https://geocoding-api.open-meteo.com/v1/search"
            geocode_params = {
                "name": city,
                "count": 1,
                "language": "en",
                "format": "json"
            }
            if country:
                geocode_params["country"] = country
            
            geo_response = await client.get(
                geocode_url,
                params=geocode_params,
                timeout=settings.EXTERNAL_API_TIMEOUT
            )
            
            if geo_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Error fetching location data"
                )
            
            geo_data = geo_response.json()
            
            if not geo_data.get("results"):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Location '{city}' not found"
                )
            
            location = geo_data["results"][0]
            latitude = location["latitude"]
            longitude = location["longitude"]
            location_name = location["name"]
            country_name = location.get("country", "")
            
            # Get weather data
            weather_url = "https://api.open-meteo.com/v1/forecast"
            weather_params = {
                "latitude": latitude,
                "longitude": longitude,
                "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
                "timezone": "auto"
            }
            
            weather_response = await client.get(
                weather_url,
                params=weather_params,
                timeout=settings.EXTERNAL_API_TIMEOUT
            )
            
            if weather_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Error fetching weather data"
                )
            
            weather_data = weather_response.json()
            current = weather_data.get("current", {})
            
            return {
                "status": "success",
                "location": {
                    "name": location_name,
                    "country": country_name,
                    "latitude": latitude,
                    "longitude": longitude
                },
                "weather": {
                    "temperature": current.get("temperature_2m"),
                    "humidity": current.get("relative_humidity_2m"),
                    "wind_speed": current.get("wind_speed_10m"),
                    "weather_code": current.get("weather_code"),
                    "time": current.get("time")
                }
            }
    
    except httpx.TimeoutException:
        logger.error(f"Weather API timeout for {city}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Weather API request timed out"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching weather: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching weather data"
        )
