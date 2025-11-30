import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {object} userData - Additional user data to store in Firestore
 * @returns {Promise<{user, error}>}
 */
export const signUp = async (email, password, userData = {}) => {
    try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user profile to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: email,
            nombres: userData.nombres || '',
            apellidos: userData.apellidos || '',
            fechaNacimiento: userData.fechaNacimiento || null,
            dui: userData.dui || '',
            genero: userData.genero || '',
            direccion: userData.direccion || '',
            telefono: userData.telefono || '',
            emergenciaNombre: userData.emergenciaNombre || '',
            emergenciaTelefono: userData.emergenciaTelefono || '',
            emergenciaParentesco: userData.emergenciaParentesco || '',
            tipoPaciente: userData.tipoPaciente || 'primera-vez',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Send email verification
        console.log('Sending email verification to:', user.email);
        await sendEmailVerification(user);
        console.log('Email verification sent successfully');

        return { user, error: null };
    } catch (error) {
        console.error('Sign up error:', error);
        return { user: null, error };
    }
};

/**
 * Sign in an existing user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<{user, error}>}
 */
export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if email is verified
        if (!user.emailVerified) {
            // Sign out the user
            await firebaseSignOut(auth);
            return {
                user: null,
                error: {
                    code: 'auth/email-not-verified',
                    message: 'Por favor, verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
                }
            };
        }

        return { user: userCredential.user, error: null };
    } catch (error) {
        console.error('Sign in error:', error);
        return { user: null, error };
    }
};

/**
 * Sign out the current user
 * @returns {Promise<{error}>}
 */
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        return { error: null };
    } catch (error) {
        console.error('Sign out error:', error);
        return { error };
    }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise<{error}>}
 */
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (error) {
        console.error('Reset password error:', error);
        return { error };
    }
};

/**
 * Get user profile data from Firestore
 * @param {string} userId - User's ID
 * @returns {Promise<{profile, error}>}
 */
export const getUserProfile = async (userId) => {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { profile: docSnap.data(), error: null };
        } else {
            return { profile: null, error: new Error('Profile not found') };
        }
    } catch (error) {
        console.error('Get user profile error:', error);
        return { profile: null, error };
    }
};

/**
 * Update user profile data
 * @param {string} userId - User's ID
 * @param {object} updates - Profile data to update
 * @returns {Promise<{error}>}
 */
export const updateUserProfile = async (userId, updates) => {
    try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
        return { error: null };
    } catch (error) {
        console.error('Update user profile error:', error);
        return { error };
    }
};

/**
 * Listen to auth state changes
 * @param {function} callback - Callback function to handle auth state changes
 * @returns {function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

/**
 * Upload profile photo as Base64 to Firestore (no Storage needed)
 * @param {string} userId - User's ID
 * @param {File} file - Image file to upload
 * @returns {Promise<{photoURL, error}>}
 */
export const uploadProfilePhoto = async (userId, file) => {
    try {
        // Convert image to Base64
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        // Update user profile with Base64 photo
        await updateUserProfile(userId, { photoURL: base64 });

        return { photoURL: base64, error: null };
    } catch (error) {
        console.error('Upload profile photo error:', error);
        return { photoURL: null, error };
    }
};
