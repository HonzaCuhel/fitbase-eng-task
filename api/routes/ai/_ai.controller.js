import { streamObject, streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const insightSchema = z.object({
  insights: z.array(z.object({
    type: z.enum(['warning', 'info', 'suggestion']),
    message: z.string().min(6).max(120),
    recommendedAction: z.string().min(4).max(80),
  })),
})

class Controller {
  async generateDescription(ctx) {
    const { title, type, trainerName, schedule } = ctx.request.body

    if (!title) ctx.throw(400, 'Class title is required')

    const scheduleText = schedule?.length
      ? schedule.map((s) => `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.dayOfWeek]} ${s.startTime}-${s.endTime}`).join(', ')
      : 'Schedule not set'

    const result = streamText({
      model: anthropic('claude-haiku-4-5-20251001'),
      maxTokens: 500,
      system: 'You are a fitness copywriter. Write compelling, concise class descriptions for a gym management platform. Keep descriptions under 3 paragraphs. Be energetic but professional.',
      prompt: `Write a class description for:
- Title: ${title}
- Type: ${type || 'General fitness'}
- Instructor: ${trainerName || 'TBD'}
- Schedule: ${scheduleText}

Write only the description, no title or heading.`,
    })

    ctx.status = 200
    ctx.respond = false
    ctx.res.setHeader('Content-Type', 'text/event-stream')
    ctx.res.setHeader('Cache-Control', 'no-cache')
    ctx.res.setHeader('Connection', 'keep-alive')

    const reader = result.textStream

    for await (const chunk of reader) {
      ctx.res.write(chunk)
    }

    ctx.res.end()
  }

  async enrollmentInsights(ctx) {
    const {
      className,
      classType,
      trainerName,
      capacity,
      enrollmentCount,
      waitlistCount,
      schedule,
      members,
    } = ctx.request.body

    if (!className) ctx.throw(400, 'Class name is required')

    const dayAbbrev = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const scheduleText = schedule?.length
      ? schedule.map((s) => `${dayAbbrev[s.dayOfWeek]} ${s.startTime}-${s.endTime}`).join(', ')
      : 'Schedule not set'

    const confirmedCount = members?.filter((m) => m.status?.confirmation === 1).length || 0
    const pendingCount = members?.filter((m) => m.status?.confirmation === 0).length || 0
    const declinedCount = members?.filter((m) => m.status?.confirmation === -1).length || 0
    const occupancyPercent = capacity > 0 ? Math.round((enrollmentCount / capacity) * 100) : 0

    const result = streamObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: insightSchema,
      system: `You are a gym operations analyst for busy admins who only want high-value insights.
Return 0-3 concise insights.
For each insight:
- message: max 12 words, start with exactly one emoji, include at least one metric (number, %, or ratio)
- recommendedAction: max 8 words, imperative verb first, specific next step
- no long explanations, no filler, no markdown
Quality bar:
- Include an insight only if it changes a decision or priority.
- Do NOT restate obvious facts without action value.
- Prefer the biggest risk/opportunity first.
- If there is no strong signal, return an empty insights array.
Use emoji by type:
- warning -> ⚠️
- info -> ℹ️
- suggestion -> 💡`,
      prompt: `Analyze enrollment for this class and generate insights:
- Class: ${className}
- Type: ${classType || 'General fitness'}
- Trainer: ${trainerName || 'TBD'}
- Schedule: ${scheduleText}
- Capacity: ${enrollmentCount}/${capacity} confirmed${waitlistCount > 0 ? `, ${waitlistCount} waitlisted` : ''}
- Occupancy: ${occupancyPercent}%
- Status breakdown: ${confirmedCount} confirmed, ${pendingCount} pending, ${declinedCount} declined

Generate insights. Examples of the kind of insights that are useful:
- "3 members haven't confirmed - consider sending a reminder"
- "This class is at 90% capacity - you may want to open a waitlist"
- "Thursday sessions have lower attendance than Monday sessions"

Keep every insight short and easy to scan at a glance.`,
    })

    ctx.status = 200
    ctx.respond = false
    ctx.res.setHeader('Content-Type', 'text/plain')
    ctx.res.setHeader('Cache-Control', 'no-cache')
    ctx.res.setHeader('Connection', 'keep-alive')

    for await (const partial of result.partialObjectStream) {
      ctx.res.write(JSON.stringify(partial) + '\n')
    }

    ctx.res.end()
  }
}

export default new Controller()
