import {
    createUserWithEmailAndPassword,
    deleteUser,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    onAuthStateChanged
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
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
    let user = null;

    try {
        // Verificar si el DUI ya está registrado via Cloud Function (Admin SDK, sin restricciones de rules)
        if (userData.dui) {
            const functions = getFunctions();
            const checkDui = httpsCallable(functions, 'checkDuiAvailability');
            const { data } = await checkDui({ dui: userData.dui });
            if (!data.available) {
                return {
                    user: null,
                    error: {
                        code: 'auth/dui-already-in-use',
                        message: 'Este DUI ya está registrado.'
                    }
                };
            }
        }

        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;

        // Save user profile to Firestore
        try {
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
        } catch (profileError) {
            console.error('Error saving user profile:', profileError);

            try {
                await deleteUser(user);
            } catch (cleanupError) {
                console.error('Error cleaning up auth user after profile failure:', cleanupError);
            }

            return { user: null, error: profileError };
        }

        // Enviar correo de verificación personalizado vía Cloud Function
        console.log('Sending custom verification email to:', user.email);
        try {
            const functions = getFunctions();
            const sendVerificationEmail = httpsCallable(functions, 'sendVerificationEmail');
            await sendVerificationEmail({
                email: user.email,
                displayName: `${userData.nombres || ''} ${userData.apellidos || ''}`.trim() || user.email,
            });
            console.log('Custom verification email sent successfully');
        } catch (verificationError) {
            // La cuenta/perfil ya fueron creados. No bloquear el registro por errores de envío.
            console.error('Custom verification email failed, but account was created:', verificationError);
        }

        return { user, error: null };
    } catch (error) {
        console.error('Sign up error:', error);

        // Fallback: if Auth + Firestore profile were created, do not block registration UI
        if (user) {
            try {
                const profileSnap = await getDoc(doc(db, 'users', user.uid));
                if (profileSnap.exists()) {
                    console.warn('Sign up completed but post-registration step failed:', error);
                    return { user, error: null };
                }
            } catch (fallbackError) {
                console.error('Error validating post-registration fallback:', fallbackError);
            }
        }

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

        // Fetch profile to check status
        const { profile } = await getUserProfile(user.uid);
        if (profile && profile.status === 'inactive') {
            await firebaseSignOut(auth);
            return {
                user: null,
                error: {
                    code: 'auth/account-inactive',
                    message: 'Tu cuenta ha sido desactivada. Por favor contacta al administrador.'
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
            return {
                profile: { uid: docSnap.id, ...docSnap.data() },
                error: null
            };
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
export const updateUserProfile = async (userId, updates, collectionName = 'users') => {
    try {
        const docRef = doc(db, collectionName, userId);
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
export const uploadProfilePhoto = async (userId, file, collectionName = 'users') => {
    try {
        // Convert image to Base64
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        // Update profile with Base64 photo
        await updateUserProfile(userId, { photoURL: base64 }, collectionName);

        return { photoURL: base64, error: null };
    } catch (error) {
        console.error('Upload profile photo error:', error);
        return { photoURL: null, error };
    }
};
