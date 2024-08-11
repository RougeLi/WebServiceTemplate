export interface IApplication {
  initialize: () => Promise<void>;
  start: () => Promise<void>;
}
