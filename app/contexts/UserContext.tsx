// contexts/UserContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

interface UserContextType {
    currentUser: FirebaseAuthTypes.User | null;
    loadingAuth: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const subscriber = auth().onAuthStateChanged(user => {
            setCurrentUser(user);
            setLoadingAuth(false);
        });
        return subscriber; // unsubscribe on unmount
    }, []);

    return (
        <UserContext.Provider value={{ currentUser, loadingAuth }}>
            {children}
        </UserContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a UserProvider');
    }
    return context;
};