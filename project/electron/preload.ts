import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('versions', {
  process: process,
});

