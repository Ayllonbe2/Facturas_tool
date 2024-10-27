const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        loadPage: (pageName) => ipcRenderer.invoke('load-page', pageName),
        send: (channel, data) => ipcRenderer.send(channel, data),
        receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
        on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
        once: (channel, func) => ipcRenderer.once(channel, (event, ...args) => func(...args)),

    }
});
