'use client';

import { useCallback, useMemo, useState } from 'react';

type SignEditorMode = 'create' | 'edit';

type ClosedSignEditorSession = {
  open: false;
  mode: SignEditorMode;
  draft: undefined;
};

type OpenSignEditorSession<TDraft> = {
  open: true;
  mode: SignEditorMode;
  draft: TDraft;
};

export type SignEditorSession<TDraft> =
  | ClosedSignEditorSession
  | OpenSignEditorSession<TDraft>;

export function useSignEditorSession<TDraft>() {
  const [session, setSession] = useState<SignEditorSession<TDraft>>({
    open: false,
    mode: 'create',
    draft: undefined,
  });

  const startCreate = useCallback((draft: TDraft) => {
    setSession({
      open: true,
      mode: 'create',
      draft,
    });
  }, []);

  const startEdit = useCallback((draft: TDraft) => {
    setSession({
      open: true,
      mode: 'edit',
      draft,
    });
  }, []);

  const close = useCallback(() => {
    setSession((current) => ({
      open: false,
      mode: 'create',
      draft: undefined,
    }));
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setSession({
        open: false,
        mode: 'create',
        draft: undefined,
      });
    }
  }, []);

  const setDraft = useCallback((draft: TDraft | undefined) => {
    setSession((current) => {
      if (!draft) {
        return {
          open: false,
          mode: 'create',
          draft: undefined,
        };
      }

      return {
        open: current.open,
        mode: current.mode,
        draft,
      } as SignEditorSession<TDraft>;
    });
  }, []);

  return useMemo(
    () => ({
      session,
      open: session.open,
      mode: session.mode,
      draft: session.draft,
      startCreate,
      startEdit,
      close,
      handleOpenChange,
      setDraft,
    }),
    [close, handleOpenChange, session, setDraft, startCreate, startEdit]
  );
}
