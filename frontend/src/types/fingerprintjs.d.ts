declare module '@fingerprintjs/fingerprintjs' {
  interface GetResult {
    visitorId: string;
  }
  interface Agent {
    get(): Promise<GetResult>;
  }
  function load(): Promise<Agent>;
  export { load };
}
