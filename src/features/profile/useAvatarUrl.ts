import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

import { useDI } from '@/src/core/di/DIProvider';
import { TOKENS } from '@/src/core/di/tokens';
import { ProfileRepository } from '@/src/features/profile/data/ProfileRepository';

export function useAvatarUrl(): string | undefined {
  const di = useDI();
  const repository = useMemo(
    () => di.resolve<ProfileRepository>(TOKENS.ProfileRepo),
    [di],
  );
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      repository
        .getProfile()
        .then((profile) => active && setAvatarUrl(profile.avatarUrl))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [repository]),
  );

  return avatarUrl;
}
