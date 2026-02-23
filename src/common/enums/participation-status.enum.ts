// Tracks where a user is in their contest attempt.
// IN_PROGRESS means they joined but haven't submitted yet (they can still answer).
// SUBMITTED means they're done — score is final and can't be changed.
export enum ParticipationStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
}
