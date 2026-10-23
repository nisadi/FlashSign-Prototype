'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PenTool, Trash2, Info } from 'lucide-react';
import { useApp, useCurrentUser } from '@/context/app-context';
import {
  SettingsPage, SettingsCard, SaveButton, SavedNote, useSavedFlash,
} from '@/components/settings/settings-layout';
import { SignatureEditor, isCompleteDraft, initialsFromName } from '@/components/signature/signature-editor';
import { SignatureMark, type SignatureDraft } from '@/components/signature/signature-mark';

export default function MySignaturePage() {
  const { savedSignatures, saveSignature, deleteSignature, signingDefaults } = useApp();
  const user = useCurrentUser();
  const [saved, flashSaved] = useSavedFlash();

  const current = savedSignatures.find(s => s.userId === user?.id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SignatureDraft | null>(null);

  if (!user) return null;

  const startEditing = () => {
    setDraft(
      current ?? {
        name: user.name,
        initials: initialsFromName(user.name),
        source: signingDefaults.allowedSignatureMethods[0] ?? 'type',
        styleId: 'script',
      }
    );
    setEditing(true);
  };

  const handleSave = () => {
    if (!draft || !isCompleteDraft(draft)) return;
    saveSignature({ ...draft, userId: user.id, updatedAt: new Date().toISOString() });
    setEditing(false);
    flashSaved();
  };

  const handleDelete = () => {
    if (!confirm('Delete your saved signature? You can create a new one at any time.')) return;
    deleteSignature(user.id);
    setEditing(false);
  };

  return (
    <SettingsPage
      title="My Signature"
      description="Your signature and initials are filled in automatically whenever you sign a document."
    >
      {!editing ? (
        <SettingsCard
          title="Saved signature"
          icon={PenTool}
          footer={
            <>
              <SavedNote show={saved} text="Signature saved" />
              {current && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="mr-auto flex items-center gap-1 text-xs font-semibold text-muted hover:text-danger"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
              <SaveButton onClick={startEditing}>{current ? 'Change signature' : 'Create signature'}</SaveButton>
            </>
          }
        >
          {current ? (
            <div className="flex flex-wrap items-end gap-10 px-5 py-4 rounded-lg bg-paper border border-line">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Signature</p>
                <SignatureMark signature={current} size="lg" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Initials</p>
                <SignatureMark signature={current} variant="initials" size="lg" />
              </div>
              <p className="ml-auto text-muted">
                {current.source === 'type' ? 'Typed' : current.source === 'draw' ? 'Drawn' : 'Uploaded'} ·
                updated {new Date(current.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          ) : (
            <p className="text-muted py-4 text-center">
              You haven&apos;t saved a signature yet. Create one now, or you&apos;ll be asked the first time you sign.
            </p>
          )}
        </SettingsCard>
      ) : (
        draft && (
          <SettingsCard
            title={current ? 'Change your signature' : 'Create your signature'}
            description="Type it in one of four styles, draw it, or upload an image."
            icon={PenTool}
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-lg border border-line bg-paper-elevated hover:bg-mist text-xs font-semibold text-ink"
                >
                  Cancel
                </button>
                <SaveButton disabled={!isCompleteDraft(draft)} onClick={handleSave}>Save signature</SaveButton>
              </>
            }
          >
            <SignatureEditor value={draft} onChange={setDraft} allowedMethods={signingDefaults.allowedSignatureMethods} />
          </SettingsCard>
        )
      )}

      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-mist/30 border border-line text-xs text-muted">
        <Info className="w-4 h-4 text-flash-deep shrink-0 mt-0.5" />
        <p>
          While signing, you can use a different signature for that one document with <strong className="text-ink">Change signature</strong>,
          and choose whether to keep it as your saved signature. Company seals are managed separately under{' '}
          <Link href="/signatures/settings" className="font-semibold text-flash-deep hover:underline">Agreements › Settings</Link>.
        </p>
      </div>
    </SettingsPage>
  );
}
