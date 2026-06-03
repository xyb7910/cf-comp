import React, { useState } from "react";
import { CFUser, CFRatingChange } from "../types";
import { getRankTier, CFRankTier } from "../utils";
import { Trophy, Award, Calendar, Layers, MapPin, Building2, TrendingUp, Sparkles, TrendingDown } from "lucide-react";

interface UserProfileProps {
  user: CFUser;
  ratingHistory: CFRatingChange[];
  platform?: string;
}

export default function UserProfile({ user, ratingHistory, platform = "codeforces" }: UserProfileProps) {
  const [hoveredPoint, setHoveredPoint] = useState<CFRatingChange | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 安全获取用户值，避免undefined错误
  const safeUser = {
    rating: user?.rating ?? 0,
    maxRating: user?.maxRating ?? 0,
    rank: user?.rank ?? "",
    maxRank: user?.maxRank ?? "",
    handle: user?.handle ?? "unknown",
    registrationTimeSeconds: user?.registrationTimeSeconds ?? Math.floor(Date.now() / 1000) - 86400 * 365,
    lastOnlineTimeSeconds: user?.lastOnlineTimeSeconds ?? Math.floor(Date.now() / 1000),
    contribution: user?.contribution ?? 0,
    friendOfCount: user?.friendOfCount ?? 0,
    avatar: user?.avatar ?? "https://img.atcoder.jp/assets/icon/avatar.png",
    titlePhoto: user?.titlePhoto ?? "https://img.atcoder.jp/assets/icon/avatar.png",
    organization: user?.organization ?? "Competitive Programmer",
    city: user?.city,
    country: user?.country,
  };

  const tier = getRankTier(safeUser.rating, safeUser.rank, platform);
  const maxTier = getRankTier(safeUser.maxRating, safeUser.maxRank, platform);

  // Parse Registration date
  const registrationDate = new Date(safeUser.registrationTimeSeconds * 1000).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate Streak or submission info
  const ratingMovements = (ratingHistory || []).length;
  
  // SVG Rating timeline calculations
  const chartHeight = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  let svgElements = null;
  
  // 安全检查：确保ratingHistory是数组且有有效数据
  const safeRatingHistory = Array.isArray(ratingHistory) ? ratingHistory : [];
  const validRatingHistory = safeRatingHistory.filter(r => 
    r && typeof r.newRating === 'number' && typeof r.ratingUpdateTimeSeconds === 'number'
  );
  
  if (validRatingHistory.length > 0) {
    const ratings = validRatingHistory.map(r => r.newRating);
    const minRatingInHistory = Math.min(...ratings, 1000);
    const maxRatingInHistory = Math.max(...ratings, 1500, safeUser.maxRating);
    
    const minY = Math.floor(minRatingInHistory / 100) * 100 - 100;
    const maxY = Math.ceil(maxRatingInHistory / 100) * 100 + 100;
    const rangeY = maxY - minY || 1; // 避免除零

    const timestamps = validRatingHistory.map(r => r.ratingUpdateTimeSeconds);
    const minX = Math.min(...timestamps);
    const maxX = Math.max(...timestamps);
    const rangeX = maxX - minX || 1;

    // Build points for SVG (responsive layout)
    // We'll map coordinates inside a 1000x240 viewPort
    const viewWidth = 1000;
    const plotWidth = viewWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const points = validRatingHistory.map((history, idx) => {
      const x = padding.left + ((history.ratingUpdateTimeSeconds - minX) / rangeX) * plotWidth;
      const y = chartHeight - padding.bottom - ((history.newRating - minY) / rangeY) * plotHeight;
      return { x, y, ...history, index: idx };
    });

    // Make line path
    let linePath = "";
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    }

    // Horizontal grid lines
    const gridLines = [];
    const step = Math.max(100, Math.round(rangeY / 5 / 100) * 100);
    for (let level = minY + step; level < maxY; level += step) {
      const y = chartHeight - padding.bottom - ((level - minY) / rangeY) * plotHeight;
      gridLines.push(level);
    }

    // Get color for rating lines based on position
    const getPointColor = (rating: number) => {
      return getRankTier(rating, "", platform).color;
    };

    svgElements = (
      <div className="relative">
        <svg viewBox={`0 0 ${viewWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
          {/* Definitions for drop shadow */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1" floodColor="#334155" />
            </filter>
          </defs>

          {/* Grids / Tiers Background */}
          {gridLines.map((level) => {
            const y = chartHeight - padding.bottom - ((level - minY) / rangeY) * plotHeight;
            const currentTier = getRankTier(level, "", platform);
            return (
              <g key={level}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={viewWidth - padding.right}
                  y2={y}
                  stroke={currentTier.color}
                  strokeOpacity="0.08"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="font-mono text-[10px] text-slate-400 font-medium"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          {points.length > 0 && (
            <path
              d={`${linePath} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${points[0].x} ${chartHeight - padding.bottom} Z`}
              fill="url(#chartGradient)"
            />
          )}

          {/* Line string */}
          <path
            d={linePath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#shadow)"
          />

          {/* Draw dots with respective tier colors */}
          {points.map((p, idx) => {
            const isHovered = hoverIndex === idx;
            const dotColor = getPointColor(p.newRating);
            return (
              <circle
                id={`rating-point-${idx}`}
                key={p.contestId + "-" + idx}
                cx={p.x}
                cy={p.y}
                r={isHovered ? 7 : 4}
                fill="#ffffff"
                stroke={dotColor}
                strokeWidth={isHovered ? 4 : 2.5}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => {
                  setHoveredPoint(p);
                  setHoverIndex(idx);
                }}
                onMouseLeave={() => {
                  setHoveredPoint(null);
                  setHoverIndex(null);
                }}
              />
            );
          })}

          {/* X Axis endpoints */}
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={viewWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Horizontal X axis label dates */}
          {points.length > 0 && (
            <>
              {/* First contest */}
              <text
                x={points[0].x}
                y={chartHeight - padding.bottom + 18}
                textAnchor="start"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {new Date(points[0].ratingUpdateTimeSeconds * 1000).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                })}
              </text>
              
              {/* Mid contest if exists */}
              {points.length > 2 && (
                <text
                  x={points[Math.floor(points.length / 2)].x}
                  y={chartHeight - padding.bottom + 18}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {new Date(points[Math.floor(points.length / 2)].ratingUpdateTimeSeconds * 1000).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "2-digit",
                  })}
                </text>
              )}

              {/* Latest contest */}
              <text
                x={points[points.length - 1].x}
                y={chartHeight - padding.bottom + 18}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {new Date(points[points.length - 1].ratingUpdateTimeSeconds * 1000).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                })}
              </text>
            </>
          )}
        </svg>

        {/* Hover details card */}
        {hoveredPoint && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-xl shadow-lg px-4 py-2.5 max-w-sm text-xs border border-slate-700 pointer-events-none z-10 transition duration-150">
            <div className="font-semibold text-amber-400 truncate mb-1">
              🏆 {hoveredPoint.contestName}
            </div>
            <div className="flex items-center justify-between gap-4 font-mono">
              <span className="text-slate-300">
                排名: <strong className="text-white">#{hoveredPoint.rank}</strong>
              </span>
              <span className="text-slate-300">
                Rating变动:{" "}
                <strong className={hoveredPoint.newRating >= hoveredPoint.oldRating ? "text-emerald-400" : "text-rose-400"}>
                  {hoveredPoint.oldRating} → {hoveredPoint.newRating} (
                  {hoveredPoint.newRating >= hoveredPoint.oldRating ? "+" : ""}
                  {hoveredPoint.newRating - hoveredPoint.oldRating})
                </strong>
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              更新时间: {new Date(hoveredPoint.ratingUpdateTimeSeconds * 1000).toLocaleDateString("zh-CN")}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col gap-6 p-6 md:p-8">
      {/* Upper Row: Profile Meta Details */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Large Avatar */}
        <div className="relative group flex-shrink-0">
          <div className="absolute inset-0 bg-linear-to-tr from-amber-500 to-rose-500 rounded-2xl blur-xs opacity-60 group-hover:scale-105 transition duration-200"></div>
          <img
            src={safeUser.titlePhoto || safeUser.avatar || "https://placekitten.com/150/150"}
            alt={safeUser.handle}
            className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white shadow-md"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 text-amber-400 px-2 py-0.5 rounded-md text-[10px] font-mono shadow-xs">
            {safeUser.contribution >= 0 ? "+" : ""}
            {safeUser.contribution} contrib
          </div>
        </div>

        {/* User Stats detail */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{safeUser.handle}</h1>
            <span className={`px-2.5 py-1 text-xs rounded-full border border-current font-bold uppercase ${tier.bgClass}`}>
              {tier.name}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-sm text-slate-600 mt-4">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>当前分: <strong className="text-slate-800 font-mono text-base">{safeUser.rating}</strong></span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>历史最高分: <strong className="text-slate-800 font-mono text-base">{safeUser.maxRating}</strong></span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Award className="w-4 h-4 text-purple-500" />
              <span>最高段位: <span className={`${maxTier.className} text-xs font-semibold`}>{safeUser.maxRank || "N/A"}</span></span>
            </div>
            
            {safeUser.organization && (
              <div className="flex items-center gap-2 justify-center md:justify-start col-span-2 md:col-span-1">
                <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="truncate">组织: <strong className="text-slate-800" title={safeUser.organization}>{safeUser.organization}</strong></span>
              </div>
            )}
            {(safeUser.city || safeUser.country) && (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>地区: <strong className="text-slate-800">{[safeUser.city, safeUser.country].filter(Boolean).join(", ")}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>入驻时间: <strong className="text-slate-800">{registrationDate}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG graph section */}
      <div className="border-t border-slate-100 pt-6">
        <div className="flex flex-col sm:flex-row items-baseline justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 text-base">Rating 历史成长曲线</h3>
            <span className="text-xs text-slate-400 font-mono">({ratingMovements} 场排位赛)</span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            鼠标悬浮每个切点查看排位赛分数起伏
          </span>
        </div>

        {ratingHistory.length > 0 ? (
          <div className="p-2 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
            {svgElements}
          </div>
        ) : (
          <div className="py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
            该用户目前还没有打过任何 Codeforces Rated 排位赛 🛌
          </div>
        )}
      </div>
    </div>
  );
}
