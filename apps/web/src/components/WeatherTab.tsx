"use client";

import { useState, useEffect } from "react";

const LAT = 32.1875;
const LON = 34.8935;
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=Asia/Jerusalem&forecast_days=5`;

interface CurrentWeather {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
}

interface DailyForecast {
  date: string;
  dayName: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  sunrise: string;
  sunset: string;
}

interface HourlyEntry {
  time: string;
  hour: string;
  temp: number;
  weatherCode: number;
}

function weatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

function weatherLabel(code: number): string {
  if (code === 0) return "בהיר";
  if (code <= 3) return "מעונן חלקית";
  if (code <= 48) return "ערפל";
  if (code <= 57) return "טפטוף";
  if (code <= 67) return "גשם";
  if (code <= 77) return "שלג";
  if (code <= 82) return "ממטרים";
  if (code <= 86) return "שלג";
  if (code <= 99) return "סופות רעמים";
  return "";
}

function windDirection(deg: number): string {
  const dirs = ["צפון", "צפון-מזרח", "מזרח", "דרום-מזרח", "דרום", "דרום-מערב", "מערב", "צפון-מערב"];
  return dirs[Math.round(deg / 45) % 8];
}

function hebrewDay(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "היום";
  if (d.toDateString() === tomorrow.toDateString()) return "מחר";
  return d.toLocaleDateString("he-IL", { weekday: "long" });
}

export default function WeatherTab() {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [hourly, setHourly] = useState<HourlyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setCurrent(data.current);

        const days: DailyForecast[] = data.daily.time.map((t: string, i: number) => ({
          date: t,
          dayName: hebrewDay(t),
          weatherCode: data.daily.weather_code[i],
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          sunrise: data.daily.sunrise[i]?.split("T")[1] ?? "",
          sunset: data.daily.sunset[i]?.split("T")[1] ?? "",
        }));
        setDaily(days);

        const now = new Date();
        const hrs: HourlyEntry[] = data.hourly.time
          .map((t: string, i: number) => ({
            time: t,
            hour: t.split("T")[1]?.slice(0, 5) ?? "",
            temp: Math.round(data.hourly.temperature_2m[i]),
            weatherCode: data.hourly.weather_code[i],
          }))
          .filter((h: HourlyEntry) => new Date(h.time) >= now)
          .slice(0, 24);
        setHourly(hrs);

        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-stone-400">
        <span className="text-5xl mb-3">⚠️</span>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      {/* Current weather */}
      {current && (
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">עכשיו</p>
              <p className="text-5xl font-bold mt-1">{Math.round(current.temperature_2m)}°</p>
              <p className="text-sm opacity-80 mt-1">מרגיש כמו {Math.round(current.apparent_temperature)}°</p>
            </div>
            <div className="text-center">
              <span className="text-6xl">{weatherIcon(current.weather_code)}</span>
              <p className="text-sm mt-1">{weatherLabel(current.weather_code)}</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4 pt-3 border-t border-white/20 text-sm">
            <div className="flex items-center gap-1.5">
              <span>💧</span>
              <span>{current.relative_humidity_2m}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>💨</span>
              <span>{Math.round(current.wind_speed_10m)} קמ״ש</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🧭</span>
              <span>{windDirection(current.wind_direction_10m)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Hourly forecast */}
      {hourly.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-500 mb-2">שעתי</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {hourly.map((h) => (
              <div key={h.time} className="flex-shrink-0 flex flex-col items-center gap-1 bg-white rounded-xl px-3 py-2.5 border border-stone-100 min-w-[60px]">
                <span className="text-xs text-stone-400">{h.hour}</span>
                <span className="text-lg">{weatherIcon(h.weatherCode)}</span>
                <span className="text-sm font-semibold text-stone-700">{h.temp}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily forecast */}
      {daily.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-500 mb-2">תחזית</h3>
          <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
            {daily.map((d) => (
              <div key={d.date} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-[90px]">
                  <span className="text-xl">{weatherIcon(d.weatherCode)}</span>
                  <span className="text-sm font-medium text-stone-700">{d.dayName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-stone-800">{d.tempMax}°</span>
                  <span className="text-stone-300">/</span>
                  <span className="text-stone-400">{d.tempMin}°</span>
                </div>
                <div className="flex gap-2 text-xs text-stone-400">
                  <span>🌅 {d.sunrise}</span>
                  <span>🌇 {d.sunset}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-stone-300 text-center">Open-Meteo · {LAT}°N {LON}°E</p>
    </div>
  );
}
