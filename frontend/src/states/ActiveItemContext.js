import React, { createContext, useState } from 'react';

export const ActiveItemContext = createContext();

export const ActiveItemProvider = ({ children }) => {
    const [activeItem, setActiveItem] = useState(null);

    return (
        <ActiveItemContext.Provider value={{ activeItem, setActiveItem }}>
            {children}
        </ActiveItemContext.Provider>
    );
};
