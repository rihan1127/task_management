import { useState } from 'react';
import { ExternalAPI } from '../services/api';
import { Button, Input, LoadingSpinner } from '../components';
import { getInitials, getAvatarColor } from '../utils/formatters';
import classNames from 'classnames';

export default function ExternalData() {
  const [githubUsername, setGithubUsername] = useState('');
  const [githubData, setGithubData] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState(null);

  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  const fetchGitHub = async () => {
    if (!githubUsername.trim()) return;
    try {
      setGithubLoading(true);
      setGithubError(null);
      const res = await ExternalAPI.getGitHubUser(githubUsername.trim());
      setGithubData(res.data.user);
    } catch (err) {
      setGithubError(err.response?.data?.detail || 'User not found');
      setGithubData(null);
    } finally {
      setGithubLoading(false);
    }
  };

  const fetchWeather = async () => {
    if (!city.trim()) return;
    try {
      setWeatherLoading(true);
      setWeatherError(null);
      const res = await ExternalAPI.getWeather(city.trim());
      setWeatherData(res.data);
    } catch (err) {
      setWeatherError(err.response?.data?.detail || 'Location not found');
      setWeatherData(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  const getWeatherEmoji = (code) => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌦️';
    return '⛈️';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">External Integrations</h1>
        <p className="text-gray-500 mt-1">
          Live data from external APIs — GitHub and Open-Meteo Weather (no API key required).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GitHub Lookup */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">GitHub User Lookup</h2>
              <p className="text-xs text-gray-500">Fetch public profile data from GitHub API</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="e.g. torvalds"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchGitHub()}
            />
            <Button
              variant="primary"
              onClick={fetchGitHub}
              isLoading={githubLoading}
              disabled={!githubUsername.trim()}
            >
              Lookup
            </Button>
          </div>

          {githubError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {githubError}
            </div>
          )}

          {githubLoading && <LoadingSpinner />}

          {githubData && !githubLoading && (
            <div className="mt-2 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={githubData.avatar_url}
                  alt={githubData.username}
                  className="w-16 h-16 rounded-full border-2 border-gray-200"
                />
                <div>
                  <p className="font-bold text-gray-900 text-lg">{githubData.name || githubData.username}</p>
                  <a
                    href={githubData.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    @{githubData.username}
                  </a>
                  {githubData.bio && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{githubData.bio}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Repos', value: githubData.public_repos },
                  { label: 'Followers', value: githubData.followers },
                  { label: 'Following', value: githubData.following },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{stat.value?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {(githubData.company || githubData.location) && (
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {githubData.company && (
                    <span className="flex items-center gap-1">🏢 {githubData.company}</span>
                  )}
                  {githubData.location && (
                    <span className="flex items-center gap-1">📍 {githubData.location}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {!githubData && !githubLoading && !githubError && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Enter a GitHub username to look up their profile</p>
              <div className="flex justify-center gap-2 mt-3 flex-wrap">
                {['torvalds', 'gvanrossum', 'sindresorhus'].map((u) => (
                  <button
                    key={u}
                    onClick={() => { setGithubUsername(u); }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-600 transition-colors"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weather Widget */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center text-xl">
              🌤️
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Weather</h2>
              <p className="text-xs text-gray-500">Powered by Open-Meteo — free, no API key needed</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="e.g. London, Tokyo, Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchWeather()}
            />
            <Button
              variant="primary"
              onClick={fetchWeather}
              isLoading={weatherLoading}
              disabled={!city.trim()}
            >
              Get
            </Button>
          </div>

          {weatherError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {weatherError}
            </div>
          )}

          {weatherLoading && <LoadingSpinner />}

          {weatherData && !weatherLoading && (
            <div className="mt-2">
              <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold">{weatherData.location.name}</p>
                    <p className="text-sm opacity-80">{weatherData.location.country}</p>
                    <p className="text-5xl font-black mt-3">
                      {Math.round(weatherData.weather.temperature)}°C
                    </p>
                  </div>
                  <div className="text-6xl">
                    {getWeatherEmoji(weatherData.weather.weather_code)}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="opacity-70">Humidity</p>
                    <p className="font-bold">{weatherData.weather.humidity}%</p>
                  </div>
                  <div>
                    <p className="opacity-70">Wind</p>
                    <p className="font-bold">{Math.round(weatherData.weather.wind_speed)} km/h</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!weatherData && !weatherLoading && !weatherError && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Enter any city name to get live weather</p>
              <div className="flex justify-center gap-2 mt-3 flex-wrap">
                {['London', 'Tokyo', 'New York'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-600 transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">📡 About These Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium mb-1">GitHub API</p>
            <ul className="space-y-1 opacity-80">
              <li>• Public user profiles — no auth required</li>
              <li>• Optional GitHub token for higher rate limits</li>
              <li>• Timeout handling at 30s</li>
              <li>• 60 requests/hour unauthenticated</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Open-Meteo Weather API</p>
            <ul className="space-y-1 opacity-80">
              <li>• Completely free, no API key needed</li>
              <li>• Two-step: geocoding then forecast</li>
              <li>• Timeout handling at 30s</li>
              <li>• Covers worldwide locations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
