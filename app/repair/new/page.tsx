'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { BroncoAssistant } from '@/components/BroncoAssistant'
import { createCase, createMedia, startRun } from '@/lib/api/client'
import type { CaseCategory, Urgency } from '@/lib/types/agents'

const MAX_MEDIA = 3
const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8 MB

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

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
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'creating' | 'uploading' | 'starting'>('idle')
  const [error, setError] = useState<string | null>(null)
  const symptomsLength = symptoms.length

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    const oversized = picked.filter((f) => f.size > MAX_FILE_BYTES)
    if (oversized.length) {
      setError(`Each photo must be under 8 MB. "${oversized[0].name}" is too large.`)
      e.target.value = ''
      return
    }
    const combined = [...mediaFiles, ...picked].slice(0, MAX_MEDIA)
    setMediaFiles(combined)
    setError(null)
    e.target.value = ''
  }

  function removeMedia(idx: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!symptoms.trim()) return

    setSubmitting(true)
    setSubmitPhase('creating')
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

      // Upload media files (if any) as data URLs
      if (mediaFiles.length > 0) {
        setSubmitPhase('uploading')
        for (const file of mediaFiles) {
          const dataUrl = await fileToDataUrl(file)
          await createMedia(newCase.id, { url: dataUrl, mediaType: 'image' })
        }
      }

      // Kick off the analysis run before redirecting
      setSubmitPhase('starting')
      await startRun(newCase.id)

      router.push(`/repair/${newCase.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case. Please try again.')
      setSubmitting(false)
      setSubmitPhase('idle')
    }
  }

  const submitLabel =
    submitPhase === 'creating' ? 'Creating Case…'
    : submitPhase === 'uploading' ? `Uploading Photos (${mediaFiles.length})…`
    : submitPhase === 'starting' ? 'Starting Analysis…'
    : 'Get Repair Verdict →'

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

        {/* Billy welcome card */}
        <div className="bg-white border border-[#e2e3db] rounded-xl px-5 py-3 flex items-center justify-between shadow-[0px_4px_10px_rgba(27,67,50,0.04)]">
          <BroncoAssistant
            runStatus={submitting ? "running" : undefined}
            currentPhase={
              submitting && submitPhase === 'uploading' ? 'intake'
              : submitting && submitPhase === 'starting' ? 'orchestrator'
              : undefined
            }
          />
          <div className="flex flex-col items-end gap-0.5 pr-2">
            <span className="font-semibold text-[#1a1c18] text-sm">Billy Bronco</span>
            <span className="text-[#717973] text-xs">
              {symptomsLength > 20
                ? 'Great detail — more is better!'
                : symptomsLength > 0
                  ? 'Keep going...'
                  : 'Tell me what\'s broken'}
            </span>
          </div>
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

          {/* Photo Upload */}
          <div className="flex flex-col gap-3">
            <label className="font-semibold text-[#1a1c18] text-sm tracking-[0.4px] uppercase">
              Photos{' '}
              <span className="text-[#717973] font-normal normal-case">(optional, up to {MAX_MEDIA})</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {mediaFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="relative w-24 h-24 rounded-xl border border-[#e2e3db] overflow-hidden bg-[#f3f4ec] group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#1a1c18]/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {mediaFiles.length < MAX_MEDIA && (
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-[#c1c8c2] bg-white hover:border-[#1b4332] hover:bg-[#f3f4ec] cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="#717973" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[#717973] text-xs text-center leading-tight px-1">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMediaChange}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
            {mediaFiles.length > 0 && (
              <p className="text-[#717973] text-xs">
                {mediaFiles.length}/{MAX_MEDIA} photo{mediaFiles.length !== 1 ? 's' : ''} selected
              </p>
            )}
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
                {submitLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
