"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, X, Loader2, Sparkles } from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  text: string
  time: string
}

function generateSuggestionResponse(prompt: string): string {
  const p = prompt.toLowerCase()
  const lines: string[] = []

  if (/diet|meal|nutrition|eat/.test(p)) {
    lines.push("Here’s a simple 3-step meal guide:")
    lines.push("- Breakfast: Oats + 1 scoop protein + berries")
    lines.push("- Lunch: 1 cup rice/roti + 150g chicken/tofu + salad")
    lines.push("- Dinner: 2 eggs/200g paneer + veggies + 1 fruit")
    lines.push("Hydrate 2–3L/day. 80/20 rule: mostly whole foods, some flexibility.")
  }

  if (/(lose|fat)\s*(weight)?|cut|deficit/.test(p)) {
    lines.push("Fat-loss basics:")
    lines.push("- Create a 300–500 kcal deficit")
    lines.push("- 3x/week full-body strength + 2x/week 20–30 min cardio")
    lines.push("- Protein target: 1.6–2.2g/kg bodyweight")
  }

  if (/(gain|build).*muscle|bulk|hypertrophy|strength/.test(p)) {
    lines.push("Muscle-gain plan:")
    lines.push("- 4-day Upper/Lower split, progressive overload")
    lines.push("- Calories: 200–300 kcal surplus, protein 1.8–2.2g/kg")
    lines.push("- Sleep: 7–9 hours, track lifts weekly")
  }

  if (/cardio|run|hiit|endurance/.test(p)) {
    lines.push("Cardio suggestions:")
    lines.push("- 2x steady runs (20–30 min Z2) + 1x HIIT (8x 30s fast/60s easy)")
  }

  if (/schedule|plan|routine|program|week/.test(p)) {
    lines.push("Sample weekly plan:")
    lines.push("Mon: Upper • Tue: Lower • Wed: Rest/Walk • Thu: Upper • Fri: Lower • Sat: Cardio/Steps • Sun: Rest")
  }

  if (/posture|form|technique|injury|pain|hurt/.test(p)) {
    lines.push("Form tips:")
    lines.push("- Film from 45° side to check back/knee/hip alignment")
    lines.push("- Warm up joints, start light, stop if sharp pain")
  }

  if (lines.length === 0) {
    lines.push("Got it! Tell me your goal (fat-loss, muscle gain, endurance), and equipment/time available. I’ll suggest a plan.")
  }

  return lines.join("\n")
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "intro",
    role: "assistant",
    text: "Hi! I'm your FitBudd Coach. Ask about workouts, diet, or schedules.",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  const send = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setSending(true)

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    setMessages((m) => [...m, userMsg])
    setInput("")

    await new Promise((r) => setTimeout(r, 350))
    const reply: ChatMessage = {
      id: String(Date.now() + 1),
      role: "assistant",
      text: generateSuggestionResponse(trimmed),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    setMessages((m) => [...m, reply])
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && (
        <Button 
          onClick={() => setOpen(true)} 
          className="rounded-full h-12 w-12 p-0 shadow-lg bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 text-white"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}

      {open && (
        <Card className="w-80 sm:w-96 shadow-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-base text-gray-900 dark:text-gray-100">FitBudd Coach</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={scrollRef} className="max-h-80 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                    m.role === "user" 
                      ? "bg-purple-600 dark:bg-purple-700 text-white" 
                      : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  }`}>
                    <div>{m.text}</div>
                    <div className={`text-[10px] mt-1 ${
                      m.role === "user" 
                        ? "text-purple-200 dark:text-purple-300" 
                        : "text-gray-500 dark:text-gray-400"
                    }`}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 flex gap-2 items-center bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={handleKey} 
                placeholder="Ask about workouts, diet..." 
                className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400" 
              />
              <Button 
                onClick={send} 
                disabled={!input.trim() || sending} 
                className="px-3 bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 text-white"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


