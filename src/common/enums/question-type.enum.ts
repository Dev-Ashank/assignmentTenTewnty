// The three types of questions we support in contests.
// Each type changes how answers are validated:
// - SINGLE_SELECT: exactly one correct answer
// - MULTI_SELECT: one or more correct answers (order doesn't matter)
// - TRUE_FALSE: boolean choice, essentially a single-select with two options
export enum QuestionType {
  SINGLE_SELECT = 'single_select',
  MULTI_SELECT = 'multi_select',
  TRUE_FALSE = 'true_false',
}
