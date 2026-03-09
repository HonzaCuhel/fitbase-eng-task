import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

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
}

export default new Controller()
