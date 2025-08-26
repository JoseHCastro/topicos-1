export interface SeederInterface {
  run(): Promise<void>;
  clear(): Promise<void>;
}
