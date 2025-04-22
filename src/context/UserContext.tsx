import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface User {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  age: number;
  scores: {
    technicalQuiz: number;
    towerOfHanoi: number;
    wordScramble: number;
  };
}

type GameType = keyof User['scores'];

interface UserContextType {
  user: User | null;
  setCurrentUser: (userId: string) => Promise<void>;
  updateUserScore: (game: GameType, score: number) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load the most recently registered user from localStorage on app start
  useEffect(() => {
    const lastUserId = localStorage.getItem('currentUserId');
    if (lastUserId) {
      setCurrentUser(lastUserId);
    }
  }, []);

  const setCurrentUser = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as Omit<User, 'id'>;
        setUser({ id: userId, ...userData });
        // Save the current user ID to localStorage
        localStorage.setItem('currentUserId', userId);
      }
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  };

  const updateUserScore = async (game: GameType, score: number) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.id);
      const newScores = { ...user.scores, [game]: score };
      
      await updateDoc(userRef, { scores: newScores });
      
      // Update the local user state
      setUser({
        ...user,
        scores: newScores
      });
    } catch (error) {
      console.error('Error updating user score:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setCurrentUser, updateUserScore }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 
 