'use client';

import React from 'react';
import { CheckCircle2, FileSignature, Bot, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export function BrandPanel() {
  return (
    <div className="relative flex flex-col justify-between p-8 lg:p-12 text-white hero-wash overflow-hidden min-h-[500px] lg:min-h-full">
      {/* Background glow highlights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--flash)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-700/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Branding Section */}
      <div className="relative z-10 space-y-6 animate-fade-up">
        {/* Prototype Label */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-[var(--flash)]" />
          <span>Interactive Product Preview</span>
        </div>

        {/* Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--flash)] to-[var(--flash-deep)] flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0c1f22"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Flash<span className="text-[var(--flash)] font-black">Sign</span>
          </span>
        </div>

        {/* Headline & Body */}
        <div className="space-y-3 max-w-md">
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
            One workspace.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--flash)] to-emerald-200">
              Every commitment.
            </span>
          </h1>
          <p className="text-sm lg:text-base text-gray-300 leading-relaxed">
            Flash Sign unifies agile project delivery, AI coding agent workflows, and cryptographically verified digital agreements into a single high-velocity platform.
          </p>
        </div>
      </div>

      {/* Decorative Interactive Mockup Graphic */}
      <div className="relative z-10 my-8 space-y-3 max-w-md animate-fade-up-delay-1">
        {/* Card 1: Task Execution */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--flash)]/20 text-[var(--flash)] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">AI Agent Sprint 24</p>
              <p className="text-[11px] text-gray-400">Claude 3.7 Sonnet • PR #142 Ready</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
            Passed Tests
          </span>
        </div>

        {/* Card 2: Document Approval */}
        <div className="p-3.5 rounded-xl bg-white/10 border border-emerald-400/30 backdrop-blur-md shadow-2xl flex items-center justify-between ring-1 ring-emerald-400/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-400/25 text-emerald-200 flex items-center justify-center">
              <FileSignature className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Master Service Agreement</p>
              <p className="text-[11px] text-gray-300">2 of 3 signatures collected</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--flash)] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Audit Valid</span>
          </div>
        </div>

        {/* Card 3: Governance Check */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/20 text-cyan-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Role-Based Access Control</p>
              <p className="text-[11px] text-gray-400">10 demo personas • Instant switching</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
            Active
          </span>
        </div>
      </div>

      {/* Footer Features */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 animate-fade-up-delay-2">
        <span>Zero backend setup required</span>
        <span className="flex items-center gap-1 text-[var(--flash)] font-medium">
          Ready for testing <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
