import { useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import type { ProgressWeekly } from '../types/progress'

const moodLabels = ['HAPPY', 'CALM', 'NEUTRAL', 'SAD', 'ANXIOUS'] as const

const moodColors: Record<string, string> = {
  HAPPY: '#3BBFA3',
  CALM: '#8B6FBE',
  NEUTRAL: '#F5A623',
  SAD: '#4A90D9',
  ANXIOUS: '#E85D75',
}

const moodScoreLabel: Record<number, string> = {
  1: 'Anxious',
  2: 'Sad',
  3: 'Neutral',
  4: 'Calm',
  5: 'Happy',
}

export default function ProgressPage() {
  const reportRef = useRef<HTMLDivElement | null>(null)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const progressQuery = useQuery({
    queryKey: ['progress-weekly'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await api.get<ProgressWeekly>('/progress/weekly')
      return data
    },
  })

  const exportPdf = async () => {
    if (!reportRef.current) return
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: '#FAFAFA',
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const width = pdf.internal.pageSize.getWidth()
    const height = (canvas.height * width) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, width, height)
    pdf.save('Serenify-Report.pdf')
  }

  const moodDistribution = useMemo(() => {
    if (!progressQuery.data) return []
    return moodLabels.map((label) => ({
      name: label,
      value: progressQuery.data?.moodBreakdown[label] ?? 0,
    }))
  }, [progressQuery.data])

  const dateRangeLabel = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)
    const format = (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${format(start)} - ${format(end)}`
  }, [])

  if (progressQuery.isLoading) {
    return (
      <div className="rounded-[20px] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
        <div className="h-24 rounded-[16px] bg-[var(--bg-secondary)] animate-pulse" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-[20px] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Sign in to view your progress.
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Log moods, complete exercises, and check in to unlock your weekly report.
        </p>
      </div>
    )
  }

  if (progressQuery.isError || !progressQuery.data) {
    return (
      <div className="rounded-[20px] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Unable to load progress report.
        </p>
        <button
          type="button"
          onClick={() => progressQuery.refetch().catch(() => toast.error('Unable to refresh report'))}
          className="mt-4 rounded-full bg-[linear-gradient(135deg,_#3BBFA3,_#2DA58B)] px-4 py-2 text-xs font-semibold text-white"
        >
          Retry
        </button>
      </div>
    )
  }

  const progress = progressQuery.data
  const hasData =
    progress.totalExercises + progress.totalMoodLogs + progress.checklistRate > 0
  const totalMoodLogs = progress.totalMoodLogs
  const moodDistributionEmpty = moodDistribution.every((item) => item.value === 0)
  const exerciseMinutesEmpty =
    progress.exerciseByDay.every((entry) => entry.minutes === 0)
  const insightText =
    progress.totalMoodLogs > 0
      ? `You logged ${progress.totalMoodLogs} moods this week. Keep building those daily check-ins.`
      : 'Start logging a mood each day to unlock your personalized insight.'

  return (
    <div
      className="rounded-[20px] p-6"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Your Progress</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">This week at a glance</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{dateRangeLabel}</p>
      </div>

      {!hasData ? (
        <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-10 text-center shadow-[var(--card-shadow)]">
          <svg viewBox="0 0 200 120" className="mx-auto h-24 w-24">
            <rect x="20" y="50" width="18" height="40" rx="6" fill="#E8E2F8" />
            <rect x="50" y="38" width="18" height="52" rx="6" fill="#C9B8E8" />
            <rect x="80" y="24" width="18" height="66" rx="6" fill="#8B6FBE" />
            <circle cx="140" cy="44" r="18" fill="#3BBFA3" />
            <path d="M130 68 C138 62 146 62 154 68" stroke="#3BBFA3" strokeWidth="4" fill="none" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">No data yet</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Start logging your mood and completing exercises to see your weekly progress here.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => toast('Log a mood from your dashboard.')}
              className="rounded-full bg-[linear-gradient(135deg,_#3BBFA3,_#2DA58B)] px-4 py-2 text-xs font-semibold text-white"
            >
              Log Mood
            </button>
            <button
              type="button"
              onClick={() => toast('Try a guided exercise to start.')}
              className="rounded-full border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)]"
            >
              Try an Exercise
            </button>
          </div>
        </div>
      ) : (
        <div ref={reportRef} className="grid gap-6">
          <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-lg">✨</div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">AI Insight</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{insightText}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {[
              { label: 'Exercises Done', value: progress.totalExercises },
              { label: 'Minutes Meditated', value: progress.minutesMeditated },
              { label: 'Moods Logged', value: totalMoodLogs },
              { label: 'Tasks Done', value: progress.checklistRate },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]"
              >
                <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Mood Distribution</p>
              <div className="relative mt-4 h-[300px]">
                {moodDistributionEmpty ? (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
                    No mood data this week
                  </div>
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={moodDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {moodDistribution.map((entry) => (
                          <Cell key={entry.name} fill={moodColors[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {!moodDistributionEmpty && (
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {moodDistribution.map((item) => (
                    <span
                      key={item.name}
                      className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-[var(--text-secondary)]"
                    >
                      {item.name}: {item.value}%
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)] lg:col-span-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Mood Trend</p>
              <div className="mt-4 h-[300px]">
                <ResponsiveContainer>
                  <LineChart data={progress.moodTrend}>
                    <XAxis
                      dataKey="day"
                      tick={{ fill: 'var(--text-secondary)' }}
                      axisLine={{ stroke: 'var(--border-color)' }}
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 3, 5]}
                      tickFormatter={(value) => moodScoreLabel[value] ?? value}
                      tick={{ fill: 'var(--text-secondary)' }}
                      axisLine={{ stroke: 'var(--border-color)' }}
                    />
                    <Tooltip formatter={(value: number) => moodScoreLabel[value] ?? value} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3BBFA3"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Exercise Minutes</p>
            <div className="mt-4 h-[300px]">
              {exerciseMinutesEmpty ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
                  No exercises this week
                </div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={progress.exerciseByDay} barSize={26}>
                    <XAxis
                      dataKey="day"
                      tick={{ fill: 'var(--text-secondary)' }}
                      axisLine={{ stroke: 'var(--border-color)' }}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-secondary)' }}
                      axisLine={{ stroke: 'var(--border-color)' }}
                    />
                    <Tooltip />
                    <Bar dataKey="minutes" fill="#8B6FBE" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Share your report</p>
              <p className="text-xs text-[var(--text-muted)]">
                Download a PDF summary of your week.
              </p>
            </div>
            <button
              type="button"
              onClick={exportPdf}
              className="rounded-full bg-[linear-gradient(135deg,_#3BBFA3,_#2DA58B)] px-4 py-2 text-xs font-semibold text-white"
            >
              Export PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
