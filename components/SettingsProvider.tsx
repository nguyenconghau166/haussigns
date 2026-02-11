'use client';

import { createContext, useContext, ReactNode, useState } from 'react';

type Settings = Record<string, string>;

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Settings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({
    children,
    initialSettings
}: {
    children: ReactNode;
    initialSettings: Settings;
}) {
    const [settings, setSettings] = useState<Settings>(initialSettings);

    const updateSettings = (newSettings: Settings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettingsContext() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
}
