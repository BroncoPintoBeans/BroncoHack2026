'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createCase } from '@/lib/api/client'
import type { CaseCategory, Urgency } from '@/lib/types/agents'

const CATEGORIES: { value: CaseCategory; label: string; emoji: string }[] = [
  { value: 'laptop', label: 'Laptop', emoji: '💻' },
  { value: 'bicycle', label: 'Bicycle', emoji: '🚲' },
  { value: 'scooter', label: 'Scooter', emoji: '🛴' },
  { value: 'mini_fridge', label: 'Mini Fridge', emoji: '🧊' },
]

const URGENCIES: { value: Urgency; label: string; desc: string }[] = [
  { value: 'low', label: 'Low', desc: 'Not urgent, no rush' },
  { value: 'normal', label: 'Normal', desc: 'Needed within a few days' },
  { value: 'urgent', label: 'Urgent', desc: 'Needed immediately' },
]

export default function NewRepairPage() {
  const router = useRouter()
  const [category, setCategory] = useState<CaseCategory>('laptop')
  const [symptoms, setSymptoms] = useState('')
  const [urgency, setUrgency] = useState<Urgency>('normal')
  const [modelNumber, setModelNumber] = useState('')
  const [quoteStr, setQuoteStr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!symptoms.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const quoteCents = quoteStr.trim()
        ? Math.round(parseFloat(quoteStr.trim()) * 100)
        : undefined

      const { case: newCase } = await createCase({
        category,
        symptoms: symptoms.trim(),
        urgency,
        ...(modelNumber.trim() ? { modelNumber: modelNumber.trim() } : {}),
        ...(quoteCents != null && !isNaN(quoteCents) ? { quoteCents } : {}),
      })

      router.push(`/repair/${newCase.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <div className="max-w-[680px] mx-auto px-6 py-12 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <Link href="/dashboard" className="text-[#1b4332] text-sm font-semibold hover:underline w-fit">← Back to Dashboard</Link>
          <h1 className="font-bold text-[#012d1d] text-[32px] tracking-[-0.64px]">New Repair Case</h1>
          <p className="text-[#414844] text-lg">Describe your broken item and our AI will assess whether it&apos;s worth repairing.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Category */}
          <div className="flex flex-col gap-3">
            <label className="font-semibold text-[#1a1c18] text-sm tracking-[0.4px] uppercase">Item Category</label>
            <div className="grid grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    category === cat.value
                      ? 'border-[#1b4332] bg-[#1b4332]/5'
                      : 'border-[#e2e3db] bg-white hover:border-[#1b4332]/40'
                  }`}
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <span className={`text-xs font-semibold tracking-[0.4px] ${category === cat.value ? 'text-[#1b4332]' : 'text-[#414844]'}`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div className="flex flex-col gap-2">
            <label htmlFor="symptoms" className="font-semibold text-[#1a1c18] text-sm tracking-[0.4px] uppercase">
              Describe the Problem <span className="text-red-500">*</span>
            </label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              required
              rows={4}
              placeholder="e.g. Screen flickers when I open the lid past 90 degrees. The hinge feels loose."
              className="border border-[#c1c8c2] rounded-xl px-4 py-3 text-[#1a1c18] text-sm placeholder:text-[#9aa09b] focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 resize-none bg-white"
            />
          </div>

          {/* Urgency */}
          <div className="flex flex-col gap-3">
            <label className="font-semibold text-[#1a1c18] text-sm tracking-[0.4px] uppercase">Urgency</label>
            <div className="grid grid-cols-3 gap-3">
              {URGENCIES.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgency(u.value)}
                  className={`flex flex-col gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                    urgency === u.value
                      ? 'border-[#1b4332] bg-[#1b4332]/5'
                      : 'border-[#e2e3db] bg-white hover:border-[#1b4332]/40'
                  }`}
                >
                  <span className={`text-sm font-semibold ${urgency === u.value ? 'text-[#1b4332]' : 'text-[#1a1c18]'}`}>{u.label}</span>
                  <span className="text-xs text-[#717973]">{u.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="modelNumber" className="font-semibold text-[#1a1c18] text-sm tracking-[0.4px] uppercase">
                Model Number <span className="text-[#717973] font-normal normal-case">(optional)</span>
              </label>
              <input
                id="modelNumber"
                type="text"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="e.g. MacBook Pro A2141"
                className="border border-[#c1c8c2] rounded-xl px-4 py-3 text-[#1a1c18] text-sm placeholder:text-[#9aa09b] focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 bg-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="quote" className="font-semibold text-[#1a1c18] text-sm tracking-[0.4px] uppercase">
                Repair Quote ($) <span className="text-[#717973] font-normal normal-case">(optional)</span>
              </label>
              <input
                id="quote"
                type="number"
                min="0"
                step="0.01"
                value={quoteStr}
                onChange={(e) => setQuoteStr(e.target.value)}
                placeholder="e.g. 45.00"
                className="border border-[#c1c8c2] rounded-xl px-4 py-3 text-[#1a1c18] text-sm placeholder:text-[#9aa09b] focus:outline-none focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/10 bg-white"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !symptoms.trim()}
            className="bg-[#1b4332] text-white font-semibold text-sm tracking-[0.6px] px-6 py-4 rounded-full shadow-[0px_4px_6px_rgba(27,67,50,0.15)] hover:bg-[#012d1d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating Case…
              </>
            ) : (
              'Get Repair Verdict →'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
