export interface IElectronAPI {
  showDialog: (msg: string) => Promise<void>
}

declare global {
  interface Window {
    api: IElectronAPI
  }
}
