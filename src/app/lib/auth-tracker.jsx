import Spinner from '@/app/components/principal/spinner'
import { createContext, useState, useEffect } from 'react';
import { userPool } from '@/app/lib/cognito-manager';
import { getStorageValue, setStorageValue } from '@/app/lib/storage-values';
import { buildApiUrl } from '@/app/lib/refautomex-api';

export const AuthContext = createContext();

export const AuthChecker = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authStatusChecked, setAuthStatusChecked] = useState(false);
    const [userData, setUserData] = useState(null);
    const cognitoUserSession = getStorageValue('CognitoUserSession');
    const username = cognitoUserSession ? cognitoUserSession.idToken.payload["cognito:username"] : null;

    useEffect(() => {
        try {
            const cognitoUser = userPool.getCurrentUser();

            if (cognitoUser) {
                cognitoUser.getSession((err, session) => {
                    if (err) {
                        console.error(err);
                    } else {
                        setIsAuthenticated(true);
                    }
                    setAuthStatusChecked(true);
                });
            } else {
                setAuthStatusChecked(true);
            }
        } catch (error) {
            setAuthStatusChecked(true);
        }
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!username) return;

            let fetchedUserData = getStorageValue(`user_${username}`);
            if (!fetchedUserData) {
                try {
                    const params = new URLSearchParams({ id: username });
                    const endpoint = `${buildApiUrl('/getUser')}?${params.toString()}`;
                    const response = await fetch(endpoint, {
                        cache: 'no-store',
                        headers: { Accept: 'application/json, text/plain, */*' },
                    });

                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    fetchedUserData = data[0];
                    setStorageValue(`user_${username}`, fetchedUserData);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }

            setUserData(fetchedUserData);
        };

        fetchUserData();
    }, [username]);

    return (
        <AuthContext.Provider value={{ isAuthenticated, authStatusChecked, userData, setUserData }}>
            {authStatusChecked ? (
                children
            ) : (
                <div className="fixed inset-0 flex justify-center items-center h-screen bg-gradient-to-tl from-blue-200 via-slate-100 to-slate-50">
                    <Spinner />
                </div>
            )}
        </AuthContext.Provider>
    );
};
