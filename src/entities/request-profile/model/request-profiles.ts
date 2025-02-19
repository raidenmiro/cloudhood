import { attach, createEffect, createEvent, createStore, sample } from 'effector';

import { initApp } from '#shared/model';
import { generateId } from '#shared/utils/generateId';

import { Profile } from '../types';
import { loadProfilesFromStorageApi, saveProfilesToBrowserApi } from '../utils';
import {
  $selectedRequestProfile,
  loadSelectedProfileFromStorage,
  setSelectedRequestProfileName,
} from './selected-request-profile';

export const profileAdded = createEvent();
export const profileRemoved = createEvent<Profile['id']>();
export const profileUpdated = createEvent<Profile>();

const profilesSavedToBrowserFx = createEffect(saveProfilesToBrowserApi);
const profilesLoadedFromStorageFx = createEffect(loadProfilesFromStorageApi);

export const $requestProfiles = createStore<Profile[]>([]);

sample({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  filter: ({ profiles, selectedProfile }) =>
    Boolean(selectedProfile) && !profiles.map(p => p.id).includes(selectedProfile),
  fn: ({ profiles }) => profiles.at(-1)?.id ?? '',
  target: setSelectedRequestProfileName,
});

sample({ source: $requestProfiles, target: profilesSavedToBrowserFx });

const profileAddedFx = attach({
  source: $requestProfiles,
  effect: profiles => {
    const addedHeaderId = generateId().toString();

    return {
      profiles: [
        ...profiles,
        { id: addedHeaderId, requestHeaders: [{ id: generateId(), name: '', value: '', disabled: false }] },
      ],
      addedHeaderId,
    };
  },
});
sample({ clock: profileAdded, target: profileAddedFx });
sample({ clock: profileAddedFx.doneData, fn: ({ profiles }) => profiles, target: $requestProfiles });

sample({
  clock: profileAddedFx.doneData,
  fn: ({ addedHeaderId }) => addedHeaderId,
  target: setSelectedRequestProfileName,
});

const profileUpdatedFx = attach({
  source: $requestProfiles,
  effect: (profiles, profile: Profile) => {
    const profileIndex = profiles.findIndex(p => p.id === profile.id);

    return [...profiles.slice(0, profileIndex), profile, ...profiles.slice(profileIndex + 1)];
  },
});
sample({ clock: profileUpdated, target: profileUpdatedFx });
sample({ clock: profileUpdatedFx.doneData, target: $requestProfiles });

const profileRemovedFx = attach({
  source: $requestProfiles,
  effect: (profiles, profileId: Profile['id']) => {
    const profileIndex = profiles.findIndex(p => p.id === profileId);

    return [...profiles.slice(0, profileIndex), ...profiles.slice(profileIndex + 1)];
  },
});
sample({ clock: profileRemoved, target: profileRemovedFx });
sample({ clock: profileRemovedFx.doneData, target: $requestProfiles });

// loading from browser cache
sample({ clock: initApp, target: profilesLoadedFromStorageFx });
sample({ clock: profilesLoadedFromStorageFx.doneData, target: $requestProfiles });
sample({ clock: profilesLoadedFromStorageFx.doneData, target: loadSelectedProfileFromStorage });
