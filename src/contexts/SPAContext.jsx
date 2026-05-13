import { createContext, useContext } from 'react';

export const SPAContext = createContext(false);
export const useInSPA = () => useContext(SPAContext);
