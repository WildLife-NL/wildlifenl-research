// What the signed-in researcher may do with an experiment, with the reason printed next to unavailable actions

import { Experiment } from '../types/experiment';
import { User } from '../types/user';
import { ExperimentStatus, getStatus } from './experimentStatus';

export interface ExperimentPermissions {
  status: ExperimentStatus;
  isOwner: boolean;
  canEdit: boolean;
  canStop: boolean;
  canDelete: boolean;
  reasons: {
    edit?: string;
    stop?: string;
    delete?: string;
  };
}

export const getExperimentPermissions = (
  experiment: Experiment,
  user: User | null | undefined,
  now: Date = new Date()
): ExperimentPermissions => {
  const status = getStatus(experiment.start, experiment.end, now);
  const isOwner = !!user && user.ID === experiment.user?.ID;
  const ownerName = experiment.user?.name || 'the owner';

  const notOwner = `Only ${ownerName} can change this experiment`;

  const canEdit = isOwner && status === 'Upcoming';
  const canStop = isOwner && status === 'Live';
  const canDelete = isOwner && status === 'Upcoming';

  return {
    status,
    isOwner,
    canEdit,
    canStop,
    canDelete,
    reasons: {
      edit: canEdit
        ? undefined
        : !isOwner
        ? notOwner
        : 'Details lock once the experiment is live',
      stop: canStop
        ? undefined
        : !isOwner
        ? notOwner
        : status === 'Upcoming'
        ? 'Stop becomes available once the experiment is live'
        : 'The experiment has already ended',
      delete: canDelete
        ? undefined
        : !isOwner
        ? notOwner
        : 'Live and completed experiments keep their data, so they cannot be deleted',
    },
  };
};
